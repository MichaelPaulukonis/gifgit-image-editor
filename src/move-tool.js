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
workspaceDiv.style.cursor = "default";
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

var canvasWidth = 0, canvasHeight = 0;
var cumulativeTranslations = {x:0, y:0};
var cumulativeNegatives = {x:0, y:0};

// Transformations
// var cumulativeTranslations = {x: 0, y: 0};

// forms the background to the editor canvas
var canvasDiv = document.getElementById("canvasDiv");

var toolDrawCanvas = document.getElementById("toolDrawCanvas");
var toolDrawCtx = toolDrawCanvas.getContext("2d");

// for active selections
var selectionCanvas = document.getElementById("selectionCanvas");
var selectionCtx = selectionCanvas.getContext("2d");

var selectionMarchingAntsInterval;
var pauseMarchingAnts = false;
var activeSelectionArea;
var polyLassoLineOffset = 0;
var invertSelection = false;
var selectionActive = false;

var layerpressed = false;
var selectionpressed = false;
var dragPoints = {x1: 0, y1:0, x2:0, y2:0}; // used for moving rasterized layers
var lastdragPoint = {}; // used for moving in layer objects

var workspaceMouseX = 0; // used to hold coordinates with respect to the workspaceContainerDiv
var workspaceMouseY = 0; // used to hold coordinates with respect to the workspaceContainerDiv
var mouseX = 0;
var mouseY = 0;

var tempLayer;


var dragselection = false;
var lastdragPoint = {};


// check if all required modules are present (HTML5 Storage etc...)
initializeEditor();


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
	
		// determine if the mouse is in the active selection area
		if(typeof activeSelectionArea !== 'undefined'){

			// check if mouse in active selection area
			if(EditorUtils.checkPointInActiveSelection(selectionCtx, mouseX, mouseY)){
				// we have to do the move
				//console.log("move selection");
				startSelectionMove();
				
			}else{
				// Move the layer
				startMoveLayer();
			
			}
			
		}else{
			// Move the layer
			startMoveLayer()
		}
	}
});

function startSelectionMove(){

	dragPoints.x1 = mouseX;
	dragPoints.y1 = mouseY;
	dragPoints.x2 = mouseX;
	dragPoints.y2 = mouseY;
	
	lastdragPoint.x = mouseX;
	lastdragPoint.y = mouseY;

	selectionpressed = true;
}

function startMoveLayer(){
	// get the start of the move set all the points to the current coordinate
	dragPoints.x1 = mouseX;
	dragPoints.y1 = mouseY;
	dragPoints.x2 = mouseX;
	dragPoints.y2 = mouseY;
	
	lastdragPoint.x = mouseX;
	lastdragPoint.y = mouseY;
	
	layerpressed = true;		
}

