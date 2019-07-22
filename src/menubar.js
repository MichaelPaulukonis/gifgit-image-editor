// Copyright (c) 2019 Kasey Thomas. All rights reserved.
// Use of this source code is governed by the EULA.

'use strict';

// Close the dropdown if the user clicks outside of it
window.onclick = function(e) {
	if (!e.target.matches('.dropbtn')) {
		closeAllDropdowns();
		/*
		let toolDropdown = document.getElementById("toolDropdown");
		if (toolDropdown.classList.contains('show')) {
		  toolDropdown.classList.remove('show');
		}
		*/
	}
}

$("#testMenuBtn").click(function() {

	for(var x = 0; x < editStack.stack.length; x++){
		console.log(editStack.stack[x].edit);
	}

	//alert("editingLayerMask: " + editingLayerMask);

	//alert("This is a test of the emergency alert system.");
	
	/*
	// Get all edits that are not continue flagged for Undo/Redo action
	var start = false;
	var historyindices = [];
	var allindices = [];
	for(var i = 0; i < editStack.stack.length; i++){
	
		allindices.push(editStack.stack[i].edit);
		
		if(editStack.stack[i].edit == "start"){
			start = true;
		}
		if(start){
			if('flag' in editStack.stack[i]){
				if(editStack.stack[i].flag.indexOf("continue") >= 0){
					// We do not show this edit in history if it is a continue
				}else{

					// Add to edit index array	
					//historyindices.push(i);
					historyindices.push(editStack.stack[i].edit);
				}
			}else{
				// Add to edit index array	
				//historyindices.push(i);
				historyindices.push(editStack.stack[i].edit);
			}
		}
	}
	
	alert(JSON.stringify(historyindices));
	alert(JSON.stringify(allindices));
	
	*/

	/*
	if (localStorage.getItem("asset_library") === null) {
	}else{
		alert(localStorage.getItem("asset_library"));
	}
	*/


});

$("#fileNewMenuBtn").click(function() {

	if(confirm("Do you wish to start a new edit?")){
	
		// this has to be put here so that any page that sets it(e.g. the grayscale filter page)
		// does not save an edit to the stack on page reload.
		editsMade = false;
	
		/*
		var keys = Object.keys(localStorage);
		
		//for(var i = 0; i < keys.length; i++){
		//	console.log(keys[i]);
		//}		
		
				
		for(var i = 0; i < keys.length; i++){
			if(keys[i].indexOf("settings") >= 0){
				// console.log("leave: " + keys[i]);
			}else{
				// console.log("remove: " + keys[i]);	
				localStorage.removeItem(keys[i]);				
			}
		}
		
		location.reload();	
		*/
		
	
		
		localStorage.clear();
		location.reload();

		// scroll to 0,0 top left in case the page was scrolled
		// so the upload div can be shown
		window.scrollTo(0, 0)		
		
	}

});


$("#fileOpenMenuBtn").click(function() {
	document.getElementById('fileinput').click();
});


$("#fileOpenAsLayerBtn").click(function() {
	//document.getElementById('fileinput').click();
	// alert("open image as layer");
	
	//alert(editStack.stack.length);
	
	if(editStack.stack.length == 0){

		// 1. Open and start New File Project
		document.getElementById("fileinput").click();
		
	}else{
	
		// 2. Open as Image as Layer in current file project
		
		// apply any edits such as filter that were not applied with the 'Apply' button
		layerPanel.checkUnappliedEdit();
	
		var x = document.createElement("INPUT");
		x.setAttribute("type", "file");	
		x.setAttribute("accept", "image/*");	
		
		x.addEventListener('input', function(){
		
			//alert("alert add image");

			
			if(this.files.length > 0){
			
				//alert(this.files[0].name);
				//loadFile(this.files[0]);
				
				let reader = new FileReader();
				reader.onload = function(){
				
					let dataURL = reader.result;
					// alert(dataURL);
					
					var loadImage = new Image();
					loadImage.onload = function(){
					
						// Store Layer Index - the layer be added at an index higher than current so store incremented index
						EditorUtils.storeLayerIndex(parseInt(layerIndex) + 1);							
					
						var newLayerEditEntry = {};
						newLayerEditEntry["edit"] = "add_new_layer";
						newLayerEditEntry["flag"] = "continue";
						// add to the edit stack
						editStack.add(newLayerEditEntry);						
					
						var asset_id = Date.now();
						assetManager.add(asset_id, "image_data_url", dataURL);
						
						var layerImageEditEntry = {};
						layerImageEditEntry["edit"] = "load_image_to_layer";
						layerImageEditEntry["edit_label"] = "New Image Layer";
						layerImageEditEntry["asset_id"] = asset_id;	

						// add to the edit stack
						editStack.add(layerImageEditEntry);	

						// apply and update the editor with the change
						applyEditHistory();						
					
						//alert(loadImage.width + "," + loadImage.height);
						
					};
					loadImage.src = dataURL;
					


				};
				reader.readAsDataURL(this.files[0]);
				
			}
		
		});
		
		x.click();	
	}

	
});

