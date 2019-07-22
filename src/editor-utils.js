// Copyright (c) 2019 Kasey Thomas. All rights reserved.
// Use of this source code is governed by the EULA.

'use strict';

var EditorUtils = {

};

EditorUtils.setupWorkSpace = function(){

	// set the dimensions of the tool drawing canvas
	// to the dimensions of the workspace div
	var workspaceRect = workspaceDiv.getBoundingClientRect();
	toolDrawCanvas.width = workspaceRect.width;
	toolDrawCanvas.height = workspaceRect.height;

	// Set initial mouseOffsetLeft and mouseOffsetTop
	workspaceContainerDivRect = workspaceContainerDiv.getBoundingClientRect();
	canvasDivRect = canvasDiv.getBoundingClientRect();
	
	
	// get the offset of the canvas from the workspace container in canvasOffsetLef
	canvasOffsetLeft = (workspaceContainerDivRect.width - canvasDivRect.width*(globalZoom/100))/2;
	canvasOffsetTop = ((canvasDivRect.top - workspaceContainerDivRect.top) - window.pageYOffset)*(globalZoom/100);
	
	
	//canvasOffsetTop = 104;
	canvasOffsetTop = workspacePaddingTop;
	
}

EditorUtils.applyImageCanvasTransformations = function(ctx){
	// Flips
	
	// horizontal flip only
	if(globalTransformObject.flip_scaleX == -1 && globalTransformObject.flip_scaleY == 1){
		//alert("horizontal flip");
		ctx.translate(ctx.canvas.width, 0);
		ctx.scale(-1, 1);
		
	}
	
	// vertical flip only
	if(globalTransformObject.flip_scaleX == 0 && globalTransformObject.flip_scaleY == -1){
		//alert("vertical flip");
		ctx.translate(0, ctx.canvas.height);
		ctx.scale(1, -1);
		
	}
	
	// both vertical and horizontal flip
	if(globalTransformObject.flip_scaleX == -1 && globalTransformObject.flip_scaleY == -1){
		//alert("vertical flip");
		ctx.translate(ctx.canvas.width, ctx.canvas.height);
		ctx.scale(-1, -1);
		
	}
	
	
}

EditorUtils.getTransormedCanvas = function(canvas){

	// Loop through all the image transform edits
	for(var p = 0; p < globalTransformObject.transformChain.length; p++){
	
		/*
		var transformObject = {
			flip_scaleX: -1,
			flip_scaleY: 1,
			rotate: 0,				
		};
		*/
	
		if(globalTransformObject.transformChain[p].flip_scaleX == -1){
			EditorUtils.flipCanvas(canvas, "horizontal");		
		}		
		
		if(globalTransformObject.transformChain[p].flip_scaleY == -1){
			EditorUtils.flipCanvas(canvas, "vertical");		
		}
		
		var rotateCanvas = document.createElement("canvas");
		var rotateCtx = rotateCanvas.getContext("2d");	
		
		if(globalTransformObject.transformChain[p].rotate == 90){
					
			/*
			http://codetheory.in/canvas-rotating-and-scaling-images-around-a-particular-point/		
			ctx.save();
			ctx.translate(100,100);
			ctx.translate(img.width/2, img.height/2);
			ctx.rotate(30 * TO_RADIANS);
			ctx.drawImage(img, -img.width/2, -img.height/2);
			ctx.restore();		
			*/
			//console.log("rotate 90 deg");
			rotateCanvas.width = canvas.height;
			rotateCanvas.height = canvas.width;
			rotateCtx.translate(rotateCanvas.width/2,rotateCanvas.height/2);
			rotateCtx.rotate(90 * Math.PI / 180);
			rotateCtx.drawImage(canvas, -canvas.width/2, -canvas.height/2);

			canvas.width = rotateCanvas.width;	
			canvas.height = rotateCanvas.height;	
			canvas.getContext("2d").clearRect(0,0,canvas.width, canvas.height);
			
			canvas.getContext("2d").drawImage(rotateCanvas, 0, 0);
			
		}
		
		if(globalTransformObject.transformChain[p].rotate == -90){
		
			/*
			http://codetheory.in/canvas-rotating-and-scaling-images-around-a-particular-point/		
			ctx.save();
			ctx.translate(100,100);
			ctx.translate(img.width/2, img.height/2);
			ctx.rotate(30 * TO_RADIANS);
			ctx.drawImage(img, -img.width/2, -img.height/2);
			ctx.restore();		
			*/
			
			rotateCanvas.width = canvas.height;
			rotateCanvas.height = canvas.width;
			rotateCtx.translate(rotateCanvas.width/2,rotateCanvas.height/2);
			rotateCtx.rotate(-90 * Math.PI / 180);
			rotateCtx.drawImage(canvas, -canvas.width/2, -canvas.height/2);

			canvas.width = rotateCanvas.width;	
			canvas.height = rotateCanvas.height;	
			canvas.getContext("2d").clearRect(0,0,canvas.width, canvas.height);
			
			canvas.getContext("2d").drawImage(rotateCanvas, 0, 0);
			
		}
		if(globalTransformObject.transformChain[p].rotate == 180){
		
			/*
			http://codetheory.in/canvas-rotating-and-scaling-images-around-a-particular-point/		
			ctx.save();
			ctx.translate(100,100);
			ctx.translate(img.width/2, img.height/2);
			ctx.rotate(30 * TO_RADIANS);
			ctx.drawImage(img, -img.width/2, -img.height/2);
			ctx.restore();		
			*/
			
			rotateCanvas.width = canvas.width;
			rotateCanvas.height = canvas.height;
			rotateCtx.translate(rotateCanvas.width/2,rotateCanvas.height/2);
			rotateCtx.rotate(180 * Math.PI / 180);
			rotateCtx.drawImage(canvas, -canvas.width/2, -canvas.height/2);

			canvas.width = rotateCanvas.width;	
			canvas.height = rotateCanvas.height;	
			canvas.getContext("2d").clearRect(0,0,canvas.width, canvas.height);
			
			canvas.getContext("2d").drawImage(rotateCanvas, 0, 0);
			
		}		
	
	}
	
}

EditorUtils.setMouseCoordinates = function(e, workspaceContainerDiv, transform = true){

	// Using global scaling the SCALED canvas div will be contained in the workspace container div.
	// The canvas is always centered and its offset will always be based on its top, left edge from the 
	// edge of the workspace container.

	
	workspaceMouseX = Math.floor((e.pageX - workspaceContainerDiv.offsetLeft));
	workspaceMouseY = Math.floor((e.pageY - workspaceContainerDiv.offsetTop));
	
	if(transform){
		// Apply globalTransformObject to mouseX, mouseY
		if(globalTransformObject.flip_scaleX < 0){
			workspaceMouseX = workspaceContainerDivRect.width - workspaceMouseX;
		}
		if(globalTransformObject.flip_scaleY < 0){
			workspaceMouseY = workspaceContainerDivRect.height - workspaceMouseY;
		}	
	}
		
	// console.log(workspaceMouseX + "," + workspaceMouseY + " (" + workspaceContainerDivRect.width + ")");
	// console.log(mouseX + "," + mouseY);

	// mouseX, mouseY are inverse globalZoom to bring the points scale back to unity, the real world space of image
	mouseX = Math.floor((e.pageX - canvasOffsetLeft - toolBoxWidth))*(100/globalZoom);
	mouseY = Math.floor((e.pageY - workspaceContainerDiv.offsetTop - workspacePaddingTop))*(100/globalZoom);
	//console.log("before - x: " + mouseX + ",y: " + mouseY);
	if(transform){
		var transpoint = EditorUtils.getGlobalTransformedPoint(mouseX, mouseY);	
		
		mouseX = transpoint.x;
		mouseY = transpoint.y;
	}
	//console.log("after - x: " + mouseX + ", y: " + mouseY);
	
	mouseOffsetLeft = workspaceMouseX - mouseX;
	mouseOffsetTop = workspaceMouseY - mouseY;
	
	/*
	mouseX = e.pageX - canvasOffsetLeft - 51;
	mouseY = e.pageY - workspacePaddingTop;
	*/
	
	//console.log(mouseX + "," + mouseY);
	//infoLbl.innerText = "(x,y): " + mouseX + "," + mouseY + "," + canvasOffsetTop;	
	//infoLbl.innerText = workspaceContainerDivRect.width + "," + canvasDivRect.width*(globalZoom/100);
}

/*
 This function actually gets the untransformed coordinates from a coordinate by working
 // backwards through each transform
 Gets image coordinates from transformed screen coordinates
*/
EditorUtils.getGlobalTransformedPoint = function(point_x, point_y){

	/*
	var transformObject = {
		flip_scaleX: -1,
		flip_scaleY: 1,
		rotate: 0,				
	};
	*/

	var transformedDimens = new Object();
	transformedDimens.width = editorCanvas.width;
	transformedDimens.height = editorCanvas.height;
	//console.log(transformedDimens.width, transformedDimens.height);
	
	// Loop through all the image transform edits
	for(var p = globalTransformObject.transformChain.length - 1; p >= 0; p--){
		
		if(globalTransformObject.transformChain[p].flip_scaleX == -1){
			point_x = transformedDimens.width - point_x;	
		}		
		
		if(globalTransformObject.transformChain[p].flip_scaleY == -1){
			point_y = transformedDimens.height - point_y;		
		}
		
		if(globalTransformObject.transformChain[p].rotate == 90){

			// Map point_x, point_y to get true coordinates from the
			// rotated canvas
			var tempX = point_x;
			var tempY = point_y;
			
			point_x = tempY;
			point_y = transformedDimens.width - tempX;
			
			
			// switch the dimensions of the canvas since we had a right angle rotation where 
			// with now becomes height
			var w = transformedDimens.width;
			var h = transformedDimens.height;
			transformedDimens.width = h;
			transformedDimens.height = w;
			
		}

		if(globalTransformObject.transformChain[p].rotate == -90){
			// Canvas flipped on side
			//point_x = canvasWidth - point_x;
			
			// Map point_x, point_y for the rotation
			var tempX = point_x;
			var tempY = point_y;
			
			point_x = transformedDimens.height - tempY;
			point_y = tempX; // good
			
			// switch the dimensions of the canvas since we had a right angle rotation where 
			// with now becomes height
			var w = transformedDimens.width;
			var h = transformedDimens.height;
			transformedDimens.width = h;
			transformedDimens.height = w;
		}

		if(globalTransformObject.transformChain[p].rotate == 180){
			// Canvas flipped on side
			//point_x = canvasWidth - point_x;
			
			// Map point_x, point_y for the rotation
			var tempX = point_x;
			var tempY = point_y;
			
			point_x = transformedDimens.width - tempX;
			point_y = transformedDimens.height - tempY;
		}		
		
		
	}	
	
	// VERY IMORTANT coordinate system change
	// Translate the points from top-left to bottom-left coordinate
	//point_x = point_x; // x always remains the same
	//point_y = transformedDimens.height - point_y;
	
	/*
	if(globalTransformObject.flip_scaleX == -1){
		point_x = canvasWidth - point_x;	
	}		
	
	if(globalTransformObject.flip_scaleY == -1){
		point_y = canvasHeight - point_y;		
	}
	
	if(globalTransformObject.rotate == 0 || globalTransformObject.rotate == 360){
		// Canvas flipped on side
		//point_x = canvasWidth - point_x;
	}

	if(globalTransformObject.rotate == 90){
		// Canvas flipped on side
		//point_x = canvasWidth - point_x;
		
		
		// Map point_x, point_y to get true coordinates from the
		// rotated canvas
		var tempX = point_x;
		var tempY = point_y;
		
		point_x = tempY;
		point_y = transformedDimens.width - tempX;
		
		
		//var transformed_point = EditorUtils.rotatePointAroundCenter(transformedDimens.width/2, -transformedDimens.height/2, point_x, point_y, -90);
		//var transformed_point = EditorUtils.rotatePointAroundCenter(0,0,4,4,-90);
		//console.log(transformed_point);
		//point_x = transformed_point.x;
		//point_y = transformed_point.y + transformedDimens.height/2;
		
		// switch the dimensions of the canvas since we had a right angle rotation where 
		// with now becomes height
		var w = transformedDimens.width;
		var h = transformedDimens.height;
		transformedDimens.width = h;
		transformedDimens.height = w;
	}

	if(globalTransformObject.rotate == 180){
		// Canvas flipped on side
		//point_x = canvasWidth - point_x;
		
		// Map point_x, point_y for the rotation
		var tempX = point_x;
		var tempY = point_y;
		
		point_x = editorCanvas.width - tempX;
		point_y = editorCanvas.height - tempY;
	}	
	
	if(globalTransformObject.rotate == 270){
		// Canvas flipped on side
		//point_x = canvasWidth - point_x;
		
		// Map point_x, point_y for the rotation
		var tempX = point_x;
		var tempY = point_y;
		
		point_x = editorCanvas.height - tempY;
		point_y = tempX;
	}
	*/
		
	
	// VERY IMORTANT - coordinate system change
	// Change back to top-left coordinate system
	//point_x = point_x; // x always remains the same
	//point_y = transformedDimens.height - point_y;
	
	return {x: point_x, y: point_y};
}

/*
Rotate point x,y around center cx,cy at angle
*/
EditorUtils.rotatePointAroundCenter = function (cx, cy, x, y, angle){
    var radians = (Math.PI / 180) * angle,
        cos = Math.cos(radians),
        sin = Math.sin(radians),
        nx = (cos * (x - cx)) + (sin * (y - cy)) + cx,
        ny = (cos * (y - cy)) - (sin * (x - cx)) + cy;
    return {x: nx, y: ny};
}

/*
	Gets a rectangle that is taken from screen coordinate space to image space.
*/
EditorUtils.getGlobalTransformedRect = function(rect){

	// get all the rect corner points that are in globally tranformed space
	var p1 = {x: rect.x, y: rect.y}; // top, left
	var p2 = {x: rect.x + rect.width, y: rect.y}; // top, right
	var p3 = {x: rect.x + rect.width, y: rect.y + rect.height}; // bottom, right
	var p4 = {x: rect.x, y: rect.y + rect.height}; // bottom, left
	
	/*
	console.clear();
	console.log("rectangle points");
	console.log(p1);
	console.log(p2);
	console.log(p3);
	console.log(p4);
	*/
	
	// transform all the point from transformed space to actual image point space
	// uses the same routine in setMouseCoordinates
	p1 = EditorUtils.getGlobalTransformedPoint(p1.x, p1.y);
	p2 = EditorUtils.getGlobalTransformedPoint(p2.x, p2.y);
	p3 = EditorUtils.getGlobalTransformedPoint(p3.x, p3.y);
	p4 = EditorUtils.getGlobalTransformedPoint(p4.x, p4.y);
	
	/*
	console.log("transformed rectangle points");
	console.log(p1);
	console.log(p2);
	console.log(p3);
	console.log(p4);
	*/

	return EditorUtils.getRectFromPoints(p1,p2,p3,p4);
	
}


/*
	Generates a rect object given 4 point object {x:n, y:n}
*/
EditorUtils.getRectFromPoints = function(p1,p2,p3,p4){
	
	/*
	To create a rect object we first need to determine the top-left and bottom-right of
	the points. We create an array of the points and determine the lowest and greatest values
	by looping through.	
	*/
	
	// create endpoint 
	var min_x = 0; // lowest x
	var min_y = 0; // lowest y
	
	var max_x = 0; // highest x
	var max_y = 0; // highest y
	
	// build an array from the points
	var points = [];
	points.push(p1);
	points.push(p2);
	points.push(p3);
	points.push(p4);
	
	// assign temp values to 
	min_x = p1.x;
	min_y = p1.y;
	
	max_x = p1.x;
	max_y = p1.y;
	
	for(var i = 0; i < points.length; i++){
		// get the minimum x point
		if(points[i].x < min_x){
			min_x = points[i].x; 
		}
		// get the minimum y point
		if(points[i].y < min_y){
			min_y = points[i].y; 
		}
		// get the maximum x point
		if(points[i].x > max_x){
			max_x = points[i].x; 
		}
		// get the maximum y point
		if(points[i].y > max_y){
			max_y = points[i].y; 
		}
	}
	
	return {
		x: min_x,
		y: min_y,
		width: max_x - min_x,
		height: max_y - min_y
	};
	
}

