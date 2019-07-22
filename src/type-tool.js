// Copyright (c) 2019 Kasey Thomas. All rights reserved.
// Use of this source code is governed by the EULA.

'use strict';

/*
if ('Notification' in window) {
	alert("Congrats you are using a modern browser and it supports Notification");
}
*/

// the main image being edited
// var image = new Image();
// image.addEventListener("load", loadEditorImage, true);

var transformMouseCoords = true; // false means we use real screen points

/**
// Changes made
1. The transformations of the textCanvas has been moved to renderText
2. We take mouse coordinates in the image space.
*/

/*
1. Remember when we draw the new textbox in the type tool it is drawn with points mapped to in the image space.
2. To make it be draw correctly in the screen space we use globalImageRotateActiveSelection in updateToolCanvas to map it back to screen space.
3. if the canvas if flipped while creating the textbox we inverse flip
4. The same is for rotation also we do negative of the global transformation rotation.

*/

var testTypeBtn = document.getElementById("testTypeBtn");
testTypeBtn.onclick = function(){
	//alert("hello");
	// console.clear();
	// console.log("Selection range: " + editTextInput.selectionStart + "," + editTextInput.selectionEnd);
	// console.log(textCharStyles.length);
	//console.log(JSON.stringify(textCharStyles));
	
	/*
	for(var i = 0; i < textCharStyles.length; i++){
		console.log(i + ": " + JSON.stringify(textCharStyles[i]));
	}
	*/
	
	for(var i = 0; i < editStack.stack.length; i++){
		console.log(i);
		console.log(editStack.stack[i]);
	}
}

var resetTypeBtn = document.getElementById("resetTypeBtn");
var applyEditBtn = document.getElementById("applyEditBtn");

window.onbeforeunload = function() {
	
	/*
	if(editsMade){
		return "You are currently editing an image. Do you want to exit?";
		//if we return nothing here (just calling return;) then there will be no pop-up question at all
		//return;
	}
	*/
	
	if(document.getElementById("applyEditBtn")){
		//alert("there is an apply edit button");
		
		if(editsMade){
		
			// alert("edit made");
		
			applyHistory = false;
			document.getElementById("applyEditBtn").click();
		
		}

	}	
	
};

var editorText = "";
var textCanvas;
var textCtx;
var textCharStyles = [];


var lastdragPoint = {};
// textbox dragging 
var dragTextBox = false;
// edge resize handles
var dragTopResize = false;
var dragRightResize = false;
var dragBottomResize = false;
var dragLeftResize = false;
// corner resizee handles
var dragTopRightResize = false;
var dragBottomRightResize = false;
var dragBottomLeftResize = false;
var dragTopLeftResize = false;

var resizehandlewidth = 10;

var currentLayerTextObject; // If the current layer has a text object this layer holds it
var updateCurrentLayerTextObject = false;	// Indicates whether we are updating the current ayer text object
var newTextLayerFlag = false; // used in updateEditorCanvas to indicate that the current layer textobject should be drawn

var previewText = document.getElementById("previewText");
var editTextInput = document.getElementById("editTextInput");
var editTextInputDiv = document.getElementById("editTextInputDiv");
var editSelectionRange = {start: 0, end: 0};
var fontColorSelect = document.getElementById("fontColorSelect");
var fontFamilySelect = document.getElementById("fontFamilySelect");
var fontFamilyTxt = document.getElementById("fontFamilyTxt");
var fontSizeSelect = document.getElementById("fontSizeSelect");
var fontSizeTxt = document.getElementById("fontSizeTxt");
var fontWeightSelect = document.getElementById("fontWeightSelect");
var cursorPos = 0;
var t0; // for performance timing
var t1; // for performance timing

// set up zoom
if (localStorage.getItem("zoom") === null) {
	//alert("no stored zoom");
	globalZoom = 100;
	document.getElementById("canvasDiv").style.zoom = globalZoom + "%";

}else{
	// load the saved zoom
	//alert("we have zoom stored");
	var storedZoom = JSON.parse(localStorage.getItem("zoom"));
	//alert(JSON.stringify(storedZoom));
	globalZoom = storedZoom.zoom;
	document.getElementById("canvasDiv").style.zoom = globalZoom + "%";
	
	// The size of the transparency tile is 16x16 but if there is different zoom
	// from 100% then it will change too. We do not want the background transparent tile to
	// change size with the zoom so we anti-zoom the transparent tile with css backgroundSize 
	// property to compensate.
	var tileSize = 16;
	// compensate scale the background tile
	document.getElementById("canvasDiv").style.backgroundSize = (16 * 100/globalZoom) + "px " + (16 * 100/globalZoom) + "px";

}


window.addEventListener('scroll', function(e) {
	//last_known_scroll_position = window.scrollY;
	//infoLbl.innerText = window.scrollY;
	//infoLbl.innerText = window.pageYOffset;
	//infoLbl.innerText = document.documentElement.scrollTop || document.body.scrollTop;
});

var workspaceContainerDivRect;
var canvasDivRect;
var canvasOffsetLeft;
var canvasOffsetTop;
// end zoom variables and stuff

var infoLbl = document.getElementById("infoLbl");

// file loader
var fileinput = document.getElementById("fileinput");

var notSupportedDiv = document.getElementById("notSupportedDiv");
var supportMsgLbl = document.getElementById("supportMsgLbl");

var uploadImgDiv = document.getElementById("uploadImgDiv");
var editorDiv = document.getElementById("editorDiv");
var workspaceContainerDiv = document.getElementById("workspaceContainerDiv");
var workspaceDiv = document.getElementById("workspaceDiv");
//workspaceDiv.style.width = (window.innerWidth - 17) + "px";
/*
// moved to toolpagetemplate.js
var toolBoxWidth = (document.getElementById("toolbox").getBoundingClientRect()).width;
toolBoxWidth = 52;
var workspacePaddingTop = 25;
var workspacePaddingBottom = 80;
*/
workspaceDiv.style.paddingTop = workspacePaddingTop + "px";
workspaceDiv.style.paddingBottom = workspacePaddingBottom + "px";
var mouseOffsetLeft = 0, mouseOffsetTop = 0;

var editorCanvas = document.getElementById("editorCanvas");
var editorCtx = editorCanvas.getContext("2d");
// editorCanvas.style.cursor = "text";

// For translations
var canvasWidth = 0, canvasHeight = 0;
var cumulativeTranslations = {x:0, y:0};
var cumulativeNegatives = {x:0, y:0};

// forms the background to the editor canvas
var canvasDiv = document.getElementById("canvasDiv");

var toolDrawCanvas = document.getElementById("toolDrawCanvas");
var toolDrawCtx = toolDrawCanvas.getContext("2d");

var selectionCanvas = document.getElementById("selectionCanvas")
var selectionCtx = selectionCanvas.getContext("2d");

var selectionMarchingAntsInterval;
var pauseMarchingAnts = false;
var activeSelectionArea;
var polyLassoLineOffset = 0;
var invertSelection = false;
var selectionActive = false;

var selectingrect = false;
var squareSelectionRect = {x: 0, y:0, width: 0, height: 0};

// var applyEditBtn = document.getElementById("applyEditBtn");

var workspaceMouseX = 0; // used to hold coordinates with respect to the workspaceContainerDiv
var workspaceMouseY = 0; // used to hold coordinates with respect to the workspaceContainerDiv
var mouseX = 0;
var mouseY = 0;

var dragselection = false;
var lastdragPoint = {};

// check if all required modules are present (HTML5 Storage etc...)
initializeEditor();


// Events

// keyboard events
document.addEventListener("keydown", KeyCheck);
// document.addEventListener("keypress", KeyPress);

// file loader event
fileinput.addEventListener('input', function(){

	if(this.files.length > 0){
		// alert(this.files[0].name);
		loadFile(this.files[0]);	
	}

});

// Workspace mouse events

workspaceContainerDiv.addEventListener("dblclick", function(e){

	EditorUtils.setMouseCoordinates(e, workspaceContainerDiv, transformMouseCoords);

});

workspaceContainerDiv.addEventListener("click", function(e){

	EditorUtils.setMouseCoordinates(e, workspaceContainerDiv, transformMouseCoords);

});

