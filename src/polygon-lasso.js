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

// keyboard events
document.addEventListener("keydown", KeyDownCheck);
document.addEventListener("keyup", KeyUpCheck);

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

// Polygon Lasso Tool
var polygonLassoCoords = [];
var polyLassoHoverPoint = {x: 0, y: 0};
var polyLassoDone = false;

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
var paint = false;

// for selection dragging
var drawingpolylasso = false;
var lastdragPoint = {};

var workspaceMouseX = 0; // used to hold coordinates with respect to the workspaceContainerDiv
var workspaceMouseY = 0; // used to hold coordinates with respect to the workspaceContainerDiv
var mouseX = 0;
var mouseY = 0;

var moveStep = document.getElementById("moveStep");

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

	drawingpolylasso = false;

	EditorUtils.setMouseCoordinates(e, workspaceContainerDiv);
	
	// If dragging we dont want any polygon clicking stuff
	if(transformSelection){
		
	}else{
	
		// we have to have at least three point coordinates to define a polygon
		//alert(polygonLassoCoords.length);
		if(polygonLassoCoords.length > 2){
		
			polyLassoDone = true;
			
			selectionActive = true;
			
			if((selectOperationSelect.value) == "new" || activeSelectionArea === undefined){
			
				// REPLACE THE LAST SELECTION OR CREATE NEW SELECTION
				activeSelectionArea = {
					shape: "freeform", 
					geometry: polygonLassoCoords, 
					invert: invertSelection,
					invert_rect: {x: 0, y:0, width: editorCanvas.width, height: editorCanvas.height}
				};

				/*
				// we also store the mouseOffsetLeft, mouseOffsetTop for drawing on the toolDrawCanvas because they may not be set initially
				let selectEditEntry = {
					edit: "select", 
					edit_label: "Polygon Lasso Select", 
					selection: activeSelectionArea, 
					offsetLeft: mouseOffsetLeft, 
					offsetTop: mouseOffsetTop
				};
				*/
				
				var lassoCoords = [];
				
				for(var i = 0; i < polygonLassoCoords.length; i++){
					lassoCoords[i] = new Object;
					lassoCoords[i].x = polygonLassoCoords[i].x;
					lassoCoords[i].y = polygonLassoCoords[i].y;
				}		
				
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
				selectEditEntry.edit_label = "Polygon Lasso Select";
				selectEditEntry.selection = selectionArea;
				selectEditEntry.offsetLeft = mouseOffsetLeft;
				selectEditEntry.offsetTop = mouseOffsetTop;
				
				// add selection to the edit stack
				editStack.add(selectEditEntry);
				
				applyEditHistory();
				
				/*
				// Start the marching ants for the active selection
				startMarchingAnts();		
				*/
				
			}else{
				// COMBINE OLD SELECTION AND NEW SELECTION
				//alert("perform selection shape arithmetic");
		
				var tempActiveSelectionArea = {
					shape: "freeform", 
					geometry: polygonLassoCoords, 
					invert: invertSelection,
					invert_rect: {x: 0, y:0, width: editorCanvas.width, height: editorCanvas.height}
				};
				
				EditorUtils.performSelectionArithmeticOperation("Lasso Select",selectOperationSelect.value, activeSelectionArea, tempActiveSelectionArea);
			
			}
			
						
			// Start the marching ants for the active selection
			startMarchingAnts();
			

		}	
	}
	
});