workspaceContainerDiv.addEventListener("mousemove", function(e){

	//console.log(editingLayerMask);

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
		
		// get the incremental movement of the mouse
		var dragX = mouseX - lastdragPoint.x;
		var dragY = mouseY - lastdragPoint.y;	
		
		lastdragPoint.x = mouseX;
		lastdragPoint.y = mouseY;		
		
		if(layerpressed){
		
			// For rasterized layers
			dragPoints.x2 = mouseX;
			dragPoints.y2 = mouseY;
			
			// For layers with objects in them we alter the position of the object 
			if(!('object' in tempLayer)){
			
				// MOVING REGULAR LAYER

				// Where editingLayerMask determines whether edit applies to layer canvas (0), raster mask (1), or vector mask (2)
				if(editingLayerMask == 0){

					// Move the layer canvas
					tempLayer.cumulativeNegatives.x += dragX;
					tempLayer.cumulativeNegatives.y += dragY;	
				
					// If we have a raster_mask in the layer and it is linked we move it too
					if('raster_mask' in tempLayer && tempLayer.raster_mask.raster_mask_linked){
						tempLayer.raster_mask.cumulativeNegatives.x += dragX;
						tempLayer.raster_mask.cumulativeNegatives.y += dragY;	
					}


				}else if(editingLayerMask == 1){
				
					// Move the raster mask
					if('raster_mask' in layerStack[layerIndex]){
						tempLayer.raster_mask.cumulativeNegatives.x += dragX;
						tempLayer.raster_mask.cumulativeNegatives.y += dragY;	
					}
					
					// If the layer canvas is linked to the mask move it too
					if(layerStack[layerIndex].raster_mask.raster_mask_linked){
						tempLayer.cumulativeNegatives.x += dragX;
						tempLayer.cumulativeNegatives.y += dragY;					
					}
						
				}else if(editingLayerMask == 2){


				}
		
			}else{
			
				// MOVING OBJECTS
						
				// Where editingLayerMask determines whether edit applies to layer canvas (0), raster mask (1), or vector mask (2)
				if(editingLayerMask == 0){

					// Move the layer object
					if(tempLayer.object.type == "text_object"){	

						//console.log("move object: (" + dragX + "," + dragY + ")");	
						/*
						layerStack[layerIndex].object.textbox.x += dragX;
						layerStack[layerIndex].object.textbox.y += dragY;				
						*/
						tempLayer.object.textbox.x += dragX;
						tempLayer.object.textbox.y += dragY;
					}
				
					// If we have a raster_mask in the layer and it is linked we move it too
					if('raster_mask' in tempLayer && tempLayer.raster_mask.raster_mask_linked){
						tempLayer.raster_mask.cumulativeNegatives.x += dragX;
						tempLayer.raster_mask.cumulativeNegatives.y += dragY;	
					}

				}else if(editingLayerMask == 1){
				
					// Move the raster mask
					if('raster_mask' in layerStack[layerIndex]){
						tempLayer.raster_mask.cumulativeNegatives.x += dragX;
						tempLayer.raster_mask.cumulativeNegatives.y += dragY;	
					}
					
					// If the layer object is linked to the mask move it too
					if(tempLayer.raster_mask.raster_mask_linked){
					
						if(tempLayer.object.type == "text_object"){	

							//console.log("move object: (" + dragX + "," + dragY + ")");	
							/*
							layerStack[layerIndex].object.textbox.x += dragX;
							layerStack[layerIndex].object.textbox.y += dragY;				
							*/
							tempLayer.object.textbox.x += dragX;
							tempLayer.object.textbox.y += dragY;
						}		
						
					}
						
				}else if(editingLayerMask == 2){


				}
				
			}
			
			
			updateEditorCanvas();
		}
		
		if(selectionpressed){
		
			// MOVE THE SELECTION IN THE LAYER
			
			// For rasterized layers
			dragPoints.x2 = mouseX;
			dragPoints.y2 = mouseY;
			
			// make sure the layer is not an object so we can move the selected piece in
			// the layer
			if(!('object' in tempLayer)){
			
				// 1. Create an image capture of the selection region
				var selectionImgCanvas = document.createElement("canvas");
				selectionImgCanvas.width = tempLayer.canvas.width;
				selectionImgCanvas.height = tempLayer.canvas.height;
				var selectionImgCtx = selectionImgCanvas.getContext("2d");
				selectionImgCtx.drawImage(savedCurrentLayerCanvas, 0, 0);
				EditorUtils.clipSelectionRegion(selectionImgCtx, {x: tempLayer.cumulativeNegatives.x, y: tempLayer.cumulativeNegatives.y});
				
				// 2. Get the templayer drawing object
				var tempLayerCtx = tempLayer.canvas.getContext("2d");
				
				// refresh the templayer with the saved layer image
				tempLayerCtx.clearRect(0,0,tempLayer.canvas.width, tempLayer.canvas.height);
				tempLayerCtx.drawImage(savedCurrentLayerCanvas,0,0);	

				// 3. clear the region in the layer that is bounded by the selection
				EditorUtils.clearSelectionRegion(tempLayer.canvas.getContext("2d"),{x: tempLayer.cumulativeNegatives.x, y: tempLayer.cumulativeNegatives.y});
				
				// 4. draw the moved selection on the layer
				tempLayerCtx.save();
				//tempLayerCtx.translate(70, 70);
				tempLayerCtx.translate(dragPoints.x2 - dragPoints.x1, dragPoints.y2 - dragPoints.y1);
				tempLayerCtx.drawImage(selectionImgCanvas,0,0);
				tempLayerCtx.restore();
				
				// MOVE THE SELECTION also
				// To do this we translate the toolCanvas we do not move the selection itself
				// with EditorUtils.moveActiveSelection because it would cause the cleared
				// area to be moved.
				
				//toolDrawCtx.translate(dragX, dragY);
				// for some reason I have to compensate for global zoom and flip
				//toolDrawCtx.translate(dragX*(globalZoom/100)*globalTransformObject.flip_scaleX, dragY*(globalZoom/100)*globalTransformObject.flip_scaleY);
				updateToolCanvas();
				
			}
		
			updateEditorCanvas();		
		
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
		
		if(layerpressed){		
			// set the translation
			addTranslation(dragPoints.x2 - dragPoints.x1, dragPoints.y2 - dragPoints.y1, layerpressed, selectionpressed);

			layerpressed = false;	
		}
		
		if(selectionpressed){
		
			// set the translation
			addTranslation(dragPoints.x2 - dragPoints.x1, dragPoints.y2 - dragPoints.y1, layerpressed, selectionpressed);
		
			selectionpressed = false;
		}
	}	

	
});

