// Copyright (c) 2019 Kasey Thomas. All rights reserved.
// Use of this source code is governed by the EULA.

'use strict';

// the main image being edited
// var image = new Image();
// image.addEventListener("load", loadEditorImage, true);


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


// Stores the color of the pixel sampled in the canvas
var hexstr;

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


var canvaspressed = false;

var workspaceMouseX = 0; // used to hold coordinates with respect to the workspaceContainerDiv
var workspaceMouseY = 0; // used to hold coordinates with respect to the workspaceContainerDiv
var mouseX = 0;
var mouseY = 0;

var colorSetSelect = document.getElementById("colorSetSelect");
var rgbLbl = document.getElementById("rgbLbl");
var hsvLbl = document.getElementById("hsvLbl");
var hslLbl = document.getElementById("hslLbl");
var hexLbl = document.getElementById("hexLbl");
var copyColorValueBtn = document.getElementById("copyColorValueBtn");

var dragselection = false;
var lastdragPoint = {};

// check if all required modules are present (HTML5 Storage etc...)
initializeEditor();


// Events

// keyboard events
document.addEventListener("keydown", KeyCheck);

// file loader event
fileinput.addEventListener('input', function(){

	if(this.files.length > 0){
		// alert(this.files[0].name);
		loadFile(this.files[0]);	
	}

});

// Workspace mouse events

//workspaceContainerDiv.addEventListener("dblclick", function(e){
canvasDiv.addEventListener("dblclick", function(e){

	// *Nb. Don't apply editor canvas transformation mapping as we need actual pixel
	// point location in canvas to get pixel color
	EditorUtils.setMouseCoordinates(e, workspaceContainerDiv, false);

});

//workspaceContainerDiv.addEventListener("click", function(e){
canvasDiv.addEventListener("click", function(e){

	// *Nb. Don't apply editor canvas transformation mapping as we need actual pixel
	// point location in canvas to get pixel color
	EditorUtils.setMouseCoordinates(e, workspaceContainerDiv, false);

});

//workspaceContainerDiv.addEventListener("mousedown", function(e){
canvasDiv.addEventListener("mousedown", function(e){

	// *Nb. Don't apply editor canvas transformation mapping as we need actual pixel
	// point location in canvas to get pixel color
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
	
		/*
		if(mouseX < 0 || mouseY < 0 || mouseX > editorCanvas.width || mouseY > editorCanvas.height){
			return;
		}
		*/
		
		// get the color of editor canvas at the point
		var pixel = editorCtx.getImageData(mouseX, mouseY, 1, 1);
		var data = pixel.data;
		//var rgba = 'rgba(' + data[0] + ', ' + data[1] + ', ' + data[2] + ', ' + (data[3] / 255) + ')';
		hexstr = EditorUtils.rgbToHex(data[0], data[1], data[2]);
		
		// what color to set
		if(colorSetSelect.value == 0){
			// only show color values
		}else if(colorSetSelect.value == 1){
			// set the foregound color
			document.getElementById("foregroundColorBtnSwatch").style.fill = hexstr;
		}else if(colorSetSelect.value == 2){
			// set the background color
			document.getElementById("backgroundColorBtnSwatch").style.fill = hexstr;
		}
		
		EditorUtils.setColorPickerColorLabels(data[0], data[1], data[2] ,hexstr);
		/*
		rgbLbl.innerText = "RGB: (" + data[0] + ", " + data[1] + ", " + data[2] + ")";
		var hsv = EditorUtils.rgb2hsv(data[0],data[1],data[2]);
		hsvLbl.innerText = "HSV: (" + parseInt(hsv.h) + ", " + parseInt(hsv.s) + ", " + parseInt(hsv.v) + ")";
		var hsl = EditorUtils.rgbToHsl(data[0],data[1],data[2]);
		hslLbl.innerText = "HSL: (" + hsl.h + ", " + hsl.s + ", " + hsl.l + ")";
		hexLbl.innerText = "HEX: " + hexstr.toUpperCase();
		*/
		
		canvaspressed = true;
	}
	
});

