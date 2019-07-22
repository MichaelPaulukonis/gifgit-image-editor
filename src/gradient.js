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

// moved to toolpagetemplate.js
//var editsMade = false;

var selectingrect = false;
var squareSelectionRect = {x: 0, y:0, width: 0, height: 0};
var gradientLine = {x1: 0, y1: 0, x2: 0, y2: 0};

var applyEditBtn = document.getElementById("applyEditBtn");
var toolbarGradientPreviewCanvas = document.getElementById("toolbarGradientPreviewCanvas");
var toolbarGradientPreviewCtx = toolbarGradientPreviewCanvas.getContext("2d");
var gradientTypeSelect = document.getElementById("gradientTypeSelect");
var gradientAlphaInput = document.getElementById("gradientAlphaInput");
var gradientBlendingModeInput = document.getElementById("gradientBlendingModeInput");

var workspaceMouseX = 0; // used to hold coordinates with respect to the workspaceContainerDiv
var workspaceMouseY = 0; // used to hold coordinates with respect to the workspaceContainerDiv
var mouseX = 0;
var mouseY = 0;

var dragselection = false;
var lastdragPoint = {};

// Setup the gradient preview
if (localStorage.getItem("gradient_settings") === null) {
	EditorUtils.saveGradient(undefined, gradientTypeSelect.value, gradientAlphaInput.value, gradientBlendingModeInput.value);
}else{
	var gradientSettings = JSON.parse(localStorage.getItem("gradient_settings"));
	EditorUtils.saveGradient(gradientSettings.gradient_object, gradientSettings.type, gradientSettings.opacity, gradientSettings.blend_mode);
}
EditorUtils.updateGradientToolbarPreview();

// check if all required modules are present (HTML5 Storage etc...)
initializeEditor();


// Events

window.onbeforeunload = function() {
	
	if(editsMade){
		return "You are currently editing an image. Do you want to exit?";
		//if we return nothing here (just calling return;) then there will be no pop-up question at all
		//return;
	}
};


// keyboard events
document.addEventListener("keydown", KeyCheck);

toolbarGradientPreviewCanvas.onclick = function(){
	//alert("show gradient editor");
	EditorUtils.createGradientEditorDialog();
}

gradientTypeSelect.onchange = function(){
	//alert(this.value);
	if (localStorage.getItem("gradient_settings") === null) {
		EditorUtils.saveGradient(undefined, gradientTypeSelect.value, gradientAlphaInput.value, gradientBlendingModeInput.value);
	}else{
		var gradientSettings = JSON.parse(localStorage.getItem("gradient_settings"));
		EditorUtils.saveGradient(gradientSettings.gradient_object, gradientTypeSelect.value, gradientSettings.opacity, gradientSettings.blend_mode);
	}
}

gradientAlphaInput.onchange = function(){
	//alert(this.value);
	if (localStorage.getItem("gradient_settings") === null) {
		EditorUtils.saveGradient(undefined, gradientTypeSelect.value, gradientAlphaInput.value, gradientBlendingModeInput.value);
	}else{
		var gradientSettings = JSON.parse(localStorage.getItem("gradient_settings"));
		EditorUtils.saveGradient(gradientSettings.gradient_object, gradientSettings.type, gradientAlphaInput.value, gradientSettings.blend_mode);
	}	
}

gradientBlendingModeInput.onchange = function(){
	//alert(this.value);
	if (localStorage.getItem("gradient_settings") === null) {
		EditorUtils.saveGradient(undefined, gradientTypeSelect.value, gradientAlphaInput.value, gradientBlendingModeInput.value);
	}else{
		var gradientSettings = JSON.parse(localStorage.getItem("gradient_settings"));
		EditorUtils.saveGradient(gradientSettings.gradient_object, gradientSettings.type, gradientSettings.opacity, gradientBlendingModeInput.value);
	}
}

// file loader event
fileinput.addEventListener('input', function(){

	if(this.files.length > 0){
		// alert(this.files[0].name);
		loadFile(this.files[0]);	
	}

});

applyEditBtn.addEventListener("click", function(e){

	editsMade = false;
	addGradient();

});

// Workspace mouse events

workspaceContainerDiv.addEventListener("dblclick", function(e){

	EditorUtils.setMouseCoordinates(e, workspaceContainerDiv);

});

workspaceContainerDiv.addEventListener("click", function(e){

	EditorUtils.setMouseCoordinates(e, workspaceContainerDiv);

});