/*
	This takes a selection from image space and puts it in screen coordinate space
*/
EditorUtils.globalImageRotateActiveSelection = function(selection, shape){

	//alert(globalTransformObject.transformChain.length);
	
	var rotateCanvasWidth = canvasWidth;
	var rotateCanvasHeight = canvasHeight;

	// Loop through all the image transform edits
	for(var p = 0; p < globalTransformObject.transformChain.length; p++){

		/*
		var transformObject = {
			flip_scaleX: -1,
			flip_scaleY: 1,
			rotate: 0,				
		};
		*/
	
		// 1. Horizontal Flip
		if(globalTransformObject.transformChain[p].flip_scaleX == -1){
		
			if(shape == "rectangle"){
			
				//alert("rotate rect select 90");
				// If the canvas is rotated 90 degrees the width and height are switched

				// make a temporary copy of the rectangular selection
				var x = selection.x;
				var y = selection.y;
				var tempWidth = selection.width;
				var tempHeight = selection.height;		
			
				selection.x = rotateCanvasWidth - x - tempWidth;
				
				
			}if(shape == "ellipse"){

				var x = selection.x;
				var y = selection.y;
				selection.x = rotateCanvasWidth - x;
				//selection.y = rotateCanvasHeight - y;
				
				// DON'T switch the ellipse radii
				//var rx = selection.radiusX;
				//var ry = selection.radiusY;
				//selection.radiusX = ry;
				//selection.radiusY = rx;					
			
			}else if(shape == "freeform"){

				for(var i = 0; i < selection.points.length; i++){
				
					// save the temp unrotated point
					var x = selection.points[i].x;
					var y = selection.points[i].y;
				
					selection.points[i].x = rotateCanvasWidth - x;
					//selection.points[i].y = rotateCanvasHeight - y;
				}	

			}else if(shape == "mask_shape"){
			
				// Loop through all the poins in each mask object and update with 90 rotation
				for(var i = 0; i < selection.length; i++) {
					var ps = selection[i].points;
					for (var j = 0; j < ps.length; j++) {
					
						// save the temp unrotated point
						var x = ps[j].x;
						var y = ps[j].y;

						ps[j].x = rotateCanvasWidth - x;
						//ps[j].y = rotateCanvasHeight - y;
						
					}
				}
				
			}
		}		
		
		// 2. Flip Vertical
		if(globalTransformObject.transformChain[p].flip_scaleY == -1){
			if(shape == "rectangle"){
			
				//alert("rotate rect select 90");
				// If the canvas is rotated 90 degrees the width and height are switched

				// make a temporary copy of the rectangular selection
				var x = selection.x;
				var y = selection.y;
				var tempWidth = selection.width;
				var tempHeight = selection.height;		
			
				//selection.x = rotateCanvasWidth - x - tempWidth;
				selection.y = rotateCanvasHeight - y - tempHeight;
				
				
			}if(shape == "ellipse"){

				var x = selection.x;
				var y = selection.y;
				//selection.x = rotateCanvasWidth - x;
				selection.y = rotateCanvasHeight - y;
				
				// DON'T switch the ellipse radii
				//var rx = selection.radiusX;
				//var ry = selection.radiusY;
				//selection.radiusX = ry;
				//selection.radiusY = rx;					
			
			}else if(shape == "freeform"){

				for(var i = 0; i < selection.points.length; i++){
				
					// save the temp unrotated point
					var x = selection.points[i].x;
					var y = selection.points[i].y;
				
					//selection.points[i].x = rotateCanvasWidth - x;
					selection.points[i].y = rotateCanvasHeight - y;
				}	

			}else if(shape == "mask_shape"){
			
				// Loop through all the poins in each mask object and update with 90 rotation
				for(var i = 0; i < selection.length; i++) {
					var ps = selection[i].points;
					for (var j = 0; j < ps.length; j++) {
					
						// save the temp unrotated point
						var x = ps[j].x;
						var y = ps[j].y;

						//ps[j].x = rotateCanvasWidth - x;
						ps[j].y = rotateCanvasHeight - y;
						
					}
				}
				
			}	
		}
		
		// 3. Rotate 90 deg
		if(globalTransformObject.transformChain[p].rotate == 90){
		
			
			// If the canvas is rotated 90 degrees the width and height are switched		
			var w = rotateCanvasWidth;
			var h = rotateCanvasHeight;
			rotateCanvasWidth = h;
			rotateCanvasHeight = w;
				
			if(shape == "rectangle"){
			
				//alert("rotate rect select 90");

				// make a temporary copy of the rectangular selection
				var tempX = selection.x;
				var tempY = selection.y;
				var tempWidth = selection.width;
				var tempHeight = selection.height;		
			
				
				selection.x = rotateCanvasWidth - tempY - tempHeight;
				selection.y = tempX;

				selection.width = tempHeight;
				selection.height = tempWidth;
				
			}if(shape == "ellipse"){
			
				var x = selection.x;
				var y = selection.y;
				selection.x = rotateCanvasWidth - y;
				selection.y = x;
				
				// switch the ellipse radii
				var rx = selection.radiusX;
				var ry = selection.radiusY;
				selection.radiusX = ry;
				selection.radiusY = rx;
				
			
			}else if(shape == "freeform"){

				for(var i = 0; i < selection.points.length; i++){
				
					// save the temp unrotated point
					var x = selection.points[i].x;
					var y = selection.points[i].y;
				
					selection.points[i].x = rotateCanvasWidth - y;
					selection.points[i].y = x;
				}
			
			}else if(shape == "mask_shape"){
			
				// Loop through all the poins in each mask object and update with 90 rotation
				for(var i = 0; i < selection.length; i++) {
					var ps = selection[i].points;
					for (var j = 0; j < ps.length; j++) {
					
						// save the temp unrotated point
						var x = ps[j].x;
						var y = ps[j].y;
					
						ps[j].x = rotateCanvasWidth - y;
						ps[j].y = x;
						
					}
				}
				
			}	
		}

		// 4. Rotate -90 deg
		if(globalTransformObject.transformChain[p].rotate == -90){
		
			// If the canvas is rotated 90 degrees the width and height are switched		
			var w = rotateCanvasWidth;
			var h = rotateCanvasHeight;
			rotateCanvasWidth = h;
			rotateCanvasHeight = w;		
		
			if(shape == "rectangle"){

				// make a temporary copy of the rectangular selection
				var tempX = selection.x;
				var tempY = selection.y;
				var tempWidth = selection.width;
				var tempHeight = selection.height;		
			
				selection.y = rotateCanvasHeight - tempX - tempWidth;
				selection.x = tempY;

				selection.width = tempHeight;
				selection.height = tempWidth;
				
			}if(shape == "ellipse"){

				var x = selection.x;
				var y = selection.y;
				selection.x = y;
				selection.y = rotateCanvasHeight - x;
				
				// switch the ellipse radii
				var rx = selection.radiusX;
				var ry = selection.radiusY;
				selection.radiusX = ry;
				selection.radiusY = rx;			
			
			}else if(shape == "freeform"){

				for(var i = 0; i < selection.points.length; i++){
				
					// save the temp unrotated point
					var x = selection.points[i].x;
					var y = selection.points[i].y;
				
					selection.points[i].x = y;
					selection.points[i].y = rotateCanvasHeight - x;
				}			

			}else if(shape == "mask_shape"){
			
				// Loop through all the poins in each mask object and update with 90 rotation
				for(var i = 0; i < selection.length; i++) {
					var ps = selection[i].points;
					for (var j = 0; j < ps.length; j++) {
					
						// save the temp unrotated point
						var x = ps[j].x;
						var y = ps[j].y;

						ps[j].x = y;
						ps[j].y = rotateCanvasHeight - x;
						
					}
				}
				
			}
		}

		// 5. Rotate 180 deg
		if(globalTransformObject.transformChain[p].rotate == 180){
			if(shape == "rectangle"){
			
				//alert("rotate rect select 90");
				// If the canvas is rotated 90 degrees the width and height are switched

				// make a temporary copy of the rectangular selection
				var tempX = selection.x;
				var tempY = selection.y;
				var tempWidth = selection.width;
				var tempHeight = selection.height;		
			
				selection.x = rotateCanvasWidth - tempX - tempWidth;
				selection.y = rotateCanvasHeight - tempY - tempHeight;
				
			}if(shape == "ellipse"){

				var x = selection.x;
				var y = selection.y;
				selection.x = rotateCanvasWidth - x;
				selection.y = rotateCanvasHeight - y;
				
				// DON'T switch the ellipse radii
				//var rx = selection.radiusX;
				//var ry = selection.radiusY;
				//selection.radiusX = ry;
				//selection.radiusY = rx;					
			
			}else if(shape == "freeform"){

				for(var i = 0; i < selection.points.length; i++){
				
					// save the temp unrotated point
					var x = selection.points[i].x;
					var y = selection.points[i].y;
				
					selection.points[i].x = rotateCanvasWidth - x;
					selection.points[i].y = rotateCanvasHeight - y;
				}	

			}else if(shape == "mask_shape"){
			
				// Loop through all the poins in each mask object and update with 90 rotation
				for(var i = 0; i < selection.length; i++) {
					var ps = selection[i].points;
					for (var j = 0; j < ps.length; j++) {
					
						// save the temp unrotated point
						var x = ps[j].x;
						var y = ps[j].y;

						ps[j].x = rotateCanvasWidth - x;
						ps[j].y = rotateCanvasHeight - y;
						
					}
				}
				
			}
		}		
		
		
	}
		
}


EditorUtils.testViewCanvas = function(viewCanvas){
	var canvas = document.getElementById("testCanvas");
	canvas.width = viewCanvas.width;
	canvas.height = viewCanvas.height;
	var ctx = canvas.getContext("2d");
	ctx.drawImage(viewCanvas, 0 ,0);
}

EditorUtils.storeLayerIndex = function(index){
	// save the layer Index to local storage
	localStorage.setItem("storedLayerIndex", index);
	
	// !!! Important - Any change in selected layer index the layer should be selected and
	// not have any mask selected
	EditorUtils.storeEditingLayerMask(0);	
}

EditorUtils.setLayerIndexToStored = function(){

	if (localStorage.getItem("storedLayerIndex") === null) {
	}else{
		//alert(localStorage.getItem("storedLayerIndex"));
		
		// temp variable to test if layer index exists in the stack
		var tempIndex = localStorage.getItem("storedLayerIndex");
		// test if layer index exists in the stack before assigning
		if(layerStack[tempIndex]){
			layerIndex = parseInt(localStorage.getItem("storedLayerIndex"));	
		}
						
	}
	
}


EditorUtils.storeEditingLayerMask = function(index){
	// save the layer Index to local storage
	localStorage.setItem("stored_editingLayerMask", index);
}

EditorUtils.setEditingLayerMaskToStored = function(){

	if (localStorage.getItem("stored_editingLayerMask") === null) {
	}else{
		//alert(localStorage.getItem("stored_editingLayerMask"));
		
		// temp variable to test if mask exists in the layer
		editingLayerMask = parseInt(localStorage.getItem("stored_editingLayerMask"));
		
		if(editingLayerMask == 1){
			// the current layer should have a raster_mask
			if('raster_mask' in layerStack[layerIndex]){
			
			}else{
				editingLayerMask = 0; // go back to editing the layer
			}
		}

		if(editingLayerMask == 2){
			// the current layer should have a raster_mask
			if('vector_mask' in layerStack[layerIndex]){
			
			}else{
				editingLayerMask = 0; // go back to editing the layer
			}
		}		
						
	}
	
}


EditorUtils.openDialog = function(title, body){
	//alert("Show canvas size dialog");
	
	// Remove any previous dialog
	if(document.getElementById("activeDialog")){
		document.body.removeChild(document.getElementById("activeDialog"));
	}
	
	// <div id="activeDialog" id="position: absolute; top: 0px; left: 0px; background-color: rgb(54, 55, 58);"> 
	var editorDialogDiv = document.createElement("div");
	editorDialogDiv.id = "activeDialog";
	//editorDialogDiv.style = "z-index: 5000000; position: absolute; top: 200px; left: 150px; background-color: rgb(54, 55, 58);";
	editorDialogDiv.style = "z-index: 5000000; position: fixed; top: 200px; left: 150px; background-color: rgb(74, 75, 78); box-shadow: 5px 5px 8px rgb(0,0,0,.2);";

	
		// 1. Make the header
		var editorDialogHeaderDiv = document.createElement("div");
		editorDialogHeaderDiv.id = "activeDialogheader"; // This is important to EditorUtils.dragDialog
		editorDialogHeaderDiv.style = "height: 30px; padding: 5px 10px 0px 10px; color: #fff; background-image: linear-gradient(rgb(54, 55, 58), rgb(34, 35, 38));";
		
			// Make the header title
			var editorDialogHeaderTitleDiv = document.createElement("div");
			editorDialogHeaderTitleDiv.style = "user-select: none; float: left; padding: 4px 0px 0px 0px; font-weight: bold; font-family: arial;";
			editorDialogHeaderTitleDiv.innerText = title;
			
			// Make the header close button containing div
			var editorDialogHeaderCloseBtnDiv = document.createElement("div");
			editorDialogHeaderCloseBtnDiv.style = "float: right;";

				// Make the close button
				var dialogCloseBtn = document.createElement("span");
				dialogCloseBtn.style = "cursor: pointer;";
				dialogCloseBtn.innerText = "Close";
				dialogCloseBtn.onclick = function(){
					if(document.getElementById("activeDialog")){
						document.body.removeChild(document.getElementById("activeDialog"));
					}
				};
				
		// append the header title div to the dialog header div
		editorDialogHeaderDiv.appendChild(editorDialogHeaderTitleDiv);
		
		// append the close button div to the dialog header div
		editorDialogHeaderDiv.appendChild(editorDialogHeaderCloseBtnDiv);
				
		// append the close button to its container div
		editorDialogHeaderCloseBtnDiv.appendChild(dialogCloseBtn);
		
					
		// append the header to the dialog div		
		editorDialogDiv.appendChild(editorDialogHeaderDiv);
		
		
		// 2. Create the dialog body container div
		var editorDialogBodyContainerDiv = document.createElement("div");
		editorDialogBodyContainerDiv.id = "editorDialogBodyContainerDiv";
		
		editorDialogBodyContainerDiv.appendChild(body);
		
		// append the body sent in the function argument
		editorDialogDiv.appendChild(editorDialogBodyContainerDiv);
		
	// Finally show the dialog in the document
	document.body.appendChild(editorDialogDiv);
	
	// !!! Important - Make the dialog draggable
	EditorUtils.dragDialog(editorDialogDiv);
}

EditorUtils.saveImage = function(format, quality){

	//alert(format);
	//alert(quality);
	//return;
	
	var mimeExtension = { 
		"image/jpeg": ".jpg", 
		"image/png": ".png"
	};
	
	if(format == "image/png"){
		quality = 100;
	}
	
	//alert(mimeExtension[format]);

	// 1. Render to the save Image Canvas
	var saveImageCanvas = EditorUtils.getSaveImage();
	
	// Get the blob from the image canvas
	saveImageCanvas.toBlob(function(blob) {

		var fileName = "image" + mimeExtension[format];
		
		// Download the blob
		let a = document.createElement("a");
		document.body.appendChild(a);
		a.style = "display: none";
		
		let url = window.URL.createObjectURL(blob);
		a.href = url;
		a.download = fileName;
		a.click();
		window.URL.revokeObjectURL(url);
	
	}, format, quality/100);
	//}, mimeTypes[$("#fileFormatSelect").val()], parseInt(imageQualitySlider.value)/100);
	
	
}

EditorUtils.updateSaveFileDialogThumb = function(format = "image/png", quality = 100){

	var image = new Image();
	image.onload = function(){
	
		//alert(image.src);
	
		// If the image is wider than 200 pixels then shrink it by styling the width
		if(image.width < 200){
			
		}else{
			document.getElementById("sameFileDialogThumb").style = "width: 200px;";					
		}

		document.getElementById("sameFileDialogThumb").src = image.src;			
	}
	var canvas = EditorUtils.getSaveImage();
	
	canvas.toBlob(function(blob) {
		//alert(blob.size);
		//imageByteSizeLbl.innerText = (blob.size/1000).toFixed(1) + " KB";
		document.getElementById("saveFileDialogSizeLbl").innerHTML = "Size:&nbsp;&nbsp;" + EditorUtils.bytesToSize(blob.size, " ");
	}, format, quality/100);	
				
	image.src = canvas.toDataURL(format, quality/100);
}

EditorUtils.getSaveImage = function(){

	var saveImageCanvas = document.createElement("canvas");
	saveImageCanvas.width = canvasWidth;
	saveImageCanvas.height = canvasHeight;
	var saveImageCtx = saveImageCanvas.getContext("2d");
	
	// 2. Render the image to the save canvas
	//============================================
	// Draw all the layers to the save canvas
	layerRenderEngine.renderAllLayers(saveImageCtx);
	//============================================
	
	// 3. Perform any flips if present

	var flipx = 1, flipy = 1;

	// Apply the flip
	EditorUtils.scaleCanvas(saveImageCanvas, flipx, flipy);

	return saveImageCanvas;
}

// https://www.w3resource.com/javascript-exercises/javascript-math-exercise-8.php
EditorUtils.gcd_two_numbers = function(x, y) {
  if ((typeof x !== 'number') || (typeof y !== 'number')) 
    return false;
  x = Math.abs(x);
  y = Math.abs(y);
  while(y) {
    var t = y;
    y = x % y;
    x = t;
  }
  return x;
};

EditorUtils.checkInBounds = function(rect, boundwidth, boundheight) {
	var bounded = true;
	
	if(rect.x < 0 || rect.y < 0){
		bounded = false;
	}
	
	// check if the right edge is over the boundwidth of the bounding box
	if((rect.x + rect.width) > boundwidth){
		bounded = false;
	}
	// check if the bottom edge is over the boundheight of the bounding box
	if((rect.y + rect.height) > boundheight){
		bounded = false;
	}	
	
	return bounded;
};

EditorUtils.getAspectRatio = function(width, height) {
	var gcd = EditorUtils.gcd_two_numbers(width, height);
	return {width: width/gcd,height: height/gcd};
};

EditorUtils.drawTestBox = function(ctx, rect, color){
	console.log("draw test box");
	ctx.save();
	ctx.fillStyle = color;
	ctx.fillRect(rect.x ,rect.y ,rect.width ,rect.height);
	ctx.restore();
};

EditorUtils.setColorInputs = function(){
	// Since we are editing Raster mask set the foregroundColorInput and backgroundColorInput to grayscale
	// GRAYSCALE THE FOREGROUND COLOR CONTROLS 
	var foregroundRGB = EditorUtils.hexToRgb(global_foregroundColor);
	var foregroundGrayscaleRGB = EditorUtils.rgbToGrayscale(foregroundRGB.r, foregroundRGB.g, foregroundRGB.b);
	var foregroundGrayscaleHex = EditorUtils.rgbToHex(foregroundGrayscaleRGB.r, foregroundGrayscaleRGB.g, foregroundGrayscaleRGB.b);
	//alert(grayscaleHex);

	document.getElementById("foregroundColorInput").value = foregroundGrayscaleHex;
	document.getElementById("foregroundColorBtnSwatch").style.fill = foregroundGrayscaleHex;

	// GRAYSCALE THE BACKGROUND COLOR CONTROLS 
	var backgroundRGB = EditorUtils.hexToRgb(global_backgroundColor);
	var backgroundGrayscaleRGB = EditorUtils.rgbToGrayscale(backgroundRGB.r, backgroundRGB.g, backgroundRGB.b);
	var backgroundGrayscaleHex = EditorUtils.rgbToHex(backgroundGrayscaleRGB.r, backgroundGrayscaleRGB.g, backgroundGrayscaleRGB.b);
	//alert(grayscaleHex);

	document.getElementById("backgroundColorInput").value = backgroundGrayscaleHex;
	document.getElementById("backgroundColorBtnSwatch").style.fill = backgroundGrayscaleHex;
};

