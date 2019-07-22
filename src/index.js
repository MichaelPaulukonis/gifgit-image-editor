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

var currentLayerCtx;

// canvas for brush strokes
var strokeCanvas = document.getElementById("strokeCanvas");
var strokeCtx = strokeCanvas.getContext("2d");

// For translations
var canvasWidth = 0, canvasHeight = 0;
var cumulativeTranslations = {x:0, y:0};
var cumulativeNegatives = {x:0, y:0};

// For Eraser
var eraserCanvas = document.getElementById("eraserCanvas");
var eraserCtx = eraserCanvas.getContext("2d");

// Temp canvas for raster opacity
var savedCurrentRasterCanvas = document.createElement("canvas");
var savedCurrentRasterCtx = savedCurrentRasterCanvas.getContext("2d");

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

if (localStorage.getItem("brush_settings") === null) {
	updateBrush();	
	// alert("brush size: " + brushSize + "\nblur: " + brushBlur + "\nalpha: " + brushAlpha);
}else{
	//alert(localStorage.getItem("background_eraser_settings"));
	let brushSettings = JSON.parse(localStorage.getItem("brush_settings"));
	
	brushSizeInput.value = brushSettings.brushSize;
	brushBlurInput.value = brushSettings.brushBlur;
	brushAlphaInput.value = brushSettings.brushAlpha;
	// alert(brushSettings.brushBlendingMode);
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

var foreGroundColor = {r: 0, g: 0, b: 0};

setForegroundColor();

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

// set the cursor based on rectangular marquee
// workspaceContainerDiv.style.cursor = "url(/cursors/brush-cursor.svg) 4 12, auto";

// Events

// file loader event
fileinput.addEventListener('input', function(){

	if(this.files.length > 0){
		// alert(this.files[0].name);
		loadFile(this.files[0]);	
	}

});

function setForegroundColor(){

	if (localStorage.getItem("foreground_color_settings") === null) {
		// leave at black default
		foreGroundColor = EditorUtils.hexToRgb(document.getElementById("foregroundColorInput").value);
	}else{
		foreGroundColor = EditorUtils.hexToRgb(localStorage.getItem("foreground_color_settings"));
	}
	
}


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
		
			//console.log("object");
			
			// If we have  an object we only apply brush to the raster mask
			if(editingLayerMask != 1){
				return;
			}
		
		}	
		// setForegroundColor();
		
		/*
		if(mouseX < 0 || mouseY < 0 || mouseX > editorCanvas.width || mouseY > editorCanvas.height){
			return;
		}
		*/
		
		paint = true;
		addClick(mouseX, mouseY);
		updateEditorCanvas();		
	
	}


	
});

