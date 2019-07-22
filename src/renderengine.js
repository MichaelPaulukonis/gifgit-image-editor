// Copyright (c) 2019 Kasey Thomas. All rights reserved.
// Use of this source code is governed by the EULA.

'use strict';

var textEngine = {};

var layerRenderEngine = {};

textEngine.renderText = function(textCtx, textstr, textCharStyles, squareSelectionRect, textTransform){

	var tempRect = new Object();
	tempRect.x = squareSelectionRect.x;
	tempRect.y = squareSelectionRect.y;
	tempRect.width = squareSelectionRect.width;
	tempRect.height = squareSelectionRect.height;
	
	// 1. Remember if there are any image rotations when the textbox was created we must transpose the width 
	// and heights for +/-90 degree and +/-270 degree rotations to get the true width of the textCanvas.
	// This is because whn we draw the text box in a 90 deg rotated canvas the image space pixels height will be the width we desire.
	//console.log(textTransform.rotate);
	if(Math.abs(textTransform.rotate) == 90 || Math.abs(textTransform.rotate) == 270){
		tempRect.width = squareSelectionRect.height;
		tempRect.height = squareSelectionRect.width;
	}
	
	textCtx.canvas.width = tempRect.width;
	textCtx.canvas.height = tempRect.height;



	// .selectionStart and .selectionEnd
	//alert(textstr);
	//console.log(textstr.length + "," + textCharStyles.length);
	if(textstr.length != textCharStyles.length){
		return;
	}

	//console.log(editTextInput.value);
	textCtx.clearRect(0, 0, textCtx.canvas.width, textCtx.canvas.width);
	
	//textCtx.fillStyle = "green";
	//textCtx.fillRect(0,0,textCtx.canvas.width, textCtx.canvas.height);
	
	// textCtx.textBaseline = "top";
	// textCtx.textBaseline = "bottom";
	textCtx.textBaseline = "alphabetic";
	//textCtx.save();
	/*
	textCtx.fillStyle = fontColorSelect.value;
	var italicstyle = "";
	if(italicCheckbox.checked){
		italicstyle = "italic"
	}
	textCtx.font = fontWeightSelect.value + " " + fontSizeTxt.value + "px " + fontFamilyTxt.value + " " + italicstyle;	
	*/

	// get the lines for the box
	var textlines = this.wrapLines(textCtx, textstr, textCharStyles, tempRect);
	
	var charcntr = 0;
	var line_y_offset = 0; // the cumulative offset for each line in the textLines array
	//console.clear();
	for(var i = 0; i < textlines.length; i++){
		
		// Deprecated - drawing all the text of the line with one canvas fillText - below is new method
		//textCtx.fillText(textlines[i], 0, i*parseFloat(fontSizeTxt.value)); // i*parseFloat(fontSizeTxt.value) sets the vertical line offset
		
		// We will instead loop through and print all characters in the line with their own styling
		var cumulativeCharWidths = 0;	
		for(var j = 0; j < textlines[i].string.length; j++){ // loop through each character in textlines[i] using variablee j

			textCtx.save();
			
			// Get the style for the current character from textCharStyles array
			this.setCharStyle(textCtx, textCharStyles[charcntr]);
			
			//console.log();
			//console.log(charcntr + "," + textCharStyles[charcntr].size)
			
			//textCtx.fillText(textlines[i].string.charAt(j), cumulativeCharWidths, i*parseFloat(fontSizeTxt.value) + parseFloat(fontSizeTxt.value));	
			//textCtx.fillText(textlines[i].string.charAt(j), cumulativeCharWidths, i*parseFloat(textlines[i].line_height) + parseFloat(textlines[i].line_height));	
			textCtx.fillText(textlines[i].string.charAt(j), cumulativeCharWidths, line_y_offset + parseFloat(textlines[i].line_height));	
			cumulativeCharWidths += textCtx.measureText(textlines[i].string.charAt(j)).width;
			charcntr++;
			
			textCtx.restore();
		}
		
		line_y_offset += parseFloat(textlines[i].line_height);
		
	}
	
	//textCtx.restore();
	
	if(textTransform){
		// The text must be applied with opposite transformations to the global cumulative transformations
		// unflip any flips
		EditorUtils.scaleCanvas(textCtx.canvas, textTransform.flip_scaleX, textTransform.flip_scaleY);
		// unrotate any rotations
		EditorUtils.rotateCanvas(textCtx.canvas, -textTransform.rotate);
	}
	
}

