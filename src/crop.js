// Copyright (c) 2019 Kasey Thomas. All rights reserved.
// Use of this source code is governed by the EULA.

'use strict';

// the main image being edited
// var image = new Image();
// image.addEventListener("load", loadEditorImage, true);

/*
 Notes
 In this file we use 'EditorUtils.setMouseCoordinates(e, workspaceContainerDiv, false)' so mouse coordinates are in screen space.
 This is done because for simplicity we have to manipulate the crop box using the space in the screen coordinates and not the image coordinates.
 However, when adding the generated crop rect we have to translate it to image coordinates. 
 This is done in the addCropEdit function using:
 EditorUtils.getGlobalTransformedPoint
 EditorUtils.getRectFromPoints
*/

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


var applyEditBtn = document.getElementById("applyEditBtn");
var resetEditBtn = document.getElementById("resetEditBtn");
var clearCropBtn = document.getElementById("clearCropBtn");
var aspectRatioSelect = document.getElementById("aspectRatioSelect");
var dimensionLbl = document.getElementById("dimensionLbl");

var aspectRatio = {width: -1, height: -1};

var workspaceMouseX = 0; // used to hold coordinates with respect to the workspaceContainerDiv
var workspaceMouseY = 0; // used to hold coordinates with respect to the workspaceContainerDiv
var mouseX = 0;
var mouseY = 0;

var lastdragPoint = {};
// textbox dragging 
var dragCropBox = false;
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

var resizehandlewidth = 8;

var dragselection = false;
var lastdragPoint = {};

// check if all required modules are present (HTML5 Storage etc...)
initializeEditor();

// set the cursor based on rectangular marquee
workspaceContainerDiv.style.cursor = "crosshair";


// Events

// keyboard events
document.addEventListener("keydown", KeyDownCheck);
document.addEventListener("keyup", KeyUpCheck);

// file loader event
fileinput.addEventListener('input', function(){

	if(this.files.length > 0){
		// alert(this.files[0].name);
		loadFile(this.files[0]);	
	}

});

aspectRatioSelect.addEventListener("change", function(e){
	//alert(this.value.split("_"));
	
	var ratio_Array = this.value.split("_");
	aspectRatio.width = parseInt(ratio_Array[0]);
	aspectRatio.height = parseInt(ratio_Array[1]);
	
	//alert(JSON.stringify(aspectRatio));
	//return;
	

	var testRect = new Object();
	
	/*
	testRect.x = testRect.x;
	testRect.y = testRect.y;
	testRect.width = testRect.width;
	testRect.height = testRect.height;
	*/
	
	testRect.x = 0;
	testRect.y = 0;
	testRect.width = canvasWidth;
	testRect.height = canvasHeight;
	
	if(aspectRatio.width == -1 || aspectRatio.height == -1){
	
		// FREE UNFIXED ASPECT RATIO
	
		// free aspect ratio
		// leave whatever is on the screen but the resizing wont keep any set aspect ratio
	}else if(aspectRatio.width == 0 || aspectRatio.height == 0){
	
		// WANT TO KEEP ASPECT RATIO OF IMAGE
		
		//alert("back to original image aspect ratio");
		// but this time dragging handles will keep the image ratio to that of the image
		testRect.width = canvasWidth;
		testRect.height = canvasHeight;

		aspectRatio = EditorUtils.getAspectRatio(canvasWidth, canvasHeight);
		
	}else if(aspectRatio.width == aspectRatio.height){
	
		// SQUARE CROP BOX (1:1)
	
		// We need a crop box that is equal in width and height
		// we use the shortest canvas dimension to create that aspect ratio
		// as the shortest will fit a square in both dimensions
		var square_width = canvasWidth;
		if(canvasHeight < canvasWidth){
			square_width = canvasHeight;
		}
		
		testRect.width = square_width;
		testRect.height = square_width;
		
	}else{
	
		// ALL OTHER ASPECT RATIO
	
		// 1. First attempt to obtain the dimensions to fit the aspect ratio based on the width
		testRect.width = canvasWidth;
		testRect.height = canvasWidth*(aspectRatio.height/aspectRatio.width);
		
		// 2. If the height is greater than the canvasHeight we have to calculate the dimensions for the aspect ratio based on the height
		if(testRect.height > canvasHeight){
			testRect.height = canvasHeight;
			testRect.width = canvasHeight*(aspectRatio.width/aspectRatio.height);
		}
	}
	
	// Center crop rect if any dimensions are shorter
	if(testRect.height < canvasHeight){
		// We need to center crop box vertically
		testRect.y = (canvasHeight - testRect.height)/2;
	}
	if(testRect.width < canvasWidth){
		// We need to center crop box vertically
		testRect.x = (canvasWidth - testRect.width)/2;
	}	
	
	//alert(JSON.stringify(aspectRatio));
	
	// Once there is a drawn box we update the box to new aspect ratio
	if(squareSelectionRect.width > 0 && squareSelectionRect.height > 0){
	
		squareSelectionRect.x = testRect.x;
		squareSelectionRect.y = testRect.y;
		squareSelectionRect.width = testRect.width;
		squareSelectionRect.height = testRect.height;
				
		updateToolCanvas();	
	}

	
});

clearCropBtn.addEventListener("click", function(e){
	//if(squareSelectionRect.width > 0 || squareSelectionRect.height > 0){
	
		workspaceContainerDiv.style.cursor = "crosshair";
	
		selectionActive = false;
		
		squareSelectionRect.x = 0;
		squareSelectionRect.y = 0;
		squareSelectionRect.width = 0;
		squareSelectionRect.height = 0;	
		
		//updateToolCanvas();
		toolDrawCtx.clearRect(0,0,toolDrawCtx.canvas.width,toolDrawCtx.canvas.height);
	//}
});

resetEditBtn.addEventListener("click", function(e){

	squareSelectionRect.x = 0;
	squareSelectionRect.y = 0;
	squareSelectionRect.width = canvasWidth;
	squareSelectionRect.height = canvasHeight;
	
	selectingrect = false;
	selectionActive = true;
	
	aspectRatio = {width: -1, height: -1};
	aspectRatioSelect.selectedIndex = 0;
	
	//updateToolCanvas();	
	toolDrawCtx.clearRect(0,0,toolDrawCtx.canvas.width,toolDrawCtx.canvas.height);
	
});

applyEditBtn.addEventListener("click", function(e){

	addCropEdit();

});

// Workspace mouse events

workspaceContainerDiv.addEventListener("dblclick", function(e){

	// *Nb. Don't apply editor canvas transformation mapping as we need actual pixel
	// point location in canvas
	EditorUtils.setMouseCoordinates(e, workspaceContainerDiv, false);

});

workspaceContainerDiv.addEventListener("click", function(e){

	// *Nb. Don't apply editor canvas transformation mapping as we need actual pixel
	// point location in canvas
	EditorUtils.setMouseCoordinates(e, workspaceContainerDiv, false);

});

workspaceContainerDiv.addEventListener("mousedown", function(e){

	// *Nb. Don't apply editor canvas transformation mapping as we need actual pixel
	// point location in canvas
	EditorUtils.setMouseCoordinates(e, workspaceContainerDiv, false);
	
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
	
		if(!selectionActive){
		
			selectionActive = false;
			
			squareSelectionRect.x = mouseX;
			squareSelectionRect.y = mouseY;
			squareSelectionRect.width = 0;
			squareSelectionRect.height = 0;
			
			selectingrect = true;
			
		}

		if(squareSelectionRect.width > 0 && squareSelectionRect.height > 0){	
			/*
			===========================================
			If there is an active selection rect clicking
			will enable resizing, moving etc.
			===========================================
			*/
			
			checkCropboxResizeHandlePress(mouseX, mouseY, squareSelectionRect, resizehandlewidth);
		}
	}
	
});