workspaceContainerDiv.addEventListener("mousedown", function(e){

	EditorUtils.setMouseCoordinates(e, workspaceContainerDiv, transformMouseCoords);
	

	if(transformSelection){
	
		if(activeSelectionArea){
			// console.log("active selection");
			
			// check if mouse in active selection area
			if(EditorUtils.checkPointInActiveSelection(selectionCtx, mouseX, mouseY)){
				// we have to do the move
				dragselection = true;
				
				lastdragPoint.x = mouseX;
				lastdragPoint.y = mouseY;
				
			}
		}
	
	}else{
	
		//alert(mouseX + "," + mouseY);
		
		if(squareSelectionRect.width > 0 && squareSelectionRect.height > 0){
			
			/*
			===========================================
			If there is an active selection rect clicking
			will enable resizing, moving etc.
			===========================================
			*/
			
			checkTextboxResizeHandlePress(mouseX, mouseY, squareSelectionRect, resizehandlewidth);

		}else{
		
			if(currentLayerTextObject){
			
				console.log("Text Object in current Layer");
			
				//===============================
				// There is a Text object in the current layer
				//===============================
			
				//console.log(1);
				var rect = currentLayerTextObject.textbox;
				
				if(mouseX >= rect.x && mouseX <= (rect.x + rect.width) && mouseY >= rect.y && mouseY <= (rect.y + rect.height)){
					
					layerTextBoxClicked();
					
				}else{
				
					/*
					========================================
					The user has clicked a point OUTSIDE the bounding textbox 
					of the text that is in the current layer. We start drawing
					a textbox for a new Text Layer.
					=========================================
					*/
					
					if(squareSelectionRect.width == 0){
					
						newTextLayerFlag = true;
						console.log("New Text Layer");
					
						selectionActive = false;
						
						squareSelectionRect.x = mouseX;
						squareSelectionRect.y = mouseY;
						squareSelectionRect.width = 0;
						squareSelectionRect.height = 0;
						
						selectingrect = true;	
					}
					
				}
			}else{
			
				/*
				===============================
				There is NO Text object in the current layer
					The user has clicked a point OUTSIDE the bounding textbox 
					of the text that is in the current layer. We start drawing
					a textbox for a NEW Text Layer.
				===============================	
				*/
				console.log("No Text Object in current Layer");
				
				// once the selection rect is et we cant redraw unless we cancel the textbox
				if(squareSelectionRect.width == 0){
				
					newTextLayerFlag = true;
					console.log("New Text Layer");
				
					selectionActive = false;
					
					squareSelectionRect.x = mouseX;
					squareSelectionRect.y = mouseY;
					squareSelectionRect.width = 0;
					squareSelectionRect.height = 0;
					
					selectingrect = true;	
				}
				
			}
			
		}
	
	}
		
});

workspaceContainerDiv.addEventListener("mousemove", function(e){

	EditorUtils.setMouseCoordinates(e, workspaceContainerDiv, transformMouseCoords);
	
	//console.log(mouseX + "," + mouseY);

	if(activeSelectionArea && transformSelection){
		// console.log("active selection");
		
		// check if mouse in active selection area
		if(EditorUtils.checkPointInActiveSelection(selectionCtx, mouseX, mouseY)){
			workspaceContainerDiv.style.cursor = "move";
		}else{
			workspaceContainerDiv.style.cursor = "crosshair";
		}
		
	}else{
		//console.log("no active selection");	
	}	
	
	if(transformSelection){
	
		// TRANSFORM ANY ACTIVE SELECTION
		if(dragselection){
		
			// Drag the selection
			var dragX = parseInt(mouseX - lastdragPoint.x);
			var dragY = parseInt(mouseY - lastdragPoint.y);
			
			lastdragPoint.x = mouseX;
			lastdragPoint.y = mouseY;
			
			EditorUtils.moveActiveSelection(activeSelectionArea, dragX, dragY);
			
			// update the selection drawing canvas
			EditorUtils.drawSelectionClipping(selectionCtx, invertSelection,"green",activeSelectionArea, false);
		
			updateToolCanvas();	
		}			
	
	}else{
	
		// checks if a handle resize flag was set an updates the textbox dimensions based on that 
		// handle movement
		checkDraggingResize(mouseX, mouseY);
		
		// If there is a current layer text object
		if(currentLayerTextObject){
			//console.log(1);
			var rect = currentLayerTextObject.textbox;
			if(mouseX >= rect.x && mouseX <= (rect.x + rect.width) && mouseY >= rect.y && mouseY <= (rect.y + rect.height)){
				// If the mouse pointer is in the text bounding box
				
				// Below has been deprecated for a routine that calculates the angle between the current global rotation
				// and the text object rotation to show the cursor vertical hor horizontal 
				// workspaceContainerDiv.style.cursor = "text";
				
				/*
				console.log("text rotate:");
				console.log(currentLayerTextObject.transform.rotate);
				console.log("global rotate:");
				console.log(globalTransformObject.rotate);
				*/
				
				// Determine the angle between the current image rotation and the saved rotation in th current layer
				// textbox transform object. If its 90 degrees difference then we need to make the cursor vertical-text.
				//
				
				//console.log(globalTransformObject.rotate - currentLayerTextObject.transform.rotate);
				
				if(Math.abs(globalTransformObject.rotate - currentLayerTextObject.transform.rotate) == 90){
					workspaceContainerDiv.style.cursor = "vertical-text";
				}else{
					workspaceContainerDiv.style.cursor = "text";
				}
				
			}else{
				// If the mouse pointer is outside the text bounding box
				workspaceContainerDiv.style.cursor = "default";
			}
		}
		
		// Sets the cursor based on the resize handle the pointer is currently hovering over
		// I we are not drawing a box and the box is defined
		if(!selectingrect && squareSelectionRect.width > 0 && squareSelectionRect.height > 0){ // prevents resize cursors from showing while drawing textbox
			setTextBoxResizeHandleCursor(mouseX, mouseY, squareSelectionRect, resizehandlewidth);	
		}
		
		// RECTANGULAR SELECTION - updates the width and height of the rectangular selection with the mouse move
		if(selectingrect){
			/*
			if(mouseX < 0){
				mouseX = 0;
			}
			if(mouseY < 0){
				mouseY = 0;
			}
			if(mouseX > editorCanvas.width){
				mouseX = editorCanvas.width;
			}
			if(mouseY > editorCanvas.height){
				mouseY = editorCanvas.height;
			}
			*/
		
			squareSelectionRect.width = mouseX - squareSelectionRect.x;
			squareSelectionRect.height = mouseY - squareSelectionRect.y;		
			updateToolCanvas();	
		}
	
	}	
	
});

workspaceContainerDiv.addEventListener("mouseup", function(e){

	EditorUtils.setMouseCoordinates(e, workspaceContainerDiv, transformMouseCoords);
	

	if(transformSelection){

		if(dragselection){
			EditorUtils.addMoveActiveSelectionEntry(activeSelectionArea);
			dragselection = false;
		}
	
	}else{

		resetAllTextBoxTransformFlags();
		
		/*
		// I selection box is completely to the left of the image
		if(squareSelectionRect.x < 0 && (squareSelectionRect.x + squareSelectionRect.width) <= 0){
			// alert("completely to left");
			squareSelectionRect = {x: 0, y:0, width: 0, height: 0};
			updateToolCanvas();
			return;
		}
		
		// Check if selection box is completely outside at top of image
		if(squareSelectionRect.y < 0 && (squareSelectionRect.y + squareSelectionRect.height) <= 0){
			// alert("completely at top");
			squareSelectionRect = {x: 0, y:0, width: 0, height: 0};
			updateToolCanvas();
			return;
		}
		
		// If selection box is completely to the right of the image
		if(squareSelectionRect.x > editorCanvas.width && (squareSelectionRect.x + squareSelectionRect.width) > editorCanvas.width){
			//alert("completely to right");
			squareSelectionRect = {x: 0, y:0, width: 0, height: 0};
			updateToolCanvas();
			return;
		}
		
		// If selection box is completely below image
		if(squareSelectionRect.y > editorCanvas.height && (squareSelectionRect.y + squareSelectionRect.height) > editorCanvas.height){
			//alert("completely below");
			squareSelectionRect = {x: 0, y:0, width: 0, height: 0};
			updateToolCanvas();
			return;
		}
		
		// Negative x 
		if(squareSelectionRect.x < 0){
			squareSelectionRect.width += squareSelectionRect.x;
			squareSelectionRect.x = 0;
		}
		// Negative y
		if(squareSelectionRect.y < 0){
			squareSelectionRect.height += squareSelectionRect.y;
			squareSelectionRect.y = 0;
		}
		

		// If the selection box projects over the right edge of the canvas
		if(squareSelectionRect.width > 0){
		
			if((squareSelectionRect.x + squareSelectionRect.width) > editorCanvas.width){
				// alert("box goes out the bounds of image to right");
				squareSelectionRect.width -= ((squareSelectionRect.x + squareSelectionRect.width) - editorCanvas.width);
			}
		
		}else{
			if(squareSelectionRect.x > editorCanvas.width){
				// alert("box goes out the bounds of image to right");
				squareSelectionRect.x = squareSelectionRect.x + squareSelectionRect.width;
				squareSelectionRect.width = editorCanvas.width - squareSelectionRect.x;
			}				
		}
		
		// If the selection box projects over the top of the canvas
		if(squareSelectionRect.height > 0){
		
			if((squareSelectionRect.y + squareSelectionRect.height) > editorCanvas.height){
				// alert("box goes out the bounds of image to right");
				squareSelectionRect.height -= ((squareSelectionRect.y + squareSelectionRect.height) - editorCanvas.height);
			}
		
		}else{
			if(squareSelectionRect.y > editorCanvas.height){
				// alert("box goes out the bounds of image to right");
				squareSelectionRect.y = squareSelectionRect.y + squareSelectionRect.height; // remember squareSelectionRect.height is negative
				squareSelectionRect.height = editorCanvas.height - squareSelectionRect.y;
			}				
		}		

		// rectangular marquee drawn from inside box to outside left of canvas
		if(squareSelectionRect.x > 0 && (squareSelectionRect.x + squareSelectionRect.width) < 0){
			squareSelectionRect.width = squareSelectionRect.x ;
			squareSelectionRect.x = 0;
		}
		
		// rectangular marquee drawn from inside box to outside top of canvas
		if(squareSelectionRect.y > 0 && (squareSelectionRect.y + squareSelectionRect.height) < 0){
			squareSelectionRect.height = squareSelectionRect.y ;
			squareSelectionRect.y = 0;
		}	
		
		*/
		
		//applyEditBtn.disabled = false;
		
		// Change negative dimensions to positive	
		if(squareSelectionRect.width < 0){
			// move the x position back the width of the rectangle
			squareSelectionRect.x += squareSelectionRect.width;
			// make the width positive
			squareSelectionRect.width = Math.abs(squareSelectionRect.width);
		}
		if(squareSelectionRect.height < 0){
			// move the x position back the width of the rectangle
			squareSelectionRect.y += squareSelectionRect.height;
			// make the width positive
			squareSelectionRect.height = Math.abs(squareSelectionRect.height);
		}	

		//alert(mouseX + "," + mouseY);
		if(selectingrect){
		
			if(squareSelectionRect.width < 50){
				squareSelectionRect.width = 50;	
			}
			
			if(squareSelectionRect.height < 22){
				squareSelectionRect.height = 22;	
			}
		
			selectingrect = false;
			selectionActive = true;
			
			editTextInputDiv.style.display = "block";
			editTextInput.focus();
			
			// to draw the text writing square
			updateToolCanvas();
			
			textCanvas = document.createElement("canvas");
			textCanvas.width = squareSelectionRect.width;
			textCanvas.height = squareSelectionRect.height;
			textCtx = textCanvas.getContext("2d");	
			
			resetTypeBtn.style.display = "inline";
			applyEditBtn.style.display = "inline";
		}
	}
	
});

