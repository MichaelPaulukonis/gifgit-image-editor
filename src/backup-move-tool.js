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

// for active selections
var selectionCanvas = document.getElementById("selectionCanvas");
var selectionCtx = selectionCanvas.getContext("2d");

var canvasWidth = 0, canvasHeight = 0;
var cumulativeTranslations = {x:0, y:0};
var cumulativeNegatives = {x:0, y:0};

// Transformations
// var cumulativeTranslations = {x: 0, y: 0};

// forms the background to the editor canvas
var canvasDiv = document.getElementById("canvasDiv");

var toolDrawCanvas = document.getElementById("toolDrawCanvas");
var toolDrawCanvas = document.getElementById("toolDrawCanvas");
var toolDrawCtx = toolDrawCanvas.getContext("2d");

var selectionMarchingAntsInterval;
var pauseMarchingAnts = false;
var activeSelectionArea;
var polyLassoLineOffset = 0;
var invertSelection = false;
var selectionActive = false;

var canvaspressed = false;
var dragPoints = {x1: 0, y1:0, x2:0, y2:0};

var workspaceMouseX = 0;
var workspaceMouseY = 0;

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

	workspaceMouseX = Math.floor((e.pageX - this.offsetLeft));
	workspaceMouseY = Math.floor((e.pageY - this.offsetTop));

	let mouseX = Math.floor((e.pageX - canvasOffsetLeft - toolBoxWidth))*(100/globalZoom);
	let mouseY = Math.floor((e.pageY - this.offsetTop - workspacePaddingTop))*(100/globalZoom);
	
	//mouseOffsetLeft = workspaceMouseX - mouseX;
	mouseOffsetLeft = workspaceMouseX - mouseX;
	mouseOffsetTop = workspaceMouseY - mouseY;

});

workspaceContainerDiv.addEventListener("click", function(e){

	workspaceMouseX = Math.floor((e.pageX - this.offsetLeft));
	workspaceMouseY = Math.floor((e.pageY - this.offsetTop));

	let mouseX = Math.floor((e.pageX - canvasOffsetLeft - toolBoxWidth))*(100/globalZoom);
	let mouseY = Math.floor((e.pageY - this.offsetTop - workspacePaddingTop))*(100/globalZoom);
	
	//mouseOffsetLeft = workspaceMouseX - mouseX;
	mouseOffsetLeft = workspaceMouseX - mouseX;
	mouseOffsetTop = workspaceMouseY - mouseY;

});

workspaceContainerDiv.addEventListener("mousedown", function(e){

	workspaceMouseX = Math.floor((e.pageX - this.offsetLeft));
	workspaceMouseY = Math.floor((e.pageY - this.offsetTop));

	let mouseX = Math.floor((e.pageX - canvasOffsetLeft - toolBoxWidth))*(100/globalZoom);
	let mouseY = Math.floor((e.pageY - this.offsetTop - workspacePaddingTop))*(100/globalZoom);
	
	//mouseOffsetLeft = workspaceMouseX - mouseX;
	mouseOffsetLeft = workspaceMouseX - mouseX;
	mouseOffsetTop = workspaceMouseY - mouseY;
	
	// determine if the mouse is in the active selection area
	if(typeof activeSelectionArea !== 'undefined'){

		console.log("move selection");
		
	}
	
	// get the start of the move set all the points to the current coordinate
	dragPoints.x1 = mouseX;
	dragPoints.y1 = mouseY;
	dragPoints.x2 = mouseX;
	dragPoints.y2 = mouseY;
	
	canvaspressed = true;
	
});

workspaceContainerDiv.addEventListener("mousemove", function(e){

	workspaceMouseX = Math.floor((e.pageX - this.offsetLeft));
	workspaceMouseY = Math.floor((e.pageY - this.offsetTop));

	let mouseX = Math.floor((e.pageX - canvasOffsetLeft - toolBoxWidth))*(100/globalZoom);
	let mouseY = Math.floor((e.pageY - this.offsetTop - workspacePaddingTop))*(100/globalZoom);
	
	//mouseOffsetLeft = workspaceMouseX - mouseX;
	mouseOffsetLeft = workspaceMouseX - mouseX;
	mouseOffsetTop = workspaceMouseY - mouseY;
	
	infoLbl.innerText = "workspace (x,y): " + mouseX + "," + mouseY;
	
	if(canvaspressed){
		dragPoints.x2 = mouseX;
		dragPoints.y2 = mouseY;
		
		updateEditorCanvas();
	}

	
});