textEngine.setCharStyle = function(textCtx, style){
	
	//try{
	
		textCtx.fillStyle = style["color"];	
		var italicstyle = "";
		if(style["italic"]){
			italicstyle = "italic"
		}
		var txtstyle = style["font-weight"] + " " + style["size"] + "px " + style["font-family"] + " " + italicstyle;
		//console.log(txtstyle);
		textCtx.font = txtstyle;
		
	//}catch(e){
	//	console.log(e.toString());
	//}
}


textEngine.wrapLines = function(textCtx, text, textCharStyles, squareSelectionRect){

	//console.log(textCtx.measureText(text).width + "," + squareSelectionRect.width);

	var linesarray = [];
	linesarray[0] = {string: "", line_height: 0};
	
	//linesarray = [text];
	//linesarray = text.split(/(?:\r\n|\r|\n)/g);
	
	var linecntr = 0;
	var linewrapped = false; // basically used to prevent whitespace from being added to the new line should wrap overlow occur
	var lastword = "";
	var lineCharStylesArray = [];
	var lineCharWidthsArray = []; // stores the width of all the characters in the current linearray[linecntr] index
	
	for (var i = 0; i < text.length; i++) {
		//alert(text.charAt(i));
		textCtx.save();

		// Get the style for the current character from textCharStyles array
		var charStyle = textCharStyles[i];
		// console.log(JSON.stringify(charStyle));
		this.setCharStyle(textCtx, charStyle);
		//lineCharStylesArray.push(charStyle.size);
		
		// 1. test if we have a line wrap or newline
		if(text.charAt(i) == '\n'){
		
			
			linesarray[linecntr].string += text.charAt(i);
			
			
			// *Nb. !! Important This prevents the current line from changing its height
			// if the user changes the font size begore pressing newline
			// if the length of the current line string is 1, it means that
			// there is only a newline character and we set the height to it
			if(linesarray[linecntr].string.length == 1){
				//  set the height of the current line
				if(linesarray[linecntr].line_height < charStyle.size){
					linesarray[linecntr].line_height = charStyle.size;				
				}			
			}
			
		
			linesarray.push({string: "", line_height: 0});
			linecntr++;
			linewrapped = false;
			lineCharWidthsArray = [];
			lineCharStylesArray = [];
			
		}else{
		
			// not a newline character
		
			var currentlinewidth = 0;
			for(var z = 0; z < lineCharWidthsArray.length; z++){
				currentlinewidth += lineCharWidthsArray[z];
			}
		
			// Test the width of the text if the next character is added
			if(currentlinewidth + textCtx.measureText(text.charAt(i)).width >= squareSelectionRect.width){
				// if when the next character is added to the current linesarray string its width is wider than the text bounding box 
				// then start a new line in linearray 
				
				// 1. Get the last word so that it can jump to the new line, we are generally in a word if the
				// last character in the current line is alphabetic, numeric or special character
				// Therefore... There can only be a last word if the current chracter is none of the foll
				if(linesarray[linecntr].string.charAt(i) != ' ' || linesarray[linecntr].string.charAt(i) != '\n' 
					|| linesarray[linecntr].string.charAt(i) != '\r' || linesarray[linecntr].string.charAt(i) != '\r\n'){
					
						// 1. splitting to get the last word in the current line
						var linewords = linesarray[linecntr].string.split(" ");
						
						// If its only one word after the split it means one word took up the whole line.
						// then we don't have to create a lastword to add to the new line
						if(linewords.length > 1){
							lastword = linewords[linewords.length - 1];
							//console.log(lastword);
							
							// 2. remove the last word from the current line by removing the number of characters
							// 	  it contains from the current line string
							//linesarray[linecntr] = linesarray[linecntr].replace(lastword,"");
							for(var k = 0; k < lastword.length; k++){
								//linesarray[linecntr].substring(linesarray[linecntr].length - 1, linesarray[linecntr].length);
								linesarray[linecntr].string = linesarray[linecntr].string.substr(0, linesarray[linecntr].string.length-1);
							}	

							//3.  now we need to recalculate the line height of the current line since lastword string will be removed
							// Nb.
						}
						
				}
				
				// 2. Start the new line
				linesarray.push({string: "", line_height: 0});
				linecntr++;	
				
				// If we had a last word we add it here to the new line
				if(lastword != ""){
					// If there was a last word set to jump to the new line add it 
					// to the newline 
					linesarray[linecntr].string += lastword;
					// we have to add the linewidth for the added lastword to the 
					var tempCharWidthsArray = [];
					for(var s = 0; s < lastword.length; s++){
						// what is removed from lineCharWidthsArray is added to tempCharWidthsArray
						tempCharWidthsArray.push(lineCharWidthsArray.pop());
						lineCharStylesArray.pop();
					}
					
					//console.log(JSON.stringify(lineCharStylesArray));
					// Performing 3 above setting the line height of the previous line based on the fact that we removed 
					// lastword from it.
					linesarray[linecntr - 1].line_height = 0;
					for(var z = 0; z < lineCharStylesArray.length; z++){
						if(linesarray[linecntr - 1].line_height < lineCharStylesArray[z]){
							linesarray[linecntr - 1].line_height = lineCharStylesArray[z]
						}
					}
					
					// now we have the width of all lastword characters in lineCharWidthsArray
					// to use for the next line
					lineCharWidthsArray = tempCharWidthsArray;
								
					// reset lastword
					lastword = "";
					linewrapped = false; // reset so we can add whitespace
					lineCharStylesArray = [];
				}else{
				
					linewrapped = true;	
					lineCharWidthsArray = [];
					
				}
				
			}
		
			if(linewrapped){
				if(text.charAt(i) == " "){
					// If we just had a line wrap we cannot put white-space at beginning of  the new line
					// but we add the space character to the previous line
					if((linecntr - 1) >= 0){
						linesarray[linecntr - 1].string += text.charAt(i);
						// we add the height of the character to linesarray[linecntr - 1] if its higher than current
						if(linesarray[linecntr - 1].line_height < charStyle.size){
							linesarray[linecntr - 1].line_height = charStyle.size;				
						}						
					}
				}else{
					linesarray[linecntr].string += text.charAt(i);	
					linewrapped = false;
					// we add the height of the character if its higher than current
					if(linesarray[linecntr].line_height < charStyle.size){
						linesarray[linecntr].line_height = charStyle.size;				
					}					
				}
			}else{
				linesarray[linecntr].string += text.charAt(i);
				// we add the height of the character if its higher than current
				if(linesarray[linecntr].line_height < charStyle.size){
					linesarray[linecntr].line_height = charStyle.size;				
				}
			}

		} // end of else{ not newline character
		
		lineCharWidthsArray.push(textCtx.measureText(text.charAt(i)).width);
		lineCharStylesArray.push(charStyle.size);		
		//console.log(JSON.stringify(lineCharWidthsArray));
		//console.log(JSON.stringify(lineCharStylesArray));
		
		textCtx.restore();
		
	} // end of for loop through every character
	
	//console.clear();
	//console.log("---------------------------------");
	//console.log(JSON.stringify(linesarray));
	
	//console.log(JSON.stringify(textCharStyles));
	
	return  linesarray;

}


