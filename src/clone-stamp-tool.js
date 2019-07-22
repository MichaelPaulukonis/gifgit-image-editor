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

var savedCurrentLayerCanvas;

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

// brush specific variables
var brushSizeInput = document.getElementById("brushSizeInput");
var brushAlphaInput = document.getElementById("brushAlphaInput");
var brushBlurInput = document.getElementById("brushBlurInput");
var brushBlendingModeInput = document.getElementById("brushBlendingModeInput");
//var eraserHardnessInput = document.getElementById("eraserHardnessInput");

var brushSize = 10;
var brushBlur = 0;
var brushAlpha = 1; // brushAlpha is brushAlphaInput.value/100 (because we wanted opacity in terms of percent instead of decimals)
var brushBlendingMode = "source-over";

var altPressed = false;
var clonePoint = {x: -1, y: -1, copy_x: 0, copy_y: 0};

/* Explanation OF THE CLONE STAMP OPERATION
	There are two important coordinates for the clone stamp operation.
	Point (clonePoint.x, clonePoint.y) is the point at which we will clone 
	from. It is set by the first click after pressing the alt key.
	Point (clonePoint.copy_x, clonePoint.copy_y) is the point that is clicked
	after setting the clone point. When draw around the copy point we calculate
	the offset of the mouse from the copy point and apply to the clone point.
	// this will be stored in the clickX and clickY.


*/

if (localStorage.getItem("clone_brush_settings") === null) {
	// alert("no clone brush");
	updateBrush();	
}else{
	//alert(localStorage.getItem("background_eraser_settings"));
	let brushSettings = JSON.parse(localStorage.getItem("clone_brush_settings"));
	
	//alert(JSON.stringify(brushSettings));
	
	brushSizeInput.value = brushSettings.brushSize;
	brushAlphaInput.value = brushSettings.brushAlpha;
	brushBlurInput.value = brushSettings.brushBlur;
	
	if(typeof brushSettings.brushBlendingMode === "undefined" || brushSettings.brushBlendingMode == ""){
		brushBlendingModeInput.value = "source-over";
	}else{
		brushBlendingModeInput.value = brushSettings.brushBlendingMode;
	}
	
	updateBrush();
	
}

var workspaceMouseX = 0; // used to hold coordinates with respect to the workspaceContainerDiv
var workspaceMouseY = 0; // used to hold coordinates with respect to the workspaceContainerDiv
var mouseX = 0;
var mouseY = 0;

var clickX = new Array();
var clickY = new Array();
var clickDrag = new Array();
var paint = false;

var selectionMarchingAntsInterval;
var pauseMarchingAnts = false;
var activeSelectionArea;
var polyLassoLineOffset = 0;
var invertSelection = false;
var selectionActive = false;

var dragselection = false;
var lastdragPoint = {};

// check if all required modules are present (HTML5 Storage etc...)
initializeEditor();

// sharpen filter
// var filter1 = Object.create(Filters);

/*
// Example sharpening
setTimeout(function(){ 
	let sharpenImageData = filter1.convole(editorCtx.getImageData(0, 0, editorCtx.canvas.width, editorCtx.canvas.height), 
	[  0, -1,  0,
	-1,  5, -1,
	0, -1,  0 ],
	1);	
	// sharpen done
	
	editorCtx.putImageData(sharpenImageData, 100, 100);
	
 }, 5000);
 */
 
 
 
// set the cursor based on rectangular marquee
// workspaceContainerDiv.style.cursor = "url(/cursors/brush-cursor.svg) 4 12, auto";

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


// Workspace mouse events