//workspaceContainerDiv.addEventListener("mousemove", function(e){
canvasDiv.addEventListener("mousemove", function(e){

	// *Nb. Don't apply editor canvas transformation mapping as we need actual pixel
	// point location in canvas to get pixel color
	EditorUtils.setMouseCoordinates(e, workspaceContainerDiv, false);
	
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
	
		if(mouseX < 0 || mouseY < 0 || mouseX > editorCanvas.width || mouseY > editorCanvas.height){
			return;
		}
		
		if(canvaspressed){
			// get the color of editor canvas at the point
			var pixel = editorCtx.getImageData(mouseX, mouseY, 1, 1);
			var data = pixel.data;
			//var rgba = 'rgba(' + data[0] + ', ' + data[1] + ', ' + data[2] + ', ' + (data[3] / 255) + ')';
			hexstr = EditorUtils.rgbToHex(data[0], data[1], data[2]);

			// what color to set
			if(colorSetSelect.value == 0){
				// only show color values
			}else if(colorSetSelect.value == 1){
				// set the foregound color
				document.getElementById("foregroundColorBtnSwatch").style.fill = hexstr;
			}else if(colorSetSelect.value == 2){
				// set the background color
				document.getElementById("backgroundColorBtnSwatch").style.fill = hexstr;
			}
			
			EditorUtils.setColorPickerColorLabels(data[0], data[1], data[2] ,hexstr);
			/*
			rgbLbl.innerText = "RGB: (" + data[0] + ", " + data[1] + ", " + data[2] + ")";
			var hsv = EditorUtils.rgb2hsv(data[0],data[1],data[2]);
			hsvLbl.innerText = "HSV: (" + parseInt(hsv.h) + ", " + parseInt(hsv.s) + ", " + parseInt(hsv.v) + ")";
			var hsl = EditorUtils.rgbToHsl(data[0],data[1],data[2]);
			hslLbl.innerText = "HSL: (" + hsl.h + ", " + hsl.s + ", " + hsl.l + ")";
			hexLbl.innerText = "HEX: " + hexstr.toUpperCase();
			*/
		
		}
	}
	
});

//workspaceContainerDiv.addEventListener("mouseup", function(e){
canvasDiv.addEventListener("mouseup", function(e){

	// *Nb. Don't apply editor canvas transformation mapping as we need actual pixel
	// point location in canvas to get pixel color
	EditorUtils.setMouseCoordinates(e, workspaceContainerDiv, false);
	
	if(transformSelection){

		if(dragselection){
			EditorUtils.addMoveActiveSelectionEntry(activeSelectionArea);
			dragselection = false;
		}
	
	}else{
	
		canvaspressed = false;
		
		if(mouseX < 0 || mouseY < 0 || mouseX > editorCanvas.width || mouseY > editorCanvas.height){
			return;
		}
		
		// get the color of editor canvas at the point
		var pixel = editorCtx.getImageData(mouseX, mouseY, 1, 1);
		var data = pixel.data;
		//var rgba = 'rgba(' + data[0] + ', ' + data[1] + ', ' + data[2] + ', ' + (data[3] / 255) + ')';
		hexstr = EditorUtils.rgbToHex(data[0], data[1], data[2]);

		// what color to set
		if(colorSetSelect.value == 0){
			// only show color values
		}else if(colorSetSelect.value == 1){
			// set the foregound color
			document.getElementById("foregroundColorBtnSwatch").style.fill = hexstr;
			// moved to saveColor()
			//updateForegroundColor(hexstr);
		}else if(colorSetSelect.value == 2){
			// set the background color
			document.getElementById("backgroundColorBtnSwatch").style.fill = hexstr;
			// moved to saveColor()
			//updateBackgroundColor(hexstr);
		}
		
		// Save the color
		saveColor();
		
		EditorUtils.setColorPickerColorLabels(data[0], data[1], data[2] ,hexstr);
		/*
		rgbLbl.innerText = "RGB: (" + data[0] + ", " + data[1] + ", " + data[2] + ")";
		var hsv = EditorUtils.rgb2hsv(data[0],data[1],data[2]);
		hsvLbl.innerText = "HSV: (" + parseInt(hsv.h) + ", " + parseInt(hsv.s) + ", " + parseInt(hsv.v) + ")";
		var hsl = EditorUtils.rgbToHsl(data[0],data[1],data[2]);
		hslLbl.innerText = "HSL: (" + hsl.h + ", " + hsl.s + ", " + hsl.l + ")";
		hexLbl.innerText = "HEX: " + hexstr.toUpperCase();
		*/
	}
	
});


//workspaceContainerDiv.addEventListener("mouseleave", function(e){
canvasDiv.addEventListener("mouseleave", function(e){

	// *Nb. Don't apply editor canvas transformation mapping as we need actual pixel
	// point location in canvas to get pixel color
	EditorUtils.setMouseCoordinates(e, workspaceContainerDiv, false);
	
	// THIS SOLVES THE PROBLEM
	// If we leave the canvas before mouseup the last color would not be saved
	//console.log(mouseX, mouseY);
	// Since we already stored updated color hexstr in the mousemove event we just call saveColor
	// to store the color
	saveColor();
	
});

// store the color
function saveColor(){

	// what color to set
	if(colorSetSelect.value == 0){
		// only show color values
	}else if(colorSetSelect.value == 1){
		// set the foregound color
		updateForegroundColor(hexstr);
	}else if(colorSetSelect.value == 2){
		// set the background color
		updateBackgroundColor(hexstr);
	}
		
}

