// Copyright (c) 2019 Kasey Thomas. All rights reserved.
// Use of this source code is governed by the EULA.

'use strict';

// the main image being edited
// var image = new Image();
// image.addEventListener("load", loadEditorImage, true);

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

var canvasWidth = 0, canvasHeight = 0;
var cumulativeTranslations = {x:0, y:0};
var cumulativeNegatives = {x:0, y:0};

// Transformations
// var cumulativeTranslations = {x: 0, y: 0};

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

var dragselection = false;
var lastdragPoint = {};

var zoomDirectionSelect = document.getElementById("zoomDirectionSelect");
zoomDirectionSelect.onchange = function(){
	storeGlobalZoom(false);
}
var zoomValueLbl = document.getElementById("zoomValueLbl");

if (localStorage.getItem("zoom") === null) {
	//alert("no stored zoom");
	globalZoom = 100;
	zoomValueLbl.innerText = globalZoom + "%";
	zoomDirectionSelect.value = 1;
	
	workspaceDiv.style.cursor = "zoom-in";
	document.getElementById("canvasDiv").style.zoom = globalZoom + "%";
	
	storeGlobalZoom();
		
	// create a zoom Storage object
}else{
	// load the saved zoom
	//alert("we have zoom stored");
	var storedZoom = JSON.parse(localStorage.getItem("zoom"));
	//alert(JSON.stringify(storedZoom));
	globalZoom = storedZoom.zoom;
	zoomValueLbl.innerText = globalZoom + "%";
	zoomDirectionSelect.value = storedZoom.direction;
	
	if(parseInt(storedZoom.direction) == 1){
		workspaceDiv.style.cursor = "zoom-in";
	}else{
		workspaceDiv.style.cursor = "zoom-out";
	}
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

function storeGlobalZoom(reload = true){

	zoomValueLbl.innerText = globalZoom + "%";
	if(parseInt(zoomDirectionSelect.value) == 1){
		workspaceDiv.style.cursor = "zoom-in";
	}else{
		workspaceDiv.style.cursor = "zoom-out";
	}
	
	document.getElementById("canvasDiv").style.zoom = globalZoom + "%";
	
	
	// The size of the transparency tile is 16x16 but if there is different zoom
	// from 100% then it will change too. We do not want the background transparent tile to
	// change size with the zoom so we anti-zoom the transparent tile with css backgroundSize 
	// property to compensate.
	var tileSize = 16;
	// compensate scale the background tile
	document.getElementById("canvasDiv").style.backgroundSize = (16 * 100/globalZoom) + "px " + (16 * 100/globalZoom) + "px";


	var zoomStorageObject = {};
	zoomStorageObject.zoom = globalZoom;
	zoomStorageObject.direction = zoomDirectionSelect.value;
	
	localStorage.setItem("zoom", JSON.stringify(zoomStorageObject));
	
	if(reload){
		location.reload();
	}
	
}

var canvaspressed = false;
var dragPoints = {x1: 0, y1:0, x2:0, y2:0};

var workspaceMouseX = 0; // used to hold coordinates with respect to the workspaceContainerDiv
var workspaceMouseY = 0; // used to hold coordinates with respect to the workspaceContainerDiv
var mouseX = 0;
var mouseY = 0;

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

workspaceContainerDiv.addEventListener("dblclick", function(e){

	EditorUtils.setMouseCoordinates(e, workspaceContainerDiv);
	
});

workspaceContainerDiv.addEventListener("click", function(e){

	EditorUtils.setMouseCoordinates(e, workspaceContainerDiv);
	
	if(zoomDirectionSelect.value == "1"){
		//console.log("> " + globalZoom);	
		
		// search for the index of the current preset
		for(var i = 0; i < zoomPresets.length; i++){
			var foundindex = 0;
			if(globalZoom == zoomPresets[i]){
				if((i + 1) < zoomPresets.length){
					globalZoom = zoomPresets[i + 1];				
				}
				break
			}
		}
		document.getElementById("canvasDiv").style.zoom = globalZoom + "%";
		
		//console.log("new globalZoom: " + globalZoom);
		
	}else if(zoomDirectionSelect.value == "0"){
		//console.log("< " + globalZoom);	
		
		// search for the index of the current preset
		for(var i = 0; i < zoomPresets.length; i++){
			var foundindex = 0;
			if(globalZoom == zoomPresets[i]){
				if((i - 1) >= 0){
					globalZoom = zoomPresets[i - 1];				
				}
				break
			}
		}
		document.getElementById("canvasDiv").style.zoom = globalZoom + "%";
		
		//console.log("new globalZoom: " + globalZoom);
		
	}
	
	storeGlobalZoom();

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
	//editorCanvas.width = image.width;
	//editorCanvas.height = image.height;	
	
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

function KeyCheck(event)
{

	//alert(event.keyCode);

	// All CTRL Key Combinations
	if (event.ctrlKey) {
	
		// Undo - CTRL + Z
		if (event.keyCode == 90) {
			// performUndo();
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
			//alert("enter key pressed");
		break;
		case 8: // BACKSPACE KEY
			
		break; 
		case 27: // ESCAPE KEY

		break;
		case 46: // DELETE KEY
		
		break;
		case 37: // LEFT KEY

		break;		
		case 38: // UP KEY

		break;	
		case 39: // RIGHT KEY

		break;
		case 40: // DOWN KEY

		break;
		case 107: // MINUS
			alert("plus key");
		break;			
		case 109: // MINUS
			alert("minus key");
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