workspaceContainerDiv.addEventListener("mouseout", function(e){
	// This makes sure the brush outline curcle isnot left hanging on the canvas when the mouse exits
	toolDrawCtx.clearRect(0, 0, toolDrawCtx.canvas.width, toolDrawCtx.canvas.height); // Clear the canvas
});

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
			alert("This layer must be rasterized to apply this edit.");
			return;
		}
		
		/*
		if(mouseX < 0 || mouseY < 0 || mouseX > editorCanvas.width || mouseY > editorCanvas.height){
			return;
		}
		*/
		
		if(altPressed){
			altPressed = false;
			clonePoint.x = mouseX;
			clonePoint.y = mouseY;
			workspaceContainerDiv.style.cursor = "pointer";
			// console.log(clonePoint.x + "," + clonePoint.y);	
			updateToolCanvas();
		}else{
		
			if(clonePoint.x < 0 || clonePoint.y < 0){

			}else{
				paint = true;
				clonePoint.copy_x = mouseX;
				clonePoint.copy_y = mouseY;
				/*
				// addClick(mouseX, mouseY);
				updateEditorCanvas();
				*/
				
				// BELOW SAME ROUTINE AS IN MOUSEMOVE
				// we are getting the offset the the user moved the mouse from the copy point
				// to the mouse move point hen applying it to the set point
				// In effect we are copying the movements around the copy point to around the clone point
				let offsetx = clonePoint.x + (mouseX - clonePoint.copy_x);
				let offsety = clonePoint.y + (mouseY - clonePoint.copy_y);
				
				addClick(offsetx, offsety, true);
				updateEditorCanvas();
			}	
		}	
	
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
			
			
			// we are getting the offset the the user moved the mouse from the copy point
			// to the mouse move point hen applying it to the set point
			// In effect we are copying the movements around the copy point to around the clone point
			let offsetx = clonePoint.x + (mouseX - clonePoint.copy_x);
			let offsety = clonePoint.y + (mouseY - clonePoint.copy_y);
			
			addClick(offsetx, offsety, true);
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

brushSizeInput.onchange = function(){
	updateBrush();
}

brushAlphaInput.onchange = function(){
	updateBrush();
}

brushBlurInput.onchange = function(){
	updateBrush();
}

brushBlendingModeInput.onchange = function(){
	updateBrush();
}




function updateBrush(){

	// 1. Set the eraser size
	if(brushSizeInput.value > 200){
		brushSizeInput.value = 200;
	}
	if(brushSizeInput.value < 1){
		brushSizeInput.value = 1;
	}
	brushSize = brushSizeInput.value;
	
	// 2. Set the eraser opacity
	if(brushAlphaInput.value > 100){
		brushAlphaInput.value = 100;
	}
	if(brushAlphaInput.value < 0){
		brushAlphaInput.value = 0;
	}
	brushAlpha = parseInt(brushAlphaInput.value)/100;
	
	// 3. Set the eraser blur
	if(brushBlurInput.value < 0){
		brushBlurInput.value = 0;
	}
	brushBlur = brushBlurInput.value;
	//alert(brushBlur);
	
	brushBlendingMode = brushBlendingModeInput.value;	
	
	saveBrush();
}