// Renders all layers, drawing them to the editor canvas
layerRenderEngine.renderAllLayers = function(editorCtx){

	/*
	//console.log("render all layers");
	editorCtx.clearRect(0,0,editorCtx.canvas.width, editorCtx.canvas.height);
	
	for(let i = 0; i < layerStack.length; i++){
		// Render the layer at the index in the stack to the canvas
		this.renderLayerIndex(editorCtx, i);
	}	
	*/

	// 1. Render the Layers to a temp canvas
	
	var tempLayerCanvas = document.createElement("canvas");
	tempLayerCanvas.width = canvasWidth;
	tempLayerCanvas.height = canvasHeight;
	var tempLayerCtx = tempLayerCanvas.getContext("2d");	
	
	for(let i = 0; i < layerStack.length; i++){
		// Render the layer at the index in the stack to the canvas
		this.renderLayerIndex(tempLayerCtx, i);
	}	
	
	editorCtx.clearRect(0,0,editorCtx.canvas.width, editorCtx.canvas.height);
	
	// draw the tempCanvas to editorCanvas
	editorCtx.drawImage(tempLayerCanvas, 0, 0);
	
	// Process global transformations
	// Apply global transformations
	editorCtx.save();
	//console.clear();
	EditorUtils.getTransormedCanvas(editorCtx.canvas);
	editorCtx.restore();	
	
}