workspaceContainerDiv.addEventListener("mousemove", function(e){

	// *Nb. Don't apply editor canvas transformation mapping as we need actual pixel
	// point location in canvas	
	EditorUtils.setMouseCoordinates(e, workspaceContainerDiv, false);
	
	//console.log(EditorUtils.getGlobalTransformedPoint(mouseX, mouseY));
	

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
	
		// THE CROP ROUTINE
	
		//infoLbl.innerText = "workspace (x,y): " + mouseX + "," + mouseY;
		
		// checks if a handle resize flag was set an updates the textbox dimensions based on that 
		// handle movement
		checkDraggingResize(mouseX, mouseY);
		
		// RECTANGULAR SELECTION - updates the width and height of the rectangular selection with the mouse move
		if(selectingrect){
		
			// Keep the mouse coordinates in the bounds
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
			
					
			// Code below has been DEPRECATED to allow drawing with aspect ratio below
			//squareSelectionRect.width = mouseX - squareSelectionRect.x;
			//squareSelectionRect.height = mouseY - squareSelectionRect.y;	

			// *IMPORTANT - testRect will be used to hold a copy of squareSelectionRect
			// This is done so that we can apply and test the transformation of 
			// squareSelectionRect before altering it.
			var testRect = new Object();
			testRect.x = squareSelectionRect.x;
			testRect.y = squareSelectionRect.y;
			testRect.width = squareSelectionRect.width;
			testRect.height = squareSelectionRect.height;		
			
			if(aspectRatio.width == -1 || aspectRatio.height == -1){
			
				// FREE UNFIXED ASPECT RATIO JUST APPLY CHANGES

				testRect.width = mouseX - testRect.x;
				testRect.height = mouseY - testRect.y;
				
				squareSelectionRect.x = testRect.x;
				squareSelectionRect.y = testRect.y;
				squareSelectionRect.width = testRect.width;
				squareSelectionRect.height = testRect.height;	
				
			}else if(aspectRatio.width == aspectRatio.height){
			
				// SQUARE CROP BOX (1:1)	
				
				testRect.height = mouseY - testRect.y;
				
				// 1:1 aspect ratio means height and width are the same so set the width equal to the height
				testRect.width = testRect.height;
				
				// If crop box goes over box of canvas don't apply
				if(EditorUtils.checkInBounds(testRect, canvasWidth, canvasHeight)){
					// The test box is bounded by the canvas so the Aspect ratio resize 
					// can be applied to the crop box 
					squareSelectionRect.x = testRect.x;
					squareSelectionRect.y = testRect.y;
					squareSelectionRect.width = testRect.width;
					squareSelectionRect.height = testRect.height;				
				}
				
			}else{
			
				// ALL OTHER ASPECT RATIO

				testRect.width = mouseX - testRect.x;
				
				// we now calculate the height based on the aspect ratio
				testRect.height = testRect.width*(aspectRatio.height/aspectRatio.width);
				
				// If crop box goes over box of canvas don't apply
				if(EditorUtils.checkInBounds(testRect, canvasWidth, canvasHeight)){
					// The test box is bounded by the canvas so the Aspect ratio resize 
					// can be applied to the crop box 
					squareSelectionRect.x = testRect.x;
					squareSelectionRect.y = testRect.y;
					squareSelectionRect.width = testRect.width;
					squareSelectionRect.height = testRect.height;				
				}
			
			}

			
			updateToolCanvas();	
		}
		
		if(selectionActive){

			// minimum width or height of 50
			if(squareSelectionRect.width < 50){
				squareSelectionRect.width = 50;		
			}
			if(squareSelectionRect.height < 50){
				squareSelectionRect.height = 50;		
			}	
		
			// check if inside the current crop selection
			if(mouseX >= squareSelectionRect.x && mouseX <= (squareSelectionRect.x + squareSelectionRect.width) 
				&& mouseY >= squareSelectionRect.y && mouseY <= squareSelectionRect.y + squareSelectionRect.height){
				
			}
				
			// Sets the cursor based on the resize handle the pointer is currently hovering over
			// If we are not drawing a box and the box is defined
			if(!selectingrect && squareSelectionRect.width > 0 && squareSelectionRect.height > 0){ // prevents resize cursors from showing while drawing textbox
				setCropBoxResizeHandleCursor(mouseX, mouseY, squareSelectionRect, resizehandlewidth);	
			}
			
		}
	
	}
	
});

workspaceContainerDiv.addEventListener("mouseup", function(e){

	// *Nb. Don't apply editor canvas transformation mapping as we need actual pixel
	// point location in canvas
	EditorUtils.setMouseCoordinates(e, workspaceContainerDiv, false);
	
	if(transformSelection){

		if(dragselection){
			EditorUtils.addMoveActiveSelectionEntry(activeSelectionArea);
			dragselection = false;
		}
	
	}else{
	
		//console.log(JSON.stringify(squareSelectionRect));
		
		if(squareSelectionRect.width < 0){
			var tempRect = JSON.parse(JSON.stringify(squareSelectionRect));
			//console.log(tempRect);
			squareSelectionRect.x = tempRect.x + tempRect.width;
			squareSelectionRect.width = Math.abs(tempRect.width);
			//console.log(squareSelectionRect);
		}
		
		if(squareSelectionRect.height < 0){
			var tempRect = JSON.parse(JSON.stringify(squareSelectionRect));
			//console.log(tempRect);
			squareSelectionRect.y = tempRect.y + tempRect.height;
			squareSelectionRect.height = Math.abs(tempRect.height);
			//console.log(squareSelectionRect);
		}
		
		resetAllCropBoxTransformFlags();
		
		//console.log(squareSelectionRect);
		
		// Make sure the selection box fit in the canvas
		fitCanvas();
		
		//console.log(squareSelectionRect);
		
		applyEditBtn.disabled = false;
		

		//alert(mouseX + "," + mouseY);
		selectingrect = false;
		selectionActive = true;
		
		//updateToolCanvas();
	
	}
	
});

function addCropEdit(){

	//alert("crop");

	if(squareSelectionRect.width == canvasWidth && squareSelectionRect.height == canvasHeight){
		alert("Crop size same as canvas");
		return;
	}

	// alert(editStack.stack.length);
	if(editStack.stack.length > 0){
	}else{
		// alert("no edits");
		return;
	}

	if(squareSelectionRect.width == 0 || squareSelectionRect.height == 0){
		alert("Select a crop region");
		return;
	}
	
	/*
	let cropEditEntry = {
		edit: "crop", 
		edit_label: "Crop", 
		rect: {
			x: squareSelectionRect.x, 
			y: squareSelectionRect.y, 
			width: squareSelectionRect.width, 
			height: squareSelectionRect.height
		}
	};
	*/
	
	var rect = new Object();
	rect.x = squareSelectionRect.x;
	rect.y = squareSelectionRect.y;
	rect.width = squareSelectionRect.width;
	rect.height = squareSelectionRect.height;
	
	
	// Apply global transformations to the tempRect
	//EditorUtils.globalImageRotateActiveSelection(rect, "rectangle");
	/*
		Can't use above because it takes coordinates from real image space to the
		globally transformed space. The points in the 'rect' object is in transformed space already
		so I need to get it back to real space.
		
		Correct procedure
		I will get the 4 corner points of the rectangle using rect.x, rect.y, rect.width, rect.height
		then I will perform EditorUtils.getGlobalTransformedPoint(point_x, point_y) on them. Then recreate
		the rect object.
	*/
	
	// change the rect to image space from screen space using global tranforms
	rect = EditorUtils.getGlobalTransformedRect(rect);
	
	//console.log("crop page");
	//console.log(rect);
	
	var cropEditEntry = new Object();
	cropEditEntry.edit = "crop";
	cropEditEntry.edit_label = "Crop";
	cropEditEntry.rect = rect;
	//cropEditEntry.rect = squareSelectionRect;
	
	// add to the crop edit stack
	editStack.add(cropEditEntry);
	
	if(applyHistory){
		applyEditHistory();
	}else{
		applyHistory = true;
	}
	
	squareSelectionRect = {x: 0, y:0, width: 0, height: 0};
	
}

