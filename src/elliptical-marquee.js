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

var selectionMarchingAntsInterval;
var pauseMarchingAnts = false;
var activeSelectionArea;
// for dragging
var selectionPath;
var drag = false;
var lastdragPoint = {};

var polyLassoLineOffset = 0;
var invertSelection = false;
var selectionActive = false;
var selectingrect = false;
var dragselection = false;
var squareSelectionRect = {x: 0, y:0, width: 0, height: 0};
var centerPoint = {x:0,y:0};
var circularSelection = {x: 0, y:0, r:0, startAngle:0, endAngle:0, counterclockwise: false};
var ellipticalSelection = {x: 0, y:0 , radiusX:0, radiusY:0, rotation:0, startAngle: 0, endAngle: 0, anticlockwise: false};

var selectOperationSelect = document.getElementById("selectOperationSelect");
var ellipseToolRadio = document.getElementById("ellipseToolRadio");
var circleToolRadio = document.getElementById("circleToolRadio");

var aspectRatioSelect = document.getElementById("aspectRatioSelect");
var ellipseWidthInput = document.getElementById("ellipseWidthInput");
var ellipseHeightInput = document.getElementById("ellipseHeightInput");
var centeredChk = document.getElementById("centeredChk");
var moveStep = document.getElementById("moveStep");

var workspaceMouseX = 0; // used to hold coordinates with respect to the workspaceContainerDiv
var workspaceMouseY = 0; // used to hold coordinates with respect to the workspaceContainerDiv
var mouseX = 0;
var mouseY = 0;

// check if all required modules are present (HTML5 Storage etc...)
initializeEditor();

// since this is the elliptical marquee we set crosshair cursor
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