function resetTypeTool(){

	editsMade = false;

	location.reload();

	/*
	squareSelectionRect = {x: 0, y:0, width: 0, height: 0};
	selectionActive = false;
	
	// clear the textCanvas
	textCtx.clearRect(0,0,textCanvas.width, textCanvas.height);
	
	// hide the textarea editor
	editTextInput.value = "";
	editTextInputDiv.style.display = "none";
	
	updateToolCanvas();
	updateEditorCanvas();
	
	resetTypeBtn.style.display = "none";
	applyEditBtn.style.display = "none";
	
	workspaceContainerDiv.style.cursor = "default";
	*/
}

resetTypeBtn.addEventListener("click", function(e){
	resetTypeTool();
});

applyEditBtn.addEventListener("click", function(e){

	//alert("clicked");

	editsMade = false;
	
	newTextLayerFlag = false; // close the flag that says we are editing a new layer text

	// If the current layer is a text object layer
	if(updateCurrentLayerTextObject){
		// Update the text in the layer
		//alert("update");
		
		updateCurrentLayerTextObject = false;
		
		/*
			Template from editengine
			var textObject = new Object;
			textObject.type = "text_object";
			textObject.string = editStack.stack[x].string;
			textObject.char_styles = editStack.stack[x].char_styles;
			textObject.textbox = editStack.stack[x].textbox;
		*/
		
		var updateTextObject = new Object;
		updateTextObject.type = "text_object";
		updateTextObject.string = editTextInput.value;
		//updateTextObject.char_styles = textCharStyles.slice();
		// https://www.samanthaming.com/tidbits/35-es6-way-to-clone-an-array
		//updateTextObject.char_styles = [...textCharStyles];
		updateTextObject.char_styles = JSON.stringify([...textCharStyles]);
		//alert(JSON.stringify(updateTextObject.char_styles));
		
		var textBoxRect = new Object();
		textBoxRect.x = squareSelectionRect.x;
		textBoxRect.y = squareSelectionRect.y;
		textBoxRect.width = squareSelectionRect.width;
		textBoxRect.height = squareSelectionRect.height;
		
		var textTransformObject = new Object();
		/*
		textTransformObject.scaleX = globalTransformObject.flip_scaleX;
		textTransformObject.scaleY = globalTransformObject.flip_scaleY;
		textTransformObject.rotate = globalTransformObject.rotate;
		*/		
		textTransformObject.scaleX = currentLayerTextObject.flip_scaleX;
		textTransformObject.scaleY = currentLayerTextObject.flip_scaleY;
		textTransformObject.rotate = currentLayerTextObject.rotate;
		
		
		//updateTextObject.textbox = squareSelectionRect; // don't use squareSelectionRect
		updateTextObject.textbox = textBoxRect;
		
		//layerStack[layerIndex].object = updateTextObject;
		var updateTextEditEntry = new Object();
		updateTextEditEntry.edit = "update_text_layer";
		updateTextEditEntry.edit_label = "Type Tool";
		updateTextEditEntry.layer = layerIndex;
		updateTextEditEntry.updated_text_object = updateTextObject;
		//alert(JSON.stringify(textTransformObject));
		updateTextEditEntry.transform = textTransformObject;
		
		// add update text edit to the stack
		editStack.add(updateTextEditEntry);
		
	}else{
		// Add a new text layer
		//alert("new");	

		var textBoxRect = new Object();
		textBoxRect.x = squareSelectionRect.x;
		textBoxRect.y = squareSelectionRect.y;
		textBoxRect.width = squareSelectionRect.width;
		textBoxRect.height = squareSelectionRect.height;		
		
		/*
		let textEditEntry = {
			edit: "add_text_layer", 
			edit_label: "Type Tool",
			string: editTextInput.value,
			char_styles: textCharStyles,
			textbox: textBoxRect
		};
		*/
		
		// add transform object to text object to take into consideration the transform applied
		// to the image when text was added
		var textTransformObject = new Object();
		textTransformObject.scaleX = globalTransformObject.flip_scaleX;
		textTransformObject.scaleY = globalTransformObject.flip_scaleY;
		textTransformObject.rotate = globalTransformObject.rotate;
		
		// Store Layer Index - the layer will move down in the stack so we have to store a decremented layer index
		EditorUtils.storeLayerIndex(parseInt(layerIndex) + 1);
		
		var textEditEntry = new Object();
		textEditEntry.edit = "add_text_layer";
		textEditEntry.edit_label = "Type Tool";
		textEditEntry.string = editTextInput.value;
		//textEditEntry.char_styles = textCharStyles.slice();
		//textEditEntry.char_styles = [...textCharStyles];
		textEditEntry.char_styles = JSON.stringify([...textCharStyles]);
		//alert(JSON.stringify(textEditEntry.char_styles));
		textEditEntry.textbox = textBoxRect;
		textEditEntry.transform = textTransformObject;
		
		// add new text edit to the stack
		editStack.add(textEditEntry);		
	}
		
	resetTypeTool();

	if(applyHistory){
		// for now it seems that we have to reload the page instead of applyEditHistory() to reset all 
		// variables because if we do consecutive edits of new text layers, the styles applied to the last
		// seem to affect the previous.
		//applyEditHistory();
		location.reload();
	}else{
		// for now it seems that we have to reload the page instead of applyEditHistory() to reset all 
		// variables because if we do consecutive edits of new text layers, the styles applied to the last
		// seem to affect the previous.	
		//applyHistory = true;
		location.reload();
	}
	
	resetTypeBtn.style.display = "none";
	applyEditBtn.style.display = "none";
	
});

fontColorSelect.onchange = function(){

	/*
	======================================================
	Test if there is a selection range in editInputText through editSelectionRange.start, editSelectionRange.start.
	If they are not the same then then there was a selection. We apply the color change to the selected range of characters
	=======================================================
	*/
	if(editSelectionRange && (editSelectionRange.start != editSelectionRange.end)){
	
		//console.log("change the color style for characters " + editSelectionRange.start + " - " + editSelectionRange.end + " to " + this.value);
		
		// loop through the character styling array and apply the changed style to the selected range of chracters
		for(var i = editSelectionRange.start; i < editSelectionRange.end; i++){
			textCharStyles[i]["color"] = this.value;
		}
		
		// refocus the textbox
		editTextInput.focus();
		setTimeout(function(){ 
			if(editSelectionRange && (editSelectionRange.start != editSelectionRange.end)){
				editTextInput.setSelectionRange(editSelectionRange.start, editSelectionRange.end);
			}	
		}, 250);
	}
	
	renderText();
}

fontFamilySelect.onchange = function(){

	fontFamilyTxt.value = this.value;
	
	/*
	======================================================
	Test if there is a selection range in editInputText through editSelectionRange.start, editSelectionRange.start.
	If they are not the same then then there was a selection. We apply the color change to the selected range of characters
	=======================================================
	*/
	if(editSelectionRange && (editSelectionRange.start != editSelectionRange.end)){
	
		//console.log("change the color style for characters " + editSelectionRange.start + " - " + editSelectionRange.end + " to " + this.value);
		
		// loop through the character styling array and apply the changed style to the selected range of chracters
		for(var i = editSelectionRange.start; i < editSelectionRange.end; i++){
			textCharStyles[i]["font-family"] = fontFamilyTxt.value;
		}
		
		// refocus the textbox
		editTextInput.focus();
		setTimeout(function(){ 
			if(editSelectionRange && (editSelectionRange.start != editSelectionRange.end)){
				editTextInput.setSelectionRange(editSelectionRange.start, editSelectionRange.end);
			}	
		}, 250);
	}
	
	renderText();	

}

