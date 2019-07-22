// Copyright (c) 2019 Kasey Thomas. All rights reserved.
// Use of this source code is governed by the EULA.

'use strict';

//alert("eraser");

// the main image being edited
var image = new Image();
image.addEventListener("load", loadEditorImage, true);

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

// Eraser specific variables
var eraserSizeInput = document.getElementById("eraserSizeInput");
var eraserAlphaInput = document.getElementById("eraserAlphaInput");
var eraserBlurInput = document.getElementById("eraserBlurInput");
//var eraserHardnessInput = document.getElementById("eraserHardnessInput");

var eraserSize = 20;
var eraserAlpha = 1;
var eraserBlur = 1;

if (localStorage.getItem("eraser_settings") === null) {

	updateEraser();

}else{
	//alert(localStorage.getItem("background_eraser_settings"));
	let eraserSettings = JSON.parse(localStorage.getItem("eraser_settings"));

	eraserSizeInput.value = eraserSettings.eraserSize;
	eraserAlphaInput.value = eraserSettings.eraserAlpha;
	eraserBlurInput.value = eraserSettings.eraserBlur;
	
	updateEraser();
	
}

var workspaceMouseX = 0;
var workspaceMouseY = 0;


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

workspaceContainerDiv.addEventListener("mouseout", function(e){
	toolDrawCtx.clearRect(0, 0, toolDrawCtx.canvas.width, toolDrawCtx.canvas.height); // Clear the canvas
});

workspaceDiv.addEventListener("dblclick", function(e){

	workspaceMouseX = Math.floor((e.pageX - this.offsetLeft));
	workspaceMouseY = Math.floor((e.pageY - this.offsetTop));

	let mouseX = Math.floor((e.pageX - editorCanvas.offsetLeft - toolBoxWidth));
	let mouseY = Math.floor((e.pageY - this.offsetTop - workspacePaddingTop));
	
	mouseOffsetLeft = workspaceMouseX - mouseX;
	mouseOffsetTop = workspaceMouseY - mouseY;

});

workspaceDiv.addEventListener("click", function(e){

	workspaceMouseX = Math.floor((e.pageX - this.offsetLeft));
	workspaceMouseY = Math.floor((e.pageY - this.offsetTop));

	let mouseX = Math.floor((e.pageX - editorCanvas.offsetLeft - toolBoxWidth));
	let mouseY = Math.floor((e.pageY - this.offsetTop - workspacePaddingTop));
	
	mouseOffsetLeft = workspaceMouseX - mouseX;
	mouseOffsetTop = workspaceMouseY - mouseY;

});

workspaceContainerDiv.addEventListener("mousedown", function(e){

	/*
	workspaceMouseX = Math.floor((e.pageX - this.offsetLeft));
	workspaceMouseY = Math.floor((e.pageY - this.offsetTop));

	let mouseX = Math.floor((e.pageX - editorCanvas.offsetLeft - toolBoxWidth));
	let mouseY = Math.floor((e.pageY - this.offsetTop - workspacePaddingTop));

	infoLbl.innerText = "workspace (x,y): " + workspaceMouseX + "," + workspaceMouseY + "| canvas (x,y): " + mouseX + "," + mouseY;
	*/
	
	workspaceMouseX = Math.floor((e.pageX - this.offsetLeft));
	workspaceMouseY = Math.floor((e.pageY - this.offsetTop));

	let mouseX = Math.floor((e.pageX - editorCanvas.offsetLeft - toolBoxWidth));
	let mouseY = Math.floor((e.pageY - this.offsetTop - workspacePaddingTop));
	
	mouseOffsetLeft = workspaceMouseX - mouseX;
	mouseOffsetTop = workspaceMouseY - mouseY;
	
	if(mouseX < 0 || mouseY < 0 || mouseX > editorCanvas.width || mouseY > editorCanvas.height){
		return;
	}
	
	paint = true;
	addClick(mouseX, mouseY);
	updateEditorCanvas();	
	
});