workspaceContainerDiv.addEventListener("mouseup", function(e){

	workspaceMouseX = Math.floor((e.pageX - this.offsetLeft));
	workspaceMouseY = Math.floor((e.pageY - this.offsetTop));

	let mouseX = Math.floor((e.pageX - canvasOffsetLeft - toolBoxWidth))*(100/globalZoom);
	let mouseY = Math.floor((e.pageY - this.offsetTop - workspacePaddingTop))*(100/globalZoom);
	
	//mouseOffsetLeft = workspaceMouseX - mouseX;
	mouseOffsetLeft = workspaceMouseX - mouseX;
	mouseOffsetTop = workspaceMouseY - mouseY;
	
	// set the translation
	addTranslation(dragPoints.x2 - dragPoints.x1,dragPoints.y2 - dragPoints.y1);

	canvaspressed = false;
	
});

function addTranslation(x_move,y_move){

	//alert((dragPoints.x2 - dragPoints.x1) + "," + (dragPoints.y2 - dragPoints.y1));
	
	if(x_move == 0 && y_move == 0){
		// alert("no movement made");
		return;
	}
	
	var translateEditEntry = {
		edit: "translate_image", 
		edit_label: "Move", 
		geometry: {x: x_move,y: y_move}
	};	

	
	if(translateEditEntry === undefined){
	}else{
	
		// add to the crop edit stack
		editStack.add(translateEditEntry);
		
		applyEditHistory();
	}

}	

function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
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
	//editorCanvas.width = image.width;
	//editorCanvas.height = image.height;	
	
	editorCanvas.width = canvasWidth;
	editorCanvas.height = canvasHeight;
	
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
	
	selectionCanvas.width = editorCanvas.width;
	selectionCanvas.height = editorCanvas.height;
	
	// Draw the selection region
	drawSelectionClipping(selectionCtx);
	
	
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
	
	// Draw The Active Selection Area
	// This code has been moved from the end because the gradient drawing line was not been shown over the wand selection
	if(selectionActive){
		drawActiveSelection();
	}
	
}