$("#fileExportMenuBtn").click(function() {
	// alert("Go to download page");
	if(editStack.stack.length == 0){
		// don't open file save page if no stuff to edit 
	}else{
		//window.location = "/image/save";
		
		var sizeLbl = document.createElement("span");
		sizeLbl.id = "saveFileDialogSizeLbl";
		sizeLbl.style = "color: #fff;";		
		
		// build the body of the Save Image dialog
		var saveImageDialogBody = document.createElement("div");
		saveImageDialogBody.style = "min-width: 300px;";
		
			//==============================
			// LEFT panel of save as dialog - Contains thumbnail of the image
			//==============================
			var leftDialogPanelDiv = document.createElement("div");
			//leftDialogPanelDiv.style = "float: left; text-align: center; height: 300px; width: 200px; overflow-y: hidden; background-color: rgb(54, 55, 58);";
			leftDialogPanelDiv.style = "float: left; text-align: center; height: 300px; width: 200px; overflow-y: hidden;";
			
				var image = new Image();
				image.onload = function(){
				
					var sameFileDialogThumb = document.createElement("img");		
					sameFileDialogThumb.id = "sameFileDialogThumb";					
				
					// If the image is wider than 200 pixels then shrink it by styling the width
					if(image.width < 200){
						
					}else{
						sameFileDialogThumb.style = "width: 200px;";					
					}
					
					/*
					if(image.width > 200){
						sameFileDialogThumb.style.transform = "scale(.5)";
					}
					*/
					
					sameFileDialogThumb.src = image.src;
					
					leftDialogPanelDiv.appendChild(sameFileDialogThumb);				
				}
				var canvas = EditorUtils.getSaveImage();
				
				canvas.toBlob(function(blob) {
					//alert(blob.size);
					//imageByteSizeLbl.innerText = (blob.size/1000).toFixed(1) + " KB";
					//sizeLbl.innerHTML = "Size:&nbsp;&nbsp;" + blob.size + " B";
					sizeLbl.innerHTML = "Size:&nbsp;&nbsp;" + EditorUtils.bytesToSize(blob.size, " ");
				}, 'image/jpeg', 1);	
			
				image.src = canvas.toDataURL('image/jpeg', 1);
			//==============================
			// RIGHT panel of save as dialog
			//==============================
			var rightDialogPanelDiv = document.createElement("div");
			rightDialogPanelDiv.style = "float: left; padding: 0px 60px 0px 15px;";
			
					var formatLbl = document.createElement("span");
					formatLbl.style = "color: #fff;";
					formatLbl.appendChild(document.createTextNode("Format:"));			
			
				rightDialogPanelDiv.appendChild(formatLbl);	
				
				rightDialogPanelDiv.appendChild(document.createElement("br"));	
			
					// File type selector
					var saveFileTypeSelect = document.createElement("select");
					saveFileTypeSelect.id = "saveFileTypeSelect";
					saveFileTypeSelect.style = "margin: 8px 0px 0px 0px;";
					saveFileTypeSelect.onchange = function(){
						//alert(saveFileTypeSelect.value);
						if(saveFileTypeSelect.value == "image/png"){
						
							// Since we've selected PNG disable the quality controls
							document.getElementById("saveFileQaulityTxt").disabled = true;
							document.getElementById("saveFileQaulityTxt").style.opacity = 0.2;							
							document.getElementById("saveFileQaulitySlider").disabled = true;
							document.getElementById("saveFileQaulitySlider").style.opacity = 0.2;
							document.getElementById("saveFileDialogQualityLbl").style.opacity = 0.2;
						
							// Update the save file dialog thumb
							EditorUtils.updateSaveFileDialogThumb();							
						}
						if(saveFileTypeSelect.value == "image/jpeg"){
						
							// Since we've selected JPEG enable the quality controls
							document.getElementById("saveFileQaulityTxt").disabled = false;
							document.getElementById("saveFileQaulityTxt").style.opacity = 1;							
							document.getElementById("saveFileQaulitySlider").disabled = false;
							document.getElementById("saveFileQaulitySlider").style.opacity = 1;	
							document.getElementById("saveFileDialogQualityLbl").style.opacity = 1;
						
							// Update the save file dialog thumb
							EditorUtils.updateSaveFileDialogThumb(document.getElementById("saveFileTypeSelect").value, document.getElementById("saveFileQaulitySlider").value);						
						}				
					}
					
					var mimeTypes = { 
						"JPEG(compressed format)": "image/jpeg", 
						"PNG(Transparency, lossless )": "image/png"
					};
					
					for (var property in mimeTypes) {
						var opt = document.createElement("option");	
						opt.value = mimeTypes[property];					
						opt.innerHTML = property; // whatever property it has
						saveFileTypeSelect.appendChild(opt);
					}	

				rightDialogPanelDiv.appendChild(saveFileTypeSelect);	
								
				rightDialogPanelDiv.appendChild(document.createElement("br"));	
				rightDialogPanelDiv.appendChild(document.createElement("br"));	
				
					var qualityLbl = document.createElement("span");
					qualityLbl.id = "saveFileDialogQualityLbl";
					qualityLbl.style = "color: #fff;;";
					qualityLbl.appendChild(document.createTextNode("Quality:"));
					
				rightDialogPanelDiv.appendChild(qualityLbl);	

					// File quality text
					var saveFileQaulityTxt = document.createElement("input");
					saveFileQaulityTxt.id = "saveFileQaulityTxt";
					saveFileQaulityTxt.style = "margin: 0px 0px 0px 10px; width: 45px;";
					saveFileQaulityTxt.type = "number";
					saveFileQaulityTxt.value = 100;
					saveFileQaulityTxt.onchange = function(){
						//alert(document.getElementById("saveFileQaulityTxt").value);
						if(document.getElementById("saveFileQaulityTxt").value > 100){
							document.getElementById("saveFileQaulityTxt").value = 100;
						}
						if(document.getElementById("saveFileQaulityTxt").value < 0){
							document.getElementById("saveFileQaulityTxt").value = 0;
						}
						document.getElementById("saveFileQaulitySlider").value = document.getElementById("saveFileQaulityTxt").value;
						// Update the save file dialog thumb
						EditorUtils.updateSaveFileDialogThumb(document.getElementById("saveFileTypeSelect").value, document.getElementById("saveFileQaulitySlider").value);	
												
					}
					
				rightDialogPanelDiv.appendChild(saveFileQaulityTxt);				
				
				rightDialogPanelDiv.appendChild(document.createElement("br"));	
				
					// File quality slider
					var saveFileQaulitySlider = document.createElement("input");
					saveFileQaulitySlider.id = "saveFileQaulitySlider";
					saveFileQaulitySlider.style = "width: 200px; margin: 8px 0px 0px 0px;";
					saveFileQaulitySlider.type = "range";
					saveFileQaulitySlider.min = 0;
					saveFileQaulitySlider.max = 100;
					saveFileQaulitySlider.value = 100;
					saveFileQaulitySlider.onchange = function(){
						//alert(document.getElementById("saveFileQaulitySlider").value);
						document.getElementById("saveFileQaulityTxt").value = document.getElementById("saveFileQaulitySlider").value;
						// Update the save file dialog thumb
						EditorUtils.updateSaveFileDialogThumb(document.getElementById("saveFileTypeSelect").value, document.getElementById("saveFileQaulitySlider").value);						
					}
					saveFileQaulitySlider.oninput = function(){
						//update the qulity number input constantly as we slide
						document.getElementById("saveFileQaulityTxt").value = document.getElementById("saveFileQaulitySlider").value;
					}

				rightDialogPanelDiv.appendChild(saveFileQaulitySlider);	

			
			// END float panels
			var endDialogPanelDiv = document.createElement("div");
			endDialogPanelDiv.style = "clear: both;";

			//==============================
			// FOOTER panel of save as dialog
			//==============================
			var footerDialogPanelDiv = document.createElement("div");
			footerDialogPanelDiv.style = "text-align: right; padding-top: 15px;";
			
				var footerLeftDiv = document.createElement("div");
				footerLeftDiv.style = "float: left; padding: 8px 0px 0px 0px;";	

					footerLeftDiv.appendChild(sizeLbl);					
				
				var footerRightDiv = document.createElement("div");
				footerRightDiv.style = "float: right;";
				
					var cancelBtn = document.createElement("input");
					cancelBtn.type = "button";
					cancelBtn.style = "margin: 0px 10px 0px 0px;";
					cancelBtn.value = "Cancel";
					cancelBtn.onclick = function(){
						// tell the dialog to close itself
						if(document.getElementById("activeDialog")){
							document.body.removeChild(document.getElementById("activeDialog"));
						}	
					}
					
				
					var saveBtn = document.createElement("input");
					saveBtn.type = "button";
					//saveBtn.style = "background-image: linear-gradient(rgb(54, 55, 58), rgb(34, 35, 38));";
					//saveBtn.style = "background-color: rgb(34, 35, 38);";
					saveBtn.value = "Save Image";
					saveBtn.onclick = function(){
					
						EditorUtils.saveImage(document.getElementById("saveFileTypeSelect").value, document.getElementById("saveFileQaulitySlider").value);
						
						// tell the dialog to close itself
						if(document.getElementById("activeDialog")){
							document.body.removeChild(document.getElementById("activeDialog"));
						}	
						
					}

					footerRightDiv.appendChild(cancelBtn);	
					footerRightDiv.appendChild(saveBtn);	
								
				var footerEndDiv = document.createElement("div");
				footerEndDiv.style = "clear: both;";

			footerDialogPanelDiv.appendChild(footerLeftDiv);	
			footerDialogPanelDiv.appendChild(footerRightDiv);	
			footerDialogPanelDiv.appendChild(footerEndDiv);	

		
		saveImageDialogBody.appendChild(leftDialogPanelDiv);
		saveImageDialogBody.appendChild(rightDialogPanelDiv);
		saveImageDialogBody.appendChild(endDialogPanelDiv);
		saveImageDialogBody.appendChild(footerDialogPanelDiv);
			
		// Open the dialog with the title, body components and functionality
		EditorUtils.openDialog("Save Image", saveImageDialogBody);
		
	}
});