workspaceContainerDiv.addEventListener("mousemove", function(e){

	workspaceMouseX = Math.floor((e.pageX - this.offsetLeft));
	workspaceMouseY = Math.floor((e.pageY - this.offsetTop));

	let mouseX = Math.floor((e.pageX - editorCanvas.offsetLeft - toolBoxWidth));
	let mouseY = Math.floor((e.pageY - this.offsetTop - workspacePaddingTop));
	
	mouseOffsetLeft = workspaceMouseX - mouseX;
	mouseOffsetTop = workspaceMouseY - mouseY;
	
	infoLbl.innerText = "workspace (x,y): " + mouseX + "," + mouseY;
	
	// for brush, erase, lasso(freeform)
	if(paint){
		addClick(mouseX, mouseY, true);
		updateEditorCanvas();
	}
	
	updateToolCanvas();
	
});

workspaceContainerDiv.addEventListener("mouseup", function(e){

	workspaceMouseX = Math.floor((e.pageX - this.offsetLeft));
	workspaceMouseY = Math.floor((e.pageY - this.offsetTop));

	let mouseX = Math.floor((e.pageX - editorCanvas.offsetLeft - toolBoxWidth));
	let mouseY = Math.floor((e.pageY - this.offsetTop - workspacePaddingTop));
	
	mouseOffsetLeft = workspaceMouseX - mouseX;
	mouseOffsetTop = workspaceMouseY - mouseY;
	

	
	// done painting with the brush so update the image object
	if(paint){
		stopBrushPaint();
	}
	
	paint = false;
	
});

eraserSizeInput.onchange = function(){
	updateEraser();
}

eraserAlphaInput.onchange = function(){
	updateEraser();
}

eraserBlurInput.onchange = function(){
	updateEraser();
}


function updateEraser(){

	// 1. Set the eraser size
	if(eraserSizeInput.value > 200){
		eraserSizeInput.value = 200;
	}
	if(eraserSizeInput.value < 1){
		eraserSizeInput.value = 1;
	}
	eraserSize = eraserSizeInput.value;
	
	// 2. Set the eraser opacity
	if(eraserAlphaInput.value > 100){
		eraserAlphaInput.value = 100;
	}
	if(eraserAlphaInput.value < 0){
		eraserAlphaInput.value = 0;
	}
	eraserAlpha = parseInt(eraserAlphaInput.value)/100;
	
	// 3. Set the eraser blur
	if(eraserBlurInput.value < 0){
		eraserBlurInput.value = 0;
	}
	eraserBlur = eraserBlurInput.value;
	//alert(eraserBlur);
	
	// save the eraser to local store
	saveEraser();	
}

function saveEraser(){
	var eraserSettings = {};
	eraserSettings.eraserSize = eraserSizeInput.value;
	eraserSettings.eraserAlpha = eraserAlphaInput.value;
	eraserSettings.eraserBlur = eraserBlurInput.value;

	localStorage.setItem("eraser_settings", JSON.stringify(eraserSettings));	
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
	
		let eraseEditEntry = {
			edit: "erase", 
			clickX: clickX, 
			clickY: clickY, 
			clickDrag: clickDrag, 
			eraserSize: eraserSize, 
			opacity: eraserAlpha, 
			blur: eraserBlur
		};
	
		/*
		let eraseEditEntry = {
			edit: "erase", 
			clickX: clickX, 
			clickY: clickY, 
			clickDrag: clickDrag, 
			eraserSize: eraserSize, 
			opacity: eraserAlpha, 
			blur: eraserBlur,
			selection: activeSelectionArea
		};
		*/

		// add to the crop edit stack
		editStack.add(eraseEditEntry);
	}
	
	applyEditHistory();
	
	clickX = [];
	clickY = [];
	clickDrag = [];
}