EditorUtils.componentToHex = function(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
};

// converts rgb to hexadecimal format
EditorUtils.rgbToHex = function(r, g, b) {
    return "#" + this.componentToHex(r) + this.componentToHex(g) + this.componentToHex(b);
};

// converts hexadecimal to rgb
EditorUtils.hexToRgb = function(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
};

EditorUtils.rgbToGrayscale = function(R,G,B){
	//Y = .2126 * R^gamma + .7152 * G^gamma + .0722 * B^gamma;
	var Y = Math.ceil(.2126 * R + .7152 * G + .0722 * B);
	return {r: Y, g: Y, b: Y};
};

// Converts RGB color to HSV
EditorUtils.rgb2hsv = function(red,green,blue) {
 var computedH = 0;
 var computedS = 0;
 var computedV = 0;

 //remove spaces from input RGB values, convert to int
 var r = parseInt( (''+red).replace(/\s/g,''),10 ); 
 var g = parseInt( (''+green).replace(/\s/g,''),10 ); 
 var b = parseInt( (''+blue).replace(/\s/g,''),10 ); 

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
 return {h: 0, s: 0, v: computedV*100};
 }

 // Colors other than black-gray-white:
 var d = (r==minRGB) ? g-b : ((b==minRGB) ? r-g : b-r);
 var h = (r==minRGB) ? 3 : ((b==minRGB) ? 1 : 5);
 computedH = 60*(h - d/(maxRGB - minRGB));
 computedS = (maxRGB - minRGB)/maxRGB;
 computedV = maxRGB;
 return {h: computedH, s: computedS*100, v: computedV*100};
};

// Converts RGB color to HSL
// https://gist.github.com/mjackson/5311256
/**
 * Converts an RGB color value to HSL. Conversion formula
 * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
 * Assumes r, g, and b are contained in the set [0, 255] and
 * returns h, s, and l in the set [0, 1].
 *
 * @param   Number  r       The red color value
 * @param   Number  g       The green color value
 * @param   Number  b       The blue color value
 * @return  Array           The HSL representation
 */
EditorUtils.rgbToHsl = function(r, g, b) {
  r /= 255, g /= 255, b /= 255;

  var max = Math.max(r, g, b), min = Math.min(r, g, b);
  var h, s, l = (max + min) / 2;

  if (max == min) {
    h = s = 0; // achromatic
  } else {
    var d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }

    h /= 6;
  }

  //return [ h, s, l ];
  
  // convert hue to angle
  h = parseInt(h*360);
  // convert saturation to percentage
  s = parseInt(s*100);
  // convert lightness to percantage
  l = parseInt(l*100);
  
  return { h:h, s:s, l:l};
  
};

EditorUtils.setColorPickerColorLabels = function(r, g, b, hexstr){

	var rgbLbl = document.getElementById("rgbLbl");
	var hsvLbl = document.getElementById("hsvLbl");
	var hslLbl = document.getElementById("hslLbl");
	var hexLbl = document.getElementById("hexLbl");
	
	if(rgbLbl){
		rgbLbl.innerText = "RGB: (" + r + ", " + b + ", " + g + ")";
	}
	
	if(hsvLbl){
		var hsv = EditorUtils.rgb2hsv(r, b, g);
		hsvLbl.innerText = "HSV: (" + parseInt(hsv.h) + ", " + parseInt(hsv.s) + ", " + parseInt(hsv.v) + ")";
	}
	
	if(hslLbl){
		var hsl = EditorUtils.rgbToHsl(r, b, g);
		hslLbl.innerText = "HSL: (" + hsl.h + ", " + hsl.s + ", " + hsl.l + ")";
	}
	
	if(hexLbl){
		hexLbl.innerText = "HEX: " + hexstr.toUpperCase();
	}
	
}

// distance between colors in RGB space
EditorUtils.ColorDiff = function(c1, c2) { 

	return  Math.sqrt((c1.R - c2.R) * (c1.R - c2.R) 
                               + (c1.G - c2.G) * (c1.G - c2.G)
                               + (c1.B - c2.B)*(c1.B - c2.B)); 
};

// Create a blob from dataURL
EditorUtils.dataURLtoBlob = function(dataurl) {
	var arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
		bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
	while(n--){
		u8arr[n] = bstr.charCodeAt(n);
	}
	return new Blob([u8arr], {type:mime});
};

EditorUtils.bytesToSize = function (bytes, seperator = "") {
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  if (bytes == 0) return 'n/a'
  const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)), 10)
  if (i === 0) return `${bytes}${seperator}${sizes[i]}`
  return `${(bytes / (1024 ** i)).toFixed(1)}${seperator}${sizes[i]}`
};

EditorUtils.flipCanvas = function (canvas, direction){

	var tempCanvas = document.createElement("canvas");
	tempCanvas.width = canvas.width;
	tempCanvas.height = canvas.height;
	var tempCtx = tempCanvas.getContext("2d");

	if(direction == "horizontal"){
		//alert("horizontal flip");
		tempCtx.translate(canvas.width, 0);
		tempCtx.scale(-1, 1);
		
	}else if(direction == "vertical"){
		//alert("vertical flip");
		tempCtx.translate(0, canvas.height);
		tempCtx.scale(1, -1);
		
	}
	
	tempCtx.drawImage(canvas, 0, 0); // draw the image	

	var canvasCtx = canvas.getContext("2d");
	canvasCtx.clearRect(0,0, canvasCtx.canvas.width, canvasCtx.canvas.height);
	canvasCtx.drawImage(tempCanvas, 0, 0);
	
}

EditorUtils.scaleCanvas = function(canvas, x, y){

	var tempCanvas = document.createElement("canvas");
	tempCanvas.width = canvas.width;
	tempCanvas.height = canvas.height;
	var tempCtx = tempCanvas.getContext("2d");
	
	var scaleX = 1, scaleY = 1;

	if(x < 0){
		//alert("horizontal flip");
		tempCtx.translate(canvas.width, 0);
		scaleX = -1;
	}
	
	if(y < 0){
		//alert("vertical flip");
		tempCtx.translate(0, canvas.height);
		scaleY = -1;
	}
	
	tempCtx.scale(scaleX, scaleY);
	
	tempCtx.drawImage(canvas, 0, 0); // draw the image	

	var canvasCtx = canvas.getContext("2d");
	canvasCtx.clearRect(0,0, canvasCtx.canvas.width, canvasCtx.canvas.height);
	canvasCtx.drawImage(tempCanvas, 0, 0);
	
};

EditorUtils.rotateCanvas = function(canvas, angle){
	
	var rotateCanvas = document.createElement("canvas");
	var rotateCtx = rotateCanvas.getContext("2d");	
	
	if(angle == 0 || angle == 360){
	
	}
	
	if(angle == 90 || angle == -270){
				
		/*
		http://codetheory.in/canvas-rotating-and-scaling-images-around-a-particular-point/		
		ctx.save();
		ctx.translate(100,100);
		ctx.translate(img.width/2, img.height/2);
		ctx.rotate(30 * TO_RADIANS);
		ctx.drawImage(img, -img.width/2, -img.height/2);
		ctx.restore();		
		*/
		//console.log("rotate 90 deg");
		rotateCanvas.width = canvas.height;
		rotateCanvas.height = canvas.width;
		rotateCtx.translate(rotateCanvas.width/2,rotateCanvas.height/2);
		rotateCtx.rotate(90 * Math.PI / 180);
		rotateCtx.drawImage(canvas, -canvas.width/2, -canvas.height/2);

		canvas.width = rotateCanvas.width;	
		canvas.height = rotateCanvas.height;	
		canvas.getContext("2d").clearRect(0,0,canvas.width, canvas.height);
		
		canvas.getContext("2d").drawImage(rotateCanvas, 0, 0);
		
	}
	
	if(angle == -90 || angle == 270){
	
		/*
		http://codetheory.in/canvas-rotating-and-scaling-images-around-a-particular-point/		
		ctx.save();
		ctx.translate(100,100);
		ctx.translate(img.width/2, img.height/2);
		ctx.rotate(30 * TO_RADIANS);
		ctx.drawImage(img, -img.width/2, -img.height/2);
		ctx.restore();		
		*/
		
		rotateCanvas.width = canvas.height;
		rotateCanvas.height = canvas.width;
		rotateCtx.translate(rotateCanvas.width/2,rotateCanvas.height/2);
		rotateCtx.rotate(-90 * Math.PI / 180);
		rotateCtx.drawImage(canvas, -canvas.width/2, -canvas.height/2);

		canvas.width = rotateCanvas.width;	
		canvas.height = rotateCanvas.height;	
		canvas.getContext("2d").clearRect(0,0,canvas.width, canvas.height);
		
		canvas.getContext("2d").drawImage(rotateCanvas, 0, 0);
		
	}
	
	if(angle == 180 || angle == -180){
	
		/*
		http://codetheory.in/canvas-rotating-and-scaling-images-around-a-particular-point/		
		ctx.save();
		ctx.translate(100,100);
		ctx.translate(img.width/2, img.height/2);
		ctx.rotate(30 * TO_RADIANS);
		ctx.drawImage(img, -img.width/2, -img.height/2);
		ctx.restore();		
		*/
		
		rotateCanvas.width = canvas.width;
		rotateCanvas.height = canvas.height;
		rotateCtx.translate(rotateCanvas.width/2,rotateCanvas.height/2);
		rotateCtx.rotate(180 * Math.PI / 180);
		rotateCtx.drawImage(canvas, -canvas.width/2, -canvas.height/2);

		canvas.width = rotateCanvas.width;	
		canvas.height = rotateCanvas.height;	
		canvas.getContext("2d").clearRect(0,0,canvas.width, canvas.height);
		
		canvas.getContext("2d").drawImage(rotateCanvas, 0, 0);
		
	}
	
}