fontFamilyTxt.onchange = function(){

	/*
	======================================================
	Test if there is a selection range in editInputText through editSelectionRange.start, editSelectionRange.start.
	If they are not the same then then there was a selection. We apply the color change to the selected range of characters
	=======================================================
	*/
	if(editSelectionRange && (editSelectionRange.start != editSelectionRange.end)){
	
		//console.log("change the color style for characters " + editSelectionRange.start + " - " + editSelectionRange.end + " to " + this.value);
		
		// loop through the character styling array and apply the changed style to the selected range of chracters
		for(var i = editSelectionRange.start; i < editSelectionRange.end; i++){
			textCharStyles[i]["font-family"] = fontFamilyTxt.value;
		}
		
		// refocus the textbox
		editTextInput.focus();
		setTimeout(function(){ 
			if(editSelectionRange && (editSelectionRange.start != editSelectionRange.end)){
				editTextInput.setSelectionRange(editSelectionRange.start, editSelectionRange.end);
			}	
		}, 250);
	}
	
	renderText();	

}

fontSizeSelect.onchange = function(){
	fontSizeTxt.value = this.value;
	
	/*
	======================================================
	Test if there is a selection range in editInputText through editSelectionRange.start, editSelectionRange.start.
	If they are not the same then then there was a selection. We apply the color change to the selected range of characters
	=======================================================
	*/
	if(editSelectionRange && (editSelectionRange.start != editSelectionRange.end)){
	
		//console.log("change the color style for characters " + editSelectionRange.start + " - " + editSelectionRange.end + " to " + this.value);
		
		// loop through the character styling array and apply the changed style to the selected range of chracters
		for(var i = editSelectionRange.start; i < editSelectionRange.end; i++){
			textCharStyles[i]["size"] = fontSizeTxt.value;
		}
		
		// refocus the textbox
		editTextInput.focus();
		setTimeout(function(){ 
			if(editSelectionRange && (editSelectionRange.start != editSelectionRange.end)){
				editTextInput.setSelectionRange(editSelectionRange.start, editSelectionRange.end);
			}	
		}, 250);
	}
	
	renderText();

}

fontSizeTxt.onchange = function(){

	/*
	======================================================
	Test if there is a selection range in editInputText through editSelectionRange.start, editSelectionRange.start.
	If they are not the same then then there was a selection. We apply the color change to the selected range of characters
	=======================================================
	*/
	if(editSelectionRange && (editSelectionRange.start != editSelectionRange.end)){
	
		//console.log("change the color style for characters " + editSelectionRange.start + " - " + editSelectionRange.end + " to " + this.value);
		
		// loop through the character styling array and apply the changed style to the selected range of chracters
		for(var i = editSelectionRange.start; i < editSelectionRange.end; i++){
			textCharStyles[i]["size"] = fontSizeTxt.value;
		}
		
		// refocus the textbox
		editTextInput.focus();
		setTimeout(function(){ 
			if(editSelectionRange && (editSelectionRange.start != editSelectionRange.end)){
				editTextInput.setSelectionRange(editSelectionRange.start, editSelectionRange.end);
			}	
		}, 250);
	}
	
	renderText();
	
}

fontWeightSelect.onchange = function(){
	/*
	======================================================
	Test if there is a selection range in editInputText through editSelectionRange.start, editSelectionRange.start.
	If they are not the same then then there was a selection. We apply the color change to the selected range of characters
	=======================================================
	*/
	if(editSelectionRange && (editSelectionRange.start != editSelectionRange.end)){
	
		//console.log("change the color style for characters " + editSelectionRange.start + " - " + editSelectionRange.end + " to " + this.value);
		
		// loop through the character styling array and apply the changed style to the selected range of chracters
		for(var i = editSelectionRange.start; i < editSelectionRange.end; i++){
			textCharStyles[i]["font-weight"] = fontWeightSelect.value;
		}
		
		// refocus the textbox
		editTextInput.focus();
		setTimeout(function(){ 
			if(editSelectionRange && (editSelectionRange.start != editSelectionRange.end)){
				editTextInput.setSelectionRange(editSelectionRange.start, editSelectionRange.end);
			}	
		}, 250);
	}
	
	renderText();
}

function layerTextBoxClicked(){

	/*
	========================================
	The user has clicked a point INSIDE the bounding textbox 
	of the text that is in the current layer
	=========================================
	*/
	
	updateCurrentLayerTextObject = true;
	
	textCharStyles = currentLayerTextObject.char_styles;
	squareSelectionRect = currentLayerTextObject.textbox;
	editTextInput.value = currentLayerTextObject.string;
	
	selectionActive = true;
	
	editTextInputDiv.style.display = "block";
	editTextInput.focus();
	
	// to draw the text writing square
	updateToolCanvas();
	
	textCanvas = document.createElement("canvas");
	textCanvas.width = squareSelectionRect.width;
	textCanvas.height = squareSelectionRect.height;
	textCtx = textCanvas.getContext("2d");	

	// Show the update buttons
	resetTypeBtn.style.display = "inline";
	applyEditBtn.style.display = "inline";
	applyEditBtn.value = "Update";
	
	setTimeout(function(){ 
		editTextInput.focus();
	}, 300);

}

previewText.addEventListener("click", function(){
	layerTextBoxClicked();
});

editTextInput.addEventListener("focus", function(event) {
	//console.log(this.selectionStart);
	// console.log("editor focus");
	
	/*
	setTimeout(function(){ 
		if(editSelectionRange && (editSelectionRange.start != editSelectionRange.end)){
			editTextInput.setSelectionRange(editSelectionRange.start, editSelectionRange.end);
		}	
	}, 250);
	*/

});

editTextInput.addEventListener("blur", function(event) {
	console.log(this.selectionStart + "-" + this.selectionEnd);
	editSelectionRange = {start: this.selectionStart, end: this.selectionEnd};
});

/*
	Text Input Keydown
	Nb In the keydown event we add the style to the character style array. This was attempted in the keyup event
	but it seems update of the character index (editTextInput.selectionStart) was not 
	immediate in the keyup event. More importantly, the keyup event seemed to be delayed 
	for repeating events.
*/
editTextInput.addEventListener('keydown', function(event) {
	cursorPos = editTextInput.selectionStart;
	//console.log("cursor: " + editTextInput.selectionStart);
	saveCurrentTextStyle(cursorPos, event.keyCode);
});

editTextInput.addEventListener('keyup', function(event) {
	// previewText.value = this.value;
	var keycode = event.keyCode;
	if(keycode == 37 || keycode == 38 || keycode == 39 || keycode == 40){
		// Any direction key sets the charindex and the style should be updated
		//console.log(editTextInput.selectionStart);
		//console.log(JSON.stringify(textCharStyles.length));	
		
		var charindex = editTextInput.selectionStart;
		
		fontFamilyTxt.value = textCharStyles[charindex - 1]["font-family"];
		fontColorSelect.value = textCharStyles[charindex - 1]["color"];
		fontSizeTxt.value = textCharStyles[charindex - 1]["size"];
		fontWeightSelect.value = textCharStyles[charindex - 1]["font-weight"];
		italicCheckbox.checked = textCharStyles[charindex - 1]["italic"];
		
	}
	
	/*
	// moved to renderText()
	if(this.value != ""){
		editsMade = true;
	}
	*/
	
	renderText();
});

// determines if the character is a printable character or backspace or delete
// https://stackoverflow.com/questions/12467240/determine-if-javascript-e-keycode-is-a-printable-non-control-character
function isPrintableChar(keycode){
    var valid = 
        (keycode > 47 && keycode < 58)   || // number keys
        keycode == 32 || keycode == 13   || // spacebar & return key(s) (if you want to allow carriage returns)
        keycode == 8 || keycode == 46    || // (MY ADDITION) 'Backspace' or 'Delete' keys
        (keycode > 64 && keycode < 91)   || // letter keys
        (keycode > 95 && keycode < 112)  || // numpad keys
        (keycode > 185 && keycode < 193) || // ;=,-./` (in order)
        (keycode > 218 && keycode < 223);   // [\]' (in order)
    return valid;
}