function updateEditorCanvas(){

	editorCtx.clearRect(0, 0, editorCanvas.width, editorCanvas.height);
	
	// Loop through all the layer array stack canvases drawing them to editorCanvas.
	// Apply the current operation (translate) to the current selected layer (layerIndex)
	for(let j = 0; j < layerStack.length; j++){
	
		if(layerStack[j].visible){
			// If layer is visible continue
		}else{
			// If the layer is not visible then do no rendering of it
			continue;
		}	
	
		// If this is the layer we are currently editing we apply the blur to it
		if(j == layerIndex){
		
			editorCtx.save();
			
			// 1. translate the editor canvas based on mouse move
			editorCtx.translate(dragPoints.x2 - dragPoints.x1, dragPoints.y2 - dragPoints.y1);			

			// 2. Render the layer to the editor canvas
			// If blending mode set for layer
			if('blend_mode' in layerStack[j]){
				editorCtx.save();
				editorCtx.globalCompositeOperation = layerStack[j].blend_mode;
			}
			
			// If opacity set for layer
			if('opacity' in layerStack[j]){
				editorCtx.save();
				editorCtx.globalAlpha = layerStack[j].opacity/100;
			}	
			
			// draw the layer canvas for the current loop iteration
			if(!('object' in layerStack[j])){
				// Drawing a regular rasterized layer canvas to editor
				editorCtx.drawImage(layerStack[j].canvas, layerStack[j].cumulativeNegatives.x, layerStack[j].cumulativeNegatives.y);			
			}else{
				// Draw objects to layer
				if(layerStack[j].object.type == "text_object"){
				
					/*
					===================================================
					The Text object is in layerStack[j].object
					===================================================
					var textObject = new Object;
					textObject.type = "text_object";
					textObject.string = editStack.stack[x].string;
					textObject.char_styles = editStack.stack[x].char_styles;
					textObject.textbox = editStack.stack[x].textbox;
					*/					
				
					/*
					editorCtx.font = "20px Georgia";
					editorCtx.fillStyle = "white";
					editorCtx.fillText(layerStack[j].object.string, 50, 50);
					*/
					
					var textCanvas = document.createElement("canvas");
					textCanvas.width = layerStack[i].object.textbox.width;
					textCanvas.height = layerStack[i].object.textbox.height;
					var textCtx = textCanvas.getContext("2d");
					//textCtx.fillStyle = "red";
					//textCtx.fillRect(0,0,textCanvas.width,textCanvas.height);

					// Render the text using the text engine
					textEngine.renderText(textCtx, layerStack[j].object.string, layerStack[j].object.char_styles, layerStack[j].object.textbox);
					// Draw the rendered text canvas to the editor canvas
					editorCtx.drawImage(textCanvas, layerStack[j].object.textbox.x, layerStack[j].object.textbox.y);
				}
			}
			
			// return to state
			if('blend_mode' in layerStack[j] || 'opacity' in layerStack[j]){
				editorCtx.restore();
			}	
			
			editorCtx.restore();
			
		}else{


			// Render the layer to the editor canvas
			// If blending mode set for layer
			if('blend_mode' in layerStack[j]){
				editorCtx.save();
				editorCtx.globalCompositeOperation = layerStack[j].blend_mode;
			}
			
			// If opacity set for layer
			if('opacity' in layerStack[j]){
				editorCtx.save();
				editorCtx.globalAlpha = layerStack[j].opacity/100;
			}	
			
			// draw the layer canvas for the current loop iteration
			if(!('object' in layerStack[j])){
				// Drawing a regular rasterized layer canvas to editor
				editorCtx.drawImage(layerStack[j].canvas, layerStack[j].cumulativeNegatives.x, layerStack[j].cumulativeNegatives.y);			
			}else{
				// Draw objects to layer
				if(layerStack[j].object.type == "text_object"){
				
					/*
					===================================================
					The Text object is in layerStack[j].object
					===================================================
					var textObject = new Object;
					textObject.type = "text_object";
					textObject.string = editStack.stack[x].string;
					textObject.char_styles = editStack.stack[x].char_styles;
					textObject.textbox = editStack.stack[x].textbox;
					*/					
				
					/*
					editorCtx.font = "20px Georgia";
					editorCtx.fillStyle = "white";
					editorCtx.fillText(layerStack[j].object.string, 50, 50);
					*/
					
					var textCanvas = document.createElement("canvas");
					textCanvas.width = layerStack[j].object.textbox.width;
					textCanvas.height = layerStack[j].object.textbox.height;
					var textCtx = textCanvas.getContext("2d");
					//textCtx.fillStyle = "red";
					//textCtx.fillRect(0,0,textCanvas.width,textCanvas.height);

					// Render the text using the text engine
					textEngine.renderText(textCtx, layerStack[j].object.string, layerStack[j].object.char_styles, layerStack[j].object.textbox);
					// Draw the rendered text canvas to the editor canvas
					editorCtx.drawImage(textCanvas, layerStack[j].object.textbox.x, layerStack[j].object.textbox.y);
				}
			}
			
			// return to state
			if('blend_mode' in layerStack[j] || 'opacity' in layerStack[j]){
				editorCtx.restore();
			}	

		
		}
		
	
	}
		
}

