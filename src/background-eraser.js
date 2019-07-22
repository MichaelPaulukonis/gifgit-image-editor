// Copyright (c) 2019 Kasey Thomas. All rights reserved.
// Use of this source code is governed by the EULA.

'use strict';

// the main image being edited
//var image = new Image();
//image.addEventListener("load", loadEditorImage, true);

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

// For Eraser
var eraserCanvas = document.getElementById("eraserCanvas");
var eraserCtx = eraserCanvas.getContext("2d");

// forms the background to the editor canvas
var canvasDiv = document.getElementById("canvasDiv");

var toolDrawCanvas = document.getElementById("toolDrawCanvas");
var toolDrawCtx = toolDrawCanvas.getContext("2d");

var selectionCanvas = document.getElementById("selectionCanvas")
var selectionCtx = selectionCanvas.getContext("2d");

var brushCanvas = document.getElementById("brushCanvas");
var brushCtx = brushCanvas.getContext("2d");

var sobelCanvas = document.getElementById("sobelCanvas");
var sobelCtx = sobelCanvas.getContext("2d");

var clippingCanvas = document.getElementById("clippingCanvas");
var clippingCtx = clippingCanvas.getContext("2d");

// Eraser specific variables
var sampled_RGB_HSV = undefined;
var eraserSizeInput = document.getElementById("eraserSizeInput");
var eraserAlphaInput = document.getElementById("eraserAlphaInput");
var eraserBlurInput = document.getElementById("eraserBlurInput");
//var eraserHardnessInput = document.getElementById("eraserHardnessInput");
var eraserToleranceInput = document.getElementById("eraserToleranceInput");
var eraserSampleSelect = document.getElementById("eraserSampleSelect");

var eraserSize = 25;
var eraserAlpha = 1;
var eraserBlur = 1;
var eraserTolerance = 50;

var dragselection = false;
var lastdragPoint = {};

if (localStorage.getItem("background_eraser_settings") === null) {
	
	updateEraser();
	
}else{
	//alert(localStorage.getItem("background_eraser_settings"));
	let backgroundEraserSettings = JSON.parse(localStorage.getItem("background_eraser_settings"));

	eraserSizeInput.value = backgroundEraserSettings.eraserSize;
	eraserAlphaInput.value = backgroundEraserSettings.eraserAlpha;
	eraserBlurInput.value = backgroundEraserSettings.eraserBlur;
	eraserToleranceInput.value = backgroundEraserSettings.eraserTolerance;
	
	updateEraser();
	
}

var selectionMarchingAntsInterval;
var pauseMarchingAnts = false;
var activeSelectionArea;
var polyLassoLineOffset = 0;
var invertSelection = false;
var selectionActive = false;
var selectingrect = false;
var squareSelectionRect = {x: 0, y:0, width: 0, height: 0};


var clickX = new Array();
var clickY = new Array();
var clickDrag = new Array();
var paint = false;

var workspaceMouseX = 0; // used to hold coordinates with respect to the workspaceContainerDiv
var workspaceMouseY = 0; // used to hold coordinates with respect to the workspaceContainerDiv
var mouseX = 0;
var mouseY = 0;

// check if all required modules are present (HTML5 Storage etc...)
initializeEditor();


// Events

// file loader event
fileinput.addEventListener('input', function(){

	if(this.files.length > 0){
		// alert(this.files[0].name);
		loadFile(this.files[0]);	
	}

});

// Workspace mouse events

workspaceContainerDiv.addEventListener("dblclick", function(e){

	EditorUtils.setMouseCoordinates(e, workspaceContainerDiv);

});

workspaceContainerDiv.addEventListener("click", function(e){

	EditorUtils.setMouseCoordinates(e, workspaceContainerDiv);

});

workspaceContainerDiv.addEventListener("mouseout", function(e){
	brushCtx.clearRect(0, 0, brushCtx.canvas.width, brushCtx.canvas.height);	
});

workspaceContainerDiv.addEventListener("mousedown", function(e){

	//console.log(layerIndex);
	EditorUtils.setMouseCoordinates(e, workspaceContainerDiv);
	
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
	
		// reset the sampled color before going through the stroke points
		sampled_RGB_HSV = undefined;
		
		
		// *Nb. Cannot Edit Non-Rasterized Layers
		// cannot edit layer that is not rasterized
		if('object' in layerStack[layerIndex]){
			alert("This layer must be rasterized to apply this edit.");
			return;
		}
		
		if(mouseX < 0 || mouseY < 0 || mouseX > editorCanvas.width || mouseY > editorCanvas.height){
			return;
		}
		
		paint = true;
		addClick(mouseX, mouseY);
		updateEditorCanvas();	
	
	}


	
});

