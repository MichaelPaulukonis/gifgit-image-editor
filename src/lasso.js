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
var toolDrawCanvas = document.getElementById("toolDrawCanvas");
var toolDrawCtx = toolDrawCanvas.getContext("2d");

// for active selections
var selectionCanvas = document.getElementById("selectionCanvas")
var selectionCtx = selectionCanvas.getContext("2d");

var selectionMarchingAntsInterval;
var pauseMarchingAnts = false;  // for active marching ants, indicates that they should be paused (for draw, erase tools etc)
var polyLassoLineOffset = 0;
var invertSelection = false;
var activeSelectionArea;
var selectionActive = false; 	// indicates that the selection area defining with a tool is done and 
								// marching ants should start around selection area
var dragselection = false;
var clickX = new Array();
var clickY = new Array();
var clickDrag = new Array();
var lastdragPoint = {};
var paint = false;

var selectOperationSelect = document.getElementById("selectOperationSelect");
var moveStep = document.getElementById("moveStep");

var workspaceMouseX = 0; // used to hold coordinates with respect to the workspaceContainerDiv
var workspaceMouseY = 0; // used to hold coordinates with respect to the workspaceContainerDiv
var mouseX = 0;
var mouseY = 0;

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
				
				// We don't want to start a new selection so return
				return;
			}else{

			}
			
		}else{
			
		}	
		
	}else{
	
		if(mouseX < 0 || mouseY < 0 || mouseX > editorCanvas.width || mouseY > editorCanvas.height){
			return;
		}
		
		// If new selection mode chosen then delete the last selection from the screen
		if(selectOperationSelect.value == "new"){
			activeSelectionArea = undefined;
			updateToolCanvas();
		}		
		
		paint = true;
		selectionActive = false;
		invertSelection = false;
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
			workspaceContainerDiv.style.cursor = "default";
		}
		
	}else{
		//console.log("no active selection");	
	}	
	
	// for brush, erase, lasso(freeform)
	if(paint){
		addClick(mouseX, mouseY, true);
		updateToolCanvas();
	}
	
	// MOVE ANY ACTIVE SELECTION
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
	
});

workspaceContainerDiv.addEventListener("mouseup", function(e){

	EditorUtils.setMouseCoordinates(e, workspaceContainerDiv);
	
	// done painting with the brush so update the image object
	if(paint){
		stopBrushPaint();
	}
	
	paint = false;
	
	if(transformSelection){
	
		if(dragselection){
			EditorUtils.addMoveActiveSelectionEntry(activeSelectionArea);
			dragselection = false;
		}
	}
	
});

function addClick(x, y, dragging)
{
  clickX.push(x);
  clickY.push(y);
  clickDrag.push(dragging);
}

