// Copyright (c) 2019 Kasey Thomas. All rights reserved.
// Use of this source code is governed by the EULA.

'use strict';


/*
// https://stackoverflow.com/questions/3768565/drawing-an-svg-file-on-a-html5-canvas
var svgimg = new Image();
svgimg.onload = function(){
	//alert("works");
	
}
svgimg.onerroe = function(){
	//alert("not works");
}
svgimg.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI1MCIgaGVpZ2h0PSI1MCI+PGNpcmNsZSBjeD0iMjUiIGN5PSIyNSIgcj0iMjAiIHN0cm9rZT0ib3JhbmdlIiBzdHJva2Utd2lkdGg9IjQiIGZpbGw9InllbGxvdyIgLz48L3N2Zz4=';
*/

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

// forms the background to the editor canvas
var canvasDiv = document.getElementById("canvasDiv");

var toolDrawCanvas = document.getElementById("toolDrawCanvas");
var toolDrawCtx = toolDrawCanvas.getContext("2d");

// for active selections
var selectionCanvas = document.getElementById("selectionCanvas")
var selectionCtx = selectionCanvas.getContext("2d");

var selectionMarchingAntsInterval;
var pauseMarchingAnts = false;
var activeSelectionArea;
var drag = false;
var dragStart = {x:0, y: 0};
var dragTranslate = {x:0, y:0};
var polyLassoLineOffset = 0;
var invertSelection = false;
var selectionActive = false;
var selectingrect = false;
var dragselection = false;
var lastdragPoint = {};
var squareSelectionRect = {x: 0, y:0, width: 0, height: 0};

var selectOperationSelect = document.getElementById("selectOperationSelect");
var aspectRatioSelect = document.getElementById("aspectRatioSelect");
var moveStep = document.getElementById("moveStep");

var workspaceMouseX = 0; // used to hold coordinates with respect to the workspaceContainerDiv
var workspaceMouseY = 0; // used to hold coordinates with respect to the workspaceContainerDiv
var mouseX = 0;
var mouseY = 0;

// check if all required modules are present (HTML5 Storage etc...)
initializeEditor();

// set the cursor based on rectangular marquee
workspaceContainerDiv.style.cursor = "crosshair";


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
	
		// If new selection mode chosen then delete the last selection from the screen
		if(selectOperationSelect.value == "new"){
			activeSelectionArea = undefined;
			updateToolCanvas();
		}
	
		clearInterval(selectionMarchingAntsInterval);		
		
		selectionActive = false;
		invertSelection = false;
		
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
	
	
	// RECTANGULAR SELECTION - updates the width and height of the rectangular selection with the mouse move
	if(selectingrect){
	
		squareSelectionRect.width = mouseX - squareSelectionRect.x;
		squareSelectionRect.height = mouseY - squareSelectionRect.y;
		
		switch(parseInt(aspectRatioSelect.value)) {
		  case 0:
			// aspect ratio rectangular
			squareSelectionRect.width = mouseX - squareSelectionRect.x;
			squareSelectionRect.height = mouseY - squareSelectionRect.y;
			break;
		  case 1:
			// aspect ratio 1:1 (square)
			squareSelectionRect.width = squareSelectionRect.height;
			break;
		  case 2:
			// square 4:3
			squareSelectionRect.width = parseInt((squareSelectionRect.height*4)/3);
			break;
		  case 3:
			// square 16:9
			squareSelectionRect.width = parseInt((squareSelectionRect.height*16)/9);
			break;
		  default:
			// default to rectangular
			squareSelectionRect.width = mouseX - squareSelectionRect.x;
			squareSelectionRect.height = mouseY - squareSelectionRect.y;
		}
		
		updateToolCanvas();	
	}
	
	
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
	
	
});

workspaceContainerDiv.addEventListener("mouseup", function(e){

	EditorUtils.setMouseCoordinates(e, workspaceContainerDiv);
	
	finishSelectingRect();
	
	if(transformSelection){
	
		if(dragselection){
			EditorUtils.addMoveActiveSelectionEntry(activeSelectionArea);
			dragselection = false;
		}
		
	}
	
});