workspaceContainerDiv.addEventListener("mousemove", function(e){

	EditorUtils.setMouseCoordinates(e, workspaceContainerDiv);
	
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
	
		// for brush, erase, lasso(freeform)
		if(paint){
			addClick(mouseX, mouseY, true);
			updateEditorCanvas();
		}
		
		updateToolCanvas();
	
	}
		
});

workspaceContainerDiv.addEventListener("mouseup", function(e){

	EditorUtils.setMouseCoordinates(e, workspaceContainerDiv);
		
	if(transformSelection){

		if(dragselection){
			EditorUtils.addMoveActiveSelectionEntry(activeSelectionArea);
			dragselection = false;
		}
	
	}else{
	
		// done painting with the brush so update the image object
		if(paint){
			stopBrushPaint();
		}
		
		paint = false;
	
	}
	
});

eraserSizeInput.onchange = function(){
	updateEraser();
}

eraserAlphaInput.onchange = function(){
	updateEraser();
}

eraserBlurInput.onchange = function(){
	updateEraser();
}

eraserToleranceInput.onchange = function(){
	updateEraser();
}


function updateEraser(){

	// 1. Set the eraser size
	if(eraserSizeInput.value > 200){
		eraserSizeInput.value = 200;
	}
	if(eraserSizeInput.value < 10){
		eraserSizeInput.value = 10;
	}
	eraserSize = eraserSizeInput.value;
	
	// 2. Set the eraser opacity
	if(eraserAlphaInput.value > 100){
		eraserAlphaInput.value = 100;
	}
	if(eraserAlphaInput.value < 0){
		eraserAlphaInput.value = 0;
	}
	eraserAlpha = parseInt(eraserAlphaInput.value)/100;
	
	// 3. Set the eraser blur
	if(eraserBlurInput.value < 0){
		eraserBlurInput.value = 0;
	}
	eraserBlur = eraserBlurInput.value;
	//alert(eraserBlur);
	
	// 4. Eraser tolerance
	if(eraserToleranceInput.value > 100){
		eraserToleranceInput.value = 100;
	}
	eraserTolerance = eraserToleranceInput.value;
	
	// save the eraser to local store
	saveEraser();
}

function saveEraser(){
	var backgroundEraserSettings = {};
	backgroundEraserSettings.eraserSize = eraserSizeInput.value;
	backgroundEraserSettings.eraserAlpha = eraserAlphaInput.value;
	backgroundEraserSettings.eraserBlur = eraserBlurInput.value;
	backgroundEraserSettings.eraserTolerance = eraserToleranceInput.value;

	localStorage.setItem("background_eraser_settings", JSON.stringify(backgroundEraserSettings));	
}

function addClick(x, y, dragging)
{
  clickX.push(x);
  clickY.push(y);
  clickDrag.push(dragging);
}