function startMarchingAnts(){
	// alert("start marching ants");
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
	
	// editorCtx.drawImage(image, 0, 0); // not incorporating tranformations
	editorCtx.drawImage(image, cumulativeNegatives.x, cumulativeNegatives.y);
	
	eraserCanvas.width = editorCanvas.width;
	eraserCanvas.height = editorCanvas.height;

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
	let workspaceContainerDivRect = workspaceContainerDiv.getBoundingClientRect();
	let canvasDivRect = canvasDiv.getBoundingClientRect();
	
	//alert(Math.ceil(canvasDivRect.x - workspaceContainerDivRect.x) + "," + Math.ceil(canvasDivRect.y - workspaceContainerDivRect.y));
	// mouseOffsetLeft = Math.ceil(canvasDivRect.x - workspaceContainerDivRect.x);
	// mouseOffsetTop = Math.ceil(canvasDivRect.y - workspaceContainerDivRect.y);
	
}

function updateToolCanvas(){


	toolDrawCtx.clearRect(0, 0, toolDrawCtx.canvas.width, toolDrawCtx.canvas.height);
	
	// Draw The Active Selection Area
	// This code has been moved from the end because the gradient drawing line was not been shown over the wand selection
	if(selectionActive){
		drawActiveSelection();
	}
	
	// draws a circle for the eraser brush
	toolbar.lineWidth = 1;
	toolDrawCtx.strokeStyle = "#ffffff";
	toolDrawCtx.shadowBlur = 1;
	toolDrawCtx.shadowColor = "black";
	//toolDrawCtx.strokeRect(workspaceMouseX + .5, workspaceMouseY + .5, 50, 50);
	toolDrawCtx.beginPath();
	toolDrawCtx.arc(workspaceMouseX, workspaceMouseY, eraserSize/2, 0, 2 * Math.PI);
	toolDrawCtx.stroke();

}