$("#undoMenuBtn").click(function() {

	// editOptionsDiv
	// Check if this is a page with an apply edit button like blur, brightness, filters etc 
	// then we check with there were alterations made that should just be reset before doing 
	// undo operations on the edit stack
	if(document.getElementById("applyEditBtn")){
		//alert("there is an apply edit button");
		
		if(editsMade){
			// Reset the edit and don't do undo
			if(document.getElementById("resetEditBtn")){	
				document.getElementById("resetEditBtn").click();
			}
			return;
		}

	}

	if(editStack.stack.length > 0){

	}else{
		return;
	}
	
	// If the current edit is a "start" we cannot go back beyond it
	if(editStack.stack[editStack.index].edit == "start"){
		//console.log("cannot go beyond start");
		return;
	}
	
	editStack.undo();
	
	applyEditHistory();
	resetToolControls();
	
});

$("#redoMenuBtn").click(function() {

	// editOptionsDiv
	// Check if this is a page with an apply edit button like blur, brightness, filters etc 
	// then we check with there were alterations made that should just be reset before doing 
	// undo operations on the edit stack
	if(document.getElementById("applyEditBtn")){
		//alert("there is an apply edit button");
		
		if(editsMade){
			// Reset the edit and don't do undo
			if(document.getElementById("resetEditBtn")){	
				document.getElementById("resetEditBtn").click();
			}
			// Don't return as in the undo case
			//return;
		}

	}

	if(editStack.stack.length > 0){
	}else{
		return;
	}
	
	editStack.redo();
	
	applyEditHistory();
	resetToolControls();
	
});