EditorUtils.drawActiveSelection = function(){

	//console.log("draw active selection");
	/*
	// get the offset of the canvas from the workspace container in canvasOffsetLef
	canvasOffsetLeft = (workspaceContainerDivRect.width - canvasDivRect.width*(globalZoom/100))/2;
	//canvasOffsetTop = (canvasDivRect.top - workspaceContainerDivRect.top)*(globalZoom/100);
	canvasOffsetTop = (canvasDivRect.top - workspaceContainerDivRect.top)*(globalZoom/100);
	*/

	if(typeof activeSelectionArea === 'undefined'){
	}else{
	
		//editorCtx.save();
		toolDrawCtx.save();
		
		// console.log("drawing active selection");
	
		if(activeSelectionArea.shape == "rectangle"){
		
			// console.log("draw active rectangular selection");
			
			toolDrawCtx.lineWidth = 1;
			toolDrawCtx.lineDashOffset = polyLassoLineOffset;
			
			var selectRect = new Object();
			selectRect.x = activeSelectionArea.geometry.x;
			selectRect.y = activeSelectionArea.geometry.y;
			selectRect.width = activeSelectionArea.geometry.width;
			selectRect.height = activeSelectionArea.geometry.height;
			
			EditorUtils.globalImageRotateActiveSelection(selectRect, "rectangle");
		
			// draw black dashed line over the white line to finish the selection box
			toolDrawCtx.strokeStyle = "#000000";
			toolDrawCtx.setLineDash([9,0]);
			toolDrawCtx.strokeRect((selectRect.x * (globalZoom/100) + 0.5 + canvasOffsetLeft), (selectRect.y * (globalZoom/100) + 0.5 + canvasOffsetTop), 
			(selectRect.width) * (globalZoom/100), (selectRect.height) * (globalZoom/100));
			
			
			// draw solid white line
			
			toolDrawCtx.strokeStyle = "#ffffff";
			toolDrawCtx.setLineDash([5,4]);
			toolDrawCtx.strokeRect((selectRect.x * (globalZoom/100) + 0.5 + canvasOffsetLeft), (selectRect.y * (globalZoom/100) + 0.5 + canvasOffsetTop), 
			(selectRect.width) * (globalZoom/100), (selectRect.height) * (globalZoom/100));
			
			
		}if(activeSelectionArea.shape == "ellipse"){
		
			toolDrawCtx.lineWidth = 1;
			toolDrawCtx.lineDashOffset = polyLassoLineOffset;
			
			var selectEllipse = new Object();
			selectEllipse.x = activeSelectionArea.geometry.x;
			selectEllipse.y = activeSelectionArea.geometry.y;
			selectEllipse.radiusX = activeSelectionArea.geometry.radiusX;
			selectEllipse.radiusY = activeSelectionArea.geometry.radiusY;		
			selectEllipse.rotation = activeSelectionArea.geometry.rotation;		
			selectEllipse.startAngle = activeSelectionArea.geometry.startAngle;		
			selectEllipse.endAngle = activeSelectionArea.geometry.endAngle;	

			EditorUtils.globalImageRotateActiveSelection(selectEllipse, "ellipse");			

			// draw black dashed line over the white line to finish the selection box
			toolDrawCtx.strokeStyle = "#000000";
			toolDrawCtx.setLineDash([9,0]);
			// Draw the rectangle
			// toolDrawCtx.strokeRect((squareSelectionRect.x + 0.5 + canvasOffsetLeft), (squareSelectionRect.y + 0.5 + canvasOffsetTop), (squareSelectionRect.width - 1), (squareSelectionRect.height - 1));
			// Draw the ellipse
			toolDrawCtx.beginPath();
			toolDrawCtx.ellipse(selectEllipse.x * (globalZoom/100) + canvasOffsetLeft, selectEllipse.y * (globalZoom/100) + canvasOffsetTop, selectEllipse.radiusX * (globalZoom/100), selectEllipse.radiusY * (globalZoom/100), selectEllipse.rotation, selectEllipse.startAngle, selectEllipse.endAngle);
			toolDrawCtx.stroke();			
			
			// draw solid white line
			
			toolDrawCtx.strokeStyle = "#ffffff";
			toolDrawCtx.setLineDash([5,4]);
			// Draw the rectangle
			// toolDrawCtx.strokeRect((squareSelectionRect.x + 0.5 + canvasOffsetLeft), (squareSelectionRect.y + 0.5 + canvasOffsetTop), (squareSelectionRect.width - 1), (squareSelectionRect.height - 1));
			// Draw the ellipse
			toolDrawCtx.beginPath();
			toolDrawCtx.ellipse(selectEllipse.x * (globalZoom/100) + canvasOffsetLeft, selectEllipse.y * (globalZoom/100) + canvasOffsetTop, selectEllipse.radiusX * (globalZoom/100), selectEllipse.radiusY * (globalZoom/100), selectEllipse.rotation, selectEllipse.startAngle, selectEllipse.endAngle);
			toolDrawCtx.stroke();	
			
		}else if(activeSelectionArea.shape == "freeform"){
		
			// A double click was made to finish defining the polygon lasso region by setting polyLassoDone = true
			// we have finished drawing the polygon lasso and will show as marching ants line 
			
			toolDrawCtx.beginPath();
			
			var selectFreeform = new Object();
			selectFreeform.points = [];
			for(let i = 0; i < activeSelectionArea.geometry.length; i++) {
				var p = new Object();
				p.x = activeSelectionArea.geometry[i].x;
				p.y = activeSelectionArea.geometry[i].y;
				selectFreeform.points.push(p);
			}
			
			EditorUtils.globalImageRotateActiveSelection(selectFreeform, "freeform");	
			
			let cntr = 0; // indicate that the first point is set
			for(let i = 0; i < selectFreeform.points.length; i++) {
			
				let point_x = selectFreeform.points[i].x * (globalZoom/100) + canvasOffsetLeft;
				let point_y = selectFreeform.points[i].y * (globalZoom/100) + canvasOffsetTop;
				
				if(cntr == 0){
					toolDrawCtx.moveTo(point_x, point_y);
				}else{
					toolDrawCtx.lineTo(point_x, point_y);
				}
				
				cntr++;

			}
			
			toolDrawCtx.closePath();
			
			toolDrawCtx.lineWidth = 1;
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
		
		}else if(activeSelectionArea.shape == "mask_shape"){
		
			// draw contours of the wand selection 
			// from magicwandexamplecode.js

			//console.log("mask shape");
			
			// cs is activeSelectionArea.geometry
			// cs = MagicWand.simplifyContours(cs, simplifyTolerant, simplifyCount);
			
			toolDrawCtx.lineWidth = 1;
			toolDrawCtx.lineDashOffset = polyLassoLineOffset;	
			
			var selectMask = [];
			
			for(var i = 0; i < activeSelectionArea.geometry.length; i++) {
				var pointsObj = new Object();
				pointsObj.inner = activeSelectionArea.geometry[i].inner;
				pointsObj.points = [];
				var ps = activeSelectionArea.geometry[i].points;
				for (var j = 0; j < ps.length; j++) {
				
					var tempObj = new Object();
					tempObj.x = ps[j].x;
					tempObj.y = ps[j].y;

					pointsObj.points.push(tempObj);
				}
				selectMask.push(pointsObj);
			}
			
			EditorUtils.globalImageRotateActiveSelection(selectMask, "mask_shape");	

			// Draw Inner Shape
			toolDrawCtx.beginPath();
			for (var i = 0; i < selectMask.length; i++) {
				if (!selectMask[i].inner) continue;
				var ps = selectMask[i].points;
				toolDrawCtx.moveTo(ps[0].x * (globalZoom/100) + canvasOffsetLeft, ps[0].y * (globalZoom/100) + canvasOffsetTop);
				for (var j = 1; j < ps.length; j++) {
					toolDrawCtx.lineTo(ps[j].x * (globalZoom/100) + canvasOffsetLeft, ps[j].y * (globalZoom/100) + canvasOffsetTop);
				}
			}
			
			// draw black dashed line over the white line to finish the selection box
			toolDrawCtx.strokeStyle = "#000000";
			toolDrawCtx.setLineDash([9,0]);
			toolDrawCtx.stroke();
			
			
			// draw solid white line
			toolDrawCtx.strokeStyle = "#ffffff";
			toolDrawCtx.setLineDash([5,4]);
			toolDrawCtx.stroke();				

			
			// Draw Outer Shape
			toolDrawCtx.beginPath();
			for (var i = 0; i < selectMask.length; i++) {
				if (selectMask[i].inner) continue;
				var ps = selectMask[i].points;
				toolDrawCtx.moveTo(ps[0].x * (globalZoom/100) + canvasOffsetLeft, ps[0].y * (globalZoom/100) + canvasOffsetTop);
				for (var j = 1; j < ps.length; j++) {
					toolDrawCtx.lineTo(ps[j].x * (globalZoom/100) + canvasOffsetLeft, ps[j].y * (globalZoom/100) + canvasOffsetTop);
				}
			}

			// draw black dashed line over the white line to finish the selection box
			toolDrawCtx.strokeStyle = "#000000";
			toolDrawCtx.setLineDash([9,0]);
			toolDrawCtx.stroke();
			
			
			// draw solid white line
			toolDrawCtx.strokeStyle = "#ffffff";
			toolDrawCtx.setLineDash([5,4]);
			toolDrawCtx.stroke();				
			
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

		
		//editorCtx.restore();
		toolDrawCtx.restore();
		
	}
}

// clears the selection region described by activeSelectionArea 
// in the context ctx
EditorUtils.clearSelectionRegion = function (ctx, offset = {x:0, y:0}){

	//alert(offset.x + "," + offset.y);

	//console.log(JSON.stringify(activeSelectionArea));
	//console.log(selectionActive);

	// 3. Perform Clipping - if there is a selection
	// alert(JSON.stringify(activeSelectionArea));
	if(typeof activeSelectionArea === "undefined"){
		// NO SELECTION TO CLEAR	
	}else{
	
		// alert("there is a selection");

		if(activeSelectionArea.shape == "rectangle"){
			// RECTANGULAR CLEARING
		
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
				ctx.globalCompositeOperation = 'destination-out';
				ctx.fillStyle = "rgba(0, 255, 0, 1)";
				// ctx.fillRect(activeSelectionArea.geometry.x - cumulativeNegatives.x, activeSelectionArea.geometry.y - cumulativeNegatives.y, activeSelectionArea.geometry.width, activeSelectionArea.geometry.height);
				//ctx.fillRect(activeSelectionArea.geometry.x - offset.x + 1, activeSelectionArea.geometry.y - offset.y, activeSelectionArea.geometry.width, activeSelectionArea.geometry.height);
				ctx.fillRect(activeSelectionArea.geometry.x - offset.x, activeSelectionArea.geometry.y - offset.y, activeSelectionArea.geometry.width + 1, activeSelectionArea.geometry.height + 1);
				ctx.restore();							
			}else{
				// KEEP ERASER STROKES ONLY OUTSIDE RACTANGULAR SELECTION
				ctx.save();
				ctx.globalCompositeOperation = 'destination-in';
				ctx.fillStyle = "rgba(0, 255, 0, 1)";
				//ctx.fillRect(activeSelectionArea.geometry.x - offset.x + 1, activeSelectionArea.geometry.y - offset.y, activeSelectionArea.geometry.width, activeSelectionArea.geometry.height);
				ctx.fillRect(activeSelectionArea.geometry.x - offset.x, activeSelectionArea.geometry.y - offset.y, activeSelectionArea.geometry.width, activeSelectionArea.geometry.height);						
				ctx.restore();								
			}
			
		}if(activeSelectionArea.shape == "ellipse"){
		

			if(!invertSelection){
				// Clear in the  Ellipse Selection
				ctx.save();
				ctx.globalCompositeOperation = 'destination-out';
				ctx.fillStyle = "rgba(0, 255, 0, 1)";
				ctx.beginPath();
				//ctx.ellipse(activeSelectionArea.geometry.x - cumulativeNegatives.x, activeSelectionArea.geometry.y - cumulativeNegatives.y, activeSelectionArea.geometry.radiusX, activeSelectionArea.geometry.radiusY, activeSelectionArea.geometry.rotation, activeSelectionArea.geometry.startAngle, activeSelectionArea.geometry.endAngle);
				ctx.ellipse(activeSelectionArea.geometry.x - offset.x, activeSelectionArea.geometry.y - offset.y, activeSelectionArea.geometry.radiusX + 1, activeSelectionArea.geometry.radiusY + 1, activeSelectionArea.geometry.rotation, activeSelectionArea.geometry.startAngle, activeSelectionArea.geometry.endAngle);
				ctx.fill();	
				ctx.restore();							
			}else{
				// CLEAR OUTSIDE Ellipse SELECTION
				ctx.save();
				ctx.globalCompositeOperation = 'destination-in';
				ctx.fillStyle = "rgba(0, 255, 0, 1)";
				ctx.beginPath();
				//ctx.ellipse(activeSelectionArea.geometry.x - cumulativeNegatives.x, activeSelectionArea.geometry.y - cumulativeNegatives.y, activeSelectionArea.geometry.radiusX, activeSelectionArea.geometry.radiusY, activeSelectionArea.geometry.rotation, activeSelectionArea.geometry.startAngle, activeSelectionArea.geometry.endAngle);
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
				
				// stroke adds padding to fully cature the selection region
				ctx.strokeStyle = "rgba(0, 255, 0, 1)";
				ctx.lineWidth = 2;
				ctx.stroke();
				
				ctx.restore();	
				
			}else{
			
				ctx.save();
				ctx.globalCompositeOperation = 'destination-in';
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
			
		}else if(activeSelectionArea.shape == "mask_shape"){
		
			// draw contours of the wand selection 
			// from magicwandexamplecode.js

			//console.log("mask shape");
			
			// cs is activeSelectionArea.geometry
			// cs = MagicWand.simplifyContours(cs, simplifyTolerant, simplifyCount);
			
			if(!invertSelection){
			
				// KEEP ERASER STROKES IN THE MASK SHAPE Selection
				ctx.save();
				ctx.globalCompositeOperation = 'destination-out';
				
				var expandCanvas = document.createElement("canvas");
				expandCanvas.width = ctx.canvas.width;
				expandCanvas.height = ctx.canvas.height;
				var expandCtx = expandCanvas.getContext("2d");
				
				expandCtx.fillStyle = "rgb(0,255,0)";
				// to expand the selection area affected
				expandCtx.lineWidth = 2;
				expandCtx.strokeStyle = "rgb(0,255,0)";
				
				//inner
				expandCtx.beginPath();
				for (var i = 0; i < activeSelectionArea.geometry.length; i++) {
					if (!activeSelectionArea.geometry[i].inner) continue;
					var ps = activeSelectionArea.geometry[i].points;
					expandCtx.moveTo(ps[0].x - offset.x, ps[0].y - offset.y);
					for (var j = 1; j < ps.length; j++) {
						expandCtx.lineTo(ps[j].x - offset.x, ps[j].y - offset.y);
					}
				} 
				expandCtx.fill(); 
				expandCtx.stroke(); 
				
				//outer
				expandCtx.beginPath();
				for (var i = 0; i < activeSelectionArea.geometry.length; i++) {
					if (activeSelectionArea.geometry[i].inner) continue;
					var ps = activeSelectionArea.geometry[i].points;
					expandCtx.moveTo(ps[0].x - offset.x, ps[0].y - offset.y);
					for (var j = 1; j < ps.length; j++) {
						expandCtx.lineTo(ps[j].x - offset.x, ps[j].y - offset.y);
					}
				}	
				expandCtx.fill();
				expandCtx.stroke(); 

				ctx.drawImage(expandCanvas, 0, 0);				
				
				/*
				//inner
				ctx.beginPath();
				for (var i = 0; i < activeSelectionArea.geometry.length; i++) {
					if (!activeSelectionArea.geometry[i].inner) continue;
					var ps = activeSelectionArea.geometry[i].points;
					ctx.moveTo(ps[0].x - offset.x, ps[0].y - offset.y);
					for (var j = 1; j < ps.length; j++) {
						ctx.lineTo(ps[j].x - offset.x, ps[j].y - offset.y);
					}
				} 
				ctx.fill(); 
				
				//outer
				ctx.beginPath();
				for (var i = 0; i < activeSelectionArea.geometry.length; i++) {
					if (activeSelectionArea.geometry[i].inner) continue;
					var ps = activeSelectionArea.geometry[i].points;
					ctx.moveTo(ps[0].x - offset.x, ps[0].y - offset.y);
					for (var j = 1; j < ps.length; j++) {
						ctx.lineTo(ps[j].x - offset.x, ps[j].y - offset.y);
					}
				}	
				ctx.fill(); 
				*/
								
				ctx.restore();	
			}else{
				// KEEP ERASER STROKES OUTSIDE THE MASK SHAPE Selection
				ctx.save();
				ctx.globalCompositeOperation = 'destination-in';

				var expandCanvas = document.createElement("canvas");
				expandCanvas.width = ctx.canvas.width;
				expandCanvas.height = ctx.canvas.height;
				var expandCtx = expandCanvas.getContext("2d");
				
				expandCtx.fillStyle = "rgb(0,255,0)";
				// to expand the selection area affected
				expandCtx.lineWidth = 2;
				expandCtx.strokeStyle = "rgb(0,255,0)";
				
				//inner
				expandCtx.beginPath();
				for (var i = 0; i < activeSelectionArea.geometry.length; i++) {
					if (!activeSelectionArea.geometry[i].inner) continue;
					var ps = activeSelectionArea.geometry[i].points;
					expandCtx.moveTo(ps[0].x - offset.x, ps[0].y - offset.y);
					for (var j = 1; j < ps.length; j++) {
						expandCtx.lineTo(ps[j].x - offset.x, ps[j].y - offset.y);
					}
				} 
				expandCtx.fill(); 
				expandCtx.stroke(); 
				
				//outer
				expandCtx.beginPath();
				for (var i = 0; i < activeSelectionArea.geometry.length; i++) {
					if (activeSelectionArea.geometry[i].inner) continue;
					var ps = activeSelectionArea.geometry[i].points;
					expandCtx.moveTo(ps[0].x - offset.x, ps[0].y - offset.y);
					for (var j = 1; j < ps.length; j++) {
						expandCtx.lineTo(ps[j].x - offset.x, ps[j].y - offset.y);
					}
				}	
				expandCtx.fill();
				expandCtx.stroke(); 

				ctx.drawImage(expandCanvas, 0, 0);				
				
				/*
				//inner
				ctx.beginPath();
				for (var i = 0; i < activeSelectionArea.geometry.length; i++) {
					if (!activeSelectionArea.geometry[i].inner) continue;
					var ps = activeSelectionArea.geometry[i].points;
					ctx.moveTo(ps[0].x - offset.x, ps[0].y - offset.y);
					for (var j = 1; j < ps.length; j++) {
						ctx.lineTo(ps[j].x - offset.x, ps[j].y - offset.y);
					}
				} 
				ctx.fill(); 
				
				//outer
				ctx.beginPath();
				for (var i = 0; i < activeSelectionArea.geometry.length; i++) {
					if (activeSelectionArea.geometry[i].inner) continue;
					var ps = activeSelectionArea.geometry[i].points;
					ctx.moveTo(ps[0].x - offset.x, ps[0].y - offset.y);
					for (var j = 1; j < ps.length; j++) {
						ctx.lineTo(ps[j].x - offset.x, ps[j].y - offset.y);
					}
				}	
				ctx.fill(); 
				*/
							
				ctx.restore();	
			}
			
		}				

	
	}// there is a selection
			
}

EditorUtils.addMoveActiveSelectionEntry = function(activeSelectionArea){

	if(!activeSelectionArea){
		return;
	}
	
	layerPanel.checkUnappliedEdit();

	if(activeSelectionArea.shape == "rectangle"){
		// move rectangle
		//alert("move rectangle");
		// selection rectangle
		var squareselect = new Object();
		squareselect.x = activeSelectionArea.geometry.x;
		squareselect.y = activeSelectionArea.geometry.y;
		squareselect.width = activeSelectionArea.geometry.width;
		squareselect.height = activeSelectionArea.geometry.height;
	
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
		selectEditEntry.edit_label = "Move Selection";
		selectEditEntry.selection = selectionArea;
		selectEditEntry.offsetLeft = mouseOffsetLeft;
		selectEditEntry.offsetTop = mouseOffsetTop;

		//alert(JSON.stringify(deleteEditEntry));
		
		// add selection to the edit stack
		editStack.add(selectEditEntry);
		applyEditHistory();		
		
	}if(activeSelectionArea.shape == "ellipse"){
		// check if the point is in the elliptical selection

		/*
		activeSelectionArea = {
			shape: "ellipse", 
			geometry: ellipticalSelection, 
			invert: invertSelection, 
			invert_rect: {x: 0, y:0, width: editorCanvas.width, height: editorCanvas.height}
		};
		*/
		
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
		
		//console.log(JSON.stringify(activeSelectionArea));
		
		// copy of local variable ellipticalSelection
		/*
		var ellipse = new Object();
		ellipse.x = activeSelectionArea.geoemetry.x;
		ellipse.y = activeSelectionArea.geoemetry.y;
		ellipse.radiusX = activeSelectionArea.geoemetry.radiusX;
		ellipse.radiusY = activeSelectionArea.geoemetry.radiusY;
		ellipse.rotation = activeSelectionArea.geoemetry.rotation;
		ellipse.startAngle = activeSelectionArea.geoemetry.startAngle;
		ellipse.endAngle = activeSelectionArea.geoemetry.endAngle;
		ellipse.anticlockwise = activeSelectionArea.geoemetry.anticlockwise;
		*/
		
		var rect = new Object();
		rect.x = 0;
		rect.y = 0;
		rect.width = editorCanvas.width;
		rect.height = editorCanvas.height;
		
		// object copy of activeSelectionArea
		var selectionArea = new Object();
		selectionArea.shape = "ellipse";
		//selectionArea.geometry = ellipse;
		selectionArea.geometry = JSON.parse(JSON.stringify(activeSelectionArea.geometry));
		selectionArea.invert = invertSelection;
		selectionArea.invert_rect = rect;
		
		var selectEditEntry = new Object();
		selectEditEntry.edit = "select";
		selectEditEntry.edit_label = "Move Selection";
		selectEditEntry.selection = selectionArea;
		selectEditEntry.offsetLeft = mouseOffsetLeft;
		selectEditEntry.offsetTop = mouseOffsetTop;

		//alert(JSON.stringify(deleteEditEntry));
		
		// add selection to the edit stack
		editStack.add(selectEditEntry);
		applyEditHistory();	
		
	}else if(activeSelectionArea.shape == "freeform"){
	
		
		var rect = new Object();
		rect.x = 0;
		rect.y = 0;
		rect.width = editorCanvas.width;
		rect.height = editorCanvas.height;
		
		var selectionArea = new Object();
		selectionArea.shape = "freeform";
		//selectionArea.geometry = lassoCoords;
		selectionArea.geometry = JSON.parse(JSON.stringify(activeSelectionArea.geometry));
		selectionArea.invert = invertSelection;
		selectionArea.invert_rect = rect;
		
		var selectEditEntry = new Object();
		selectEditEntry.edit = "select";
		selectEditEntry.edit_label = "Move Selection";
		selectEditEntry.selection = activeSelectionArea;
		selectEditEntry.offsetLeft = mouseOffsetLeft;
		selectEditEntry.offsetTop = mouseOffsetTop;

		//alert(JSON.stringify(deleteEditEntry));
		
		// add selection to the edit stack
		editStack.add(selectEditEntry);
	
		applyEditHistory();	

	}else if(activeSelectionArea.shape == "mask_shape"){
	
		
		var rect = new Object();
		rect.x = 0;
		rect.y = 0;
		rect.width = editorCanvas.width;
		rect.height = editorCanvas.height;
		
		var selectionArea = new Object();
		selectionArea.shape = "mask_shape";
		//selectionArea.geometry = lassoCoords;
		selectionArea.geometry = JSON.parse(JSON.stringify(activeSelectionArea.geometry));
		selectionArea.invert = invertSelection;
		selectionArea.invert_rect = rect;
		
		var selectEditEntry = new Object();
		selectEditEntry.edit = "select";
		selectEditEntry.edit_label = "Move Selection";
		selectEditEntry.selection = activeSelectionArea;
		selectEditEntry.offsetLeft = mouseOffsetLeft;
		selectEditEntry.offsetTop = mouseOffsetTop;

		//alert(JSON.stringify(deleteEditEntry));
		
		// add selection to the edit stack
		editStack.add(selectEditEntry);
	
		applyEditHistory();	
		
	}	
		
}

// draws the selection region described by activeSelectionArea 
// in the context ctx
EditorUtils.drawSelectionClipping = function(ctx, invertSelection, fill = "green",activeSelectionArea, useCumulative = true){

	// 1. Fill the whole draw canvas with green
	ctx.fillStyle = fill;	
	ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);	

	// 2. Perform Clipping - if there is a selection
	if(typeof activeSelectionArea === "undefined"){
		//alert("no selection to clip");
		// No selection active for clipping
		// UNCLIPPED ERASE STROKES
		// Do nothing to the eraser strokes canvas	

		ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);			
		
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
				if(useCumulative){
					ctx.fillRect(activeSelectionArea.geometry.x - layerStack[layerIndex].cumulativeNegatives.x, activeSelectionArea.geometry.y - layerStack[layerIndex].cumulativeNegatives.y, activeSelectionArea.geometry.width, activeSelectionArea.geometry.height);				
				}else{
					ctx.fillRect(activeSelectionArea.geometry.x, activeSelectionArea.geometry.y, activeSelectionArea.geometry.width, activeSelectionArea.geometry.height);					
				}
				ctx.restore();							
			}else{
				// KEEP ERASER STROKES ONLY OUTSIDE RACTANGULAR SELECTION
				ctx.save();
				ctx.globalCompositeOperation = 'destination-out';
				ctx.fillStyle = "rgba(0, 255, 0, 1)";
				if(useCumulative){
					ctx.fillRect(activeSelectionArea.geometry.x - layerStack[layerIndex].cumulativeNegatives.x, activeSelectionArea.geometry.y - layerStack[layerIndex].cumulativeNegatives.y, activeSelectionArea.geometry.width, activeSelectionArea.geometry.height);				
				}else{
					ctx.fillRect(activeSelectionArea.geometry.x, activeSelectionArea.geometry.y, activeSelectionArea.geometry.width, activeSelectionArea.geometry.height);					
				}
				ctx.restore();								
			}
	
		}if(activeSelectionArea.shape == "ellipse"){

			if(!invertSelection){
				// Clear in the  Ellipse Selection
				ctx.save();
				ctx.globalCompositeOperation = 'destination-in';
				ctx.fillStyle = "rgba(0, 255, 0, 1)";
				ctx.beginPath();
				if(useCumulative){
					ctx.ellipse(activeSelectionArea.geometry.x - layerStack[layerIndex].cumulativeNegatives.x, activeSelectionArea.geometry.y - layerStack[layerIndex].cumulativeNegatives.y, activeSelectionArea.geometry.radiusX, activeSelectionArea.geometry.radiusY, activeSelectionArea.geometry.rotation, activeSelectionArea.geometry.startAngle, activeSelectionArea.geometry.endAngle);
				}else{
					ctx.ellipse(activeSelectionArea.geometry.x, activeSelectionArea.geometry.y, activeSelectionArea.geometry.radiusX, activeSelectionArea.geometry.radiusY, activeSelectionArea.geometry.rotation, activeSelectionArea.geometry.startAngle, activeSelectionArea.geometry.endAngle);				
				}
				ctx.fill();	
				ctx.restore();							
			}else{
				// CLEAR OUTSIDE Ellipse SELECTION
				ctx.save();
				ctx.globalCompositeOperation = 'destination-out';
				ctx.fillStyle = "rgba(0, 255, 0, 1)";
				ctx.beginPath();
				if(useCumulative){
					ctx.ellipse(activeSelectionArea.geometry.x - layerStack[layerIndex].cumulativeNegatives.x, activeSelectionArea.geometry.y - layerStack[layerIndex].cumulativeNegatives.y, activeSelectionArea.geometry.radiusX, activeSelectionArea.geometry.radiusY, activeSelectionArea.geometry.rotation, activeSelectionArea.geometry.startAngle, activeSelectionArea.geometry.endAngle);
				}else{
					ctx.ellipse(activeSelectionArea.geometry.x, activeSelectionArea.geometry.y, activeSelectionArea.geometry.radiusX, activeSelectionArea.geometry.radiusY, activeSelectionArea.geometry.rotation, activeSelectionArea.geometry.startAngle, activeSelectionArea.geometry.endAngle);				
				}
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
				if(useCumulative){
					for(let i = 0; i < activeSelectionArea.geometry.length; i++) {
						if(i == 0){
							ctx.moveTo(activeSelectionArea.geometry[i].x - layerStack[layerIndex].cumulativeNegatives.x, activeSelectionArea.geometry[i].y - layerStack[layerIndex].cumulativeNegatives.y);
						}else{
							ctx.lineTo(activeSelectionArea.geometry[i].x - layerStack[layerIndex].cumulativeNegatives.x, activeSelectionArea.geometry[i].y - layerStack[layerIndex].cumulativeNegatives.y);
						}
					}				
				}else{
					for(let i = 0; i < activeSelectionArea.geometry.length; i++) {
						if(i == 0){
							ctx.moveTo(activeSelectionArea.geometry[i].x, activeSelectionArea.geometry[i].y);
						}else{
							ctx.lineTo(activeSelectionArea.geometry[i].x, activeSelectionArea.geometry[i].y);
						}
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
			
		}else if(activeSelectionArea.shape == "mask_shape"){
		
			// draw contours of the wand selection 
			// from magicwandexamplecode.js

			//console.log("mask shape");
			
			// cs is activeSelectionArea.geometry
			// cs = MagicWand.simplifyContours(cs, simplifyTolerant, simplifyCount);
			
			if(!invertSelection){
			
				// KEEP ERASER STROKES IN THE MASK SHAPE Selection
				ctx.save();
				ctx.globalCompositeOperation = 'destination-in';

				if(useCumulative){

					//inner
					ctx.beginPath();
					for (var i = 0; i < activeSelectionArea.geometry.length; i++) {
						if (!activeSelectionArea.geometry[i].inner) continue;
						var ps = activeSelectionArea.geometry[i].points;
						ctx.moveTo(ps[0].x - layerStack[layerIndex].cumulativeNegatives.x, ps[0].y  - layerStack[layerIndex].cumulativeNegatives.y);
						for (var j = 1; j < ps.length; j++) {
							ctx.lineTo(ps[j].x - layerStack[layerIndex].cumulativeNegatives.x, ps[j].y  - layerStack[layerIndex].cumulativeNegatives.y);
						}
					} 
					ctx.fill(); 
					
					//outer
					ctx.beginPath();
					for (var i = 0; i < activeSelectionArea.geometry.length; i++) {
						if (activeSelectionArea.geometry[i].inner) continue;
						var ps = activeSelectionArea.geometry[i].points;
						ctx.moveTo(ps[0].x - layerStack[layerIndex].cumulativeNegatives.x, ps[0].y - layerStack[layerIndex].cumulativeNegatives.y);
						for (var j = 1; j < ps.length; j++) {
							ctx.lineTo(ps[j].x - layerStack[layerIndex].cumulativeNegatives.x, ps[j].y - layerStack[layerIndex].cumulativeNegatives.y);
						}
					}	
					ctx.fill(); 
					
				}else{

					//inner
					ctx.beginPath();
					for (var i = 0; i < activeSelectionArea.geometry.length; i++) {
						if (!activeSelectionArea.geometry[i].inner) continue;
						var ps = activeSelectionArea.geometry[i].points;
						ctx.moveTo(ps[0].x, ps[0].y);
						for (var j = 1; j < ps.length; j++) {
							ctx.lineTo(ps[j].x, ps[j].y);
						}
					} 
					ctx.fill(); 
					
					//outer
					ctx.beginPath();
					for (var i = 0; i < activeSelectionArea.geometry.length; i++) {
						if (activeSelectionArea.geometry[i].inner) continue;
						var ps = activeSelectionArea.geometry[i].points;
						ctx.moveTo(ps[0].x, ps[0].y);
						for (var j = 1; j < ps.length; j++) {
							ctx.lineTo(ps[j].x, ps[j].y - layerStack[layerIndex].cumulativeNegatives.y);
						}
					}	
					ctx.fill(); 
					
				}
								
				ctx.restore();	
			}else{
				// KEEP ERASER STROKES OUTSIDE THE MASK SHAPE Selection
				ctx.save();
				ctx.globalCompositeOperation = 'destination-out';

				if(useCumulative){

					//inner
					ctx.beginPath();
					for (var i = 0; i < activeSelectionArea.geometry.length; i++) {
						if (!activeSelectionArea.geometry[i].inner) continue;
						var ps = activeSelectionArea.geometry[i].points;
						ctx.moveTo(ps[0].x - layerStack[layerIndex].cumulativeNegatives.x, ps[0].y  - layerStack[layerIndex].cumulativeNegatives.y);
						for (var j = 1; j < ps.length; j++) {
							ctx.lineTo(ps[j].x - layerStack[layerIndex].cumulativeNegatives.x, ps[j].y  - layerStack[layerIndex].cumulativeNegatives.y);
						}
					} 
					ctx.fill(); 
					
					//outer
					ctx.beginPath();
					for (var i = 0; i < activeSelectionArea.geometry.length; i++) {
						if (activeSelectionArea.geometry[i].inner) continue;
						var ps = activeSelectionArea.geometry[i].points;
						ctx.moveTo(ps[0].x - layerStack[layerIndex].cumulativeNegatives.x, ps[0].y - layerStack[layerIndex].cumulativeNegatives.y);
						for (var j = 1; j < ps.length; j++) {
							ctx.lineTo(ps[j].x - layerStack[layerIndex].cumulativeNegatives.x, ps[j].y - layerStack[layerIndex].cumulativeNegatives.y);
						}
					}	
					ctx.fill(); 
					
				}else{

					//inner
					ctx.beginPath();
					for (var i = 0; i < activeSelectionArea.geometry.length; i++) {
						if (!activeSelectionArea.geometry[i].inner) continue;
						var ps = activeSelectionArea.geometry[i].points;
						ctx.moveTo(ps[0].x, ps[0].y);
						for (var j = 1; j < ps.length; j++) {
							ctx.lineTo(ps[j].x, ps[j].y);
						}
					} 
					ctx.fill(); 
					
					//outer
					ctx.beginPath();
					for (var i = 0; i < activeSelectionArea.geometry.length; i++) {
						if (activeSelectionArea.geometry[i].inner) continue;
						var ps = activeSelectionArea.geometry[i].points;
						ctx.moveTo(ps[0].x, ps[0].y);
						for (var j = 1; j < ps.length; j++) {
							ctx.lineTo(ps[j].x, ps[j].y - layerStack[layerIndex].cumulativeNegatives.y);
						}
					}	
					ctx.fill(); 
					
				}
								
				ctx.restore();	
			}
			
		}
	
	}
			
}

EditorUtils.performSelectionArithmeticOperation = function(selectionLabel, operation, oldSelection, newSelection){
	// https://github.com/Tamersoul/magic-wand-js
	//alert(JSON.stringify(oldSelection));
	//alert(JSON.stringify(newSelection));
	
	var oldSelectionShapeCanvas = EditorUtils.createSelectionShapeCanvas(oldSelection);
	var newSelectionShapeCanvas = EditorUtils.createSelectionShapeCanvas(newSelection);
		
	var operationCanvas = document.createElement("canvas");
	var operationCtx = operationCanvas.getContext("2d");
	
	if(oldSelectionShapeCanvas.width >= newSelectionShapeCanvas.width){
		operationCanvas.width = oldSelectionShapeCanvas.width;
	}
	if(newSelectionShapeCanvas.width >= oldSelectionShapeCanvas.width){
		operationCanvas.width = newSelectionShapeCanvas.width;
	}
	
	if(oldSelectionShapeCanvas.height >= newSelectionShapeCanvas.height){
		operationCanvas.height = oldSelectionShapeCanvas.height;
	}
	if(newSelectionShapeCanvas.height >= oldSelectionShapeCanvas.height){
		operationCanvas.height = newSelectionShapeCanvas.height;
	}	
	
	// Union to join shapes by drawing on the same canvas
	if(operation == "union"){
		//alert("join shape");
		operationCtx.drawImage(oldSelectionShapeCanvas, 0, 0);
		operationCtx.drawImage(newSelectionShapeCanvas, 0, 0);
	}
	
	// Subtract to join shapes
	if(operation == "subtract"){
		operationCtx.drawImage(oldSelectionShapeCanvas, 0, 0);
		operationCtx.globalCompositeOperation = "destination-out";
		operationCtx.drawImage(newSelectionShapeCanvas, 0, 0);	
	}
	
	// Subtract to join shapes
	if(operation == "intersect"){
		operationCtx.drawImage(oldSelectionShapeCanvas, 0, 0);
		operationCtx.globalCompositeOperation = "destination-in";
		operationCtx.drawImage(newSelectionShapeCanvas, 0, 0);		
	}
	
	/*
	if(document.getElementById("testCanvas")){
		var testCanvas = document.getElementById("testCanvas");
		testCanvas.width = operationCanvas.width;
		testCanvas.height = operationCanvas.height;
		var testCtx = testCanvas.getContext("2d");
		testCtx.drawImage(operationCanvas, 0, 0);
	}
	*/



	/*
	// Below creates a mask with the magic wand pixel select 
	// HOWEVER I will  create a mask with the image data from the operation canvas
	
	// Mask is a 1,0 binary image of the flood fill area	
    var image = {
        data: operationCtx.getImageData(0, 0, operationCanvas.width, operationCanvas.height).data,
        width: operationCanvas.width,
        height: operationCanvas.height,
        bytes: 4
    };
	
	var currentThreshold = 15;
	var blurRadius = 0;
    var mask = MagicWand.floodFill(image, operationCanvas.width - 5, operationCanvas.height - 5, currentThreshold);
    mask = MagicWand.gaussBlurOnlyBorder(mask, blurRadius);
	console.log("wand mask");
	console.log(mask);
	*/
	

	var mask_data = [];
	let operationImageData = operationCtx.getImageData(0, 0, operationCtx.canvas.width, operationCtx.canvas.height);  			
	for (let i = 0; i < operationImageData.data.length; i += 4) {
		//operationImageData.data[i + 0] = eraseImageData.data[i + 0]; // R			
		//operationImageData.data[i + 1] = eraseImageData.data[i + 1]; // G			
		//operationImageData.data[i + 2] = eraseImageData.data[i + 2]; // B

		if(operationImageData.data[i + 3] > 0){
			mask_data.push(1);
		}else{
			mask_data.push(0);
		}
	}
	//operationCtx.putImageData(operationImageData, 0, 0);
	
	var operationRect = EditorUtils.getBoundingRectFromCanvas(operationCanvas);
	if(operationRect.right == operationCanvas.width){
		operationRect.right--;
	}
	if(operationRect.bottom == operationCanvas.height){
		operationRect.bottom--;
	}
	var my_mask = {
		data: new Uint8Array(mask_data),
		width: operationCanvas.width,
		height: operationCanvas.height,
		bounds: {
			minX: operationRect.left,
			minY: operationRect.top,
			maxX: operationRect.right,
			maxY: operationRect.bottom
		}		
	};
	//console.log("my mask:");
	//console.log(my_mask);
	
		
	/* mask contains
            data: result,
            width: image.width,
            height: image.height,
            bounds: {
                minX: minX,
                minY: minY,
                maxX: maxX,
                maxY: maxY
            }	
	*/

	
	if (!my_mask){
		//alert("no mask");
		return;
	}

	// Gets the border of the watershed mask as a polygon line
    let cs = MagicWand.traceContours(my_mask);
	var simplifyTolerant = 0;
	var simplifyCount = 30;
    cs = MagicWand.simplifyContours(cs, simplifyTolerant, simplifyCount);

	//console.log(cs);
	
	// Create the selection object and add it to the stack
	// outer rectangle
	var rect = new Object();
	rect.x = 0;
	rect.y = 0;
	rect.width = editorCanvas.width;
	rect.height = editorCanvas.height;
	
	var selectionArea = new Object();
	selectionArea.shape = "mask_shape";
	selectionArea.geometry = cs;
	selectionArea.invert = invertSelection;
	selectionArea.invert_rect = rect;	
	
	var selectEditEntry = new Object();
	selectEditEntry.edit = "select";
	selectEditEntry.edit_label = selectionLabel;
	selectEditEntry.selection = selectionArea;
	selectEditEntry.offsetLeft = mouseOffsetLeft;
	selectEditEntry.offsetTop = mouseOffsetTop;	
	
	// add selection to the edit stack
	editStack.add(selectEditEntry);
	applyEditHistory();
	
	
	// Test draw the mask selection 
	/*
	if(document.getElementById("testCanvas")){
	
		var testCanvas = document.getElementById("testCanvas");
		testCanvas.width = operationCanvas.width;
		testCanvas.height = operationCanvas.height;
		var ctx = testCanvas.getContext("2d");
		ctx.drawImage(operationCanvas, 0, 0);
		ctx.fillStyle = "#00ff00";

		// draw contours
		ctx.clearRect(0, 0, testCanvas.width, testCanvas.height);
		//inner
		ctx.beginPath();
		for (var i = 0; i < cs.length; i++) {
			if (!cs[i].inner) continue;
			var ps = cs[i].points;
			ctx.moveTo(ps[0].x, ps[0].y);
			for (var j = 1; j < ps.length; j++) {
				ctx.lineTo(ps[j].x, ps[j].y);
			}
		}
		ctx.strokeStyle = "red";
		//ctx.stroke();    
		ctx.fill();    
		//outer
		ctx.beginPath();
		for (var i = 0; i < cs.length; i++) {
			if (cs[i].inner) continue;
			var ps = cs[i].points;
			ctx.moveTo(ps[0].x, ps[0].y);
			for (var j = 1; j < ps.length; j++) {
				ctx.lineTo(ps[j].x, ps[j].y);
			}
		}
		ctx.strokeStyle = "blue";
		//ctx.stroke(); 	
		ctx.fill(); 	
	}
	*/
	
}	

EditorUtils.createSelectionShapeCanvas = function(activeSelectionArea){

	var canvas = document.createElement("canvas");
	var ctx = canvas.getContext("2d");

	// 2. Perform Clipping - if there is a selection
	if(typeof activeSelectionArea === "undefined"){
		//alert("no selection to clip");
		// No selection active for clipping
		// UNCLIPPED ERASE STROKES
		// Do nothing to the eraser strokes canvas	

		return;		
		
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
			
			canvas.width = activeSelectionArea.geometry.x + activeSelectionArea.geometry.width;
			canvas.height = activeSelectionArea.geometry.y + activeSelectionArea.geometry.height;
		
			ctx.save();
			ctx.fillStyle = "rgba(0, 255, 0, 1)";
			ctx.fillRect(activeSelectionArea.geometry.x, activeSelectionArea.geometry.y, activeSelectionArea.geometry.width, activeSelectionArea.geometry.height);					
			ctx.restore();							

		}if(activeSelectionArea.shape == "ellipse"){
		
			canvas.width = activeSelectionArea.geometry.x + activeSelectionArea.geometry.radiusX;
			canvas.height = activeSelectionArea.geometry.y + activeSelectionArea.geometry.radiusY;

			ctx.save();
			ctx.fillStyle = "rgba(0, 255, 0, 1)";
			ctx.beginPath();
			ctx.ellipse(activeSelectionArea.geometry.x, activeSelectionArea.geometry.y, activeSelectionArea.geometry.radiusX, activeSelectionArea.geometry.radiusY, activeSelectionArea.geometry.rotation, activeSelectionArea.geometry.startAngle, activeSelectionArea.geometry.endAngle);				
			ctx.fill();	
			ctx.restore();								
		
		}else if(activeSelectionArea.shape == "freeform"){
			// FREEFORM/POLYGON CLIPPING OF ERASING

			/*
			We use composite operations to generate the clipping of the brush strokes with the freeform selection
			https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/globalCompositeOperation
			
				KEEP BRUSH STROKES IN
				where we want to keep the brush in the freeform polygon selection we set destination-in then draw
				the polygon clipping area.
			*/
			
			var max_x = 0, max_y = 0;
			for(let i = 0; i < activeSelectionArea.geometry.length; i++) {
				if(max_x < activeSelectionArea.geometry[i].x){
					max_x = activeSelectionArea.geometry[i].x;
				}
				if(max_y < activeSelectionArea.geometry[i].y){
					max_y = activeSelectionArea.geometry[i].y;
				}
			}
			
			canvas.width = max_x;
			canvas.height = max_y;
			
			// Keep the brushstrokes that are in the polygon selection overlay shape
			ctx.save();
			ctx.fillStyle = "rgba(0, 255, 0, 1)";
			ctx.beginPath();
			for(let i = 0; i < activeSelectionArea.geometry.length; i++) {
				if(i == 0){
					ctx.moveTo(activeSelectionArea.geometry[i].x, activeSelectionArea.geometry[i].y);
				}else{
					ctx.lineTo(activeSelectionArea.geometry[i].x, activeSelectionArea.geometry[i].y);
				}
			}	
			ctx.closePath();
			ctx.fill();
			ctx.restore();	
			
		}
	}

	return canvas;	
}