function finishSelectingRect(event){

	if(selectingrect){
	
		selectingrect = false;
		
		// size of rectangle too small to create a selection
		if(Math.abs(squareSelectionRect.width) == 0 || Math.abs(squareSelectionRect.height) == 0){
		
			//alert("square zero");
		
			selectionActive = false;
			// just in case 
			clearInterval(selectionMarchingAntsInterval);
			
			// to clear the selection dashed lines
			updateToolCanvas();
			
		}else{
		
			if(!selectionActive){
			
				if(squareSelectionRect.width < 0){
					squareSelectionRect.x += squareSelectionRect.width;
					squareSelectionRect.width = Math.abs(squareSelectionRect.width);
				}
				
				if(squareSelectionRect.height < 0){
					squareSelectionRect.y += squareSelectionRect.height;
					squareSelectionRect.height = Math.abs(squareSelectionRect.height);
				}
			
				
				// I selection box is completely to the left of the image
				if(squareSelectionRect.x < 0 && (squareSelectionRect.x + squareSelectionRect.width) <= 0){
					// alert("completely to left");
					squareSelectionRect = {x: 0, y:0, width: 0, height: 0};
					updateToolCanvas();
					return;
				}
				
				// Check if selection box is completely outside at top of image
				if(squareSelectionRect.y < 0 && (squareSelectionRect.y + squareSelectionRect.height) <= 0){
					// alert("completely at top");
					squareSelectionRect = {x: 0, y:0, width: 0, height: 0};
					updateToolCanvas();
					return;
				}
				
				// If selection box is completely to the right of the image
				if(squareSelectionRect.x > editorCanvas.width && (squareSelectionRect.x + squareSelectionRect.width) > editorCanvas.width){
					//alert("completely to right");
					squareSelectionRect = {x: 0, y:0, width: 0, height: 0};
					updateToolCanvas();
					return;
				}
				
				// If selection box is completely below image
				if(squareSelectionRect.y > editorCanvas.height && (squareSelectionRect.y + squareSelectionRect.height) > editorCanvas.height){
					//alert("completely below");
					squareSelectionRect = {x: 0, y:0, width: 0, height: 0};
					updateToolCanvas();
					return;
				}
				
				// Negative x 
				if(squareSelectionRect.x < 0){
					squareSelectionRect.width += squareSelectionRect.x;
					squareSelectionRect.x = 0;
				}
				// Negative y
				if(squareSelectionRect.y < 0){
					squareSelectionRect.height += squareSelectionRect.y;
					squareSelectionRect.y = 0;
				}
				

				// If the selection box projects over the right edge of the canvas
				if(squareSelectionRect.width > 0){
				
					if((squareSelectionRect.x + squareSelectionRect.width) > editorCanvas.width){
						// alert("box goes out the bounds of image to right");
						squareSelectionRect.width -= ((squareSelectionRect.x + squareSelectionRect.width) - editorCanvas.width);
					}
				
				}else{
					if(squareSelectionRect.x > editorCanvas.width){
						// alert("box goes out the bounds of image to right");
						squareSelectionRect.x = squareSelectionRect.x + squareSelectionRect.width;
						squareSelectionRect.width = editorCanvas.width - squareSelectionRect.x;
					}				
				}
				
				// If the selection box projects over the top of the canvas
				if(squareSelectionRect.height > 0){
				
					if((squareSelectionRect.y + squareSelectionRect.height) > editorCanvas.height){
						// alert("box goes out the bounds of image to right");
						squareSelectionRect.height -= ((squareSelectionRect.y + squareSelectionRect.height) - editorCanvas.height);
					}
				
				}else{
					if(squareSelectionRect.y > editorCanvas.height){
						// alert("box goes out the bounds of image to right");
						squareSelectionRect.y = squareSelectionRect.y + squareSelectionRect.height; // remember squareSelectionRect.height is negative
						squareSelectionRect.height = editorCanvas.height - squareSelectionRect.y;
					}				
				}		

				// rectangular marquee drawn from inside box to outside left of canvas
				if(squareSelectionRect.x > 0 && (squareSelectionRect.x + squareSelectionRect.width) < 0){
					squareSelectionRect.width = squareSelectionRect.x ;
					squareSelectionRect.x = 0;
				}
				
				// rectangular marquee drawn from inside box to outside top of canvas
				if(squareSelectionRect.y > 0 && (squareSelectionRect.y + squareSelectionRect.height) < 0){
					squareSelectionRect.height = squareSelectionRect.y ;
					squareSelectionRect.y = 0;
				}
				

				/*
			
				//alert(JSON.stringify(squareSelectionRect));
				
				if(squareSelectionRect.x < 0 && (squareSelectionRect.x + squareSelectionRect.width) == 0){
					//alert();
				}
			
				// Negative x and y
				if(squareSelectionRect.x < 0){
					squareSelectionRect.width += squareSelectionRect.x;
					squareSelectionRect.x = 0;
				}
				
				if(squareSelectionRect.y < 0){
					squareSelectionRect.height += squareSelectionRect.y;
					squareSelectionRect.y = 0;
				}
				
				// Canvas starting x and y greater than canvas width oe height
				if(squareSelectionRect.x > editorCanvas.width){
					squareSelectionRect.width += squareSelectionRect.x - editorCanvas.width;
					squareSelectionRect.x = editorCanvas.width;
				}	
				if(squareSelectionRect.y > editorCanvas.height){
					squareSelectionRect.height += squareSelectionRect.y - editorCanvas.height;
					squareSelectionRect.y = editorCanvas.height;
				}	
				*/

				/*
				if(squareSelectionRect.width > 0 && squareSelectionRect.height > 0){

				}else{
					updateToolCanvas();
					return;
				}
				*/
				
				selectionActive = true;
				
				//alert(selectOperationSelect.value);		
				// Create the active selection area
				// Determine what operation to create the selection with
				if((selectOperationSelect.value) == "new" || activeSelectionArea === undefined){
				
					// REPLACE THE LAST SELECTION
				
					activeSelectionArea = {
						shape: "rectangle", 
						geometry: {x: squareSelectionRect.x, y: squareSelectionRect.y, width: squareSelectionRect.width, height: squareSelectionRect.height}, 
						invert: invertSelection, 
						invert_rect: {x: 0, y:0, width: editorCanvas.width, height: editorCanvas.height}
					};
					
					/*
					// we also store the mouseOffsetLeft, mouseOffsetTop for drawing on the toolDrawCanvas because they may not be set initially
					let selectEditEntry = {
						edit: "select", 
						edit_label: "Rectangle Select",
						selection: activeSelectionArea, 
						offsetLeft: mouseOffsetLeft, 
						offsetTop: mouseOffsetTop
					};
					*/
					
					// selection rectangle
					var squareselect = new Object();
					squareselect.x = squareSelectionRect.x;
					squareselect.y = squareSelectionRect.y;
					squareselect.width = squareSelectionRect.width;
					squareselect.height = squareSelectionRect.height;
				
					// outer rectangle
					var rect = new Object();
					rect.x = 0;
					rect.y = 0;
					rect.width = editorCanvas.width;
					rect.height = editorCanvas.height;
					
					var selectionArea = new Object();
					selectionArea.shape = "rectangle";
					selectionArea.geometry = squareselect;
					selectionArea.invert = invertSelection;
					selectionArea.invert_rect = rect;
					
					var selectEditEntry = new Object();
					selectEditEntry.edit = "select";
					selectEditEntry.edit_label = "Rectangle Select";
					selectEditEntry.selection = selectionArea;
					selectEditEntry.offsetLeft = mouseOffsetLeft;
					selectEditEntry.offsetTop = mouseOffsetTop;

					//alert(JSON.stringify(deleteEditEntry));
					
					// add selection to the edit stack
					editStack.add(selectEditEntry);
					applyEditHistory();
					
				}else{
					// Perform Selection Shape Arithmetic
					//alert("perform selection shape arithmetic");
					
					var tempActiveSelectionArea = {
						shape: "rectangle", 
						geometry: {x: squareSelectionRect.x, y: squareSelectionRect.y, width: squareSelectionRect.width, height: squareSelectionRect.height}, 
						invert: invertSelection, 
						invert_rect: {x: 0, y:0, width: editorCanvas.width, height: editorCanvas.height}
					};					
					
					EditorUtils.performSelectionArithmeticOperation("Rectangle Select",selectOperationSelect.value, activeSelectionArea, tempActiveSelectionArea);
					
				}
				
				
				squareSelectionRect = {x: 0, y:0, width: 0, height: 0};
						

				//squareSelectionRect = {x: 0, y:0, width: 0, height: 0};					
				
				// Start the marching ants for the active selection
				startMarchingAnts();
				
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

function setEditorImage(dataURL, filename){

	// set the editor image and file name to local storage
	localStorage.setItem("editor_image", dataURL);
	localStorage.setItem("image_filename", filename);
	
	// initiate the edit stack
	editStack.start();
	
	applyEditHistory();
	
	/*
	image = new Image();
	image.addEventListener("load", loadEditorImage, true);
	image.src = dataURL;
	*/
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
	//mouseOffsetLeft = Math.ceil(canvasDivRect.x - workspaceContainerDivRect.x);
	//mouseOffsetTop = Math.ceil(canvasDivRect.y - workspaceContainerDivRect.y);
	
	//alert(JSON.stringify(activeSelectionArea));

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

	//if(!selectionActive){
	
		// Drawing The Selection
		// For every selection we are drawing we create a temp copy of it and apply any global transformations to
		// the temp then draw the  temp to the canvas.
		
		if(Math.abs(squareSelectionRect.width) == 0 || Math.abs(squareSelectionRect.height) == 0){
		}else{
			toolDrawCtx.lineWidth = 1;
			
			// just to make sure we have no marching ants effect we don't put line offset
			// toolDrawCtx.lineDashOffset = polyLassoLineOffset;
			
			// Holds a copy of squareSelectionRect so that it can be globally transformed
			// We don't to change the actual squareSelectionRect
			var tempRect = new Object();
			tempRect.x = squareSelectionRect.x;
			tempRect.y = squareSelectionRect.y;
			tempRect.width = squareSelectionRect.width;
			tempRect.height = squareSelectionRect.height;
			
			// Apply global transformations to the tempRect
			EditorUtils.globalImageRotateActiveSelection(tempRect, "rectangle");

			// draw black dashed line over the white line to finish the selection box
			toolDrawCtx.strokeStyle = "#000000";
			toolDrawCtx.setLineDash([9,0]);
			toolDrawCtx.strokeRect((tempRect.x * (globalZoom/100) + 0.5 + canvasOffsetLeft), (tempRect.y * (globalZoom/100) + 0.5 + canvasOffsetTop), 
			(tempRect.width) * (globalZoom/100), (tempRect.height) * (globalZoom/100));
			
			
			// draw solid white line
			
			toolDrawCtx.strokeStyle = "#ffffff";
			toolDrawCtx.setLineDash([5,4]);
			toolDrawCtx.strokeRect((tempRect.x * (globalZoom/100) + 0.5 + canvasOffsetLeft), (tempRect.y * (globalZoom/100) + 0.5 + canvasOffsetTop), 
			(tempRect.width) * (globalZoom/100), (tempRect.height) * (globalZoom/100));			
						
		}
			
	//}
	
	toolDrawCtx.restore();
		
}

function updateEditorCanvas(){	
	
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

function checkMouseInSelection(x,y){
	// if the selection is 
	var imgData = selectionCtx.getImageData(x, y, 1, 1);
	return imgData.data[3];
}