// Reset the color labels to the foreground or background when we change selection
colorSetSelect.addEventListener("change", function(e){
	setColorLabels();
});

copyColorValueBtn.addEventListener("click", function(e){
	//alert("show copy table");
	// Create a show a color popup
	
	var colorCopyPopupDiv = document.createElement("div");
	colorCopyPopupDiv.id = "colorCopyPopupDiv";
	colorCopyPopupDiv.style = "position: absolute; background-color: #f0f0f0; opacity: 0.97; border-radius: 5px; width: 200px; color: #333; box-shadow: 5px 5px 8px rgb(0,0,0,.2);";
	
		var colorCopyPopupBody = document.createElement("div");
		colorCopyPopupBody.style = "opacity: 1; padding: 12px;";
		//colorCopyPopupBody.appendChild(document.createTextNode("Click to copy color values"));
		
		// Create the title
			var colorCopyPopupTitle = document.createElement("span");
			colorCopyPopupTitle.style = "font-weight: normal;";
			colorCopyPopupTitle.appendChild(document.createTextNode("Click to copy color values"));
			colorCopyPopupBody.appendChild(colorCopyPopupTitle);
		
		// Create and attach RGB color button
			var rgbDiv = document.createElement("div");
			rgbDiv.style = "cursor: pointer; margin: 5px 0px 0px 0px; padding: 3px 0px; border: 1px solid #aaa; border-radius: 3px;";
			rgbDiv.appendChild(document.createTextNode(rgbLbl.innerText));
			rgbDiv.onclick = function(){
			
				//https://www.w3schools.com/howto/howto_js_copy_clipboard.asp
				
				// create a temporary text field to hold the value to copy
				var rgbCopyText = document.createElement("input");
				rgbCopyText.type = "text";
				rgbCopyText.value = rgbLbl.innerText.replace("RGB: ", "");
				document.body.appendChild(rgbCopyText);	

				/* Select the text field */
				rgbCopyText.select();

				/* Copy the text inside the text field */
				document.execCommand("copy");
				
				// Remove the temporary text element to copy from
				document.body.removeChild(rgbCopyText);
				
				// Close the color copy popup
				document.getElementById("colorCopyPopupDiv").parentNode.removeChild(document.getElementById("colorCopyPopupDiv"));

				/* Alert the copied text */
				//alert("RGB copied to clipboard");
				
			}
		colorCopyPopupBody.appendChild(rgbDiv);
		
		// Create and attach HSV color button
			var hsvDiv = document.createElement("div");
			hsvDiv.style = "cursor: pointer; margin: 5px 0px 0px 0px; padding: 3px 0px; border: 1px solid #aaa; border-radius: 3px;";
			hsvDiv.appendChild(document.createTextNode(hsvLbl.innerText));
			hsvDiv.onclick = function(){
			
				//https://www.w3schools.com/howto/howto_js_copy_clipboard.asp
				
				// create a temporary text field to hold the value to copy
				var hsvCopyText = document.createElement("input");
				hsvCopyText.type = "text";
				hsvCopyText.value = hsvLbl.innerText.replace("HSV: ", "");
				document.body.appendChild(hsvCopyText);	

				/* Select the text field */
				hsvCopyText.select();

				/* Copy the text inside the text field */
				document.execCommand("copy");
				
				// Remove the temporary text element to copy from
				document.body.removeChild(hsvCopyText);
				
				// Close the color copy popup
				document.getElementById("colorCopyPopupDiv").parentNode.removeChild(document.getElementById("colorCopyPopupDiv"));

				/* Alert the copied text */
				//alert("HSV copied to clipboard");
				
			}
		colorCopyPopupBody.appendChild(hsvDiv);
		
		// Create and attach HSL color button
			var hslDiv = document.createElement("div");
			hslDiv.style = "cursor: pointer; margin: 5px 0px 0px 0px; padding: 3px 0px; border: 1px solid #aaa; border-radius: 3px;";
			hslDiv.appendChild(document.createTextNode(hslLbl.innerText));
			hslDiv.onclick = function(){
			
				//https://www.w3schools.com/howto/howto_js_copy_clipboard.asp
				
				// create a temporary text field to hold the value to copy
				var hslCopyText = document.createElement("input");
				hslCopyText.type = "text";
				hslCopyText.value = hslLbl.innerText.replace("HSL: ", "");
				document.body.appendChild(hslCopyText);	

				/* Select the text field */
				hslCopyText.select();

				/* Copy the text inside the text field */
				document.execCommand("copy");
				
				// Remove the temporary text element to copy from
				document.body.removeChild(hslCopyText);
				
				// Close the color copy popup
				document.getElementById("colorCopyPopupDiv").parentNode.removeChild(document.getElementById("colorCopyPopupDiv"));

				/* Alert the copied text */
				//alert("HSL copied to clipboard");
				
			}
		colorCopyPopupBody.appendChild(hslDiv);
		
		// Create and attach HSL color button
			var hslDiv = document.createElement("div");
			hslDiv.style = "cursor: pointer; margin: 5px 0px 0px 0px; padding: 3px 0px; border: 1px solid #aaa; border-radius: 3px;";
			hslDiv.appendChild(document.createTextNode(hexLbl.innerText));
			hslDiv.onclick = function(){
			
				//https://www.w3schools.com/howto/howto_js_copy_clipboard.asp
				
				// create a temporary text field to hold the value to copy
				var hexCopyText = document.createElement("input");
				hexCopyText.type = "text";
				hexCopyText.value = hexLbl.innerText.replace("HEX: ", "");
				document.body.appendChild(hexCopyText);	

				/* Select the text field */
				hexCopyText.select();

				/* Copy the text inside the text field */
				document.execCommand("copy");
				
				// Remove the temporary text element to copy from
				document.body.removeChild(hexCopyText);
				
				// Close the color copy popup
				document.getElementById("colorCopyPopupDiv").parentNode.removeChild(document.getElementById("colorCopyPopupDiv"));

				/* Alert the copied text */
				//alert("HEX copied to clipboard");
				
			}
		colorCopyPopupBody.appendChild(hslDiv);
		
		
		
		// CLOSE POPUP button
		// Create and attach HSL color button
			var closeBtn = document.createElement("div");
			closeBtn.style = "cursor: pointer; margin: 10px 0px 0px 0px; padding: 3px 0px; border: 1px solid #aaa; border-radius: 3px;";
			closeBtn.appendChild(document.createTextNode("Close"));
			closeBtn.onclick = function(){
				// Close the color copy popup
				document.getElementById("colorCopyPopupDiv").parentNode.removeChild(document.getElementById("colorCopyPopupDiv"));				
			}
		colorCopyPopupBody.appendChild(closeBtn);
		
	
	colorCopyPopupDiv.appendChild(colorCopyPopupBody);
	
	copyColorValueBtn.parentNode.appendChild(colorCopyPopupDiv);
});