function saveBrush(){

	var brushSettings = {};

	brushSettings.brushSize = brushSizeInput.value;
	brushSettings.brushAlpha = brushAlphaInput.value;
	brushSettings.brushBlur = brushBlurInput.value;
	brushSettings.brushBlendingMode = brushBlendingModeInput.value;

	localStorage.setItem("clone_brush_settings", JSON.stringify(brushSettings));	

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
	
		// clonePoint = {x: -1, y: -1, copy_x: 0, copy_y: 0};
		
		/*
		let newClonePoints = {};
		newClonePoints.x = clonePoint.x;
		newClonePoints.y = clonePoint.y;
		newClonePoints.copy_x = clonePoint.copy_x;
		newClonePoints.copy_y = clonePoint.copy_y;
			
		let cloneStampEditEntry = {
			edit: "clone_stamp", 
			edit_label: "Clone Stamp", 
			clickX: clickX, 
			clickY: clickY,
			//clone_points: {x: clonePoint.x, y: clonePoint.y, copy_x: clonePoint.copy_x, copy_y: clonePoint.copy_x},
			clone_points: newClonePoints,
			clickDrag: clickDrag,
			brushSize: brushSize,
			opacity: brushAlpha,
			blur: brushBlur
		};
		*/	
		
		var newClonePoints = new Object();
		newClonePoints.x = clonePoint.x;
		newClonePoints.y = clonePoint.y;
		newClonePoints.copy_x = clonePoint.copy_x;
		newClonePoints.copy_y = clonePoint.copy_y;

		var cloneStampEditEntry = new Object();
		cloneStampEditEntry.edit = "clone_stamp";
		cloneStampEditEntry.edit_label = "Clone Stamp";
		cloneStampEditEntry.clickX = clickX;
		cloneStampEditEntry.clickY = clickY;
		cloneStampEditEntry.clone_points = newClonePoints;
		cloneStampEditEntry.clickDrag = clickDrag;
		cloneStampEditEntry.brushSize = brushSize;
		cloneStampEditEntry.blur = brushBlur;
		cloneStampEditEntry.opacity = brushAlpha;
		cloneStampEditEntry.blendingMode = brushBlendingMode;
		
		// add to the crop edit stack
		editStack.add(cloneStampEditEntry);
	}
	
	applyEditHistory();
	
	clickX = [];
	clickY = [];
	clickDrag = [];
	
	updateToolCanvas();
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
	
	eraserCanvas.width = layerStack[0].canvas.width;
	eraserCanvas.height = layerStack[0].canvas.height;

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