EditorUtils.checkPointInActiveSelection = function(ctx, point_x, point_y){

	
	var pixel = ctx.getImageData(point_x, point_y, 1, 1);
	var data = pixel.data;
	
	//console.log(data[3]);
	
	if(data[3] > 0){
		return true;
	}
	
	return false;		
}

// Moves the selection by move_x, move_y
EditorUtils.moveActiveSelection = function(selection, move_x, move_y){

	if(!selection){
		return;
	}
	
	//console.log("move");

	if(selection.shape == "rectangle"){
	
		selection.geometry.x += move_x;
		selection.geometry.y += move_y;
		
	}if(selection.shape == "ellipse"){
	
		selection.geometry.x += move_x;
		selection.geometry.y += move_y;
		
	}else if(selection.shape == "freeform"){
		// we have to loop through all the points in the shape and move them
		for(var i = 0; i < selection.geometry.length; i++){
			selection.geometry[i].x += move_x;
			selection.geometry[i].y += move_y;
		}
	}else if(activeSelectionArea.shape == "mask_shape"){
	
		// Move Inner Shape
		for (var i = 0; i < activeSelectionArea.geometry.length; i++) {
			//if (!activeSelectionArea.geometry[i].inner) continue;
			for (var j = 0; j < activeSelectionArea.geometry[i].points.length; j++) {
				activeSelectionArea.geometry[i].points[j].x += move_x; 
				activeSelectionArea.geometry[i].points[j].y += move_y; 
			}
		}
		
		
		// Move Outer Shape
		/*
		for (var i = 0; i < activeSelectionArea.geometry.length; i++) {
			if (activeSelectionArea.geometry[i].inner) continue;
			for (var j = 0; j < activeSelectionArea.geometry[i].points; j++) {
				activeSelectionArea.geometry[i].points[j].x += move_x; 
				activeSelectionArea.geometry[i].points[j].y += move_y; 
			}
		}	
		*/
	}	
	
	return false;
		
};