function updateEditorCanvas(){

	editorCtx.clearRect(0, 0, editorCanvas.width, editorCanvas.height); // Clear the canvas
	
	if(typeof image === 'undefined'){
	}else{
	
		// if there is a background color set
		//editorCtx.fillStyle = "#ffffff";
		//editorCtx.fillRect(0, 0, editorCanvas.width, editorCanvas.height);
	
		// editorCtx.drawImage(image, 0, 0); // not incorporating tranformations
		editorCtx.drawImage(image, cumulativeNegatives.x, cumulativeNegatives.y);
	
	}

	if(clickX.length > 0){
		editorCtx.save();
		eraserCtx.save();
		
		// 1. Draw the eraser strokes to the eraser canvas
		
		// Clear the eraser canvas for preparation
		eraserCtx.clearRect(0, 0, editorCanvas.width, editorCanvas.height); // Clears the canvas

		eraserCtx.strokeStyle = "#ff0000";
		eraserCtx.lineJoin = "round";
		eraserCtx.lineWidth = eraserSize;
		
		//eraserCtx.filter = "blur(" + eraserBlur + "px)";	// adding eraser blur here slows down eraser stroking dramatically	
		for(let i = 0; i < clickX.length; i++) {
			eraserCtx.beginPath();
			if(clickDrag[i] && i){
				eraserCtx.moveTo(clickX[i-1], clickY[i-1]);
			}else{
				eraserCtx.moveTo(clickX[i]-1, clickY[i]);
			}
			eraserCtx.lineTo(clickX[i], clickY[i]);
			eraserCtx.closePath();
			eraserCtx.stroke();	
		}

		// 2. To apply blur to eraser strokes we draw it to a blur canvas, this is done because it seems adding the blur 
		//    to the eraserCanvas above and drawing the strokes seems to dramatically slow down rendering.
		// 	  We will apply clipping to this blur canvas and also 
		//    draw it to the editor image
		
		let blurCanvas = document.createElement("canvas");
		blurCanvas.width = eraserCtx.canvas.width; 
		blurCanvas.height = eraserCtx.canvas.height; 
		let blurCtx = blurCanvas.getContext("2d");
		blurCtx.filter = "blur(" + eraserBlur + "px)";		
		blurCtx.drawImage(eraserCanvas, 0, 0);
		blurCtx.filter = "none";	
		
		// 3. Perform Clipping - if there is a selection
		if(!selectionActive){
			// No selection active for clipping
			// UNCLIPPED ERASE STROKES
			// Do nothing to the eraser strokes canvas			
		}else{

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
					blurCtx.save();
					blurCtx.globalCompositeOperation = 'destination-in';
					blurCtx.fillStyle = "rgba(0, 255, 0, 1)";
					blurCtx.fillRect(activeSelectionArea.geometry.x, activeSelectionArea.geometry.y, activeSelectionArea.geometry.width, activeSelectionArea.geometry.height);
					blurCtx.restore();							
				}else{
					// KEEP ERASER STROKES ONLY OUTSIDE RACTANGULAR SELECTION
					blurCtx.save();
					blurCtx.globalCompositeOperation = 'destination-out';
					blurCtx.fillStyle = "rgba(0, 255, 0, 1)";
					blurCtx.fillRect(activeSelectionArea.geometry.x, activeSelectionArea.geometry.y, activeSelectionArea.geometry.width, activeSelectionArea.geometry.height);
					blurCtx.restore();								
				}
			}if(activeSelectionArea.shape == "ellipse"){
		
				if(!invertSelection){
					// Clear in the  Ellipse Selection
					blurCtx.save();
					blurCtx.globalCompositeOperation = 'destination-in';
					blurCtx.fillStyle = "rgba(0, 255, 0, 1)";
					blurCtx.beginPath();
					blurCtx.ellipse(activeSelectionArea.geometry.x, activeSelectionArea.geometry.y, activeSelectionArea.geometry.radiusX, activeSelectionArea.geometry.radiusY, activeSelectionArea.geometry.rotation, activeSelectionArea.geometry.startAngle, activeSelectionArea.geometry.endAngle);
					blurCtx.fill();	
					blurCtx.restore();							
				}else{
					// CLEAR OUTSIDE Ellipse SELECTION
					blurCtx.save();
					blurCtx.globalCompositeOperation = 'destination-out';
					blurCtx.fillStyle = "rgba(0, 255, 0, 1)";
					blurCtx.beginPath();
					blurCtx.ellipse(activeSelectionArea.geometry.x, activeSelectionArea.geometry.y, activeSelectionArea.geometry.radiusX, activeSelectionArea.geometry.radiusY, activeSelectionArea.geometry.rotation, activeSelectionArea.geometry.startAngle, activeSelectionArea.geometry.endAngle);
					blurCtx.fill();	
					blurCtx.restore();							
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
					blurCtx.save();
					blurCtx.globalCompositeOperation = 'destination-in';
					blurCtx.fillStyle = "rgba(0, 255, 0, 1)";
					blurCtx.beginPath();
					for(let i = 0; i < activeSelectionArea.geometry.length; i++) {
						if(i == 0){
							blurCtx.moveTo(activeSelectionArea.geometry[i].x, activeSelectionArea.geometry[i].y);
						}else{
							blurCtx.lineTo(activeSelectionArea.geometry[i].x, activeSelectionArea.geometry[i].y);
						}
					}
					blurCtx.closePath();
					blurCtx.fill();
					blurCtx.restore();	
					
				}else{
				
					blurCtx.save();
					blurCtx.globalCompositeOperation = 'destination-out';
					blurCtx.fillStyle = "rgba(0, 255, 0, 1)";
					blurCtx.beginPath();
					for(let i = 0; i < activeSelectionArea.geometry.length; i++) {
						if(i == 0){
							blurCtx.moveTo(activeSelectionArea.geometry[i].x, activeSelectionArea.geometry[i].y);
						}else{
							blurCtx.lineTo(activeSelectionArea.geometry[i].x, activeSelectionArea.geometry[i].y);
						}
					}
					blurCtx.closePath();
					blurCtx.fill();
					blurCtx.restore();	
					
				}
				
			}
		
		}
			

	
		// 4. Apply eraser opacity to the eraser data which is in blur 
		let eraseImageData = blurCtx.getImageData(0, 0, blurCtx.canvas.width, blurCtx.canvas.height);  			
		for (let i = 0; i < eraseImageData.data.length; i += 4) {
			//invertImageData.data[i + 0] = eraseImageData.data[i + 0]; // R			
			//invertImageData.data[i + 1] = eraseImageData.data[i + 1]; // G			
			//invertImageData.data[i + 2] = eraseImageData.data[i + 2]; // B

			eraseImageData.data[i + 3] = eraseImageData.data[i + 3] * eraserAlpha;
		}
		blurCtx.putImageData(eraseImageData, 0, 0);
		
		
		// 5. Finally - Use composite operation and use the eraser canvas to delete the erase strokes from the editor image canvas
		editorCtx.globalCompositeOperation = 'destination-out';
		editorCtx.drawImage(blurCanvas, 0, 0);		
	
		editorCtx.restore();
		eraserCtx.restore();
	}
	
		
}