// Creates an array of styles for each character in the textbox string
function saveCurrentTextStyle(charindex, keycode){

	//console.log(keycode);

	// We only continue if we have typing key entry
	// i.e. a character key, a backspace or delete
	if(isPrintableChar(keycode)){
		// continue	
	}else{
		return;
	}
	
	if(keycode == 8){
		// 'Backspace'
		// So get rid of character style for 'previous' character(s)
		
		
		if(editTextInput.selectionStart == editTextInput.selectionEnd){
		
			// BACKSPACE ON SINGLE CHARACTER
		
			if((charindex - 1) >= 0){

				/*
				charStyle["font-family"] = fontFamilyTxt.value;
				charStyle["color"] = fontColorSelect.value;
				charStyle["size"] = fontSizeTxt.value;
				charStyle["font-weight"] = fontWeightSelect.value;
				charStyle["italic"] = italicCheckbox.checked;
				*/
				
				fontFamilyTxt.value = textCharStyles[charindex - 1]["font-family"];
				fontColorSelect.value = textCharStyles[charindex - 1]["color"];
				fontSizeTxt.value = textCharStyles[charindex - 1]["size"];
				fontWeightSelect.value = textCharStyles[charindex - 1]["font-weight"];
				italicCheckbox.checked = textCharStyles[charindex - 1]["italic"];
				
				// splice the character style array to remove the style for the character
				textCharStyles.splice(charindex - 1, 1);

				//console.log(textCharStyles.length + "," + charindex);
				//console.log(JSON.stringify(textCharStyles));			
			}
		}else{
		
			// BACKSPACE ON SELECTED RANGE OF CHARACTERS
		
			//console.log(editTextInput.selectionStart + "," + (editTextInput.selectionEnd - editTextInput.selectionStart - 1));
			textCharStyles.splice(editTextInput.selectionStart, editTextInput.selectionEnd - editTextInput.selectionStart);
			//console.log(JSON.stringify(textCharStyles));
		}
	}else if(keycode == 46){
		// 'Delete'
		// Delete the character style for the 'next' character
		if(editTextInput.selectionStart == editTextInput.selectionEnd){
		
			// DELETE ON SINGLE CHARACTER
			textCharStyles.splice(charindex, 1);
			
		}else{
		
			// DELETE ON SELECTED RANGE OF CHARACTERS
			//console.log(editTextInput.selectionStart + "," + (editTextInput.selectionEnd - editTextInput.selectionStart - 1));
			textCharStyles.splice(editTextInput.selectionStart, editTextInput.selectionEnd - editTextInput.selectionStart);
			console.log(JSON.stringify(textCharStyles));
		
		}
	}else{

		// Must be another printable character
		// So just insert at charindex
		
		var charStyle = new Object();
		
		charStyle["index"] = charindex; // not really used as we match the actual array index with the character at all times
		charStyle["font-family"] = fontFamilyTxt.value;
		charStyle["color"] = fontColorSelect.value;
		charStyle["size"] = fontSizeTxt.value;
		charStyle["font-weight"] = fontWeightSelect.value;
		charStyle["italic"] = italicCheckbox.checked;
			
		textCharStyles.splice(charindex, 0, charStyle);
		//textCharStyles.push(charStyle);
		// console.log(textCharStyles.length);
	}
	
}

function renderText(){

	editsMade = true;
	
	if(typeof currentLayerTextObject === 'undefined'){
		// If a New Text Object and not an edit of already existing use globalTransformObject
		textEngine.renderText(textCtx, editTextInput.value, textCharStyles, squareSelectionRect, globalTransformObject);
	}else{
		textEngine.renderText(textCtx, editTextInput.value, textCharStyles, squareSelectionRect, currentLayerTextObject.transform);
	}
		
	updateEditorCanvas();
}

// https://stackoverflow.com/questions/1348178/a-better-way-to-splice-an-array-into-an-array-in-javascript
function insertArrayAt(array, index, arrayToInsert) {
    Array.prototype.splice.apply(array, [index, 0].concat(arrayToInsert));
}

function renderedTextSize(string, font, fontSize) {
  var paper = Raphael(0, 0, squareSelectionRect.width, squareSelectionRect.height);
  paper.canvas.style.visibility = 'hidden';

  var el = paper.text(0, 0, string);
  el.attr('font-family', font);
  el.attr('font-size', fontSize);

  var bBox = el.getBBox();
  paper.remove();

  return {
    width: bBox.width,
    height: bBox.height
  };
}

function startMarchingAnts(){
	
	// Start the marching ants for the selection
	selectionActive = true;
	clearInterval(selectionMarchingAntsInterval);	
	selectionMarchingAntsInterval = setInterval(function(){ 
		if(!pauseMarchingAnts){
			polyLassoLineOffset++; 	// increases lineDashOffset for line drawing
			//hatchTick(); 			// increases offset for magic wand selection 
			updateToolCanvas();
		}
	}, 250);
	
}

/** loadFile()
  * 1. 	Loadings the uploaded image as a dataURL
  * 2. 	Sets the dimensions of editorCanvas to the image variable and draws the image variable 
  * 	to editorCanvas and set
  *
  * @param {Object} file
  * @return nothing
  *
  */
function loadFile(file){

	//fileSizeLbl.innerText = bytesToSize(file.size, " ");
		
    let reader = new FileReader();
    reader.onload = function(){
	
		let dataURL = reader.result;
		// alert(dataURL);
		
		var loadImage = new Image();
		loadImage.onload = function(){
		
			//alert(loadImage.width + "," + loadImage.height);
		
			// set the editor image and file name to local storage
			// localStorage.setItem("editor_image", dataURL); // this will be moved to asset library storage
			localStorage.setItem("image_filename", file.name);
			localStorage.setItem("canvas_width", loadImage.width);
			localStorage.setItem("canvas_height", loadImage.height);
			
			// add the image as an asset to the asset library
			// assetManager.add() (id, type, data)
			
			var asset_id = Date.now();
			
			assetManager.add(asset_id, "image_data_url", dataURL);
			
			// set the first edit entry to load the image from the asset library using its id
			/*
			var loadImageEditEntry = {};
			loadImageEditEntry["edit"] = "load_image_asset";
			loadImageEditEntry["asset_id"] = asset_id;
			*/
			
			var loadImageEditEntry = new Object();
			loadImageEditEntry.edit = "load_image_asset";
			loadImageEditEntry.asset_id = asset_id;
	
			// add to the crop edit stack
			editStack.add(loadImageEditEntry);			
			
			// start indicates the point beyond which undo actions won't go
			editStack.start();
			
			applyEditHistory();	
			
		};
		loadImage.src = dataURL;
		


    };
    reader.readAsDataURL(file);
}

// Checks if HTML5 is supported
function initializeEditor(){
	if (typeof(Storage) !== "undefined") {
		// Code for localStorage/sessionStorage.
		
		if (localStorage.getItem("edit_stack") === null) {
		
			uploadImgDiv.style.display = "block";
			
		}else{

			/*
			// check if the edit stack exits and initialize if not
			if (localStorage.getItem("edit_stack") === null) {
				editStack.start();
			}
			*/

			// load the edit stack
			editStack.load();
			
			applyEditHistory();
		}

	} else {
	
		// Sorry! No Web Storage support..
		notSupportedDiv.style.display = "block";
		supportMsgLbl.innerText = "Your browser doesn't support Web Storage.";
		
	}
}

function loadEditorImage(){

	// set the editor canvas to the image width
	editorCanvas.width = canvasWidth;
	editorCanvas.height = canvasHeight;
	
	// draw the active selection	
	selectionCanvas.width = editorCanvas.width;
	selectionCanvas.height = editorCanvas.height;
	EditorUtils.drawSelectionClipping(selectionCtx, invertSelection,"green",activeSelectionArea, false);
	
	// Get the current layer text object if present in the layer and the layer is visible.
	// If the layer is not visible we ignore because we don't want to edit.
	if(layerStack[layerIndex].visible){
		if('object' in layerStack[layerIndex]){
			if(layerStack[layerIndex].object.type == "text_object"){
				//alert("Text current Layer: " + layerIndex);
				// Store the current layer object
				currentLayerTextObject = layerStack[layerIndex].object;
				//console.log(currentLayerTextObject);
				
				// set the options bar textbox to the layer text
				previewText.value = layerStack[layerIndex].object.string;		
			}			
		}else{
			currentLayerTextObject = undefined;
		}		
	}
	
	//============================================
	// Draw all the layers to the editor canvas
	layerRenderEngine.renderAllLayers(editorCtx);
	//============================================
	
	// set the editor canvas background div
	//canvasDiv.style.width = canvasWidth + "px"; 
	//canvasDiv.style.height = canvasHeight + "px"; 
	// two above give trouble
	canvasDiv.style.width = editorCanvas.width + "px"; 
	canvasDiv.style.height = editorCanvas.height + "px"; 
	
	// show the workspace with the editor canvas
	//workspaceDiv.style.display = "block";
	editorDiv.style.display = "block";
	uploadImgDiv.style.display = "none";
	
	// set the dimensions of the tool drawing canvas
	// to the dimensions of the workspace div
	let workspaceRect = workspaceDiv.getBoundingClientRect();
	toolDrawCanvas.width = workspaceRect.width;
	toolDrawCanvas.height = workspaceRect.height;
	/*
	toolDrawCtx.fillText("Hello World!", 10, 10);
	toolDrawCtx.fillStyle = "rgba(255, 0, 0, .1)";
	toolDrawCtx.fillRect(0, 0, toolDrawCanvas.width, toolDrawCanvas.height);
	*/
	
	// Set initial mouseOffsetLeft and mouseOffsetTop
	workspaceContainerDivRect = workspaceContainerDiv.getBoundingClientRect();
	canvasDivRect = canvasDiv.getBoundingClientRect();
	
	//alert(canvasDivRect.top + "," + workspaceContainerDivRect.top);

	// get the offset of the canvas from the workspace container in canvasOffsetLef
	canvasOffsetLeft = (workspaceContainerDivRect.width - canvasDivRect.width*(globalZoom/100))/2;
	canvasOffsetTop = ((canvasDivRect.top - workspaceContainerDivRect.top) - window.pageYOffset)*(globalZoom/100);
	
	//alert(canvasDivRect.top + "," + workspaceContainerDivRect.top + "," + window.pageYOffset);
	//alert(canvasOffsetTop);
	
	//canvasOffsetTop = 104;
	canvasOffsetTop = workspacePaddingTop;
	
	//alert(Math.ceil(canvasDivRect.x - workspaceContainerDivRect.x) + "," + Math.ceil(canvasDivRect.y - workspaceContainerDivRect.y));
	// mouseOffsetLeft = Math.ceil(canvasDivRect.x - workspaceContainerDivRect.x);
	// mouseOffsetTop = Math.ceil(canvasDivRect.y - workspaceContainerDivRect.y);
	
}