function startMarchingAnts(){
	//alert("start marching ants");
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

function updateToolCanvas(){

	toolDrawCtx.clearRect(0, 0, toolDrawCtx.canvas.width, toolDrawCtx.canvas.height); // Clear the canvas
	toolDrawCtx.save();

	toolbar.lineWidth = 1;
	toolDrawCtx.strokeStyle = "#ffffff";
	toolDrawCtx.shadowBlur = 1;
	toolDrawCtx.shadowColor = "black";
	
	// Add transforms to the tool canvas 
	//EditorUtils.applyImageCanvasTransformations(toolDrawCtx);
	
	
	// Draw The Active Selection Area
	// This code has been moved from the end because the gradient drawing line was not been shown over the wand selection
	if(activeSelectionArea){
		EditorUtils.drawActiveSelection();
	}
	
	if(transformSelection){
	
	}else{
	
		toolDrawCtx.save();
		
		EditorUtils.applyImageCanvasTransformations(toolDrawCtx);
		
		// This Draws the Eraser Brush defining circle on the tool canvas
		//toolDrawCtx.strokeRect(workspaceMouseX + .5, workspaceMouseY + .5, 50, 50);
		toolDrawCtx.beginPath();
		toolDrawCtx.arc(workspaceMouseX, workspaceMouseY, (brushSize/2)*(globalZoom/100), 0, 2 * Math.PI);
		toolDrawCtx.stroke();
		
		toolDrawCtx.restore();
		

		// Draw brush circle around the cloned point
		if(clickX.length > 0){
			if(clonePoint.x >= 0 && clonePoint.y >= 0){
			
				// We are drawing clone. Draw the brush circle moving around the clone point
				
				
				// We create a points objects to transform the points from rotated space
				var tempPolyLasso = new Object();
				tempPolyLasso.points = [];
				// add start point frmo rectangle
				tempPolyLasso.points.push({x: clickX[clickX.length -1], y: clickY[clickY.length -1]});
				tempPolyLasso.points.push({x: 0, y: 0}); // just a place holder

				EditorUtils.globalImageRotateActiveSelection(tempPolyLasso, "freeform");	

				toolDrawCtx.beginPath();
				// toolDrawCtx.arc(clonePoint.x + mouseOffsetLeft, clonePoint.y + mouseOffsetTop, brushSize/2, 0, 2 * Math.PI);
				//toolDrawCtx.arc(clickX[clickX.length -1] + mouseOffsetLeft, clickY[clickY.length -1] + mouseOffsetTop, brushSize/2, 0, 2 * Math.PI);
				toolDrawCtx.arc(tempPolyLasso.points[0].x * (globalZoom/100) + canvasOffsetLeft, tempPolyLasso.points[0].y * (globalZoom/100) + canvasOffsetTop, (brushSize/2)*(globalZoom/100), 0, 2 * Math.PI);
				toolDrawCtx.stroke();				
				
				/*
				toolDrawCtx.beginPath();
				// toolDrawCtx.arc(clonePoint.x + mouseOffsetLeft, clonePoint.y + mouseOffsetTop, brushSize/2, 0, 2 * Math.PI);
				//toolDrawCtx.arc(clickX[clickX.length -1] + mouseOffsetLeft, clickY[clickY.length -1] + mouseOffsetTop, brushSize/2, 0, 2 * Math.PI);
				toolDrawCtx.arc(clickX[clickX.length -1] * (globalZoom/100) + canvasOffsetLeft, clickY[clickY.length -1]  * (globalZoom/100) + canvasOffsetTop, (brushSize/2)*(globalZoom/100), 0, 2 * Math.PI);
				toolDrawCtx.stroke();
				*/
			}	
		}else{
		
			// We are not drawing so draw a stationary brush circle around the cloned point
		
			if(clonePoint.x >= 0 && clonePoint.y >= 0){
			
				var tempPolyLasso = new Object();
				tempPolyLasso.points = [];
				// add start point frmo rectangle
				tempPolyLasso.points.push({x: clonePoint.x, y: clonePoint.y});
				tempPolyLasso.points.push({x: 0, y: 0}); // just a place holder

				EditorUtils.globalImageRotateActiveSelection(tempPolyLasso, "freeform");	

				toolDrawCtx.beginPath();
				// toolDrawCtx.arc(clonePoint.x + mouseOffsetLeft, clonePoint.y + mouseOffsetTop, brushSize/2, 0, 2 * Math.PI);
				//toolDrawCtx.arc(clickX[clickX.length -1] + mouseOffsetLeft, clickY[clickY.length -1] + mouseOffsetTop, brushSize/2, 0, 2 * Math.PI);
				toolDrawCtx.arc(tempPolyLasso.points[0].x * (globalZoom/100) + canvasOffsetLeft, tempPolyLasso.points[0].y * (globalZoom/100) + canvasOffsetTop, (brushSize/2)*(globalZoom/100), 0, 2 * Math.PI);
				toolDrawCtx.stroke();
			
				/*
				// Draw the point moving around the clone point
				toolDrawCtx.beginPath();
				//toolDrawCtx.arc(clonePoint.x + mouseOffsetLeft, clonePoint.y + mouseOffsetTop, brushSize/2, 0, 2 * Math.PI);
				toolDrawCtx.arc(clonePoint.x * (globalZoom/100) + canvasOffsetLeft, clonePoint.y  * (globalZoom/100) + canvasOffsetTop, (brushSize/2)*(globalZoom/100), 0, 2 * Math.PI);
				toolDrawCtx.stroke();	
				*/
			}		
		}
		

		
	}
	
	toolDrawCtx.save();
	
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
		}
	
		// If this is the layer we are currently editing we apply the blur to it
		if(j == layerIndex && clickX.length > 0){
		
			eraserCtx.save();

			// Draw clone stamp brush strokes on the selected layer	

			// Clear the eraser canvas for preparation
			eraserCtx.clearRect(0, 0, editorCanvas.width, editorCanvas.height); // Clears the canvas

			//eraserCtx.strokeStyle = "#ff0000";
			eraserCtx.strokeStyle = "red";
			eraserCtx.lineJoin = "round";
			eraserCtx.lineWidth = brushSize;
			
			//eraserCtx.filter = "blur(" + brushBlur + "px)";	// adding eraser blur here slows down eraser stroking dramatically	
			for(let i = 0; i < clickX.length; i++) {
				eraserCtx.beginPath();
				if(clickDrag[i] && i){
					eraserCtx.moveTo(clickX[i-1] - layerStack[j].cumulativeNegatives.x, clickY[i-1] - layerStack[j].cumulativeNegatives.y);
				}else{
					eraserCtx.moveTo(clickX[i]-1 - layerStack[j].cumulativeNegatives.x, clickY[i] - layerStack[j].cumulativeNegatives.y);
				}
				eraserCtx.lineTo(clickX[i] - layerStack[j].cumulativeNegatives.x, clickY[i] - layerStack[j].cumulativeNegatives.y);
				eraserCtx.closePath();
				eraserCtx.stroke();	
			}

			// 4. To apply blur to eraser strokes we draw it to a blur canvas
			let blurCanvas = document.createElement("canvas");
			blurCanvas.width = eraserCtx.canvas.width; 
			blurCanvas.height = eraserCtx.canvas.height; 
			let blurCtx = blurCanvas.getContext("2d");
			blurCtx.clearRect(0,0,blurCanvas.width,blurCanvas.height);
			blurCtx.filter = "blur(" + brushBlur + "px) opacity(" + brushAlpha + ")";		
			blurCtx.drawImage(eraserCanvas, 0, 0);
			blurCtx.filter = "none";			

			// 2. get the sharpen strokes of the image first draw the image to a sharpen canvas 
			var cloneStampCanvas = document.createElement("canvas");
			cloneStampCanvas.width = layerStack[j].canvas.width;
			cloneStampCanvas.height = layerStack[j].canvas.height;
			var cloneStampStrokesCtx = cloneStampCanvas.getContext("2d");
			cloneStampStrokesCtx.drawImage(layerStack[j].canvas, clonePoint.copy_x - clonePoint.x, clonePoint.copy_y - clonePoint.y);

			// perform composite operation to erase everything in the image but the strokes
			// thereby retaining the parts of the image that are the strokes
			cloneStampStrokesCtx.globalCompositeOperation = 'destination-in';
			cloneStampStrokesCtx.drawImage(blurCanvas, clonePoint.copy_x - clonePoint.x, clonePoint.copy_y - clonePoint.y);
			//cloneStampStrokesCtx.drawImage(blurStrokeCanvas, 0, 0);	
			
			// if there is an active selection clip the clone stamp brush strokes
			EditorUtils.clipSelectionRegion(cloneStampStrokesCtx, layerStack[j].cumulativeNegatives);
			
			/*
			// draw the ariginal layer canvas image to draw the clone stamp strokes over			
			tempEditorCtx.drawImage(layerStack[j].canvas, layerStack[j].cumulativeNegatives.x, layerStack[j].cumulativeNegatives.y);	
			
			// draw the sharpened strokes to the image
			//tempEditorCtx.drawImage(cloneStampCanvas, 0, 0);
			tempEditorCtx.drawImage(cloneStampCanvas, layerStack[j].cumulativeNegatives.x, layerStack[j].cumulativeNegatives.y);
			*/
			
			var layerCtx =  layerStack[j].canvas.getContext("2d");
			//layerCtx.drawImage(eraserCanvas, 0, 0);
			layerCtx.save();
			layerCtx.globalCompositeOperation = brushBlendingMode;
			layerCtx.drawImage(cloneStampCanvas, 0, 0);
			layerCtx.restore();
			
			eraserCtx.restore();
					
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

function KeyUpCheck(event)
{
	
}

function KeyDownCheck(event)
{

	//alert(event.keyCode);
	if (event.altKey) {
		// alert("Alt key pressed");
		altPressed = true;
		workspaceContainerDiv.style.cursor = "crosshair";
	}

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
	// localStorage.clear();
	
});

$("#testBtn1").click(function() {
	alert(editStack);
});

$("#downloadBtn").click(function() {
	// alert("download");
	downloadImage();
});

$("#newfileBtn").click(function() {
	localStorage.clear();
	location.reload();
});

$("#undoBtn").click(function() {
	editStack.undo();
	applyEditHistory();
});

$("#redoBtn").click(function() {
	editStack.redo();
	applyEditHistory();
});