//workspaceContainerDiv.addEventListener("mousemove", function(e){
canvasDiv.addEventListener("mousemove", function(e){

	EditorUtils.setMouseCoordinates(e, workspaceContainerDiv);
	
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
		// *Nb. Cannot Edit Non-Rasterized Layers
		// cannot edit layer that is not rasterized
		if('object' in layerStack[layerIndex]){
		
			//console.log("object");
			
			// If we have  an object we only apply brush to the raster mask
			if(editingLayerMask != 1){
				return;
			}
		
		}
		
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
	// alert("update brush");
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
	brushSize = parseInt(brushSizeInput.value);
	
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
	/*
	if(brushBlurInput.value > brushSizeInput.value){
		brushBlurInput.value = brushSizeInput.value
	}
	*/
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

	localStorage.setItem("brush_settings", JSON.stringify(brushSettings));	

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
		let brushEditEntry = {
			edit: "brush", 
			edit_label: "Brush", 
			clickX: clickX, 
			clickY: clickY, 
			clickDrag: clickDrag,
			brushSize: brushSize,
			opacity: brushAlpha,
			blendingMode: brushBlendingMode,
			blur: brushBlur,
			foreGroundColor: foreGroundColor
		};	
		*/
		
		var brushEditEntry = new Object();
		brushEditEntry.edit = "brush";
		brushEditEntry.edit_label = "Brush";
		brushEditEntry.clickX = clickX;
		brushEditEntry.clickY = clickY;
		brushEditEntry.clickDrag = clickDrag;
		brushEditEntry.brushSize = brushSize;
		brushEditEntry.blur = brushBlur;
		brushEditEntry.opacity = brushAlpha;
		brushEditEntry.blendingMode = brushBlendingMode;
		brushEditEntry.foreGroundColor = foreGroundColor;
		brushEditEntry.useMask = editingLayerMask;
		
		
		// add to the crop edit stack
		editStack.add(brushEditEntry);
	}
	
	applyEditHistory();
	
	clickX = [];
	clickY = [];
	clickDrag = [];
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

	// alert("loadEditorImage");
	
	currentLayerCtx = layerStack[layerIndex].canvas.getContext("2d");

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
	
	eraserCanvas.width = layerStack[layerIndex].canvas.width;
	eraserCanvas.height = layerStack[layerIndex].canvas.height;
	eraserCtx.drawImage(layerStack[layerIndex].canvas, 0, 0);
	
	if('raster_mask' in layerStack[layerIndex]){ 
		savedCurrentRasterCanvas.width = layerStack[layerIndex].raster_mask.canvas.width;
		savedCurrentRasterCanvas.height = layerStack[layerIndex].raster_mask.canvas.height;
		savedCurrentRasterCtx.drawImage(layerStack[layerIndex].raster_mask.canvas, 0, 0);
	}
	
	// set the editor canvas background div
	canvasDiv.style.width = editorCanvas.width + "px"; 
	canvasDiv.style.height = editorCanvas.height + "px"; 
	
	// show the workspace with the editor canvas
	//workspaceDiv.style.display = "block";
	editorDiv.style.display = "block";
	uploadImgDiv.style.display = "none";
	
	EditorUtils.setupWorkSpace();
	
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
	
	// Add transforms to the tool canvas 
	//EditorUtils.applyImageCanvasTransformations(toolDrawCtx);
	
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
		toolDrawCtx.arc(workspaceMouseX, workspaceMouseY, (brushSize/2)*(globalZoom/100), 0, 2 * Math.PI);
		toolDrawCtx.stroke();
	}
	toolDrawCtx.restore();
	
	toolDrawCtx.restore();
	
}