// clips the selection region described by activeSelectionArea 
// in the context ctx
EditorUtils.clipSelectionRegion = function(ctx, offset = {x:0, y:0}){

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
			
		}else if(activeSelectionArea.shape == "mask_shape"){
		
			// draw contours of the wand selection 
			// from magicwandexamplecode.js

			//console.log("mask shape");
			
			// cs is activeSelectionArea.geometry
			// cs = MagicWand.simplifyContours(cs, simplifyTolerant, simplifyCount);
			
			if(!invertSelection){
			
				// KEEP ERASER STROKES IN THE MASK SHAPE Selection
				ctx.save();
				ctx.globalCompositeOperation = 'destination-in';
				
				var expandCanvas = document.createElement("canvas");
				expandCanvas.width = ctx.canvas.width;
				expandCanvas.height = ctx.canvas.height;
				var expandCtx = expandCanvas.getContext("2d");
				
				expandCtx.fillStyle = "rgb(0,255,0)";
				// to expand the selection area affected
				expandCtx.lineWidth = 2;
				expandCtx.strokeStyle = "rgb(0,255,0)";
				
				//inner
				expandCtx.beginPath();
				for (var i = 0; i < activeSelectionArea.geometry.length; i++) {
					if (!activeSelectionArea.geometry[i].inner) continue;
					var ps = activeSelectionArea.geometry[i].points;
					expandCtx.moveTo(ps[0].x - offset.x, ps[0].y - offset.y);
					for (var j = 1; j < ps.length; j++) {
						expandCtx.lineTo(ps[j].x - offset.x, ps[j].y - offset.y);
					}
				} 
				expandCtx.fill(); 
				expandCtx.stroke(); 
				
				//outer
				expandCtx.beginPath();
				for (var i = 0; i < activeSelectionArea.geometry.length; i++) {
					if (activeSelectionArea.geometry[i].inner) continue;
					var ps = activeSelectionArea.geometry[i].points;
					expandCtx.moveTo(ps[0].x - offset.x, ps[0].y - offset.y);
					for (var j = 1; j < ps.length; j++) {
						expandCtx.lineTo(ps[j].x - offset.x, ps[j].y - offset.y);
					}
				}	
				expandCtx.fill();
				expandCtx.stroke(); 

				ctx.drawImage(expandCanvas, 0, 0);				
				
				/*
				//inner
				ctx.beginPath();
				for (var i = 0; i < activeSelectionArea.geometry.length; i++) {
					if (!activeSelectionArea.geometry[i].inner) continue;
					var ps = activeSelectionArea.geometry[i].points;
					ctx.moveTo(ps[0].x - offset.x, ps[0].y - offset.y);
					for (var j = 1; j < ps.length; j++) {
						ctx.lineTo(ps[j].x - offset.x, ps[j].y - offset.y);
					}
				} 
				ctx.fill(); 
				
				//outer
				ctx.beginPath();
				for (var i = 0; i < activeSelectionArea.geometry.length; i++) {
					if (activeSelectionArea.geometry[i].inner) continue;
					var ps = activeSelectionArea.geometry[i].points;
					ctx.moveTo(ps[0].x - offset.x, ps[0].y - offset.y);
					for (var j = 1; j < ps.length; j++) {
						ctx.lineTo(ps[j].x - offset.x, ps[j].y - offset.y);
					}
				}	
				ctx.fill(); 
				*/
								
				ctx.restore();	
			}else{
				// KEEP ERASER STROKES OUTSIDE THE MASK SHAPE Selection
				ctx.save();
				ctx.globalCompositeOperation = 'destination-out';

				var expandCanvas = document.createElement("canvas");
				expandCanvas.width = ctx.canvas.width;
				expandCanvas.height = ctx.canvas.height;
				var expandCtx = expandCanvas.getContext("2d");
				
				expandCtx.fillStyle = "rgb(0,255,0)";
				// to expand the selection area affected
				expandCtx.lineWidth = 2;
				expandCtx.strokeStyle = "rgb(0,255,0)";
				
				//inner
				expandCtx.beginPath();
				for (var i = 0; i < activeSelectionArea.geometry.length; i++) {
					if (!activeSelectionArea.geometry[i].inner) continue;
					var ps = activeSelectionArea.geometry[i].points;
					expandCtx.moveTo(ps[0].x - offset.x, ps[0].y - offset.y);
					for (var j = 1; j < ps.length; j++) {
						expandCtx.lineTo(ps[j].x - offset.x, ps[j].y - offset.y);
					}
				} 
				expandCtx.fill(); 
				expandCtx.stroke(); 
				
				//outer
				expandCtx.beginPath();
				for (var i = 0; i < activeSelectionArea.geometry.length; i++) {
					if (activeSelectionArea.geometry[i].inner) continue;
					var ps = activeSelectionArea.geometry[i].points;
					expandCtx.moveTo(ps[0].x - offset.x, ps[0].y - offset.y);
					for (var j = 1; j < ps.length; j++) {
						expandCtx.lineTo(ps[j].x - offset.x, ps[j].y - offset.y);
					}
				}	
				expandCtx.fill();
				expandCtx.stroke(); 

				ctx.drawImage(expandCanvas, 0, 0);				
				
				/*
				//inner
				ctx.beginPath();
				for (var i = 0; i < activeSelectionArea.geometry.length; i++) {
					if (!activeSelectionArea.geometry[i].inner) continue;
					var ps = activeSelectionArea.geometry[i].points;
					ctx.moveTo(ps[0].x - offset.x, ps[0].y - offset.y);
					for (var j = 1; j < ps.length; j++) {
						ctx.lineTo(ps[j].x - offset.x, ps[j].y - offset.y);
					}
				} 
				ctx.fill(); 
				
				//outer
				ctx.beginPath();
				for (var i = 0; i < activeSelectionArea.geometry.length; i++) {
					if (activeSelectionArea.geometry[i].inner) continue;
					var ps = activeSelectionArea.geometry[i].points;
					ctx.moveTo(ps[0].x - offset.x, ps[0].y - offset.y);
					for (var j = 1; j < ps.length; j++) {
						ctx.lineTo(ps[j].x - offset.x, ps[j].y - offset.y);
					}
				}	
				ctx.fill(); 
				*/
							
				ctx.restore();	
			}
			
		}				

	
	}// there is a selection
			
}

// Finds and returns the midway point between two points
EditorUtils.midPointBtw = function (p1, p2) {
  return {
    x: p1.x + (p2.x - p1.x) / 2,
    y: p1.y + (p2.y - p1.y) / 2
  };
}


// Make the DIV element draggable:
//dragElement(document.getElementById("mydiv"));

EditorUtils.dragDialog = function(elmnt) {
  var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  if (document.getElementById(elmnt.id + "header")) {
    // if present, the header is where you move the DIV from:
    document.getElementById(elmnt.id + "header").onmousedown = dragMouseDown;
  } else {
    // otherwise, move the DIV from anywhere inside the DIV: 
    elmnt.onmousedown = dragMouseDown;
  }

  function dragMouseDown(e) {
    e = e || window.event;
    e.preventDefault();
    // get the mouse cursor position at startup:
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    // call a function whenever the cursor moves:
    document.onmousemove = elementDrag;
  }

  function elementDrag(e) {
    e = e || window.event;
    e.preventDefault();
    // calculate the new cursor position:
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    // set the element's new position:
    elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
    elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
  }

  function closeDragElement() {
    // stop moving when mouse button is released:
    document.onmouseup = null;
    document.onmousemove = null;
  }
};


EditorUtils.getLayerRasterMaskOffset = function(layer){
	// This calculates the offset of the raster_mask with respect to the layer using there cumulativeNegatives with respect to the image canvas
	return {x: layer.raster_mask.cumulativeNegatives.x - layer.cumulativeNegatives.x,
			y: layer.raster_mask.cumulativeNegatives.y - layer.cumulativeNegatives.y};
}

EditorUtils.createLayerCopy = function(layerObject){

	var copyLayer = JSON.parse(JSON.stringify(layerStack[layerIndex]));
	
	// draw layer canvas to copy layer 
	copyLayer.canvas = EditorUtils.createCanvasCopy(layerObject.canvas); 
	

	if('raster_mask' in layerObject){
		// draw raster canvas to copy layer
		copyLayer.raster_mask.canvas = EditorUtils.createCanvasCopy(layerObject.raster_mask.canvas); 
		
		// draw raster opacity canvas to copy layer
		copyLayer.raster_mask.opacity_canvas = EditorUtils.createCanvasCopy(layerObject.raster_mask.opacity_canvas); 
	}
	

	
	return copyLayer;
}

EditorUtils.createCanvasCopy = function(canvas){

	var copyCanvas = document.createElement("canvas");
	copyCanvas.width = canvas.width;
	copyCanvas.height = canvas.height;
	var copyCtx = copyCanvas.getContext("2d");
	copyCtx.drawImage(canvas, 0, 0);

	return copyCanvas;
}


// Generate a canvas that is a translated relative to the editor, resized version of the passed canvas 
EditorUtils.getTranslatedImageCanvas = function(untranslatedCanvas, translateX, translateY){

	// 1. Image canvas holds the original edit image
	let imageCanvas = document.createElement("canvas");
	imageCanvas.width = untranslatedCanvas.width; 
	imageCanvas.height = untranslatedCanvas.height; 
	let imageCtx = imageCanvas.getContext("2d");


	// IF THE IMAGE IS MOVED IN ITS OWN CANVAS THE IMAGE CANVAS HAS TO BE RESIZED
	imageCanvas.width += Math.abs(translateX);	
	imageCanvas.height += Math.abs(translateY);				
	//alert(imageCanvas.width + "," + imageCanvas.height);
	
	// For visualizing the resized canvas area
	//imageCtx.fillStyle = "rgba(0, 255, 0, .1)";
	//imageCtx.fillRect(0,0,imageCanvas.width,imageCanvas.height);
	
	//imageCtx.translate(translateX, translateY);
	
	// For any positive translation we offset the image in the resized canvas
	// If negative we leave leave to draw image 0
	if(translateX >= 0){
		imageCtx.translate(translateX, 0);
	}
	if(translateY >= 0){
		imageCtx.translate(0, translateY);
	}

	imageCtx.drawImage(untranslatedCanvas, 0, 0);

	// Trim the canvas
	/*
	if(cumulativeTranslations.x >= 0){
		// trim the canvas right
		// trimCanvas(canvas, top, left, bottom, right);
		imageCanvas = trimCanvas(imageCanvas, false, false, false, true);
	}

	if(cumulativeTranslations.y >= 0){
		// trim the canvas bottom
		// trimCanvas(canvas, top, left, bottom, right);
		imageCanvas = trimCanvas(imageCanvas, false, false, true, false);
	}
	*/
	
	//console.log("image dimensions:" + imageCanvas.width + "," + imageCanvas.height);
	
	// For visualizing canvas size changes
	// canvasWidth = imageCanvas.width;
	// canvasHeight = imageCanvas.height;

	return imageCanvas;			
}


// Changes the grayscale values in a canvas to opacity by applying the pixel value to the alpha value
EditorUtils.changeGrayScaleToOpacity = function(canvas){

	var applyLayerMaskCanvas = document.createElement("canvas");
	applyLayerMaskCanvas.width = canvas.width;
	applyLayerMaskCanvas.height = canvas.height;	
	var applyLayerMaskCtx = applyLayerMaskCanvas.getContext("2d");
	applyLayerMaskCtx.drawImage(canvas, 0, 0);

	var imgData = applyLayerMaskCtx.getImageData(0, 0, applyLayerMaskCanvas.width, applyLayerMaskCanvas.height);

	for (var k = 0; k < imgData.data.length; k += 4) {
		//imgData.data[k] = 255-imgData.data[k];		
		//imgData.data[k + 1] = 255-imgData.data[k + 1];
		//imgData.data[k + 2] = 255-imgData.data[k + 2];
		imgData.data[k + 1] = 255;
		imgData.data[k + 3] = imgData.data[k]; 	// assume the RGB values are all the same owing to the fact that raster mask
												// should be grayscale
		//imgData.data[k + 3] = 255 - imgData.data[k]; // we keep blacks and use destination-out operation in rastermask
	}		
	applyLayerMaskCtx.putImageData(imgData, 0, 0);	

	return applyLayerMaskCanvas;	
}


EditorUtils.translateLayerRasterMask = function(rasterMaskObject, translate_x, translate_y){

	// TRANSLATE THE RASTER MASK
	var translatedRasterMask = EditorUtils.getTranslatedImageCanvas(rasterMaskObject.canvas, translate_x, translate_y);
	//alert(translate_x + "," + translate_y);
	var rasterCtx = rasterMaskObject.canvas.getContext("2d");
	rasterCtx.canvas.width = translatedRasterMask.width; // resize layer canvas
	rasterCtx.canvas.height = translatedRasterMask.height; // resize layer canvas
	rasterCtx.clearRect(0,0, rasterCtx.canvas.width, rasterCtx.canvas.height);
	rasterCtx.save();
	rasterCtx.fillStyle = rasterMaskObject.fill;
	rasterCtx.fillRect(0,0, rasterCtx.canvas.width, rasterCtx.canvas.height);			
	rasterCtx.restore();			
	rasterCtx.drawImage(translatedRasterMask, 0, 0);
	
	// generate the opacity mask from the raster mask and set to opacity_mask
	rasterMaskObject.opacity_canvas = EditorUtils.changeGrayScaleToOpacity(rasterMaskObject.canvas);
	
	//alert(JSON.stringify(rasterMaskObject));
	
	
	rasterMaskObject.cumulativeTranslations.x += translate_x;
	rasterMaskObject.cumulativeTranslations.y += translate_y;
	
	if(translate_x < 0){
		rasterMaskObject.cumulativeNegatives.x += translate_x;
	}
	
	if(translate_y < 0){
		rasterMaskObject.cumulativeNegatives.y += translate_y;
	}
	
}

// Gets a rgba array from a hex or word fill color
EditorUtils.getRGBAArrayFromFillColor = function(fill){
	var canvas = document.createElement("canvas");
	canvas.width = 5;
	canvas.height = 5;
	var ctx = canvas.getContext("2d");
	ctx.fillStyle = fill;
	ctx.fillRect(0,0,5,5);
	var pixel = ctx.getImageData(0, 0, 1, 1);
	return pixel.data;
}

