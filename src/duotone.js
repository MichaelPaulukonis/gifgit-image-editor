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

var savedCurrentLayerCanvas;

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

var workspaceMouseX = 0; // used to hold coordinates with respect to the workspaceContainerDiv
var workspaceMouseY = 0; // used to hold coordinates with respect to the workspaceContainerDiv
var mouseX = 0;
var mouseY = 0;

var startColorInput = document.getElementById("startColorInput");
startColorInput.value = foregroundColorInput.value;

var endColorInput = document.getElementById("endColorInput");
endColorInput.value = backgroundColorInput.value;

var applyEditBtn = document.getElementById("applyEditBtn");
var previewBtn = document.getElementById("previewBtn");
var resetEditBtn = document.getElementById("resetEditBtn");
var resetEditorCanvas = false;

var dragselection = false;
var lastdragPoint = {};

// check if all required modules are present (HTML5 Storage etc...)
initializeEditor();

// Events

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

workspaceContainerDiv.addEventListener("dblclick", function(e){

	EditorUtils.setMouseCoordinates(e, workspaceContainerDiv);

});

workspaceContainerDiv.addEventListener("click", function(e){

	EditorUtils.setMouseCoordinates(e, workspaceContainerDiv);

});

workspaceContainerDiv.addEventListener("mousedown", function(e){

	/*
	// *Nb. Cannot Edit Non-Rasterized Layers
	// cannot edit layer that is not rasterized
	if('object' in layerStack[layerIndex]){
		alert("This layer must be rasterized to apply this edit.");
		return;
	}
	*/

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
	
	}	
	
});

resetEditBtn.addEventListener("click", function(e){
	editsMade = false;
	resetEditorCanvas = true;
	updateEditorCanvas();
});

previewBtn.addEventListener("click", function(e){
	editsMade = true;
	updateEditorCanvas();
});