// The editor update routine for this brush is different from the other brushed
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
	// Apply the brush stokes over the current layer in the loop
	for(let j = 0; j < layerStack.length; j++){
	
		
		if(layerStack[j].visible){
			// If layer is visible continue
		}else{
			// If the layer is not visible then do no rendering of it
			// continue to the next layer
			continue;
		}
	
		// If this is the layer we are currently editing we apply brush strokes to it
		if(j == layerIndex && clickX.length > 0){
			
			tempEditorCtx.save();

			// Draw brush strokes on the selected layer	

			// 1. get the dimensions of a rectangle that holds all the strokes				
			let strokeRect = getBrushstrokesBoundingRect(clickX, clickY, brushSize);
			//strokeRect.x -= layerStack[j].cumulativeNegatives.x;
			//strokeRect.y -= layerStack[j].cumulativeNegatives.y;
			
			// 2. update the strokes canvas dimensions and clear it				
			strokeCanvas.width = strokeRect.width;
			strokeCanvas.height = strokeRect.height;	
			strokeCtx.clearRect(0, 0, strokeCanvas.width, strokeCanvas.height); // Clears the canvas
			
			// 3. Draw strokes to the strokes canvas
			foreGroundColor = EditorUtils.hexToRgb(document.getElementById("foregroundColorInput").value);
			strokeCtx.strokeStyle = "rgb(" + foreGroundColor.r + ", " + foreGroundColor.g + ", " + foreGroundColor.b + ")";
			strokeCtx.lineJoin = "round";
			strokeCtx.lineCap = "round";
			strokeCtx.lineWidth = brushSize;
			
			if(clickX.length == 1){
				for(let i = 0; i < clickX.length; i++) {
					
					// Draw the eraser mask on the eraser canvas
					strokeCtx.beginPath();
					// adjust all the eraer points for crop offsets
					if(clickDrag[i] && i){
						strokeCtx.moveTo(clickX[i-1] - strokeRect.x, clickY[i-1] - strokeRect.y);
					}else{
						strokeCtx.moveTo(clickX[i]-1 - strokeRect.x, clickY[i] - strokeRect.y);
					}
					strokeCtx.lineTo(clickX[i] - strokeRect.x, clickY[i] - strokeRect.y);
					strokeCtx.closePath();
					strokeCtx.stroke();	
					
				}	
			}else{
			
				// Using bezier for smoother curves
				// http://perfectionkills.com/exploring-canvas-drawing-techniques/
				// https://codepen.io/kangax/pen/zofsp
				
				var p1 = {x:clickX[0] - strokeRect.x, y:clickY[0] - strokeRect.y};
				var p2 = {x:clickX[1] - strokeRect.x, y:clickY[1] - strokeRect.y};
			  
				strokeCtx.beginPath();
				strokeCtx.moveTo(p1.x, p1.y);
				//console.log(points);

				for (var i = 0, len = clickX.length; i < len; i++) {
					// we pick the point between pi+1 & pi+2 as the
					// end point and p1 as our control point
					var midPoint = EditorUtils.midPointBtw(p1, p2);
					strokeCtx.quadraticCurveTo(p1.x, p1.y, midPoint.x, midPoint.y);
					p1 = {x:clickX[i] - strokeRect.x, y:clickY[i] - strokeRect.y};
					p2 = {x:clickX[i+1] - strokeRect.x, y:clickY[i+1] - strokeRect.y};
				}
				// Draw last line as a straight line while
				// we wait for the next point to be able to calculate
				// the bezier control point
				strokeCtx.lineTo(p1.x, p1.y);
				strokeCtx.stroke();
			}
			
			// 4. To apply blur to eraser strokes we draw it to a blur canvas
			let blurCanvas = document.createElement("canvas");
			blurCanvas.width = strokeCtx.canvas.width; 
			blurCanvas.height = strokeCtx.canvas.height; 
			let blurCtx = blurCanvas.getContext("2d");
			blurCtx.clearRect(0,0,blurCanvas.width,blurCanvas.height);
			blurCtx.filter = "blur(" + brushBlur + "px)";		
			blurCtx.drawImage(strokeCanvas, 0, 0);
			blurCtx.filter = "none";

			// 5. Perform Clipping - if there is a selection
			EditorUtils.clipSelectionRegion(blurCtx, strokeRect);

			// 6. Apply eraser opacity to the eraser strokes data which is now in blur canvas
			let eraseImageData = blurCtx.getImageData(0, 0, blurCtx.canvas.width, blurCtx.canvas.height);  			
			for (let i = 0; i < eraseImageData.data.length; i += 4) {
				//invertImageData.data[i + 0] = eraseImageData.data[i + 0]; // R			
				//invertImageData.data[i + 1] = eraseImageData.data[i + 1]; // G			
				//invertImageData.data[i + 2] = eraseImageData.data[i + 2]; // B

				eraseImageData.data[i + 3] = eraseImageData.data[i + 3] * brushAlpha;
			}
			blurCtx.putImageData(eraseImageData, 0, 0);
			
			// APPLY THE BRUSH STROKES TO THE LAYER CANVAS OR RASTER MASK
			// editingLayerMask -> layer canvas (0), raster mask (1), or vector mask (2)
			if(editingLayerMask == 0){ 
			
				// DRAWING BRUSH ON LAYER CANVAS
			
				// clear the current layer canvas in the stack
				currentLayerCtx.clearRect(0,0,currentLayerCtx.canvas.width,currentLayerCtx.canvas.height);
				// draw the saved current layer canvas back to the current layer canvas in the stack to refresh
				currentLayerCtx.drawImage(eraserCanvas, 0, 0); // draw the original layer canvas image 
				// save the state of the layer canvas before composite operation
				currentLayerCtx.save(); 
				currentLayerCtx.globalCompositeOperation = brushBlendingMode;
				// 6. draw the brush strokes over the original layer canvas image
				//currentLayerCtx.drawImage(blurCanvas, strokeRect.x, strokeRect.y);	
				currentLayerCtx.drawImage(blurCanvas, strokeRect.x - layerStack[layerIndex].cumulativeNegatives.x, strokeRect.y - layerStack[layerIndex].cumulativeNegatives.y);	
				// restore the state of the layer canvas
				currentLayerCtx.restore();
				
			}else if(editingLayerMask == 1){ 
				
				// DRAW BRUSH ON RASTER MASK 
				
				// 1. get a reference to the drawing object for the raster_mask canvas in the stack
				var currentRasterMaskCtx = layerStack[layerIndex].raster_mask.canvas.getContext("2d");
				// 2. clear the current layer raster_mask canvas in the stack
				currentRasterMaskCtx.clearRect(0,0,currentRasterMaskCtx.canvas.width, currentRasterMaskCtx.canvas.height);
				// 3. draw the saved raster_mask canvas back to the current raster_mask canvas in the stack to refresh
				currentRasterMaskCtx.drawImage(savedCurrentRasterCanvas, 0, 0);
				
				currentRasterMaskCtx.save();
				
				// 3.Draw the brush strokes to the raster mask
				// should have a cumulativeNegatives for raster mask
				currentRasterMaskCtx.drawImage(blurCanvas, strokeRect.x - layerStack[layerIndex].cumulativeNegatives.x, strokeRect.y - layerStack[layerIndex].cumulativeNegatives.y);	
				currentRasterMaskCtx.restore();
				
				// 4. Generate opacity values from raster_mask grayscale brush strokes and draw in raster_mask opacity canvas
				// get the pixel or grayscale value of the raster_mask canvas and apply as opacity
				// to the raster_mask_opacity canvas
				let rasterMaskImageData = currentRasterMaskCtx.getImageData(strokeRect.x - layerStack[layerIndex].cumulativeNegatives.x, strokeRect.y - layerStack[layerIndex].cumulativeNegatives.y, blurCtx.canvas.width, blurCtx.canvas.height);  			
				for (let i = 0; i < rasterMaskImageData.data.length; i += 4) {
					//invertImageData.data[i + 0] = rasterMaskImageData.data[i + 0]; // R			
					//invertImageData.data[i + 1] = rasterMaskImageData.data[i + 1]; // G			
					//invertImageData.data[i + 2] = rasterMaskImageData.data[i + 2]; // B

					// Set the alpha value to any pixel channel value assuming all should be equal in a grayscale value
					// rasterMaskImageData.data[i + 3] = rasterMaskImageData.data[i + 0]; // Keeps the white regions of the mask for destination-in operation in renderengine
					// We changed the masking rastering to work with destination out for back portions
					rasterMaskImageData.data[i + 3] = rasterMaskImageData.data[i + 0];	  // Keeps the white portions of the mask for destination-out operation in renderengine
					//rasterMaskImageData.data[i + 3] = 255 - rasterMaskImageData.data[i + 0];	  // Keeps the black portions of the mask for destination-out operation in renderengine
					//rasterMaskImageData.data[i + 3] = 120;
				}
				//blurCtx.putImageData(rasterMaskImageData, 0, 0);	

				// write opacity into raster_mask_opacity canvas
				var currentRasterMaskOpacityCtx = layerStack[layerIndex].raster_mask.opacity_canvas.getContext("2d");
				currentRasterMaskOpacityCtx.putImageData(rasterMaskImageData, strokeRect.x - layerStack[layerIndex].cumulativeNegatives.x, strokeRect.y - layerStack[layerIndex].cumulativeNegatives.y);
				
			}else if(editingLayerMask == 2){ 
			
				// DRAW BRUSH ON VECTOR MASK 
				// *Nb. Though brushing is a raster operation so we will not be able to brush on vector mask
			}
	
			tempEditorCtx.restore();
				
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

// gets a bounding box of the stroke points
function getBrushstrokesBoundingRect(x_points, y_points, strokeSize){

	// For a polygon points region we need to get its bounds by determining the maximum and minimum points for each 
	// axis
	// we have to loop through and get the maximum and minimum of the polygon points to determine the height and width
	// and location of the polygon bounding rectangle
	
	let min_x = x_points[0], 
	max_x = x_points[0], 
	min_y = y_points[0], 
	max_y = y_points[0];
	
	for(let i = 0; i < x_points.length; i++) {
		
		// If the x is less than min_x then min_x is not the minimum
		if(x_points[i] < min_x){
			min_x = x_points[i];
		}
		
		// If the x is greater than max_x then max_x is not the maximum
		if(x_points[i] > max_x){
			max_x = x_points[i];
		}
		
		// If the y is less than min_y then min_y is not the minimum
		if(y_points[i] < min_y){
			min_y = y_points[i];
		}	

		// If the y is greater than max_y then max_y is not the maximum
		if(y_points[i] > max_y){
			max_y = y_points[i];
		}							
		
	}	

	min_x = min_x - strokeSize;
	min_y = min_y - strokeSize;
	
	// console.log(strokeSize);
	
	let selection_width = Math.abs(max_x - min_x) + strokeSize;
	let selection_height = Math.abs(max_y - min_y) + strokeSize;
	
	return {x: min_x, y: min_y, width: selection_width, height: selection_height};
	
	
}

$("#testBtn").click(function() {
	alert("Clearing Local storage");
	//localStorage.removeItem("editor_image");
	// localStorage.clear();
	
});