// Updates the gradient preview in the toolbar of the gradient tool
EditorUtils.updateGradientToolbarPreview = function(){

	// If there is an element id "toolbarGradientPreviewCanvas"
	if(document.getElementById("toolbarGradientPreviewCanvas")){
	

		var toolbarGradientPreviewCanvas = document.getElementById("toolbarGradientPreviewCanvas");
		var toolbarGradientPreviewCtx = toolbarGradientPreviewCanvas.getContext("2d");	
	
		if (localStorage.getItem("gradient_settings") === null) {
		
			// No stored gradient settings
		
			// Use foreground-background-color
			// Create gradient
			var grd = toolbarGradientPreviewCtx.createLinearGradient(0, 0, toolbarGradientPreviewCanvas.width, 0);
			grd.addColorStop(0, foregroundColorInput.value);
			grd.addColorStop(1, backgroundColorInput.value);

			// Fill with gradient
			toolbarGradientPreviewCtx.fillStyle = grd;
			toolbarGradientPreviewCtx.fillRect(0, 0, toolbarGradientPreviewCanvas.width, toolbarGradientPreviewCanvas.height);	
			
		}else{
		
			var gradientSettings = JSON.parse(localStorage.getItem("gradient_settings"));
			//alert(gradientSettings.gradient_object.type);
			
			if(gradientSettings.gradient_object.type == "foreground_background"){
			
				// USE THE FOREGROUND/BACKGROUND COLOR
				// Create gradient
				var grd = toolbarGradientPreviewCtx.createLinearGradient(0, 0, toolbarGradientPreviewCanvas.width, 0);
				grd.addColorStop(0, foregroundColorInput.value);
				grd.addColorStop(1, backgroundColorInput.value);

				// Fill with gradient
				toolbarGradientPreviewCtx.fillStyle = grd;
				toolbarGradientPreviewCtx.fillRect(0, 0, toolbarGradientPreviewCanvas.width, toolbarGradientPreviewCanvas.height);	
				
			}else if(gradientSettings.gradient_object.type == "color_stop_array"){
			
				// USE THE STORED GRADIENT OBJECT
				
				//alert(JSON.stringify(gradientSettings.gradient_object.color_stop_array));
				
				var colorStops = gradientSettings.gradient_object.color_stop_array;
				
				var grd = toolbarGradientPreviewCtx.createLinearGradient(0, 0, toolbarGradientPreviewCanvas.width, 0);
				for(var i = 0; i < colorStops.length; i++){
					grd.addColorStop(colorStops[i].stop, colorStops[i].color);
				}
				
				// Fill with gradient
				toolbarGradientPreviewCtx.fillStyle = grd;
				toolbarGradientPreviewCtx.fillRect(0, 0, toolbarGradientPreviewCanvas.width, toolbarGradientPreviewCanvas.height);	
				
			}
			
			
			// set the tool option elements
			if(document.getElementById("gradientTypeSelect")){
				document.getElementById("gradientTypeSelect").value = gradientSettings.type;
			}
			if(document.getElementById("gradientAlphaInput")){
				document.getElementById("gradientAlphaInput").value = gradientSettings.opacity;
			}
			if(document.getElementById("gradientBlendingModeInput")){
				document.getElementById("gradientBlendingModeInput").value = gradientSettings.blend_mode;
			}
			
		}

		
	}


}

EditorUtils.saveGradient = function(gradient, type, opacity, blend_mode){
	//alert(gradient + "," + type + "," + opacity + "," + blend_mode);
	
	var gradientSettings = {};

	if(gradient){
		// set to sent gradient object
		gradientSettings.gradient_object = gradient;	
	}else{

		// undefined gradient sent default to type foreground/background color
		var gradientObj = new Object();
		gradientObj.type = "foreground_background";
		
		gradientSettings.gradient_object = gradientObj;	
	}
	
	if(type){
		gradientSettings.type = type;
	}
	
	if(opacity){
		gradientSettings.opacity = opacity;
	}
	
	if(blend_mode){
		gradientSettings.blend_mode = blend_mode;
	}
	
	localStorage.setItem("gradient_settings", JSON.stringify(gradientSettings));	
}

EditorUtils.gradientEditorDialogShowColorStops = function(){
	document.getElementById("gradientEditorColorStopsEditorContainerDiv").style.display = "block";
	document.getElementById("presetGradientsListContainerDiv").style.display = "none";
	document.getElementById("colorStopEditTab").style = "cursor: pointer; color: #ffffff; padding: 2px 16px 2px 14px; background-color: rgb(114,115,118); border-radius: 1px;";
	document.getElementById("presetGradientsTab").style.backgroundColor = "rgb(74, 75, 78)";	
	document.getElementById("presetGradientsTab").style.color = "#bbb";
}

EditorUtils.gradientEditorDialogShowPresets = function(){
	document.getElementById("gradientEditorColorStopsEditorContainerDiv").style.display = "none";
	document.getElementById("presetGradientsListContainerDiv").style.display = "block";
	document.getElementById("presetGradientsTab").style = "cursor: pointer; color: #ffffff; padding: 2px 16px 2px 14px; background-color: rgb(114,115,118); border-radius: 1px;";
	document.getElementById("colorStopEditTab").style.backgroundColor = "rgb(74, 75, 78)";	
	document.getElementById("colorStopEditTab").style.color = "#bbb";	
}

// Creates The Gradient Editor Dialog then opens it
EditorUtils.createGradientEditorDialog = function(){

	if (localStorage.getItem("gradient_settings") === null) {
		return;	
	}
	var colorStops = EditorUtils.getStoredGradientColorStops();

	// build the body of the Save Image dialog
	var gradientEditorDialogBody = document.createElement("div");
	gradientEditorDialogBody.style = "min-width: 436px;";
	
	/*
		var gradientEditorNewStopColorPicker = document.createElement("input");
		gradientEditorNewStopColorPicker.id = "gradientEditorNewStopColorPicker";
		gradientEditorNewStopColorPicker.style = "display: none;";
		gradientEditorNewStopColorPicker.type = "color";
		gradientEditorNewStopColorPicker.value = "#ffffff";
		gradientEditorNewStopColorPicker.onchange = function(){
			//alert(this.value);
		}
	gradientEditorDialogBody.appendChild(gradientEditorNewStopColorPicker);
	*/
	
	
	//gradientEditorDialogBody.appendChild(document.createElement("br"));
	// color stop editor tab selector button
		var colorStopEditTab = document.createElement("span");
		colorStopEditTab.id = "colorStopEditTab";
		colorStopEditTab.style = "cursor: pointer; user-select: none; color: #ffffff; padding: 2px 16px 2px 14px; background-color: rgb(114,115,118); border-radius: 1px;";
		colorStopEditTab.appendChild(document.createTextNode("Edit"));
		colorStopEditTab.onclick = function(){
			EditorUtils.gradientEditorDialogShowColorStops();
		}
	gradientEditorDialogBody.appendChild(colorStopEditTab);	
	
	// space the tab buttons
	gradientEditorDialogBody.appendChild(document.createTextNode('\u00A0'));// unicode space character		
	gradientEditorDialogBody.appendChild(document.createTextNode('\u00A0'));// unicode space character
	gradientEditorDialogBody.appendChild(document.createTextNode('\u00A0'));// unicode space character
	gradientEditorDialogBody.appendChild(document.createTextNode('\u00A0'));// unicode space character
	
		var presetGradientsTab = document.createElement("span");
		presetGradientsTab.id = "presetGradientsTab";
		presetGradientsTab.style = "cursor: pointer; user-select: none; padding: 2px 16px 2px 14px;";
		presetGradientsTab.appendChild(document.createTextNode("Presets"));
		presetGradientsTab.onclick = function(){
			//alert("Select a gradient");
			EditorUtils.gradientEditorDialogShowPresets();
		}
	gradientEditorDialogBody.appendChild(presetGradientsTab);	
	
	gradientEditorDialogBody.appendChild(document.createElement("br"));	
	gradientEditorDialogBody.appendChild(document.createElement("br"));	
	
	// 1. Holds all the color stops editor components
	var gradientEditorColorStopsEditorContainerDiv = document.createElement("div");
	gradientEditorColorStopsEditorContainerDiv.id = "gradientEditorColorStopsEditorContainerDiv";
	
	// 2. Holds the List of preset gradients
	var presetGradientsListContainerDiv = document.createElement("div");
	presetGradientsListContainerDiv.id = "presetGradientsListContainerDiv";
	presetGradientsListContainerDiv.style = "display: none;";
	

		// 1. Create a canvas that displays the gradient
		var gradientEditorProfileCanvas = document.createElement("canvas");
		gradientEditorProfileCanvas.id = "gradientEditorProfileCanvas";
		gradientEditorProfileCanvas.width = 380;
		gradientEditorProfileCanvas.height = 32 + (gradientEditorProfileCanvasPadding*2); // gradient will have height of 32 with 10px spacing at above and below in the canvas for stop indicators
		var gradientEditorProfileCtx = gradientEditorProfileCanvas.getContext("2d");
		
		// Click The gradient to add color stop
		gradientEditorProfileCanvas.onclick = function(e){
			//alert((e.pageX - this.offsetLeft) + "," + (e.pageY- this.offsetTop));
			
			// 1. Get position of click in the canvas
			var gradientCanvasBox = document.getElementById("gradientEditorProfileCanvas").getBoundingClientRect();
			var clickX = e.pageX - gradientCanvasBox.left - document.documentElement.scrollLeft;
			var clickY = e.pageY - gradientCanvasBox.top - document.documentElement.scrollTop;
			//alert(clickX + "," + clickY);
			//console.log(clickX + "," + clickY);
			
			// We don't want to responds to clicks in the color stop indicator space
			if(clickY < gradientEditorProfileCanvasPadding || clickY > document.getElementById("gradientEditorProfileCanvas").height - gradientEditorProfileCanvasPadding){
				// The click was not in the drawn gradient region but in the space reserved for the arrows
				return;
			}
			
			//document.getElementById("gradientEditorNewStopColorPicker").click();
			
			
			//alert("add Gradient at: " + (clickX/document.getElementById("gradientEditorProfileCanvas").width).toFixed(2));
			var stop_pos = (clickX/document.getElementById("gradientEditorProfileCanvas").width).toFixed(2);
			
			// 2. Get color stop array from current controls
			var gradientColorStopArray = EditorUtils.getColorStopArrayFromGradientEditorControls();
			
			// 3. Add the color stop to the array using position we clicked
			gradientColorStopArray.push({color: "#ffffff", stop: stop_pos});
			
			// 4. Update the editor gradient canvas
			EditorUtils.updateGradientEditorProfileCanvas(gradientColorStopArray);
			
			// 5. Update the gradient editor controls with the new color stop array info
			EditorUtils.populateGradientEditorColorStopsControlsContainer(document.getElementById("gradientEditorColorStopsControlsContainer"), gradientColorStopArray);
			
		}
		
		// Draw the gradient from the gradient profile canvas using stored color stops
		EditorUtils.drawGradientEditorProfileCanvas(gradientEditorProfileCanvas, colorStops);
			
		var gradientEditorColorStopsControlsContainer = document.createElement("div");
		gradientEditorColorStopsControlsContainer.style = "height: 300px; overflow-y: scroll;";
		gradientEditorColorStopsControlsContainer.id = "gradientEditorColorStopsControlsContainer";
		EditorUtils.populateGradientEditorColorStopsControlsContainer(gradientEditorColorStopsControlsContainer, colorStops);
	
	
		// save button
		var saveBtn = document.createElement("input");
		saveBtn.type = "button";
		saveBtn.value = "Update";
		saveBtn.onclick = function(){
			//alert("Save updated gradient");
			//alert(JSON.stringify(EditorUtils.getColorStopArrayFromGradientEditorControls()));
			
			var gradientObj = new Object();
			gradientObj.type = "color_stop_array";
			gradientObj.color_stop_array = EditorUtils.getColorStopArrayFromGradientEditorControls(); 
			
			// save the gradient in the storage
			// leave other values undefined so they wont be updated
			// reload the old stored values
			var gradientSettings = JSON.parse(localStorage.getItem("gradient_settings"));
			EditorUtils.saveGradient(gradientObj, gradientSettings.type, gradientSettings.opacity, gradientSettings.blend_mode);
			
			// update the gradient toolbar preview
			EditorUtils.updateGradientToolbarPreview();
			
			if(document.getElementById("activeDialog")){
				document.body.removeChild(document.getElementById("activeDialog"));
			}			
		}
		
		
	// Add color stop editor components to gradientEditorColorStopsEditorContainerDiv
	gradientEditorColorStopsEditorContainerDiv.appendChild(gradientEditorProfileCanvas);
	gradientEditorColorStopsEditorContainerDiv.appendChild(document.createElement("br"));	
	gradientEditorColorStopsEditorContainerDiv.appendChild(document.createElement("br"));	
	// attach the color stop controls container to the editor body
	gradientEditorColorStopsEditorContainerDiv.appendChild(gradientEditorColorStopsControlsContainer);
	
	// populate the preset gradients
	presetGradientsListContainerDiv.appendChild(EditorUtils.createPresetGradientList());
	
	// Ass gradientEditorColorStopsEditorContainerDiv to gradientEditorDialogBody
	gradientEditorDialogBody.appendChild(gradientEditorColorStopsEditorContainerDiv);
	gradientEditorDialogBody.appendChild(presetGradientsListContainerDiv);

	
	gradientEditorDialogBody.appendChild(saveBtn);	

	// Open the dialog with the title, body components and functionality
	EditorUtils.openDialog("Gradient Editor", gradientEditorDialogBody);
}

// Populate color stop controls for the gradient to the gradient editor
EditorUtils.populateGradientEditorColorStopsControlsContainer = function(gradientEditorColorStopsControlsContainer, colorStops){

	// Remove all child controls to refresh
	while (gradientEditorColorStopsControlsContainer.firstChild) {
		gradientEditorColorStopsControlsContainer.removeChild(gradientEditorColorStopsControlsContainer.firstChild);
	}

	// Loop through color stops and add color stop controls
	for(var i = 0; i < colorStops.length; i++){
		//grd.addColorStop(colorStops[i].stop, colorStops[i].color);
		var colorStopColorInput = document.createElement("input");
		colorStopColorInput.id = "gradientEditorColorStopColorInput_" + i;
		colorStopColorInput.className = "gradientEditorColorStopColorGroup";
		colorStopColorInput.type = "color";
		colorStopColorInput.value = colorStops[i].color;
		colorStopColorInput.onchange = function(){
			//alert(this.value);
			var gradientColorStopArray = EditorUtils.getColorStopArrayFromGradientEditorControls();
			EditorUtils.updateGradientEditorProfileCanvas(gradientColorStopArray);
		}

		var colorStopPositionInput = document.createElement("input");
		colorStopPositionInput.id = "gradientEditorColorStopPositionInput_" + i;
		colorStopPositionInput.className = "gradientEditorColorStopPositionGroup";
		colorStopPositionInput.style = "width: 200px;";
		colorStopPositionInput.type = "range";
		colorStopPositionInput.min = "0";
		colorStopPositionInput.max = "1";
		colorStopPositionInput.step = ".01";
		colorStopPositionInput.value = colorStops[i].stop;
		colorStopPositionInput.oninput = function(){
			//console.log(this.value);
			var gradientColorStopArray = EditorUtils.getColorStopArrayFromGradientEditorControls();
			EditorUtils.updateGradientEditorProfileCanvas(gradientColorStopArray);
		}
		colorStopPositionInput.onchange = function(){
			//alert(this.value);
		}
		
		var colorStopDelete = document.createElement("span");
		// https://stackoverflow.com/questions/20941956/how-to-insert-html-entities-with-createtextnode
		colorStopDelete.appendChild(document.createTextNode('\u2573')); // x character
		colorStopDelete.id = "colorStopDelete_" + i;	
		colorStopDelete.title = "Delete color stop";		
		colorStopDelete.style = "cursor: pointer;";	
		colorStopDelete.onclick = function(){
			
			//alert("delete color stop at: " + this.id);
			
			// remove all color stop controls at index then 
			// refresh the controls
			
			// First check the number of so we dont remove all
			var items = document.getElementsByClassName("gradientEditorColorStopColorGroup");	
			if(items.length == 1){
				alert("Minimum number of color stops.");
				return;
			}
			
			// 1. get the control index 
			var delIndex = this.id.split("_")[1];
			//alert(delIndex);
			
			// 2. Remove all color stop controls with that index in the name
			// this will let us build a new color stop array without it to repopulate the controls
			document.getElementById("gradientEditorColorStopsControlsContainer").removeChild(document.getElementById("gradientEditorColorStopColorInput_" + delIndex));
			document.getElementById("gradientEditorColorStopsControlsContainer").removeChild(document.getElementById("gradientEditorColorStopPositionInput_" + delIndex));
			document.getElementById("gradientEditorColorStopsControlsContainer").removeChild(document.getElementById(this.id));
			
			// 3.  Get color stop array from current controls
			var colorStopArray = EditorUtils.getColorStopArrayFromGradientEditorControls();
			
			// 4. Update the editor gradient canvas
			EditorUtils.updateGradientEditorProfileCanvas(colorStopArray);
			
			// 5. Update the gradient editor controls with the new color stop array info
			EditorUtils.populateGradientEditorColorStopsControlsContainer(document.getElementById("gradientEditorColorStopsControlsContainer"), colorStopArray);
		}	
		
		gradientEditorColorStopsControlsContainer.appendChild(colorStopColorInput);
		gradientEditorColorStopsControlsContainer.appendChild(document.createTextNode('\u00A0'));// unicode space character		
		gradientEditorColorStopsControlsContainer.appendChild(colorStopPositionInput);
		gradientEditorColorStopsControlsContainer.appendChild(document.createTextNode('\u00A0'));// unicode space character
		gradientEditorColorStopsControlsContainer.appendChild(colorStopDelete);		
		gradientEditorColorStopsControlsContainer.appendChild(document.createElement("br"));	
		gradientEditorColorStopsControlsContainer.appendChild(document.createElement("br"));	
	}
}

EditorUtils.getColorStopArrayFromGradientEditorControls = function(){
	// Get all the color stops and values and update the gradient
	var colorStop = document.getElementsByClassName("gradientEditorColorStopColorGroup");
	
	//console.log(colorStop[0].value); // print the color for the stop
	
	// Create a gradientColorStop object from the editor controls
	var gradientColorStopArray = [];

	for(var i = 0; i < colorStop.length; i++){
		var addStop = new Object();
		
		// add the color stored in the color control
		addStop.color = colorStop[i].value;
		// get the position
		var split_id = colorStop[i].id.split("_");
		var controlIndex = split_id[1];
		addStop.stop = document.getElementById("gradientEditorColorStopPositionInput_" + controlIndex).value;
		
		// add the colorStopArray
		gradientColorStopArray.push(addStop);
	}
	
	return gradientColorStopArray;
}