aspectRatioSelect.addEventListener("change", function(){
	//alert("aspect ratio changed to: " + aspectRatioSelect.value);
	
	if(aspectRatioSelect.value == 0){
		//alert("free");
		ellipseWidthInput.value = "";
		ellipseHeightInput.value = "";
	}else if(aspectRatioSelect.value == 1){
		//alert("aspect ratio");
		// if there is no saved aspect ratio
		ellipseWidthInput.value = 1;
		ellipseHeightInput.value = 1;
	}else if(aspectRatioSelect.value == 2){
		//alert("set size");
		
		//alert(JSON.stringify(activeSelectionArea));
		
		/*
		if(ellipticalSelection &&  ellipticalSelection.radiusX && ellipticalSelection.radiusY 
			&& Math.abs(ellipticalSelection.radiusX) > 0 && Math.abs(ellipticalSelection.radiusY) > 0){
			ellipseWidthInput.value = ellipticalSelection.radiusX;
			ellipseHeightInput.value = ellipticalSelection.radiusY;			
		}else{
			ellipseWidthInput.value = 50;
			ellipseHeightInput.value = 50;
		}
		*/
		
		if(activeSelectionArea && activeSelectionArea.shape == "ellipse" && activeSelectionArea.geometry.radiusX && activeSelectionArea.geometry.radiusY
			&& Math.abs(activeSelectionArea.geometry.radiusX) > 0 && Math.abs(activeSelectionArea.geometry.radiusY) > 0){
			ellipseWidthInput.value = 2*Math.abs(activeSelectionArea.geometry.radiusX);
			ellipseHeightInput.value = 2*Math.abs(activeSelectionArea.geometry.radiusY);				
		}else{
			ellipseWidthInput.value = 50;
			ellipseHeightInput.value = 50;		
		}
		
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
	
	lastdragPoint.x = mouseX;
	lastdragPoint.y = mouseY;
	
	if(transformSelection){
	
		if(activeSelectionArea){
			// console.log("active selection");
			
			// check if mouse in active selection area
			if(EditorUtils.checkPointInActiveSelection(selectionCtx, mouseX, mouseY)){
				// we have to do the move
				dragselection = true;
							
				// We don't want to start a new selection so return
				return;
			}else{

			}
			
		}else{
			
		}
	
	}else{
	
		//alert(mouseX + "," + mouseY);
		
		// If new selection mode chosen then delete the last selection from the screen
		if(selectOperationSelect.value == "new"){
			activeSelectionArea = undefined;
			updateToolCanvas();
		}
		
		toolDrawCtx.clearRect(0, 0, toolDrawCtx.canvas.width, toolDrawCtx.canvas.height);
		clearInterval(selectionMarchingAntsInterval);
		
		// reset the elliptical selection
		ellipticalSelection = {x: 0, y:0 , radiusX:0, radiusY:0, rotation:0, startAngle: 0, endAngle: 0, anticlockwise: false};
		
		selectionActive = false;
		
		// reset the squareSelectionRect 
		squareSelectionRect.x = mouseX;
		squareSelectionRect.y = mouseY;
		squareSelectionRect.width = 0;
		squareSelectionRect.height = 0;
		
		// reset the center point
		centerPoint = {x: mouseX, y: mouseY};
		
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
	
	// ELLIPTICAL SELECTION - updates the width and height of the rectangular selection with the mouse move
	if(selectingrect){
	
		/*
		// Restrict the ellipse to the bounds of the canvas
		if(mouseX < 0){
			mouseX = 0;
		}
		if(mouseY < 0){
			mouseY = 0;
		}
		if(mouseX > editorCanvas.width){
			mouseX = editorCanvas.width;
		}
		if(mouseY > editorCanvas.height){
			mouseY = editorCanvas.height;
		}
		*/
		
		//console.log(centeredChk.checked);
		
		if(!centeredChk.checked){
		
			// Regular Uncentered ellipse drawing
			squareSelectionRect.width = mouseX - squareSelectionRect.x;
			squareSelectionRect.height = mouseY - squareSelectionRect.y;	
			
			setEllipseSelectionFromRect(squareSelectionRect, ellipticalSelection, mouseX, mouseY);			
			
		}else{
			// Centered ellipse drawing
			// use centerPoint to calculate squareSelectionRect
			// just to make sure that updatetoolCanvas() shows the drawn ellipse in the if clause
			squareSelectionRect.width = 1;
			squareSelectionRect.height = 1;
			
			setEllipseSelectionFromCenter(centerPoint, ellipticalSelection, mouseX, mouseY);		
			
		}
		
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
		EditorUtils.drawSelectionClipping(selectionCtx, invertSelection,"green",activeSelectionArea,false);
	
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
		
		if(ellipticalSelection.radiusX == 0 || ellipticalSelection.radiusY == 0){
		
			selectionActive = false;
			// just in case 
			clearInterval(selectionMarchingAntsInterval);
			
			// to clear the selection dashed lines
			updateToolCanvas();	
			
		}else{
		
			if(!selectionActive){
			
				selectionActive = true;
			
				if((selectOperationSelect.value) == "new" || activeSelectionArea === undefined){
				
					// REPLACE THE LAST SELECTION OR CREATE NEW SELECTION
				
					activeSelectionArea = {
						shape: "ellipse", 
						geometry: ellipticalSelection, 
						invert: invertSelection, 
						invert_rect: {x: 0, y:0, width: editorCanvas.width, height: editorCanvas.height}
					};
					
					// we also store the mouseOffsetLeft, mouseOffsetTop for drawing on the toolDrawCanvas because they may not be set initially
					/*
					let selectEditEntry = {
						edit: "select", 
						edit_label: "Ellipse Select", 
						selection: activeSelectionArea, 
						offsetLeft: mouseOffsetLeft, 
						offsetTop: mouseOffsetTop
					};
					*/
					
					// copy of local variable ellipticalSelection
					var ellipse = new Object();
					ellipse.x = ellipticalSelection.x;
					ellipse.y = ellipticalSelection.y;
					ellipse.radiusX = ellipticalSelection.radiusX;
					ellipse.radiusY = ellipticalSelection.radiusY;
					ellipse.rotation = ellipticalSelection.rotation;
					ellipse.startAngle = ellipticalSelection.startAngle;
					ellipse.endAngle = ellipticalSelection.endAngle;
					ellipse.anticlockwise = ellipticalSelection.anticlockwise;
					
					var rect = new Object();
					rect.x = 0;
					rect.y = 0;
					rect.width = editorCanvas.width;
					rect.height = editorCanvas.height;
					
					// object copy of activeSelectionArea
					var selectionArea = new Object();
					selectionArea.shape = "ellipse";
					selectionArea.geometry = ellipse;
					selectionArea.invert = invertSelection;
					selectionArea.invert_rect = rect;
					
					var selectEditEntry = new Object();
					selectEditEntry.edit = "select";
					selectEditEntry.edit_label = "Ellipse Select";
					selectEditEntry.selection = selectionArea;
					selectEditEntry.offsetLeft = mouseOffsetLeft;
					selectEditEntry.offsetTop = mouseOffsetTop;

					//alert(JSON.stringify(deleteEditEntry));
					
					// add selection to the edit stack
					editStack.add(selectEditEntry);
					
					applyEditHistory();	
					
					// Below may be used when we do n ot reprocess through the engine
					/*
					ellipticalSelection = {x: 0, y:0 , radiusX:0, radiusY:0, rotation:0, startAngle: 0, endAngle: 0, anticlockwise: false};
					
					// Start the marching ants for the active selection
					startMarchingAnts();
					*/				
				}else{
				
					// COMBINE OLD SELECTION AND NEW SELECTION
					//alert("perform selection shape arithmetic");	

					var tempActiveSelectionArea = {
						shape: "ellipse", 
						geometry: ellipticalSelection, 
						invert: invertSelection, 
						invert_rect: {x: 0, y:0, width: editorCanvas.width, height: editorCanvas.height}
					};

					EditorUtils.performSelectionArithmeticOperation("Elliptical Select",selectOperationSelect.value, activeSelectionArea, tempActiveSelectionArea);					
					
				}
				
				// Start the marching ants for the active selection
				startMarchingAnts();
										
			}
			
		}

	}
}

function setEllipseSelectionFromRect(rect, ellipse, mouseX, mouseY){

	//console.log(rect.width + "," + rect.height);

	var tempSelectionRect = new Object();
	tempSelectionRect.x = rect.x;
	tempSelectionRect.y = rect.y;
	tempSelectionRect.width = rect.width;
	tempSelectionRect.height = rect.height;

	
	if(aspectRatioSelect.value == 0){
		//alert("free");
		
		// FREE ASPECT RATIO CIRCULAR SELECTION
		
		// Update the dimensions of the ellipse bounding rectangle
		// with FREE aspect ratio

		// Calculate the ellipse from the rectangle
		ellipse.x = tempSelectionRect.x + tempSelectionRect.width/2;
		ellipse.y = tempSelectionRect.y + tempSelectionRect.height/2;
		ellipse.radiusX = Math.abs(tempSelectionRect.width/2);
		ellipse.radiusY =  Math.abs(tempSelectionRect.height/2);
		ellipse.rotation = 0;
		ellipse.startAngle = 0;
		ellipse.endAngle = 2 * Math.PI;	
			
	}else if(aspectRatioSelect.value == 1){
	
		// ASPECT RATIO ELLIPTICAL SELECTION
	
		//alert("aspect ratio");
		
		// Update the dimensions of the ellipse bounding rectangle
		// with SET aspect ratio			
		// *NB. !!!. For aspect ratio we have to update ellipse
		// specific to each quandrant direction of the selection drag
					
		/*
			Quadrants
			
			 x|y
			-----
			 -|- 	// LEFT, TOP ellipse draw direction
			 +|- 	// RIGHT, TOP ellipse draw direction
			 +|+ 	// RIGHT, BOTTOM ellipse draw direction
			 -|+ 	// LEFT, BOTTOM ellipse draw direction
			
			
		*/
		
		
		if(ellipseHeightInput.value >= ellipseWidthInput.value){
			// If height ratio is larger use height as the ratio value to get the width
			tempSelectionRect.height = mouseY - rect.y;
			tempSelectionRect.width = (ellipseWidthInput.value/ellipseHeightInput.value)*tempSelectionRect.height;			
		}else{
			// If width ratio is larger use width as the ratio value to get the height
			tempSelectionRect.width = mouseX - rect.x;
			tempSelectionRect.height = (ellipseHeightInput.value/ellipseWidthInput.value)*tempSelectionRect.width;			
		}
		
		// EQUAL ASPECT RATIO
		if(ellipseHeightInput.value == ellipseWidthInput.value){
			// LEFT, TOP ellipse draw direction
			if(rect.width < 0 && rect.height < 0){
				//console.log("LEFT, TOP");	
				// Calculate the ellipse from the rectangle
				ellipse.x = tempSelectionRect.x + tempSelectionRect.width/2;
				ellipse.y = tempSelectionRect.y + tempSelectionRect.height/2;
				ellipse.radiusX = Math.abs(tempSelectionRect.width/2);
				ellipse.radiusY =  Math.abs(tempSelectionRect.height/2);
				ellipse.rotation = 0;
				ellipse.startAngle = 0;
				ellipse.endAngle = 2 * Math.PI;					
			}
			
			// RIGHT, TOP ellipse draw direction
			if(rect.width >= 0 && rect.height < 0){
				//console.log("RIGHT, TOP");
				// Calculate the ellipse from the rectangle
				ellipse.x = tempSelectionRect.x - tempSelectionRect.width/2;
				ellipse.y = tempSelectionRect.y + tempSelectionRect.height/2;
				ellipse.radiusX = Math.abs(tempSelectionRect.width/2);
				ellipse.radiusY =  Math.abs(tempSelectionRect.height/2);
				ellipse.rotation = 0;
				ellipse.startAngle = 0;
				ellipse.endAngle = 2 * Math.PI;						
			}	

			// RIGHT, BOTTOM ellipse draw direction
			if(rect.width >= 0 && rect.height >= 0){
				//console.log("RIGHT, BOTTOM");
				// Calculate the ellipse from the rectangle
				ellipse.x = tempSelectionRect.x + tempSelectionRect.width/2;
				ellipse.y = tempSelectionRect.y + tempSelectionRect.height/2;
				ellipse.radiusX = Math.abs(tempSelectionRect.width/2);
				ellipse.radiusY =  Math.abs(tempSelectionRect.height/2);
				ellipse.rotation = 0;
				ellipse.startAngle = 0;
				ellipse.endAngle = 2 * Math.PI;		
			}

			// LEFT, BOTTOM ellipse draw direction
			if(rect.width < 0 && rect.height >= 0){
				//console.log("LEFT, BOTTOM");
				// Calculate the ellipse from the rectangle
				ellipse.x = tempSelectionRect.x - tempSelectionRect.width/2;
				ellipse.y = tempSelectionRect.y + tempSelectionRect.height/2;
				ellipse.radiusX = Math.abs(tempSelectionRect.width/2);
				ellipse.radiusY =  Math.abs(tempSelectionRect.height/2);
				ellipse.rotation = 0;
				ellipse.startAngle = 0;
				ellipse.endAngle = 2 * Math.PI;		
			}			
		}

		// WIDTH GREATER ASPECT RATIO
		if(ellipseHeightInput.value < ellipseWidthInput.value){
			// LEFT, TOP ellipse draw direction
			if(rect.width < 0 && rect.height < 0){
				//console.log("LEFT, TOP");	
				// Calculate the ellipse from the rectangle
				ellipse.x = tempSelectionRect.x + tempSelectionRect.width/2;
				ellipse.y = tempSelectionRect.y + tempSelectionRect.height/2;
				ellipse.radiusX = Math.abs(tempSelectionRect.width/2);
				ellipse.radiusY =  Math.abs(tempSelectionRect.height/2);
				ellipse.rotation = 0;
				ellipse.startAngle = 0;
				ellipse.endAngle = 2 * Math.PI;					
			}
			
			// RIGHT, TOP ellipse draw direction
			if(rect.width >= 0 && rect.height < 0){
				//console.log("RIGHT, TOP");
				// Calculate the ellipse from the rectangle
				ellipse.x = tempSelectionRect.x + tempSelectionRect.width/2;
				ellipse.y = tempSelectionRect.y - tempSelectionRect.height/2;
				ellipse.radiusX = Math.abs(tempSelectionRect.width/2);
				ellipse.radiusY =  Math.abs(tempSelectionRect.height/2);
				ellipse.rotation = 0;
				ellipse.startAngle = 0;
				ellipse.endAngle = 2 * Math.PI;							
			}	

			// RIGHT, BOTTOM ellipse draw direction
			if(rect.width >= 0 && rect.height >= 0){
				//console.log("RIGHT, BOTTOM");
				// Calculate the ellipse from the rectangle
				ellipse.x = tempSelectionRect.x + tempSelectionRect.width/2;
				ellipse.y = tempSelectionRect.y + tempSelectionRect.height/2;
				ellipse.radiusX = Math.abs(tempSelectionRect.width/2);
				ellipse.radiusY =  Math.abs(tempSelectionRect.height/2);
				ellipse.rotation = 0;
				ellipse.startAngle = 0;
				ellipse.endAngle = 2 * Math.PI;			
			}

			// LEFT, BOTTOM ellipse draw direction
			if(rect.width < 0 && rect.height >= 0){
				//console.log("LEFT, BOTTOM");
				// Calculate the ellipse from the rectangle
				ellipse.x = tempSelectionRect.x + tempSelectionRect.width/2;
				ellipse.y = tempSelectionRect.y - tempSelectionRect.height/2;
				ellipse.radiusX = Math.abs(tempSelectionRect.width/2);
				ellipse.radiusY =  Math.abs(tempSelectionRect.height/2);
				ellipse.rotation = 0;
				ellipse.startAngle = 0;
				ellipse.endAngle = 2 * Math.PI;			
			}			
		}	

		// HEIGHT GREATER ASPECT RATIO
		if(ellipseHeightInput.value > ellipseWidthInput.value){
			// LEFT, TOP ellipse draw direction
			if(rect.width < 0 && rect.height < 0){
				//console.log("LEFT, TOP");	
				// Calculate the ellipse from the rectangle
				ellipse.x = tempSelectionRect.x + tempSelectionRect.width/2;
				ellipse.y = tempSelectionRect.y + tempSelectionRect.height/2;
				ellipse.radiusX = Math.abs(tempSelectionRect.width/2);
				ellipse.radiusY =  Math.abs(tempSelectionRect.height/2);
				ellipse.rotation = 0;
				ellipse.startAngle = 0;
				ellipse.endAngle = 2 * Math.PI;					
			}
			
			// RIGHT, TOP ellipse draw direction
			if(rect.width >= 0 && rect.height < 0){
				//console.log("RIGHT, TOP");
				// Calculate the ellipse from the rectangle
				ellipse.x = tempSelectionRect.x - tempSelectionRect.width/2;
				ellipse.y = tempSelectionRect.y + tempSelectionRect.height/2;
				ellipse.radiusX = Math.abs(tempSelectionRect.width/2);
				ellipse.radiusY =  Math.abs(tempSelectionRect.height/2);
				ellipse.rotation = 0;
				ellipse.startAngle = 0;
				ellipse.endAngle = 2 * Math.PI;							
			}	

			// RIGHT, BOTTOM ellipse draw direction
			if(rect.width >= 0 && rect.height >= 0){
				//console.log("RIGHT, BOTTOM");
				// Calculate the ellipse from the rectangle
				ellipse.x = tempSelectionRect.x + tempSelectionRect.width/2;
				ellipse.y = tempSelectionRect.y + tempSelectionRect.height/2;
				ellipse.radiusX = Math.abs(tempSelectionRect.width/2);
				ellipse.radiusY =  Math.abs(tempSelectionRect.height/2);
				ellipse.rotation = 0;
				ellipse.startAngle = 0;
				ellipse.endAngle = 2 * Math.PI;				
			}

			// LEFT, BOTTOM ellipse draw direction
			if(rect.width < 0 && rect.height >= 0){
				//console.log("LEFT, BOTTOM");
				// Calculate the ellipse from the rectangle
				ellipse.x = tempSelectionRect.x - tempSelectionRect.width/2;
				ellipse.y = tempSelectionRect.y + tempSelectionRect.height/2;
				ellipse.radiusX = Math.abs(tempSelectionRect.width/2);
				ellipse.radiusY =  Math.abs(tempSelectionRect.height/2);
				ellipse.rotation = 0;
				ellipse.startAngle = 0;
				ellipse.endAngle = 2 * Math.PI;			
			}			
		}			
		

	}else if(aspectRatioSelect.value == 2){
	
		// FIXED SIZE CIRCULAR SELECTION
	
		//alert("set size");
		
		tempSelectionRect.width = ellipseWidthInput.value;
		tempSelectionRect.height = ellipseHeightInput.value;	

		// we drag the circle with the cursor by updating tempSelectionRect.x & tempSelectionRectt.y
		var circle_dragx = parseInt(mouseX - lastdragPoint.x);
		var circle_dragy = parseInt(mouseY - lastdragPoint.y);	
		
		tempSelectionRect.x += circle_dragx;
		tempSelectionRect.y += circle_dragy;
		
		// !!! VERY IMPORTANT - we have to update squareselectionRect also
		// to make the circle move permanently cause it won't
		// be updated using tempSelectionRect and "rect" is a reference to it
		rect.x = tempSelectionRect.x;
		rect.y = tempSelectionRect.y;
		
		//console.log(circle_dragx, circle_dragy);

		lastdragPoint.x = mouseX;
		lastdragPoint.y = mouseY;	
		
		// Calculate the ellipse from the rectangle
		ellipse.x = tempSelectionRect.x;
		ellipse.y = tempSelectionRect.y;
		ellipse.radiusX = Math.abs(tempSelectionRect.width/2);
		ellipse.radiusY =  Math.abs(tempSelectionRect.height/2);
		ellipse.rotation = 0;
		ellipse.startAngle = 0;
		ellipse.endAngle = 2 * Math.PI;	
		
	}
}

function setEllipseSelectionFromCenter(center, ellipse, mouseX, mouseY){


	if(aspectRatioSelect.value == 0){
	
		// FREE ASPECT RATIO CIRCULAR SELECTION
		//alert("free");
		
		var radiusX = Math.abs(mouseX - center.x);
		var radiusY = Math.abs(mouseY - center.y);			
		
		ellipse.x = center.x;
		ellipse.y = center.y;
		ellipse.radiusX = radiusX;
		ellipse.radiusY = radiusY;
		ellipse.rotation = 0;
		ellipse.startAngle = 0;
		ellipse.endAngle = 2 * Math.PI;	
			
	}else if(aspectRatioSelect.value == 1){
	
		// ASPECT RATIO CIRCULAR SELECTION
		//alert("aspect ratio");
		
		var radiusX = Math.abs(mouseX - center.x);
		var radiusY = Math.abs(mouseY - center.y);	
			
		/*
		if(radiusY >= radiusX){
			// If radiusY is larger use radiusY as the ratio value to get the radiusX
			radiusX = (ellipseWidthInput.value/ellipseHeightInput.value)*radiusY;				
		}else{
			// If radiusX ratio is larger use radiusX as the ratio value to get the radiusY
			radiusY = (ellipseHeightInput.value/ellipseWidthInput.value)*radiusX;			
		}
		*/	

		if(ellipseHeightInput.value == ellipseWidthInput.value){
		
			// set the radius to the hypotenuse
			var hypotenuse = Math.sqrt((radiusX * radiusX) + (radiusY * radiusY));	

			ellipse.x = center.x;
			ellipse.y = center.y;
			ellipse.radiusX = hypotenuse;
			ellipse.radiusY = hypotenuse;
			ellipse.rotation = 0;
			ellipse.startAngle = 0;
			ellipse.endAngle = 2 * Math.PI;					
		
		}else if(ellipseHeightInput.value >= ellipseWidthInput.value){
			// If radiusY is larger use radiusY as the ratio value to get the radiusX
			radiusX = (ellipseWidthInput.value/ellipseHeightInput.value)*radiusY;		

			ellipse.x = center.x;
			ellipse.y = center.y;
			ellipse.radiusX = radiusX;
			ellipse.radiusY = radiusY;
			ellipse.rotation = 0;
			ellipse.startAngle = 0;
			ellipse.endAngle = 2 * Math.PI;				
			
		}else{
			// If radiusX ratio is larger use radiusX as the ratio value to get the radiusY
			radiusY = (ellipseHeightInput.value/ellipseWidthInput.value)*radiusX;

			ellipse.x = center.x;
			ellipse.y = center.y;
			ellipse.radiusX = radiusX;
			ellipse.radiusY = radiusY;
			ellipse.rotation = 0;
			ellipse.startAngle = 0;
			ellipse.endAngle = 2 * Math.PI;				
		}			
			

	}else if(aspectRatioSelect.value == 2){
	

		// FIXED SIZE CIRCULAR SELECTION
	
		//alert("set size");


		// we drag the circle with the cursor by updating tempSelectionRect.x & tempSelectionRectt.y
		var circle_dragx = parseInt(mouseX - lastdragPoint.x);
		var circle_dragy = parseInt(mouseY - lastdragPoint.y);	
		
		centerPoint.x += circle_dragx;
		centerPoint.y += circle_dragy;
		
		//console.log(circle_dragx, circle_dragy);

		lastdragPoint.x = mouseX;
		lastdragPoint.y = mouseY;	
		
		// Calculate the ellipse from the rectangle
		ellipse.x = centerPoint.x;
		ellipse.y = centerPoint.y;
		ellipse.radiusX = Math.abs(ellipseWidthInput.value/2);
		ellipse.radiusY =  Math.abs(ellipseHeightInput.value/2);
		ellipse.rotation = 0;
		ellipse.startAngle = 0;
		ellipse.endAngle = 2 * Math.PI;	
	}

	
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

	// reset any elliptical selection
	ellipticalSelection = {x: 0, y:0 , radiusX:0, radiusY:0, rotation:0, startAngle: 0, endAngle: 0, anticlockwise: false};

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

	if(!selectionActive){
	
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
			var tempEllipse = new Object();
			tempEllipse.x = ellipticalSelection.x;
			tempEllipse.y = ellipticalSelection.y;
			tempEllipse.radiusX = ellipticalSelection.radiusX;
			tempEllipse.radiusY = ellipticalSelection.radiusY;
			tempEllipse.rotation = ellipticalSelection.rotation;
			tempEllipse.startAngle = ellipticalSelection.startAngle;
			tempEllipse.endAngle = ellipticalSelection.endAngle;
			
			// Apply global transformations to the tempRect
			EditorUtils.globalImageRotateActiveSelection(tempEllipse, "ellipse");			

			// draw black dashed line over the white line to finish the selection box
			toolDrawCtx.strokeStyle = "#000000";
			toolDrawCtx.setLineDash([9,0]);
			// Draw the rectangle
			// toolDrawCtx.strokeRect((squareSelectionRect.x + 0.5 + mouseOffsetLeft), (squareSelectionRect.y + 0.5 + mouseOffsetTop), (squareSelectionRect.width - 1), (squareSelectionRect.height - 1));
			// Draw the ellipse
			toolDrawCtx.beginPath();
			//toolDrawCtx.ellipse(tempEllipse.x + mouseOffsetLeft, tempEllipse.y + mouseOffsetTop, tempEllipse.radiusX, tempEllipse.radiusY, tempEllipse.rotation, tempEllipse.startAngle, tempEllipse.endAngle);
			toolDrawCtx.ellipse(tempEllipse.x * (globalZoom/100) + canvasOffsetLeft, tempEllipse.y * (globalZoom/100) + canvasOffsetTop, tempEllipse.radiusX * (globalZoom/100), tempEllipse.radiusY * (globalZoom/100), tempEllipse.rotation, tempEllipse.startAngle, tempEllipse.endAngle);
			toolDrawCtx.stroke();			
			
			// draw solid white line
			
			toolDrawCtx.strokeStyle = "#ffffff";
			toolDrawCtx.setLineDash([5,4]);
			// Draw the rectangle
			// toolDrawCtx.strokeRect((squareSelectionRect.x + 0.5 + mouseOffsetLeft), (squareSelectionRect.y + 0.5 + mouseOffsetTop), (squareSelectionRect.width - 1), (squareSelectionRect.height - 1));
			// Draw the ellipse
			toolDrawCtx.beginPath();
			//toolDrawCtx.ellipse(tempEllipse.x + mouseOffsetLeft, tempEllipse.y + mouseOffsetTop, tempEllipse.radiusX, tempEllipse.radiusY, tempEllipse.rotation, tempEllipse.startAngle, tempEllipse.endAngle);
			toolDrawCtx.ellipse(tempEllipse.x * (globalZoom/100) + canvasOffsetLeft, tempEllipse.y * (globalZoom/100) + canvasOffsetTop, tempEllipse.radiusX * (globalZoom/100), tempEllipse.radiusY * (globalZoom/100), tempEllipse.rotation, tempEllipse.startAngle, tempEllipse.endAngle);
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