// clear all the brush variables when finish a brush drawing routine and 
// update the canvas image with the new data
function stopBrushPaint(){



	if(clickX.length > 0){
	
		/*
		let eraseEditEntry = {
			edit: "background_erase", 
			edit_label: "Background Eraser", 
			clickX: clickX, 
			clickY: clickY, 
			clickDrag: clickDrag, 
			eraserSize: eraserSize, 
			opacity: eraserAlpha, 
			blur: eraserBlur, 
			tolerance: eraserTolerance
		};
		*/
		
		var eraseEditEntry = new Object();
		eraseEditEntry.edit = "background_erase";
		eraseEditEntry.edit_label = "Background Eraser";
		eraseEditEntry.clickX = clickX;
		eraseEditEntry.clickY = clickY;
		eraseEditEntry.clickDrag = clickDrag;
		eraseEditEntry.eraserSize = eraserSize;
		eraseEditEntry.opacity = eraserAlpha;
		eraseEditEntry.blur = eraserBlur;
		eraseEditEntry.tolerance = eraserTolerance;
		eraseEditEntry.sample_type = eraserSampleSelect.value;
		eraseEditEntry.background_color = document.getElementById("backgroundColorInput").value;

		// add to the crop edit stack
		editStack.add(eraseEditEntry);
	}
	
	
	
	applyEditHistory();
	
	clickX = [];
	clickY = [];
	clickDrag = [];
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

	//============================================
	// Draw all the layers to the editor canvas
	layerRenderEngine.renderAllLayers(editorCtx);
	//============================================
	
	/*
	eraserCanvas.width = canvasWidth;
	eraserCanvas.height = canvasHeight;
	// eraserCtx.drawImage(image, 0, 0); // not incorporating tranformations
	//eraserCtx.drawImage(image, layerStack[0].cumulativeNegatives.x, layerStack[0].cumulativeNegatives.y);
	//eraserCtx.fillStyle = "rgba(0,255,0,.2)";
	//eraserCtx.fillRect(0,0,eraserCtx.canvas.width, eraserCtx.canvas.height);
	eraserCtx.drawImage(layerStack[layerIndex].canvas, layerStack[layerIndex].cumulativeNegatives.x, layerStack[layerIndex].cumulativeNegatives.y);	
	*/
	
	eraserCanvas.width = layerStack[layerIndex].canvas.width;
	eraserCanvas.height = layerStack[layerIndex].canvas.height;
	eraserCtx.drawImage(layerStack[layerIndex].canvas, 0, 0);	
	
	sobelCanvas.width = layerStack[layerIndex].canvas.width;
	sobelCanvas.height = layerStack[layerIndex].canvas.height;
	// Sobel constructor returns an Uint8ClampedArray with sobel data
	let sobelData = Sobel(layerStack[layerIndex].canvas.getContext("2d").getImageData(0, 0, canvasWidth, canvasHeight));
	// [sobelData].toImageData() returns a new ImageData object
	let sobelImageData = sobelData.toImageData();
	sobelCtx.putImageData(sobelImageData, 0, 0);
	
	//clippingCanvas.width = canvasWidth;
	//clippingCanvas.height = canvasHeight;
	clippingCanvas.width = layerStack[layerIndex].canvas.width;
	clippingCanvas.height = layerStack[layerIndex].canvas.height;
	//clippingCtx.drawImage(image, 0, 0);
	//drawSelectionClipping();
	EditorUtils.drawSelectionClipping(clippingCtx, invertSelection,"green",activeSelectionArea, false);
	

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
	
	brushCanvas.width = workspaceRect.width;
	brushCanvas.height = workspaceRect.height;
	
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

	// console.log("draw tool canvas");

	toolDrawCtx.clearRect(0, 0, toolDrawCtx.canvas.width, toolDrawCtx.canvas.height);
	
	// Draw The Active Selection Area
	// This code has been moved from the end because the gradient drawing line was not been shown over the wand selection
	if(activeSelectionArea){
		EditorUtils.drawActiveSelection();
	}
	
	
	toolDrawCtx.save();
	// Deal with global cumulative flips
	EditorUtils.applyImageCanvasTransformations(toolDrawCtx);	
	if(transformSelection){
	
	}else{
		// This Draws the Eraser Brush defining circle on the tool canvas
		toolbar.lineWidth = 1;
		toolDrawCtx.strokeStyle = "#ffffff";
		toolDrawCtx.shadowBlur = 1;
		toolDrawCtx.shadowColor = "black";
		//toolDrawCtx.strokeRect(workspaceMouseX + .5, workspaceMouseY + .5, 50, 50);
		toolDrawCtx.beginPath();
		toolDrawCtx.arc(workspaceMouseX, workspaceMouseY, (eraserSize/2)*(globalZoom/100), 0, 2 * Math.PI);
		toolDrawCtx.stroke();	
	}
	toolDrawCtx.restore();

}