EditorUtils.updateGradientEditorProfileCanvas = function(gradientColorStopArray){	

	// refresh the gradient editor gradient canvas
	EditorUtils.drawGradientEditorProfileCanvas(document.getElementById("gradientEditorProfileCanvas"), gradientColorStopArray);
	
}

// draws the gradient Profile Canvas of the gradient editor
EditorUtils.drawGradientEditorProfileCanvas = function(gradientEditorProfileCanvas, colorStopArray){
	//console.log(JSON.stringify(colorStopArray));

	//var gradientEditorProfileCanvas = document.getElementById("gradientEditorProfileCanvas");
	var gradientEditorProfileCtx = gradientEditorProfileCanvas.getContext("2d");
	gradientEditorProfileCtx.save();
	
	gradientEditorProfileCtx.clearRect(0,0,gradientEditorProfileCtx.canvas.width, gradientEditorProfileCtx.canvas.height);
	//gradientEditorProfileCtx.fillStyle = "black";
	//gradientEditorProfileCtx.fillRect(0,0,gradientEditorProfileCtx.canvas.width, gradientEditorProfileCtx.canvas.height);
	
	var grd = gradientEditorProfileCtx.createLinearGradient(0, 0, gradientEditorProfileCanvas.width, 0);

	for(var i = 0; i < colorStopArray.length; i++){
		grd.addColorStop(colorStopArray[i].stop, colorStopArray[i].color);
	}

	// Fill with gradient
	gradientEditorProfileCtx.fillStyle = grd;
	gradientEditorProfileCtx.fillRect(0, 10, gradientEditorProfileCanvas.width, gradientEditorProfileCanvas.height - 20);

	gradientEditorProfileCtx.strokeStyle = "rgba(0,0,0,.5)";

	// Draw Triangle indicators for the gradient stops
	var indicatorWidth = gradientEditorProfileCanvasPadding;
	for(var i = 0; i < colorStopArray.length; i++){
		gradientEditorProfileCtx.fillStyle = colorStopArray[i].color; 
		gradientEditorProfileCtx.beginPath();
		//gradientEditorProfileCtx.arc(parseFloat(colorStopArray[i].stop)*gradientEditorProfileCanvas.width, gradientEditorProfileCanvas.height, indicatorWidth/2, 0, 2 * Math.PI);
		gradientEditorProfileCtx.moveTo(parseFloat(colorStopArray[i].stop)*gradientEditorProfileCanvas.width, gradientEditorProfileCanvas.height - 10);
		gradientEditorProfileCtx.lineTo(parseFloat(colorStopArray[i].stop)*gradientEditorProfileCanvas.width + indicatorWidth/2, gradientEditorProfileCanvas.height - 0);		
		gradientEditorProfileCtx.lineTo(parseFloat(colorStopArray[i].stop)*gradientEditorProfileCanvas.width - indicatorWidth/2, gradientEditorProfileCanvas.height - 0);		
		gradientEditorProfileCtx.closePath();		
		gradientEditorProfileCtx.fill();
		gradientEditorProfileCtx.stroke();
	}

	gradientEditorProfileCtx.restore();	
		
}

// returns color stops for the stored gradient
EditorUtils.getStoredGradientColorStops = function(){

	var colorStops = [];

	/*
	[{"color":"#00ff40","stop":0},{"color":"#ffffff","stop":1}]
	*/
	// Get the gradient from the settings
	var gradientSettings = JSON.parse(localStorage.getItem("gradient_settings"));
	//alert(gradientSettings.gradient_object.type);
	
	if(gradientSettings.gradient_object.type == "foreground_background"){
	
		// Use foreground-background-color
		// Create gradient
		colorStops.push({color: foregroundColorInput.value, stop: 0});
		colorStops.push({color: backgroundColorInput.value, stop: 1});

	}else if(gradientSettings.gradient_object.type == "color_stop_array"){
	
		// USE THE STORED GRADIENT OBJECT
		
		//alert(JSON.stringify(gradientSettings.gradient_object.color_stop_array));
		
		colorStops = gradientSettings.gradient_object.color_stop_array;
		
	}	
	
	//alert(JSON.stringify(colorStops));
	
	return colorStops;
}

EditorUtils.createPresetGradientList = function(){

	// create a canvas gradient from the array of returned 
	
	//gradientListDiv.appendChild(document.createTextNode("List of preset gradients"));
	//gradientListDiv.appendChild(document.createElement("br"));
	
	var gradientListDiv = document.createElement("div");
	gradientListDiv.style = "height: 200px; overflow-y: scroll;";
	
	var presetGradients = EditorUtils.getGradientsArray();
	
	//alert(presetGradients.length);
	
	for(var i = 0; i < presetGradients.length; i++){
	
		//alert(presetGradients[i].name);
		var gradientCanvas = document.createElement("canvas");
		gradientCanvas.id = "presetGradientArrayItem_" + i;
		gradientCanvas.style = "cursor: pointer; border: 1px solid #000000;";
		gradientCanvas.width = 48;
		gradientCanvas.height = 25;
		gradientCanvas.onclick = function(){
			//alert("select the gradient in presets: " + i);
			//alert(this.id.split("_")[1]);
			
			//alert((EditorUtils.getGradientsArray(parseInt(this.id.split("_")[1]))).flag);
			
			
			if((EditorUtils.getGradientsArray(parseInt(this.id.split("_")[1]))).flag == "foreground-background"){
			
				// 1. set the stored gradient object to default foreground background
				
				var gradientObj = new Object();
				gradientObj.type = "foreground_background";
				gradientObj.color_stop_array = EditorUtils.getColorStopArrayFromGradientEditorControls(); 
				
				// save the gradient in the storage
				// leave other values undefined so they wont be updated
				// reload the old stored values
				var gradientSettings = JSON.parse(localStorage.getItem("gradient_settings"));
				EditorUtils.saveGradient(gradientObj, gradientSettings.type, gradientSettings.opacity, gradientSettings.blend_mode);
				
				// 2. update the gradient toolbar preview
				EditorUtils.updateGradientToolbarPreview();
				
			}
			
			
			// 3.  Get color stop array from current controls
			//var colorStopArray = EditorUtils.presetGradientObjectsArray[parseInt(this.id.split("_")[1])].color_stop_array;
			var colorStopArray = (EditorUtils.getGradientsArray(parseInt(this.id.split("_")[1]))).color_stop_array;
			//alert(JSON.stringify(colorStopArray));
			
			// 4. Update the editor gradient canvas
			EditorUtils.updateGradientEditorProfileCanvas(colorStopArray);
			
			// 5. Update the gradient editor controls with the new color stop array info
			EditorUtils.populateGradientEditorColorStopsControlsContainer(document.getElementById("gradientEditorColorStopsControlsContainer"), colorStopArray);
			
			// go back to the gradient color stop tab
			EditorUtils.gradientEditorDialogShowColorStops();
		}
		var gradientCtx = gradientCanvas.getContext("2d");
		
		var colorStopArray = presetGradients[i].color_stop_array;
		
		var grd = gradientCtx.createLinearGradient(0, 0, gradientCanvas.width, 0);
		for(var j = 0; j < colorStopArray.length; j++){
			grd.addColorStop(colorStopArray[j].stop, colorStopArray[j].color);
		}	

		// Fill with gradient
		gradientCtx.fillStyle = grd;
		gradientCtx.fillRect(0, 0, gradientCanvas.width, gradientCanvas.height);
		
		gradientListDiv.appendChild(gradientCanvas);
		gradientListDiv.appendChild(document.createTextNode(presetGradients[i].name));
		gradientListDiv.appendChild(document.createElement("br"));
	
	}
	
	return gradientListDiv;
}

/**
* if index is undefined - Returns the array of gradient objects
* if index set - returns the gradient object at the index in the array
**/
EditorUtils.getGradientsArray = function(index){

	// crate a temp object so that altering doesn't affect EditorUtils.presetGradientObjectsArray
	var tempGradientObjectsArray = JSON.parse(JSON.stringify(EditorUtils.presetGradientObjectsArray));
	
	// Add default foreground background to the beginning of gradient objects array
	tempGradientObjectsArray.unshift(EditorUtils.createDefaultFGBGgradientObject());

	if(typeof index === 'undefined'){
		return tempGradientObjectsArray;
	}else{
		return tempGradientObjectsArray[index];
	}

}

EditorUtils.createDefaultFGBGgradientObject = function(){

	return {
		name: "FG to BG (Defult)",
		flag: "foreground-background",
		color_stop_array: [
			{color: document.getElementById("foregroundColorInput").value, stop: 0},
			{color: document.getElementById("backgroundColorInput").value, stop: 1}
		]
	};

	/*
	if (localStorage.getItem("background_color_settings") === null || localStorage.getItem("foreground_color_settings") === null) {
		alert("not defined");
		return {
			name: "FG to BG (Default)",
			flag: "foreground-background",
			color_stop_array: [
				{color: "#000000", stop: 0},
				{color: "#ffffff", stop: 1}
			]
		};	
	}else{
		alert(localStorage.getItem("foreground_color_settings") + "," + localStorage.getItem("background_color_settings"));
		return {
			name: "FG to BG (Defult)",
			flag: "foreground-background",
			color_stop_array: [
				{color: localStorage.getItem("foreground_color_settings"), stop: 0},
				{color: localStorage.getItem("background_color_settings"), stop: 1}
			]
		};
	}
	*/

}

EditorUtils.presetGradientObjectsArray = [
	//EditorUtils.createDefaultFGBGgradientObject(),
	{
		name: "Curved",
		//color_stop_array: [{color: "#ffe400", stop: 0},{color: "#ff9000", stop: .30},{color: "#e66d1d", stop: 1}]
		color_stop_array: [
			{color: EditorUtils.rgbToHex(0, 0, 0), stop: 0},
			{color: EditorUtils.rgbToHex(255, 255, 255), stop: .440},
			{color: EditorUtils.rgbToHex(213, 213, 213), stop: .553},
			{color: EditorUtils.rgbToHex(169,169,169), stop: .626},
			{color: EditorUtils.rgbToHex(127,127,127), stop: .718},
			{color: EditorUtils.rgbToHex(86,86,86), stop: .812},
			{color: EditorUtils.rgbToHex(43,43,43), stop: .905},
			{color: EditorUtils.rgbToHex(0, 0, 0), stop: 1}
		]
	},
	{
		name: "Aqua Blue Green",
		//color_stop_array: [{color: "#ffe400", stop: 0},{color: "#ff9000", stop: .30},{color: "#e66d1d", stop: 1}]
		color_stop_array: [
			{color: EditorUtils.rgbToHex(0, 123, 255), stop: 0},
			{color: EditorUtils.rgbToHex(36, 174, 255), stop: .187},
			{color: EditorUtils.rgbToHex(72, 226, 255), stop: .788},
			{color: EditorUtils.rgbToHex(0, 255, 161), stop: 1}
		]
	},
	{
		name: "Crown Molding",
		//color_stop_array: [{color: "#ffe400", stop: 0},{color: "#ff9000", stop: .30},{color: "#e66d1d", stop: 1}]
		color_stop_array: [
			{color: EditorUtils.rgbToHex(0, 0, 0), stop: 0},
			{color: EditorUtils.rgbToHex(105, 105, 105), stop: .154},
			{color: EditorUtils.rgbToHex(214, 214, 214), stop: .238},
			{color: EditorUtils.rgbToHex(194, 194, 194), stop: .288},
			{color: EditorUtils.rgbToHex(84, 84, 84), stop: .289},
			{color: EditorUtils.rgbToHex(157, 157, 157), stop: .364},
			{color: EditorUtils.rgbToHex(229, 229, 229), stop: .556},
			{color: EditorUtils.rgbToHex(157, 157, 157), stop: .650},
			{color: EditorUtils.rgbToHex(85, 85, 85), stop: .712},
			{color: EditorUtils.rgbToHex(171, 171, 171), stop: .796},
			{color: EditorUtils.rgbToHex(255, 255, 255), stop: .878},
			{color: EditorUtils.rgbToHex(125, 125, 125), stop: .950},
			{color: EditorUtils.rgbToHex(0, 0, 0), stop: 1}
		]
	},
	{
		name: "CD 2",
		//color_stop_array: [{color: "#ffe400", stop: 0},{color: "#ff9000", stop: .30},{color: "#e66d1d", stop: 1}]
		color_stop_array: [
			{color: EditorUtils.rgbToHex(208,208,208), stop: 0},
			{color: EditorUtils.rgbToHex(223,223,223), stop: .047},
			{color: EditorUtils.rgbToHex(255,255,255), stop: .127},
			{color: EditorUtils.rgbToHex(232,232,232), stop: .354},
			{color: EditorUtils.rgbToHex(209,209,209), stop: .472},
			{color: EditorUtils.rgbToHex(230,255,0), stop: .562},
			{color: EditorUtils.rgbToHex(0,255,254), stop: .621},
			{color: EditorUtils.rgbToHex(94,255,230), stop: .680},
			{color: EditorUtils.rgbToHex(209,209,209), stop: .748},
			{color: EditorUtils.rgbToHex(224,224,224), stop: 1}
		]
	},
	{
		name: "Horizon",
		//color_stop_array: [{color: "#ffe400", stop: 0},{color: "#ff9000", stop: .30},{color: "#e66d1d", stop: 1}]
		color_stop_array: [
			{color: EditorUtils.rgbToHex(255,255,255), stop: 0},
			{color: EditorUtils.rgbToHex(248,251,231), stop: .101},
			{color: EditorUtils.rgbToHex(242,247,207), stop: .203},
			{color: EditorUtils.rgbToHex(248,193,137), stop: .378},
			{color: EditorUtils.rgbToHex(255,141,68), stop: .487},
			{color: EditorUtils.rgbToHex(206,87,57), stop: .502},
			{color: EditorUtils.rgbToHex(150,25,44), stop: .528},
			{color: EditorUtils.rgbToHex(113,32,29), stop: .544},
			{color: EditorUtils.rgbToHex(74,38,14), stop: .561},
			{color: EditorUtils.rgbToHex(79,73,103), stop: .607},
			{color: EditorUtils.rgbToHex(86,108,203), stop: .696},
			{color: EditorUtils.rgbToHex(151, 180, 229), stop: .844},
			{color: EditorUtils.rgbToHex(217, 251, 255), stop: 1}
		]
	},
	{
		name: "Diffraction",
		//color_stop_array: [{color: "#ffe400", stop: 0},{color: "#ff9000", stop: .30},{color: "#e66d1d", stop: 1}]
		color_stop_array: [
			{color: EditorUtils.rgbToHex(0,0,0), stop: 0},
			{color: EditorUtils.rgbToHex(255,255,255), stop: .166},
			{color: EditorUtils.rgbToHex(0,0,0), stop: .333},
			{color: EditorUtils.rgbToHex(255,255,255), stop: .5},
			{color: EditorUtils.rgbToHex(0,0,0), stop: .666},
			{color: EditorUtils.rgbToHex(212,212,212), stop: .831},
			{color: EditorUtils.rgbToHex(0,0,0), stop: 1}
		]
	},
	{
		name: "Yellow Orange",
		//color_stop_array: [{color: "#ffe400", stop: 0},{color: "#ff9000", stop: .30},{color: "#e66d1d", stop: 1}]
		color_stop_array: [
			{color: EditorUtils.rgbToHex(255,228,0), stop: 0},
			{color: EditorUtils.rgbToHex(255,181,0), stop: .134},
			{color: EditorUtils.rgbToHex(255,136,0), stop: .566},
			{color: EditorUtils.rgbToHex(241,123,15), stop: .947},
			{color: EditorUtils.rgbToHex(230,110,29), stop: 1}
		]
	},
	{
		name: "Wood",
		color_stop_array: [
			{color: "#ffb366", stop: 0},
			{color: "#ed9741", stop: .02},
			{color: "#e28f3b", stop: .65},
			{color: "#d98939", stop: .85},
			{color: "#000000", stop: 1}
		]
	},
	{
		name: "Tropical Rainbow",
		color_stop_array: [
			{color: EditorUtils.rgbToHex(9,40,4), stop: 0},
			{color: EditorUtils.rgbToHex(2,78,0), stop: .085},
			{color: EditorUtils.rgbToHex(52,147,22), stop: .194},
			{color: EditorUtils.rgbToHex(235,191,49), stop: .276},
			{color: EditorUtils.rgbToHex(243,62,34), stop: .387},
			{color: EditorUtils.rgbToHex(137,81,60), stop: .554},
			{color: EditorUtils.rgbToHex(121,76,255), stop: .666},
			{color: EditorUtils.rgbToHex(164,254,244), stop: .825},
			{color: EditorUtils.rgbToHex(105,223,76), stop: .883},
			{color: EditorUtils.rgbToHex(93,127,0), stop: 1}
		]
	}
]

EditorUtils.calcHypotenuse = function(a, b) {
  return(Math.sqrt((a * a) + (b * b)));
}

// Get Bounding Box of visible content in canvas
EditorUtils.getBoundingRectFromCanvas = function (canvas){
	//alert("get the dimensions of the trimmed canvas");
	//alert(canvas.width + "," + canvas.height);
	
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

	//alert("trimmed rect points:\ntop:" + top + ", left: " + left + ", bottom: " + bottom + ", right:" + right);
	
	var trimRect = new Object();
	trimRect.x = left;
	trimRect.y = top;
	trimRect.width = (right - left) + 1;
	trimRect.height = (bottom - top) + 1;
	trimRect.left = trimRect.x;
	trimRect.top = trimRect.y;
	trimRect.right = trimRect.x + trimRect.width;
	trimRect.bottom = trimRect.y + trimRect.height;
	trimRect.cx = trimRect.x + trimRect.width/2;
	trimRect.cy = trimRect.y + trimRect.height/2;
	
	
	return trimRect;
	
}