workspaceContainerDiv.addEventListener("mousedown", function(e){


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
		
		// *Nb. Cannot Edit Non-Rasterized Layers
		// cannot edit layer that is not rasterized
		if('object' in layerStack[layerIndex]){
		
			//console.log("object");
			
			// If we have  an object we only apply gradient to the raster mask
			if(editingLayerMask != 1){
				return;
			}
		
		}
		
		selectionActive = false;
		
		squareSelectionRect.x = mouseX;
		squareSelectionRect.y = mouseY;
		squareSelectionRect.width = 0;
		squareSelectionRect.height = 0;
		
		selectingrect = true;
		
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

	EditorUtils.setMouseCoordinates(e, workspaceContainerDiv);

	if(transformSelection){

		if(dragselection){
			EditorUtils.addMoveActiveSelectionEntry(activeSelectionArea);
			dragselection = false;
		}
	
	}else{

		// *Nb. Cannot Edit Non-Rasterized Layers
		// cannot edit layer that is not rasterized
		if('object' in layerStack[layerIndex]){
		
			//console.log("object");
			
			// If we have  an object we only apply gradient to the raster mask
			if(editingLayerMask != 1){
				return;
			}
		
		}
		
		if(Math.abs(squareSelectionRect.width) < 0 || Math.abs(squareSelectionRect.height) < 0){
			return;
		}
		
		applyEditBtn.disabled = false;
		//editsMade = true;
		

		//alert(mouseX + "," + mouseY);
		selectingrect = false;
		selectionActive = true;
		
		gradientLine.x1 = squareSelectionRect.x;
		gradientLine.y1 = squareSelectionRect.y;
		gradientLine.x2 = squareSelectionRect.x + squareSelectionRect.width;
		gradientLine.y2 = squareSelectionRect.y + squareSelectionRect.height;
		
		squareSelectionRect = {x: 0, y:0, width: 0, height: 0};
		
		updateToolCanvas();
		
		// save to the edit stack 
		//updateEditorCanvas();
		
		addGradient();
	
	}
	
});

function addGradient(){

	if(gradientLine.x1 == gradientLine.x2 && gradientLine.y1 == gradientLine.y2){
		return;
	}

	// alert(editStack.stack.length);
	if(editStack.stack.length > 0){
	}else{
		// alert("no edits");
		return;
	}

	// alert(JSON.stringify(gradientLine));
	/*
	var gradientEditEntry = {
		edit: "gradient", 
		edit_label: "Gradient", 
		type: "linear", 
		blend_mode: "normal", 
		geometry: gradientLine, 
		color_stops: [{color: $("#foregroundColorInput").val(), stop: 0}, {color: $("#backgroundColorInput").val(), stop: 1}], 
	};
	*/
	
	// crate a new object so that the gradient line doesn't propagate with the same object
	var tempGradientLine = new Object();
	tempGradientLine.x1 = gradientLine.x1;
	tempGradientLine.y1 = gradientLine.y1;
	tempGradientLine.x2 = gradientLine.x2;
	tempGradientLine.y2 = gradientLine.y2;

	var gradientEditEntry = new Object();
	gradientEditEntry.edit = "gradient";
	gradientEditEntry.edit_label = "Gradient";
	gradientEditEntry.type = gradientTypeSelect.value;
	gradientEditEntry.opacity = gradientAlphaInput.value/100;
	gradientEditEntry.blend_mode = gradientBlendingModeInput.value;
	gradientEditEntry.geometry = tempGradientLine; 
	// alert(JSON.stringify(EditorUtils.getStoredGradientColorStops()));
	// gradientEditEntry.color_stops = [{color: $("#foregroundColorInput").val(), stop: 0}, {color: $("#backgroundColorInput").val(), stop: 1}];
	gradientEditEntry.color_stops = EditorUtils.getStoredGradientColorStops();
	// indicate wether we re using a mask
	gradientEditEntry.useMask = editingLayerMask;
	
	//console.log(JSON.stringify(gradientEditEntry));
	
	if(gradientEditEntry === undefined){
	}else{
	
		// add to the crop edit stack
		editStack.add(gradientEditEntry);
		
		applyEditHistory();
	}
	


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
	//mouseOffsetLeft = Math.ceil(canvasDivRect.x - workspaceContainerDivRect.x);
	//mouseOffsetTop = Math.ceil(canvasDivRect.y - workspaceContainerDivRect.y);
	
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

	if(!selectionActive){
	
		toolDrawCtx.save();
	
		if(Math.abs(squareSelectionRect.width) == 0 || Math.abs(squareSelectionRect.height) == 0){
		}else{

			// draw the line from top,left to bottom,right of the rectangle
			toolDrawCtx.lineWidth = 2;
			toolDrawCtx.strokeStyle = "rgba(255, 255, 255, .8)";
			
			toolDrawCtx.shadowColor = 'rgba(0, 0, 0, .8)';
			toolDrawCtx.shadowBlur = 1;
			
			// We create a points objects with the points that make up the gradient line then send it as
			// a points selection to be transformed
			var tempPolyLasso = new Object();
			tempPolyLasso.points = [];
			// add start point frmo rectangle
			tempPolyLasso.points.push({x: squareSelectionRect.x, y: squareSelectionRect.y});
			tempPolyLasso.points.push({x: squareSelectionRect.x + squareSelectionRect.width, y: squareSelectionRect.y + squareSelectionRect.height});

			
			//console.log(JSON.stringify(tempPolyLasso));
			
			EditorUtils.globalImageRotateActiveSelection(tempPolyLasso, "freeform");
			
			//console.log(JSON.stringify(tempPolyLasso));
				

			toolDrawCtx.beginPath();
			
			for(let i = 0; i < tempPolyLasso.points.length; i++) {
				// console.log(tempPolyLasso.points[i].x + "," + tempPolyLasso.points[i].y);
				if(i == 0){
					toolDrawCtx.moveTo(tempPolyLasso.points[i].x * (globalZoom/100) + canvasOffsetLeft, tempPolyLasso.points[i].y * (globalZoom/100) + canvasOffsetTop);
				}else{
					toolDrawCtx.lineTo(tempPolyLasso.points[i].x * (globalZoom/100) + canvasOffsetLeft, tempPolyLasso.points[i].y * (globalZoom/100) + canvasOffsetTop);
				}
			}
			
			toolDrawCtx.stroke();
			
			
			/*
			toolDrawCtx.beginPath();
			//toolDrawCtx.moveTo((squareSelectionRect.x + mouseOffsetLeft), (squareSelectionRect.y + mouseOffsetTop));
			//toolDrawCtx.lineTo((squareSelectionRect.width + squareSelectionRect.x + mouseOffsetLeft), (squareSelectionRect.height + squareSelectionRect.y + mouseOffsetTop));
			var linestartx = squareSelectionRect.x * (globalZoom/100) + canvasOffsetLeft;
			var linestarty = squareSelectionRect.y * (globalZoom/100) + canvasOffsetTop;
			toolDrawCtx.moveTo(linestartx, linestarty);
			toolDrawCtx.lineTo(squareSelectionRect.width * (globalZoom/100) + linestartx, squareSelectionRect.height * (globalZoom/100) + linestarty);
			toolDrawCtx.stroke();
			*/
			
		}
		
		toolDrawCtx.restore();
		
	}else{

	}
	
	toolDrawCtx.restore();
}