function startMarchingAnts(){
	/*
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
	*/	
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

	// Set the value of the aspect ratio for the 'Image' option in the the aspect ratio dropdown
	// aspectRatioSelect.options[1].value = imageAspectRatio.width + "_" + imageAspectRatio.height;
		
	// FIXES PROBLEM - prevents showing the old crop box with broken line when undo is done
	squareSelectionRect = {x: 0, y:0, width: 0, height: 0};
	dimensionLbl.parentNode.style.visibility = "visible";

	
	// set the editor canvas to the image width
	editorCanvas.width = canvasWidth;
	editorCanvas.height = canvasHeight;
	
	// draw the active selection	
	selectionCanvas.width = editorCanvas.width;
	selectionCanvas.height = editorCanvas.height;
	EditorUtils.drawSelectionClipping(selectionCtx, invertSelection,"green",activeSelectionArea, false);
	
	//============================================
	// Draw all the layers to the editor canvas
	layerRenderEngine.renderAllLayers(editorCtx);
	//============================================
	
	setTimeout(function(){ 
	
		dimensionLbl.parentNode.style.visibility = "visible";
	
		squareSelectionRect.x = 0;
		squareSelectionRect.y = 0;
		squareSelectionRect.width = editorCanvas.width;
		squareSelectionRect.height = editorCanvas.height;
				
		selectingrect = false;
		selectionActive = true;
		
		updateToolCanvas();
		
	}, 1500);

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

function updateEditorCanvas(){

}

function updateToolCanvas(){

	// Update the position and dimensions for the crop box to the label
	setDimensionLabel(parseInt(squareSelectionRect.y), parseInt(squareSelectionRect.x), parseInt(squareSelectionRect.width), parseInt(squareSelectionRect.height));

	toolDrawCtx.clearRect(0, 0, toolDrawCtx.canvas.width, toolDrawCtx.canvas.height);
	toolDrawCtx.save();

	// Add transforms to the tool canvas 
	//EditorUtils.applyImageCanvasTransformations(toolDrawCtx);	

	if(!selectionActive){
	
		toolDrawCtx.save();
	
		if(Math.abs(squareSelectionRect.width) == 0 || Math.abs(squareSelectionRect.height) == 0){
		}else{
			toolDrawCtx.lineWidth = 1;
			
			// just to make sure we have no marching ants effect we don't put line offset
			// toolDrawCtx.lineDashOffset = polyLassoLineOffset;

			// draw black dashed line over the white line to finish the selection box
			toolDrawCtx.strokeStyle = "#000000";
			toolDrawCtx.setLineDash([9,0]);
			//toolDrawCtx.strokeRect((squareSelectionRect.x + 0.5 + mouseOffsetLeft), (squareSelectionRect.y + 0.5 + mouseOffsetTop), (squareSelectionRect.width - 1), (squareSelectionRect.height - 1));
			toolDrawCtx.strokeRect((squareSelectionRect.x * (globalZoom/100) + 0.5 + canvasOffsetLeft), (squareSelectionRect.y * (globalZoom/100) + 0.5 + canvasOffsetTop), 
			(squareSelectionRect.width) * (globalZoom/100), (squareSelectionRect.height) * (globalZoom/100));			
			
			// draw solid white line
			
			toolDrawCtx.strokeStyle = "#ffffff";
			toolDrawCtx.setLineDash([5,4]);
			//toolDrawCtx.strokeRect((squareSelectionRect.x + 0.5 + mouseOffsetLeft), (squareSelectionRect.y + 0.5 + mouseOffsetTop), (squareSelectionRect.width - 1), (squareSelectionRect.height - 1));
			toolDrawCtx.strokeRect((squareSelectionRect.x * (globalZoom/100) + 0.5 + canvasOffsetLeft), (squareSelectionRect.y * (globalZoom/100) + 0.5 + canvasOffsetTop), 
			(squareSelectionRect.width) * (globalZoom/100), (squareSelectionRect.height) * (globalZoom/100));							
		}
		
		toolDrawCtx.restore();
		
	}else{
		toolDrawCtx.save();
		
		if(Math.abs(squareSelectionRect.width) == 0 || Math.abs(squareSelectionRect.height) == 0){
		}else{
			// 1. Draw the crop selection
			toolDrawCtx.lineWidth = 1;
			toolDrawCtx.strokeStyle = "rgba(255, 255, 255, .8)";
			
			toolDrawCtx.shadowColor = 'rgba(0, 0, 0, .8)';
			toolDrawCtx.shadowBlur = 1;
			
			//toolDrawCtx.strokeRect((squareSelectionRect.x + 0.5 + mouseOffsetLeft), (squareSelectionRect.y + 0.5 + mouseOffsetTop), (squareSelectionRect.width - 1), (squareSelectionRect.height - 1));
			toolDrawCtx.strokeRect((squareSelectionRect.x * (globalZoom/100) + 0.5 + canvasOffsetLeft), (squareSelectionRect.y * (globalZoom/100) + 0.5 + canvasOffsetTop), 
			(squareSelectionRect.width) * (globalZoom/100), (squareSelectionRect.height) * (globalZoom/100));				
			toolDrawCtx.fillStyle = "rgba(255, 255, 255, .05)";
			//toolDrawCtx.fillRect((squareSelectionRect.x + 0.5 + mouseOffsetLeft), (squareSelectionRect.y + 0.5 + mouseOffsetTop), (squareSelectionRect.width - 1), (squareSelectionRect.height - 1));
			toolDrawCtx.fillRect((squareSelectionRect.x * (globalZoom/100) + 0.5 + canvasOffsetLeft), (squareSelectionRect.y * (globalZoom/100) + 0.5 + canvasOffsetTop), 
			(squareSelectionRect.width) * (globalZoom/100), (squareSelectionRect.height) * (globalZoom/100));

			// 2. Draw the rule of thirds grid
			var height_third = squareSelectionRect.height/3;
			var width_third = squareSelectionRect.width/3;
			
			// draw the top horizontal rule of thirds line
			toolDrawCtx.beginPath();
			toolDrawCtx.moveTo((squareSelectionRect.x * (globalZoom/100) + 0.5 + canvasOffsetLeft), ((squareSelectionRect.y + height_third) * (globalZoom/100) + 0.5 + canvasOffsetTop));
			toolDrawCtx.lineTo(((squareSelectionRect.x + squareSelectionRect.width) * (globalZoom/100) + 0.5 + canvasOffsetLeft), ((squareSelectionRect.y + height_third) * (globalZoom/100) + 0.5 + canvasOffsetTop));
			toolDrawCtx.stroke();
			
			// draw the bottom horizontal rule of thirds line
			toolDrawCtx.beginPath();
			toolDrawCtx.moveTo((squareSelectionRect.x * (globalZoom/100) + 0.5 + canvasOffsetLeft), ((squareSelectionRect.y + 2*height_third) * (globalZoom/100) + 0.5 + canvasOffsetTop));
			toolDrawCtx.lineTo(((squareSelectionRect.x + squareSelectionRect.width) * (globalZoom/100) + 0.5 + canvasOffsetLeft), ((squareSelectionRect.y + 2*height_third) * (globalZoom/100) + 0.5 + canvasOffsetTop));
			toolDrawCtx.stroke();
			
			// draw the leftmost vertical rule of thirds 
			toolDrawCtx.beginPath();
			toolDrawCtx.moveTo(((squareSelectionRect.x + width_third) * (globalZoom/100) + 0.5 + canvasOffsetLeft), (squareSelectionRect.y * (globalZoom/100) + 0.5 + canvasOffsetTop));
			toolDrawCtx.lineTo(((squareSelectionRect.x + width_third) * (globalZoom/100) + 0.5 + canvasOffsetLeft), ((squareSelectionRect.y + squareSelectionRect.height) * (globalZoom/100) + 0.5 + canvasOffsetTop));
			toolDrawCtx.stroke();	

			// draw the rightmost vertical rule of thirds 
			toolDrawCtx.beginPath();
			toolDrawCtx.moveTo(((squareSelectionRect.x + 2*width_third) * (globalZoom/100) + 0.5 + canvasOffsetLeft), (squareSelectionRect.y * (globalZoom/100) + 0.5 + canvasOffsetTop));
			toolDrawCtx.lineTo(((squareSelectionRect.x + 2*width_third) * (globalZoom/100) + 0.5 + canvasOffsetLeft), ((squareSelectionRect.y + squareSelectionRect.height) * (globalZoom/100) + 0.5 + canvasOffsetTop));
			toolDrawCtx.stroke();

			// 3. DRAW THE HADLES
			toolDrawCtx.fillStyle = "rgba(255, 255, 255, 1)";
			
			var crop_rect_center_width = ((squareSelectionRect.x + parseInt(squareSelectionRect.width/2) * (globalZoom/100) + 0.5 + canvasOffsetLeft));
			var crop_rect_center_height = ((squareSelectionRect.y + parseInt(squareSelectionRect.height/2) * (globalZoom/100) + 0.5 + canvasOffsetTop));
			
			// draw top handle
			// width 16px, height 4px, vertical center on the vertical center line of the crop rect , top aligned with top of crop rect
			toolDrawCtx.fillRect(crop_rect_center_width - 8, (squareSelectionRect.y * (globalZoom/100) + 0.5 + canvasOffsetTop), 16, 4);

			// draw bottom handle
			// width 16px, height 4px, vertical center on the vertical center line of the crop rect , top aligned with top of crop rect
			toolDrawCtx.fillRect(crop_rect_center_width - 8, ((squareSelectionRect.y + squareSelectionRect.height - 4) * (globalZoom/100) + 0.5 + canvasOffsetTop), 16, 4);
			
			// draw right handle
			// width 4px, height 16px, left edge on left edge of crop rect
			toolDrawCtx.fillRect(((squareSelectionRect.x + squareSelectionRect.width - 4) * (globalZoom/100) + 0.5 + canvasOffsetLeft), crop_rect_center_height - 8, 4, 16);

			// draw left handle
			// width 4px, height 16px, left edge on left edge of crop rect
			toolDrawCtx.fillRect(((squareSelectionRect.x) * (globalZoom/100) + 0.5 + canvasOffsetLeft), crop_rect_center_height - 8, 4, 16);
			
			// draw top left corner handle
			toolDrawCtx.beginPath();
			toolDrawCtx.moveTo((squareSelectionRect.x * (globalZoom/100) + 0.5 + canvasOffsetLeft), ((squareSelectionRect.y) * (globalZoom/100) + 0.5 + canvasOffsetTop));
			toolDrawCtx.lineTo((squareSelectionRect.x * (globalZoom/100) + 0.5 + canvasOffsetLeft), ((squareSelectionRect.y + 16) * (globalZoom/100) + 0.5 + canvasOffsetTop));
			toolDrawCtx.lineTo(((squareSelectionRect.x + 4) * (globalZoom/100) + 0.5 + canvasOffsetLeft), ((squareSelectionRect.y + 16) * (globalZoom/100) + 0.5 + canvasOffsetTop));
			toolDrawCtx.lineTo(((squareSelectionRect.x + 4) * (globalZoom/100) + 0.5 + canvasOffsetLeft), ((squareSelectionRect.y + 4) * (globalZoom/100) + 0.5 + canvasOffsetTop));
			toolDrawCtx.lineTo(((squareSelectionRect.x + 16) * (globalZoom/100) + 0.5 + canvasOffsetLeft), ((squareSelectionRect.y + 4) * (globalZoom/100) + 0.5 + canvasOffsetTop));
			toolDrawCtx.lineTo(((squareSelectionRect.x + 16) * (globalZoom/100) + 0.5 + canvasOffsetLeft), ((squareSelectionRect.y) * (globalZoom/100) + 0.5 + canvasOffsetTop));
			toolDrawCtx.fill();	

			// draw bottom left corner handle
			toolDrawCtx.beginPath();
			toolDrawCtx.moveTo((squareSelectionRect.x * (globalZoom/100) + 0.5 + canvasOffsetLeft), ((squareSelectionRect.y + squareSelectionRect.height - 16) * (globalZoom/100) + 0.5 + canvasOffsetTop));
			toolDrawCtx.lineTo((squareSelectionRect.x * (globalZoom/100) + 0.5 + canvasOffsetLeft), ((squareSelectionRect.y + squareSelectionRect.height) * (globalZoom/100) + 0.5 + canvasOffsetTop));
			toolDrawCtx.lineTo(((squareSelectionRect.x + 16) * (globalZoom/100) + 0.5 + canvasOffsetLeft), ((squareSelectionRect.y + squareSelectionRect.height) * (globalZoom/100) + 0.5 + canvasOffsetTop));
			toolDrawCtx.lineTo(((squareSelectionRect.x + 16) * (globalZoom/100) + 0.5 + canvasOffsetLeft), ((squareSelectionRect.y + squareSelectionRect.height - 4) * (globalZoom/100) + 0.5 + canvasOffsetTop));
			toolDrawCtx.lineTo(((squareSelectionRect.x + 4) * (globalZoom/100) + 0.5 + canvasOffsetLeft), ((squareSelectionRect.y + squareSelectionRect.height - 4) * (globalZoom/100) + 0.5 + canvasOffsetTop));
			toolDrawCtx.lineTo(((squareSelectionRect.x + 4) * (globalZoom/100) + 0.5 + canvasOffsetLeft), ((squareSelectionRect.y + squareSelectionRect.height - 16) * (globalZoom/100) + 0.5 + canvasOffsetTop));
			toolDrawCtx.fill();	

			// draw top right corner handle
			toolDrawCtx.beginPath();
			toolDrawCtx.moveTo(((squareSelectionRect.x + squareSelectionRect.width)  * (globalZoom/100) + 0.5 + canvasOffsetLeft), ((squareSelectionRect.y) * (globalZoom/100) + 0.5 + canvasOffsetTop));
			toolDrawCtx.lineTo(((squareSelectionRect.x + squareSelectionRect.width)  * (globalZoom/100) + 0.5 + canvasOffsetLeft), ((squareSelectionRect.y + 16) * (globalZoom/100) + 0.5 + canvasOffsetTop));
			toolDrawCtx.lineTo(((squareSelectionRect.x + squareSelectionRect.width - 4)  * (globalZoom/100) + 0.5 + canvasOffsetLeft), ((squareSelectionRect.y + 16) * (globalZoom/100) + 0.5 + canvasOffsetTop));
			toolDrawCtx.lineTo(((squareSelectionRect.x + squareSelectionRect.width - 4)  * (globalZoom/100) + 0.5 + canvasOffsetLeft), ((squareSelectionRect.y + 4) * (globalZoom/100) + 0.5 + canvasOffsetTop));
			toolDrawCtx.lineTo(((squareSelectionRect.x + squareSelectionRect.width - 16)  * (globalZoom/100) + 0.5 + canvasOffsetLeft), ((squareSelectionRect.y + 4) * (globalZoom/100) + 0.5 + canvasOffsetTop));
			toolDrawCtx.lineTo(((squareSelectionRect.x + squareSelectionRect.width - 16)  * (globalZoom/100) + 0.5 + canvasOffsetLeft), ((squareSelectionRect.y) * (globalZoom/100) + 0.5 + canvasOffsetTop));
			toolDrawCtx.fill();

			// draw bottom right corner handle
			toolDrawCtx.beginPath();
			toolDrawCtx.moveTo(((squareSelectionRect.x + squareSelectionRect.width)  * (globalZoom/100) + 0.5 + canvasOffsetLeft), ((squareSelectionRect.y + squareSelectionRect.height) * (globalZoom/100) + 0.5 + canvasOffsetTop));
			toolDrawCtx.lineTo(((squareSelectionRect.x + squareSelectionRect.width)  * (globalZoom/100) + 0.5 + canvasOffsetLeft), ((squareSelectionRect.y + squareSelectionRect.height - 16) * (globalZoom/100) + 0.5 + canvasOffsetTop));
			toolDrawCtx.lineTo(((squareSelectionRect.x + squareSelectionRect.width - 4)  * (globalZoom/100) + 0.5 + canvasOffsetLeft), ((squareSelectionRect.y + squareSelectionRect.height - 16) * (globalZoom/100) + 0.5 + canvasOffsetTop));
			toolDrawCtx.lineTo(((squareSelectionRect.x + squareSelectionRect.width - 4)  * (globalZoom/100) + 0.5 + canvasOffsetLeft), ((squareSelectionRect.y + squareSelectionRect.height - 4) * (globalZoom/100) + 0.5 + canvasOffsetTop));
			toolDrawCtx.lineTo(((squareSelectionRect.x + squareSelectionRect.width - 16)  * (globalZoom/100) + 0.5 + canvasOffsetLeft), ((squareSelectionRect.y + squareSelectionRect.height - 4) * (globalZoom/100) + 0.5 + canvasOffsetTop));
			toolDrawCtx.lineTo(((squareSelectionRect.x + squareSelectionRect.width - 16)  * (globalZoom/100) + 0.5 + canvasOffsetLeft), ((squareSelectionRect.y + squareSelectionRect.height) * (globalZoom/100) + 0.5 + canvasOffsetTop));

			toolDrawCtx.fill();				
			
		}
		
		toolDrawCtx.restore();
	}
	
	toolDrawCtx.restore();
		
}

function setDimensionLabel(top, left, width, height){
	/*
	top = 5000;
	height = 5000;
	left = 5000;
	width = 50000;
	*/
	dimensionLbl.innerText = "top: " + top + ", left: " + left + ", w: " + width + ", h: " + height;
}

function fitCanvas(){

	squareSelectionRect.x = parseInt(squareSelectionRect.x);
	squareSelectionRect.y = parseInt(squareSelectionRect.y);
	squareSelectionRect.width = parseInt(squareSelectionRect.width);
	squareSelectionRect.height = parseInt(squareSelectionRect.height);

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

	// console.log(JSON.stringify(squareSelectionRect));
	
}

// Used to set the cursor based on the resize handle that was hovered
function setCropBoxResizeHandleCursor(mouseX, mouseY, squareSelectionRect, resizehandlewidth){

	var noResizeHandle = true;

	// 1. TOP RESIZE HANDLE - Create a rect for the top resize handle
	var topResizeHandleRect = resizeHandleGenerator.create_Top_ResizeHandleRect(squareSelectionRect, resizehandlewidth);
	if(checkInRect(mouseX, mouseY, topResizeHandleRect)){
		//console.log("start dragging top side");
		workspaceContainerDiv.style.cursor = "ns-resize";
		noResizeHandle = false;
	}
	
	// 2. TOP RIGHT CORNER RESIZE HANDLE - Create a rect for the top right corner resize handle
	var top_Right_ResizeHandleRect = resizeHandleGenerator.create_Top_Right_ResizeHandleRect(squareSelectionRect, resizehandlewidth);
	if(checkInRect(mouseX, mouseY, top_Right_ResizeHandleRect)){
		// console.log("start dragging top right corner");
		workspaceContainerDiv.style.cursor = "nesw-resize";
		noResizeHandle = false;
	}
	
	
	// 3. RIGHT RESIZE HANDLE - Create a rect for the right side resize handle
	var rightResizeHandleRect = resizeHandleGenerator.create_Right_ResizeHandleRect(squareSelectionRect, resizehandlewidth);
	if(checkInRect(mouseX, mouseY, rightResizeHandleRect)){
		// console.log("start dragging right side");
		workspaceContainerDiv.style.cursor = "ew-resize";
		noResizeHandle = false;
	}
	
	
	// 4. BOTTOM RIGHT RESIZE HANDLE - Create a rect for the right side resize handle
	var bottom_Right_ResizeHandleRect = resizeHandleGenerator.create_Bottom_Right_ResizeHandleRect(squareSelectionRect, resizehandlewidth);
	if(checkInRect(mouseX, mouseY, bottom_Right_ResizeHandleRect)){
		// console.log("start dragging bottom right corner");
		workspaceContainerDiv.style.cursor = "nwse-resize";
		noResizeHandle = false;
	}
	
	
	// 5. BOTTOM RESIZE HANDLE - Create a rect for the top resize handle
	var bottomResizeHandleRect = resizeHandleGenerator.create_Bottom_ResizeHandleRect(squareSelectionRect, resizehandlewidth);
	if(checkInRect(mouseX, mouseY, bottomResizeHandleRect)){
		//console.log("start dragging bottom side");
		workspaceContainerDiv.style.cursor = "ns-resize";
		noResizeHandle = false;
	}

	
	// 6. BOTTOM LEFT CORNER RESIZE HANDLE - Create a rect for the right side resize handle
	var bottom_Left_ResizeHandleRect = resizeHandleGenerator.create_Bottom_Left_ResizeHandleRect(squareSelectionRect, resizehandlewidth);
	if(checkInRect(mouseX, mouseY, bottom_Left_ResizeHandleRect)){
		// console.log("start dragging bottom left corner");
		workspaceContainerDiv.style.cursor = "nesw-resize";
		noResizeHandle = false;
	}
	
	
	// 7. LEFT RESIZE HANDLE - Create a rect for the right side resize handle
	var leftResizeHandleRect = resizeHandleGenerator.create_Left_ResizeHandleRect(squareSelectionRect, resizehandlewidth);
	if(checkInRect(mouseX, mouseY, leftResizeHandleRect)){
		// console.log("start dragging left side");
		workspaceContainerDiv.style.cursor = "ew-resize";
		noResizeHandle = false;
	}
	
	
	// 8. TOP LEFT CORNER RESIZE HANDLE - Create a rect for the right side resize handle
	var top_Left_ResizeHandleRect = resizeHandleGenerator.create_Top_Left_ResizeHandleRect(squareSelectionRect, resizehandlewidth);
	if(checkInRect(mouseX, mouseY, top_Left_ResizeHandleRect)){
		// console.log("start dragging top left corner");
		workspaceContainerDiv.style.cursor = "nwse-resize";
		noResizeHandle = false;
	}
	
	// 9. check if in the inner drag box
	var innerDragRect = resizeHandleGenerator.create_Inner_Drag_HandleRect(squareSelectionRect, resizehandlewidth);
	if(checkInRect(mouseX, mouseY, innerDragRect)){
		//console.log("inside crop drag");
		workspaceContainerDiv.style.cursor = "move";
	}
	
	// 10. if cursur is outside the crop rectangle set cursor to normal
	if(!checkInRect(mouseX, mouseY, squareSelectionRect)){
		//console.log("inside crop drag");
		workspaceContainerDiv.style.cursor = "default";		
	}
	
}

// Checks which resize handle was pressed and sets the flag to to resize or move the selection box
// based on the flag
function checkCropboxResizeHandlePress(mouseX, mouseY, squareSelectionRect, resizehandlewidth){

	//console.log("mouseX:" + mouseX + "," + " mouseY:" + mouseY + ", " +JSON.stringify(squareSelectionRect));

	lastdragPoint.x = mouseX;
	lastdragPoint.y = mouseY;

	// 1. TOP RESIZE HANDLE - Create a rect for the top resize handle
	var topResizeHandleRect = resizeHandleGenerator.create_Top_ResizeHandleRect(squareSelectionRect, resizehandlewidth);
	if(checkInRect(mouseX, mouseY, topResizeHandleRect)){
		console.log("start dragging top side");
		resetAllCropBoxTransformFlags();
		dragTopResize = true;
	}
	
	// 2. TOP RIGHT CORNER RESIZE HANDLE - Create a rect for the top right corner resize handle
	var top_Right_ResizeHandleRect = resizeHandleGenerator.create_Top_Right_ResizeHandleRect(squareSelectionRect, resizehandlewidth);
	// Test view to see the rect
	// drawTestBox(top_Right_ResizeHandleRect,"rgb(0, 255, 0)");
	if(checkInRect(mouseX, mouseY, top_Right_ResizeHandleRect)){
		console.log("start dragging top right corner");
		resetAllCropBoxTransformFlags();
		dragTopRightResize = true;
	}
	
	// 3. RIGHT RESIZE HANDLE - Create a rect for the right side resize handle
	var rightResizeHandleRect = resizeHandleGenerator.create_Right_ResizeHandleRect(squareSelectionRect, resizehandlewidth);
	// Test view to see the rect
	// drawTestBox(rightResizeHandleRect,"rgb(0, 0, 255)");
	if(checkInRect(mouseX, mouseY, rightResizeHandleRect)){
		console.log("start dragging right side");
		resetAllCropBoxTransformFlags();
		dragRightResize = true;
	}
	

	// 4. BOTTOM RIGHT RESIZE HANDLE - Create a rect for the right side resize handle
	var bottom_Right_ResizeHandleRect = resizeHandleGenerator.create_Bottom_Right_ResizeHandleRect(squareSelectionRect, resizehandlewidth);
	// Test view to see the rect
	// drawTestBox(bottom_Right_ResizeHandleRect,"pink");
	if(checkInRect(mouseX, mouseY, bottom_Right_ResizeHandleRect)){
		console.log("start dragging bottom right corner");
		resetAllCropBoxTransformFlags();
		dragBottomRightResize = true;
	}

	// 5. BOTTOM RESIZE HANDLE - Create a rect for the top resize handle
	var bottomResizeHandleRect = resizeHandleGenerator.create_Bottom_ResizeHandleRect(squareSelectionRect, resizehandlewidth);
	// Test view to see the rect
	// drawTestBox(bottomResizeHandleRect,"yellow");
	if(checkInRect(mouseX, mouseY, bottomResizeHandleRect)){
		//console.log("start dragging bottom side");
		resetAllCropBoxTransformFlags();
		dragBottomResize = true;
	}
	

	// 6. BOTTOM LEFT CORNER RESIZE HANDLE - Create a rect for the right side resize handle
	var bottom_Left_ResizeHandleRect = resizeHandleGenerator.create_Bottom_Left_ResizeHandleRect(squareSelectionRect, resizehandlewidth);
	// Test view to see the rect
	// drawTestBox(bottom_Left_ResizeHandleRect,"orange");
	if(checkInRect(mouseX, mouseY, bottom_Left_ResizeHandleRect)){
		console.log("start dragging bottom left corner");
		resetAllCropBoxTransformFlags();
		dragBottomLeftResize = true;
	}
	
	// 7. LEFT RESIZE HANDLE - Create a rect for the right side resize handle
	var leftResizeHandleRect = resizeHandleGenerator.create_Left_ResizeHandleRect(squareSelectionRect, resizehandlewidth);
	// Test view to see the rect
	// drawTestBox(leftResizeHandleRect,"violet");
	if(checkInRect(mouseX, mouseY, leftResizeHandleRect)){
		console.log("start dragging left side");
		resetAllCropBoxTransformFlags();
		dragLeftResize = true;
	}
	

	// 8. TOP LEFT CORNER RESIZE HANDLE - Create a rect for the right side resize handle
	var top_Left_ResizeHandleRect = resizeHandleGenerator.create_Top_Left_ResizeHandleRect(squareSelectionRect, resizehandlewidth);
	// Test view to see the rect
	// drawTestBox(top_Left_ResizeHandleRect,"grey");
	if(checkInRect(mouseX, mouseY, top_Left_ResizeHandleRect)){
		console.log("start dragging top left corner");
		resetAllCropBoxTransformFlags();
		dragTopLeftResize = true;
	}
	
	// 9. check if in the inner drag box
	var innerDragRect = resizeHandleGenerator.create_Inner_Drag_HandleRect(squareSelectionRect, resizehandlewidth);
	if(checkInRect(mouseX, mouseY, innerDragRect)){
		//console.log("inside crop rect");
		resetAllCropBoxTransformFlags();
		dragCropBox = true;
	}
	
	
}

function checkDraggingResize(mouseX, mouseY){

	//console.log(mouseX - lastdragPoint.x, mouseY - lastdragPoint.y);
	
	var dragX = parseInt(mouseX - lastdragPoint.x);
	var dragY = parseInt(mouseY - lastdragPoint.y);

	// *IMPORTANT - testRect will be used to hold a copy of squareSelectionRect
	// This is done so that we can apply and test the transformation of 
	// squareSelectionRect before altering it.
	var testRect = new Object();
	testRect.x = squareSelectionRect.x;
	testRect.y = squareSelectionRect.y;
	testRect.width = squareSelectionRect.width;
	testRect.height = squareSelectionRect.height;
	
	if(dragCropBox){

		// Apply move drag to crop box
		testRect.x = parseInt(testRect.x) + parseInt(dragX);	
		testRect.y = parseInt(testRect.y) + parseInt(dragY);	
		
		if(aspectRatio.width == -1 || aspectRatio.height == -1){
		
			// FREE UNFIXED ASPECT RATIO JUST APPLY CHANGES
			// check if the resized crop rect is in the bounds of the 

			squareSelectionRect.x = testRect.x;
			squareSelectionRect.y = testRect.y;
			squareSelectionRect.width = testRect.width;
			squareSelectionRect.height = testRect.height;				


		}else{
		
			// THERE IS AN ASPECT RATIO PRESENT
			// If crop box goes over box of canvas don't apply
			if(EditorUtils.checkInBounds(testRect, canvasWidth, canvasHeight)){
				// The test box is bounded by the canvas so the Aspect ratio resize 
				// can be applied to the crop box 
				squareSelectionRect.x = testRect.x;
				squareSelectionRect.y = testRect.y;
				squareSelectionRect.width = testRect.width;
				squareSelectionRect.height = testRect.height;				
			}	
			
		}

	}
	
	
	// Dragging the top handle
	if(dragTopResize){
	
		// Apply top resize to the testRect
		testRect.y = parseInt(testRect.y) + parseInt(dragY);
		testRect.height = parseInt(testRect.height) - parseInt(dragY);
	
		if(aspectRatio.width == -1 || aspectRatio.height == -1){
		
			// FREE UNFIXED ASPECT RATIO JUST APPLY CHANGES
			// check if the resized crop rect is in the bounds of the 

			squareSelectionRect.x = testRect.x;
			squareSelectionRect.y = testRect.y;
			squareSelectionRect.width = testRect.width;
			squareSelectionRect.height = testRect.height;				


		}else if(aspectRatio.width == aspectRatio.height){
		
			// SQUARE CROP BOX (1:1)	
			
			// since we drag altered the height, and since we have an equal aspect ratio 
			// set the width equal to the height
			testRect.width = testRect.height;
			
			// check if the resized crop rect is in the bounds of the 
			if(EditorUtils.checkInBounds(testRect, canvasWidth, canvasHeight)){
				// The test box is bounded by the canvas so the Aspect ratio resize 
				// can be applied to the crop box 
				squareSelectionRect.x = testRect.x;
				squareSelectionRect.y = testRect.y;
				squareSelectionRect.width = testRect.width;
				squareSelectionRect.height = testRect.height;				
			}
			
		}else{
		
			// ALL OTHER ASPECT RATIO

			// since we drag altered the height, determine the with from the aspect ratio
			testRect.width = testRect.height*(aspectRatio.width/aspectRatio.height);
			
			// check if the resized crop rect is in the bounds of the 
			if(EditorUtils.checkInBounds(testRect, canvasWidth, canvasHeight)){
				// The test box is bounded by the canvas so the Aspect ratio resize 
				// can be applied to the crop box 
				squareSelectionRect.x = testRect.x;
				squareSelectionRect.y = testRect.y;
				squareSelectionRect.width = testRect.width;
				squareSelectionRect.height = testRect.height;				
			}
		
		}
		
	}
	
	if(dragTopRightResize){
	
		// Apply the top-right resize to testRect
		testRect.width = parseInt(testRect.width) + parseInt(dragX);
		testRect.y = parseInt(testRect.y) + parseInt(dragY);
		testRect.height = parseInt(testRect.height) - parseInt(dragY);
	
		if(aspectRatio.width == -1 || aspectRatio.height == -1){
		
			// FREE UNFIXED ASPECT RATIO JUST APPLY CHANGES
			// check if the resized crop rect is in the bounds of the 

			squareSelectionRect.x = testRect.x;
			squareSelectionRect.y = testRect.y;
			squareSelectionRect.width = testRect.width;
			squareSelectionRect.height = testRect.height;				


		}else if(aspectRatio.width == aspectRatio.height){
		
			// SQUARE CROP BOX (1:1)	
			
			// set the width equal to the height
			testRect.height = testRect.width;
			
			// check if the resized crop rect is in the bounds of the 
			if(EditorUtils.checkInBounds(testRect, canvasWidth, canvasHeight)){
				// The test box is bounded by the canvas so the Aspect ratio resize 
				// can be applied to the crop box 
				squareSelectionRect.x = testRect.x;
				squareSelectionRect.y = testRect.y;
				squareSelectionRect.width = testRect.width;
				squareSelectionRect.height = testRect.height;				
			}
			
		}else{
		
			// ALL OTHER ASPECT RATIO

			// since we drag altered both the height and width, determine the anyone from either from the aspect ratio
			testRect.width = testRect.height*(aspectRatio.width/aspectRatio.height);
			// below causes erratic behaviour of the resized box
			//testRect.height = testRect.width*(aspectRatio.height/aspectRatio.width);
			
			// check if the resized crop rect is in the bounds of the 
			if(EditorUtils.checkInBounds(testRect, canvasWidth, canvasHeight)){
				// The test box is bounded by the canvas so the Aspect ratio resize 
				// can be applied to the crop box 
				squareSelectionRect.x = testRect.x;
				squareSelectionRect.y = testRect.y;
				squareSelectionRect.width = testRect.width;
				squareSelectionRect.height = testRect.height;				
			}
		
		}
		
	}
	
	if(dragRightResize){
	
		// Apply the right drag resize to testRect
		testRect.width = parseInt(squareSelectionRect.width) + parseInt(dragX);
			
		if(aspectRatio.width == -1 || aspectRatio.height == -1){
		
			// FREE UNFIXED ASPECT RATIO JUST APPLY CHANGES
			// check if the resized crop rect is in the bounds of the 

			squareSelectionRect.x = testRect.x;
			squareSelectionRect.y = testRect.y;
			squareSelectionRect.width = testRect.width;
			squareSelectionRect.height = testRect.height;				


		}else if(aspectRatio.width == aspectRatio.height){
		
			// SQUARE CROP BOX (1:1)	
			
			// set the width equal to the height
			testRect.height = testRect.width;
			
			// check if the resized crop rect is in the bounds of the 
			if(EditorUtils.checkInBounds(testRect, canvasWidth, canvasHeight)){
				// The test box is bounded by the canvas so the Aspect ratio resize 
				// can be applied to the crop box 
				squareSelectionRect.x = testRect.x;
				squareSelectionRect.y = testRect.y;
				squareSelectionRect.width = testRect.width;
				squareSelectionRect.height = testRect.height;				
			}
			
		}else{
		
			// ALL OTHER ASPECT RATIO

			// since we drag altered the width, determine the height from the aspect ratio
			testRect.height = testRect.width*(aspectRatio.height/aspectRatio.width);
			
			// check if the resized crop rect is in the bounds of the 
			if(EditorUtils.checkInBounds(testRect, canvasWidth, canvasHeight)){
				// The test box is bounded by the canvas so the Aspect ratio resize 
				// can be applied to the crop box 
				squareSelectionRect.x = testRect.x;
				squareSelectionRect.y = testRect.y;
				squareSelectionRect.width = testRect.width;
				squareSelectionRect.height = testRect.height;				
			}
		
		}
		
	}
	
	if(dragBottomRightResize){

		// Apply the bottom-right drag resize to testRect
		testRect.width = parseInt(testRect.width) + parseInt(dragX);
		testRect.height = parseInt(testRect.height) + parseInt(dragY);
		
		if(aspectRatio.width == -1 || aspectRatio.height == -1){
		
			// FREE UNFIXED ASPECT RATIO JUST APPLY CHANGES
			// check if the resized crop rect is in the bounds of the 

			squareSelectionRect.x = testRect.x;
			squareSelectionRect.y = testRect.y;
			squareSelectionRect.width = testRect.width;
			squareSelectionRect.height = testRect.height;				


		}else if(aspectRatio.width == aspectRatio.height){
		
			// SQUARE CROP BOX (1:1)	
			
			// set the width equal to the height
			testRect.height = testRect.width;
			
			// check if the resized crop rect is in the bounds of the 
			if(EditorUtils.checkInBounds(testRect, canvasWidth, canvasHeight)){
				// The test box is bounded by the canvas so the Aspect ratio resize 
				// can be applied to the crop box 
				squareSelectionRect.x = testRect.x;
				squareSelectionRect.y = testRect.y;
				squareSelectionRect.width = testRect.width;
				squareSelectionRect.height = testRect.height;				
			}
			
		}else{
		
			// ALL OTHER ASPECT RATIO

			// since we drag altered the width, determine the height from the aspect ratio
			testRect.height = testRect.width*(aspectRatio.height/aspectRatio.width);
			// below causes erratic behaviour of the resized box
			//testRect.height = testRect.width*(aspectRatio.height/aspectRatio.width);
			
			// check if the resized crop rect is in the bounds of the 
			if(EditorUtils.checkInBounds(testRect, canvasWidth, canvasHeight)){
				// The test box is bounded by the canvas so the Aspect ratio resize 
				// can be applied to the crop box 
				squareSelectionRect.x = testRect.x;
				squareSelectionRect.y = testRect.y;
				squareSelectionRect.width = testRect.width;
				squareSelectionRect.height = testRect.height;				
			}
		
		}
		
	}

	if(dragBottomResize){
		

		// Apply bottom drag resize to testRect
		testRect.height = parseInt(squareSelectionRect.height) + parseInt(dragY);
		
		if(aspectRatio.width == -1 || aspectRatio.height == -1){
		
			// FREE UNFIXED ASPECT RATIO JUST APPLY CHANGES
			// check if the resized crop rect is in the bounds of the 

			squareSelectionRect.x = testRect.x;
			squareSelectionRect.y = testRect.y;
			squareSelectionRect.width = testRect.width;
			squareSelectionRect.height = testRect.height;				


		}else if(aspectRatio.width == aspectRatio.height){
		
			// SQUARE CROP BOX (1:1)	
			
			// since we drag altered the height, and since we have an equal aspect ratio 
			// set the width equal to the height
			testRect.width = testRect.height;
			
			// check if the resized crop rect is in the bounds of the 
			if(EditorUtils.checkInBounds(testRect, canvasWidth, canvasHeight)){
				// The test box is bounded by the canvas so the Aspect ratio resize 
				// can be applied to the crop box 
				squareSelectionRect.x = testRect.x;
				squareSelectionRect.y = testRect.y;
				squareSelectionRect.width = testRect.width;
				squareSelectionRect.height = testRect.height;				
			}
			
		}else{
		
			// ALL OTHER ASPECT RATIO

			// since we drag altered the height, determine the with from the aspect ratio
			testRect.width = testRect.height*(aspectRatio.width/aspectRatio.height);
			
			// check if the resized crop rect is in the bounds of the 
			if(EditorUtils.checkInBounds(testRect, canvasWidth, canvasHeight)){
				// The test box is bounded by the canvas so the Aspect ratio resize 
				// can be applied to the crop box 
				squareSelectionRect.x = testRect.x;
				squareSelectionRect.y = testRect.y;
				squareSelectionRect.width = testRect.width;
				squareSelectionRect.height = testRect.height;				
			}
		
		}
		
	}
	
	if(dragBottomLeftResize){
	
		// Apply bottom-left resize to testRect
		testRect.x = parseInt(testRect.x) + parseInt(dragX);
		testRect.width = parseInt(testRect.width) - parseInt(dragX);
		testRect.height = parseInt(testRect.height) + parseInt(dragY);
	
		if(aspectRatio.width == -1 || aspectRatio.height == -1){
		
			// FREE UNFIXED ASPECT RATIO JUST APPLY CHANGES
			// check if the resized crop rect is in the bounds of the 

			squareSelectionRect.x = testRect.x;
			squareSelectionRect.y = testRect.y;
			squareSelectionRect.width = testRect.width;
			squareSelectionRect.height = testRect.height;				


		}else if(aspectRatio.width == aspectRatio.height){
		
			// SQUARE CROP BOX (1:1)	
			
			// set the width equal to the height
			testRect.height = testRect.width;
			
			// check if the resized crop rect is in the bounds of the 
			if(EditorUtils.checkInBounds(testRect, canvasWidth, canvasHeight)){
				// The test box is bounded by the canvas so the Aspect ratio resize 
				// can be applied to the crop box 
				squareSelectionRect.x = testRect.x;
				squareSelectionRect.y = testRect.y;
				squareSelectionRect.width = testRect.width;
				squareSelectionRect.height = testRect.height;				
			}
			
		}else{
		
			// ALL OTHER ASPECT RATIO

			// since we drag altered the width, determine the height from the aspect ratio
			testRect.height = testRect.width*(aspectRatio.height/aspectRatio.width);
			// below causes erratic behaviour of the resized box
			//testRect.height = testRect.width*(aspectRatio.height/aspectRatio.width);
			
			// check if the resized crop rect is in the bounds of the 
			if(EditorUtils.checkInBounds(testRect, canvasWidth, canvasHeight)){
				// The test box is bounded by the canvas so the Aspect ratio resize 
				// can be applied to the crop box 
				squareSelectionRect.x = testRect.x;
				squareSelectionRect.y = testRect.y;
				squareSelectionRect.width = testRect.width;
				squareSelectionRect.height = testRect.height;				
			}
		
		}
		
	}
	
	if(dragLeftResize){
	
		// Apply the left drag resize to the testRect
		testRect.x = parseInt(testRect.x) + parseInt(dragX);
		testRect.width = parseInt(testRect.width) - parseInt(dragX);
			
		if(aspectRatio.width == -1 || aspectRatio.height == -1){
		
			// FREE UNFIXED ASPECT RATIO JUST APPLY CHANGES
			// check if the resized crop rect is in the bounds of the 

			squareSelectionRect.x = testRect.x;
			squareSelectionRect.y = testRect.y;
			squareSelectionRect.width = testRect.width;
			squareSelectionRect.height = testRect.height;				


		}else if(aspectRatio.width == aspectRatio.height){
		
			// SQUARE CROP BOX (1:1)	
			
			// set the width equal to the height
			testRect.height = testRect.width;
			
			// check if the resized crop rect is in the bounds of the 
			if(EditorUtils.checkInBounds(testRect, canvasWidth, canvasHeight)){
				// The test box is bounded by the canvas so the Aspect ratio resize 
				// can be applied to the crop box 
				squareSelectionRect.x = testRect.x;
				squareSelectionRect.y = testRect.y;
				squareSelectionRect.width = testRect.width;
				squareSelectionRect.height = testRect.height;				
			}
			
		}else{
		
			// ALL OTHER ASPECT RATIO

			// since we drag altered the width, determine the height from the aspect ratio
			testRect.height = testRect.width*(aspectRatio.height/aspectRatio.width);
			
			// check if the resized crop rect is in the bounds of the 
			if(EditorUtils.checkInBounds(testRect, canvasWidth, canvasHeight)){
				// The test box is bounded by the canvas so the Aspect ratio resize 
				// can be applied to the crop box 
				squareSelectionRect.x = testRect.x;
				squareSelectionRect.y = testRect.y;
				squareSelectionRect.width = testRect.width;
				squareSelectionRect.height = testRect.height;				
			}
		
		}
			
	}
	
	if(dragTopLeftResize){
	
		// Apply top-left drag resize to testRect
		testRect.x = parseInt(testRect.x) + parseInt(dragX);
		testRect.width = parseInt(testRect.width) - parseInt(dragX);
		
		testRect.y = parseInt(testRect.y) + parseInt(dragY);
		testRect.height = parseInt(testRect.height) - parseInt(dragY);
	
		if(aspectRatio.width == -1 || aspectRatio.height == -1){
		
			// FREE UNFIXED ASPECT RATIO JUST APPLY CHANGES
			// check if the resized crop rect is in the bounds of the 

			squareSelectionRect.x = testRect.x;
			squareSelectionRect.y = testRect.y;
			squareSelectionRect.width = testRect.width;
			squareSelectionRect.height = testRect.height;				


		}else if(aspectRatio.width == aspectRatio.height){
		
			// SQUARE CROP BOX (1:1)	
			
			// set the width equal to the height
			testRect.height = testRect.width;
			
			// check if the resized crop rect is in the bounds of the 
			if(EditorUtils.checkInBounds(testRect, canvasWidth, canvasHeight)){
				// The test box is bounded by the canvas so the Aspect ratio resize 
				// can be applied to the crop box 
				squareSelectionRect.x = testRect.x;
				squareSelectionRect.y = testRect.y;
				squareSelectionRect.width = testRect.width;
				squareSelectionRect.height = testRect.height;				
			}
			
		}else{
		
			// ALL OTHER ASPECT RATIO

			// since we drag altered the width, determine the height from the aspect ratio
			testRect.height = testRect.width*(aspectRatio.height/aspectRatio.width);
			// below causes erratic behaviour of the resized box
			//testRect.width = testRect.height*(aspectRatio.width/aspectRatio.height);
			
			// check if the resized crop rect is in the bounds of the 
			if(EditorUtils.checkInBounds(testRect, canvasWidth, canvasHeight)){
				// The test box is bounded by the canvas so the Aspect ratio resize 
				// can be applied to the crop box 
				squareSelectionRect.x = testRect.x;
				squareSelectionRect.y = testRect.y;
				squareSelectionRect.width = testRect.width;
				squareSelectionRect.height = testRect.height;				
			}
		
		}
		
	}
	
	// make sure the swlwction rect fits the canvas
	//fitCanvas();
	
	// redraw the crop
	updateToolCanvas();
	
	lastdragPoint.x = mouseX;
	lastdragPoint.y = mouseY;

}

function resetAllCropBoxTransformFlags(){
	// Reset all drag flags to stop
	dragCropBox = false;
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

var resizeHandleGenerator = new Object();
resizeHandleGenerator.create_Top_ResizeHandleRect = function(squareSelectionRect, resizehandlewidth){
	var rect = new Object();
	rect.x = parseInt(squareSelectionRect.x + resizehandlewidth + 1);	// + 1 to not intersect with the top_left handle	
	rect.y = parseInt(squareSelectionRect.y);	
	rect.width = parseInt(squareSelectionRect.width - 2*resizehandlewidth - 2); // - 2 to not intersect with the top right handle
	rect.height = parseInt(resizehandlewidth);		
	return rect;
}
resizeHandleGenerator.create_Top_Right_ResizeHandleRect = function(squareSelectionRect, resizehandlewidth){
	var rect = new Object();
	rect.x = parseInt(squareSelectionRect.x + squareSelectionRect.width - resizehandlewidth);		
	rect.y = parseInt(squareSelectionRect.y);		
	rect.width = parseInt(resizehandlewidth);		
	rect.height = parseInt(resizehandlewidth);		
	return rect;
}
resizeHandleGenerator.create_Right_ResizeHandleRect = function(squareSelectionRect, resizehandlewidth){
	var rect = new Object();
	rect.x = parseInt(squareSelectionRect.x + squareSelectionRect.width - resizehandlewidth);		
	rect.y = parseInt(squareSelectionRect.y + resizehandlewidth + 1);		
	rect.width = parseInt(resizehandlewidth);	
	rect.height = parseInt(squareSelectionRect.height - 2*resizehandlewidth - 2);
	return rect;	
}
resizeHandleGenerator.create_Bottom_Right_ResizeHandleRect = function(squareSelectionRect, resizehandlewidth){
	var rect = new Object();
	rect.x = parseInt(squareSelectionRect.x + squareSelectionRect.width - resizehandlewidth);		
	rect.y = parseInt(squareSelectionRect.y + squareSelectionRect.height - resizehandlewidth);		
	rect.width = parseInt(resizehandlewidth);		
	rect.height = parseInt(resizehandlewidth);
	return rect;	
}
resizeHandleGenerator.create_Bottom_ResizeHandleRect = function(squareSelectionRect, resizehandlewidth){
	var rect = new Object();
	rect.x = parseInt(squareSelectionRect.x + resizehandlewidth + 1);	// + 1 to not intersect with the top_left handle	
	rect.y = parseInt(squareSelectionRect.y + squareSelectionRect.height - resizehandlewidth);
	rect.width = parseInt(squareSelectionRect.width - 2*resizehandlewidth - 2); // - 2 to not intersect with the top right handle
	rect.height = parseInt(resizehandlewidth);		
	return rect;	
}
resizeHandleGenerator.create_Bottom_Left_ResizeHandleRect = function(squareSelectionRect, resizehandlewidth){
	var rect = new Object();
	rect.x = parseInt(squareSelectionRect.x);		
	rect.y = parseInt(squareSelectionRect.y + squareSelectionRect.height - resizehandlewidth);		
	rect.width = parseInt(resizehandlewidth);		
	rect.height = parseInt(resizehandlewidth);	
	return rect;	
}
resizeHandleGenerator.create_Left_ResizeHandleRect = function(squareSelectionRect, resizehandlewidth){
	var rect = new Object();
	rect.x = parseInt(squareSelectionRect.x);		
	rect.y = parseInt(squareSelectionRect.y + resizehandlewidth + 1);		
	rect.width = parseInt(resizehandlewidth);		
	rect.height = parseInt(squareSelectionRect.height - 2*resizehandlewidth - 2);	
	return rect;	
}
resizeHandleGenerator.create_Top_Left_ResizeHandleRect = function(squareSelectionRect, resizehandlewidth){
	var rect = new Object();
	rect.x = parseInt(squareSelectionRect.x);		
	rect.y = parseInt(squareSelectionRect.y);		
	rect.width = parseInt(resizehandlewidth);		
	rect.height = parseInt(resizehandlewidth);	
	return rect;	
}

resizeHandleGenerator.create_Inner_Drag_HandleRect = function(squareSelectionRect, resizehandlewidth){
	var rect = new Object();
	rect.x = parseInt(squareSelectionRect.x) + parseInt(resizehandlewidth + 1);		
	rect.y = parseInt(squareSelectionRect.y) + parseInt(resizehandlewidth + 1);		
	rect.width = parseInt(squareSelectionRect.width - 2*resizehandlewidth - 2);		
	rect.height = parseInt(squareSelectionRect.height - 2*resizehandlewidth - 2);	
	return rect;	
}



function checkInRect(x,y,rect){
	//if(x >= rect.x && x <= (rect.x + rect.width) && y >= rect.y && y <= (rect.y + rect.height)){
	if(x >= parseInt(rect.x) && x <= (parseInt(rect.x) + parseInt(rect.width)) && y >= parseInt(rect.y) && y <= (parseInt(rect.y) + parseInt(rect.height))){
		return true;
	}else{
		return false;
	}
}


function KeyDownCheck(event){

	//alert(event.keyCode);

	// All CTRL Key Combinations
	if (event.ctrlKey) {
	
		// Undo - CTRL + Z
		if (event.keyCode == 90) {

		}
		
		// Redo with CTRL + Y
		if (event.keyCode == 89) {

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
   
   switch(KeyID)
   {
		case 13: // ENTER KEY
			// alert("enter key pressed");
			//console.log(JSON.stringify(activeSelectionArea));
		break;
		case 8: // BACKSPACE KEY
			

		break; 
		case 27: // ESCAPE KEY

		break;
		case 46: // DELETE KEY
			

			
		break;
		case 37: // LEFT KEY
			//alert("LEFT pressed");
			if(squareSelectionRect.width > 0 && squareSelectionRect.height > 0){
				//console.log("move left");
				squareSelectionRect.x -= 1;
				fitCanvas();
				updateToolCanvas();
			}
		break;		
		case 38: // UP KEY
			// negative up because of top, left origin coordinates
			squareSelectionRect.y -= 1;
			fitCanvas();
			updateToolCanvas();
		break;	
		case 39: // RIGHT KEY
			//alert("RIGHT pressed");
			squareSelectionRect.x += 1;
			fitCanvas();
			updateToolCanvas();
		break;
		case 40: // DOWN KEY
			// down positive y because of top, left origin coordinates
			squareSelectionRect.y += 1;
			fitCanvas();
			updateToolCanvas();
		break;	
		default:
		break;
   }
}

function KeyUpCheck(event){
	//alert(event.keyCode);

	// All CTRL Key Combinations
	if (event.ctrlKey) {
	
		// Undo - CTRL + Z
		if (event.keyCode == 90) {

		}
		
		// Redo with CTRL + Y
		if (event.keyCode == 89) {

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
   
   switch(KeyID)
   {
		case 13: // ENTER KEY
			// alert("enter key pressed");
			
		break;
		case 8: // BACKSPACE KEY
			

		break; 
		case 27: // ESCAPE KEY

		break;
		case 46: // DELETE KEY
		
		break;
		case 37: // LEFT KEY
			//alert("LEFT pressed");

		break;		
		case 38: // UP KEY

		break;	
		case 39: // RIGHT KEY
			//alert("RIGHT pressed");

		break;
		case 40: // DOWN KEY
			// down positive y because of top, left origin coordinates

		break;	
		default:
		break;
   }
}


$("#testBtn").click(function() {
	alert("Clearing Local storage");
	//localStorage.removeItem("editor_image");
	localStorage.clear();
});