$("#closeSelectionMenuBtn").click(function() {

	if(editStack.stack.length > 0 && typeof(activeSelectionArea) !== "undefined"){
		// continue
	}else{
		//alert("no edits or active selection");
		return;
	}
	
	layerPanel.checkUnappliedEdit();	

	// alert("close selection");
	invertSelection = false;
	selectionActive = false;
	activeSelectionArea = undefined;
	clearInterval(selectionMarchingAntsInterval);

	setTimeout(function(){
		updateToolCanvas();
		//updateEditorCanvas();
		
		if(document.getElementById("toolDrawCanvas")){
			toolDrawCtx.clearRect(0, 0, toolDrawCtx.canvas.width, toolDrawCtx.canvas.height);
		}
		
	}, 260);


	
	// we also store the mouseOffsetLeft, mouseOffsetTop for drawing on the toolDrawCanvas because they may not be set initially
	
	//let selectEditEntry = {edit: "close_select"};
	
	var selectEditEntry = new Object();
	selectEditEntry.edit = "close_select";
	selectEditEntry.edit_label = "Close Selection";

	//alert(JSON.stringify(deleteEditEntry));
	
	// add to the crop edit stack
	editStack.add(selectEditEntry);
	
	//applyEditHistory();	
});

$("#invertSelectionMenuBtn").click(function() {

	if(editStack.stack.length > 0 && typeof(activeSelectionArea) !== "undefined"){
		// continue
	}else{
		// alert("no edits or active selection");
		return;
	}
	
	layerPanel.checkUnappliedEdit();	

	//if (typeof(activeSelectionArea) !== "undefined" && selectionActive){
	
		invertSelection = !invertSelection;
		activeSelectionArea.invert = !activeSelectionArea.invert;

		// we also store the mouseOffsetLeft, mouseOffsetTop for drawing on the toolDrawCanvas because they may not be set initially
		//let selectEditEntry = {edit: "select", selection: activeSelectionArea, offsetLeft: mouseOffsetLeft, offsetTop: mouseOffsetTop};
		
		//let selectEditEntry = {edit: "invert_selection", edit_label: "Invert Selection"};
		
		var selectEditEntry = new Object();
		selectEditEntry.edit = "invert_selection";
		selectEditEntry.edit_label = "Invert Selection";

		//alert(JSON.stringify(deleteEditEntry));
		
		// add to the crop edit stack
		editStack.add(selectEditEntry);		
		
		if(document.getElementById("editName") && document.getElementById("editName").value == "background_eraser"){
			if(document.getElementById("clippingCanvas")){
				// redraw the clipping canvas inverted
				//drawSelectionClipping()
				EditorUtils.drawSelectionClipping(document.getElementById("clippingCanvas").getContext("2d"), invertSelection,"green",activeSelectionArea, false);
			}
		}
		if(document.getElementById("selectionCanvas")){
			EditorUtils.drawSelectionClipping(document.getElementById("selectionCanvas").getContext("2d"), invertSelection,"green",activeSelectionArea, false);			
		}
		
		//applyEditHistory();
	//}
});