// clear all the brush variables when finish a brush drawing routine and 
// update the canvas image with the new data
function stopBrushPaint(){

	
	selectionActive = true;

	if((selectOperationSelect.value) == "new" || activeSelectionArea === undefined){
	
		// REPLACE THE LAST SELECTION OR CREATE NEW SELECTION
		
		let lassoCoords = [];
		
		for(let i = 0; i < clickX.length; i++){
			lassoCoords[i] = {};
			lassoCoords[i].x = clickX[i];
			lassoCoords[i].y = clickY[i];
		}
		
		activeSelectionArea = {
			shape: "freeform", 
			geometry: lassoCoords, 
			invert: invertSelection,
			invert_rect: {x: 0, y:0, width: editorCanvas.width, height: editorCanvas.height}
		};
		
		// we also store the mouseOffsetLeft, mouseOffsetTop for drawing on the toolDrawCanvas because they may not be set initially
		/*
		let selectEditEntry = {
			edit: "select", 
			edit_label: "Lasso Select", 
			selection: activeSelectionArea, 
			offsetLeft: mouseOffsetLeft, 
			offsetTop: mouseOffsetTop
		};
		*/
		
		var rect = new Object();
		rect.x = 0;
		rect.y = 0;
		rect.width = editorCanvas.width;
		rect.height = editorCanvas.height;
		
		var selectionArea = new Object();
		selectionArea.shape = "freeform";
		selectionArea.geometry = lassoCoords;
		selectionArea.invert = invertSelection;
		selectionArea.invert_rect = rect;
		
		var selectEditEntry = new Object();
		selectEditEntry.edit = "select";
		selectEditEntry.edit_label = "Lasso Select";
		selectEditEntry.selection = activeSelectionArea;
		selectEditEntry.offsetLeft = mouseOffsetLeft;
		selectEditEntry.offsetTop = mouseOffsetTop;

		//alert(JSON.stringify(deleteEditEntry));
		
		// add selection to the edit stack
		editStack.add(selectEditEntry);
		
		applyEditHistory();

		/*
		// Start the marching ants for the active selection
		startMarchingAnts();	
		
		clickX = [];
		clickY = [];
		clickDrag = [];
		*/
		
	}else{
		// COMBINE OLD SELECTION AND NEW SELECTION
		//alert("perform selection shape arithmetic");
		
		let lassoCoords = [];
		
		for(let i = 0; i < clickX.length; i++){
			lassoCoords[i] = {};
			lassoCoords[i].x = clickX[i];
			lassoCoords[i].y = clickY[i];
		}
		
		var tempActiveSelectionArea = {
			shape: "freeform", 
			geometry: lassoCoords, 
			invert: invertSelection,
			invert_rect: {x: 0, y:0, width: editorCanvas.width, height: editorCanvas.height}
		};				
		
		EditorUtils.performSelectionArithmeticOperation("Lasso Select",selectOperationSelect.value, activeSelectionArea, tempActiveSelectionArea);
			
	}
	
					
	// Start the marching ants for the active selection
	startMarchingAnts();

}


function startMarchingAnts(){
	// Start the marching ants for the selection
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

	// reset any drawn points
	clickX = new Array();
	clickY = new Array();
	clickDrag = new Array();

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
	
	eraserCanvas.width = canvasWidth;
	eraserCanvas.height = canvasHeight;

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

	//editorCtx.clearRect(0, 0, editorCanvas.width, editorCanvas.height); // Clear the canvas
	toolDrawCtx.clearRect(0, 0, toolDrawCtx.canvas.width, toolDrawCtx.canvas.height); // Clear the canvas
	toolDrawCtx.save();	
	
	// Add transforms to the tool canvas 
	//EditorUtils.applyImageCanvasTransformations(toolDrawCtx);
	
	// Draw The Active Selection Area
	// This code has been moved from the end because the gradient drawing line was not been shown over the wand selection
	if(activeSelectionArea){
		EditorUtils.drawActiveSelection();
	}

	/*
	if(typeof image === 'undefined'){
	}else{
	
		// if there is a background color set
		//editorCtx.fillStyle = "#ffffff";
		//editorCtx.fillRect(0, 0, editorCanvas.width, editorCanvas.height);
	
		editorCtx.drawImage(image, 0, 0, editorCanvas.width, editorCanvas.height);
	}
	*/

	if(clickX.length > 0){
		
		if(!selectionActive){
		
	
			// Drawing The Selection
			// For every selection we are drawing we create a temp copy of it and apply any global transformations to
			// the temp then draw the  temp to the canvas.
		
			// Lasso Tool is in the drawing phase
			
			toolDrawCtx.strokeStyle = "rgba(255,255,255,1)";
			toolDrawCtx.lineJoin = "round";
			toolDrawCtx.lineWidth = 1;
			
			toolDrawCtx.shadowColor = 'rgba(0, 0, 0, .8)';
			toolDrawCtx.shadowBlur = 1;
			
			var tempLasso = new Object();
			tempLasso.points = [];
			for(let i = 0; i < clickX.length; i++) {
				var p = new Object();
				p.x = clickX[i];
				p.y = clickY[i];
				tempLasso.points.push(p);
			}
			
			EditorUtils.globalImageRotateActiveSelection(tempLasso, "freeform");	
			
			toolDrawCtx.beginPath();
			for(let i = 0; i < tempLasso.points.length; i++) {
			
				if(clickDrag[i] && i){
					toolDrawCtx.moveTo(tempLasso.points[i - 1].x * (globalZoom/100) + canvasOffsetLeft, tempLasso.points[i-1].y * (globalZoom/100) + canvasOffsetTop);
				}else{
					toolDrawCtx.moveTo((tempLasso.points[i].x-1) * (globalZoom/100) + canvasOffsetLeft, tempLasso.points[i].y * (globalZoom/100) + canvasOffsetTop);
				}
				toolDrawCtx.lineTo(tempLasso.points[i].x * (globalZoom/100) + canvasOffsetLeft, tempLasso.points[i].y * (globalZoom/100) + canvasOffsetTop);

			}			
			/*		
			for(let i = 0; i < clickX.length; i++) {
				if(clickDrag[i] && i){
					toolDrawCtx.moveTo(clickX[i-1] * (globalZoom/100) + canvasOffsetLeft, clickY[i-1] * (globalZoom/100) + canvasOffsetTop);
				}else{
					toolDrawCtx.moveTo((clickX[i]-1) * (globalZoom/100) + canvasOffsetLeft, clickY[i] * (globalZoom/100) + canvasOffsetTop);
				}
				toolDrawCtx.lineTo(clickX[i] * (globalZoom/100) + canvasOffsetLeft, clickY[i] * (globalZoom/100) + canvasOffsetTop);
			}	
			*/
			toolDrawCtx.closePath();
			toolDrawCtx.stroke();				
			
		}
		
	}
	
	toolDrawCtx.restore();
	
}