function drawActiveSelection(){

	//console.log("draw active selection");
	/*
	// get the offset of the canvas from the workspace container in canvasOffsetLef
	canvasOffsetLeft = (workspaceContainerDivRect.width - canvasDivRect.width*(globalZoom/100))/2;
	//canvasOffsetTop = (canvasDivRect.top - workspaceContainerDivRect.top)*(globalZoom/100);
	canvasOffsetTop = (canvasDivRect.top - workspaceContainerDivRect.top)*(globalZoom/100);
	*/

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
			toolDrawCtx.strokeRect((activeSelectionArea.geometry.x * (globalZoom/100) + 0.5 + canvasOffsetLeft), (activeSelectionArea.geometry.y * (globalZoom/100) + 0.5 + canvasOffsetTop), 
			(activeSelectionArea.geometry.width) * (globalZoom/100), (activeSelectionArea.geometry.height) * (globalZoom/100));
			
			
			// draw solid white line
			
			toolDrawCtx.strokeStyle = "#ffffff";
			toolDrawCtx.setLineDash([5,4]);
			toolDrawCtx.strokeRect((activeSelectionArea.geometry.x * (globalZoom/100) + 0.5 + canvasOffsetLeft), (activeSelectionArea.geometry.y * (globalZoom/100) + 0.5 + canvasOffsetTop), 
			(activeSelectionArea.geometry.width) * (globalZoom/100), (activeSelectionArea.geometry.height) * (globalZoom/100));
			
		}if(activeSelectionArea.shape == "ellipse"){
		
			toolDrawCtx.lineWidth = 1;
			
			toolDrawCtx.lineDashOffset = polyLassoLineOffset;

			// draw black dashed line over the white line to finish the selection box
			toolDrawCtx.strokeStyle = "#000000";
			toolDrawCtx.setLineDash([9,0]);
			// Draw the rectangle
			// toolDrawCtx.strokeRect((squareSelectionRect.x + 0.5 + canvasOffsetLeft), (squareSelectionRect.y + 0.5 + canvasOffsetTop), (squareSelectionRect.width - 1), (squareSelectionRect.height - 1));
			// Draw the ellipse
			toolDrawCtx.beginPath();
			toolDrawCtx.ellipse(activeSelectionArea.geometry.x * (globalZoom/100) + canvasOffsetLeft, activeSelectionArea.geometry.y * (globalZoom/100) + canvasOffsetTop, activeSelectionArea.geometry.radiusX * (globalZoom/100), activeSelectionArea.geometry.radiusY * (globalZoom/100), activeSelectionArea.geometry.rotation, activeSelectionArea.geometry.startAngle, activeSelectionArea.geometry.endAngle);
			toolDrawCtx.stroke();			
			
			// draw solid white line
			
			toolDrawCtx.strokeStyle = "#ffffff";
			toolDrawCtx.setLineDash([5,4]);
			// Draw the rectangle
			// toolDrawCtx.strokeRect((squareSelectionRect.x + 0.5 + canvasOffsetLeft), (squareSelectionRect.y + 0.5 + canvasOffsetTop), (squareSelectionRect.width - 1), (squareSelectionRect.height - 1));
			// Draw the ellipse
			toolDrawCtx.beginPath();
			toolDrawCtx.ellipse(activeSelectionArea.geometry.x * (globalZoom/100) + canvasOffsetLeft, activeSelectionArea.geometry.y * (globalZoom/100) + canvasOffsetTop, activeSelectionArea.geometry.radiusX * (globalZoom/100), activeSelectionArea.geometry.radiusY * (globalZoom/100), activeSelectionArea.geometry.rotation, activeSelectionArea.geometry.startAngle, activeSelectionArea.geometry.endAngle);
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
			
				let point_x = activeSelectionArea.geometry[i].x * (globalZoom/100) + canvasOffsetLeft;
				let point_y = activeSelectionArea.geometry[i].y * (globalZoom/100) + canvasOffsetTop;
				
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
			// toolDrawCtx.rect(canvasOffsetLeft + 0.5, canvasOffsetTop + 0.5, editorCanvas.width, editorCanvas.height); 
			toolDrawCtx.rect(canvasOffsetLeft - 0.5, canvasOffsetTop - 0.5, editorCanvas.width * (globalZoom/100), editorCanvas.height * (globalZoom/100)); 

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
			addTranslation(-1, 0);
		break;		
		case 38: // UP KEY
			// negative up because of top, left origin coordinates
			addTranslation(0, -1);
		break;	
		case 39: // RIGHT KEY
			//alert("RIGHT pressed");
			addTranslation(1, 0);
		break;
		case 40: // DOWN KEY
			// down positive y because of top, left origin coordinates
			addTranslation(0, 1);
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