applyEditBtn.addEventListener("click", function(e){

	// *Nb. Cannot Edit Non-Rasterized Layers
	// cannot edit layer that is not rasterized
	if('object' in layerStack[layerIndex]){
		alert("This layer must be rasterized to apply this edit.");
		return;
	}

	// alert(editStack.stack.length);
	if(editStack.stack.length > 0){
	}else{
		// alert("no edits");
		return;
	}

	// apply the blur
	/*
	let duotoneEditEntry = {
		edit: "duotone", 
		edit_label: "Duotone", 
		foregroundColor: startColorInput.value,
		backgroundColor: endColorInput.value
	};
	*/
	
	var duotoneEditEntry = new Object();
	duotoneEditEntry.edit = "duotone";
	duotoneEditEntry.edit_label = "Duotone";
	duotoneEditEntry.foregroundColor = startColorInput.value;
	duotoneEditEntry.backgroundColor = endColorInput.value;
	
	// add to the duotone edit stack
	editStack.add(duotoneEditEntry);
	
	editsMade = false;
	if(applyHistory){
		applyEditHistory();
	}else{
		applyHistory = true;
	}

	//updateEditorCanvas();
});

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

	// set the editor canvas to the image width
	editorCanvas.width = canvasWidth;
	editorCanvas.height = canvasHeight;
	
	// Save the current canvas
	savedCurrentLayerCanvas = document.createElement("canvas");
	savedCurrentLayerCanvas.width = layerStack[layerIndex].canvas.width;
	savedCurrentLayerCanvas.height = layerStack[layerIndex].canvas.height;
	savedCurrentLayerCanvas.getContext("2d").drawImage(layerStack[layerIndex].canvas, 0,0);	
	
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
		
		// if the current layer refresh with the saved current Layer
		if(j == layerIndex){
		
			layerStack[j].canvas.getContext("2d").clearRect(0,0,layerStack[j].canvas.width, layerStack[j].canvas.height);
			layerStack[j].canvas.getContext("2d").drawImage(savedCurrentLayerCanvas,0,0);
		
			if(resetEditorCanvas){
				resetEditorCanvas = false;
			}else{

				// Apply duotone to selected layer canvas

				// Processing the selected layer with duotone
			
				let blurredCanvas = document.createElement("canvas");
				blurredCanvas.width = layerStack[j].canvas.width; 
				blurredCanvas.height = layerStack[j].canvas.height; 
				let blurCtx = blurredCanvas.getContext("2d");
				
				// grayscale the layer canvas image so pixels grayscaled values can be mapped to
				// the created dual color gradient
				blurCtx.filter = "grayscale(100%)";	
				//blurCtx.drawImage(layerStack[j].canvas, 0, 0);
				blurCtx.drawImage(savedCurrentLayerCanvas, 0, 0);
				blurCtx.filter = "none";	
				
				// create a canvas to hold the duotone gradient it must be a width of 256
				// pixels to match the full range of grayscale from black(0) to white(255)
				let gradientCanvas = document.createElement("canvas");
				gradientCanvas.width = 256;
				gradientCanvas.height = 1;
				let gradientCtx = gradientCanvas.getContext("2d"); 
				
				// Create the gradient to draw in the gradient canvas
				let grd = gradientCtx.createLinearGradient(0, 0, 200, 0);
				grd.addColorStop(0, startColorInput.value);
				grd.addColorStop(1, endColorInput.value);

				// Fill with gradient canvas with the gradient
				gradientCtx.fillStyle = grd;
				gradientCtx.fillRect(0, 0, gradientCanvas.width, gradientCanvas.height);	
				
				/*
				// displays the gradient
				blurCtx.drawImage(gradientCanvas, 0, 5);
				*/
				
				// get the gradient color data into an array. This is done by reading the pixels from
				// left to right and storing its rgb data into a 256 sized array of object (r:n, g:n, b:n}
				let gradientImageData = gradientCtx.getImageData(0, 0, gradientCtx.canvas.width, gradientCtx.canvas.height); 
				let gradientColorArray = [];
				let cntr = 0;
				for(let i = 0; i < gradientImageData.data.length; i += 4) {
					gradientColorArray[cntr] = {r: gradientImageData.data[i + 0], g: gradientImageData.data[i + 1], b: gradientImageData.data[i + 2]};
					cntr++;
				}
				
				//console.log(JSON.stringify(gradientColorArray));

				// iterate through the pixels of the grayscaled image and replace the grayscale level with the pixel color
				// index the gradientColorArray index
				
				let duotonedImageData = blurCtx.getImageData(0, 0, blurCtx.canvas.width, blurCtx.canvas.height);  			
				for (let i = 0; i < duotonedImageData.data.length; i += 4) {
					
					let grayscaleLevel = duotonedImageData.data[i + 2]; // we can use either r,g or b they will all be same in grayscale
					//console.log(grayscaleLevel);
					
					/*
					duotonedImageData.data[i + 0] = gradientImageData[grayscaleLevel*4];
					duotonedImageData.data[i + 1] = gradientImageData[grayscaleLevel*4];
					duotonedImageData.data[i + 2] = gradientImageData[grayscaleLevel*2];
					*/			
					
					// set the image pixel rgb to the gradient map of the color array
					duotonedImageData.data[i + 0] = gradientColorArray[grayscaleLevel].r;
					duotonedImageData.data[i + 1] = gradientColorArray[grayscaleLevel].g;
					duotonedImageData.data[i + 2] = gradientColorArray[grayscaleLevel].b;

				}
				blurCtx.putImageData(duotonedImageData, 0, 0);
				
				
				// 3. Perform Clipping - if there is a selection
				EditorUtils.clipSelectionRegion(blurCtx, layerStack[j].cumulativeNegatives);
				
				/*
				// Render the layer to the editor canvas
				tempEditorCtx.drawImage(layerStack[j].canvas, layerStack[j].cumulativeNegatives.x, layerStack[j].cumulativeNegatives.y);	
				
				// We do not draw the layer as in the case below, we draw the blurred canvas
				tempEditorCtx.drawImage(brightenedCanvas, layerStack[j].cumulativeNegatives.x, layerStack[j].cumulativeNegatives.y);
				*/
				
				var layerCtx =  layerStack[j].canvas.getContext("2d");
				//layerCtx.drawImage(eraserCanvas, 0, 0);	
				layerCtx.drawImage(blurredCanvas, 0, 0);				
			}
					
		}
		// End of altering the current layer in the stack

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