function setColorLabels() {

	hexstr = "#FFFFFF";
	
	if(colorSetSelect.value == 0){
		// only show color values
	}else if(colorSetSelect.value == 1){
		// use foreground color
		hexstr = foregroundColorInput.value;
	}else if(colorSetSelect.value == 2){
		// use background color
		hexstr = backgroundColorInput.value;
	}
	
	var RGB = EditorUtils.hexToRgb(hexstr);
	
	EditorUtils.setColorPickerColorLabels(RGB.r, RGB.g, RGB.b ,hexstr);

	/*
	rgbLbl.innerText = "RGB: (" + RGB.r + ", " + RGB.b + ", " + RGB.g + ")";
	var hsv = EditorUtils.rgb2hsv(RGB.r,RGB.b,RGB.g);
	hsvLbl.innerText = "HSV: (" + parseInt(hsv.h) + ", " + parseInt(hsv.s) + ", " + parseInt(hsv.v) + ")";
	var hsl = EditorUtils.rgbToHsl(RGB.r,RGB.b,RGB.g);
	hslLbl.innerText = "HSL: (" + hsl.h + ", " + hsl.s + ", " + hsl.l + ")";
	hexLbl.innerText = "HEX: " + hexstr.toUpperCase();
	*/
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
			var loadImageEditEntry = {};
			loadImageEditEntry["edit"] = "load_image_asset";
			loadImageEditEntry["asset_id"] = asset_id;
	
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

	// initially set the color labels
	setColorLabels();

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

	// Add transforms to the tool canvas 
	//EditorUtils.applyImageCanvasTransformations(toolDrawCtx);
	
	// Draw The Active Selection Area
	// This code has been moved from the end because the gradient drawing line was not been shown over the wand selection
	if(activeSelectionArea){
		EditorUtils.drawActiveSelection();
	}
	
	toolDrawCtx.restore();
	
}

function updateEditorCanvas(){
	
}

function KeyCheck(event)
{

	//alert(event.keyCode);

	// All CTRL Key Combinations
	if (event.ctrlKey) {
	
		// Undo - CTRL + Z
		if (event.keyCode == 90) {
			performUndo();
		}
		
		// Redo with CTRL + Y
		if (event.keyCode == 89) {
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
		default:
		break;
   }
}

$("#testBtn").click(function() {
	alert("Clearing Local storage");
	//localStorage.removeItem("editor_image");
	localStorage.clear();
});