function drawActiveSelection(){

	//console.log("draw active selection");

	if(typeof activeSelectionArea === 'undefined'){
	}else{
	
		editorCtx.save();
		toolDrawCtx.save();
		
		// console.log("drawing active selection");
	
		if(activeSelectionArea.shape == "rectangle"){
		
			// console.log("draw active rectangular selection");
			
			toolDrawCtx.lineWidth = 1;
			
			toolDrawCtx.lineDashOffset = polyLassoLineOffset;

			// draw black dashed line over the white line to finish the selection box
			toolDrawCtx.strokeStyle = "#000000";
			toolDrawCtx.setLineDash([9,0]);
			toolDrawCtx.strokeRect((activeSelectionArea.geometry.x + 0.5 + mouseOffsetLeft), (activeSelectionArea.geometry.y + 0.5 + mouseOffsetTop), 
			(activeSelectionArea.geometry.width), (activeSelectionArea.geometry.height));
			
			
			// draw solid white line
			
			toolDrawCtx.strokeStyle = "#ffffff";
			toolDrawCtx.setLineDash([5,4]);
			toolDrawCtx.strokeRect((activeSelectionArea.geometry.x + 0.5 + mouseOffsetLeft), (activeSelectionArea.geometry.y + 0.5 + mouseOffsetTop), 
			(activeSelectionArea.geometry.width), (activeSelectionArea.geometry.height));	
					
		}if(activeSelectionArea.shape == "ellipse"){
		
			toolDrawCtx.lineWidth = 1;
			
			toolDrawCtx.lineDashOffset = polyLassoLineOffset;

			// draw black dashed line over the white line to finish the selection box
			toolDrawCtx.strokeStyle = "#000000";
			toolDrawCtx.setLineDash([9,0]);
			// Draw the rectangle
			// toolDrawCtx.strokeRect((squareSelectionRect.x + 0.5 + mouseOffsetLeft), (squareSelectionRect.y + 0.5 + mouseOffsetTop), (squareSelectionRect.width - 1), (squareSelectionRect.height - 1));
			// Draw the ellipse
			toolDrawCtx.beginPath();
			toolDrawCtx.ellipse(activeSelectionArea.geometry.x + mouseOffsetLeft, activeSelectionArea.geometry.y + mouseOffsetTop, activeSelectionArea.geometry.radiusX, activeSelectionArea.geometry.radiusY, activeSelectionArea.geometry.rotation, activeSelectionArea.geometry.startAngle, activeSelectionArea.geometry.endAngle);
			toolDrawCtx.stroke();			
			
			// draw solid white line
			
			toolDrawCtx.strokeStyle = "#ffffff";
			toolDrawCtx.setLineDash([5,4]);
			// Draw the rectangle
			// toolDrawCtx.strokeRect((squareSelectionRect.x + 0.5 + mouseOffsetLeft), (squareSelectionRect.y + 0.5 + mouseOffsetTop), (squareSelectionRect.width - 1), (squareSelectionRect.height - 1));
			// Draw the ellipse
			toolDrawCtx.beginPath();
			toolDrawCtx.ellipse(activeSelectionArea.geometry.x + mouseOffsetLeft, activeSelectionArea.geometry.y + mouseOffsetTop, activeSelectionArea.geometry.radiusX, activeSelectionArea.geometry.radiusY, activeSelectionArea.geometry.rotation, activeSelectionArea.geometry.startAngle, activeSelectionArea.geometry.endAngle);
			toolDrawCtx.stroke();		
			
		}else if(activeSelectionArea.shape == "freeform"){
		
			// A double click was made to finish defining the polygon lasso region by setting polyLassoDone = true
			// we have finished drawing the polygon lasso and will show as marching ants line 
			
			toolDrawCtx.strokeStyle = "#ffffff";
			toolDrawCtx.lineJoin = "round";
			toolDrawCtx.lineWidth = 1;
				

			toolDrawCtx.beginPath();
			
			
			let cntr = 0; // indicate that the first point is set
			for(let i = 0; i < activeSelectionArea.geometry.length; i++) {
			
				let point_x = activeSelectionArea.geometry[i].x + mouseOffsetLeft;
				let point_y = activeSelectionArea.geometry[i].y + mouseOffsetTop;
				
				if(cntr == 0){
					toolDrawCtx.moveTo(point_x, point_y);
				}else{
					toolDrawCtx.lineTo(point_x, point_y);
				}
				
				cntr++;

				/*
				// don't draw points that are negative with respect to the editor canvas
				if(activeSelectionArea.geometry[i].x < 0 || activeSelectionArea.geometry[i].y < 0 
					|| activeSelectionArea.geometry[i].x > editorCanvas.width || activeSelectionArea.geometry[i].y > editorCanvas.height){
					// coordinate outside of canvas dimensions
				}else{
			
					if(cntr == 0){
						toolDrawCtx.moveTo(point_x, point_y);
					}else{
						toolDrawCtx.lineTo(point_x, point_y);
					}
					
					cntr++;
				}
				*/
			}
			
			toolDrawCtx.closePath();
			
			//console.log("poly line offset: " + polyLassoLineOffset);
			toolDrawCtx.lineDashOffset = polyLassoLineOffset;
			
			// draw black dashed line over the white line to finish the selection box
			toolDrawCtx.strokeStyle = "#000000";
			toolDrawCtx.setLineDash([9,0]);
			toolDrawCtx.stroke();
			
			
			// draw solid white line
			toolDrawCtx.strokeStyle = "#ffffff";
			toolDrawCtx.setLineDash([5,4]);
			toolDrawCtx.stroke();					
		
		}else if(activeSelectionArea.shape == "wandselection"){
			// draw contours of the wand selection 
			// from magicwandexamplecode.js
			
			drawMagicWandMarchingAnts(true);	
			
		}
		
		if(invertSelection){
			// draw a box around the canvas representing visually that the exterior of the drawn area is selected
			// toolDrawCtx.rect(mouseOffsetLeft + 0.5, mouseOffsetTop + 0.5, editorCanvas.width, editorCanvas.height); 
			toolDrawCtx.rect(mouseOffsetLeft - 0.5, mouseOffsetTop - 0.5, editorCanvas.width, editorCanvas.height); 

			//console.log("poly line offset: " + polyLassoLineOffset);
			toolDrawCtx.lineWidth = 1;
			toolDrawCtx.lineDashOffset = polyLassoLineOffset;
			
			// draw black dashed line over the white line to finish the selection box
			toolDrawCtx.strokeStyle = "#000000";
			toolDrawCtx.setLineDash([9,0]);
			toolDrawCtx.stroke();
			
			// draw solid white line
			toolDrawCtx.strokeStyle = "#ffffff";
			toolDrawCtx.setLineDash([5,4]);
			toolDrawCtx.stroke();	
		}

		
		editorCtx.restore();
		toolDrawCtx.restore();
		
	}
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