$("#transformSelectionMenuBtn").click(function() {
	//alert("transform selection");
	if(activeSelectionArea){
		
		transformSelection = true;	
	}else{
		//alert("there is no selection");
	}
});

$("#clearSelectionMenuBtn").click(function() {

	// *Nb. Cannot Edit Non-Rasterized Layers
	// cannot edit layer that is not rasterized
	if('object' in layerStack[layerIndex]){
		alert("This layer must be rasterized to apply this edit.");
		return;
	}

	if(editStack.stack.length > 0 && typeof(activeSelectionArea) !== "undefined"){
		// continue
	}else{
		// alert("no edits or active selection");
		return;
	}

	//if(typeof activeSelectionArea === 'undefined'){
	//}else{

		if(editStack.stack.length > 0){
		}else{
			return;
		}
		
		/*
		let deleteEditEntry = {
			edit: "delete", 
			shape: activeSelectionArea.shape, 
			geometry: activeSelectionArea.geometry, 
			invert: activeSelectionArea.invert
		};
		*/
		
		var deleteEditEntry = new Object();
		deleteEditEntry.edit = "delete";
		deleteEditEntry.edit_label = "Clear";
		deleteEditEntry.shape = activeSelectionArea.shape;
		deleteEditEntry.geometry = activeSelectionArea.geometry;
		deleteEditEntry.invert = activeSelectionArea.invert;

		//alert(JSON.stringify(deleteEditEntry));
		
		// add to the crop edit stack
		editStack.add(deleteEditEntry);
		
		applyEditHistory();		
	
	//}
});

$("#toggleViewSelectionMenuBtn").click(function() {
	// alert("toggle selection view");
	if(document.getElementById("editToolsDrawingsDiv").style.visibility == "visible"){
		toggleViewSelectionBtn.value = "Show";
		document.getElementById("editToolsDrawingsDiv").style.visibility = "hidden";	
	}else{
		toggleViewSelectionBtn.value = "Hide";
		document.getElementById("editToolsDrawingsDiv").style.visibility = "visible";		
	}
});

// IMAGE Menu
// Transform > Flip Vertically
$("#flipImageHorizontallyMenuBtn").click(function() {

	//if(layerStack && layerStack.length > 0){
	if(editStack.stack.length > 0){
	
	}else{
		alert("No opened document");
		return;
	}	

	// apply any edits such as filter that were not applied with the 'Apply' button
	layerPanel.checkUnappliedEdit();

	var flipEditEntry = new Object();
	flipEditEntry.edit = "flip_image";
	flipEditEntry.edit_label = "Flip Image";
	flipEditEntry.direction = "horizontal";
	
	// add to the flip_image edit to the stack
	editStack.add(flipEditEntry);
	
	applyEditHistory();
	
});

// Transform > Flip Vertically
$("#flipImageVerticallyMenuBtn").click(function() {

	//if(layerStack && layerStack.length > 0){
	if(editStack.stack.length > 0){
	
	}else{
		alert("No opened document");
		return;
	}	
	
	// apply any edits such as filter that were not applied with the 'Apply' button
	layerPanel.checkUnappliedEdit();

	var flipEditEntry = new Object();
	flipEditEntry.edit = "flip_image";
	flipEditEntry.edit_label = "Flip Image";
	flipEditEntry.direction = "vertical";
	
	// add to the flip_image edit to the stack
	editStack.add(flipEditEntry);
	
	applyEditHistory();
	
});