// Renders Layer at index i in the stack, drawing them to the editor canvas
// replaceLayer is a layer to draw instead of the current layer index
layerRenderEngine.renderLayerIndex = function(editorCtx, i, replacementLayer){

	//console.log(JSON.stringify(tempLayer));
	
	var renderedLayer = layerStack[i];

	// If a replacement layer is sent to draw instead of the current layer index
	if(replacementLayer){
		renderedLayer = replacementLayer;
	}

	if(renderedLayer.visible){
	
		// If blending mode set for layer
		if('blend_mode' in renderedLayer){
			editorCtx.save();
			editorCtx.globalCompositeOperation = renderedLayer.blend_mode;
		}	
		
		// If opacity set for layer
		if('opacity' in renderedLayer){
			editorCtx.save();
			editorCtx.globalAlpha = renderedLayer.opacity/100;
			//console.log("layer at " + i + ": " + renderedLayer.opacity);
		}	
				
		if(!('object' in renderedLayer)){

			// Drawing a regular rasterized layer canvas to editor
			
			if(!('raster_mask' in renderedLayer)){
				// =========== Draw regular - NO raster mask =================
				editorCtx.drawImage(renderedLayer.canvas, renderedLayer.cumulativeNegatives.x, renderedLayer.cumulativeNegatives.y);
			}else{
				// =========== Draw regular - WITH raster mask =================
				
				if(!renderedLayer.raster_mask.enabled){
				
					// The RASTER MASK WAS NOT ENABLED so draw regular
					editorCtx.drawImage(renderedLayer.canvas, renderedLayer.cumulativeNegatives.x, renderedLayer.cumulativeNegatives.y);
					
				}else{
					// If there is a raster mask we have to draw to a temp canvas first then to editorCanvas
					
					// 1. calculate the offset of the raster mask relative to the layer canvas using cumulativeNegatives of both
					var rasterMaskOffset = EditorUtils.getLayerRasterMaskOffset(renderedLayer);
					//console.log(JSON.stringify(rasterMaskOffset));
					
					// METHOD 3
								
					// ORIGINAL DEPRECATED METHOD TO DRAW THE MASK
					// first apply the raster_mask opacity to the layer canvas
					
					// 2. create a temp canvas to hold the layer
					var canvas = document.createElement("canvas");
					canvas.width = renderedLayer.canvas.width;
					canvas.height = renderedLayer.canvas.height;
					var ctx = canvas.getContext("2d");
					ctx.drawImage(renderedLayer.canvas, 0, 0);
					
					// 3. Create the apply opacity mask 
					var applyOpacityCanvas = document.createElement("canvas");
					// draw the applyOpacityCanvas resized to rasterMaskOffset
					applyOpacityCanvas.width = renderedLayer.raster_mask.opacity_canvas.width + Math.abs(rasterMaskOffset.x);
					applyOpacityCanvas.height = renderedLayer.raster_mask.opacity_canvas.height + Math.abs(rasterMaskOffset.y);
					var applyOpacityCtx = applyOpacityCanvas.getContext("2d");
										
					// 4. Fill the applyOpacityCanvas with original raster mask fill
					var layerFillRGB = EditorUtils.getRGBAArrayFromFillColor(renderedLayer.raster_mask.fill);
					applyOpacityCtx.fillStyle = "rgba(0,255,0," + layerFillRGB[0] + ")";
					applyOpacityCtx.fillRect(0,0,applyOpacityCanvas.width, applyOpacityCanvas.height);
					
					// 5. Get the offset to draw the opacity_mask in the applyOpacityCanvas
					var draw_opacity_x = 0, draw_opacity_y = 0;
					// We apply only positive offsets in the resized Opacity canvas. If the rasterMaskOffset is negative we leave it 
					// at zero in the resized applyOpacityCanvas else we draw at positive offset
					if(rasterMaskOffset.x > 0){
						draw_opacity_x = rasterMaskOffset.x;
					}
					if(rasterMaskOffset.y > 0){
						draw_opacity_y = rasterMaskOffset.y;
					}
					
					// 6. clear the area that we draw the opacity_mask
					applyOpacityCtx.clearRect(draw_opacity_x, draw_opacity_y, renderedLayer.raster_mask.opacity_canvas.width, renderedLayer.raster_mask.opacity_canvas.height);
					
					applyOpacityCtx.drawImage(renderedLayer.raster_mask.opacity_canvas, draw_opacity_x, draw_opacity_y);
					
					/*
					if(document.getElementById("testCanvas")){
						var testCanvas = document.getElementById("testCanvas");
						testCanvas.width = renderedLayer.raster_mask.opacity_canvas.width;
						testCanvas.height = renderedLayer.raster_mask.opacity_canvas.height;
						var testCtx = testCanvas.getContext("2d");
						testCtx.drawImage(applyOpacityCanvas, 0, 0);
					}
					*/

					// 7. We only apply only negative offsets in layer_opacity_x & layer_opacity_y 
					// when applying the applyOpacityCanvas to the temp layer 
					var layer_opacity_x = 0, layer_opacity_y = 0;
					if(rasterMaskOffset.x < 0){
						layer_opacity_x = rasterMaskOffset.x;
					}
					if(rasterMaskOffset.y < 0){
						layer_opacity_y = rasterMaskOffset.y;
					}
					ctx.globalCompositeOperation = 'destination-in';					
					ctx.drawImage(applyOpacityCanvas, layer_opacity_x, layer_opacity_y);					
					
					editorCtx.drawImage(canvas, renderedLayer.cumulativeNegatives.x, renderedLayer.cumulativeNegatives.y);	
					
					// METHOD 1
					/*			
					// ORIGINAL DEPRECATED METHOD TO DRAW THE MASK
					// first apply the raster_mask opacity to the layer canvas
					
					// 2. create a temp canvas to hold the layer
					var canvas = document.createElement("canvas");
					canvas.width = renderedLayer.canvas.width;
					canvas.height = renderedLayer.canvas.height;
					var ctx = canvas.getContext("2d");
					ctx.drawImage(renderedLayer.canvas, 0, 0);

					ctx.globalCompositeOperation = 'destination-in';
					//ctx.globalCompositeOperation = 'destination-out';
					ctx.drawImage(renderedLayer.raster_mask.opacity_canvas, rasterMaskOffset.x, rasterMaskOffset.y);
					
					editorCtx.drawImage(canvas, renderedLayer.cumulativeNegatives.x, renderedLayer.cumulativeNegatives.y);	
					*/
				
				}
				
			}			
		
		}else{
		
			// ========== Draw objects to layer =================
				
			if(renderedLayer.object.type == "text_object"){
			
				// alert("render text object: " + i);
			
				/*
				===================================================
				The Text object is in renderedLayer.object
				===================================================
				var textObject = new Object;
				textObject.type = "text_object";
				textObject.string = editStack.stack[x].string;
				textObject.char_styles = editStack.stack[x].char_styles;
				textObject.textbox = editStack.stack[x].textbox;
				*/
			
				if(!('raster_mask' in renderedLayer)){
				
					//======= Draw text layer - NO raster mask ================
				
					var textCanvas = document.createElement("canvas");
					var textCtx = textCanvas.getContext("2d");

					// Render the text using the text engine
					textEngine.renderText(textCtx, renderedLayer.object.string, renderedLayer.object.char_styles, renderedLayer.object.textbox, renderedLayer.object.transform);

					
					// Draw the rendered text canvas to the editor canvas
					editorCtx.drawImage(textCanvas, renderedLayer.object.textbox.x, renderedLayer.object.textbox.y);
				
				}else{
				
				
					if(!renderedLayer.raster_mask.enabled){
					
						// The RASTER MASK NOT ENABLED so draw regular
						
						var textCanvas = document.createElement("canvas");
						var textCtx = textCanvas.getContext("2d");

						// Render the text using the text engine
						textEngine.renderText(textCtx, renderedLayer.object.string, renderedLayer.object.char_styles, renderedLayer.object.textbox, renderedLayer.object.transform);
	
						
						// Draw the rendered text canvas to the editor canvas
						editorCtx.drawImage(textCanvas, renderedLayer.object.textbox.x, renderedLayer.object.textbox.y);
						
					}else{

						// RASTER MASK ENABLED
						//======= Draw text layer - WITH raster mask ================
					
						var textCanvas = document.createElement("canvas");
						var textCtx = textCanvas.getContext("2d");

						// Render the text using the text engine
						textEngine.renderText(textCtx, renderedLayer.object.string, renderedLayer.object.char_styles, renderedLayer.object.textbox, renderedLayer.object.transform);
						
						// 1. calculate the offset of the raster mask relative to the layer canvas using cumulativeNegatives of both
						var rasterMaskOffset = EditorUtils.getLayerRasterMaskOffset(renderedLayer);
						//console.log(JSON.stringify(rasterMaskOffset));						
						
						// 2. first apply the raster_mask opacity to the layer simulating the text object being drawn to the editor canvas
						var canvas = document.createElement("canvas");
						canvas.width = renderedLayer.canvas.width;
						canvas.height = renderedLayer.canvas.height;
						var ctx = canvas.getContext("2d");
						//ctx.drawImage(renderedLayer.canvas, 0, 0); // not needed layer canvas should be transparent
						ctx.drawImage(textCanvas, renderedLayer.object.textbox.x, renderedLayer.object.textbox.y);
						
						// 3. Create the apply opacity mask 
						var applyOpacityCanvas = document.createElement("canvas");
						// draw the applyOpacityCanvas resized to rasterMaskOffset
						applyOpacityCanvas.width = renderedLayer.raster_mask.opacity_canvas.width + Math.abs(rasterMaskOffset.x);
						applyOpacityCanvas.height = renderedLayer.raster_mask.opacity_canvas.height + Math.abs(rasterMaskOffset.y);
						var applyOpacityCtx = applyOpacityCanvas.getContext("2d");
											
						// 4. Fill the applyOpacityCanvas with original raster mask fill
						var layerFillRGB = EditorUtils.getRGBAArrayFromFillColor(renderedLayer.raster_mask.fill);
						applyOpacityCtx.fillStyle = "rgba(0,255,0," + layerFillRGB[0] + ")";
						applyOpacityCtx.fillRect(0,0,applyOpacityCanvas.width, applyOpacityCanvas.height);
						
						// 5. Get the offset to draw the opacity_mask in the applyOpacityCanvas
						var draw_opacity_x = 0, draw_opacity_y = 0;
						// We apply only positive offsets in the resized Opacity canvas. If the rasterMaskOffset is negative we leave it 
						// at zero in the resized applyOpacityCanvas else we draw at positive offset
						if(rasterMaskOffset.x > 0){
							draw_opacity_x = rasterMaskOffset.x;
						}
						if(rasterMaskOffset.y > 0){
							draw_opacity_y = rasterMaskOffset.y;
						}
						
						// 6. clear the area that we draw the opacity_mask
						applyOpacityCtx.clearRect(draw_opacity_x, draw_opacity_y, renderedLayer.raster_mask.opacity_canvas.width, renderedLayer.raster_mask.opacity_canvas.height);
						
						applyOpacityCtx.drawImage(renderedLayer.raster_mask.opacity_canvas, draw_opacity_x, draw_opacity_y);
						
						/*
						if(document.getElementById("testCanvas")){
							var testCanvas = document.getElementById("testCanvas");
							testCanvas.width = renderedLayer.raster_mask.opacity_canvas.width;
							testCanvas.height = renderedLayer.raster_mask.opacity_canvas.height;
							var testCtx = testCanvas.getContext("2d");
							testCtx.drawImage(applyOpacityCanvas, 0, 0);
						}
						*/

						// 7. We only apply only negative offsets in layer_opacity_x & layer_opacity_y 
						// when applying the applyOpacityCanvas to the temp layer 
						var layer_opacity_x = 0, layer_opacity_y = 0;
						if(rasterMaskOffset.x < 0){
							layer_opacity_x = rasterMaskOffset.x;
						}
						if(rasterMaskOffset.y < 0){
							layer_opacity_y = rasterMaskOffset.y;
						}
						ctx.globalCompositeOperation = 'destination-in';					
						ctx.drawImage(applyOpacityCanvas, layer_opacity_x, layer_opacity_y);					
						
						editorCtx.drawImage(canvas, renderedLayer.cumulativeNegatives.x, renderedLayer.cumulativeNegatives.y);	
						
						// METHOD 1
						/*			
						// ORIGINAL DEPRECATED METHOD TO DRAW THE MASK
						// first apply the raster_mask opacity to the layer canvas
						
						// 2. create a temp canvas to hold the layer
						var canvas = document.createElement("canvas");
						canvas.width = renderedLayer.canvas.width;
						canvas.height = renderedLayer.canvas.height;
						var ctx = canvas.getContext("2d");
						ctx.drawImage(renderedLayer.canvas, 0, 0);

						ctx.globalCompositeOperation = 'destination-in';
						//ctx.globalCompositeOperation = 'destination-out';
						ctx.drawImage(renderedLayer.raster_mask.opacity_canvas, rasterMaskOffset.x, rasterMaskOffset.y);
						
						editorCtx.drawImage(canvas, renderedLayer.cumulativeNegatives.x, renderedLayer.cumulativeNegatives.y);	
						*/
												
					}
				
				}
								
			}
		}
		
		// return to state
		if('opacity' in renderedLayer){
			editorCtx.restore();
		}	
		
		if('blend_mode' in renderedLayer){
			editorCtx.restore();
		}
		
	}
}