function updateEditorCanvas(){	
		
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
			
		break;
		case 8: // BACKSPACE KEY
			

		break; 
		case 27: // ESCAPE KEY

		break;
		case 46: // DELETE KEY
		
		break;
		case 37: // LEFT KEY
			//alert("LEFT pressed");
			EditorUtils.moveActiveSelection(activeSelectionArea, -parseInt(moveStep.value), 0);
			// This can't be placed here because keydown event polls so have to put in keyup event
			//EditorUtils.addMoveActiveSelectionEntry(activeSelectionArea);
		break;		
		case 38: // UP KEY
			// negative up because of top, left origin coordinates
			EditorUtils.moveActiveSelection(activeSelectionArea, 0, -parseInt(moveStep.value));
			// This can't be placed here because keydown event polls so have to put in keyup event
			//EditorUtils.addMoveActiveSelectionEntry(activeSelectionArea);
		break;	
		case 39: // RIGHT KEY
			//alert("RIGHT pressed");
			EditorUtils.moveActiveSelection(activeSelectionArea, parseInt(moveStep.value), 0);
			// This can't be placed here because keydown event polls so have to put in keyup event
			//EditorUtils.addMoveActiveSelectionEntry(activeSelectionArea);
		break;
		case 40: // DOWN KEY
			// down positive y because of top, left origin coordinates
			EditorUtils.moveActiveSelection(activeSelectionArea, 0, parseInt(moveStep.value));
			// This can't be placed here because keydown event polls so have to put in keyup event
			//EditorUtils.addMoveActiveSelectionEntry(activeSelectionArea);
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
			EditorUtils.addMoveActiveSelectionEntry(activeSelectionArea);
		break;		
		case 38: // UP KEY
			EditorUtils.addMoveActiveSelectionEntry(activeSelectionArea);
		break;	
		case 39: // RIGHT KEY
			//alert("RIGHT pressed");
			EditorUtils.addMoveActiveSelectionEntry(activeSelectionArea);
		break;
		case 40: // DOWN KEY
			// down positive y because of top, left origin coordinates
			EditorUtils.addMoveActiveSelectionEntry(activeSelectionArea);
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