function addTranslation(x_move,y_move,layer,selection){

	//alert((dragPoints.x2 - dragPoints.x1) + "," + (dragPoints.y2 - dragPoints.y1));
	
	if(x_move == 0 && y_move == 0){
		// alert("no movement made");
		return;
	}
	
	if(layer){
	
		if(!('object' in tempLayer)){
		
			// This is a regular rasterized layer
			
			/*
			var translateEditEntry = {
				edit: "translate_image", 
				edit_label: "Move", 
				geometry: {x: x_move,y: y_move}
			};
			*/	

			var translateEditEntry = new Object();
			translateEditEntry.edit = "translate_image";
			translateEditEntry.edit_label = "Move";
			var movelayer = new Object();
			movelayer.x = x_move;
			movelayer.y = y_move;
			translateEditEntry.geometry = movelayer;
			
			if(translateEditEntry === undefined){
			}else{
			
				// add to the crop edit stack
				editStack.add(translateEditEntry);
				
				applyEditHistory();
			}
			
		}else{
		
			// This is an object layer
			//console.log("update object position");
			
			
			if(tempLayer.object.type == "text_object"){
			
				/*
				var translateEditEntry = {
					edit: "translate_image", 
					edit_label: "Move", 
					geometry: {x: x_move,y: y_move}
				};
				*/	
			
				var translateEditEntry = new Object();
				translateEditEntry.edit = "translate_object";
				translateEditEntry.type = "text_object";
				translateEditEntry.edit_label = "Move";	
				// Add the information to reposition the textbox
				var textPosition = new Object();
				/*
				textPosition.x = layerStack[layerIndex].object.textbox.x;
				textPosition.y = layerStack[layerIndex].object.textbox.y;		
				*/			
				textPosition.x = tempLayer.object.textbox.x;
				textPosition.y = tempLayer.object.textbox.y;
				translateEditEntry.textbox_position = textPosition;
				// Add the translate information
				var movelayer = new Object();
				movelayer.x = x_move;
				movelayer.y = y_move;
				translateEditEntry.geometry = movelayer;
					
				//alert(JSON.stringify(translateEditEntry));
				
				if(translateEditEntry === undefined){
				}else{
				
					// add to the crop edit stack
					editStack.add(translateEditEntry);
					//alert("move object");
					applyEditHistory();
				}
				
			}

		}	
		
	}

	// Move the layer in the selection
	if(selection){
	
		if(!('object' in tempLayer)){
		
			//alert("move the selection (" + x_move + "," + y_move + ")");
			var translateEditEntry = new Object();
			translateEditEntry.edit = "translate_layer_selection";
			translateEditEntry.edit_label = "Move";
			var movelayer = new Object();
			movelayer.x = x_move;
			movelayer.y = y_move;
			translateEditEntry.geometry = movelayer;
			
			if(translateEditEntry === undefined){
			}else{
			
				// add to the crop edit stack
				editStack.add(translateEditEntry);
				
				applyEditHistory();
			}
		
		}
			
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

	tempLayer = EditorUtils.createLayerCopy(layerStack[layerIndex]);
	//console.log(JSON.stringify(tempLayer));
	/*
	var testCanvas = document.getElementById("testCanvas");
	testCanvas.width = tempLayer.canvas.width;
	testCanvas.height = tempLayer.canvas.height;
	var testCtx = testCanvas.getContext("2d");
	testCtx.drawImage(tempLayer.canvas, 0, 0);
	*/
	/*
	var testCanvas = document.getElementById("testCanvas");
	testCanvas.width = tempLayer.raster_mask.canvas.width;
	testCanvas.height = tempLayer.raster_mask.canvas.height;
	var testCtx = testCanvas.getContext("2d");
	testCtx.drawImage(tempLayer.raster_mask.canvas, 0, 0);	
	*/
	/*
	var testCanvas = document.getElementById("testCanvas");
	testCanvas.width = tempLayer.raster_mask.opacity_canvas.width;
	testCanvas.height = tempLayer.raster_mask.opacity_canvas.height;
	var testCtx = testCanvas.getContext("2d");
	testCtx.drawImage(tempLayer.raster_mask.opacity_canvas, 0, 0);
	*/	

	// set the editor canvas to the image width
	//editorCanvas.width = image.width;
	//editorCanvas.height = image.height;	
	
	editorCanvas.width = canvasWidth;
	editorCanvas.height = canvasHeight;
	

	// Save the current layer canvas
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
	
	// For layers
	/*
	document.getElementById("layer0Img").src = image.src;
	document.getElementById("layerSelect").value = editStack.layer;
	*/
	/*
	// BELOW IS DEVELOPMENT FOR THE HISTOGRAM
	// Create a histogram canvas
	var histogramCanvas = document.createElement("canvas");
	histogramCanvas.width = 255;
	histogramCanvas.height = 150;
	var histogramCtx = histogramCanvas.getContext("2d");
	histogramCtx.strokeStyle = "rgb(0,0,0)";
	histogramCtx.lineWidth = 1;
	histogramCtx.fillStyle = "rgb(206, 206, 206)";
	histogramCtx.fillRect(0,0,255,200);
	
	var redHistogramValues = [];
	// initiate all the values to zero
	for(var x = 0; x < 256; x++){
		redHistogramValues[x] = 0;
	}
	
	// get the red pixels of the image in the editor canvas
	var redChannelData = editorCtx.getImageData(0, 0, editorCanvas.width, editorCanvas.height);
	
	for (let i = 0; i < redChannelData.data.length; i += 4) {
		// we count the number of pixels at each greyscale intensity level of red
		// by incrementing the intensity level index in the redHistogramValues array
		// of values
		redHistogramValues[redChannelData.data[i + 0]] += 1;// RED
		// redHistogramValues[redChannelData.data[i + 1]] += 1;// GREEN
		// redHistogramValues[redChannelData.data[i + 2]] += 1;// BLUE

	}
	
	//alert(JSON.stringify(redHistogramValues));
	
	
	// Calculate the normalization factor that keeps the pixel count per intensity
	// within the height of the graph. To do this we get the maximum value then 
	// divide the height of the graph canvas by the maximum value. We then multiply
	// all the values in the array by that normalization factor.
	// alert(Math.max(...redHistogramValues)); // 4
	var maxCount = Math.max(...redHistogramValues);
	var normFactor = histogramCanvas.height/maxCount;
	//alert();

	// Now that we have the count of all pixels per intensity level we draw to the histogram graph
	histogramCtx.beginPath();
	for(var x = 0; x < 256; x++){
		
		// We draw a line that represent the sum of all pixels at intensity of x (from 0-255)
	
		// 1. Normalize the sum of the pixels at the intensity to the height of the graph canvas		
		histogramCtx.moveTo(x, 0);
		histogramCtx.lineTo(x, redHistogramValues[x]*normFactor);
		histogramCtx.stroke();
	}

	
	// The Histogram drawn in the canvas will be upside down so it has to be flipped
	var flipHistogramCanvas = document.createElement("canvas");
	flipHistogramCanvas.width = 255;
	flipHistogramCanvas.height = 200;
	var flipHistogramCtx = flipHistogramCanvas.getContext("2d");
	
	flipHistogramCtx.translate(0, flipHistogramCanvas.height);
	flipHistogramCtx.scale(1, -1);
	flipHistogramCtx.drawImage(histogramCanvas, 0, 0); // draw the image	
	
	document.getElementById("rightbox").appendChild(flipHistogramCanvas);
	
	// Put a gradient bar fading from black to white below the histogram
	// Just like image editors
	var gradientBarCanvas = document.createElement("canvas");
	gradientBarCanvas.width = histogramCanvas.width;
	gradientBarCanvas.height = 12;
	var gradientBarCtx = gradientBarCanvas.getContext("2d");
	
	// Create gradient
	var grd = gradientBarCtx.createLinearGradient(0, 0, gradientBarCanvas.width, 0);
	grd.addColorStop(0, "black");
	grd.addColorStop(1, "white");

	// Fill with gradient
	gradientBarCtx.fillStyle = grd;
	gradientBarCtx.fillRect(0, 0, gradientBarCanvas.width, gradientBarCanvas.height);	
	
	document.getElementById("rightbox").appendChild(gradientBarCanvas);
	*/
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
	
	// Loop through all the layer array stack canvases drawing them to editorCanvas.
	// Apply the current operation (translate) to the current selected layer (layerIndex)
	for(let j = 0; j < layerStack.length; j++){
	
		if(layerStack[j].visible){
			// If layer is visible continue
		}else{
			// If the layer is not visible then do no rendering of it
			continue;
		}	
	
		
		if(j == layerIndex){
		
			// If this is the current layer we will apply translation to it
		
			tempEditorCtx.save();
			
			/*
			// VERY IMPORTANT
				Object layers do not use translateions. Their positions are updated in the "mousemove" event.
				Therefore we only apply translations to the canvas where the layer is a rasterized non-object layer.
			*/
			if(!('object' in layerStack[j])){			
				// 1. translate the editor canvas based on mouse move
				//tempEditorCtx.translate(dragPoints.x2 - dragPoints.x1, dragPoints.y2 - dragPoints.y1);
			}

			//===============================================
			//Render the layer at the current layer index
			layerRenderEngine.renderLayerIndex(tempEditorCtx, j, tempLayer);	
			//===============================================	
			
			tempEditorCtx.restore();
			
		}else{

			//===============================================
			//Render the layer at the current layer index
			layerRenderEngine.renderLayerIndex(tempEditorCtx, j);	
			//===============================================	
		
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

// draws the selection region described by activeSelectionArea 
// in the context ctx
function drawSelectionClipping(ctx){

	// 1. Fill the whole draw canvas with green
	ctx.fillStyle = "rgba(0, 255, 0, 1)";	
	ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);	

	// 2. Perform Clipping - if there is a selection
	if(typeof activeSelectionArea === "undefined"){
		//alert("no selection to clip");
		// No selection active for clipping
		// UNCLIPPED ERASE STROKES
		// Do nothing to the eraser strokes canvas			
	}else{
		//alert("we have clip selection");
		if(activeSelectionArea.shape == "rectangle"){
			// RECTANGULAR CLIPPING OF ERASER
		
			// Erasing with rectangular selection clipping
			//console.log("rectangle clip eraser");
			/*
			activeSelectionArea = {
				shape: "rectangle",
				geometry: {x: squareSelectionRect.x, y: squareSelectionRect.y, width: squareSelectionRect.width, height: squareSelectionRect.height},
				invert: invertSelection,
				invert_rect: {x: 0, y:0, width: editorCanvas.width, height: editorCanvas.height}
			};
			*/
			
			if(!invertSelection){
				// KEEP ERASER STROKES IN THE RECTANGULAR Selection
				ctx.save();
				ctx.globalCompositeOperation = 'destination-in';
				ctx.fillStyle = "rgba(0, 255, 0, 1)";
				ctx.fillRect(activeSelectionArea.geometry.x - layerStack[0].cumulativeNegatives.x, activeSelectionArea.geometry.y - layerStack[0].cumulativeNegatives.y, activeSelectionArea.geometry.width, activeSelectionArea.geometry.height);
				ctx.restore();							
			}else{
				// KEEP ERASER STROKES ONLY OUTSIDE RACTANGULAR SELECTION
				ctx.save();
				ctx.globalCompositeOperation = 'destination-out';
				ctx.fillStyle = "rgba(0, 255, 0, 1)";
				ctx.fillRect(activeSelectionArea.geometry.x - layerStack[0].cumulativeNegatives.x, activeSelectionArea.geometry.y - layerStack[0].cumulativeNegatives.y, activeSelectionArea.geometry.width, activeSelectionArea.geometry.height);
				ctx.restore();								
			}
	
		}if(activeSelectionArea.shape == "ellipse"){

			if(!invertSelection){
				// Clear in the  Ellipse Selection
				ctx.save();
				ctx.globalCompositeOperation = 'destination-in';
				ctx.fillStyle = "rgba(0, 255, 0, 1)";
				ctx.beginPath();
				ctx.ellipse(activeSelectionArea.geometry.x - layerStack[0].cumulativeNegatives.x, activeSelectionArea.geometry.y - layerStack[0].cumulativeNegatives.y, activeSelectionArea.geometry.radiusX, activeSelectionArea.geometry.radiusY, activeSelectionArea.geometry.rotation, activeSelectionArea.geometry.startAngle, activeSelectionArea.geometry.endAngle);
				ctx.fill();	
				ctx.restore();							
			}else{
				// CLEAR OUTSIDE Ellipse SELECTION
				ctx.save();
				ctx.globalCompositeOperation = 'destination-out';
				ctx.fillStyle = "rgba(0, 255, 0, 1)";
				ctx.beginPath();
				ctx.ellipse(activeSelectionArea.geometry.x - layerStack[0].cumulativeNegatives.x, activeSelectionArea.geometry.y - layerStack[0].cumulativeNegatives.y, activeSelectionArea.geometry.radiusX, activeSelectionArea.geometry.radiusY, activeSelectionArea.geometry.rotation, activeSelectionArea.geometry.startAngle, activeSelectionArea.geometry.endAngle);
				ctx.fill();	
				ctx.restore();							
			}		
		
		}else if(activeSelectionArea.shape == "freeform"){
			// FREEFORM/POLYGON CLIPPING OF ERASING

			/*
			We use composite operations to generate the clipping of the brush strokes with the freeform selection
			https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/globalCompositeOperation
			
				KEEP BRUSH STROKES IN
				where we want to keep the brush in the freeform polygon selection we set destination-in then draw
				the polygon clipping area.
			*/
			
			if(!invertSelection){
			
				// Keep the brushstrokes that are in the polygon selection overlay shape
				ctx.save();
				ctx.globalCompositeOperation = 'destination-in';
				ctx.fillStyle = "rgba(0, 255, 0, 1)";
				ctx.beginPath();
				for(let i = 0; i < activeSelectionArea.geometry.length; i++) {
					if(i == 0){
						ctx.moveTo(activeSelectionArea.geometry[i].x - layerStack[0].cumulativeNegatives.x, activeSelectionArea.geometry[i].y - layerStack[0].cumulativeNegatives.y);
					}else{
						ctx.lineTo(activeSelectionArea.geometry[i].x - layerStack[0].cumulativeNegatives.x, activeSelectionArea.geometry[i].y - layerStack[0].cumulativeNegatives.y);
					}
				}
				ctx.closePath();
				ctx.fill();
				ctx.restore();	
				
			}else{
			
				ctx.save();
				ctx.globalCompositeOperation = 'destination-out';
				ctx.fillStyle = "rgba(0, 255, 0, 1)";
				ctx.beginPath();
				for(let i = 0; i < activeSelectionArea.geometry.length; i++) {
					if(i == 0){
						ctx.moveTo(activeSelectionArea.geometry[i].x - layerStack[0].cumulativeNegatives.x, activeSelectionArea.geometry[i].y - layerStack[0].cumulativeNegatives.y);
					}else{
						ctx.lineTo(activeSelectionArea.geometry[i].x - layerStack[0].cumulativeNegatives.x, activeSelectionArea.geometry[i].y - layerStack[0].cumulativeNegatives.y);
					}
				}
				ctx.closePath();
				ctx.fill();
				ctx.restore();	
				
			}
			
		}
	
	}
			
}	

function checkMouseInSelection(x,y){
	// if the selection is 
	var imgData = selectionCtx.getImageData(x, y, 1, 1);
	return imgData.data[3];
}

function KeyDownCheck(event){

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
			/*
			EditorUtils.moveActiveSelection(activeSelectionArea, -parseInt(moveStep.value), 0);
			// This can't be placed here because keydown event polls so have to put in keyup event
			//EditorUtils.addMoveActiveSelectionEntry(activeSelectionArea);
			*/
		break;		
		case 38: // UP KEY
			/*
			// negative up because of top, left origin coordinates
			EditorUtils.moveActiveSelection(activeSelectionArea, 0, -parseInt(moveStep.value));
			// This can't be placed here because keydown event polls so have to put in keyup event
			//EditorUtils.addMoveActiveSelectionEntry(activeSelectionArea);
			*/
		break;	
		case 39: // RIGHT KEY
			/*
			//alert("RIGHT pressed");
			EditorUtils.moveActiveSelection(activeSelectionArea, parseInt(moveStep.value), 0);
			// This can't be placed here because keydown event polls so have to put in keyup event
			//EditorUtils.addMoveActiveSelectionEntry(activeSelectionArea);
			*/
		break;
		case 40: // DOWN KEY
			/*
			// down positive y because of top, left origin coordinates
			EditorUtils.moveActiveSelection(activeSelectionArea, 0, parseInt(moveStep.value));
			// This can't be placed here because keydown event polls so have to put in keyup event
			//EditorUtils.addMoveActiveSelectionEntry(activeSelectionArea);
			*/
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
			performUndo();
		}
		
		// Redo with CTRL + Y
		if (event.keyCode == 89) {
			performRedo();
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
			//EditorUtils.addMoveActiveSelectionEntry(activeSelectionArea);
			if(activeSelectionArea){
				addTranslation(-1, 0, false, true);
			}else{
				addTranslation(-1, 0, true, false);
			}
		break;		
		case 38: // UP KEY
			//EditorUtils.addMoveActiveSelectionEntry(activeSelectionArea);
			if(activeSelectionArea){
				addTranslation(0, -1, false, true);
			}else{
				addTranslation(0, -1, true, false);
			}
		break;	
		case 39: // RIGHT KEY
			//alert("RIGHT pressed");
			//EditorUtils.addMoveActiveSelectionEntry(activeSelectionArea);
			if(activeSelectionArea){
				addTranslation(1, 0, false, true);
			}else{
				addTranslation(1, 0, true, false);
			}
		break;
		case 40: // DOWN KEY
			// down positive y because of top, left origin coordinates
			//EditorUtils.addMoveActiveSelectionEntry(activeSelectionArea);
			if(activeSelectionArea){
				addTranslation(0, 1, false, true);
			}else{
				addTranslation(0, 1, true, false);
			}
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