function updateToolCanvas(){

	toolDrawCtx.clearRect(0, 0, toolDrawCtx.canvas.width, toolDrawCtx.canvas.height);
	toolDrawCtx.save();

	// Draw The Active Selection Area
	// This code has been moved from the end because the gradient drawing line was not been shown over the wand selection
	if(activeSelectionArea){
		EditorUtils.drawActiveSelection();
	}	
	

	if(!selectionActive){
	
		toolDrawCtx.save();
	
		if(Math.abs(squareSelectionRect.width) == 0 || Math.abs(squareSelectionRect.height) == 0){
		}else{
			toolDrawCtx.lineWidth = 1;
			
			// just to make sure we have no marching ants effect we don't put line offset
			// toolDrawCtx.lineDashOffset = polyLassoLineOffset;
			
			// Holds a copy of squareSelectionRect so that it can be globally transformed to screen space
			// We don't to change the actual squareSelectionRect
			var tempRect = new Object();
			tempRect.x = squareSelectionRect.x;
			tempRect.y = squareSelectionRect.y;
			tempRect.width = squareSelectionRect.width;
			tempRect.height = squareSelectionRect.height;

			// Apply global transformations to the tempRect
			EditorUtils.globalImageRotateActiveSelection(tempRect, "rectangle");

			// draw black dashed line over the white line to finish the selection box
			toolDrawCtx.strokeStyle = "#000000";
			toolDrawCtx.setLineDash([9,0]);
			//toolDrawCtx.strokeRect((tempRect.x + 0.5 + mouseOffsetLeft), (tempRect.y + 0.5 + mouseOffsetTop), (tempRect.width - 1), (tempRect.height - 1));
			toolDrawCtx.strokeRect((tempRect.x * (globalZoom/100) + 0.5 + canvasOffsetLeft), (tempRect.y * (globalZoom/100) + 0.5 + canvasOffsetTop), 
			(tempRect.width) * (globalZoom/100), (tempRect.height) * (globalZoom/100));			
			
			// draw solid white line
			
			toolDrawCtx.strokeStyle = "#ffffff";
			toolDrawCtx.setLineDash([5,4]);
			//toolDrawCtx.strokeRect((tempRect.x + 0.5 + mouseOffsetLeft), (tempRect.y + 0.5 + mouseOffsetTop), (tempRect.width - 1), (tempRect.height - 1));
			toolDrawCtx.strokeRect((tempRect.x * (globalZoom/100) + 0.5 + canvasOffsetLeft), (tempRect.y * (globalZoom/100) + 0.5 + canvasOffsetTop), 
			(tempRect.width) * (globalZoom/100), (tempRect.height) * (globalZoom/100));							
		}
		
		toolDrawCtx.restore();
		
	}else{
		toolDrawCtx.save();
		
		if(Math.abs(squareSelectionRect.width) == 0 || Math.abs(squareSelectionRect.height) == 0){
		}else{
			// draw the crop selection
			toolDrawCtx.lineWidth = 1;
			toolDrawCtx.strokeStyle = "rgba(255, 255, 255, .8)";
			
			toolDrawCtx.shadowColor = 'rgba(0, 0, 0, .8)';
			toolDrawCtx.shadowBlur = 1;
			
			// Holds a copy of squareSelectionRect so that it can be globally transformed to screen space
			// We don't to change the actual squareSelectionRect
			var tempRect = new Object();
			tempRect.x = squareSelectionRect.x;
			tempRect.y = squareSelectionRect.y;
			tempRect.width = squareSelectionRect.width;
			tempRect.height = squareSelectionRect.height;

			// Apply global transformations to the tempRect
			EditorUtils.globalImageRotateActiveSelection(tempRect, "rectangle");
			
			/*
			toolDrawCtx.strokeRect((squareSelectionRect.x + 0.5 + mouseOffsetLeft), (squareSelectionRect.y + 0.5 + mouseOffsetTop), (squareSelectionRect.width - 1), (squareSelectionRect.height - 1));
			toolDrawCtx.fillStyle = "rgba(255, 255, 255, .05)";
			toolDrawCtx.fillRect((squareSelectionRect.x + 0.5 + mouseOffsetLeft), (squareSelectionRect.y + 0.5 + mouseOffsetTop), (squareSelectionRect.width - 1), (squareSelectionRect.height - 1));
			*/
			
			toolDrawCtx.strokeRect((tempRect.x * (globalZoom/100) + 0.5 + canvasOffsetLeft), (tempRect.y * (globalZoom/100) + 0.5 + canvasOffsetTop), 
			(tempRect.width) * (globalZoom/100), (tempRect.height) * (globalZoom/100));	
			toolDrawCtx.fillStyle = "rgba(255, 255, 255, .05)";
			toolDrawCtx.strokeRect((tempRect.x * (globalZoom/100) + 0.5 + canvasOffsetLeft), (tempRect.y * (globalZoom/100) + 0.5 + canvasOffsetTop), 
			(tempRect.width) * (globalZoom/100), (tempRect.height) * (globalZoom/100));	
		}
		
		toolDrawCtx.restore();
	}
	
	toolDrawCtx.restore();
		
}

function updateEditorCanvas(){

	editorCtx.clearRect(0, 0, editorCanvas.width, editorCanvas.height);

	var tempEditorCanvas = document.createElement("canvas");
	//tempEditorCanvas.width = editorCtx.canvas.width;
	//tempEditorCanvas.height = editorCtx.canvas.height;	
	// Using the two above gives trouble
	tempEditorCanvas.width = canvasWidth;
	tempEditorCanvas.height = canvasHeight;
	var tempEditorCtx = tempEditorCanvas.getContext("2d");	
	
	// Loop through all the layer canvases drawing them to editorCanvas. 
	// The current layer is blurred based on layerIndex before it is drawn
	for(let j = 0; j < layerStack.length; j++){
	
		if(layerStack[j].visible){
			// If layer is visible continue
		}else{
			// If the layer is not visible then do no rendering of it
			continue;
		}
		
		//alert("render layer: " + j);
		
		//============================================
		// Draw all the layers to the editor canvas
		if(j != layerIndex){
			// Once the layer is not the current layer index
			layerRenderEngine.renderLayerIndex(tempEditorCtx, j);	
		}else{
			// Once in the current layer index if we render once 
			// we are not editing the current
			if(!updateCurrentLayerTextObject){
				layerRenderEngine.renderLayerIndex(tempEditorCtx, j);
			}
		}
		//============================================	
				
			
		// CASE 2:
		// If newTextLayerFlag is set the draw the text canvas over the current layer
		// Draw the current text edit over the current layerIndex
		if((updateCurrentLayerTextObject || newTextLayerFlag) && j == layerIndex){
			if (typeof textCanvas === 'undefined') {
			}else{
				/*
					Apply the text object to the canvas taking transformation into consideration. 
					Remember when the image is flipped that container div for the editorCanvas
					is flipped using scaleX = -1 or scaleY -1. This means when we are typing text 
					it will appear flipped. But the edited text must not appear flipped so we must unflip it
					by applying the global transformation to the text.
				*/
				//EditorUtils.scaleCanvas(textCanvas, globalTransformObject.flip_scaleX, globalTransformObject.flip_scaleY);
				tempEditorCtx.drawImage(textCanvas, squareSelectionRect.x, squareSelectionRect.y);
			}		
		}	
	
	}
	
	/*
	// Apply global transformations
	editorCtx.save();
	EditorUtils.applyImageCanvasTransformations(editorCtx);
	editorCtx.drawImage(tempEditorCanvas, 0, 0);
	editorCtx.restore();
	*/	
	
	// Apply global transformations
	editorCtx.save();
	EditorUtils.getTransormedCanvas(tempEditorCtx.canvas);
	editorCtx.canvas.width = tempEditorCanvas.width;
	editorCtx.canvas.height = tempEditorCanvas.height;
	editorCtx.drawImage(tempEditorCanvas, 0, 0);
	editorCtx.restore();
		
		
}

// Create a blob from dataURL
function dataURLtoBlob(dataurl) {
	var arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
		bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
	while(n--){
		u8arr[n] = bstr.charCodeAt(n);
	}
	return new Blob([u8arr], {type:mime});
}

function downloadImage(){

	let fileName = localStorage.getItem("image_filename");
	
	if (fileName === null) {
		fileName = "download.png";
	}

    let a = document.createElement("a");
    document.body.appendChild(a);
    a.style = "display: none";
	let blob = dataURLtoBlob(editorCanvas.toDataURL());
	let url = window.URL.createObjectURL(blob);
	a.href = url;
	a.download = fileName;
	a.click();
	window.URL.revokeObjectURL(url);
}

// https://stackoverflow.com/questions/3977792/how-to-convert-keycode-to-character-using-javascript/3977802
function KeyPress(event)
{
	var KeyID = event.keyCode;
	var addchar = true;
   
	// https://stackoverflow.com/questions/1772179/get-character-value-from-keycode-in-javascript-then-trim
	if(addchar){
		editorText += String.fromCharCode(KeyID); 
	}
   
	updateEditorCanvas();
}