workspaceContainerDiv.addEventListener("click", function(e){

	EditorUtils.setMouseCoordinates(e, workspaceContainerDiv);
	
	// If dragging we dont want any polygon clicking stuff
	if(transformSelection){
		return;
	}

	if((!polyLassoDone) || (selectionActive)){
		
		if(selectionActive){
			// clear the points of the previous active poly lasso selection
			polygonLassoCoords = []; // reset any shape coordinates set
		}
		
		// console.log(polygonLassoCoords.length);
	
		polyLassoDone = false;
		selectionActive = false;
		invertSelection = false;
		clearInterval(selectionMarchingAntsInterval);
	
		//alert("polygon lasso");
		if(polygonLassoCoords.length == 0){
		
			// the first point in the polygon lasso boundary coords list 
			// so just add
			polygonLassoCoords.push({x: mouseX, y: mouseY});
			
		}else{
		
			// adding a point to the list check how close it is to the 
			let lastPolyCoords = polygonLassoCoords[polygonLassoCoords.length - 1];
			
			// there minimum threshold distance of 5 pixels to add points
			if(distanceBetweenPoints(mouseX, mouseY, lastPolyCoords.x, lastPolyCoords.y) > 1){
				polygonLassoCoords.push({x: mouseX, y: mouseY});
			}else{
				// if the new clicked point doesn't meet threshold update the last point like in Gimp
				// so that it moves to the current clicked point
				lastPolyCoords.x = mouseX;
				lastPolyCoords.y = mouseY;
			}
			
			updateToolCanvas();	
		}
		
		// having this here produced the erroneous effect of having a trailing line to the last
		// active polygon lasso end point if lasso draws were done consecutively
		//updateEditorCanvas();		
	}

});

workspaceContainerDiv.addEventListener("mousedown", function(e){

	EditorUtils.setMouseCoordinates(e, workspaceContainerDiv);
	
	if(transformSelection){
		if(activeSelectionArea){
			// console.log("active selection");
			
			// check if mouse in active selection area
			if(EditorUtils.checkPointInActiveSelection(selectionCtx, mouseX, mouseY)){
				// we have to do the move
				if(!drawingpolylasso){
					dragselection = true;
					
					lastdragPoint.x = mouseX;
					lastdragPoint.y = mouseY;
				}
				
				// We don't want to start a new selection so return
				return;
			}else{

			}
			
		}else{

		}
	}else{
	
		/*
		if(mouseX < 0 || mouseY < 0 || mouseX > editorCanvas.width || mouseY > editorCanvas.height){
			return;
		}
		*/
	
		// If new selection mode chosen then delete the last selection from the screen
		if(selectOperationSelect.value == "new"){
			activeSelectionArea = undefined;
			updateToolCanvas();
		}	
	
		drawingpolylasso = true;
	}
	/*
	if(activeSelectionArea){
		// console.log("active selection");
		
		// check if mouse in active selection area
		if(EditorUtils.checkPointInActiveSelection(selectionCtx, mouseX, mouseY)){
			// we have to do the move
			if(!drawingpolylasso){
				transformSelection = true;
				
				lastdragPoint.x = mouseX;
				lastdragPoint.y = mouseY;
			}
			
			// We don't want to start a new selection so return
			return;
		}else{
			drawingpolylasso = true;
		}
		
	}else{
		drawingpolylasso = true;
	}
	*/
	
});

workspaceContainerDiv.addEventListener("mousemove", function(e){

	EditorUtils.setMouseCoordinates(e, workspaceContainerDiv);
	
	//console.log(mouseX + "," + mouseY);
	
	if(activeSelectionArea && transformSelection){
		// console.log("active selection");
		
		if(EditorUtils.checkPointInActiveSelection(selectionCtx, mouseX, mouseY)){
			workspaceContainerDiv.style.cursor = "move";
		}else{
			workspaceContainerDiv.style.cursor = "default";
		}

	}else{
		//console.log("no active selection");	
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
		
	}else{
	
		// POLYGON LASSO - so the end line can move around and follow the mouse from the last click point
		if(!polyLassoDone){
			polyLassoHoverPoint.x = mouseX;
			polyLassoHoverPoint.y = mouseY;
			
			if(polygonLassoCoords.length > 0){ // helps prevent blanking of the wand selection marching ants on move
				updateToolCanvas();
			}
		}
		
	}
	

});

workspaceContainerDiv.addEventListener("mouseup", function(e){

	EditorUtils.setMouseCoordinates(e, workspaceContainerDiv);
	
	if(transformSelection){
	
		if(dragselection){
			EditorUtils.addMoveActiveSelectionEntry(activeSelectionArea);
			// this in needed to not triger a click event and start the lasso drawing process
			setTimeout(function(){ 
				dragselection = false; 
			}, 50);
		}
	}	
	
});