// Transform > Rotate Image 90 Clockwise
$("#rotateImage90ClockMenuBtn").click(function() {

	//alert("rotate image 90 clockwise");
	
	//if(layerStack && layerStack.length > 0){
	if(editStack.stack.length > 0){
	
	}else{
		alert("No opened document");
		return;
	}	
	
	// apply any edits such as filter that were not applied with the 'Apply' button
	layerPanel.checkUnappliedEdit();

	var rotateImageEditEntry = new Object();
	rotateImageEditEntry.edit = "rotate_image";
	rotateImageEditEntry.edit_label = "Rotate";
	rotateImageEditEntry.angle = 90;
	
	// add to the flip_image edit to the stack
	editStack.add(rotateImageEditEntry);
	
	applyEditHistory();
	
});

// Transform > Rotate Image 90 Counter - Clockwise
$("#rotateImage90CClockMenuBtn").click(function() {

	//if(layerStack && layerStack.length > 0){
	if(editStack.stack.length > 0){
	
	}else{
		alert("No opened document");
		return;
	}	
	
	// apply any edits such as filter that were not applied with the 'Apply' button
	layerPanel.checkUnappliedEdit();

	var rotateImageEditEntry = new Object();
	rotateImageEditEntry.edit = "rotate_image";
	rotateImageEditEntry.edit_label = "Rotate";
	rotateImageEditEntry.angle = -90;
	
	// add to the flip_image edit to the stack
	editStack.add(rotateImageEditEntry);
	
	applyEditHistory();
	
});

// Transform > Rotate Image 180
$("#rotateImage180ClockMenuBtn").click(function() {

	//if(layerStack && layerStack.length > 0){
	if(editStack.stack.length > 0){
	
	}else{
		alert("No opened document");
		return;
	}	
	
	// apply any edits such as filter that were not applied with the 'Apply' button
	layerPanel.checkUnappliedEdit();

	//alert("rotate image 180");

	// apply any edits such as filter that were not applied with the 'Apply' button
	layerPanel.checkUnappliedEdit();

	var rotateImageEditEntry = new Object();
	rotateImageEditEntry.edit = "rotate_image";
	rotateImageEditEntry.edit_label = "Rotate";
	rotateImageEditEntry.angle = 180;
	
	// add to the flip_image edit to the stack
	editStack.add(rotateImageEditEntry);
	
	applyEditHistory();
	
});


// Image > Trim
$("#trimImageMenuBtn").click(function() {

	//if(layerStack && layerStack.length > 0){
	if(editStack.stack.length > 0){
	
	}else{
		//alert("No opened document");
		return;
	}	
	
	// apply any edits such as filter that were not applied with the 'Apply' button
	layerPanel.checkUnappliedEdit();

	// alert("trim image");

	var trimImageEditEntry = new Object();
	trimImageEditEntry.edit = "trim_image";
	trimImageEditEntry.edit_label = "Crop Image";
	
	// add to the flip_image edit to the stack
	editStack.add(trimImageEditEntry);
	
	applyEditHistory();
	
});

// Image > Crop To Selection
$("#cropToSelectionMenuBtn").click(function() {
	//if(layerStack && layerStack.length > 0){
	if(editStack.stack.length > 0){
	
	}else{
		//alert("No opened document");
		return;
	}	
	
	// apply any edits such as filter that were not applied with the 'Apply' button
	layerPanel.checkUnappliedEdit();

	// alert("trim image");
	if(invertSelection || !activeSelectionArea){
		// Cant crop to inverted selection because its the same as the whole canvas
		return;
	}

	var cropToSelectionEditEntry = new Object();
	cropToSelectionEditEntry.edit = "crop_to_selection";
	cropToSelectionEditEntry.edit_label = "Crop Image";
	
	// add to the flip_image edit to the stack
	editStack.add(cropToSelectionEditEntry);
	
	applyEditHistory();	
});

$("#newLayerMenuBtn").click(function() {

	layerPanel.addNewLayer();
	
});

$("#deleteLayerMenuBtn").click(function() {

	layerPanel.deleteCurrentLayer();
	
});


$("#duplicateLayerMenuBtn").click(function() {

	layerPanel.duplicateLayer();
	
});

$("#rasterizeLayerMenuBtn").click(function() {

	//alert("rasterize layer");	
	var rasterizeEditEntry = new Object();
	rasterizeEditEntry.edit = "rasterize_layer";
	rasterizeEditEntry.edit_label = "Rasterize Layer";
	rasterizeEditEntry.layer_index = layerIndex;

	// add to the crop edit stack
	editStack.add(rasterizeEditEntry);
	
	applyEditHistory();
	
});

/*
$("#addLayerMaskMenuBtn").click(function() {

	layerPanel.addLayerRasterMask();
		
});
*/

$("#deleteLayerMaskMenuBtn").click(function() {

	layerPanel.deleteLayerRasterMask();
		
});

$("#applyLayerRasterMaskMenuBtn").click(function() {

	layerPanel.applyLayerRasterMask();
		
});