function KeyCheck(event)
{

	//alert(event.keyCode);

	// All CTRL Key Combinations
	if (event.ctrlKey) {
	
		// Undo - CTRL + Z
		if (event.keyCode == 90) {
			//performUndo();
		}
		
		// Redo with CTRL + Y
		if (event.keyCode == 89) {
			//performRedo();
			//performRedo();
		}
		
		// Copy with CTRL + C
		if (event.keyCode == 67) {
			//alert("Copy");
		}
		
		// Copy with CTRL + X
		if (event.keyCode == 88) {
			//alert("Cut");
		}
		
		// Copy with CTRL + V
		if (event.keyCode == 86) {
			//alert("Paste");
		}
		
		// So that events associated with a single key below don't occur
		return;
	
	}
	

   var KeyID = event.keyCode;
   
   // https://stackoverflow.com/questions/1772179/get-character-value-from-keycode-in-javascript-then-trim
   // editorText += String.fromCharCode(KeyID); 
	// updateEditorCanvas();
   
   
   switch(KeyID)
   {
		case 13: // ENTER KEY
			// alert("enter key pressed");

			//addCropEdit();
			
		break;
		case 8: // BACKSPACE KEY
			// editorText = editorText.substring(0, editorText.length - 1); 
			// updateEditorCanvas();
		break; 
		case 27: // ESCAPE KEY

		break;
		case 46: // DELETE KEY
			

			
		break;
		default:
		break;
   }
   
}

function checkTextboxResizeHandlePress(mouseX, mouseY, squareSelectionRect, resizehandlewidth){

	lastdragPoint.x = mouseX;
	lastdragPoint.y = mouseY;

	// 1. TOP RESIZE HANDLE - Create a rect for the top resize handle
	var topResizeHandleRect = {
		x: squareSelectionRect.x,		
		y: squareSelectionRect.y - resizehandlewidth,		
		width: squareSelectionRect.width,		
		height: resizehandlewidth	
	}
	
	// Test view to see the rect
	// drawTestBox(topResizeHandleRect,"rgb(255, 0, 0)");
	
	if(checkInRect(mouseX, mouseY, topResizeHandleRect)){
		// console.log("start dragging top side");
		resetAllTextBoxTransformFlags();
		dragTopResize = true;
	}
	
	// 2. TOP RIGHT CORNER RESIZE HANDLE - Create a rect for the top right corner resize handle
	var top_Right_ResizeHandleRect = {
		x: squareSelectionRect.x + squareSelectionRect.width,		
		y: squareSelectionRect.y - resizehandlewidth,		
		width: resizehandlewidth,		
		height: resizehandlewidth	
	}
	
	// Test view to see the rect
	// drawTestBox(top_Right_ResizeHandleRect,"rgb(0, 255, 0)");
	
	if(checkInRect(mouseX, mouseY, top_Right_ResizeHandleRect)){
		// console.log("start dragging top right corner");
		resetAllTextBoxTransformFlags();
		dragTopRightResize = true;
	}
	
	// 3. RIGHT RESIZE HANDLE - Create a rect for the right side resize handle
	var rightResizeHandleRect = {
		x: squareSelectionRect.x + squareSelectionRect.width,		
		y: squareSelectionRect.y,		
		width: resizehandlewidth,		
		height: squareSelectionRect.height	
	}
	
	// Test view to see the rect
	// drawTestBox(rightResizeHandleRect,"rgb(0, 0, 255)");
	
	if(checkInRect(mouseX, mouseY, rightResizeHandleRect)){
		// console.log("start dragging right side");
		resetAllTextBoxTransformFlags();
		dragRightResize = true;
	}
	
	// 4. BOTTOM RIGHT RESIZE HANDLE - Create a rect for the right side resize handle
	var bottom_Right_ResizeHandleRect = {
		x: squareSelectionRect.x + squareSelectionRect.width,		
		y: squareSelectionRect.y + squareSelectionRect.height,		
		width: resizehandlewidth,		
		height: resizehandlewidth	
	}
	
	// Test view to see the rect
	// drawTestBox(bottom_Right_ResizeHandleRect,"pink");
	
	if(checkInRect(mouseX, mouseY, bottom_Right_ResizeHandleRect)){
		// console.log("start dragging bottom right corner");
		resetAllTextBoxTransformFlags();
		dragBottomRightResize = true;
	}
	
	// 5. BOTTOM RESIZE HANDLE - Create a rect for the top resize handle
	var bottomResizeHandleRect = {
		x: squareSelectionRect.x,		
		y: squareSelectionRect.y + squareSelectionRect.height,		
		width: squareSelectionRect.width,		
		height: resizehandlewidth	
	}
	
	// Test view to see the rect
	// drawTestBox(bottomResizeHandleRect,"yellow");

	if(checkInRect(mouseX, mouseY, bottomResizeHandleRect)){
		// console.log("start dragging bottom side");
		resetAllTextBoxTransformFlags();
		dragBottomResize = true;
	}
	
	// 4. BOTTOM LEFT CORNER RESIZE HANDLE - Create a rect for the right side resize handle
	var bottom_Left_ResizeHandleRect = {
		x: squareSelectionRect.x - resizehandlewidth,		
		y: squareSelectionRect.y + squareSelectionRect.height,		
		width: resizehandlewidth,		
		height: resizehandlewidth	
	}
	
	// Test view to see the rect
	// drawTestBox(bottom_Left_ResizeHandleRect,"orange");
	
	if(checkInRect(mouseX, mouseY, bottom_Left_ResizeHandleRect)){
		// console.log("start dragging bottom left corner");
		resetAllTextBoxTransformFlags();
		dragBottomLeftResize = true;
	}
	
	// 6. LEFT RESIZE HANDLE - Create a rect for the right side resize handle
	var leftResizeHandleRect = {
		x: squareSelectionRect.x - resizehandlewidth,		
		y: squareSelectionRect.y,		
		width: resizehandlewidth,		
		height: squareSelectionRect.height	
	}
	
	// Test view to see the rect
	// drawTestBox(leftResizeHandleRect,"violet");
	
	if(checkInRect(mouseX, mouseY, leftResizeHandleRect)){
		// console.log("start dragging left side");
		resetAllTextBoxTransformFlags();
		dragLeftResize = true;
	}
	
	// 6. TOP LEFT CORNER RESIZE HANDLE - Create a rect for the right side resize handle
	var top_Left_ResizeHandleRect = {
		x: squareSelectionRect.x - resizehandlewidth,		
		y: squareSelectionRect.y - resizehandlewidth,		
		width: resizehandlewidth,		
		height: resizehandlewidth	
	}
	
	// Test view to see the rect
	// drawTestBox(top_Left_ResizeHandleRect,"grey");
	
	if(checkInRect(mouseX, mouseY, top_Left_ResizeHandleRect)){
		// console.log("start dragging top left corner");
		resetAllTextBoxTransformFlags();
		dragTopLeftResize = true;
	}
	
	// 7. OUTSIDE THE TEXTBOX AND RESIZE HANDLES - check if outside both the textbox and the resize handles
	// first create the textbox that covers the resize handles and textbox
	var outsideRect = {
		x: squareSelectionRect.x - resizehandlewidth,
		y: squareSelectionRect.y - resizehandlewidth,
		width: squareSelectionRect.width + 2*resizehandlewidth,
		height: squareSelectionRect.height + 2*resizehandlewidth,
	};
	
	if(!checkInRect(mouseX, mouseY, outsideRect)){
		// console.log("inside textbox");
		resetAllTextBoxTransformFlags();
		dragTextBox = true;
	}
	
}