function updateEditorCanvas(){

	editorCtx.clearRect(0, 0, editorCanvas.width, editorCanvas.height);
	editorCtx.save();
	
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
		}
	
		// If this is the layer we are currently editing we apply the blur to it
		if(j == layerIndex){	
		
			var gradientCanvas = document.createElement("canvas");
			gradientCanvas.id = "gradientCanvas";
			gradientCanvas.width = editorCanvas.width;
			gradientCanvas.height = editorCanvas.height;
			var gradientCtx = gradientCanvas.getContext("2d");
			
			var grd = gradientCtx.createLinearGradient(gradientLine.x1, gradientLine.y1, gradientLine.x2, gradientLine.y2);
			grd.addColorStop(0, $("#foregroundColorInput").val());
			grd.addColorStop(1, $("#backgroundColorInput").val());

			gradientCtx.fillStyle = grd;
			gradientCtx.fillRect(0, 0, editorCanvas.width, editorCanvas.height);
			
			
			// 3. Perform Clipping - if there is a selection
			EditorUtils.clipSelectionRegion(gradientCtx, layerStack[j].cumulativeNegatives);
			
			var layerCtx =  layerStack[j].canvas.getContext("2d");
			//layerCtx.drawImage(eraserCanvas, 0, 0);	
			layerCtx.drawImage(gradientCanvas, 0, 0);
			
		}	
		// End of altering the current layer in the stack

		//===============================================
		//Render the layer at the current layer index
		layerRenderEngine.renderLayerIndex(editorCtx, j);	
		//===============================================		
	
	}
	
	editorCtx.restore();	
	
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
			performRedo();
		}
		
		// Copy with CTRL + C
		if (event.keyCode == 67) {
			alert("Copy");
		}
		
		// Copy with CTRL + X
		if (event.keyCode == 88) {
			alert("Cut");
		}
		
		// Copy with CTRL + V
		if (event.keyCode == 86) {
			alert("Paste");
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