$("#toggleEnableLayerRasterMaskMenuBtn").click(function() {

	layerPanel.toggleEnableLayerRasterMask();
		
});

$("#mergeLayerDownMenuBtn").click(function() {

	layerPanel.mergeLayerDown();
		
});

$("#mergeLayerUpMenuBtn").click(function() {

	layerPanel.mergeLayerUp();
		
});



// MENU BAR DROWDOWN FUNCTIONS

// variables for menu bar code
var globalMenuBarButtonEntered = false;
var menubarBtnHoverTimeout = 180;

/* When the user clicks on the button, 
toggle between hiding and showing the dropdown content */
function showFileDropdown() {

	globalMenuBarButtonEntered = true;
	
	// showing the file menubar dropdown if there is nothing loaded in the editor
	// we show 'Save Image' as disabled
	if(editStack.stack.length == 0){
		document.getElementById("fileExportMenuBtn").style.color = "rgb(160, 160, 160)";
	}else{
		document.getElementById("fileExportMenuBtn").style.color = "rgb(0, 0, 0)";
	}

	setTimeout(function(){ 
		if(globalMenuBarButtonEntered){
			closeAllDropdowns();
			document.getElementById("fileDropdown").classList.toggle("show");		
		}
	}, menubarBtnHoverTimeout);
	
}

function showEditDropdown() {

	globalMenuBarButtonEntered = true;
	
	setTimeout(function(){ 
		if(globalMenuBarButtonEntered){
			closeAllDropdowns();
			document.getElementById("editDropdown").classList.toggle("show");	
		}
	}, menubarBtnHoverTimeout);
}

function showImageDropdown() {

	globalMenuBarButtonEntered = true;

	setTimeout(function(){ 
		if(globalMenuBarButtonEntered){
			closeAllDropdowns();
			document.getElementById("imageDropdown").classList.toggle("show");
		}
	}, menubarBtnHoverTimeout);

}

function showSelectDropdown() {

	globalMenuBarButtonEntered = true;
	
	setTimeout(function(){ 
		if(globalMenuBarButtonEntered){
			closeAllDropdowns();
			document.getElementById("selectDropdown").classList.toggle("show");
		}
	}, menubarBtnHoverTimeout);

}

function showToolDropdown() {

	globalMenuBarButtonEntered = true;
	
	setTimeout(function(){ 
		if(globalMenuBarButtonEntered){
			closeAllDropdowns();
			document.getElementById("toolDropdown").classList.toggle("show");		
		}
	}, menubarBtnHoverTimeout);

}

function showLayerDropdown(){

	globalMenuBarButtonEntered = true;
	
	// If the layer is an object layer enable rasterize option
	//if(layerStack && layerStack.length > 0){
	if(layerStack.length > 0){
	
		// 'Rasterize' Menu Item
		if('object' in layerStack[layerIndex]){
			// console.log("object layer");
			document.getElementById("rasterizeLayerMenuBtn").style.color = "rgb(0, 0, 0)";
		}else{
			// console.log("raster layer");
			document.getElementById("rasterizeLayerMenuBtn").style.color = "rgb(160, 160, 160)";
		}

		// 'Merge Down' & 'Merge Up' menu items
		if(layerStack.length == 1){
			document.getElementById("mergeLayerDownMenuBtn").style.color = "rgb(160, 160, 160)";			
			document.getElementById("mergeLayerUpMenuBtn").style.color = "rgb(160, 160, 160)";			
		}else{
		
			if(layerIndex > 0){
				document.getElementById("mergeLayerDownMenuBtn").style.color = "rgb(0, 0, 0)";
			}else{
				document.getElementById("mergeLayerDownMenuBtn").style.color = "rgb(160, 160, 160)";		
			}

			if(layerIndex == (layerStack.length - 1)){
				document.getElementById("mergeLayerUpMenuBtn").style.color = "rgb(160, 160, 160)";
			}else{
				document.getElementById("mergeLayerUpMenuBtn").style.color = "rgb(0, 0, 0)";	
			}
			
		}
		
		/*
		if(layerIndex > 0){
			document.getElementById("mergeLayerDownMenuBtn").style.color = "rgb(0, 0, 0)";
		}else{
			document.getElementById("mergeLayerDownMenuBtn").style.color = "rgb(160, 160, 160)";		
		}
		*/
		
	}else{
	
		//document.getElementById("newLayerMenuBtn").style.color = "rgb(160, 160, 160)";	
		//document.getElementById("duplicateLayerMenuBtn").style.color = "rgb(160, 160, 160)";	
		document.getElementById("rasterizeLayerMenuBtn").style.color = "rgb(160, 160, 160)";	
		
	}
	
	if(layerStack.length > 0){
		if('raster_mask' in layerStack[layerIndex]){
		
			document.getElementById("addOpaqueLayerMaskMenuBtn").style.color = "rgb(160, 160, 160)";
			document.getElementById("addTransparentLayerMaskMenuBtn").style.color = "rgb(160, 160, 160)";
			
			document.getElementById("deleteLayerMaskMenuBtn").style.color = "rgb(0, 0, 0)";
		}else{
		
			document.getElementById("addOpaqueLayerMaskMenuBtn").style.color = "rgb(0, 0, 0)";
			document.getElementById("addTransparentLayerMaskMenuBtn").style.color = "rgb(0, 0, 0)";
			
			document.getElementById("deleteLayerMaskMenuBtn").style.color = "rgb(160, 160, 160)";
		}	
	}
	
	setTimeout(function(){ 
		if(globalMenuBarButtonEntered){
			closeAllDropdowns();
			document.getElementById("layerDropdown").classList.toggle("show");		
		}
	}, menubarBtnHoverTimeout);

}

