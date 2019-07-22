// Copyright (c) 2019 Kasey Thomas. All rights reserved.
// Use of this source code is governed by the EULA.

'use strict';

/*
layerStack[layerIndex].

layerStack[layerIndex].cumulativeNegatives.x
layerStack[layerIndex].cumulativeNegatives.y

layerStack[0].

layerStack[0].cumulativeNegatives.x
layerStack[0].cumulativeNegatives.y
*/

// global zoom transformation that is used to set the CSS zoom of canvasDiv
var globalZoom = 100;
var globalTransformObject = {
	flip_scaleX: 1,
	flip_scaleY: 1,
	rotate: 0,
	transformChain: []
};

var layerStack = []; // holds the canvas and other associated layer parameters
var layerIndex = 0; 	 // used to indicate which layer canvas the edit is affecting
var currentLayer = 0; // the current layer being edited
var editingLayerMask = 0; // determines whether edit applies to layer canvas (0), raster mask (1), or vector mask (2)

function applyEditHistory(){

	// reset any transformations on the editorCanvas container DIV
	// Any rotations, flips are cleared
	globalTransformObject = {
		flip_scaleX: 1,
		flip_scaleY: 1,
		rotate: 0,
		transformChain: []
	};

	//var applyImgData = localStorage.getItem("editor_image");
	var applyImgData; // applyImagedata should be initated to a blank canvas dataurl of canvasWidth, canvasHeight
	
	canvasWidth = parseInt(localStorage.getItem("canvas_width"));
	canvasHeight = parseInt(localStorage.getItem("canvas_height"));

	activeSelectionArea = undefined;
	invertSelection = false;
	selectionActive = false;
	
	// reset the layer iterator
	layerStack = [];
	layerIndex = 0;
	editingLayerMask = 0
	
	//alert(editStack.stack.length);
	//console.clear();
	cumulativeTranslations = {x:0, y:0};
	cumulativeNegatives = {x:0, y:0};
	
	// get the number of layer
	//alert("edits length: " + editStack.stack.length);
	// determine the number of layers by getting the highest layer number in the array
	// of edit objects
	
	var maxlayerIndex = 0;
	
	// loop through all the edits to get the max layer number
	// this will be used to loop through the layers
	for(let k = 0; k < editStack.stack.length; k++){
		// alert("layer: " + editStack.stack[k].layer);
		if(editStack.stack[k].layer > maxlayerIndex){
			maxlayerIndex = editStack.stack[k].layer;
		}
	}
	
	// alert("max layer index: " + maxlayerIndex);
	
	// x is used to loop through all the edits
	let x = 0;
	
	// Create the canvas object in the array of layers for each layer
	// we loop through all the edits to find the maximum layer index 
	/*
	for(let l = 0; l <= maxlayerIndex; l++){
		layerStack[l] = new Object();
		layerStack[l].canvas = document.createElement("canvas");
		layerStack[l].canvas.width = canvasWidth;
		layerStack[l].canvas.height = canvasHeight;	
		layerStack[l].cumulativeTranslations = {x:0, y:0};
		layerStack[l].cumulativeNegatives = {x:0, y:0};
		layerStack[l].visible = true;
	}
	*/
	
	// Do not use above for now we will just create one starting layer
	layerStack[0] = new Object();
	layerStack[0].canvas = document.createElement("canvas");
	layerStack[0].canvas.width = canvasWidth;
	layerStack[0].canvas.height = canvasHeight;	
	layerStack[0].cumulativeTranslations = {x:0, y:0};
	layerStack[0].cumulativeNegatives = {x:0, y:0};
	layerStack[0].visible = true;
	
	// alert(layerStack.length);
	
	next();
		
	// initiate applyImgData with empty canvas size image
	
	// go through all the edits to create the final image
	//(function next() {
	function next() {
	
		//alert(editStack.stack[x].edit + ":" + editingLayerMask)
	
		// alert(editStack.stack[x].edit);
		//alert(layerIndex);
		
		
		if(x >= editStack.index){
			
		}
	
		// Just to make sure edit stack indices are not overrun
		if(editStack.stack[x].edit == "start"){
		
			// 'start' edit does nothing
			// From now on the "start" edit will indicate the point beyond which no 'undo' 
			// operations will pass.
			/*
			let startImage = new Image();
			startImage.onload = function(){
			
				canvasWidth = startImage.width;
				canvasHeight = startImage.height;
				//alert(width + "," + height);
				
				// go to next edit
				checkNextEdit();
			
			}
			startImage.src = applyImgData;
			*/
			
			// go to next edit
			checkNextEdit();
			
		}else if(editStack.stack[x].edit == "add_new_layer"){
		
			// adds a layerIndex atop current layers
			
			editingLayerMask = 0;
			
			// create the new layer
			let addedlayer = new Object();
			addedlayer.canvas = document.createElement("canvas");
			addedlayer.canvas.width = canvasWidth;
			addedlayer.canvas.height = canvasHeight;	
			addedlayer.cumulativeTranslations = {x:0, y:0};
			addedlayer.cumulativeNegatives = {x:0, y:0};
			addedlayer.visible = true;
			
			if(editStack.stack[x].fill){
				//alert("add a fill");
				var addedCtx = addedlayer.canvas.getContext("2d");
				addedCtx.save();
				addedCtx.fillStyle = editStack.stack[x].fill;
				addedCtx.fillRect(0, 0, addedCtx.canvas.width, addedCtx.canvas.height);
				addedCtx.restore();
			}
			
			/*
			// add it atop the layer stack
			layerStack.push(addedlayer);

			// change the index to reflect point to the new added layer
			layerIndex = layerStack.length - 1;
			*/
			
			layerIndex++;
			layerStack.splice(layerIndex,0, addedlayer);
		
			// alert("add new layer");
			// go to next edit
			checkNextEdit();				
			
		}else if(editStack.stack[x].edit == "move_current_layer_up"){
		
			// Move Current Layer Up
			// To move the current layer up we have to render all the images 
			
			// create the new layer with the same values as the one to move
			let addedlayer = createLayerCopy(layerStack[layerIndex]);
			
			layerStack.splice(layerIndex,1);
			
			//alert(JSON.stringify(addedlayer));			
			
			layerIndex += 1;
			
			layerStack.splice(layerIndex,0, addedlayer);

			// go to next edit			
			checkNextEdit();				
			
		}else if(editStack.stack[x].edit == "move_current_layer_down"){
		
			// Move Current Layer Up
			// To move the current layer up we have to render all the images 
			
			// create the new layer with the same values as the one to move
			let addedlayer = createLayerCopy(layerStack[layerIndex]);
			
			layerStack.splice(layerIndex,1);
			
			//alert(JSON.stringify(addedlayer));			
			
			layerIndex -= 1;
			
			layerStack.splice(layerIndex,0, addedlayer);
			
			// go to next edit
			checkNextEdit();				
			
		}else if(editStack.stack[x].edit == "move_current_layer_to_top"){
		
			// Move the current layer to the top of the layerStack (i.e. the end stack array)
			var movedlayer = createLayerCopy(layerStack[layerIndex]);
			layerStack.splice(layerIndex,1);
			layerStack.push(movedlayer);
			
			// Since well be at top set layerIndex to stack array last item index
			layerIndex = layerStack.length - 1;
		
			// go to next edit
			checkNextEdit();	
			
		}else if(editStack.stack[x].edit == "move_current_layer_to_bottom"){
		
			// Move the current layer to the top of the layerStack (i.e. the beginning of stack array)
			var movedlayer = createLayerCopy(layerStack[layerIndex]);
			layerStack.splice(layerIndex,1);
			layerStack.unshift(movedlayer);
			
			// since we'll be at beginning set layerIndex to 0
			layerIndex = 0;
		
			// go to next edit
			checkNextEdit();	
			
		}else if(editStack.stack[x].edit == "merge_layer_down"){
		
			// Merges the current layer with the layer below it
			//alert("merge layer down");
			
			//alert(layerStack[layerIndex].cumulativeNegatives.x);
			//console.log(JSON.stringify(layerStack[layerIndex]));
			
			
			if(layerStack[layerIndex - 1]){ // Check if lower layer exists
			
				
				// If there are objects in any of the merged layers they need to be rasterized
				if('object' in layerStack[layerIndex]){
					//alert("top needs to rasterize");
					layerStack[layerIndex].canvas = rasterizeLayer(layerStack[layerIndex]);
				}
				if('object' in layerStack[layerIndex - 1]){
					//alert("bottom needs to rasterize");
					layerStack[layerIndex - 1].canvas = rasterizeLayer(layerStack[layerIndex - 1]);
				}
				
				// 1. Get the lowest cumulativeNegatives.x and cumulativeNegatives.y
				var cumulativeNegative_x = layerStack[layerIndex].cumulativeNegatives.x;
				var cumulativeNegative_y = layerStack[layerIndex].cumulativeNegatives.y;
				
				//alert( cumulativeNegative_x + "," + cumulativeNegative_y);
				//alert(layerStack[layerIndex - 1].cumulativeNegatives.x + "," + layerStack[layerIndex - 1].cumulativeNegatives.y);
				
				if(layerStack[layerIndex - 1].cumulativeNegatives.x < cumulativeNegative_x){
					cumulativeNegative_x = layerStack[layerIndex - 1].cumulativeNegatives.x;
				}
				if(layerStack[layerIndex - 1].cumulativeNegatives.y < cumulativeNegative_y){
					cumulativeNegative_y = layerStack[layerIndex - 1].cumulativeNegatives.y;
				}
				
				//alert( cumulativeNegative_x + "," + cumulativeNegative_y);
				
				// 2. Get the max right of the two canvas'
				var currentLayerMaxRight = layerStack[layerIndex].cumulativeNegatives.x + layerStack[layerIndex].canvas.width;
				var lowerLayerMaxRight = layerStack[layerIndex - 1].cumulativeNegatives.x + layerStack[layerIndex - 1].canvas.width;
				//alert(currentLayerMaxRight + "\n" + lowerLayerMaxRight);
				var mergeCanvasMaxRight = currentLayerMaxRight;
				if(mergeCanvasMaxRight < lowerLayerMaxRight){
					mergeCanvasMaxRight = lowerLayerMaxRight;
				}
				//alert(mergeCanvasMaxRight);
				
				// Get the lowest bottom of the two layers'
				var currentLayerMaxBottom = layerStack[layerIndex].cumulativeNegatives.y + layerStack[layerIndex].canvas.height;
				var lowerLayerMaxBottom = layerStack[layerIndex - 1].cumulativeNegatives.y + layerStack[layerIndex - 1].canvas.height;
				//alert(currentLayerMaxBottom + "\n" + lowerLayerMaxBottom);
				var mergeCanvasMaxBottom = currentLayerMaxBottom;
				if(mergeCanvasMaxBottom < lowerLayerMaxBottom){
					mergeCanvasMaxBottom = lowerLayerMaxBottom;
				}
				//alert(mergeCanvasMaxBottom);		

				var mergeCanvasWidth = Math.abs(cumulativeNegative_x) + mergeCanvasMaxRight;
				var mergeCanvasHeight = Math.abs(cumulativeNegative_y) + mergeCanvasMaxBottom;
				
				//alert(mergeCanvasWidth + "," + mergeCanvasHeight);
				
				var mergeCanvas = document.createElement("canvas");
				mergeCanvas.width = mergeCanvasWidth;
				mergeCanvas.height = mergeCanvasHeight;
				var mergeCtx = mergeCanvas.getContext("2d");
				
				// before we draw the layers to be merged on the merged canvas lets do preprocessing
				// 1. If any raster mask apply
				if('raster_mask' in layerStack[layerIndex]){
					applyRasterMask(layerStack[layerIndex].canvas, layerStack[layerIndex].raster_mask.opacity_canvas);
				}
				if('raster_mask' in layerStack[layerIndex - 1]){
					applyRasterMask(layerStack[layerIndex - 1].canvas, layerStack[layerIndex - 1].raster_mask.opacity_canvas);
				}
				// 2. if opacity apply
				if('opacity' in layerStack[layerIndex]){
				
					// Create a new canvas object that will be used to draw the current layer with opacity
					var opacityCanvas = document.createElement("canvas");
					opacityCanvas.width = layerStack[layerIndex].canvas.width;
					opacityCanvas.height = layerStack[layerIndex].canvas.height;
					var opacityCtx = opacityCanvas.getContext("2d");
					opacityCtx.globalAlpha = layerStack[layerIndex].opacity/100;
					opacityCtx.drawImage(layerStack[layerIndex].canvas, 0, 0);
					
					layerStack[layerIndex].canvas = opacityCanvas;
				}
				if('opacity' in layerStack[layerIndex - 1]){
				
					// Create a new canvas object that will be used to draw the current layer with opacity
					var opacityCanvas = document.createElement("canvas");
					opacityCanvas.width = layerStack[layerIndex - 1].canvas.width;
					opacityCanvas.height = layerStack[layerIndex - 1].canvas.height;
					var opacityCtx = opacityCanvas.getContext("2d");
					opacityCtx.globalAlpha = layerStack[layerIndex - 1].opacity/100;
					opacityCtx.drawImage(layerStack[layerIndex - 1].canvas, 0, 0);
					
					layerStack[layerIndex - 1].canvas = opacityCanvas;
				}
				
				// draw the layer canvases to the mergeCanvas with adjustment for cumulativeNegatives.
				// draw the lowest canvas first
				mergeCtx.drawImage(layerStack[layerIndex - 1].canvas, layerStack[layerIndex - 1].cumulativeNegatives.x + Math.abs(cumulativeNegative_x), layerStack[layerIndex - 1].cumulativeNegatives.y + Math.abs(cumulativeNegative_y));
				// If blend_mode present apply
				if('blend_mode' in layerStack[layerIndex].canvas){
					mergeCtx.save();
					mergeCtx.globalCompositeOperation = layerStack[layerIndex].blend_mode;					
				}
				mergeCtx.drawImage(layerStack[layerIndex].canvas, layerStack[layerIndex].cumulativeNegatives.x + Math.abs(cumulativeNegative_x), layerStack[layerIndex].cumulativeNegatives.y + Math.abs(cumulativeNegative_y));
				if('blend_mode' in layerStack[layerIndex].canvas){
					mergeCtx.restore();
				}
				
				// Create the new merged layer
				let addedlayer = new Object();
				addedlayer.canvas = mergeCanvas;
				addedlayer.cumulativeTranslations = {x:0, y:0};
				addedlayer.cumulativeNegatives = {x:0, y:0};
				addedlayer.cumulativeNegatives.x = cumulativeNegative_x;
				addedlayer.cumulativeNegatives.y = cumulativeNegative_y;
				// Add the name of the topmost layer merged down
				if('name' in layerStack[layerIndex]){
					addedlayer.name = layerStack[layerIndex].name;
				}				
				addedlayer.visible = true;
				
				//layerStack.splice(layerIndex - 1, 2);
				
				layerStack.splice(layerIndex - 1,2,addedlayer);

				layerIndex = layerIndex - 1;
			}
			
		
			// go to next edit
			checkNextEdit();	
			
		}else if(editStack.stack[x].edit == "duplicate_current_layer"){
		
			// Duplicate the current layer by creating a copy layer and inserting above the current
			
			// create the new layer with the same values as the one to move
			let addedlayer = createLayerCopy(layerStack[layerIndex]);
			
			// if the added layer has a name similar to one already existing add a number
			if('name' in addedlayer){
			
				//addedlayer.name = renameDuplicateLayer(addedlayer.name);
				// renameDuplicateLayer renames the duplicate layer by appending an index and recursively checks
				// if duplicate name exists
				addedlayer.name = renameDuplicateLayer(addedlayer.name);

			}
			
			layerIndex += 1;
			
			layerStack.splice(layerIndex,0, addedlayer);			
			
			// go to next edit
			checkNextEdit();				
			
		}else if(editStack.stack[x].edit == "flip_layer_horizontal"){
		
			// !!! Remember have to flip objects
		
			//alert(layerStack[layerIndex].canvas.width + "," + layerStack[layerIndex].canvas.height);
			
			// *Nb. When we flip we flip the content on the canvas. This means we have to get the bounding rect
			// of all content on the canvas by trimming to remove transparent area. then flip that particular region only.
			
			// 1. Get the box dimensions of the actual content of the layer canvas
			var layerContentRect = EditorUtils.getBoundingRectFromCanvas(layerStack[layerIndex].canvas);
			//alert(JSON.stringify(layerContentRect));
			
			var contentCanvas = document.createElement("canvas");
			contentCanvas.width = layerContentRect.width;
			contentCanvas.height = layerContentRect.height;
			var contentCtx = contentCanvas.getContext("2d");
			
			contentCtx.drawImage(layerStack[layerIndex].canvas, layerContentRect.x, layerContentRect.y, layerContentRect.width, layerContentRect.height, 0, 0, layerContentRect.width, layerContentRect.height);
			
			// flip the content horizontally
			EditorUtils.flipCanvas(contentCanvas, "horizontal");
			
			var layerCtx = layerStack[layerIndex].canvas.getContext("2d");
			layerCtx.clearRect(0,0, layerCtx.canvas.width, layerCtx.canvas.height);
			layerCtx.drawImage(contentCanvas, layerContentRect.x, layerContentRect.y);

		
			// go to next edit
			checkNextEdit();				
		
		}else if(editStack.stack[x].edit == "flip_layer_vertical"){
		
			// !!! Remember have to flip objects
		
			// flip the current layer
			//alert("flip_layer_vertical");
			
			// *Nb. When we flip we flip the content on the canvas. This means we have to get the bounding rect
			// of all content on the canvas by trimming to remove transparent area. then flip that particular region only.
			
			// 1. Get the box dimensions of the actual content of the layer canvas
			var layerContentRect = EditorUtils.getBoundingRectFromCanvas(layerStack[layerIndex].canvas);
			//alert(JSON.stringify(layerContentRect));
			
			var contentCanvas = document.createElement("canvas");
			contentCanvas.width = layerContentRect.width;
			contentCanvas.height = layerContentRect.height;
			var contentCtx = contentCanvas.getContext("2d");
			
			contentCtx.drawImage(layerStack[layerIndex].canvas, layerContentRect.x, layerContentRect.y, layerContentRect.width, layerContentRect.height, 0, 0, layerContentRect.width, layerContentRect.height);
			
			// flip the content horizontally
			EditorUtils.flipCanvas(contentCanvas, "vertical");
			
			var layerCtx = layerStack[layerIndex].canvas.getContext("2d");
			layerCtx.clearRect(0,0, layerCtx.canvas.width, layerCtx.canvas.height);
			layerCtx.drawImage(contentCanvas, layerContentRect.x, layerContentRect.y);

		
			// go to next edit
			checkNextEdit();				
		
		}else if(editStack.stack[x].edit == "rotate_layer"){
		
			//alert(JSON.stringify(editStack.stack[x]));
			
			// !!! Remember have to rotate objects in layers		
			
			// *Nb. When we rotate, we rotate the content on the canvas. This means we have to get the bounding rect
			// of all content on the canvas by trimming to remove transparent area. then flip that particular region only.
			
			// 1. Get the box dimensions of the actual content of the layer canvas
			var layerContentRect = EditorUtils.getBoundingRectFromCanvas(layerStack[layerIndex].canvas);
			//alert(JSON.stringify(layerContentRect));
			
			var contentCanvas = document.createElement("canvas");
			contentCanvas.width = layerContentRect.width;
			contentCanvas.height = layerContentRect.height;
			var contentCtx = contentCanvas.getContext("2d");
			
			contentCtx.drawImage(layerStack[layerIndex].canvas, layerContentRect.x, layerContentRect.y, layerContentRect.width, layerContentRect.height, 0, 0, layerContentRect.width, layerContentRect.height);
			
			// ROTATE 90 degrees
			if(editStack.stack[x].angle == 90){
				// rotate the top left point to see where the image will end up
				//alert(JSON.stringify(rotatePoint(layerContentRect.cx, layerContentRect.cy, layerContentRect.left, layerContentRect.top, -editStack.stack[x].angle)));
			
				// get a 90 rotated version of the content canvas
				// https://stackoverflow.com/questions/23346166/rotate-image-by-90-degrees-on-html5-canvas
				
				// reset the canvas with new dimensions
				var rotatedCanvas = document.createElement("canvas");
				rotatedCanvas.width = contentCanvas.height;
				rotatedCanvas.height = contentCanvas.width;
				
				var rotatedCtx = rotatedCanvas.getContext("2d");

				rotatedCtx.save();


				rotatedCtx.translate(rotatedCanvas.width/2, rotatedCanvas.height/2);

				// rotate the canvas by +90 deg
				rotatedCtx.rotate(Math.PI/2);

				// draw the signature
				// since images draw from top-left offset the draw by 1/2 width & height
				rotatedCtx.drawImage(contentCanvas,-contentCanvas.width/2,-contentCanvas.height/2);
				
				rotatedCtx.restore();

				var layerCtx = layerStack[layerIndex].canvas.getContext("2d");
				layerCtx.clearRect(0,0, layerCtx.canvas.width, layerCtx.canvas.height);
				
				// since we rotated the content by 90 degrees we have to calculate the offset to place it
				// Remember when you rotate by 90 deg (bottom, left) becomes (top, left)
				// so we use bottom, left to calculate placement point
				
				var newTopLeft = rotatePoint(layerContentRect.cx, layerContentRect.cy, layerContentRect.left, layerContentRect.bottom, -editStack.stack[x].angle);
				
				// if any of the dimensions are negative we have too update the layer canvas cumulativeNegative, reset it to zero
				//and update the dimension of the layer canvas
				if(newTopLeft.x < 0){
					layerCtx.canvas.width += Math.abs(newTopLeft.x);
					// update the cumulative negative
					layerStack[layerIndex].cumulativeNegatives.x += newTopLeft.x;
					newTopLeft.x = 0;
				}

				if(newTopLeft.y < 0){
					layerCtx.canvas.height += Math.abs(newTopLeft.y);	
					// update the cumulative negative
					layerStack[layerIndex].cumulativeNegatives.y += newTopLeft.y;
					newTopLeft.y = 0;
				}
				
				layerCtx.drawImage(rotatedCanvas, newTopLeft.x, newTopLeft.y);											
				
			}
			
			// ROTATE -90 degrees
			if(editStack.stack[x].angle == -90){
				// rotate the top left point to see where the image will end up
				//alert(JSON.stringify(rotatePoint(layerContentRect.cx, layerContentRect.cy, layerContentRect.left, layerContentRect.top, -editStack.stack[x].angle)));
			
				// get a 90 rotated version of the content canvas
				// https://stackoverflow.com/questions/23346166/rotate-image-by-90-degrees-on-html5-canvas
				
				// reset the canvas with new dimensions
				var rotatedCanvas = document.createElement("canvas");
				rotatedCanvas.width = contentCanvas.height;
				rotatedCanvas.height = contentCanvas.width;
				
				var rotatedCtx = rotatedCanvas.getContext("2d");

				rotatedCtx.save();


				rotatedCtx.translate(rotatedCanvas.width/2, rotatedCanvas.height/2);

				// rotate the canvas by +90 deg
				rotatedCtx.rotate(-Math.PI/2);

				// draw the signature
				// since images draw from top-left offset the draw by 1/2 width & height
				rotatedCtx.drawImage(contentCanvas,-contentCanvas.width/2,-contentCanvas.height/2);
				
				rotatedCtx.restore();

				var layerCtx = layerStack[layerIndex].canvas.getContext("2d");
				layerCtx.clearRect(0,0, layerCtx.canvas.width, layerCtx.canvas.height);
				
				// since we rotated the content by -90 degrees we have to calculate the offset to place it
				// Remember when you rotate by -90 deg (top, right) point becomes (top, left)
				// so we use top, tight to calculate placement point of top left
				
				var newTopLeft = rotatePoint(layerContentRect.cx, layerContentRect.cy, layerContentRect.right, layerContentRect.top, -editStack.stack[x].angle);
				
				// if any of the dimensions are negative we have too update the layer canvas cumulativeNegative, reset it to zero
				//and update the dimension of the layer canvas
				if(newTopLeft.x < 0){
					layerCtx.canvas.width += Math.abs(newTopLeft.x);
					// update the cumulative negative
					layerStack[layerIndex].cumulativeNegatives.x += newTopLeft.x;
					newTopLeft.x = 0;
				}

				if(newTopLeft.y < 0){
					layerCtx.canvas.height += Math.abs(newTopLeft.y);	
					// update the cumulative negative
					layerStack[layerIndex].cumulativeNegatives.y += newTopLeft.y;
					newTopLeft.y = 0;
				}
				
				layerCtx.drawImage(rotatedCanvas, newTopLeft.x, newTopLeft.y);					
			}
			
			// Rotate by 180 degrees
			if(editStack.stack[x].angle == 180){
			
				// Rotion by 180 is same as flip horizontal then flip vertical
			
				// 1. Get the box dimensions of the actual content of the layer canvas
				var layerContentRect = EditorUtils.getBoundingRectFromCanvas(layerStack[layerIndex].canvas);
				//alert(JSON.stringify(layerContentRect));
				
				var contentCanvas = document.createElement("canvas");
				contentCanvas.width = layerContentRect.width;
				contentCanvas.height = layerContentRect.height;
				var contentCtx = contentCanvas.getContext("2d");
				
				contentCtx.drawImage(layerStack[layerIndex].canvas, layerContentRect.x, layerContentRect.y, layerContentRect.width, layerContentRect.height, 0, 0, layerContentRect.width, layerContentRect.height);
				
				// flip the content horizontally
				EditorUtils.flipCanvas(contentCanvas, "horizontal");
				// flip the content vertically
				EditorUtils.flipCanvas(contentCanvas, "vertical");
				
				var layerCtx = layerStack[layerIndex].canvas.getContext("2d");
				layerCtx.clearRect(0,0, layerCtx.canvas.width, layerCtx.canvas.height);
				layerCtx.drawImage(contentCanvas, layerContentRect.x, layerContentRect.y);			
			}
			

			// go to next edit
			checkNextEdit();				
		
		}else if(editStack.stack[x].edit == "set_layer_index"){
		
			// If there was was a layer mask selected in the layer 
			// We reset because we do not select the layer mask in
			// the new layer
			editingLayerMask = 0;
		
			// sets the layer Index to the set value

			//alert(editStack.stack[x].index);
			layerIndex = parseInt(editStack.stack[x].index);
		
			// alert("add new layer");
			// go to next edit
			checkNextEdit();				
			
		}else if(editStack.stack[x].edit == "set_layer_mask_edit"){
		
			// layer canvas (0), raster mask (1), or vector mask (2)
			
			//alert(JSON.stringify(editStack.stack[x]));
			
			editingLayerMask = editStack.stack[x].mask;
			
			//console.log(editingLayerMask);
		
			// alert("add new layer");
			// go to next edit
			checkNextEdit();				
			
		}else if(editStack.stack[x].edit == "set_layer_name"){
		
			// sets the layer Index to the set value
			// alert(editStack.stack[x].name);

			//alert(editStack.stack[x].index);
			layerStack[editStack.stack[x].index].name = editStack.stack[x].name;
		
			// alert("add new layer");
			// go to next edit
			checkNextEdit();				
			
		}else if(editStack.stack[x].edit == "set_layer_opacity"){
		
			//alert("editengine: " + editStack.stack[x].opacity);
		
			// sets the layer Index to the set value
			// alert(editStack.stack[x].name);

			//alert(editStack.stack[x].index);
			layerStack[editStack.stack[x].index].opacity = editStack.stack[x].opacity;
		
			// alert("add new layer");
			// go to next edit
			checkNextEdit();				
			
		}else if(editStack.stack[x].edit == "set_layer_visibility"){
		
			// sets the layer Index to the set value
			// alert(editStack.stack[x].visible);

			//alert(editStack.stack[x].index);
			layerStack[editStack.stack[x].index].visible = editStack.stack[x].visible;
		
			// alert("add new layer");
			// go to next edit
			checkNextEdit();				
			
		}else if(editStack.stack[x].edit == "set_layer_blending_mode"){
		
			// sets the layer blend mode
			
			//alert(editStack.stack[x].mode);
			layerStack[layerIndex].blend_mode = editStack.stack[x].mode;
			
			// go to next edit
			checkNextEdit();				
			
		}else if(editStack.stack[x].edit == "delete_current_layer"){
		
			// Delete the current layer indicated by layerIndex
			// alert("delete layer " + layerIndex);
			layerStack.splice(layerIndex, 1);
			
			layerIndex--;
			if(layerIndex < 0){
				layerIndex = 0;
			}

			// go to next edit
			checkNextEdit();				
			
		}else if(editStack.stack[x].edit == "load_image_to_layer"){
		
			//alert(assetManager.get(editStack.stack[x].asset_id));		
			// applyImgData = assetManager.get(editStack.stack[x].asset_id);
			
			let loadImage = new Image();
			loadImage.onload = function(){
			
				//alert("image dims: " + loadImage.width + "," + loadImage.height);
				//alert("canvas dims: " + canvasWidth + "," + canvasHeight);
							
				let layerCtx = layerStack[layerIndex].canvas.getContext('2d');
				
				/*
				if(loadImage.width > canvasWidth || loadImage.height > canvasHeight){
					// If the image is greater than the default canvasWidth and canvasHeight
					// We have to resize the layer canvas to the dimensions of the larger image
					layerCtx.canvas.width = loadImage.width;
					layerCtx.canvas.height = loadImage.height;
				}
				*/
				
				if(loadImage.width > canvasWidth){
					layerCtx.canvas.width = loadImage.width;
				}
				if(loadImage.height > canvasHeight){
					layerCtx.canvas.height = loadImage.height;
				}
				
				if(loadImage.width < canvasWidth){
					layerCtx.canvas.width = canvasWidth;
				}
				
				if(loadImage.height < canvasHeight){
					layerCtx.canvas.height = canvasHeight;
				}
				
				layerCtx.drawImage(loadImage, 0, 0);
				
				// go to next edit
				checkNextEdit();
			
			}
			loadImage.src = assetManager.get(editStack.stack[x].asset_id);			
			
		}else if(editStack.stack[x].edit == "load_image_asset"){
		
			//alert(assetManager.get(editStack.stack[x].asset_id));		
			// applyImgData = assetManager.get(editStack.stack[x].asset_id);
			
			let loadImage = new Image();
			loadImage.onload = function(){
			
				//alert("image dims: " + loadImage.width + "," + loadImage.height);
				//alert("canvas dims: " + canvasWidth + "," + canvasHeight);
							
				let layerCtx = layerStack[layerIndex].canvas.getContext('2d');
				
				/*
				if(loadImage.width > canvasWidth || loadImage.height > canvasHeight){
					// If the image is greater than the default canvasWidth and canvasHeight
					// We have to resize the layer canvas to the dimensions of the larger image
					layerCtx.canvas.width = loadImage.width;
					layerCtx.canvas.height = loadImage.height;
				}
				*/
				
				if(loadImage.width > canvasWidth){
					layerCtx.canvas.width = loadImage.width;
				}
				if(loadImage.height > canvasHeight){
					layerCtx.canvas.height = loadImage.height;
				}
				
				if(loadImage.width < canvasWidth){
					layerCtx.canvas.width = canvasWidth;
				}
				
				if(loadImage.height < canvasHeight){
					layerCtx.canvas.height = canvasHeight;
				}
				
				layerCtx.drawImage(loadImage, 0, 0);
				
				// go to next edit
				checkNextEdit();
			
			}
			loadImage.src = assetManager.get(editStack.stack[x].asset_id);			
			
		}else if(editStack.stack[x].edit == "close_select"){
		
			// get rid of any previous selections
			activeSelectionArea = undefined;
			invertSelection = false;
			selectionActive = false;
			
			// go to next edit
			checkNextEdit();
		
		}else if(editStack.stack[x].edit == "select" || editStack.stack[x].edit == "invert_select"){
		
			//alert(JSON.stringify(editStack.stack[x]));
		
			// SELECTIONS ARE NEVER UPDATED FOR TRANSLATIONS
		
			// any new selection should reset invertSelection to false
			// because this would be done in the editor. e.g. If there
			// was a previous inverted lasso on the editor and the user clicked and draw 
			// another lasso, the invert would be reset to false
			invertSelection = false;
			
			// 'invert_select' is used when we want to initialize a selection with inversion already
			// as opposed to 'invert_selection' which inverts an already active selection
			if(editStack.stack[x].edit == "invert_select"){
				invertSelection = true;
			}
		
			//alert(editStack.stack[x].edit);
			activeSelectionArea = new Object();
			
			// Change to string then pase to get object
			activeSelectionArea = JSON.parse(JSON.stringify(editStack.stack[x].selection));	
			
			//activeSelectionArea = editStack.stack[x].selection;
			
			invertSelection = activeSelectionArea.invert;
			selectionActive = true;
			
			// we set the stored offsets for drawing on the tool canvas
			mouseOffsetLeft = editStack.stack[x].offsetLeft;
			mouseOffsetTop = editStack.stack[x].offsetTop;
			//alert(JSON.stringify(editStack.stack[x].selection));
		
			// go to next edit
			checkNextEdit();
			
		}else if(editStack.stack[x].edit == "invert_selection"){
		
			invertSelection = !invertSelection;
			// console.log("invert selection: " + invertSelection);
			
			// go to next edit
			checkNextEdit();
			
		}else if(editStack.stack[x].edit == "crop"){
		
			// alert(JSON.stringify(editStack.stack[x].rect));
			
			// get the rectangle to crop with
			var rect = editStack.stack[x].rect;
			
			//console.log("engine rect:");
			//console.log(rect);
			
			cropImage(rect);
		
			/*
			let cropCanvas = document.createElement("canvas");
			cropCanvas.width = rect.width;
			cropCanvas.height = rect.height;
			let cropCtx = cropCanvas.getContext("2d");
			
			cropCtx.drawImage(layerStack[layerIndex].canvas, rect.x - cumulativeNegatives.x, rect.y - cumulativeNegatives.y, rect.width, rect.height, 0, 0, rect.width, rect.height);

			// get rid of any tranformations the crop starts a new 
			cumulativeTranslations = {x:0, y:0};
			cumulativeNegatives = {x:0, y:0};
			*/
			
			// !! Note WELL
			// For crop we treat the image as if it were negatively translated by the offset by the
			// Crop rect.x and rect.y . So we simulate as if the user had used the move tool to move the image back and up
			// in the canvas by the rect.x and rect.y value. We then resize the canvas to the crop rect width
			// and height
			
			/*
			cumulativeTranslations.x += -rect.x;
			cumulativeTranslations.y += -rect.y;
			
			// Negative offsets for image
			cumulativeNegatives.x += -rect.x;
			cumulativeNegatives.y += -rect.y;
			*/
			/*
			layerStack[layerIndex].cumulativeTranslations.x += -rect.x;
			layerStack[layerIndex].cumulativeTranslations.y += -rect.y;
			
			// Negative offsets for image
			layerStack[layerIndex].cumulativeNegatives.x += -rect.x;
			layerStack[layerIndex].cumulativeNegatives.y += -rect.y;
			*/
			

			
			// go to next edit
			checkNextEdit();
			

						
		}else if(editStack.stack[x].edit == "erase"){
		
			/*
			let eraseEditEntry = {
				edit: "erase", 
				clickX: clickX, 
				clickY: clickY, 
				clickDrag: clickDrag, 
				eraserSize: eraserSize, 
				opacity: eraserAlpha, 
				blur: eraserBlur
			};
			*/
		
			// canvas holding original image for this edit
			let erasedCanvas = layerStack[layerIndex].canvas;
			let erasedCtx = erasedCanvas.getContext("2d");
			
			erasedCtx.save();

			// 1. get the dimensions of a rectangle that holds all the strokes
			let strokeRect = getBrushstrokesBoundingRect(editStack.stack[x].clickX, editStack.stack[x].clickY, editStack.stack[x].eraserSize);				
			//alert(JSON.stringify(strokeRect));
			strokeRect.x -= layerStack[layerIndex].cumulativeNegatives.x;
			strokeRect.y -= layerStack[layerIndex].cumulativeNegatives.y;
			
			// 1. Draw the brush strokes to the strokes canvas
			let strokesCanvas = document.createElement("canvas");
			strokesCanvas.width = strokeRect.width;
			strokesCanvas.height = strokeRect.height;
			let strokesCtx = strokesCanvas.getContext("2d");
			
			//strokesCtx.strokeStyle = "rgba(255, 0, 0, 1)"; // alpha is not set here because setting alpha on brush strokes compounds on overlapping
			strokesCtx.strokeStyle = "rgba(0,255,0,1)";
			strokesCtx.lineJoin = "round";
			strokesCtx.lineCap = "round";
			strokesCtx.lineWidth = editStack.stack[x].eraserSize;
					
			if(editStack.stack[x].clickX.length == 1){
				for(let i = 0; i < editStack.stack[x].clickX.length; i++) {
					
					// Draw the eraser mask on the eraser canvas
					strokesCtx.beginPath();
					// adjust all the eraer points for crop offsets
					if(editStack.stack[x].clickDrag[i] && i){
						strokesCtx.moveTo(editStack.stack[x].clickX[i-1] - layerStack[layerIndex].cumulativeNegatives.x - strokeRect.x, editStack.stack[x].clickY[i-1] - layerStack[layerIndex].cumulativeNegatives.y - strokeRect.y);
					}else{
						strokesCtx.lineTo(editStack.stack[x].clickX[i]-1 - layerStack[layerIndex].cumulativeNegatives.x - strokeRect.x, editStack.stack[x].clickY[i] - layerStack[layerIndex].cumulativeNegatives.y - strokeRect.y);
					}
					strokesCtx.lineTo(editStack.stack[x].clickX[i] - layerStack[layerIndex].cumulativeNegatives.x - strokeRect.x, editStack.stack[x].clickY[i] - layerStack[layerIndex].cumulativeNegatives.y - strokeRect.y);
					strokesCtx.closePath();
					strokesCtx.stroke();	
					
				}
			}else{
				// Using bezier for smoother curves
				// http://perfectionkills.com/exploring-canvas-drawing-techniques/
				// https://codepen.io/kangax/pen/zofsp
				
				var p1 = {x:editStack.stack[x].clickX[0] - layerStack[layerIndex].cumulativeNegatives.x - strokeRect.x, y:editStack.stack[x].clickY[0] - layerStack[layerIndex].cumulativeNegatives.y - strokeRect.y};
				var p2 = {x:editStack.stack[x].clickX[1] - layerStack[layerIndex].cumulativeNegatives.x - strokeRect.x, y:editStack.stack[x].clickY[1] - layerStack[layerIndex].cumulativeNegatives.y - strokeRect.y};
			  
				strokesCtx.beginPath();
				strokesCtx.moveTo(p1.x, p1.y);
				//console.log(points);

				for (var i = 0, len = editStack.stack[x].clickX.length; i < len; i++) {
					// we pick the point between pi+1 & pi+2 as the
					// end point and p1 as our control point
					var midPoint = EditorUtils.midPointBtw(p1, p2);
					strokesCtx.quadraticCurveTo(p1.x, p1.y, midPoint.x, midPoint.y);
					p1 = {x:editStack.stack[x].clickX[i] - layerStack[layerIndex].cumulativeNegatives.x - strokeRect.x, y:editStack.stack[x].clickY[i] - layerStack[layerIndex].cumulativeNegatives.y - strokeRect.y};
					p2 = {x:editStack.stack[x].clickX[i+1] - layerStack[layerIndex].cumulativeNegatives.x - strokeRect.x, y:editStack.stack[x].clickY[i+1] - layerStack[layerIndex].cumulativeNegatives.y - strokeRect.y};
				}
				// Draw last line as a straight line while
				// we wait for the next point to be able to calculate
				// the bezier control point
				strokesCtx.lineTo(p1.x, p1.y);
				strokesCtx.stroke();				
			}
			
			// 2. To apply blur to eraser strokes we draw it to a blur canvas, this is done because it seems adding the blur 
			//    to the eraserCanvas above and drawing the strokes seems to dramatically slow down rendering.
			// 	  We will apply clipping to this blur canvas and also 
			//    draw it to the editor image
			
			let blurCanvas = document.createElement("canvas");
			blurCanvas.width = strokesCtx.canvas.width; 
			blurCanvas.height = strokesCtx.canvas.height; 
			let blurCtx = blurCanvas.getContext("2d");
			blurCtx.filter = "blur(" + editStack.stack[x].blur + "px)";		
			blurCtx.drawImage(strokesCanvas, 0, 0);
			blurCtx.filter = "none";	
			
			
			// 3. Perform Clipping - if there is a selection
			EditorUtils.clipSelectionRegion(blurCtx, {x: strokeRect.x + layerStack[layerIndex].cumulativeNegatives.x, y: strokeRect.y + layerStack[layerIndex].cumulativeNegatives.y});

			// 4. Apply brush opacity to the brush data which is in blur 
			let eraseImageData = blurCtx.getImageData(0, 0, blurCtx.canvas.width, blurCtx.canvas.height);  			
			for (let i = 0; i < eraseImageData.data.length; i += 4) {
				//invertImageData.data[i + 0] = eraseImageData.data[i + 0]; // R			
				//invertImageData.data[i + 1] = eraseImageData.data[i + 1]; // G			
				//invertImageData.data[i + 2] = eraseImageData.data[i + 2]; // B

				eraseImageData.data[i + 3] = parseInt(eraseImageData.data[i + 3] * editStack.stack[x].opacity);
			}
			blurCtx.putImageData(eraseImageData, 0, 0);	
			
			// 5. Set the blending mode of the brush
			erasedCtx.globalCompositeOperation = "destination-out";

			// 6. Finally - Use composite operation and use the eraser canvas to delete the erase strokes from the editor image canvas
			erasedCtx.drawImage(blurCanvas, strokeRect.x, strokeRect.y);

			erasedCtx.restore();			
			
			// go to next edit
			checkNextEdit();	
			
		}else if(editStack.stack[x].edit == "delete"){
		
			if("shape" in editStack.stack[x] && "geometry" in editStack.stack[x]){
			
				// 1. Image canvas holds the original edit image
				let deleteCanvas = layerStack[layerIndex].canvas;
				let deleteCtx = deleteCanvas.getContext("2d");					
					
				EditorUtils.clearSelectionRegion(deleteCtx,{x: layerStack[layerIndex].cumulativeNegatives.x, y: layerStack[layerIndex].cumulativeNegatives.y});
							
			}
			
			// go to next edit
			checkNextEdit();	
			
		}else if(editStack.stack[x].edit == "brush"){

			/*
			let brushEditEntry = {
				edit: "brush", 
				clickX: clickX, 
				clickY: clickY, 
				clickDrag: clickDrag,
				brushSize: brushSize,
				opacity: brushAlpha,
				blendingMode: brushBlendingMode,
				blur: brushBlur,
				foreGroundColor: foreGroundColor,
				useMask: boolean
			};				
			*/
			
			//alert(editStack.stack[x].useMask);
		
			// canvas holding original image for this edit
			
			
			// default to layer canvas
			let brushedCanvas = layerStack[layerIndex].canvas;
			/*
			//======================= IF DRAWING IN RASTER MASK =================================
			if(editStack.stack[x].useMask == 1){
				brushedCanvas = layerStack[layerIndex].raster_mask.canvas;
			}
			//==================================================================================
			*/
			if(editingLayerMask == 0){
				// brush on layer canvas
				brushedCanvas = layerStack[layerIndex].canvas;
			}else if(editingLayerMask == 1){
				// brush on raseter mask
				brushedCanvas = layerStack[layerIndex].raster_mask.canvas;
			}else if(editingLayerMask == 2){
				// brush on vector mask
				// *Nb. hoever we cannot use brush on vector mask
				
			}
			
			let brushedCtx = brushedCanvas.getContext("2d");
			
			brushedCtx.save();

			// 1. get the dimensions of a rectangle that holds all the strokes
			let strokeRect = getBrushstrokesBoundingRect(editStack.stack[x].clickX, editStack.stack[x].clickY, editStack.stack[x].brushSize);				
			//alert(JSON.stringify(strokeRect));
			strokeRect.x -= layerStack[layerIndex].cumulativeNegatives.x;
			strokeRect.y -= layerStack[layerIndex].cumulativeNegatives.y;
			
			// 1. Draw the brush strokes to the strokes canvas
			let strokesCanvas = document.createElement("canvas");
			strokesCanvas.width = strokeRect.width;
			strokesCanvas.height = strokeRect.height;
			let strokesCtx = strokesCanvas.getContext("2d");
			strokesCtx.clearRect(0, 0, strokesCanvas.width, strokesCanvas.height); // Clears the canvas
			
			//strokesCtx.strokeStyle = "rgba(255, 0, 0, 1)"; // alpha is not set here because setting alpha on brush strokes compounds on overlapping
			strokesCtx.strokeStyle = "rgba(" + editStack.stack[x].foreGroundColor.r + ", " + editStack.stack[x].foreGroundColor.g + ", " + editStack.stack[x].foreGroundColor.b + ", 1)"; // alpha is not set here because setting alpha on brush strokes compounds on overlapping
			strokesCtx.lineJoin = "round";
			strokesCtx.lineCap = "round";
			strokesCtx.lineWidth = editStack.stack[x].brushSize;
					
			if(editStack.stack[x].clickX.length == 1){
				for(let i = 0; i < editStack.stack[x].clickX.length; i++) {
					
					// Draw the eraser mask on the eraser canvas
					strokesCtx.beginPath();
					// adjust all the eraer points for crop offsets
					if(editStack.stack[x].clickDrag[i] && i){
						strokesCtx.moveTo(editStack.stack[x].clickX[i-1] - layerStack[layerIndex].cumulativeNegatives.x - strokeRect.x, editStack.stack[x].clickY[i-1] - layerStack[layerIndex].cumulativeNegatives.y - strokeRect.y);
					}else{
						strokesCtx.lineTo(editStack.stack[x].clickX[i]-1 - layerStack[layerIndex].cumulativeNegatives.x - strokeRect.x, editStack.stack[x].clickY[i] - layerStack[layerIndex].cumulativeNegatives.y - strokeRect.y);
					}
					strokesCtx.lineTo(editStack.stack[x].clickX[i] - layerStack[layerIndex].cumulativeNegatives.x - strokeRect.x, editStack.stack[x].clickY[i] - layerStack[layerIndex].cumulativeNegatives.y - strokeRect.y);
					strokesCtx.closePath();
					strokesCtx.stroke();	
					
				}
			}else{
				// Using bezier for smoother curves
				// http://perfectionkills.com/exploring-canvas-drawing-techniques/
				// https://codepen.io/kangax/pen/zofsp
				
				var p1 = {x:editStack.stack[x].clickX[0] - layerStack[layerIndex].cumulativeNegatives.x - strokeRect.x, y:editStack.stack[x].clickY[0] - layerStack[layerIndex].cumulativeNegatives.y - strokeRect.y};
				var p2 = {x:editStack.stack[x].clickX[1] - layerStack[layerIndex].cumulativeNegatives.x - strokeRect.x, y:editStack.stack[x].clickY[1] - layerStack[layerIndex].cumulativeNegatives.y - strokeRect.y};
			  
				strokesCtx.beginPath();
				strokesCtx.moveTo(p1.x, p1.y);
				//console.log(points);

				for (var i = 0, len = editStack.stack[x].clickX.length; i < len; i++) {
					// we pick the point between pi+1 & pi+2 as the
					// end point and p1 as our control point
					var midPoint = EditorUtils.midPointBtw(p1, p2);
					strokesCtx.quadraticCurveTo(p1.x, p1.y, midPoint.x, midPoint.y);
					p1 = {x:editStack.stack[x].clickX[i] - layerStack[layerIndex].cumulativeNegatives.x - strokeRect.x, y:editStack.stack[x].clickY[i] - layerStack[layerIndex].cumulativeNegatives.y - strokeRect.y};
					p2 = {x:editStack.stack[x].clickX[i+1] - layerStack[layerIndex].cumulativeNegatives.x - strokeRect.x, y:editStack.stack[x].clickY[i+1] - layerStack[layerIndex].cumulativeNegatives.y - strokeRect.y};
				}
				// Draw last line as a straight line while
				// we wait for the next point to be able to calculate
				// the bezier control point
				strokesCtx.lineTo(p1.x, p1.y);
				strokesCtx.stroke();				
			}
			
			
			// 2. To apply blur to eraser strokes we draw it to a blur canvas, this is done because it seems adding the blur 
			//    to the eraserCanvas above and drawing the strokes seems to dramatically slow down rendering.
			// 	  We will apply clipping to this blur canvas and also 
			//    draw it to the editor image
			
			let blurCanvas = document.createElement("canvas");
			blurCanvas.width = strokesCtx.canvas.width; 
			blurCanvas.height = strokesCtx.canvas.height; 
			let blurCtx = blurCanvas.getContext("2d");
			blurCtx.filter = "blur(" + editStack.stack[x].blur + "px)";		
			blurCtx.drawImage(strokesCanvas, 0, 0);
			blurCtx.filter = "none";	
			
			// 3. Perform Clipping - if there is a selection
			EditorUtils.clipSelectionRegion(blurCtx, {x: strokeRect.x + layerStack[layerIndex].cumulativeNegatives.x, y: strokeRect.y + layerStack[layerIndex].cumulativeNegatives.y});
			
			// 4. Apply brush opacity to the brush data which is in blur 
			let eraseImageData = blurCtx.getImageData(0, 0, blurCtx.canvas.width, blurCtx.canvas.height);  			
			for (let i = 0; i < eraseImageData.data.length; i += 4) {
				//invertImageData.data[i + 0] = eraseImageData.data[i + 0]; // R			
				//invertImageData.data[i + 1] = eraseImageData.data[i + 1]; // G			
				//invertImageData.data[i + 2] = eraseImageData.data[i + 2]; // B

				eraseImageData.data[i + 3] = parseInt(eraseImageData.data[i + 3] * editStack.stack[x].opacity);
			}
			blurCtx.putImageData(eraseImageData, 0, 0);	
			
			// document.getElementById("workingCanvasDiv").appendChild(blurCanvas);
			
			// 5. Set the blending mode of the brush
			brushedCtx.globalCompositeOperation = editStack.stack[x].blendingMode;

			// 6. 
			brushedCtx.drawImage(blurCanvas, strokeRect.x, strokeRect.y);

			brushedCtx.restore();

			//======================= IF DRAWING IN RASTER MASK =================================
			// If we drew on the raster_mask we have to update the raster_mask_opacity canvas
			if(editingLayerMask == 0){
				// layer canvas

			}else if(editingLayerMask == 1){
				// raster mask
				// Create opacity mask from the raster mask so it can be used in composite operations
				var opacityRasterMask = EditorUtils.changeGrayScaleToOpacity(brushedCanvas);
				// then set opacity
				layerStack[layerIndex].raster_mask.opacity_canvas = opacityRasterMask;
			}else if(editingLayerMask == 2){
				// vector mask
				// *Nb. hoever we cannot use brush on vector mask
				
			}
			/*
			if(editStack.stack[x].useMask){
				// Create opacity mask from the raster mask so it can be used in composite operations
				var opacityRasterMask = EditorUtils.changeGrayScaleToOpacity(brushedCanvas);
				// then set opacity
				layerStack[layerIndex].raster_mask_opacity = opacityRasterMask;
			}	
			*/
			//===================================================================================
			
			// go to next edit
			checkNextEdit();		
			
		}else if(editStack.stack[x].edit == "blur"){
		
			// alert(JSON.stringify(editStack.stack[x]));
		
			// 1. Image canvas holds the original edit image
			let imageCanvas = layerStack[layerIndex].canvas;
			let imageCtx = imageCanvas.getContext("2d");			
		
			imageCtx.save();
		
			// 2. blurred canvas will hold the blurred image
			let blurredCanvas = document.createElement("canvas");
			blurredCanvas.width = imageCanvas.width; 
			blurredCanvas.height = imageCanvas.height; 
			let blurCtx = blurredCanvas.getContext("2d");
			blurCtx.filter = "blur(" + editStack.stack[x].radius + "px)";		
			blurCtx.drawImage(imageCanvas, 0, 0);
			//blurCtx.filter = "none";
			
			// 3. Perform Clipping - if there is a selection
			EditorUtils.clipSelectionRegion(blurCtx, {x: layerStack[layerIndex].cumulativeNegatives.x, y: layerStack[layerIndex].cumulativeNegatives.y});
			
			// draw the blur canvas to the image canvas
			imageCtx.drawImage(blurredCanvas, 0, 0);

			imageCtx.restore();			
			
			// go to next edit
			checkNextEdit();						
				
				
		}else if(editStack.stack[x].edit == "brightness"){
			
			// 1. Image canvas holds the original edit image
			let imageCanvas = layerStack[layerIndex].canvas;
			let imageCtx = imageCanvas.getContext("2d");	
			
			imageCtx.save();
		
			// 2. Holds the brightened image
			let brightenedCanvas = document.createElement("canvas");
			brightenedCanvas.width = imageCanvas.width; 
			brightenedCanvas.height = imageCanvas.height; 
			let brightenedCtx = brightenedCanvas.getContext("2d");
			brightenedCtx.filter = "brightness(" + editStack.stack[x].value + "%)";		
			brightenedCtx.drawImage(imageCanvas, 0, 0);
			brightenedCtx.filter = "none";
			
			// 3. Perform Clipping - if there is a selection
			EditorUtils.clipSelectionRegion(brightenedCtx, {x: layerStack[layerIndex].cumulativeNegatives.x, y: layerStack[layerIndex].cumulativeNegatives.y});

			// draw the blur canvas to the image canvas
			imageCtx.drawImage(brightenedCanvas, 0, 0);	

			imageCtx.restore();				
			
			// go to next edit
			checkNextEdit();						
			
			
		}else if(editStack.stack[x].edit == "contrast"){
		
		
			// 1. Image canvas holds the original edit image
			let imageCanvas = layerStack[layerIndex].canvas;
			let imageCtx = imageCanvas.getContext("2d");	

			imageCtx.save();			
		
			// 2. Holds the contrasted image
			let contrastedCanvas = document.createElement("canvas");
			contrastedCanvas.width = imageCanvas.width; 
			contrastedCanvas.height = imageCanvas.height; 
			let contrastedCtx = contrastedCanvas.getContext("2d");
			contrastedCtx.filter = "contrast(" + editStack.stack[x].value + "%)";		
			contrastedCtx.drawImage(imageCanvas, 0, 0);
			contrastedCtx.filter = "none";
			
			// 3. Perform Clipping - if there is a selection
			EditorUtils.clipSelectionRegion(contrastedCtx, {x: layerStack[layerIndex].cumulativeNegatives.x, y: layerStack[layerIndex].cumulativeNegatives.y});

			// draw the blur canvas to the image canvas
			imageCtx.drawImage(contrastedCanvas, 0, 0);	

			imageCtx.restore();				
			
			// go to next edit
			checkNextEdit();					
			
			
		}else if(editStack.stack[x].edit == "grayscale"){
			
			// 1. Image canvas holds the original edit image
			let imageCanvas = layerStack[layerIndex].canvas;
			let imageCtx = imageCanvas.getContext("2d");

			imageCtx.save();			
		
			// 2. Holds the grayscaled image
			let grayscaledCanvas = document.createElement("canvas");
			grayscaledCanvas.width = imageCanvas.width; 
			grayscaledCanvas.height = imageCanvas.height; 
			let grayscaledCtx = grayscaledCanvas.getContext("2d");
			grayscaledCtx.filter = "grayscale(" + editStack.stack[x].value + "%)";		
			grayscaledCtx.drawImage(imageCanvas, 0, 0);
			grayscaledCtx.filter = "none";

			// 3. Perform Clipping - if there is a selection
			EditorUtils.clipSelectionRegion(grayscaledCtx, {x: layerStack[layerIndex].cumulativeNegatives.x, y: layerStack[layerIndex].cumulativeNegatives.y});

			// draw the blur canvas to the image canvas
			imageCtx.drawImage(grayscaledCanvas, 0, 0);	

			imageCtx.restore();				
			
			// go to next edit
			checkNextEdit();					
			
		}else if(editStack.stack[x].edit == "hue"){
		
			// Adjust image hue

			// 1. Image canvas holds the original edit image
			let imageCanvas = layerStack[layerIndex].canvas;
			let imageCtx = imageCanvas.getContext("2d");	
			
			imageCtx.save();

			// 2. Holds the hued image				
			let huedCanvas = document.createElement("canvas");
			huedCanvas.width = imageCanvas.width; 
			huedCanvas.height = imageCanvas.height; 
			let huedCtx = huedCanvas.getContext("2d");
			huedCtx.filter = "hue-rotate(" + editStack.stack[x].value + "deg)";		
			huedCtx.drawImage(imageCanvas, 0, 0);
			huedCtx.filter = "none";

			// 3. Perform Clipping - if there is a selection
			EditorUtils.clipSelectionRegion(huedCtx, {x: layerStack[layerIndex].cumulativeNegatives.x, y: layerStack[layerIndex].cumulativeNegatives.y});

			// draw the blur canvas to the image canvas
			imageCtx.drawImage(huedCanvas, 0, 0);	
			
			imageCtx.restore();	

			// go to next edit
			checkNextEdit();			

			
		}else if(editStack.stack[x].edit == "invert"){
		
			// Invert image colors
			
			// 1. Image canvas holds the original edit image
			let imageCanvas = layerStack[layerIndex].canvas;
			let imageCtx = imageCanvas.getContext("2d");

			imageCtx.save();			
		
			// 2. Holds the inverted image	
			let invertedCanvas = document.createElement("canvas");
			invertedCanvas.width = imageCanvas.width; 
			invertedCanvas.height = imageCanvas.height; 
			let invertedCtx = invertedCanvas.getContext("2d");
			invertedCtx.filter = "invert(" + editStack.stack[x].value + "%)";		
			invertedCtx.drawImage(imageCanvas, 0, 0);
			invertedCtx.filter = "none";

			// 3. Perform Clipping - if there is a selection
			EditorUtils.clipSelectionRegion(invertedCtx, {x: layerStack[layerIndex].cumulativeNegatives.x, y: layerStack[layerIndex].cumulativeNegatives.y});

			// draw the blur canvas to the image canvas
			imageCtx.drawImage(invertedCanvas, 0, 0);

			imageCtx.restore();				
			
			// go to next edit
			checkNextEdit();	
			
		}else if(editStack.stack[x].edit == "opacity"){
		
			// alert(editStack.stack[x].value);
		
			// Apply opacity to image
			
			// ** NOTICE**
			// Opacity works different from the other filter operations
			
			// 1. imageCanvas is the blank canvas to which the opacity edited image 
			//    will be drawn
			let imageCanvas = document.createElement("canvas");
			imageCanvas.width = layerStack[layerIndex].canvas.width; 
			imageCanvas.height = layerStack[layerIndex].canvas.height; 
			let imageCtx = imageCanvas.getContext("2d");

			imageCtx.save();				
			
			if(typeof activeSelectionArea === "undefined"){
				
				// NO SELECTION REGION
				
				// Filter the entire image with the opacity
				imageCtx.filter = "opacity(" + editStack.stack[x].value + "%)";	
				imageCtx.drawImage(layerStack[layerIndex].canvas, 0, 0);	
				imageCtx.filter = "none";

				// draw the newly opaque image to the layer canvas
				let layerCtx = layerStack[layerIndex].canvas.getContext("2d");
				layerCtx.clearRect(0,0, layerStack[layerIndex].canvas.width, layerStack[layerIndex].canvas.height);
				layerCtx.drawImage(imageCanvas, 0, 0);
				
			}else{
			
				// SELECTION REGION
				
				// For Opacity with selected regions:
				// 1.	We draw the original image on the editor canvas
				// 2. 	We then clear the selection region on the editor canvas so that nothing is behind
				//		where the new opacity part of the image will be. If we didn't clip out the selected region Then the 
				//		newly opaqued image will just be drawn over the original image and there will be no
				//		visible change.
				// 3.	Create the filtered canvas and clip to the selection region
				// 4.	Draw the filtered canvas to the editor canvas
				
				// 1. We draw the original image on the editor canvas
				imageCtx.drawImage(layerStack[layerIndex].canvas, 0, 0);	
				
				// 2. We then clear the selection region on the editor canvas so that nothing is behind
				//	  where the new opacity part of the image will be
				EditorUtils.clearSelectionRegion(imageCtx);
				
				
				// 3. Create the new opacity canvas and clip to the selection region
				let filteredCanvas = document.createElement("canvas");
				filteredCanvas.width = layerStack[layerIndex].canvas.width; 
				filteredCanvas.height = layerStack[layerIndex].canvas.height; 
				let filteredCtx = filteredCanvas.getContext("2d");
				filteredCtx.filter = "opacity(" + editStack.stack[x].value + "%)";		
				filteredCtx.drawImage(layerStack[layerIndex].canvas, 0, 0);
				filteredCtx.filter = "none";

				// 3 contd. Perform Clipping - if there is a selection
				EditorUtils.clipSelectionRegion(filteredCtx);

				// draw the blur canvas to the image canvas
				imageCtx.drawImage(filteredCanvas, 0, 0);	
			

				// draw the newly opaque image to the layer canvas
				let layerCtx = layerStack[layerIndex].canvas.getContext("2d");
				layerCtx.clearRect(0,0, layerStack[layerIndex].canvas.width, layerStack[layerIndex].canvas.height);
				layerCtx.drawImage(imageCanvas, 0, 0);
				
			}
			
			imageCtx.restore();	
			
			// go to next edit
			checkNextEdit();						
			
			
		}else if(editStack.stack[x].edit == "saturate"){
		
			// Adjust image saturation
			
			// 1. Image canvas holds the original edit image
			let imageCanvas = layerStack[layerIndex].canvas;
			let imageCtx = imageCanvas.getContext("2d");	
			
			imageCtx.save();	
			
			// 2. Holds the saturated image	
			let saturatedCanvas = document.createElement("canvas");
			saturatedCanvas.width = imageCanvas.width; 
			saturatedCanvas.height = imageCanvas.height; 
			let saturatedCtx = saturatedCanvas.getContext("2d");
			saturatedCtx.filter = "saturate(" + editStack.stack[x].value + "%)";		
			saturatedCtx.drawImage(imageCanvas, 0, 0);
			saturatedCtx.filter = "none";

			// 3. Perform Clipping - if there is a selection
			EditorUtils.clipSelectionRegion(saturatedCtx, {x: layerStack[layerIndex].cumulativeNegatives.x, y: layerStack[layerIndex].cumulativeNegatives.y});

			// draw the blur canvas to the image canvas
			imageCtx.drawImage(saturatedCanvas, 0, 0);	

			imageCtx.restore();				
			
			// go to next edit
			checkNextEdit();					
			
		}else if(editStack.stack[x].edit == "sepia"){
		
		
			// 1. Image canvas holds the original edit image
			let imageCanvas = layerStack[layerIndex].canvas;
			let imageCtx = imageCanvas.getContext("2d");

			imageCtx.save();				
		
			// // 2. Holds the sepia image	
			let sepiaCanvas = document.createElement("canvas");
			sepiaCanvas.width = imageCanvas.width; 
			sepiaCanvas.height = imageCanvas.height; 
			let sepiaCtx = sepiaCanvas.getContext("2d");
			sepiaCtx.filter = "sepia(" + editStack.stack[x].value + "%)";		
			sepiaCtx.drawImage(imageCanvas, 0, 0);
			sepiaCtx.filter = "none";

			// 3. Perform Clipping - if there is a selection
			EditorUtils.clipSelectionRegion(sepiaCtx, {x: layerStack[layerIndex].cumulativeNegatives.x, y: layerStack[layerIndex].cumulativeNegatives.y});

			// draw the blur canvas to the image canvas
			imageCtx.drawImage(sepiaCanvas, 0, 0);	

			imageCtx.restore();				
			
			// go to next edit
			checkNextEdit();					
			
		}else if(editStack.stack[x].edit == "background_erase"){
					
			// alert(JSON.stringify(activeSelectionArea));
			//alert(editStack.stack[x].sample_type);
			//alert(editStack.stack[x].background_color);
			
			// clipping canvas that is used to determine selected region pixels
			let clippingCanvas = document.createElement("canvas");
			clippingCanvas.width = layerStack[layerIndex].canvas.width; 
			clippingCanvas.height = layerStack[layerIndex].canvas.height; 
			let clippingCtx = clippingCanvas.getContext("2d");
			
			let hasSelection = false;

			// draw the selected region
			if(typeof activeSelectionArea === "undefined"){
			
			}else{
				// drawSelectionClipping
				//drawSelectionClipping(clippingCtx, invertSelection, "green");
				EditorUtils.drawSelectionClipping(clippingCtx, invertSelection,"green",activeSelectionArea, false);
				hasSelection = true;
			}
		
			let bkgndErasedCanvas = document.createElement("canvas");
			bkgndErasedCanvas.width = layerStack[layerIndex].canvas.width; 
			bkgndErasedCanvas.height = layerStack[layerIndex].canvas.height; 
			let bkgndErasedCtx = bkgndErasedCanvas.getContext("2d");
			bkgndErasedCtx.drawImage(layerStack[layerIndex].canvas, 0, 0);

			let sampledCanvas = document.createElement("canvas");
			sampledCanvas.width = layerStack[layerIndex].canvas.width; 
			sampledCanvas.height = layerStack[layerIndex].canvas.height; 
			let sampledCtx = sampledCanvas.getContext("2d");
			sampledCtx.drawImage(layerStack[layerIndex].canvas, 0, 0);
			
			//let eraseEditEntry = {edit: "background_erase", clickX: clickX, clickY: clickY, clickDrag: clickDrag, eraserSize: eraserSize, opacity: eraserAlpha, blur: eraserBlur, tolerance: eraserTolerance};

			let sampled_RGB_HSV = undefined;
			
			for(let i = 0; i < editStack.stack[x].clickX.length; i++) {
			
				// 1. Get the click point centred square that defines the eraser area
				let eraserRect = {width: editStack.stack[x].eraserSize, height: editStack.stack[x].eraserSize};
				eraserRect.centerX = editStack.stack[x].clickX[i] - layerStack[layerIndex].cumulativeNegatives.x;
				eraserRect.centerY = editStack.stack[x].clickY[i] - layerStack[layerIndex].cumulativeNegatives.y;
				eraserRect.left = eraserRect.centerX - parseInt(eraserRect.width/2);
				eraserRect.top = eraserRect.centerY - parseInt(eraserRect.height/2);	

				// 2. Get the image data of the eraser square from the image
				let eraseImageData = bkgndErasedCtx.getImageData(eraserRect.left, eraserRect.top, eraserRect.width, eraserRect.height);
				// Get the sample data from the backup image stored in the eraser canvas, this is done because we want to keep
				// the original pixels and they will be erased in the working canvas
				let sampleImageData = sampledCtx.getImageData(eraserRect.left, eraserRect.top, eraserRect.width, eraserRect.height);
				
				// get the data from the selection clipping data
				let selectionAreaData = clippingCtx.getImageData(eraserRect.left, eraserRect.top, eraserRect.width, eraserRect.height);
				
				//let sampled_RGB_HSV = {};
				
				let isErased = false;
				
				//let testImageData = editorCtx.getImageData(eraserRect.width, eraserRect.height);
				
				// If we are using background color 
				if(editStack.stack[x].sample_type == 2){

					// SET THE SAMPLE COLOR FROM BACKGROUND COLOR
					if (typeof sampled_RGB_HSV == 'undefined'){

						sampled_RGB_HSV = EditorUtils.hexToRgb(editStack.stack[x].background_color);	
						let hsv = EditorUtils.rgb2hsv(sampled_RGB_HSV.r, sampled_RGB_HSV.g, sampled_RGB_HSV.b);
						sampled_RGB_HSV.h = hsv.h;				
						sampled_RGB_HSV.s = hsv.s;				
						sampled_RGB_HSV.v = hsv.v;							
						
					}
				
				}else{
				
					// Get the sample color data from the point that is the center of eraser rect
					let pixel_x = 0, pixel_y = 0;
					for (let j = 0; j < sampleImageData.data.length; j += 4) {
					
						pixel_x++;
						
						// get the color values of the pixel at center
						if(pixel_x == parseInt(eraserRect.width/2) && pixel_y == parseInt(eraserRect.height/2)){
						
							let a = sampleImageData.data[j + 3];
							if(a == 0){
								isErased = true;
							}	
		

							// SET THE SAMPLE COLOR
							if (typeof sampled_RGB_HSV == 'undefined'){
							
								// case i. SAMPLE COLOR NOT SET
								
								sampled_RGB_HSV = new Object();
							
								//infoLbl.innerText = "(r: " + sampleImageData.data[j + 0] + ", g:" + sampleImageData.data[j + 1] + ", b:" + sampleImageData.data[j + 2] + ")";			
								sampled_RGB_HSV.r = sampleImageData.data[j + 0];
								sampled_RGB_HSV.g = sampleImageData.data[j + 1];
								sampled_RGB_HSV.b = sampleImageData.data[j + 2];
										
								let hsv = EditorUtils.rgb2hsv(sampled_RGB_HSV.r, sampled_RGB_HSV.g, sampled_RGB_HSV.b);
								sampled_RGB_HSV.h = hsv.h;				
								sampled_RGB_HSV.s = hsv.s;				
								sampled_RGB_HSV.v = hsv.v;	
								//infoLbl.innerText = JSON.stringify(sampled_RGB_HSV);	
								//console.log("sample set");
							}else{
							
								// case ii. SAMPLE COLOR ALREADY SET
							
								// If sampling is not continuous we do not change the sampled_RGB_HSV 
								if(editStack.stack[x].sample_type == 0){
									// Continuous sampling
									// update the sampled color with the center pixel
									sampled_RGB_HSV.r = sampleImageData.data[j + 0];
									sampled_RGB_HSV.g = sampleImageData.data[j + 1];
									sampled_RGB_HSV.b = sampleImageData.data[j + 2];
											
									let hsv = EditorUtils.rgb2hsv(sampled_RGB_HSV.r, sampled_RGB_HSV.g, sampled_RGB_HSV.b);
									sampled_RGB_HSV.h = hsv.h;				
									sampled_RGB_HSV.s = hsv.s;				
									sampled_RGB_HSV.v = hsv.v;	
								}else{
									// Don't update we are using only the initial sample
									/*
									sampled_RGB_HSV.r = sampleImageData.data[j + 0];
									sampled_RGB_HSV.g = sampleImageData.data[j + 1];
									sampled_RGB_HSV.b = sampleImageData.data[j + 2];
											
									let hsv = EditorUtils.rgb2hsv(sampled_RGB_HSV.r, sampled_RGB_HSV.g, sampled_RGB_HSV.b);
									sampled_RGB_HSV.h = hsv.h;				
									sampled_RGB_HSV.s = hsv.s;				
									sampled_RGB_HSV.v = hsv.v;
									*/
								}
								
							}
							
							
						}
						
						/*
						// Below draws a red cross centered at center of eraserRect
						if(pixel_x == parseInt(eraserRect.width/2) || pixel_y == parseInt(eraserRect.height/2)){
							sampleImageData.data[j + 0] = 255;
							sampleImageData.data[j + 1] = 0;
							sampleImageData.data[j + 2] = 0;
							sampleImageData.data[j + 3] = 255;				
						}
						*/
						
						/*
						// Below draws a red point at center of eraserRect
						if(pixel_x == parseInt(eraserRect.width/2) && pixel_y == parseInt(eraserRect.height/2)){
							sampleImageData.data[j + 0] = 255;
							sampleImageData.data[j + 1] = 0;
							sampleImageData.data[j + 2] = 0;
							sampleImageData.data[j + 3] = 255;				
						}
						*/
						
						
						if(pixel_x >= eraserRect.width){
							pixel_x = 0;
							pixel_y++;
						}
						
					}
				}
				
				// 4. Then loop through the pixels defined by the eraser square to determine 
				// 	  if the pixel is within the threshhold of the clicked hsv 
				if(!isErased){
				
					for (let j = 0; j < sampleImageData.data.length; j += 4) {
					
						// If a selection is active check if the current point is in the selection region
						// This means if the alpha in clippingCanvas at the point is zero 
						// then the region was not selected
						if(hasSelection && selectionAreaData.data[j + 3] == 0){
							continue;
						}
					
						//eraseImageData.data[j + 3] = 0;
						let r = sampleImageData.data[j + 0];
						let g = sampleImageData.data[j + 1];
						let b = sampleImageData.data[j + 2];
						let a = sampleImageData.data[j + 3];
						
						let hsv = rgb2hsv(r,g,b);
						
						let rgbDiff = ColorDiff({R: sampled_RGB_HSV.r, G: sampled_RGB_HSV.g, B: sampled_RGB_HSV.b}, 
										{R:r, G:g, B:b}); 
										
						if(rgbDiff < parseInt((editStack.stack[x].tolerance*255)/100)){
							eraseImageData.data[j + 3] = 0;
						}
						
					}				
				}

				bkgndErasedCtx.putImageData(eraseImageData, eraserRect.left, eraserRect.top);	

			}	

			// draw the newly opaque image to the layer canvas
			let layerCtx = layerStack[layerIndex].canvas.getContext("2d");
			layerCtx.clearRect(0,0, layerStack[layerIndex].canvas.width, layerStack[layerIndex].canvas.height);
			layerCtx.drawImage(bkgndErasedCanvas, 0, 0);			
			
			// go to next edit
			checkNextEdit();		
			
		}else if(editStack.stack[x].edit == "trim_image"){
		
			/*
			*Nb. Trim uses the current layer and its transparency to crop the image 
			*/
		
			//alert(JSON.stringify(EditorUtils.getBoundingRectFromCanvas(layerStack[layerIndex].canvas)));
			
			// get the trim rect
			var trimRect = EditorUtils.getBoundingRectFromCanvas(layerStack[layerIndex].canvas);
			
			cropImage(trimRect, {x: layerStack[layerIndex].cumulativeNegatives.x, y: layerStack[layerIndex].cumulativeNegatives.y});
				
			// go to next edit
			checkNextEdit();				
				
		}else if(editStack.stack[x].edit == "crop_to_selection"){
		
			// Crop the Image to the selection
			//alert("crop to selection");
			
			//console.log(JSON.stringify(activeSelectionArea));
			
			var selectionCanvas = document.createElement("canvas");
			selectionCanvas.width = layerStack[layerIndex].canvas.width;
			selectionCanvas.height = layerStack[layerIndex].canvas.height;
			var selectionCtx = selectionCanvas.getContext("2d");
			
			// 1. Remember drawSelectionClipping draws the selection to a canvas
			//with the cumulativeNegatives
			//drawSelectionClipping(selectionCtx, invertSelection, "green");
			EditorUtils.drawSelectionClipping(selectionCtx, invertSelection,"green",activeSelectionArea, false);
			
			// get the trim rect
			var trimRect = EditorUtils.getBoundingRectFromCanvas(selectionCanvas);	
			
			//alert(JSON.stringify(trimRect));
			
			//alert(JSON.stringify(trimRect));
			cropImage(trimRect, {x: layerStack[layerIndex].cumulativeNegatives.x, y: layerStack[layerIndex].cumulativeNegatives.y});
		
			// go to next edit
			checkNextEdit();
		
		}else if(editStack.stack[x].edit == "flip_image"){
				
			// Flip an image
			if(editStack.stack[x].direction == "horizontal"){

				globalTransformObject.flip_scaleX = -1*globalTransformObject.flip_scaleX;
				
				// store the edit index in the chain of tranforms to perform
				var transformObject = {
					flip_scaleX: -1,
					flip_scaleY: 1,
					rotate: 0,				
				};
				globalTransformObject.transformChain.push(transformObject);	
				
			}else if(editStack.stack[x].direction == "vertical"){
			
				globalTransformObject.flip_scaleY = -1*globalTransformObject.flip_scaleY;
				
				// store the edit index in the chain of tranforms to perform
				var transformObject = {
					flip_scaleX: 1,
					flip_scaleY: -1,
					rotate: 0,				
				};
				globalTransformObject.transformChain.push(transformObject);	
			}
						
			// go to next edit
			checkNextEdit();					
			
		}else if(editStack.stack[x].edit == "rotate_image"){
			
			// Rotate image
			
			// store the edit index in the chain of tranforms to perform
			var transformObject = {
				flip_scaleX: 1,
				flip_scaleY: 1,
				rotate: editStack.stack[x].angle,				
			};
			globalTransformObject.transformChain.push(transformObject);	
			
			//console.log(JSON.stringify(editStack.stack[x]));
			
			globalTransformObject.rotate += parseInt(editStack.stack[x].angle);
			
			//console.log(editStack.stack[x].angle);
			/*
			if(editStack.stack[x].direction == "clockwise"){
				globalTransformObject.rotate += parseInt(editStack.stack[x].angle);			
			}else{
				globalTransformObject.rotate -= parseInt(editStack.stack[x].angle);	
			}
			*/
			
			//globalTransformStr += " rotate(" + editStack.stack[x].angle + "deg)";
			

			// go to next edit
			checkNextEdit();						
			
					
		}else if(editStack.stack[x].edit == "duotone"){
		
			// alert("duotone");
			
			// 1. Image canvas holds the original edit image
			let imageCanvas = layerStack[layerIndex].canvas;
			let imageCtx = imageCanvas.getContext("2d");
			imageCtx.save();			
		
			// 2. Duotoned canvas hold the duotoned image
			let duotonedCanvas = document.createElement("canvas");
			duotonedCanvas.width = imageCanvas.width; 
			duotonedCanvas.height = imageCanvas.height; 
			let duotonedCtx = duotonedCanvas.getContext("2d");
			
			// get a graysxale of the original image
			duotonedCtx.filter = "grayscale(100%)";	
			duotonedCtx.drawImage(imageCanvas, 0, 0);
			duotonedCtx.filter = "none";
			
			// create a canvas to hold the duotone gradient it must be a width of 255
			// pixels to match the full range of grayscale from black to white
			let gradientCanvas = document.createElement("canvas");
			gradientCanvas.width = 256;
			gradientCanvas.height = 1;
			let gradientCtx = gradientCanvas.getContext("2d"); 
			
			// Create gradient
			let grd = gradientCtx.createLinearGradient(0, 0, 200, 0);
			grd.addColorStop(0, editStack.stack[x].foregroundColor);
			grd.addColorStop(1, editStack.stack[x].backgroundColor);

			// Fill with gradient canvas with the gradient
			gradientCtx.fillStyle = grd;
			gradientCtx.fillRect(0, 0, gradientCanvas.width, gradientCanvas.height);	

			// get the gradient image data
			let gradientImageData = gradientCtx.getImageData(0, 0, gradientCtx.canvas.width, gradientCtx.canvas.height); 
			let gradientColorArray = [];
			let cntr = 0;
			for(let i = 0; i < gradientImageData.data.length; i += 4) {
				gradientColorArray[cntr] = {r: gradientImageData.data[i + 0], g: gradientImageData.data[i + 1], b: gradientImageData.data[i + 2]};
				cntr++;
			}	

			// iterate through the pixels of the grayscaled image and replace the grayscale level with the pixel color
			// at the gradientImageData index to dutone the pixels
			let duotonedImageData = duotonedCtx.getImageData(0, 0, duotonedCtx.canvas.width, duotonedCtx.canvas.height);  			
			for (let i = 0; i < duotonedImageData.data.length; i += 4) {
				
				let grayscaleLevel = duotonedImageData.data[i + 2];
				//console.log(grayscaleLevel);
				
				/*
				duotonedImageData.data[i + 0] = gradientImageData[grayscaleLevel*4];
				duotonedImageData.data[i + 1] = gradientImageData[grayscaleLevel*4];
				duotonedImageData.data[i + 2] = gradientImageData[grayscaleLevel*2];
				*/			
				
				duotonedImageData.data[i + 0] = gradientColorArray[grayscaleLevel].r;
				duotonedImageData.data[i + 1] = gradientColorArray[grayscaleLevel].g;
				duotonedImageData.data[i + 2] = gradientColorArray[grayscaleLevel].b;

			}
			duotonedCtx.putImageData(duotonedImageData, 0, 0);
			
			// clip the duotoned canvas if there is a selection
			EditorUtils.clipSelectionRegion(duotonedCtx, {x: layerStack[layerIndex].cumulativeNegatives.x, y: layerStack[layerIndex].cumulativeNegatives.y});

			// draw the duotoned image to the editor image
			imageCtx.drawImage(duotonedCanvas, 0, 0);
			imageCtx.restore();
			
			// go to next edit
			checkNextEdit();	

			
		}else if(editStack.stack[x].edit == "gradient"){
		
			/*
				Gradient object stored in editStack.stack[x]
				
				var gradientEditEntry = {
					edit: "gradient", 
					type: "linear", 
					blend_mode: "normal", 
					geometry: gradientLine, 
					color_stops: [{color: startColorInput.value, stop: 0}, {color: endColorInput.value, stop: 1}], 
				};					
			*/

			//alert(JSON.stringify(editStack.stack[x]));
			//console.log(JSON.stringify(editStack.stack[x]));
			//alert(editStack.stack[x].useMask);
		
			// 1. Image canvas defaults to the original edit image
			let imageCanvas = layerStack[layerIndex].canvas;
			/*
			//======================= IF DRAWING IN RASTER MASK =================================
			if(editStack.stack[x].useMask == 1){
				brushedCanvas = layerStack[layerIndex].raster_mask.canvas;
			}
			//==================================================================================
			*/			
			//alert(editingLayerMask);
			
			if(editingLayerMask == 0){
				// brush on layer canvas
				imageCanvas = layerStack[layerIndex].canvas;
			}else if(editingLayerMask == 1){
				// brush on raseter mask
				imageCanvas = layerStack[layerIndex].raster_mask.canvas;
			}else if(editingLayerMask == 2){
				// brush on vector mask
				// *Nb. hoever we cannot use brush on vector mask
				
			}
			
			let imageCtx = imageCanvas.getContext("2d");

			imageCtx.save();			
		
			// 2. Gradient canvas hold the gradient image
			let gradientCanvas = document.createElement("canvas");
			gradientCanvas.id = "gradientCanvas";
			gradientCanvas.width = imageCanvas.width;
			gradientCanvas.height = imageCanvas.height;
			let gradientCtx = gradientCanvas.getContext("2d");
			
			// alert(JSON.stringify(editStack.stack[x]["geometry"]));
			
			var gradientGeometry = new Object();
			gradientGeometry.x1 = editStack.stack[x]["geometry"].x1;
			gradientGeometry.y1 = editStack.stack[x]["geometry"].y1;
			gradientGeometry.x2 = editStack.stack[x]["geometry"].x2;
			gradientGeometry.y2 = editStack.stack[x]["geometry"].y2;
						
			// Default create a linear gradient
			//let grd = gradientCtx.createLinearGradient(editStack.stack[x]["geometry"].x1 - layerStack[layerIndex].cumulativeNegatives.x, editStack.stack[x]["geometry"].y1 - layerStack[layerIndex].cumulativeNegatives.y, editStack.stack[x]["geometry"].x2 - layerStack[layerIndex].cumulativeNegatives.x, editStack.stack[x]["geometry"].y2 - layerStack[layerIndex].cumulativeNegatives.y);
			var grd = gradientCtx.createLinearGradient(gradientGeometry.x1 - layerStack[layerIndex].cumulativeNegatives.x, gradientGeometry.y1 - layerStack[layerIndex].cumulativeNegatives.y, gradientGeometry.x2 - layerStack[layerIndex].cumulativeNegatives.x, gradientGeometry.y2 - layerStack[layerIndex].cumulativeNegatives.y);
			
			if(editStack.stack[x]["type"] == "linear"){
			
				//alert("linear");
				//grd = gradientCtx.createLinearGradient(editStack.stack[x]["geometry"].x1 - layerStack[layerIndex].cumulativeNegatives.x, editStack.stack[x]["geometry"].y1 - layerStack[layerIndex].cumulativeNegatives.y, editStack.stack[x]["geometry"].x2 - layerStack[layerIndex].cumulativeNegatives.x, editStack.stack[x]["geometry"].y2 - layerStack[layerIndex].cumulativeNegatives.y);
				grd = gradientCtx.createLinearGradient(gradientGeometry.x1 - layerStack[layerIndex].cumulativeNegatives.x, gradientGeometry.y1 - layerStack[layerIndex].cumulativeNegatives.y, gradientGeometry.x2 - layerStack[layerIndex].cumulativeNegatives.x, gradientGeometry.y2 - layerStack[layerIndex].cumulativeNegatives.y);
				
			}else if(editStack.stack[x]["type"] == "radial"){
			
				// create a radial gradient
				//alert("radial");
				grd = gradientCtx.createRadialGradient(gradientGeometry.x1, gradientGeometry.y1, 0, gradientGeometry.x1, gradientGeometry.y1, EditorUtils.calcHypotenuse(gradientGeometry.x2 - gradientGeometry.x1, gradientGeometry.y2 - gradientGeometry.y1));				
			}
			
			// Loop throug and add color stops
			for(let j = 0; j < editStack.stack[x].color_stops.length; j++){
				// alert(editStack.stack[x].color_stops[j].color + "," + editStack.stack[x].color_stops[j].stop);
				// grd.addColorStop(0, "black");
				grd.addColorStop(editStack.stack[x].color_stops[j].stop, editStack.stack[x].color_stops[j].color);
			}
			gradientCtx.fillStyle = grd;
			gradientCtx.fillRect(0, 0, gradientCanvas.width, gradientCanvas.height);
			
			
			EditorUtils.clipSelectionRegion(gradientCtx, {x: layerStack[layerIndex].cumulativeNegatives.x, y: layerStack[layerIndex].cumulativeNegatives.y});
			
			// draw the gradient image to the editor image
			imageCtx.globalCompositeOperation = editStack.stack[x].blend_mode;
			imageCtx.globalAlpha = editStack.stack[x].opacity;
			imageCtx.drawImage(gradientCanvas, 0, 0);
			
			imageCtx.restore();
			
			//======================= IF DRAWING IN RASTER MASK =================================
			// If we drew on the raster_mask we have to update the raster_mask_opacity canvas
			if(editingLayerMask == 0){
				// layer canvas

			}else if(editingLayerMask == 1){
				// raster mask
				// Create opacity mask from the raster mask so it can be used in composite operations
				var opacityRasterMask = EditorUtils.changeGrayScaleToOpacity(imageCanvas);
				// then set opacity
				layerStack[layerIndex].raster_mask.opacity_canvas = opacityRasterMask;
			}else if(editingLayerMask == 2){
				// vector mask
				// *Nb. hoever we cannot use brush on vector mask
				
			}
			/*
			if(editStack.stack[x].useMask){
				// Create opacity mask from the raster mask so it can be used in composite operations
				var opacityRasterMask = EditorUtils.changeGrayScaleToOpacity(brushedCanvas);
				// then set opacity
				layerStack[layerIndex].raster_mask_opacity = opacityRasterMask;
			}	
			*/
			//===================================================================================
			
			// go to next edit
			checkNextEdit();			

			
		}else if(editStack.stack[x].edit == "blur_tool"){
		
			//alert("blur tool");
		
			// alert(JSON.stringify(editStack.stack[x]));

			
			/*
				let blurToolEditEntry = {
					edit: "blur_tool", 
					clickX: clickX, 
					clickY: clickY, 
					clickDrag: clickDrag,
					brushSize: brushSize,
					opacity: brushAlpha,
					blur: brushBlur
				};					
			*/
		
			// 1. Image canvas holds the original edit image
			let imageCanvas = layerStack[layerIndex].canvas;
			/*
			//======================= IF DRAWING IN RASTER MASK =================================
			if(editStack.stack[x].useMask == 1){
				brushedCanvas = layerStack[layerIndex].raster_mask.canvas;
			}
			//==================================================================================
			*/
			if(editingLayerMask == 0){
				// brush on layer canvas
				imageCanvas = layerStack[layerIndex].canvas;
			}else if(editingLayerMask == 1){
				// brush on raseter mask
				imageCanvas = layerStack[layerIndex].raster_mask.canvas;
			}else if(editingLayerMask == 2){
				// brush on vector mask
				// *Nb. hoever we cannot use brush on vector mask
				
			}			
			
			let imageCtx = imageCanvas.getContext("2d");
			
			imageCtx.save();
			
			// 2. Draw the brush strokes to the strokes canvas
			let strokesCanvas = document.createElement("canvas");
			strokesCanvas.width = imageCanvas.width;
			strokesCanvas.height = imageCanvas.height;
			let strokesCtx = strokesCanvas.getContext("2d");
			
			strokesCtx.strokeStyle = "red"; // alpha is not set here because setting alpha on brush strokes compounds on overlapping
			strokesCtx.lineJoin = "round";
			strokesCtx.lineWidth = editStack.stack[x].brushSize;
					
			for(let i = 0; i < editStack.stack[x].clickX.length; i++) {
				
				// Draw the eraser mask on the eraser canvas
				strokesCtx.beginPath();
				// adjust all the eraer points for crop offsets
				if(editStack.stack[x].clickDrag[i] && i){
					strokesCtx.moveTo(editStack.stack[x].clickX[i-1] - layerStack[layerIndex].cumulativeNegatives.x, editStack.stack[x].clickY[i-1] - layerStack[layerIndex].cumulativeNegatives.y);
				}else{
					strokesCtx.moveTo(editStack.stack[x].clickX[i]-1 - layerStack[layerIndex].cumulativeNegatives.x, editStack.stack[x].clickY[i] - layerStack[layerIndex].cumulativeNegatives.y);
				}
				strokesCtx.lineTo(editStack.stack[x].clickX[i] - layerStack[layerIndex].cumulativeNegatives.x, editStack.stack[x].clickY[i] - layerStack[layerIndex].cumulativeNegatives.y);
				strokesCtx.closePath();
				strokesCtx.stroke();	
				
			}	
			
			//EditorUtils.testViewCanvas(strokesCanvas);
			
			// 2. get the blur strokes of the image first draw the image to a blur canvas 
			var blurStrokesCanvas = document.createElement("canvas");
			blurStrokesCanvas.width = imageCanvas.width;
			blurStrokesCanvas.height = imageCanvas.height;
			var blurStrokesCtx = blurStrokesCanvas.getContext("2d");
			
			//blurStrokesCtx.fillStyle = "blue";
			//blurStrokesCtx.fillRect(0,0,blurStrokesCanvas.width,blurStrokesCanvas.height);

			
			blurStrokesCtx.filter = "blur(1px)";
			blurStrokesCtx.drawImage(imageCanvas, 0, 0);
			blurStrokesCtx.filter = "none";
			
			
			// perform composite operation to erase everything in the image but the strokes
			// thereby retaining the parts of the image that are the strokes
			blurStrokesCtx.globalCompositeOperation = 'destination-in';
			blurStrokesCtx.drawImage(strokesCanvas, 0, 0);	

			// clip the blur brush region
			EditorUtils.clipSelectionRegion(blurStrokesCtx, {x: layerStack[layerIndex].cumulativeNegatives.x, y: layerStack[layerIndex].cumulativeNegatives.y});				


			//======================= IF DRAWING IN RASTER MASK =================================
			// If we drew on the raster_mask we have to update the raster_mask_opacity canvas
			if(editingLayerMask == 0){
				// layer canvas

				// draw the sharpened strokes to the image
				imageCtx.drawImage(blurStrokesCanvas, 0, 0);				
				

			}else if(editingLayerMask == 1){
				// raster mask
				// Create opacity mask from the raster mask so it can be used in composite operations
				var opacityRasterMask = EditorUtils.changeGrayScaleToOpacity(imageCanvas);
				// then set opacity
				layerStack[layerIndex].raster_mask.opacity_canvas = opacityRasterMask;
			}else if(editingLayerMask == 2){
				// vector mask
				// *Nb. hoever we cannot use brush on vector mask
				
			}
			/*
			if(editStack.stack[x].useMask){
				// Create opacity mask from the raster mask so it can be used in composite operations
				var opacityRasterMask = EditorUtils.changeGrayScaleToOpacity(brushedCanvas);
				// then set opacity
				layerStack[layerIndex].raster_mask_opacity = opacityRasterMask;
			}	
			*/
			//===================================================================================	

			imageCtx.restore();			
			
			// go to next edit
			checkNextEdit();		
					

		}else if(editStack.stack[x].edit == "sharpen_tool"){
		
			//alert(JSON.stringify(editStack.stack[x]));
			
			// 1. Image canvas holds the original edit image
			let imageCanvas = layerStack[layerIndex].canvas;
			let imageCtx = imageCanvas.getContext("2d");
			
			
			// 2. Draw the brush strokes to the strokes canvas
			let strokesCanvas = document.createElement("canvas");
			strokesCanvas.width = layerStack[layerIndex].canvas.width;
			strokesCanvas.height = layerStack[layerIndex].canvas.height;
			let strokesCtx = strokesCanvas.getContext("2d");
			
			strokesCtx.strokeStyle = "red"; // alpha is not set here because setting alpha on brush strokes compounds on overlapping
			strokesCtx.lineJoin = "round";
			strokesCtx.lineWidth = editStack.stack[x].brushSize;
					
			for(let i = 0; i < editStack.stack[x].clickX.length; i++) {
				
				// Draw the eraser mask on the eraser canvas
				strokesCtx.beginPath();
				// adjust all the eraer points for crop offsets
				if(editStack.stack[x].clickDrag[i] && i){
					strokesCtx.moveTo(editStack.stack[x].clickX[i-1] - layerStack[layerIndex].cumulativeNegatives.x, editStack.stack[x].clickY[i-1] - layerStack[layerIndex].cumulativeNegatives.y);
				}else{
					strokesCtx.moveTo(editStack.stack[x].clickX[i]-1 - layerStack[layerIndex].cumulativeNegatives.x, editStack.stack[x].clickY[i] - layerStack[layerIndex].cumulativeNegatives.y);
				}
				strokesCtx.lineTo(editStack.stack[x].clickX[i] - layerStack[layerIndex].cumulativeNegatives.x, editStack.stack[x].clickY[i] - layerStack[layerIndex].cumulativeNegatives.y);
				strokesCtx.closePath();
				strokesCtx.stroke();	
				
			}				

			// 3. get the sharpen strokes of the image first draw the image to a sharpen canvas 
			var sharpenStrokesCanvas = document.createElement("canvas");
			sharpenStrokesCanvas.width = layerStack[layerIndex].canvas.width;
			sharpenStrokesCanvas.height = layerStack[layerIndex].canvas.height;
			var sharpenStrokesCtx = sharpenStrokesCanvas.getContext("2d");

			sharpenStrokesCtx.drawImage(layerStack[layerIndex].canvas, 0, 0);
			
			// 4. sharpen the strokes image
			let sharpenImageData = filterImageData(sharpenStrokesCtx.getImageData(0, 0, sharpenStrokesCtx.canvas.width, sharpenStrokesCtx.canvas.height), 
			[  0, -1,  0,
			-1,  5, -1,
			0, -1,  0 ],
			0);	
			sharpenStrokesCtx.putImageData(sharpenImageData, 0, 0);
			
			// perform composite operation to erase everything in the image but the strokes
			// thereby retaining the parts of the image that are the strokes
			//sharpenStrokesCtx.drawImage(sharpenStrokesCanvas, 0, 0);
			sharpenStrokesCtx.globalCompositeOperation = 'destination-in';
			sharpenStrokesCtx.drawImage(strokesCanvas, 0, 0);	

			// clip the sharpen brush strokes if any active selection area
			EditorUtils.clipSelectionRegion(sharpenStrokesCtx, {x: layerStack[layerIndex].cumulativeNegatives.x, y: layerStack[layerIndex].cumulativeNegatives.y});					

			// draw the sharpened strokes to the image
			imageCtx.drawImage(sharpenStrokesCanvas, 0, 0);			
		
			// go to next edit
			checkNextEdit();							
			
		}else if(editStack.stack[x].edit == "clone_stamp"){
			// alert("clone_stamp");
			
			//console.log(JSON.stringify(editStack.stack[x]));

			// 1. Image canvas holds the original edit image
			let imageCanvas = layerStack[layerIndex].canvas;
			let imageCtx = imageCanvas.getContext("2d");
			
			imageCtx.save();

			// 2. Draw the brush strokes to the strokes canvas
			let strokesCanvas = document.createElement("canvas");
			strokesCanvas.width = imageCanvas.width;
			strokesCanvas.height = imageCanvas.height;
			let strokesCtx = strokesCanvas.getContext("2d");
			
			strokesCtx.strokeStyle = "red"; // alpha is not set here because setting alpha on brush strokes compounds on overlapping
			strokesCtx.lineJoin = "round";
			strokesCtx.lineWidth = editStack.stack[x].brushSize;
					
			for(let i = 0; i < editStack.stack[x].clickX.length; i++) {
				
				// Draw the eraser mask on the eraser canvas
				strokesCtx.beginPath();
				// adjust all the eraer points for crop offsets
				if(editStack.stack[x].clickDrag[i] && i){
					strokesCtx.moveTo(editStack.stack[x].clickX[i-1] - layerStack[layerIndex].cumulativeNegatives.x, editStack.stack[x].clickY[i-1] - layerStack[layerIndex].cumulativeNegatives.y);
				}else{
					strokesCtx.moveTo(editStack.stack[x].clickX[i]-1 - layerStack[layerIndex].cumulativeNegatives.x, editStack.stack[x].clickY[i] - layerStack[layerIndex].cumulativeNegatives.y);
				}
				strokesCtx.lineTo(editStack.stack[x].clickX[i] - layerStack[layerIndex].cumulativeNegatives.x, editStack.stack[x].clickY[i] - layerStack[layerIndex].cumulativeNegatives.y);
				strokesCtx.closePath();
				strokesCtx.stroke();	
				
			}	
			
			// 4. To apply blur to eraser strokes we draw it to a blur canvas
			let blurCanvas = document.createElement("canvas");
			blurCanvas.width = strokesCtx.canvas.width; 
			blurCanvas.height = strokesCtx.canvas.height; 
			let blurCtx = blurCanvas.getContext("2d");
			blurCtx.clearRect(0,0,blurCanvas.width,blurCanvas.height);
			blurCtx.filter = "blur(" + editStack.stack[x].blur + "px) opacity(" + editStack.stack[x].opacity + ")";		
			blurCtx.drawImage(strokesCanvas, 0, 0);
			blurCtx.filter = "none";	

			// 2. get the sharpen strokes of the image first draw the image to a sharpen canvas 
			var cloneStampCanvas = document.createElement("canvas");
			cloneStampCanvas.width = imageCanvas.width;
			cloneStampCanvas.height = imageCanvas.height;
			var cloneStampStrokesCtx = cloneStampCanvas.getContext("2d");
			cloneStampStrokesCtx.drawImage(imageCanvas, editStack.stack[x].clone_points.copy_x - editStack.stack[x].clone_points.x, editStack.stack[x].clone_points.copy_y - editStack.stack[x].clone_points.y);	

			// perform composite operation to erase everything in the image but the strokes
			// thereby retaining the parts of the image that are the strokes
			cloneStampStrokesCtx.globalCompositeOperation = 'destination-in';
			cloneStampStrokesCtx.drawImage(blurCanvas, editStack.stack[x].clone_points.copy_x - editStack.stack[x].clone_points.x, editStack.stack[x].clone_points.copy_y - editStack.stack[x].clone_points.y);		
			//cloneStampStrokesCtx.drawImage(blurStrokeCanvas, 0, 0);	
			
			// if there is an active selection clip the clone stamp brush strokes
			EditorUtils.clipSelectionRegion(cloneStampStrokesCtx, {x: layerStack[layerIndex].cumulativeNegatives.x, y: layerStack[layerIndex].cumulativeNegatives.y});
			
			// draw the sharpened strokes to the image
			imageCtx.globalCompositeOperation = editStack.stack[x].blendingMode;
			imageCtx.drawImage(cloneStampCanvas, 0, 0);	
			
			imageCtx.restore();
			
			/*
			// draw the newly opaque image to the layer canvas
			let layerCtx = layerStack[layerIndex].canvas.getContext("2d");
			layerCtx.clearRect(0,0, layerStack[layerIndex].canvas.width, layerStack[layerIndex].canvas.height);
			layerCtx.drawImage(imageCanvas, 0, 0);		
			*/			
			
			// go to next edit
			checkNextEdit();					

		
		}else if(editStack.stack[x].edit == "translate_layer_selection"){
		
			// Move the selected region in a layer
			
			//alert(JSON.stringify(editStack.stack[x]));
			/*
				{
					"edit":"translate_layer_selection",
					"edit_label":"Move",
					"geometry":{"x":-129,"y":-97},"layer":0
				}
			*/
			
			
			var tempLayer = layerStack[layerIndex];
			
			// 1. Create an image capture of the selection region
			var selectionImgCanvas = document.createElement("canvas");
			selectionImgCanvas.width = tempLayer.canvas.width;
			selectionImgCanvas.height = tempLayer.canvas.height;
			var selectionImgCtx = selectionImgCanvas.getContext("2d");
			selectionImgCtx.drawImage(tempLayer.canvas, 0, 0);
			EditorUtils.clipSelectionRegion(selectionImgCtx, {x: tempLayer.cumulativeNegatives.x, y: tempLayer.cumulativeNegatives.y});
			
			// 2. Get the templayer drawing object
			var tempLayerCtx = tempLayer.canvas.getContext("2d");
			
			// refresh the templayer with the saved layer image
			//tempLayerCtx.clearRect(0,0,tempLayer.canvas.width, templayer.canvas.height);
			//tempLayerCtx.drawImage(savedCurrentLayerCanvas,0,0);	

			// 3. clear the region in the layer that is bounded by the selection
			EditorUtils.clearSelectionRegion(tempLayer.canvas.getContext("2d"),{x: tempLayer.cumulativeNegatives.x, y: tempLayer.cumulativeNegatives.y});
			
			// 4. draw the moved selection on the layer
			tempLayerCtx.save();
			//tempLayerCtx.translate(70, 70);
			tempLayerCtx.translate(editStack.stack[x].geometry.x, editStack.stack[x].geometry.y);
			tempLayerCtx.drawImage(selectionImgCanvas,0,0);
			tempLayerCtx.restore();	

			//Move The Active Selection Also
			EditorUtils.moveActiveSelection(activeSelectionArea, editStack.stack[x].geometry.x, editStack.stack[x].geometry.y);			
			
			// go to next edit
			checkNextEdit();	
		
			
		}else if(editStack.stack[x].edit == "translate_image"){
		
			// editingLayerMask = 0; // determines whether edit applies to layer canvas (0), raster mask (1), or vector mask (2)
			
			if(editingLayerMask == 0){
			
				// 1. MOVE THE LAYER - (RASTER MASK IF LINKED) 
				
				layerStack[layerIndex].cumulativeTranslations.x += editStack.stack[x].geometry.x;
				layerStack[layerIndex].cumulativeTranslations.y += editStack.stack[x].geometry.y;
				
				// Negative offsets for image
				// cumulativeNegatives keeps the cumulative sum of all negative translations
				if(editStack.stack[x].geometry.x < 0){
					layerStack[layerIndex].cumulativeNegatives.x += editStack.stack[x].geometry.x;
				}
				if(editStack.stack[x].geometry.y < 0){
					layerStack[layerIndex].cumulativeNegatives.y += editStack.stack[x].geometry.y;
				}
				
				var translatedCanvas = EditorUtils.getTranslatedImageCanvas(layerStack[layerIndex].canvas, editStack.stack[x].geometry.x, editStack.stack[x].geometry.y);
				
				// draw the newly resized translated image to the layer canvas
				var layerCtx = layerStack[layerIndex].canvas.getContext("2d");
				layerCtx.canvas.width = translatedCanvas.width; // resize layer canvas
				layerCtx.canvas.height = translatedCanvas.height; // resize layer canvas
				layerCtx.clearRect(0,0, layerCtx.canvas.width, layerCtx.canvas.height);
				layerCtx.drawImage(translatedCanvas, 0, 0);	
				
				// If we have a raster_mask in the layer and it is linked we move it too
				if('raster_mask' in layerStack[layerIndex] && layerStack[layerIndex].raster_mask.raster_mask_linked){
				
					//console.log(layerStack[layerIndex].raster_mask.raster_mask_linked);

					// TRANSLATE THE RASTER MASK
					//var translatedRasterMask = EditorUtils.getTranslatedImageCanvas(layerStack[layerIndex].raster_mask.canvas, editStack.stack[x].geometry.x, editStack.stack[x].geometry.y);
					EditorUtils.translateLayerRasterMask(layerStack[layerIndex].raster_mask, editStack.stack[x].geometry.x, editStack.stack[x].geometry.y);

				
				}			
				
	 		}else if(editingLayerMask == 1){
				// 2. MOVE THE RASTER MASK (MOVE LAYER CANVAS IF LINKED)
				
				if('raster_mask' in layerStack[layerIndex]){
				
					//console.log(layerStack[layerIndex].raster_mask.raster_mask_linked);

					// TRANSLATE THE RASTER MASK
					//var translatedRasterMask = EditorUtils.getTranslatedImageCanvas(layerStack[layerIndex].raster_mask.canvas, editStack.stack[x].geometry.x, editStack.stack[x].geometry.y);
					EditorUtils.translateLayerRasterMask(layerStack[layerIndex].raster_mask, editStack.stack[x].geometry.x, editStack.stack[x].geometry.y);
				}
				
				// If the layer mask is linked move it
				if(layerStack[layerIndex].raster_mask.raster_mask_linked){		
				
					layerStack[layerIndex].cumulativeTranslations.x += editStack.stack[x].geometry.x;
					layerStack[layerIndex].cumulativeTranslations.y += editStack.stack[x].geometry.y;
					
					// Negative offsets for image
					// cumulativeNegatives keeps the cumulative sum of all negative translations
					if(editStack.stack[x].geometry.x < 0){
						layerStack[layerIndex].cumulativeNegatives.x += editStack.stack[x].geometry.x;
					}
					if(editStack.stack[x].geometry.y < 0){
						layerStack[layerIndex].cumulativeNegatives.y += editStack.stack[x].geometry.y;
					}
					
					var translatedCanvas = EditorUtils.getTranslatedImageCanvas(layerStack[layerIndex].canvas, editStack.stack[x].geometry.x, editStack.stack[x].geometry.y);
					
					// draw the newly resized translated image to the layer canvas
					var layerCtx = layerStack[layerIndex].canvas.getContext("2d");
					layerCtx.canvas.width = translatedCanvas.width; // resize layer canvas
					layerCtx.canvas.height = translatedCanvas.height; // resize layer canvas
					layerCtx.clearRect(0,0, layerCtx.canvas.width, layerCtx.canvas.height);
					layerCtx.drawImage(translatedCanvas, 0, 0);	
					
				}

				
	 		}else if(editingLayerMask == 2){
				// 3. move the vector mask alone
				
				
			}
			
			// go to next edit
			checkNextEdit();	
					
		}else if(editStack.stack[x].edit == "translate_object"){
		
			// TRANSLATE OR MOVE IN LAYER OBJECTS SUCH AS
			// TEXT, VECTORS ETC.
			
			
			// editingLayerMask = 0; // determines whether edit applies to layer canvas (0), raster mask (1), or vector mask (2)
			
			if(editingLayerMask == 0){
				// 1. MOVE OBJECT - (RASTER MASK IF LINKED) 
				
				if(editStack.stack[x].type == "text_object"){
					layerStack[layerIndex].object.textbox.x = editStack.stack[x].textbox_position.x;
					layerStack[layerIndex].object.textbox.y = editStack.stack[x].textbox_position.y;			
				}
				
					
				// If we have a raster_mask in the layer and it is linked we move it too
				if('raster_mask' in layerStack[layerIndex] && layerStack[layerIndex].raster_mask.raster_mask_linked){
				
					//console.log(layerStack[layerIndex].raster_mask.raster_mask_linked);

					// TRANSLATE THE RASTER MASK
					//var translatedRasterMask = EditorUtils.getTranslatedImageCanvas(layerStack[layerIndex].raster_mask.canvas, editStack.stack[x].geometry.x, editStack.stack[x].geometry.y);
					EditorUtils.translateLayerRasterMask(layerStack[layerIndex].raster_mask, editStack.stack[x].geometry.x, editStack.stack[x].geometry.y);

				}	
			
			}else if(editingLayerMask == 1){
			
				// 2. MOVE THE RASTER MASK (MOVE LAYER CANVAS IF LINKED)
				
				if('raster_mask' in layerStack[layerIndex]){
				
					//console.log(layerStack[layerIndex].raster_mask.raster_mask_linked);

					// TRANSLATE THE RASTER MASK
					//var translatedRasterMask = EditorUtils.getTranslatedImageCanvas(layerStack[layerIndex].raster_mask.canvas, editStack.stack[x].geometry.x, editStack.stack[x].geometry.y);
					EditorUtils.translateLayerRasterMask(layerStack[layerIndex].raster_mask, editStack.stack[x].geometry.x, editStack.stack[x].geometry.y);
					
				}
				
				// If the layer mask is linked move the object
				if(layerStack[layerIndex].raster_mask.raster_mask_linked){		

					if(editStack.stack[x].type == "text_object"){
						layerStack[layerIndex].object.textbox.x = editStack.stack[x].textbox_position.x;
						layerStack[layerIndex].object.textbox.y = editStack.stack[x].textbox_position.y;			
					}				
										
				}
			
			}else if(editingLayerMask == 2){
			
			}			
		
			// go to next edit
			checkNextEdit();	
			
		}else if(editStack.stack[x].edit == "add_text_layer"){
		
			editingLayerMask = 0; // new layer set editing to the layer canvas
		
			//alert("add_text_layer");
		
			// Creates a new text layer above the current layer index and switches 
			// To that layer.
		
			/*
				==================================
				For Reference - How the text edit object is structured
				==================================
				let textEditEntry = {
					edit: "add_text_layer", 
					edit_label: "Text Layer",
					string: editTextInput.value,
					char_styles: textCharStyles,
					textbox: squareSelectionRect
				};			
			*/
			//alert(JSON.stringify(editStack.stack[x]));
			
			//alert(JSON.stringify(editStack.stack[x].transform));

			// 1. create the new layer
			let addedlayer = new Object();
			addedlayer.canvas = document.createElement("canvas");
			addedlayer.canvas.width = canvasWidth;
			addedlayer.canvas.height = canvasHeight;	
			addedlayer.cumulativeTranslations = {x:0, y:0};
			addedlayer.cumulativeNegatives = {x:0, y:0};
			addedlayer.visible = true;
			
			// 2. we add a layer name using the text
			addedlayer.name = editStack.stack[x].string;
			
			var textObject = new Object;
			textObject.type = "text_object";
			textObject.string = editStack.stack[x].string;
			textObject.char_styles = JSON.parse(editStack.stack[x].char_styles);
			
			var textBoxRect = new Object();
			textBoxRect.x = editStack.stack[x].textbox.x;
			textBoxRect.y = editStack.stack[x].textbox.y;
			textBoxRect.width = editStack.stack[x].textbox.width;
			textBoxRect.height = editStack.stack[x].textbox.height;	
			
			textObject.textbox = textBoxRect;
			if('transform' in editStack.stack[x]){
				textObject.transform = editStack.stack[x].transform;
			}
			
			// alert(JSON.stringify(editStack.stack[x].textbox));
			
			// 3. *Nb we add an object to the layer so we can edit it if in type-tool 
			// Note an object layer cannot be edited until its rasterized
			addedlayer.object = textObject;		
			
			// 4. Insert the new text layer into the stack
			layerIndex++;
			layerStack.splice(layerIndex,0, addedlayer);		
		
			// go to next edit
			checkNextEdit();
		
		}else if(editStack.stack[x].edit == "update_text_layer"){
		
			// Updates text in a text layer
			
			//alert("update text layer");
			//alert(JSON.stringify(layerStack[layerIndex].object.textbox));
			// layerStack[layerIndex].object = editStack.stack[x].updated_text_object;
			// layerStack[layerIndex].name = editStack.stack[x].updated_text_object.string;	
			
			var textObject = new Object;
			textObject.type = "text_object";
			textObject.string = editStack.stack[x].updated_text_object.string;
			textObject.char_styles = JSON.parse(editStack.stack[x].updated_text_object.char_styles);
			
			var textBoxRect = new Object();
			textBoxRect.x = editStack.stack[x].updated_text_object.textbox.x;
			textBoxRect.y = editStack.stack[x].updated_text_object.textbox.y;
			textBoxRect.width = editStack.stack[x].updated_text_object.textbox.width;
			textBoxRect.height = editStack.stack[x].updated_text_object.textbox.height;	
			
			textObject.textbox = textBoxRect;
			
			if('transform' in editStack.stack[x]){
				textObject.transform = editStack.stack[x].transform;
			}
			
			layerStack[layerIndex].object = textObject;
			layerStack[layerIndex].name = textObject.string;	

			//alert(JSON.stringify(editStack.stack[x].updated_text_object.textbox));			
			
			// go to next edit
			checkNextEdit();
			
		}else if(editStack.stack[x].edit == "rasterize_layer"){
		
			/*=====================================================
			Rasterizes a Layer
			=======================================================*/
		
			//alert("Rasterize layer: " + editStack.stack[x].layer_index);
		
			// Create a new 'rasterized Layer' canva
			
			/*
			rasterizedLayerCtx.save();
			rasterizedLayerCtx.fillStyle = "red";
			rasterizedLayerCtx.fillRect(0,0,rasterizedLayerCtx.canvas.width,rasterizedLayerCtx.canvas.height);
			rasterizedLayerCtx.restore();
			*/
			
			// Replace the layer canvas with the new rasterized object canvas
			//layerStack[editStack.stack[x].layer_index].canvas = rasterizedLayerCanvas;
			layerStack[layerIndex].canvas = rasterizeLayer(layerStack[layerIndex]);
			
			// If we have a raster mask apply to the now rasterized canvas
			if('raster_mask' in layerStack[layerIndex]){
				applyRasterMask(layerStack[layerIndex].canvas, layerStack[layerIndex].raster_mask.opacity_canvas);			
			}
			
			// delete the object from the layer transforming it from an object layer
			//delete layerStack[editStack.stack[x].layer_index].object;
			if('object' in layerStack[layerIndex]){
				delete layerStack[layerIndex].object;
			}
			
			// delete raster_mask from the canvas
			if('raster_mask' in layerStack[layerIndex]){
				delete layerStack[layerIndex].raster_mask;
			}
				
			// go to next edit
			checkNextEdit();
			
		}else if(editStack.stack[x].edit == "add_raster_mask"){
		
			editingLayerMask = 1;
		
			var rasterMaskObject = new Object();
			
			//alert(editStack.stack[x].use_selection);
			
			//alert(editStack.stack[x].fill + "," + editStack.stack[x].use_selection);
		
			//alert("add raster mask to layer " + editStack.stack[x].layer_index);
			// 1. Create a canvas for the raster_mask drawing
			var layerMaskCanvas = document.createElement("canvas");
			layerMaskCanvas.width = layerStack[editStack.stack[x].layer_index].canvas.width;
			layerMaskCanvas.height = layerStack[editStack.stack[x].layer_index].canvas.height;	
			var layerMaskCtx = layerMaskCanvas.getContext("2d");
			
			layerMaskCtx.save();
			
			layerMaskCtx.fillStyle = editStack.stack[x].fill;
			layerMaskCtx.fillRect(0, 0, layerMaskCtx.canvas.width, layerMaskCtx.canvas.height);	
			// TESTING: Draw a test black square to test the raster mask
			//layerMaskCtx.fillStyle = "rgb(20,20,20)";
			//layerMaskCtx.fillRect(layerMaskCtx.canvas.width/2, 0, layerMaskCtx.canvas.width/2, layerMaskCtx.canvas.height);				
			//layerMaskCtx.fillRect(100, 100, 300, 300);

			// If there is a selection we have to apply the selection in the mask by making everything outside the selection black
			if(editStack.stack[x].use_selection && activeSelectionArea){
				var selectCanvas = document.createElement("canvas");
				selectCanvas.width = layerMaskCanvas.width;
				selectCanvas.height = layerMaskCanvas.height;
				var selectCtx = selectCanvas.getContext("2d");
				//drawSelectionClipping(selectCtx, !invertSelection, "black");
				//EditorUtils.drawSelectionClipping(selectCtx, !invertSelection,"black",activeSelectionArea, false);
				EditorUtils.drawSelectionClipping(selectCtx, invertSelection,"white",activeSelectionArea, false);
				layerMaskCtx.drawImage(selectCanvas, 0, 0);
				
				// Get Rid of the active selection
				activeSelectionArea = undefined;
				invertSelection = false;
				selectionActive = false;
			}
			
			layerMaskCtx.restore();
			
			
			// 2. This is the canvas that holds the actual Raster Mask with opacity values to 
			// perform the composite operation
			// Create opacity mask from the raster mask so it can be used in composite operations
			var opacityRasterMask = EditorUtils.changeGrayScaleToOpacity(layerMaskCanvas);
			
			// add the mask canvas to the raster mask object
			rasterMaskObject.canvas = layerMaskCanvas;
			rasterMaskObject.raster_mask_linked = true;
			rasterMaskObject.opacity_canvas = opacityRasterMask;
			rasterMaskObject.cumulativeTranslations = {x:0, y:0};
			rasterMaskObject.cumulativeNegatives = {x:0, y:0};
			rasterMaskObject.enabled = true;
			rasterMaskObject.fill = editStack.stack[x].fill;
			
			layerStack[editStack.stack[x].layer_index].raster_mask = rasterMaskObject;		

			// go to next edit
			checkNextEdit();
				
		}else if(editStack.stack[x].edit == "delete_raster_mask"){

			delete layerStack[editStack.stack[x].layer_index].raster_mask;

			// go to next edit
			checkNextEdit();
		
		}else if(editStack.stack[x].edit == "enable_raster_mask"){

			layerStack[layerIndex].raster_mask.enabled = true;

			// go to next edit
			checkNextEdit();
		
		}else if(editStack.stack[x].edit == "disable_raster_mask"){

			layerStack[layerIndex].raster_mask.enabled = false;

			// go to next edit
			checkNextEdit();
		
		}else if(editStack.stack[x].edit == "apply_raster_mask"){

			//alert("apply raster mask");
			
			// Applies the raster mask to the layer canvas with composite operations then gets rid 
			// of the raster mask
			
			applyRasterMask(layerStack[layerIndex].canvas, layerStack[layerIndex].raster_mask.opacity_canvas);
			
			delete layerStack[editStack.stack[x].layer_index].raster_mask;

			// go to next edit
			checkNextEdit();
		
		}else if(editStack.stack[x].edit == "unlink_raster_mask"){
		
			// alert("Unlink Raster Mask");
			//layerStack[layerIndex].raster_mask.raster_mask_linked = false;
			layerStack[editStack.stack[x].layer_index].raster_mask.raster_mask_linked = false;
		
			// go to next edit
			checkNextEdit();			
		
		}else if(editStack.stack[x].edit == "link_raster_mask"){
		
			// alert("Unlink Raster Mask");
			//layerStack[layerIndex].raster_mask.raster_mask_linked = true;
			layerStack[editStack.stack[x].layer_index].raster_mask.raster_mask_linked = true;
		
			// go to next edit
			checkNextEdit();			
		
		}else if(editStack.stack[x].edit == "set_canvas_size"){
			//alert(JSON.stringify(editStack.stack[x]));
			
			canvasWidth = editStack.stack[x].width;
			canvasHeight = editStack.stack[x].height;
			
			// go to next edit
			checkNextEdit();
		}		
		
		function cropImage(rect, offset = {x:0, y: 0}){
		
			// Update any active selection to account for the crop
			if(activeSelectionArea){
				EditorUtils.moveActiveSelection(activeSelectionArea, -rect.x - layerStack[layerIndex].cumulativeNegatives.x, -rect.y - layerStack[layerIndex].cumulativeNegatives.y);
			}	
			/*
			// reset all selections
			activeSelectionArea = undefined;
			invertSelection = false;
			selectionActive = false;
			*/			
		
			// All layers must be negatively translated for crop
			// i.e we move all layers back and up using the position of the crop rect
			for(let k = 0; k < layerStack.length; k++){
			
				if(!('object' in layerStack[k])){
				
					// Regular rasterized layer
				
					layerStack[k].cumulativeTranslations.x += -rect.x - offset.x;
					layerStack[k].cumulativeTranslations.y += -rect.y - offset.y;
					
					// Negative offsets for image
					layerStack[k].cumulativeNegatives.x += -rect.x - offset.x;
					layerStack[k].cumulativeNegatives.y += -rect.y - offset.y;		
					
				}else{
				
					// have to crop the object layer
					//alert("have to crop object layer");
					
					if(layerStack[k].object.type == "text_object"){
						//alert("move textbox object");
						layerStack[k].object.textbox.x += -rect.x - offset.x;
						layerStack[k].object.textbox.y += -rect.y - offset.y;
					}
				}
	
			}
								
			canvasWidth = rect.width;
			canvasHeight = rect.height;		
		}
		

		
		/*
			https://stackoverflow.com/questions/17410809/how-to-calculate-rotation-in-2d-in-javascript
			-------------------
			The first two parameters are the X and Y coordinates of the central point (the origin around which the second point will be rotated). 
			The next two parameters are the coordinates of the point that we'll be rotating. The last parameter is the angle, in degrees.
		*/
		function rotatePoint(cx, cy, x, y, angle) {
			var radians = (Math.PI / 180) * angle,
			cos = Math.cos(radians),
			sin = Math.sin(radians),
			nx = (cos * (x - cx)) + (sin * (y - cy)) + cx,
			ny = (cos * (y - cy)) - (sin * (x - cx)) + cy;
			return {x:nx, y:ny};
		}
		
		function trimCanvas(canvas, top_part, left_part, bottom_part, right_part){
		
			var ctx = canvas.getContext("2d");
		
			var trimImageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
	
			var top = 0;
			var left = ctx.canvas.width;
			var bottom = 0;
			var right = 0;
			var top_set = false;
			var bottom_set = false;
		
			var pixel_x = 0, pixel_y = 0;
			
			for (var i = 0; i < trimImageData.data.length; i += 4) {
			
				// trimImageData.data[i + 3] = 255;
				
				// 1. Getting top pixel
				// the first nonzero alhpa pixel encountered is at top
				if(!top_set && trimImageData.data[i + 3] > 0){
					top = pixel_y;
					// set the flag to signal we already have the first non-zero pixel
					top_set = true;
				}
				
				// 2. Getting bottom pixel
				// just get the pixel y associated with the last pixel
				if(trimImageData.data[i + 3] > 0){
					bottom = pixel_y;
				}	

				// 3. Getting the leftmost pixel for the row
				if(trimImageData.data[i + 3] > 0){
					if(left > pixel_x){
						left = pixel_x;
					}
				}
				
				// 3. Getting the rightmost pixel for the row
				if(trimImageData.data[i + 3] > 0){
					if(right < pixel_x){
						right = pixel_x;
					}
				}
				
			
				pixel_x++;
				if(pixel_x >= ctx.canvas.width){
					//console.log(right);
					pixel_x = 0;
					pixel_y++;
				}				
			}	

			//console.log("trim:\ntop:" + top + ", left: " + left + ", bottom: " + bottom + ", right:" + right);
			
			
			if(right_part){
				//alert("trim right part");
				if(right == (ctx.canvas.width - 1)){
					//alert("no right trimming");
					return canvas;
				}else{
					//console.log("trim right");
					let retcanvas = document.createElement("canvas");
					retcanvas.width = right + 1; 
					retcanvas.height = canvas.height; 
					let retCtx = retcanvas.getContext("2d");
					retCtx.drawImage(canvas, 0, 0);
					return retcanvas;					
				}
			}
			if(bottom_part){
				//console.log("trim bottom part");
				if(bottom == (ctx.canvas.height - 1)){
					//alert("no right trimming");
					return canvas;
				}else{
					let retcanvas = document.createElement("canvas");
					retcanvas.width = canvas.width; 
					retcanvas.height = bottom + 1; 
					let retCtx = retcanvas.getContext("2d");
					retCtx.drawImage(canvas, 0, 0);		
					return retcanvas;						
				}
			}
			
		}
		
		/*
			Filters image data of a canvas
		*/
		function filterImageData(pixels, weights, opaque) {
		  var side = Math.round(Math.sqrt(weights.length));
		  var halfSide = Math.floor(side/2);
		  var src = pixels.data;
		  var sw = pixels.width;
		  var sh = pixels.height;
		  // pad output by the convolution matrix
		  var w = sw;
		  var h = sh;
		  
		  // var output = Filters.createImageData(w, h);  
		  // my code substitutes above
		  var output_canvas = document.createElement("canvas");
		  output_canvas.width = w;
		  output_canvas.height = h;
		  var output_ctx = output_canvas.getContext("2d");
		  
		  var output = output_ctx.getImageData(0, 0, w, h);
		  
		  var dst = output.data;
		  // go through the destination image pixels
		  var alphaFac = opaque ? 1 : 0;
		  for (var y=0; y<h; y++) {
			for (var x=0; x<w; x++) {
			  var sy = y;
			  var sx = x;
			  var dstOff = (y*w+x)*4;
			  // calculate the weighed sum of the source image pixels that
			  // fall under the convolution matrix
			  var r=0, g=0, b=0, a=0;
			  for (var cy=0; cy<side; cy++) {
				for (var cx=0; cx<side; cx++) {
				  var scy = sy + cy - halfSide;
				  var scx = sx + cx - halfSide;
				  if (scy >= 0 && scy < sh && scx >= 0 && scx < sw) {
					var srcOff = (scy*sw+scx)*4;
					var wt = weights[cy*side+cx];
					r += src[srcOff] * wt;
					g += src[srcOff+1] * wt;
					b += src[srcOff+2] * wt;
					a += src[srcOff+3] * wt;
				  }
				}
			  }
			  dst[dstOff] = r;
			  dst[dstOff+1] = g;
			  dst[dstOff+2] = b;
			  dst[dstOff+3] = a + alphaFac*(255-a);
			}
		  }
		  return output;
		}
		
		// checks if there is a next edit to process if not then finishes processing edits
		function checkNextEdit(){	
				
			//if(++x < editStack.stack.length){
			if(++x <= editStack.index){
				next(); // go to the next edit in the stack
			}else{
			
				// Finished Iterating through edits
				
				/*
				console.clear();
				for(var p = 0; p < globalTransformObject.transformChain.length; p++){
					console.log(JSON.stringify(editStack.stack[globalTransformObject.transformChain[p]]));
				}
				*/
				
				//console.clear();
				//console.log(JSON.stringify(globalTransformObject));
				//console.log("before: " + globalTransformObject.rotate);
				if(Math.abs(globalTransformObject.rotate) > 360){
					// If angle larger than 360 get the modulus
					globalTransformObject.rotate = globalTransformObject.rotate%360;
				}
				//console.log("modulus: " + globalTransformObject.rotate);
				if(globalTransformObject.rotate < 0){
					// If negative angle get the positive by adding it to 360
					globalTransformObject.rotate = 360 + globalTransformObject.rotate;
				}
				// finally any 360 deg value is 0 deg
				if(Math.abs(globalTransformObject.rotate) == 360){
					globalTransformObject.rotate = 0;
				}
				//console.log(globalTransformObject.rotate);
			
				// Very Important
				EditorUtils.setLayerIndexToStored();
				//console.log(layerIndex);
				EditorUtils.setEditingLayerMaskToStored();
				//console.log("mask:" + editingLayerMask);
				/*
				//==============================================
				// Regardless of where we stopped in the edits based on 'editStack.index'
				// We always set layerIndex to that dictated by last 'set_layer_index' edit entry
				// * REMEMBER * 'set_layer_index' are always appended to the end of the edit stack
				// to keep a memory of the last selected layer. See editStack.add
				for(var m = 0; m < editStack.stack.length; m++){
					if(editStack.stack[m].edit == "set_layer_index"){
						// 'set_layer_index' edit uses .index property to store the layer to go to.
						layerIndex = editStack.stack[m].index;
					}
				}
				if(layerIndex > (layerStack.length - 1)){
					layerIndex = layerStack.length - 1;
				}
				//==============================================
				*/	
				
				//alert(editingLayerMask);
				
				// Apply global Transformations to the canvas
				//console.log(globalTransformStr);
			
				
				// If the page doesnt have a color input like the SAVE PAGE the following will trigger an error
				// so check for foregroundColorInput element
				if(document.getElementById("foregroundColorInput")){
				
					// layer canvas (0), raster mask (1), or vector mask (2)
					if(editingLayerMask == 0){
					
						// Editing regular layer canvas
						
						document.getElementById("foregroundColorInput").value = global_foregroundColor;
						document.getElementById("foregroundColorBtnSwatch").style.fill = global_foregroundColor;
						
						document.getElementById("backgroundColorInput").value = global_backgroundColor;
						document.getElementById("backgroundColorBtnSwatch").style.fill = global_backgroundColor;
						
					}else if(editingLayerMask == 1){
					
						// Editing layer raster mask canvas
						EditorUtils.setColorInputs();

					}else if(editingLayerMask == 2){
					
						// Editing layer vector mask
					}		
					
				}				
				
				if(document.getElementById("layerSelector")){
					layerSelector.value = layerIndex;
				}
			
				if(layerStack.length > 0){
				
					// Load the editor canvas with the layers
					//image.src = layerStack[0].canvas.toDataURL();
					loadEditorImage();
					
					// Load the layers (Make sure it is an edit or tool page)
					if(document.getElementById("floatingtoolbox")){
						layerPanel.render();					
					}
					
					// alert(invertSelection);
					// alert(layerIndex);
					
					if(typeof activeSelectionArea === "undefined"){

						//alert("no active selection");
						if(document.getElementById("toolDrawCanvas")){
							updateToolCanvas();
						}
						
					}else{
						//alert("we have an active selection");
						// alert(JSON.stringify(activeSelectionArea));
						// invertSelection = activeSelectionArea.invert;
						startMarchingAnts();
					}	
					
				}
							
			}		
		}
		
		// Duplicate
		// Deprecated for EditorUtils.createLayerCopy
		function createLayerCopy(layerObject){
		
			let copylayer = new Object();
			copylayer.canvas = document.createElement("canvas");
			copylayer.canvas.width = layerObject.canvas.width;
			copylayer.canvas.height = layerObject.canvas.height;
			copylayer.canvas.getContext("2d").drawImage(layerObject.canvas,0,0);			
			copylayer.cumulativeTranslations = {x:0, y:0};
			copylayer.cumulativeTranslations.x = layerObject.cumulativeTranslations.x
			copylayer.cumulativeTranslations.y = layerObject.cumulativeTranslations.y
			copylayer.cumulativeNegatives = {x:0, y:0};
			copylayer.cumulativeNegatives.x = layerObject.cumulativeNegatives.x
			copylayer.cumulativeNegatives.y = layerObject.cumulativeNegatives.y
			copylayer.visible = layerObject.visible;

			// If there is Blending mode in the moved layer
			if('blend_mode' in layerObject){
				copylayer.blend_mode = layerObject.blend_mode;
			}	
			if('name' in layerObject){
				copylayer.name = layerObject.name;
			}	
			if('opacity' in layerObject){
				copylayer.opacity = layerObject.opacity;
			}
			
			// If there is a raster mask we copy it
			if('raster_mask' in layerObject){
				var rasterMaskCopy = createRasterMaskCopy(layerObject);
				copylayer.raster_mask = rasterMaskCopy;
			}
			
			if('object' in layerObject){
				if(layerObject.object.type == "text_object"){
					//alert("copy the text");
					//copylayer.object = createTextObjectCopy(layerObject.object);
					//alert(JSON.stringify(layerObject.object));
					
					// !!! May need to create a new text object using = createTextObjectCopy(layerObject.object);
					copylayer.object = layerObject.object;
				}
			}
			
		
			return copylayer;
			
		}
		
		function createRasterMaskCopy(layerObject){
		
			//==========================================
			// Create a copy of the layers raster mask
			var copyRasterMaskCanvas = document.createElement("canvas");
			copyRasterMaskCanvas.width = layerObject.raster_mask.canvas.width;
			copyRasterMaskCanvas.height = layerObject.raster_mask.canvas.height;	
			var copyRasterMaskCtx = copyRasterMaskCanvas.getContext("2d");
			
			// draw the copied layers raster mask to copyRasterMaskCanvas
			copyRasterMaskCtx.drawImage(layerObject.raster_mask.canvas, 0, 0);
			
			//==========================================
			// Create a copy of the layers raster mask			
			var copyRasterMaskOpacityCanvas = document.createElement("canvas");
			copyRasterMaskOpacityCanvas.width = layerObject.raster_mask.opacity_canvas.width;
			copyRasterMaskOpacityCanvas.height = layerObject.raster_mask.opacity_canvas.height;	
			var copyRasterMaskOpacityCanvasCtx = copyRasterMaskOpacityCanvas.getContext("2d");	
			
			// draw the copied layers raster mask to copyRasterMaskCanvas
			copyRasterMaskOpacityCanvasCtx.drawImage(layerObject.raster_mask.opacity_canvas, 0, 0);
				
			
			var rasterMaskObject = new Object();
			rasterMaskObject.canvas = copyRasterMaskCanvas;
			rasterMaskObject.raster_mask_linked = layerObject.raster_mask.raster_mask_linked;
			rasterMaskObject.opacity_canvas = copyRasterMaskOpacityCanvas;
			
			rasterMaskObject.cumulativeTranslations = new Object();
			rasterMaskObject.cumulativeTranslations.x = layerObject.raster_mask.cumulativeTranslations.x;
			rasterMaskObject.cumulativeTranslations.y = layerObject.raster_mask.cumulativeTranslations.y;
			
			rasterMaskObject.cumulativeNegatives = new Object();
			rasterMaskObject.cumulativeNegatives.x = layerObject.raster_mask.cumulativeNegatives.x;
			rasterMaskObject.cumulativeNegatives.y = layerObject.raster_mask.cumulativeNegatives.y;
			
			rasterMaskObject.enabled = layerObject.raster_mask.enabled;
			rasterMaskObject.fill = layerObject.raster_mask.fill;
			
			return rasterMaskObject;
			
		}
		
		function createTextObjectCopy(copyTextObject){
			var textObject = new Object;
			textObject.type = "text_object";
			textObject.string = copyTextObject.string;
			textObject.char_styles = JSON.parse(JSON.stringify(copyTextObject.char_styles));
			
			var textBoxRect = new Object();
			textBoxRect.x = copyTextObject.textbox.x;
			textBoxRect.y = copyTextObject.textbox.y;
			textBoxRect.width = copyTextObject.textbox.width;
			textBoxRect.height = copyTextObject.textbox.height;	
			
			textObject.textbox = textBoxRect;
			if('transform' in copyTextObject){
				textObject.transform = copyTextObject.transform;
			}	

			return 	textObject;		
		}
		
		function renameDuplicateLayer(oldLayerName){
		
			var newLayerName = oldLayerName;
		
			if(layerNameExists(newLayerName)){
				// Layer name was found
			
				// Create a new indexed name
				for(let l = 0; l < layerStack.length; l++){
					if('name' in layerStack[l]){
					
						//let numparts = currentObject["style"]["transform"].match(/.*scaleX\(([0-9.\-]+)\).*/);				
				
						if(layerStack[l].name == newLayerName){
							// check if there is an ending number in the added layer name
							let numparts = newLayerName.match(/.*( {1})([0-9]+)/);	
							// alert(JSON.stringify(numparts));
							if(numparts){
							
								// The Layer name has an appended number so we have to determine the number to append
								
								// alert("Layer name HAS appended number: " + numparts[1]);
								if(numparts.length == 3){
									//alert(newLayerName.replace(numparts[1] + numparts[2], " " + (1 + parseInt(numparts[2]))));
									newLayerName = newLayerName.replace(numparts[1] + numparts[2], " " + (1 + parseInt(numparts[2])));
									newLayerName = renameDuplicateLayer(newLayerName);
								}
							}else{
							
								// The Layer name has no appended number so just append " 1"
								
								// alert("Layer name NO appended number");
								newLayerName += " 1";
								newLayerName = renameDuplicateLayer(newLayerName);
							}						
						}
						
					}
				}	
					
			}
			
			return newLayerName;			
			
		}
		
		// Loops through the Layers stack to see if the layer name exists
		function layerNameExists(findLayerName){
			var found = false;
			for(let l = 0; l < layerStack.length; l++){
				if('name' in layerStack[l]){
					if(layerStack[l].name == findLayerName){
						found = true;
					}
				}
			}
			return found;
		}
		
		// draws the selection region described by activeSelectionArea 
		// in the context ctx
		// !!! - DEPRECATED FOR EditorUtils.drawSelectionClipping
		function drawSelectionClipping(ctx, invertSelection, fill = "green"){

			// 1. Fill the whole draw canvas with green
			ctx.fillStyle = fill;	
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
						ctx.fillRect(activeSelectionArea.geometry.x - layerStack[layerIndex].cumulativeNegatives.x, activeSelectionArea.geometry.y - layerStack[layerIndex].cumulativeNegatives.y, activeSelectionArea.geometry.width, activeSelectionArea.geometry.height);
						ctx.restore();							
					}else{
						// KEEP ERASER STROKES ONLY OUTSIDE RACTANGULAR SELECTION
						ctx.save();
						ctx.globalCompositeOperation = 'destination-out';
						ctx.fillStyle = "rgba(0, 255, 0, 1)";
						ctx.fillRect(activeSelectionArea.geometry.x - layerStack[layerIndex].cumulativeNegatives.x, activeSelectionArea.geometry.y - layerStack[layerIndex].cumulativeNegatives.y, activeSelectionArea.geometry.width, activeSelectionArea.geometry.height);
						ctx.restore();								
					}
			
				}if(activeSelectionArea.shape == "ellipse"){
		
					if(!invertSelection){
						// Clear in the  Ellipse Selection
						ctx.save();
						ctx.globalCompositeOperation = 'destination-in';
						ctx.fillStyle = "rgba(0, 255, 0, 1)";
						ctx.beginPath();
						ctx.ellipse(activeSelectionArea.geometry.x - layerStack[layerIndex].cumulativeNegatives.x, activeSelectionArea.geometry.y - layerStack[layerIndex].cumulativeNegatives.y, activeSelectionArea.geometry.radiusX, activeSelectionArea.geometry.radiusY, activeSelectionArea.geometry.rotation, activeSelectionArea.geometry.startAngle, activeSelectionArea.geometry.endAngle);
						ctx.fill();	
						ctx.restore();							
					}else{
						// CLEAR OUTSIDE Ellipse SELECTION
						ctx.save();
						ctx.globalCompositeOperation = 'destination-out';
						ctx.fillStyle = "rgba(0, 255, 0, 1)";
						ctx.beginPath();
						ctx.ellipse(activeSelectionArea.geometry.x - layerStack[layerIndex].cumulativeNegatives.x, activeSelectionArea.geometry.y - layerStack[layerIndex].cumulativeNegatives.y, activeSelectionArea.geometry.radiusX, activeSelectionArea.geometry.radiusY, activeSelectionArea.geometry.rotation, activeSelectionArea.geometry.startAngle, activeSelectionArea.geometry.endAngle);
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
								ctx.moveTo(activeSelectionArea.geometry[i].x - layerStack[layerIndex].cumulativeNegatives.x, activeSelectionArea.geometry[i].y - layerStack[layerIndex].cumulativeNegatives.y);
							}else{
								ctx.lineTo(activeSelectionArea.geometry[i].x - layerStack[layerIndex].cumulativeNegatives.x, activeSelectionArea.geometry[i].y - layerStack[layerIndex].cumulativeNegatives.y);
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
								ctx.moveTo(activeSelectionArea.geometry[i].x - layerStack[layerIndex].cumulativeNegatives.x, activeSelectionArea.geometry[i].y - layerStack[layerIndex].cumulativeNegatives.y);
							}else{
								ctx.lineTo(activeSelectionArea.geometry[i].x - layerStack[layerIndex].cumulativeNegatives.x, activeSelectionArea.geometry[i].y - layerStack[layerIndex].cumulativeNegatives.y);
							}
						}
						ctx.closePath();
						ctx.fill();
						ctx.restore();	
						
					}
					
				}
			
			}
					
		}	

		// clips the selection region described by activeSelectionArea 
		// in the context ctx
		function clipSelectionRegion(ctx, offset = {x:0, y:0}){

			//console.log(JSON.stringify(activeSelectionArea));
			//console.log(selectionActive);

			// 3. Perform Clipping - if there is a selection
			// alert(JSON.stringify(activeSelectionArea));
			if(typeof activeSelectionArea === "undefined"){
				// alert("no selection");
				// No selection active for clipping
				// UNCLIPPED ERASE STROKES
				// Do nothing to the eraser strokes canvas			
			}else{
			
				// alert("there is a selection");

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
						ctx.fillRect(activeSelectionArea.geometry.x - offset.x, activeSelectionArea.geometry.y - offset.y, activeSelectionArea.geometry.width, activeSelectionArea.geometry.height);
						ctx.restore();							
					}else{
						// KEEP ERASER STROKES ONLY OUTSIDE RACTANGULAR SELECTION
						ctx.save();
						ctx.globalCompositeOperation = 'destination-out';
						ctx.fillStyle = "rgba(0, 255, 0, 1)";
						ctx.fillRect(activeSelectionArea.geometry.x - offset.x, activeSelectionArea.geometry.y - offset.y, activeSelectionArea.geometry.width, activeSelectionArea.geometry.height);
						ctx.restore();								
					}
					
				}if(activeSelectionArea.shape == "ellipse"){
				

					if(!invertSelection){
						// Clear in the  Ellipse Selection
						ctx.save();
						ctx.globalCompositeOperation = 'destination-in';
						ctx.fillStyle = "rgba(0, 255, 0, 1)";
						ctx.beginPath();
						ctx.ellipse(activeSelectionArea.geometry.x - offset.x, activeSelectionArea.geometry.y - offset.y, activeSelectionArea.geometry.radiusX, activeSelectionArea.geometry.radiusY, activeSelectionArea.geometry.rotation, activeSelectionArea.geometry.startAngle, activeSelectionArea.geometry.endAngle);
						ctx.fill();	
						ctx.restore();							
					}else{
						// CLEAR OUTSIDE Ellipse SELECTION
						ctx.save();
						ctx.globalCompositeOperation = 'destination-out';
						ctx.fillStyle = "rgba(0, 255, 0, 1)";
						ctx.beginPath();
						ctx.ellipse(activeSelectionArea.geometry.x - offset.x, activeSelectionArea.geometry.y - offset.y, activeSelectionArea.geometry.radiusX, activeSelectionArea.geometry.radiusY, activeSelectionArea.geometry.rotation, activeSelectionArea.geometry.startAngle, activeSelectionArea.geometry.endAngle);
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
								ctx.moveTo(activeSelectionArea.geometry[i].x - offset.x, activeSelectionArea.geometry[i].y - offset.y);
								//ctx.moveTo(activeSelectionArea.geometry[i].x  + 1, activeSelectionArea.geometry[i].y);
							}else{
								ctx.lineTo(activeSelectionArea.geometry[i].x - offset.x, activeSelectionArea.geometry[i].y - offset.y);
								//ctx.lineTo(activeSelectionArea.geometry[i].x + 1, activeSelectionArea.geometry[i].y);
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
								ctx.moveTo(activeSelectionArea.geometry[i].x - offset.x, activeSelectionArea.geometry[i].y - offset.y);
							}else{
								ctx.lineTo(activeSelectionArea.geometry[i].x - offset.x, activeSelectionArea.geometry[i].y - offset.y);
							}
						}
						ctx.closePath();
						ctx.fill();
						ctx.restore();	
						
					}
					
				}				
		
			
			}// there is a selection
					
		}	


		// applies raster mask to the passed canvas
		function applyRasterMask(canvas, raster_opacity_canvas){
			var ctx = canvas.getContext("2d");
			ctx.save();
			ctx.globalCompositeOperation = 'destination-in';
			ctx.drawImage(raster_opacity_canvas,0,0);
			ctx.restore();			
		}
		
		// Rasterizes a layer with an object in it
		function rasterizeLayer(rasterLayer){
		
			//console.log(rasterLayer.canvas.width + "," + rasterLayer.canvas.height);

			// Get the context for the new rasterized layer's canvas
			var rasterizedLayerCanvas = document.createElement("canvas");
			rasterizedLayerCanvas.width = canvasWidth;
			rasterizedLayerCanvas.height = canvasHeight;	
			var rasterizedLayerCtx = rasterizedLayerCanvas.getContext("2d");

			// Determine the object type and raster accordingly
			if(rasterLayer.object.type == "text_object"){
			
				// If any coordinate position is negative we expand the layer canvas to catch the text object part that has gone offcanvas
				// We use the cumulativeNegatives to set the negative positionwith respect to the editor canvas and draw the text at zero 
				// in the layer.
				
				// if negative x text object position
				if(rasterLayer.object.textbox.x < 0){
					// alert(rasterLayer.object.textbox.x);
					rasterizedLayerCanvas.width += Math.abs(rasterLayer.object.textbox.x);
					
					// since we updated the with we set cumulativeNegatives
					rasterLayer.cumulativeNegatives.x += rasterLayer.object.textbox.x;
					rasterLayer.cumulativeTranslations.x += rasterLayer.object.textbox.x;
					
				}
				// if negative y text object position
				if(rasterLayer.object.textbox.y < 0){
					// alert(rasterLayer.object.textbox.x);
					rasterizedLayerCanvas.height += Math.abs(rasterLayer.object.textbox.y);
					
					// since we updated the with we set cumulativeNegatives
					rasterLayer.cumulativeNegatives.y += rasterLayer.object.textbox.y;
					rasterLayer.cumulativeTranslations.y += rasterLayer.object.textbox.y;
					
				}
				
				// If textbox goes over the right hand side of canvas
				if((rasterLayer.object.textbox.x + rasterLayer.object.textbox.width) > canvasWidth){
					rasterizedLayerCanvas.width += (rasterLayer.object.textbox.x + rasterLayer.object.textbox.width) - canvasWidth;
				}
				// if the textbox goes over the bottom of the textbox
				if((rasterLayer.object.textbox.y + rasterLayer.object.textbox.height) > canvasHeight){
					rasterizedLayerCanvas.height += (rasterLayer.object.textbox.y + rasterLayer.object.textbox.height) - canvasHeight;
				}
			
				// Create a canvas to render the textBox to
				var canvas = document.createElement("canvas");
				var ctx = canvas.getContext("2d");
				
				//alert(rasterLayer.object.transform);
				
				// Render the text using the text engine
				textEngine.renderText(ctx, rasterLayer.object.string, rasterLayer.object.char_styles, rasterLayer.object.textbox, rasterLayer.object.transform);			
				
				// Draw the rendered text canvas to the new rasterizedLayer canvas
				var draw_x = rasterLayer.object.textbox.x;
				var draw_y = rasterLayer.object.textbox.y;
				
				if(rasterLayer.object.textbox.x < 0){
					draw_x = 0;
				}
				if(rasterLayer.object.textbox.y < 0){
					draw_y = 0;
				}
				
				rasterizedLayerCtx.drawImage(canvas, draw_x, draw_y);
								
			}
			

			//console.log(rasterizedLayerCanvas.width + "," + rasterizedLayerCanvas.height);
			
			return rasterizedLayerCanvas;
		
		}
				
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
	}
	//})();
	

	// distance in RGB space
	function ColorDiff(c1, c2) { 

		return  Math.sqrt((c1.R - c2.R) * (c1.R - c2.R) 
								   + (c1.G - c2.G) * (c1.G - c2.G)
								   + (c1.B - c2.B)*(c1.B - c2.B)); 
	}

	function rgb2hsv (r,g,b) {
	 var computedH = 0;
	 var computedS = 0;
	 var computedV = 0;

	 //remove spaces from input RGB values, convert to int
	 var r = parseInt( (''+r).replace(/\s/g,''),10 ); 
	 var g = parseInt( (''+g).replace(/\s/g,''),10 ); 
	 var b = parseInt( (''+b).replace(/\s/g,''),10 ); 

	 if ( r==null || g==null || b==null ||
		 isNaN(r) || isNaN(g)|| isNaN(b) ) {
	   alert ('Please enter numeric RGB values!');
	   return;
	 }
	 if (r<0 || g<0 || b<0 || r>255 || g>255 || b>255) {
	   alert ('RGB values must be in the range 0 to 255.');
	   return;
	 }
	 r=r/255; g=g/255; b=b/255;
	 var minRGB = Math.min(r,Math.min(g,b));
	 var maxRGB = Math.max(r,Math.max(g,b));

	 // Black-gray-white
	 if (minRGB==maxRGB) {
	  computedV = minRGB;
	  return [0,0,computedV];
	 }

	 // Colors other than black-gray-white:
	 var d = (r==minRGB) ? g-b : ((b==minRGB) ? r-g : b-r);
	 var h = (r==minRGB) ? 3 : ((b==minRGB) ? 1 : 5);
	 computedH = 60*(h - d/(maxRGB - minRGB));
	 computedS = (maxRGB - minRGB)/maxRGB;
	 computedV = maxRGB;
	 return {h: computedH, s: computedS*100, v: computedV*100};
	}
	
	// gets the bounding rect of a rectangle width width and height that is rotated through angle
	function getRotatedBoundingRect(width, height, angle){
	
		let rotatorDiv = document.createElement("div");
		rotatorDiv.id = "rotatorDiv";
		rotatorDiv.style = "visibility: hidden; z-index: 1000; transform: rotate(" + angle + "deg); pointer-events: none; position: absolute; top: 0px; left: 0px;";
		let rotatedRect = document.createElement("div");
		rotatedRect.style = "width: " + width + "px; height: " + height + "px; background-color: rgba(255, 0, 0, .2);";
		rotatedRect.innerHTML = "test";
		rotatorDiv.appendChild(rotatedRect);
		document.body.appendChild(rotatorDiv);
		//alert(JSON.stringify(rotatedRect.getBoundingClientRect()));
		let rect = rotatedRect.getBoundingClientRect();
		document.body.removeChild(rotatorDiv);
		return rect;
				
	}

}