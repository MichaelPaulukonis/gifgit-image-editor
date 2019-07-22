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

// forms the background to the editor canvas
var canvasDiv = document.getElementById("canvasDiv");

var toolDrawCanvas = document.getElementById("toolDrawCanvas");
var toolDrawCtx = toolDrawCanvas.getContext("2d");

var selectionCanvas = document.getElementById("selectionCanvas")
var selectionCtx = selectionCanvas.getContext("2d");

var selectionActive = false;
var selectingrect = false;
var squareSelectionRect = {x: 0, y:0, width: 0, height: 0};

var applyFlipBtn = document.getElementById("applyFlipBtn");
var rotationDirection = document.getElementById("rotationDirection");
var rotate90Radio = document.getElementById("rotate90Radio");
var rotate180Radio = document.getElementById("rotate180Radio");

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

applyFlipBtn.addEventListener("click", function(e){
	addFlipEdit();
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

function addFlipEdit(){

	let rotateangle = "horizontal";

	if(rotate90Radio.checked){
		rotateangle = 90;
	}
	
	if(rotate180Radio.checked){
		rotateangle = 180;
	}
	
	/*
	let rotateEditEntry = {
		edit: "rotate_image", 
		edit_label: "Rotate Image", 
		direction: rotationDirection.value,
		angle: rotateangle
	};
	*/
	
	var rotateEditEntry = new Object();
	rotateEditEntry.edit = "rotate_image";
	rotateEditEntry.edit_label = "Rotate Image";
	rotateEditEntry.direction = rotationDirection.value;
	rotateEditEntry.angle = rotateangle;

	
	// add to the flip_image edit to the stack
	editStack.add(rotateEditEntry);
	
	// apply flip to selection if necessary and add it to the stack
	// addFlippedActiveSelectionArea(rotateangle);

	applyEditHistory();
	
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

// adds a flip of the active selection area to the stack
// so that it matches with the flipped region
function addFlippedActiveSelectionArea(direction){

	if(typeof activeSelectionArea === "undefined"){
		// alert("no selection");
		// No selection active for clipping
		// UNCLIPPED ERASE STROKES
		// Do nothing to the eraser strokes canvas			
	}else{
	
		// alert("there is a selection");

		if(activeSelectionArea.shape == "rectangle"){
			if(!invertSelection){
				// THE RECTANGULAR SELECTION IS NOT INVERTED SO DO NOT CHANGE
				// alert("non-invert rectangle selection flip so do not flip selection");
			}else{
				// RECTANGULAR SELECTION IS INVERTED SO FLIP SELECTION AREA
				//alert("inverted rectangle flip so selection change");
				//alert(direction);
				// alert(JSON.stringify(activeSelectionArea));
				
				// Example rect
				// {"shape":"rectangle","geometry":{"x":565,"y":133,"width":196,"height":139},"invert":false,"invert_rect":{"x":0,"y":0,"width":800,"height":450}}
			
				if(direction == "horizontal"){
				
					let newSelectionRect = {};
					
					newSelectionRect.x = activeSelectionArea.geometry.x;
					newSelectionRect.y = activeSelectionArea.geometry.y;
					newSelectionRect.width = activeSelectionArea.geometry.width;
					newSelectionRect.height = activeSelectionArea.geometry.height;
				
					// 1. find the horizontal center of the image
					let centerXaxis = activeSelectionArea.invert_rect.width/2;
					//alert(activeSelectionArea.invert_rect.width);
					
					// 2. flip the x coordinate of the rectangle across the center coordinate
					if(activeSelectionArea.geometry.x > centerXaxis){
					
						// alert("passed center line");
					
						// Note - The x coordinate of rectangle is greater than
						//	      horizontal reflection axis
						
						// a. get the difference between the x coordinate and the reflection axis
						let offsetx = activeSelectionArea.geometry.x - centerXaxis;
						// b. reflect the x coordinate by subtracting the offset from the reflection axis
						newSelectionRect.x = centerXaxis - offsetx;
						
						// c. make the width of the rectangle invert sign so it goes to other side of new x point
						newSelectionRect.width = -activeSelectionArea.geometry.width;
						
					}else if(activeSelectionArea.geometry.x == centerXaxis){
					
						// Note - The x coordinate of rectangle is on the 
						//	      horizontal reflection axis
						
						// a. make the width negative
						newSelectionRect.width = -activeSelectionArea.geometry.width;
					
					}else if(activeSelectionArea.geometry.x < centerXaxis){
					
						// Note - The x coordinate of rectangle is less than
						//	      horizontal reflection axis
						
						// a. get the difference between the x coordinate and the reflection axis
						let offsetx = centerXaxis - activeSelectionArea.geometry.x;
						// b. reflect the x coordinate by subtracting the offset from the reflection axis
						newSelectionRect.x = centerXaxis + offsetx;
						
						// c. make the width of the rectangle invert sign so it goes to other side of new x point
						newSelectionRect.width = -activeSelectionArea.geometry.width;
					}	
					
					let flippedactiveSelectionArea = {
						shape: "rectangle", 
						geometry: newSelectionRect, 
						invert: invertSelection, 
						invert_rect: {x: 0, y:0, width: editorCanvas.width, height: editorCanvas.height}
					};					

					// we also store the mouseOffsetLeft, mouseOffsetTop for drawing on the toolDrawCanvas because they may not be set initially
					let selectEditEntry = {edit: "invert_select", selection: flippedactiveSelectionArea, offsetLeft: mouseOffsetLeft, offsetTop: mouseOffsetTop};

					//alert(JSON.stringify(deleteEditEntry));
					
					// add selection to the edit stack
					editStack.add(selectEditEntry);	
					
				}else if(direction == "vertical"){
				
					let newSelectionRect = {};
					
					newSelectionRect.x = activeSelectionArea.geometry.x;
					newSelectionRect.y = activeSelectionArea.geometry.y;
					newSelectionRect.width = activeSelectionArea.geometry.width;
					newSelectionRect.height = activeSelectionArea.geometry.height;
				
					// 1. find the horizontal center of the image
					let centerYaxis = activeSelectionArea.invert_rect.height/2;
					//alert(activeSelectionArea.invert_rect.width);
					
					// 2. flip the y coordinate of the rectangle across the center coordinate
					if(activeSelectionArea.geometry.y > centerYaxis){
					
						// alert("passed center line");
					
						// Note - The y coordinate of rectangle is greater than
						//	      vertical reflection axis
						
						// a. get the difference between the y coordinate and the reflection axis
						let offsety = activeSelectionArea.geometry.y - centerYaxis;
						// b. reflect the y coordinate by subtracting the offset from the reflection axis
						newSelectionRect.y = centerYaxis - offsety;
						
						// c. make the width of the rectangle invert sign so it goes to other side of new y point
						newSelectionRect.height = -activeSelectionArea.geometry.height;
						
					}else if(activeSelectionArea.geometry.y == centerYaxis){
					
						// Note - The y coordinate of rectangle is on the 
						//	      vertical reflection axis
						
						// a. make the width negative
						newSelectionRect.height = -activeSelectionArea.geometry.height;
					
					}else if(activeSelectionArea.geometry.y < centerYaxis){
					
						// Note - The x coordinate of rectangle is less than
						//	      horizontal reflection axis
						
						// a. get the difference between the y coordinate and the reflection axis
						let offsety = centerYaxis - activeSelectionArea.geometry.y;
						// b. reflect the y coordinate by subtracting the offset from the reflection axis
						newSelectionRect.y = centerYaxis + offsety;
						
						// c. make the width of the rectangle invert sign so it goes to other side of new y point
						newSelectionRect.height = -activeSelectionArea.geometry.height;
					}	
					
					let flippedactiveSelectionArea = {
						shape: "rectangle", 
						geometry: newSelectionRect, 
						invert: invertSelection, 
						invert_rect: {x: 0, y:0, width: editorCanvas.width, height: editorCanvas.height}
					};					

					// we also store the mouseOffsetLeft, mouseOffsetTop for drawing on the toolDrawCanvas because they may not be set initially
					let selectEditEntry = {edit: "invert_select", selection: flippedactiveSelectionArea, offsetLeft: mouseOffsetLeft, offsetTop: mouseOffsetTop};

					//alert(JSON.stringify(deleteEditEntry));
					
					// add selection to the edit stack
					editStack.add(selectEditEntry);						
				}						
			}
		}if(activeSelectionArea.shape == "ellipse"){
			if(!invertSelection){
				// THE ELLIPTICAL SELECTION IS NOT INVERTED SO DO NOT CHANGE TO SELECTION
				// alert("non-invert rectangle selection flip so do not flip selection");			
			}else{
				// ELLIPTICAL SELECTION IS INVERTED SO FLIP SELECTION AREA
				// alert("flip selection area");
				
				if(direction == "horizontal"){
				
					// flip the x and y of the ellipse across the vertical center axis horizontally
				
					//ellipticalSelection = {x: 0, y:0 , radiusX:0, radiusY:0, rotation:0, startAngle: 0, endAngle: 0, anticlockwise: false};
					let newEllipticalSelection = {};
					
					newEllipticalSelection.x = activeSelectionArea.geometry.x, 
					newEllipticalSelection.y = activeSelectionArea.geometry.y, 
					newEllipticalSelection.radiusX = activeSelectionArea.geometry.radiusX, 
					newEllipticalSelection.radiusY = activeSelectionArea.geometry.radiusY, 
					newEllipticalSelection.rotation = activeSelectionArea.geometry.rotation, 
					newEllipticalSelection.startAngle = activeSelectionArea.geometry.startAngle, 
					newEllipticalSelection.endAngle = activeSelectionArea.geometry.endAngle, 
					newEllipticalSelection.anticlockwise = false;
					
					// 1. find the horizontal center of the image
					let centerXaxis = activeSelectionArea.invert_rect.width/2;
					//alert(activeSelectionArea.invert_rect.width);
					
					// 2. flip the x coordinate of the rectangle across the center coordinate
					if(activeSelectionArea.geometry.x > centerXaxis){
					
						// alert("passed center line");
					
						// Note - The x coordinate of ellipse is greater than
						//	      horizontal reflection axis
						
						// a. get the difference between the x coordinate and the reflection axis
						let offsetx = activeSelectionArea.geometry.x - centerXaxis;
						// b. reflect the x coordinate by subtracting the offset from the reflection axis
						newEllipticalSelection.x = centerXaxis - offsetx;

						
					}else if(activeSelectionArea.geometry.x == centerXaxis){
					
						// Note - The x coordinate of ellipse is already is on the 
						//	      horizontal reflection axis so ignore as the ellipse is symetric 
						//		  and x is center
						
					
					}else if(activeSelectionArea.geometry.x < centerXaxis){
					
						// Note - The x coordinate of ellipse is less than
						//	      horizontal reflection axis
						
						// a. get the difference between the x coordinate and the reflection axis
						let offsetx = centerXaxis - activeSelectionArea.geometry.x;
						// b. reflect the x coordinate by subtracting the offset from the reflection axis
						newEllipticalSelection.x = centerXaxis + offsetx;
						

					}						
					
					let flippedactiveSelectionArea = {
						shape: "ellipse", 
						geometry: newEllipticalSelection, 
						invert: invertSelection, 
						invert_rect: {x: 0, y:0, width: editorCanvas.width, height: editorCanvas.height}
					};
					
					// we also store the mouseOffsetLeft, mouseOffsetTop for drawing on the toolDrawCanvas because they may not be set initially
					let selectEditEntry = {
						edit: "invert_select", 
						selection: flippedactiveSelectionArea, 
						offsetLeft: mouseOffsetLeft, 
						offsetTop: mouseOffsetTop
					};

					//alert(JSON.stringify(deleteEditEntry));
					
					// add selection to the edit stack
					editStack.add(selectEditEntry);					
					
				}else if(direction == "vertical"){
					// flip the x and y of the ellipse across the vertical center axis horizontally
				
					//ellipticalSelection = {x: 0, y:0 , radiusX:0, radiusY:0, rotation:0, startAngle: 0, endAngle: 0, anticlockwise: false};
					let newEllipticalSelection = {};
					
					newEllipticalSelection.x = activeSelectionArea.geometry.x, 
					newEllipticalSelection.y = activeSelectionArea.geometry.y, 
					newEllipticalSelection.radiusX = activeSelectionArea.geometry.radiusX, 
					newEllipticalSelection.radiusY = activeSelectionArea.geometry.radiusY, 
					newEllipticalSelection.rotation = activeSelectionArea.geometry.rotation, 
					newEllipticalSelection.startAngle = activeSelectionArea.geometry.startAngle, 
					newEllipticalSelection.endAngle = activeSelectionArea.geometry.endAngle, 
					newEllipticalSelection.anticlockwise = false;
					
					// 1. find the horizontal center of the image
					let centerYaxis = activeSelectionArea.invert_rect.height/2;
					//alert(activeSelectionArea.invert_rect.width);
					
					// 2. flip the y coordinate of the ellipse across the center coordinate
					if(activeSelectionArea.geometry.y > centerYaxis){
					
						// alert("passed center line");
					
						// Note - The y coordinate of ellipse is greater than
						//	      vertical reflection axis
						
						// a. get the difference between the y coordinate and the reflection axis
						let offsety = activeSelectionArea.geometry.y - centerYaxis;
						// b. reflect the y coordinate by subtracting the offset from the reflection axis
						newEllipticalSelection.y = centerYaxis - offsety;
						
					}else if(activeSelectionArea.geometry.y == centerYaxis){
					
						// Note - The y coordinate of ellipse is on the 
						//	      vertical reflection axis
						// 		  do nothing as the ellipse center is on the central axis
						//		  and the ellipse is symetric
					
					}else if(activeSelectionArea.geometry.y < centerYaxis){
					
						// Note - The x coordinate of ellipse is less than
						//	      horizontal reflection axis
						
						// a. get the difference between the y coordinate and the reflection axis
						let offsety = centerYaxis - activeSelectionArea.geometry.y;
						// b. reflect the y coordinate by subtracting the offset from the reflection axis
						newEllipticalSelection.y = centerYaxis + offsety;
						
					}					
					
					let flippedactiveSelectionArea = {
						shape: "ellipse", 
						geometry: newEllipticalSelection, 
						invert: invertSelection, 
						invert_rect: {x: 0, y:0, width: editorCanvas.width, height: editorCanvas.height}
					};
					
					// we also store the mouseOffsetLeft, mouseOffsetTop for drawing on the toolDrawCanvas because they may not be set initially
					let selectEditEntry = {
						edit: "invert_select", 
						selection: flippedactiveSelectionArea, 
						offsetLeft: mouseOffsetLeft, 
						offsetTop: mouseOffsetTop
					};

					//alert(JSON.stringify(deleteEditEntry));
					
					// add selection to the edit stack
					editStack.add(selectEditEntry);					
					
				}
				
			}				
		}else if(activeSelectionArea.shape == "freeform"){
		
			if(!invertSelection){
		
				// THE FREEFORM SELECTION IS NOT INVERTED 
				// INVERT THE FREEFORM SELECTION BY FLIPPING AROUND ITS CENTRAL AXIS
			
				if(direction == "horizontal"){
									
					// 1. FIND THE CENTRAL VERTICAL AXIS OF THE FREEFORM SELECTION BOUNDS
					// 	  TO FLIP HORIZONTALLY AROUND
					
					// For a polygon points region we need to get its bounds by determining the maximum and minimum points for each 
					// axis
					// we have to loop through and get the maximum and minimum of the polygon points to determine the height and width
					// and location of the polygon bounding rectangle
					let min_x = activeSelectionArea.geometry[0].x, 
					max_x = activeSelectionArea.geometry[0].x, 
					min_y = activeSelectionArea.geometry[0].y, 
					max_y = activeSelectionArea.geometry[0].y;
					
					for(let i = 0; i < activeSelectionArea.geometry.length; i++) {
						//activeSelectionArea.geometry[i].x
						//activeSelectionArea.geometry[i].y
						
						// If the x is less than min_x then min_x is not the minimum
						if(activeSelectionArea.geometry[i].x < min_x){
							min_x = activeSelectionArea.geometry[i].x;
						}
						
						// If the x is greater than max_x then max_x is not the maximum
						if(activeSelectionArea.geometry[i].x > max_x){
							max_x = activeSelectionArea.geometry[i].x;
						}
						
						// If the y is less than min_y then min_y is not the minimum
						if(activeSelectionArea.geometry[i].y < min_y){
							min_y = activeSelectionArea.geometry[i].y;
						}	

						// If the y is greater than max_y then max_y is not the maximum
						if(activeSelectionArea.geometry[i].y > max_y){
							max_y = activeSelectionArea.geometry[i].y;
						}							
						
					}		

					let selection_width = Math.abs(max_x - min_x);
					let selection_height = Math.abs(max_y - min_y);	
					
					// determine the center of the selection from the bounds of the freeform selection
					let centerXaxis = (max_x + min_x)/2;

					let newLassoCoords = [];				
					
					// 2. Flip points around the center
					for(let i = 0; i < activeSelectionArea.geometry.length; i++) {
						//activeSelectionArea.geometry[i].x
						//activeSelectionArea.geometry[i].y	
						
						newLassoCoords[i] = {};
						newLassoCoords[i].x = activeSelectionArea.geometry[i].x;
						newLassoCoords[i].y = activeSelectionArea.geometry[i].y;

						// 2. flip the x coordinate of the lasso polygon point across the center coordinate
						if(activeSelectionArea.geometry[i].x > centerXaxis){
						
							// alert("passed center line");
						
							// Note - The x coordinate of polygon point is greater than
							//	      horizontal reflection axis
							
							// a. get the difference between the x coordinate and the reflection axis
							let offsetx = activeSelectionArea.geometry[i].x - centerXaxis;
							// b. reflect the x coordinate by subtracting the offset from the reflection axis
							newLassoCoords[i].x = centerXaxis - offsetx;

							
						}else if(activeSelectionArea.geometry[i].x == centerXaxis){
						
							// Note - The x coordinate of rectangle is on the 
							//	      horizontal reflection axis
							
						
						}else if(activeSelectionArea.geometry[i].x < centerXaxis){
						
							// Note - The x coordinate of lasso polygon point is less than
							//	      horizontal reflection axis
							
							// a. get the difference between the x coordinate and the reflection axis
							let offsetx = centerXaxis - activeSelectionArea.geometry[i].x;
							// b. reflect the x coordinate by subtracting the offset from the reflection axis
							newLassoCoords[i].x = centerXaxis + offsetx;
							
						}											

					}	

					let flippedactiveSelectionArea = {
						shape: "freeform", 
						geometry: newLassoCoords, 
						invert: invertSelection,
						invert_rect: {x: 0, y:0, width: editorCanvas.width, height: editorCanvas.height}
					};
					
					// we also store the mouseOffsetLeft, mouseOffsetTop for drawing on the toolDrawCanvas because they may not be set initially
					let selectEditEntry = {
						edit: "select", 
						selection: flippedactiveSelectionArea, 
						offsetLeft: mouseOffsetLeft, 
						offsetTop: mouseOffsetTop
					};

					//alert(JSON.stringify(deleteEditEntry));
					
					// add selection to the edit stack
					editStack.add(selectEditEntry);		
					
				}else if(direction == "vertical"){	
				
					// 1. FIND THE CENTRAL HORIZONTAL AXIS OF THE FREEFORM SELECTION BOUNDS
					// 	  TO FLIP VERTICALLY AROUND
					
					// For a polygon points region we need to get its bounds by determining the maximum and minimum points for each 
					// axis
					// we have to loop through and get the maximum and minimum of the polygon points to determine the height and width
					// and location of the polygon bounding rectangle
					let min_x = activeSelectionArea.geometry[0].x, 
					max_x = activeSelectionArea.geometry[0].x, 
					min_y = activeSelectionArea.geometry[0].y, 
					max_y = activeSelectionArea.geometry[0].y;
					
					for(let i = 0; i < activeSelectionArea.geometry.length; i++) {
						//activeSelectionArea.geometry[i].x
						//activeSelectionArea.geometry[i].y
						
						// If the x is less than min_x then min_x is not the minimum
						if(activeSelectionArea.geometry[i].x < min_x){
							min_x = activeSelectionArea.geometry[i].x;
						}
						
						// If the x is greater than max_x then max_x is not the maximum
						if(activeSelectionArea.geometry[i].x > max_x){
							max_x = activeSelectionArea.geometry[i].x;
						}
						
						// If the y is less than min_y then min_y is not the minimum
						if(activeSelectionArea.geometry[i].y < min_y){
							min_y = activeSelectionArea.geometry[i].y;
						}	

						// If the y is greater than max_y then max_y is not the maximum
						if(activeSelectionArea.geometry[i].y > max_y){
							max_y = activeSelectionArea.geometry[i].y;
						}							
						
					}		

					let selection_width = Math.abs(max_x - min_x);
					let selection_height = Math.abs(max_y - min_y);	
					
					// determine the center of the selection from the bounds of the freeform selection
					let centerYaxis = (max_y + min_y)/2;

					let newLassoCoords = [];				
					
					// 2. Flip points around the center
					for(let i = 0; i < activeSelectionArea.geometry.length; i++) {
						//activeSelectionArea.geometry[i].x
						//activeSelectionArea.geometry[i].y	
						
						newLassoCoords[i] = {};
						newLassoCoords[i].x = activeSelectionArea.geometry[i].x;
						newLassoCoords[i].y = activeSelectionArea.geometry[i].y;

						// 2. flip the y coordinate of the lasso polygon point across the center coordinate
						if(activeSelectionArea.geometry[i].y > centerYaxis){
						
							// alert("passed center line");
						
							// Note - The y coordinate of polygon point is greater than
							//	      horizontal reflection axis
							
							// a. get the difference between the y coordinate and the reflection axis
							let offsety = activeSelectionArea.geometry[i].y - centerYaxis;
							// b. reflect the y coordinate by subtracting the offset from the reflection axis
							newLassoCoords[i].y = centerYaxis - offsety;

							
						}else if(activeSelectionArea.geometry[i].y == centerYaxis){
						
							// Note - The y coordinate of rectangle is on the 
							//	      horizontal reflection axis
							
						
						}else if(activeSelectionArea.geometry[i].y < centerYaxis){
						
							// Note - The y coordinate of lasso polygon point is less than
							//	      horizontal reflection axis
							
							// a. get the difference between the y coordinate and the reflection axis
							let offsety = centerYaxis - activeSelectionArea.geometry[i].y;
							// b. reflect the y coordinate by subtracting the offset from the reflection axis
							newLassoCoords[i].y = centerYaxis + offsety;
							
						}											

					}	

					let flippedactiveSelectionArea = {
						shape: "freeform", 
						geometry: newLassoCoords, 
						invert: invertSelection,
						invert_rect: {x: 0, y:0, width: editorCanvas.width, height: editorCanvas.height}
					};
					
					// we also store the mouseOffsetLeft, mouseOffsetTop for drawing on the toolDrawCanvas because they may not be set initially
					let selectEditEntry = {
						edit: "select", 
						selection: flippedactiveSelectionArea, 
						offsetLeft: mouseOffsetLeft, 
						offsetTop: mouseOffsetTop
					};

					//alert(JSON.stringify(deleteEditEntry));
					
					// add selection to the edit stack
					editStack.add(selectEditEntry);						
				}
				
				
			}else{
			
				// FREEFORM SELECTION IS INVERTED SO FLIP SELECTION AREA
				// AROUND CENTER OF THE TOTAL IMAGE AS OPPOSED TO AROUND SELECTION CENTER
				
			
				if(direction == "horizontal"){
				
					// THE FREEFORM SELECTION IS NOT INVERTED 
					// INVERT THE FREEFORM SELECTION BY FLIPPING AROUND ITS CENTRAL AXIS
					
					// 1. determine the center of flip from the bounds of the image
					let centerXaxis = activeSelectionArea.invert_rect.width/2;

					let newLassoCoords = [];				
					
					// 2. Flip points around the center
					for(let i = 0; i < activeSelectionArea.geometry.length; i++) {
						//activeSelectionArea.geometry[i].x
						//activeSelectionArea.geometry[i].y	
						
						newLassoCoords[i] = {};
						newLassoCoords[i].x = activeSelectionArea.geometry[i].x;
						newLassoCoords[i].y = activeSelectionArea.geometry[i].y;

						// 2. flip the x coordinate of the lasso polygon point across the center coordinate
						if(activeSelectionArea.geometry[i].x > centerXaxis){
						
							// alert("passed center line");
						
							// Note - The x coordinate of polygon point is greater than
							//	      horizontal reflection axis
							
							// a. get the difference between the x coordinate and the reflection axis
							let offsetx = activeSelectionArea.geometry[i].x - centerXaxis;
							// b. reflect the x coordinate by subtracting the offset from the reflection axis
							newLassoCoords[i].x = centerXaxis - offsetx;

							
						}else if(activeSelectionArea.geometry[i].x == centerXaxis){
						
							// Note - The x coordinate of rectangle is on the 
							//	      horizontal reflection axis
							
						
						}else if(activeSelectionArea.geometry[i].x < centerXaxis){
						
							// Note - The x coordinate of lasso polygon point is less than
							//	      horizontal reflection axis
							
							// a. get the difference between the x coordinate and the reflection axis
							let offsetx = centerXaxis - activeSelectionArea.geometry[i].x;
							// b. reflect the x coordinate by subtracting the offset from the reflection axis
							newLassoCoords[i].x = centerXaxis + offsetx;
							
						}											

					}	

					let flippedactiveSelectionArea = {
						shape: "freeform", 
						geometry: newLassoCoords, 
						invert: invertSelection,
						invert_rect: {x: 0, y:0, width: editorCanvas.width, height: editorCanvas.height}
					};
					
					// we also store the mouseOffsetLeft, mouseOffsetTop for drawing on the toolDrawCanvas because they may not be set initially
					let selectEditEntry = {
						edit: "invert_select", 
						selection: flippedactiveSelectionArea, 
						offsetLeft: mouseOffsetLeft, 
						offsetTop: mouseOffsetTop
					};

					//alert(JSON.stringify(deleteEditEntry));
					
					// add selection to the edit stack
					editStack.add(selectEditEntry);		
					
				}else if(direction == "vertical"){	
				
					// THE FREEFORM SELECTION IS NOT INVERTED 
					// INVERT THE FREEFORM SELECTION AROUND ITS CENTRAL AXIS
					// BY FLIPPING THE POINTS AROUND THE AXIS
					
					// 1. determine the center of flip from the bounds of the image
					let centerYaxis = activeSelectionArea.invert_rect.height/2;

					let newLassoCoords = [];				
					
					// 2. Flip points around the center
					for(let i = 0; i < activeSelectionArea.geometry.length; i++) {
						//activeSelectionArea.geometry[i].x
						//activeSelectionArea.geometry[i].y	
						
						newLassoCoords[i] = {};
						newLassoCoords[i].x = activeSelectionArea.geometry[i].x;
						newLassoCoords[i].y = activeSelectionArea.geometry[i].y;

						// 2. flip the y coordinate of the lasso polygon point across the center coordinate
						if(activeSelectionArea.geometry[i].y > centerYaxis){
						
							// alert("passed center line");
						
							// Note - The y coordinate of polygon point is greater than
							//	      horizontal reflection axis
							
							// a. get the difference between the y coordinate and the reflection axis
							let offsety = activeSelectionArea.geometry[i].y - centerYaxis;
							// b. reflect the y coordinate by subtracting the offset from the reflection axis
							newLassoCoords[i].y = centerYaxis - offsety;

							
						}else if(activeSelectionArea.geometry[i].y == centerYaxis){
						
							// Note - The y coordinate of rectangle is on the 
							//	      horizontal reflection axis
							
						
						}else if(activeSelectionArea.geometry[i].y < centerYaxis){
						
							// Note - The y coordinate of lasso polygon point is less than
							//	      horizontal reflection axis
							
							// a. get the difference between the y coordinate and the reflection axis
							let offsety = centerYaxis - activeSelectionArea.geometry[i].y;
							// b. reflect the y coordinate by subtracting the offset from the reflection axis
							newLassoCoords[i].y = centerYaxis + offsety;
							
						}											

					}	

					let flippedactiveSelectionArea = {
						shape: "freeform", 
						geometry: newLassoCoords, 
						invert: invertSelection,
						invert_rect: {x: 0, y:0, width: editorCanvas.width, height: editorCanvas.height}
					};
					
					// we also store the mouseOffsetLeft, mouseOffsetTop for drawing on the toolDrawCanvas because they may not be set initially
					let selectEditEntry = {
						edit: "invert_select", 
						selection: flippedactiveSelectionArea, 
						offsetLeft: mouseOffsetLeft, 
						offsetTop: mouseOffsetTop
					};

					//alert(JSON.stringify(deleteEditEntry));
					
					// add selection to the edit stack
					editStack.add(selectEditEntry);						
				}
				
			}				
		}else if(activeSelectionArea.shape == "wandselection"){
			if(!invertSelection){
			
			}else{
			
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

			addFlipEdit();
			
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
});;