function showColorDropdown() {

	globalMenuBarButtonEntered = true;

	setTimeout(function(){ 
		if(globalMenuBarButtonEntered){
			closeAllDropdowns();
			document.getElementById("filterDropdown").classList.toggle("show");	
		}
	}, menubarBtnHoverTimeout);	

}

function menuBarButtonLeft(){
	globalMenuBarButtonEntered = false;
}

function closeAllDropdowns(){
	let dropDown = document.getElementsByClassName("dropdown-content");
	for(let i = 0; i < dropDown.length; i++){
		dropDown[i].classList.remove('show');
	}
}

function resetToolControls(){

	if(document.getElementById("blurValueSlider")){
		document.getElementById("blurValueSlider").value = 0;
		editsMade = false;
	}
	
	if(document.getElementById("brightnessValueSlider")){
		document.getElementById("brightnessValueSlider").value = 100;
		editsMade = false;
	}	
	
	if(document.getElementById("contrastValueSlider")){
		document.getElementById("contrastValueSlider").value = 100;
		editsMade = false;
	}	
}

fileinput.accept=".png, .jpg, .jpeg, .bmp, .svg";

// Drag drop events handler
var dragOver = false;

var drop_zone = document.getElementById("drop_zone");

if(drop_zone){
	drop_zone.addEventListener("drop", dropHandler);

	drop_zone.addEventListener("dragover", dragOverHandler);
}

function dropHandler(ev) {
	// console.log('File(s) dropped');
	// alert('File(s) dropped');

	dragOver = false;
  
	// Prevent default behavior (Prevent file from being opened)
	ev.preventDefault();

	if (ev.dataTransfer.items) {
		// Use DataTransferItemList interface to access the file(s)
		/*
		for (var i = 0; i < ev.dataTransfer.items.length; i++) {
			// If dropped items aren't files, reject them
			if (ev.dataTransfer.items[i].kind === 'file') {
				var dropfile = ev.dataTransfer.items[i].getAsFile();
				//console.log('... file[' + i + '].name = ' + file.name);
				if(i == 0){
					// Load the gif file using the file 
					loadFile(dropfile);	
					break;			
				}
			}
		}
		*/
		var dropfile = ev.dataTransfer.items[0].getAsFile();

		loadFile(dropfile);		
		
	} else {
		/*
		// Use DataTransfer interface to access the file(s)
		for (var i = 0; i < ev.dataTransfer.files.length; i++) {
			//console.log('... file[' + i + '].name = ' + ev.dataTransfer.files[i].name);
			if(i == 0){
				// Load the gif file using the file 
				loadFile(ev.dataTransfer.files[0]);	
				break;			
			}
		}
		*/
		var dropfile = ev.dataTransfer.files[0];

		loadFile(dropfile);				
	}
  
}

function dragOverHandler(ev) {

	// Prevent default behavior (Prevent file from being opened)
	ev.preventDefault();
  
	if(!dragOver){
		dragOver = true;
		// console.log('File(s) in drop zone'); 
	}else{
		return;
	}

}

function showSubmenu(id){

	// 1. get the submenu item by its passed id
	var submenu_elem = document.getElementById(id);
	
	// 2. make it visible
	submenu_elem.style.display = "block";
	//console.log(submenu_elem.parentElement.id);
	
	// 3. get the bounding box of the parent menu item
	var parentMenuItemBBox = submenu_elem.parentElement.getBoundingClientRect();
	
	// console.log(JSON.stringify(parentMenuItemBBox));
	
	//4. move the submenu item over by the width of the 
	submenu_elem.style.left = (parentMenuItemBBox.width) + "px";
}

function closeSubmenu(id){
	var submenu_elem = document.getElementById(id);
	submenu_elem.style.display = "none";
}