// Used to set the cursor based on the resize handle that was hovered
function setTextBoxResizeHandleCursor(mouseX, mouseY, squareSelectionRect, resizehandlewidth){

	var noResizeHandle = true;

	// 1. TOP RESIZE HANDLE - Create a rect for the top resize handle
	var topResizeHandleRect = {
		x: squareSelectionRect.x,		
		y: squareSelectionRect.y - resizehandlewidth,		
		width: squareSelectionRect.width,		
		height: resizehandlewidth	
	}
	
	if(checkInRect(mouseX, mouseY, topResizeHandleRect)){
		//console.log("start dragging top side");
		workspaceContainerDiv.style.cursor = "ns-resize";
		noResizeHandle = false;
	}
	
	// 2. TOP RIGHT CORNER RESIZE HANDLE - Create a rect for the top right corner resize handle
	var top_Right_ResizeHandleRect = {
		x: squareSelectionRect.x + squareSelectionRect.width,		
		y: squareSelectionRect.y - resizehandlewidth,		
		width: resizehandlewidth,		
		height: resizehandlewidth	
	}
	
	if(checkInRect(mouseX, mouseY, top_Right_ResizeHandleRect)){
		// console.log("start dragging top right corner");
		workspaceContainerDiv.style.cursor = "nesw-resize";
		noResizeHandle = false;
	}
	
	// 3. RIGHT RESIZE HANDLE - Create a rect for the right side resize handle
	var rightResizeHandleRect = {
		x: squareSelectionRect.x + squareSelectionRect.width,		
		y: squareSelectionRect.y,		
		width: resizehandlewidth,		
		height: squareSelectionRect.height	
	}
	
	if(checkInRect(mouseX, mouseY, rightResizeHandleRect)){
		// console.log("start dragging right side");
		workspaceContainerDiv.style.cursor = "ew-resize";
		noResizeHandle = false;
	}
	
	// 4. BOTTOM RIGHT RESIZE HANDLE - Create a rect for the right side resize handle
	var bottom_Right_ResizeHandleRect = {
		x: squareSelectionRect.x + squareSelectionRect.width,		
		y: squareSelectionRect.y + squareSelectionRect.height,		
		width: resizehandlewidth,		
		height: resizehandlewidth	
	}
	
	if(checkInRect(mouseX, mouseY, bottom_Right_ResizeHandleRect)){
		// console.log("start dragging bottom right corner");
		workspaceContainerDiv.style.cursor = "nwse-resize";
		noResizeHandle = false;
	}
	
	// 5. BOTTOM RESIZE HANDLE - Create a rect for the top resize handle
	var bottomResizeHandleRect = {
		x: squareSelectionRect.x,		
		y: squareSelectionRect.y + squareSelectionRect.height,		
		width: squareSelectionRect.width,		
		height: resizehandlewidth	
	}

	if(checkInRect(mouseX, mouseY, bottomResizeHandleRect)){
		//console.log("start dragging bottom side");
		workspaceContainerDiv.style.cursor = "ns-resize";
		noResizeHandle = false;
	}
	
	// 4. BOTTOM LEFT CORNER RESIZE HANDLE - Create a rect for the right side resize handle
	var bottom_Left_ResizeHandleRect = {
		x: squareSelectionRect.x - resizehandlewidth,		
		y: squareSelectionRect.y + squareSelectionRect.height,		
		width: resizehandlewidth,		
		height: resizehandlewidth	
	}
	
	if(checkInRect(mouseX, mouseY, bottom_Left_ResizeHandleRect)){
		// console.log("start dragging bottom left corner");
		workspaceContainerDiv.style.cursor = "nesw-resize";
		noResizeHandle = false;
	}
	
	// 6. LEFT RESIZE HANDLE - Create a rect for the right side resize handle
	var leftResizeHandleRect = {
		x: squareSelectionRect.x - resizehandlewidth,		
		y: squareSelectionRect.y,		
		width: resizehandlewidth,		
		height: squareSelectionRect.height	
	}
	
	if(checkInRect(mouseX, mouseY, leftResizeHandleRect)){
		// console.log("start dragging left side");
		workspaceContainerDiv.style.cursor = "ew-resize";
		noResizeHandle = false;
	}
	
	// 6. TOP LEFT CORNER RESIZE HANDLE - Create a rect for the right side resize handle
	var top_Left_ResizeHandleRect = {
		x: squareSelectionRect.x - resizehandlewidth,		
		y: squareSelectionRect.y - resizehandlewidth,		
		width: resizehandlewidth,		
		height: resizehandlewidth	
	}
	
	if(checkInRect(mouseX, mouseY, top_Left_ResizeHandleRect)){
		// console.log("start dragging top left corner");
		workspaceContainerDiv.style.cursor = "nwse-resize";
		noResizeHandle = false;
	}
	
	// If inside the textbox
	if(checkInRect(mouseX, mouseY, squareSelectionRect)){
		// console.log("inside textbox");
		workspaceContainerDiv.style.cursor = "text";
	}

	// check if outside both the textbox and the resize handles
	// first create the textbox that covers the resize handles and textbox
	var outsideRect = {
		x: squareSelectionRect.x - resizehandlewidth,
		y: squareSelectionRect.y - resizehandlewidth,
		width: squareSelectionRect.width + 2*resizehandlewidth,
		height: squareSelectionRect.height + 2*resizehandlewidth,
	};
	
	if(!checkInRect(mouseX, mouseY, outsideRect)){
		// console.log("inside textbox");
		workspaceContainerDiv.style.cursor = "move";
	}
	
	// If non of the previous cursors were selected use the default
	if(noResizeHandle){
		//workspaceContainerDiv.style.cursor = "default";
	}
	
}

function checkDraggingResize(mouseX, mouseY){

	if(dragTextBox ){
	
		var dragX = mouseX - lastdragPoint.x;
		var dragY = mouseY - lastdragPoint.y;

		squareSelectionRect.x += dragX;	
		squareSelectionRect.y += dragY;	
		
		// redraw the text
		renderText();
		// redraw the bounding textbox
		updateToolCanvas();
	}
	
	// Dragging the top handle
	if(dragTopResize){
	
		//console.log(mouseX - lastdragPoint.x, mouseY - lastdragPoint.y);
		
		var dragX = mouseX - lastdragPoint.x;
		var dragY = mouseY - lastdragPoint.y;
		
		squareSelectionRect.y += dragY;
		squareSelectionRect.height -= dragY;
		
		// redraw the text
		renderText();
		// redraw the bounding textbox
		updateToolCanvas();
		
	}
	
	if(dragTopRightResize){
	
		//console.log(mouseX - lastdragPoint.x, mouseY - lastdragPoint.y);
		
		var dragX = mouseX - lastdragPoint.x;
		var dragY = mouseY - lastdragPoint.y;

		squareSelectionRect.width += dragX;
		
		squareSelectionRect.y += dragY;
		squareSelectionRect.height -= dragY;
		
		// redraw the text
		renderText();
		// redraw the bounding textbox
		updateToolCanvas();
		
	}
	
	if(dragRightResize){
	
		//console.log(mouseX - lastdragPoint.x, mouseY - lastdragPoint.y);
		
		var dragX = mouseX - lastdragPoint.x;
		var dragY = mouseY - lastdragPoint.y;

		squareSelectionRect.width += dragX;
		
		// redraw the text
		renderText();
		// redraw the bounding textbox
		updateToolCanvas();
		
	}
	
	if(dragBottomRightResize){

		//console.log(mouseX - lastdragPoint.x, mouseY - lastdragPoint.y);
		
		var dragX = mouseX - lastdragPoint.x;
		var dragY = mouseY - lastdragPoint.y;

		squareSelectionRect.width += dragX;
		squareSelectionRect.height += dragY;
		
		// redraw the text
		renderText();
		// redraw the bounding textbox
		updateToolCanvas();
		
	}

	if(dragBottomResize){
	
		//console.log(mouseX - lastdragPoint.x, mouseY - lastdragPoint.y);
		
		var dragX = mouseX - lastdragPoint.x;
		var dragY = mouseY - lastdragPoint.y;
		
		squareSelectionRect.height += dragY;
		
		// redraw the text
		renderText();
		// redraw the bounding textbox
		updateToolCanvas();	
		
	}
	
	if(dragBottomLeftResize){
	
		//console.log(mouseX - lastdragPoint.x, mouseY - lastdragPoint.y);
		
		var dragX = mouseX - lastdragPoint.x;
		var dragY = mouseY - lastdragPoint.y;
		
		squareSelectionRect.x += dragX;
		squareSelectionRect.width -= dragX;
		squareSelectionRect.height += dragY;
		
		// redraw the text
		renderText();
		// redraw the bounding textbox
		updateToolCanvas();	
		
	}
	
	if(dragLeftResize){
	
		//console.log(mouseX - lastdragPoint.x, mouseY - lastdragPoint.y);
		
		var dragX = mouseX - lastdragPoint.x;
		var dragY = mouseY - lastdragPoint.y;
		
		squareSelectionRect.x += dragX;
		squareSelectionRect.width -= dragX;
		
		// redraw the text
		renderText();
		// redraw the bounding textbox
		updateToolCanvas();	
		
	}
	
	if(dragTopLeftResize){
	
		//console.log(mouseX - lastdragPoint.x, mouseY - lastdragPoint.y);
		
		var dragX = mouseX - lastdragPoint.x;
		var dragY = mouseY - lastdragPoint.y;
		
		squareSelectionRect.x += dragX;
		squareSelectionRect.width -= dragX;
		
		squareSelectionRect.y += dragY;
		squareSelectionRect.height -= dragY;
		
		// redraw the text
		renderText();
		// redraw the bounding textbox
		updateToolCanvas();	
		
	}
	
	lastdragPoint.x = mouseX;
	lastdragPoint.y = mouseY;

}

function resetAllTextBoxTransformFlags(){
	// Reset all drag flags to stop
	dragTextBox = false;
	dragTopResize = false;
	dragRightResize = false;
	dragBottomResize = false;
	dragLeftResize = false;
	// corner resizee handles
	dragTopRightResize = false;
	dragBottomRightResize = false;
	dragBottomLeftResize = false;
	dragTopLeftResize = false;
}

function checkInRect(x,y,rect){
	if(x >= rect.x && x <= (rect.x + rect.width) && y >= rect.y && y <= (rect.y + rect.height)){
		return true;
	}else{
		return false;
	}
}


// Draws a box to the editor canvas just for viewing purposes
function drawTestBox(rect, color){
	editorCtx.save();
	editorCtx.fillStyle = color;
	editorCtx.fillRect(rect.x ,rect.y ,rect.width ,rect.height);
	editorCtx.restore();
}

function setValue(sentvalue){
	var x = 0;
	
	if(sentvalue == 0){
	
	}else if(sentvalue > 0){
		while(x < sentvalue){
			x++;
		}
	}else{
		while(x > sentvalue){
			x--;
		}		
	}
	
	return x;
}

$("#testBtn").click(function() {

	//alert("Update Canvas");
	
	updateEditorCanvas();

	/*
	alert("Clearing Local storage");
	//localStorage.removeItem("editor_image");
	localStorage.clear();
	*/
});