function addClick(x, y, dragging)
{
  clickX.push(x);
  clickY.push(y);
  clickDrag.push(dragging);
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

	if(!polyLassoDone){
		// we are in the polygon lasso drawing phase
		// draw thick white line
		
		// Drawing The Selection
		// For every selection we are drawing we create a temp copy of it and apply any global transformations to
		// the temp then draw the  temp to the canvas.
		
		if(polygonLassoCoords.length > 0){
		
			toolDrawCtx.strokeStyle = "#ffffff";
			toolDrawCtx.lineJoin = "round";
			toolDrawCtx.lineWidth = 1;
			
			toolDrawCtx.shadowColor = 'rgba(0, 0, 0, .8)';
			toolDrawCtx.shadowBlur = 1;
			
			// Holds a copy of polygonLassoCoords so that it can be globally transformed
			// We don't to change the actual polygonLassoCoords			
			var tempPolyLasso = new Object();
			tempPolyLasso.points = [];
			for(let i = 0; i < polygonLassoCoords.length; i++) {
				var p = new Object();
				p.x = polygonLassoCoords[i].x;
				p.y = polygonLassoCoords[i].y;
				tempPolyLasso.points.push(p);
			}
			
			// add the hover point
			var hoverPoint = new Object();
			hoverPoint.x = polyLassoHoverPoint.x;
			hoverPoint.y = polyLassoHoverPoint.y;
			
			tempPolyLasso.points.push(hoverPoint);
			
			
			EditorUtils.globalImageRotateActiveSelection(tempPolyLasso, "freeform");
				

			toolDrawCtx.beginPath();
			
			for(let i = 0; i < tempPolyLasso.points.length; i++) {
				// console.log(tempPolyLasso.points[i].x + "," + tempPolyLasso.points[i].y);
				if(i == 0){
					toolDrawCtx.moveTo(tempPolyLasso.points[i].x * (globalZoom/100) + canvasOffsetLeft, tempPolyLasso.points[i].y * (globalZoom/100) + canvasOffsetTop);
				}else{
					toolDrawCtx.lineTo(tempPolyLasso.points[i].x * (globalZoom/100) + canvasOffsetLeft, tempPolyLasso.points[i].y * (globalZoom/100) + canvasOffsetTop);
				}
			}
			
			/*			
			for(let i = 0; i < polygonLassoCoords.length; i++) {
				// console.log(polygonLassoCoords[i].x + "," + polygonLassoCoords[i].y);
				if(i == 0){
					toolDrawCtx.moveTo(polygonLassoCoords[i].x * (globalZoom/100) + canvasOffsetLeft, polygonLassoCoords[i].y * (globalZoom/100) + canvasOffsetTop);
				}else{
					toolDrawCtx.lineTo(polygonLassoCoords[i].x * (globalZoom/100) + canvasOffsetLeft, polygonLassoCoords[i].y * (globalZoom/100) + canvasOffsetTop);
				}
			}
			*/

			// draw a line to the current point of the mouse hover
			//toolDrawCtx.lineTo(polyLassoHoverPoint.x * (globalZoom/100) + canvasOffsetLeft, polyLassoHoverPoint.y * (globalZoom/100) + canvasOffsetTop);
			
			//toolDrawCtx.closePath();
			
			toolDrawCtx.stroke();				
		}

	}
	
	toolDrawCtx.restore();
		
}

function updateEditorCanvas(){

}

function distanceBetweenPoints(x1, y1, x2, y2){

	let a = Math.abs(x1 - x2);
	let b = Math.abs(y1 - y2);

	return Math.sqrt(a*a + b*b);
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
			
			if(polygonLassoCoords.length > 2){
			
				//console.log(mouseX + "," + mouseY);
				//console.log(polygonLassoCoords[polygonLassoCoords.length - 1].x + "," + polygonLassoCoords[polygonLassoCoords.length - 1].y);			
				
				// If the user is hovering his mouse directly over the last clicked point it would be sensible to delete
				// the point and the point before it because if you only delete the last point it will look like nothing
				// changed.
				/*
				if(mouseX == polygonLassoCoords[polygonLassoCoords.length - 1].x && mouseY == polygonLassoCoords[polygonLassoCoords.length - 1].y){
					polygonLassoCoords.pop();
					polygonLassoCoords.pop();
				}
				*/
				
				polygonLassoCoords.pop();
				updateToolCanvas();
			}
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
	// localStorage.clear();
	
});