function updateEditorCanvas(){

	editorCtx.clearRect(0, 0, editorCanvas.width, editorCanvas.height); // Clear the canvas
	// Eraser will store a backup of the image to get sampled data from
	// eraserCtx.clearRect(0, 0, editorCanvas.width, editorCanvas.height);
	
	var tempEditorCanvas = document.createElement("canvas");
	//tempEditorCanvas.width = editorCtx.canvas.width;
	//tempEditorCanvas.height = editorCtx.canvas.height;	
	// Using the two above gives trouble
	tempEditorCanvas.width = canvasWidth;
	tempEditorCanvas.height = canvasHeight;
	var tempEditorCtx = tempEditorCanvas.getContext("2d");
	
	
	for(let j = 0; j < layerStack.length; j++){
	
		if(layerStack[j].visible){
			// If layer is visible continue
		}else{
			// If the layer is not visible then do no rendering of it
			continue;
		}

		// If there are background eraser points and the current layer is reached
		// then upadte the current layer canvas with eraser data
		if(clickX.length > 0  && j == layerIndex){
		
			editorCtx.save();
			eraserCtx.save();
			
			/*
			// below continuously draws a green square at the last point mouse move point
			// with top, left being the last mousemove point
			tempEditorCtx.fillStyle = 'green';
			tempEditorCtx.fillRect(clickX[clickX.length - 1], clickY[clickY.length - 1], 25, 25);
			*/
			
			/*
			// Erases a square around last pixel in the mouse drag point list
			let eraserDims = {width: 20, height: 20};
			
			let x = clickX[clickX.length - 1] - eraserDims.width/2;
			let y = clickY[clickY.length - 1] - eraserDims.height/2;
			
			// get the pixel color at the last mouse move point
			var eraseImageData = tempEditorCtx.getImageData(x, y, eraserDims.width, eraserDims.height);
			for (let i = 0; i < eraseImageData.data.length; i += 4) {
				eraseImageData.data[i + 3] = 0;
			}
			
			// Draw the updated image data to the canvas
			tempEditorCtx.putImageData(eraseImageData, x, y);	
			*/
						
			for(let i = 0; i < clickX.length; i++) {
			
				// 1. Get the click point centred square that defines the eraser area
				let eraserRect = {width: eraserSize, height: eraserSize};
				eraserRect.centerX = clickX[i] - layerStack[layerIndex].cumulativeNegatives.x;
				eraserRect.centerY = clickY[i] - layerStack[layerIndex].cumulativeNegatives.y;
				eraserRect.left = eraserRect.centerX - parseInt(eraserRect.width/2);
				eraserRect.top = eraserRect.centerY - parseInt(eraserRect.height/2);	

				// 2. Get the image data of the eraser square from the image
				let eraseImageData = layerStack[j].canvas.getContext("2d").getImageData(eraserRect.left, eraserRect.top, eraserRect.width, eraserRect.height);
				// Get the sample data from the backup image stored in the eraser canvas, this is done because we want to keep
				// the original pixels and they will be erased in the working canvas
				let sampleImageData = eraserCtx.getImageData(eraserRect.left, eraserRect.top, eraserRect.width, eraserRect.height);
				
				// get the data from the selection clipping data
				let selectionAreaData = clippingCtx.getImageData(eraserRect.left, eraserRect.top, eraserRect.width, eraserRect.height);
				
								
				let isErased = false;
				
				//let testImageData = tempEditorCtx.getImageData(eraserRect.width, eraserRect.height);
				
				// If we are using background color 
				if(eraserSampleSelect.value == 2){

					// SET THE SAMPLE COLOR FROM BACKGROUND COLOR
					if (typeof sampled_RGB_HSV == 'undefined'){

						sampled_RGB_HSV = EditorUtils.hexToRgb(document.getElementById("backgroundColorInput").value);	
						let hsv = EditorUtils.rgb2hsv(sampled_RGB_HSV.r, sampled_RGB_HSV.g, sampled_RGB_HSV.b);
						sampled_RGB_HSV.h = hsv.h;				
						sampled_RGB_HSV.s = hsv.s;				
						sampled_RGB_HSV.v = hsv.v;							
						
					}
				
				}else{
				
					// Get the sample color data from the point that is the center of eraser rect
					let pixel_x = 0, pixel_y = 0;
					for (let j = 0; j < sampleImageData.data.length; j += 4) {
					
						pixel_x++;
						
						// get the color values of the pixel at center
						if(pixel_x == parseInt(eraserRect.width/2) && pixel_y == parseInt(eraserRect.height/2)){
						
							let a = sampleImageData.data[j + 3];
							if(a == 0){
								isErased = true;
							}	
		

							// SET THE SAMPLE COLOR
							if (typeof sampled_RGB_HSV == 'undefined'){
							
								// case i. SAMPLE COLOR NOT SET
								
								sampled_RGB_HSV = new Object();
							
								//infoLbl.innerText = "(r: " + sampleImageData.data[j + 0] + ", g:" + sampleImageData.data[j + 1] + ", b:" + sampleImageData.data[j + 2] + ")";			
								sampled_RGB_HSV.r = sampleImageData.data[j + 0];
								sampled_RGB_HSV.g = sampleImageData.data[j + 1];
								sampled_RGB_HSV.b = sampleImageData.data[j + 2];
										
								let hsv = EditorUtils.rgb2hsv(sampled_RGB_HSV.r, sampled_RGB_HSV.g, sampled_RGB_HSV.b);
								sampled_RGB_HSV.h = hsv.h;				
								sampled_RGB_HSV.s = hsv.s;				
								sampled_RGB_HSV.v = hsv.v;	
								//infoLbl.innerText = JSON.stringify(sampled_RGB_HSV);	
								//console.log("sample set");
							}else{
							
								// case ii. SAMPLE COLOR ALREADY SET
							
								// If sampling is not continuous we do not change the sampled_RGB_HSV 
								if(eraserSampleSelect.value == 0){
									// Continuous sampling
									// update the sampled color with the center pixel
									sampled_RGB_HSV.r = sampleImageData.data[j + 0];
									sampled_RGB_HSV.g = sampleImageData.data[j + 1];
									sampled_RGB_HSV.b = sampleImageData.data[j + 2];
											
									let hsv = EditorUtils.rgb2hsv(sampled_RGB_HSV.r, sampled_RGB_HSV.g, sampled_RGB_HSV.b);
									sampled_RGB_HSV.h = hsv.h;				
									sampled_RGB_HSV.s = hsv.s;				
									sampled_RGB_HSV.v = hsv.v;	
								}else{
									// Don't update we are using only the initial sample
									/*
									sampled_RGB_HSV.r = sampleImageData.data[j + 0];
									sampled_RGB_HSV.g = sampleImageData.data[j + 1];
									sampled_RGB_HSV.b = sampleImageData.data[j + 2];
											
									let hsv = EditorUtils.rgb2hsv(sampled_RGB_HSV.r, sampled_RGB_HSV.g, sampled_RGB_HSV.b);
									sampled_RGB_HSV.h = hsv.h;				
									sampled_RGB_HSV.s = hsv.s;				
									sampled_RGB_HSV.v = hsv.v;
									*/
								}
								
							}
							
							
						}
						
						/*
						// Below draws a red cross centered at center of eraserRect
						if(pixel_x == parseInt(eraserRect.width/2) || pixel_y == parseInt(eraserRect.height/2)){
							sampleImageData.data[j + 0] = 255;
							sampleImageData.data[j + 1] = 0;
							sampleImageData.data[j + 2] = 0;
							sampleImageData.data[j + 3] = 255;				
						}
						*/
						
						/*
						// Below draws a red point at center of eraserRect
						if(pixel_x == parseInt(eraserRect.width/2) && pixel_y == parseInt(eraserRect.height/2)){
							sampleImageData.data[j + 0] = 255;
							sampleImageData.data[j + 1] = 0;
							sampleImageData.data[j + 2] = 0;
							sampleImageData.data[j + 3] = 255;				
						}
						*/
						
						
						if(pixel_x >= eraserRect.width){
							pixel_x = 0;
							pixel_y++;
						}
						
					}
				}
				
				// 4. Then loop through the pixels defined by the eraser square to determine 
				// 	  if the pixel is within the threshhold of the clicked hsv 
				if(!isErased){
				
					for (let j = 0; j < sampleImageData.data.length; j += 4) {
					
					
						// If a selection is active, check if the current point is in the selection region
						// This means if the alpha in clippingCanvas at the point is zero 
						// then the region was not selected
						//if(selectionActive && selectionAreaData.data[j + 3] == 0){
						if(activeSelectionArea && selectionAreaData.data[j + 3] == 0){
							continue;
						}
					
						//eraseImageData.data[j + 3] = 0;
						let r = sampleImageData.data[j + 0];
						let g = sampleImageData.data[j + 1];
						let b = sampleImageData.data[j + 2];
						let a = sampleImageData.data[j + 3];
						
						let hsv = EditorUtils.rgb2hsv(r,g,b);
						

						/*
						// erase all pixels in the eraser square that are close enough in color 
						// to the sampled					
						if(Math.abs(hsv.h - sampled_RGB_HSV.h) < 20){
							eraseImageData.data[j + 3] = 0;
						}
						*/
						
						let rgbDiff = EditorUtils.ColorDiff({R: sampled_RGB_HSV.r, G: sampled_RGB_HSV.g, B: sampled_RGB_HSV.b}, 
										{R:r, G:g, B:b}); 
										
						if(rgbDiff < parseInt((eraserTolerance*255)/100)){
							eraseImageData.data[j + 3] = 0;
						}
						
					}				
				}

				layerStack[j].canvas.getContext("2d").putImageData(eraseImageData, eraserRect.left, eraserRect.top);	
				//console.log("background erase");
				
			}	
		
			editorCtx.restore();
			eraserCtx.restore();
		}	
		// End if the current layer had eraser points the above code block would have altered the layer canvas
		
		//===============================================
		//Render the layer at the current layer index
		layerRenderEngine.renderLayerIndex(tempEditorCtx, j);	
		//===============================================
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

$("#testBtn").click(function() {
	alert("Clearing Local storage");
	//localStorage.removeItem("editor_image");
	localStorage.clear();
	
});