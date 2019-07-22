// Copyright (c) 2019 Kasey Thomas. All rights reserved.
// Use of this source code is governed by the EULA.

'use strict';

var layerPanel = {
	historyPanelItemIndex: 0
};

layerPanel.start = function(){

}

layerPanel.showCanvasSizeDialog = function(){

	
	var canvasSizeDialogBody = document.createElement("div");
	canvasSizeDialogBody.style = "min-width: 300px;";

		// Canvas width input element
		var canvasWidthInput = document.createElement("input");
		canvasWidthInput.style.width = "50px";
		canvasWidthInput.id = "canvasWidthInput";
		canvasWidthInput.type = "number";
		canvasWidthInput.value = canvasWidth;
		
		// Canvas height input element
		var canvasHeightInput = document.createElement("input");
		canvasHeightInput.style.width = "50px";
		canvasHeightInput.id = "canvasHeightInput";
		canvasHeightInput.type = "number";
		canvasHeightInput.value = canvasHeight;
		
		// set canvas size button
		var canvasSizeDialogConfirmBtn = document.createElement("input");
		canvasSizeDialogConfirmBtn.style = "width: 100px;";
		canvasSizeDialogConfirmBtn.type = "button";
		canvasSizeDialogConfirmBtn.value = "OK";
		canvasSizeDialogConfirmBtn.onclick = function(){
			//alert("set size");
			layerPanel.setCanvasSize(document.getElementById("canvasWidthInput").value, document.getElementById("canvasHeightInput").value);
			// tell the dialog to close itself
			if(document.getElementById("activeDialog")){
				document.body.removeChild(document.getElementById("activeDialog"));
			}			
		}
		
	canvasSizeDialogBody.appendChild( document.createTextNode('\u00A0'));	
	canvasSizeDialogBody.appendChild(document.createTextNode("Width: "));
	canvasSizeDialogBody.appendChild(canvasWidthInput);
	canvasSizeDialogBody.appendChild(document.createElement("br"));
	canvasSizeDialogBody.appendChild(document.createTextNode("Height: "));
	canvasSizeDialogBody.appendChild(canvasHeightInput);
	canvasSizeDialogBody.appendChild(document.createElement("br"));
	canvasSizeDialogBody.appendChild(document.createElement("br"));
	canvasSizeDialogBody.appendChild(canvasSizeDialogConfirmBtn);
		

	// Open the dialog with the title, body components and functionality
	EditorUtils.openDialog("Canvas Size", canvasSizeDialogBody);
	
}

layerPanel.setCanvasSize = function(width, height){

	//if(layerStack && layerStack.length > 0){
	if(editStack.stack.length > 0){
	
	}else{
		//alert("No opened document");
		return;
	}
	
	//alert(width + "," + height);
	
	// apply any edits such as filter that were not applied with the 'Apply' button
	layerPanel.checkUnappliedEdit();
	
	var setCanvasSizeEditEntry = new Object();
	setCanvasSizeEditEntry.edit = "set_canvas_size";
	setCanvasSizeEditEntry.edit_label = "Canvas Size";
	setCanvasSizeEditEntry.width = width;
	setCanvasSizeEditEntry.height = height;
	
	// add to the edit stack
	editStack.add(setCanvasSizeEditEntry);

	applyEditHistory();	
}

layerPanel.editCurrentLayerCanvas = function(layer, event){
	//alert("Edit the current layer canvas");
	
	event.stopPropagation();
	
	//alert(layerIndex + "," + layer);
	
	if(layer == layerIndex){
	
		EditorUtils.storeEditingLayerMask(0);	
		//alert("set mask 0");
		
		//editingLayerMask = 0;
		var setLayerMaskEditEntry = new Object();
		setLayerMaskEditEntry.edit = "set_layer_mask_edit";
		setLayerMaskEditEntry.mask = 0; // layer canvas (0), raster mask (1), or vector mask (2)
		setLayerMaskEditEntry.flag = "continue";
		
		// add to the edit stack
		editStack.add(setLayerMaskEditEntry);
		
		
		applyEditHistory();		
		
		//document.getElementById("layerCanvasSelectedBorder" + layerIndex).style.display = "block";
		//document.getElementById("layerRasterMaskSelectedBorder" + layerIndex).style.display	= "none";
	}
	
}

layerPanel.editCurrentLayerRasterMask = function(layer, event){

	event.stopPropagation();
	
	//alert("clicked");
	
	if(editingLayerMask == 1){
		//alert("already editing");
		return;
	}

	
	if('raster_mask' in layerStack[layerIndex]){
		//alert("Edit the current layer raster mask");
		if(layer == layerIndex){
		
			// editingLayerMask = 1; // layer canvas (0), raster mask (1), or vector mask (2)
			
			EditorUtils.storeEditingLayerMask(1);			
			
			// We wont use edits to change the 
		
			var setLayerMaskEditEntry = new Object();
			setLayerMaskEditEntry.edit = "set_layer_mask_edit";
			setLayerMaskEditEntry.mask = 1; // layer canvas (0), raster mask (1), or vector mask (2)
			setLayerMaskEditEntry.flag = "continue";
			
			// add to the edit stack
			editStack.add(setLayerMaskEditEntry);
			
			// refresh the layer panel and screen
			applyEditHistory();	
		
			
			//document.getElementById("layerCanvasSelectedBorder" + layerIndex).style.display = "none";
			//document.getElementById("layerRasterMaskSelectedBorder" + layerIndex).style.display	= "block";	
		}
	}
	
}

// This function applies any edit that was made (filter, grayscale, brightness etc) 
// before adding the layer modification edit to the stack
layerPanel.checkUnappliedEdit = function(){
	
	// This deals with filter etc adjustments that were made and not applied
	// before layer panel interaction. We apply the edit before
	// We layer duplicate, switch, add new, except delete
	if(document.getElementById("applyEditBtn")){
		//alert("there is an apply edit button");
		
		if(editsMade){
		
			// alert("edit made");
		
			applyHistory = false;
			document.getElementById("applyEditBtn").click();
		
			/*
			//if(confirm("Do you wish to apply the last adjustment")){
			if(confirm("The last edit you made was not applied.\nDo you wish to continue?")){
				
				// applyHistory = false;
				// document.getElementById("applyEditBtn").click();
				// document.getElementById("resetEditBtn").click();
			
			}else{
				//document.getElementById("resetEditBtn").click();
				return;
			}
			*/			
		}

	}
}

layerPanel.layerNameLabelClicked = function(index, event){
	// alert("layer name label " + index + " clicked");
	
	// stop event bubbling
	event.stopPropagation();
	
	// 1. set the value in the layer name input text entry
	document.getElementById("layerPanel_layerNameInput" + index).value = document.getElementById("layerPanel_layerNameHidden" + index).value;
	// 2. make the layer name input textbox visible
	document.getElementById("layerPanel_layerNameInput" + index).style.display = "inline";
	// 3. focus the now visible layer name text entry
	document.getElementById("layerPanel_layerNameInput" + index).focus();
	// 4. hide the layer label
	document.getElementById("layerPanel_layerNameLbl" + index).style.display = "none";
	
}

layerPanel.layerNameInputBlurred = function(index){
	// 1. make the layer name input textbox visible
	document.getElementById("layerPanel_layerNameInput" + index).style.display = "none";
	// 2. hide the layer label
	document.getElementById("layerPanel_layerNameLbl" + index).style.display = "inline";
}

layerPanel.layerNameInputKeyPressed = function(index, keyCode){
	//alert("key pressed");
	// alert(keyCode);
	if(keyCode == 13){
		// Enter was pressed
		// Check the layer name and change
		
		var layername = document.getElementById("layerPanel_layerNameInput" + index).value.trim();
		
		if (/\S/.test(layername)) {
			// Not empty string
		}else{
			alert("Please enter a valid Layer name");
			return;
		}
		
		if(layername.length > 64){
			layername = layername.substring(0, 64);
		}
		
		// 1. make the layer name input textbox visible
		document.getElementById("layerPanel_layerNameInput" + index).style.display = "none";
		// 2. hide the layer label
		document.getElementById("layerPanel_layerNameLbl" + index).style.display = "inline";
		
		// apply any edits such as filter that were not applied with the 'Apply' button
		layerPanel.checkUnappliedEdit();
	
		// set layer name
		var layerNameEditEntry = {};
		layerNameEditEntry["edit"] = "set_layer_name";
		layerNameEditEntry["edit_label"] = "Rename Layer";
		layerNameEditEntry["index"] = index;
		layerNameEditEntry["name"] = layername;
		// add to the edit stack
		editStack.add(layerNameEditEntry);

		applyEditHistory();		
	}
}

layerPanel.layerOpacityFocused = function(){

	// Any time we are going to update the opacity we apply any edits that werent
	// saved 	

	// 1. apply any edits such as filter that were not applied with the 'Apply' button
	layerPanel.checkUnappliedEdit();

	document.getElementById("layerOpacitySliderDiv").style.display = "block";

	// set the layerOpacitySliderDiv id label to be checked for click outside event check
	// put a delay so it doesn't check for this click event mouseup 
	setTimeout(function(){ 
		clickoutsideElementId = "layerOpacitySliderDiv";
	}, 500);

}

layerPanel.layerOpacitySliderMoved = function(opacityval){

	document.getElementById("layerOpacityTxtInput").value = opacityval + "%";

	
	//console.log(opacityval);
	//return;

	// In here we re-render the editor canvas with the opacity value in the layer changed
	// we do not add the opacity to the editstack until we stop moving and release the slider
	// in the onchanged event of the slider
		
	// change the opacity on the layer index and rerender the editor canvas
	layerStack[layerIndex].opacity = opacityval;

	// Draw all the layers to the editor canvas
	layerRenderEngine.renderAllLayers(editorCtx);
	//============================================	
	
}

layerPanel.layerOpacitySliderChanged = function(opacityval){

	//alert(opacityval);

	//alert("valid opacity");
	layerStack[layerIndex].opacity = parseInt(opacityval);
	
	// set layer name
	var layerOpacityEditEntry = {};
	layerOpacityEditEntry["edit"] = "set_layer_opacity";
	layerOpacityEditEntry["edit_label"] = "Set Layer Opacity";
	layerOpacityEditEntry["index"] = layerIndex;
	layerOpacityEditEntry["opacity"] = opacityval;
	// add to the edit stack
	editStack.add(layerOpacityEditEntry);

	applyEditHistory();			
	
}

layerPanel.layerOpacityInputKeyPressed = function(opacityval,index, keyCode){
	//alert(opacityval);
	if(keyCode == 13){
		//alert(opacityval.replace("%",""))
		
		var val = opacityval.replace("%","");
		
		if(!isNaN(val)){
			//alert(opacityval.replace("%",""));
			if(parseInt(val) >= 0 && parseInt(val) <= 100){
			
				// apply any edits such as filter that were not applied with the 'Apply' button
				layerPanel.checkUnappliedEdit();			
						
				//alert("valid opacity");
				layerStack[layerIndex].opacity = parseInt(val);
				
				// set layer name
				var layerOpacityEditEntry = {};
				layerOpacityEditEntry["edit"] = "set_layer_opacity";
				layerOpacityEditEntry["edit_label"] = "Set Layer Opacity";
				//layerOpacityEditEntry["index"] = index;
				layerOpacityEditEntry["index"] = layerIndex;
				layerOpacityEditEntry["opacity"] = val;
				// add to the edit stack
				editStack.add(layerOpacityEditEntry);

				applyEditHistory();		
				
			}else{
				alert("Enter an opacity value between 0 and 100 percent.");
				// refresh the editor to reload the opacity
				applyEditHistory();
			}
		}else{
			alert("Enter an opacity value between 0 and 100 percent.");
			// refresh the editor to reload the opacity
			applyEditHistory();
		}
	}
}

layerPanel.toggleLayerVisibility = function(index, event){
	// alert("toggle layer visibility");
	
	// stop event bubbling
	event.stopPropagation();
	
	// apply any edits such as filter that were not applied with the 'Apply' button
	layerPanel.checkUnappliedEdit();

	// set layer visibility
	var layerNameEditEntry = {};
	layerNameEditEntry["edit"] = "set_layer_visibility";
	layerNameEditEntry["edit_label"] = "Layer Visibility";
	layerNameEditEntry["index"] = index;
	
	if(layerStack[index].visible){
		layerNameEditEntry["visible"] = false;	
	}else{
		layerNameEditEntry["visible"] = true;	
	}

	// add to the edit stack
	editStack.add(layerNameEditEntry);

	applyEditHistory();	
	
}

layerPanel.deleteCurrentLayer = function(){

	//if(layerStack && layerStack.length > 0){
	if(editStack.stack.length > 0){
	
	}else{
		alert("No opened document");
		return;
	}

	if(layerStack.length == 1){
		alert("Can't delete the only layer");
		return;
	}
	
	// Store Layer Index - the layer will move down in the stack so we have to store a decremented layer index
	EditorUtils.storeLayerIndex(parseInt(layerIndex) - 1);
	
	// There is no point to applying edit to a layer that will be deleted
	/*
	// apply any edits such as filter that were not applied with the 'Apply' button
	layerPanel.checkUnappliedEdit();
	*/

	// delete current layer
	var deleteLayerEditEntry = {};
	deleteLayerEditEntry["edit"] = "delete_current_layer";	
	deleteLayerEditEntry["edit_label"] = "Delete Layer";	
	// add to the edit stack
	editStack.add(deleteLayerEditEntry);

	applyEditHistory();		
}

layerPanel.addLayerRasterMask = function(fill, use_selection = false){

	//alert(fill);

	if(layerStack.length <= 0){
		return;
	}

	// check if there is already a raster mask in the layer
	if('raster_mask' in layerStack[layerIndex]){
		//alert("Already contains raster mask");
		return;
	}
	
	EditorUtils.storeEditingLayerMask(1); // set to editing mask

	layerPanel.checkUnappliedEdit();

	//alert("rasterize layer");	
	var addLayerMaskEditEntry = new Object();
	addLayerMaskEditEntry.edit = "add_raster_mask";
	addLayerMaskEditEntry.edit_label = "Add Layer Mask";
	
	// If we are adding a mask with an active selection
	if(use_selection){ 
		// *Nb. use_selection set to true means it was clicked from the layer panel mask button.
		// This means we will create a mask with the unselected areas blacked out. The fill has to be 
		// set to black to avoid mask problems when moving the canvas
		// Problem Fix: # 7202019904
		if(typeof activeSelectionArea === 'undefined'){
			//alert("no active selection");
		}else{
			//alert("active selection");
			// change fill to black
			fill = "black";
		}	
	}
	addLayerMaskEditEntry.fill = fill;
	addLayerMaskEditEntry.layer_index = layerIndex;
	addLayerMaskEditEntry.use_selection = use_selection;

	// add to the crop edit stack
	editStack.add(addLayerMaskEditEntry);
	
	applyEditHistory();
	
}

layerPanel.deleteLayerRasterMask = function(){

	if(layerStack.length <= 0){
		return;
	}

	// check if there is  a raster mask in the layer
	if('raster_mask' in layerStack[layerIndex]){
		
	}else{
		//alert("No mask in layer");
		return;
	}
	
	EditorUtils.storeEditingLayerMask(0);
	
	layerPanel.checkUnappliedEdit();

	//alert("rasterize layer");	
	var deleteLayerMaskEditEntry = new Object();
	deleteLayerMaskEditEntry.edit = "delete_raster_mask";
	deleteLayerMaskEditEntry.edit_label = "Delete Layer Mask";
	deleteLayerMaskEditEntry.layer_index = layerIndex;

	// add to the crop edit stack
	editStack.add(deleteLayerMaskEditEntry);
	
	applyEditHistory();
	
}

layerPanel.applyLayerRasterMask = function(){

	if(layerStack.length <= 0){
		return;
	}

	// check if there is  a raster mask in the layer
	if('raster_mask' in layerStack[layerIndex]){
		
	}else{
		//alert("No mask in layer");
		return;
	}
	
	layerPanel.checkUnappliedEdit();

	//alert("rasterize layer");	
	var deleteLayerMaskEditEntry = new Object();
	deleteLayerMaskEditEntry.edit = "apply_raster_mask";
	deleteLayerMaskEditEntry.edit_label = "Apply Mask";
	deleteLayerMaskEditEntry.layer_index = layerIndex;

	// add to the crop edit stack
	editStack.add(deleteLayerMaskEditEntry);
	
	applyEditHistory();
	
}

layerPanel.toggleEnableLayerRasterMask = function(){

	if(layerStack.length <= 0){
		return;
	}

	// check if there is  a raster mask in the layer
	if('raster_mask' in layerStack[layerIndex]){
		
	}else{
		//alert("No mask in layer");
		return;
	}	

	layerPanel.checkUnappliedEdit();
	
	if(layerStack[layerIndex].raster_mask.enabled){
		// Disable the Layer Raster Mask

		var disableLayerRasterMaskEditEntry = new Object();
		disableLayerRasterMaskEditEntry.edit = "disable_raster_mask";
		disableLayerRasterMaskEditEntry.edit_label = "Disable Layer Mask";
		disableLayerRasterMaskEditEntry.layer_index = layerIndex;

		// add to the crop edit stack
		editStack.add(disableLayerRasterMaskEditEntry);
		
	}else{
		// Enable the Layer Raster Mask
		
		var enableLayerRasterMaskEditEntry = new Object();
		enableLayerRasterMaskEditEntry.edit = "enable_raster_mask";
		enableLayerRasterMaskEditEntry.edit_label = "Enable Layer Mask";
		enableLayerRasterMaskEditEntry.layer_index = layerIndex;

		// add to the crop edit stack
		editStack.add(enableLayerRasterMaskEditEntry);
	}	
	
	applyEditHistory();
	
}

// Link the raster mask
layerPanel.linkRasterMask = function(layerIndex){

	//alert(layerIndex);
	if(layerStack.length <= 0){
		return;
	}

	// check if there is  a raster mask in the layer
	if('raster_mask' in layerStack[layerIndex]){
		
	}else{
		//alert("No mask in layer");
		return;
	}
	
	layerPanel.checkUnappliedEdit();

	//alert("rasterize layer");	
	var linkRasterMaskEditEntry = new Object();
	linkRasterMaskEditEntry.edit = "link_raster_mask";
	linkRasterMaskEditEntry.edit_label = "Link Raster Mask";
	linkRasterMaskEditEntry.layer_index = layerIndex;

	// add to the crop edit stack
	editStack.add(linkRasterMaskEditEntry);
	
	// Must Fix 
	// There is an error where when editing text a new Text layer is 
	// popped on the layerstack when we don't reload the page
	// in any case the type tool must be updated
	//applyEditHistory();
	location.reload();
	
}

// Unlink the raster mask
layerPanel.unlinkRasterMask = function(layerIndex){

	//alert(layerIndex);

	//alert(layerIndex);
	if(layerStack.length <= 0){
		return;
	}

	// check if there is  a raster mask in the layer
	if('raster_mask' in layerStack[layerIndex]){
		
	}else{
		//alert("No mask in layer");
		return;
	}
	
	layerPanel.checkUnappliedEdit();

	//alert("rasterize layer");	
	var unlinkRasterMaskEditEntry = new Object();
	unlinkRasterMaskEditEntry.edit = "unlink_raster_mask";
	unlinkRasterMaskEditEntry.edit_label = "Unlink Raster Mask";
	unlinkRasterMaskEditEntry.layer_index = layerIndex;

	// add to the crop edit stack
	editStack.add(unlinkRasterMaskEditEntry);
	
	// Must Fix 
	// There is an error where when editing text a new Text layer is 
	// popped on the layerstack when we don't reload the page
	// in any case the type tool must be updated
	//applyEditHistory();
	location.reload();
	
}

layerPanel.addNewLayer = function(fill){

	// Add a new blank layer above the current layer index
	
	//alert(fill);

	//if(layerStack && layerStack.length > 0){
	if(editStack.stack.length > 0){
	
	}else{
		alert("No opened document");
		return;
	}
	
	// Store Layer Index - the layer will move down in the stack so we have to store a decremented layer index
	EditorUtils.storeLayerIndex(parseInt(layerIndex) + 1);

	// apply any edits such as filter that were not applied with the 'Apply' button
	layerPanel.checkUnappliedEdit();

	/*
	var addNewLayerEditEntry = {};
	addNewLayerEditEntry["edit"] = "add_new_layer";	
	addNewLayerEditEntry["edit_label"] = "New Layer";	
	*/
	
	var addNewLayerEditEntry = new Object();
	addNewLayerEditEntry.edit = "add_new_layer";	
	addNewLayerEditEntry.edit_label = "New Layer";
	addNewLayerEditEntry.fill = fill;

	// add to the edit stack
	editStack.add(addNewLayerEditEntry);	

	applyEditHistory();			
}

layerPanel.duplicateLayer = function(){

	// Duplicates the current layer and ads the duplicate layer above the current index

	//if(layerStack && layerStack.length > 0){
	if(editStack.stack.length > 0){
	
	}else{
		alert("No opened document");
		return;
	}
	
	// Store Layer Index - the layer will move down in the stack so we have to store a decremented layer index
	EditorUtils.storeLayerIndex(parseInt(layerIndex) + 1);
	
	// apply any edits such as filter that were not applied with the 'Apply' button
	layerPanel.checkUnappliedEdit();	
	
	var addNewLayerEditEntry = {};
	addNewLayerEditEntry["edit"] = "duplicate_current_layer";	
	addNewLayerEditEntry["edit_label"] = "Duplicate Layer";	
	// add to the edit stack
	editStack.add(addNewLayerEditEntry);

	applyEditHistory();	

}

layerPanel.moveLayerUp = function(){

	// If only one layer cant move up
	if(layerStack.length == 1 || layerIndex == layerStack.length - 1){
		// alert("can't move topmost layer up");
		return;
	}
	
	// Store Layer Index - the layer will move up in the stack so we have to store an incremented layer index
	EditorUtils.storeLayerIndex(parseInt(layerIndex) + 1);
	
	// apply any edits such as filter that were not applied with the 'Apply' button
	layerPanel.checkUnappliedEdit();
	
	// alert("moving on up");
	var addNewLayerEditEntry = new Object();
	addNewLayerEditEntry.edit = "move_current_layer_up";	
	addNewLayerEditEntry.edit_label = "Raise Layer";	
	// add to the edit stack
	editStack.add(addNewLayerEditEntry);

	applyEditHistory();	
}

layerPanel.moveLayerDown = function(){

	// If only one layer cant move down
	if(layerStack.length == 1 || layerIndex == 0){
		return;
	}
	
	// Store Layer Index - the layer will move down in the stack so we have to store a decremented layer index
	EditorUtils.storeLayerIndex(parseInt(layerIndex) - 1);
	
	// apply any edits such as filter that were not applied with the 'Apply' button
	layerPanel.checkUnappliedEdit();
	
	//alert("moving on down");
	var addNewLayerEditEntry = new Object();
	addNewLayerEditEntry.edit = "move_current_layer_down";
	addNewLayerEditEntry.edit_label = "Lower Layer";	

	
	// add to the edit stack
	editStack.add(addNewLayerEditEntry);

	applyEditHistory();	
}

layerPanel.moveLayerToTop = function(){

	// If only one layer cant move up
	if(layerStack.length == 1 || layerIndex == layerStack.length - 1){
		// alert("can't move topmost layer up");
		return;
	}
	
	// Store Layer Index - since we move layer to top set to highest index
	EditorUtils.storeLayerIndex(layerStack.length - 1);
	
	// apply any edits such as filter that were not applied with the 'Apply' button
	layerPanel.checkUnappliedEdit();
	
	// alert("moving on up");
	//var addNewLayerEditEntry = {};
	var addNewLayerEditEntry = new Object();
	addNewLayerEditEntry.edit = "move_current_layer_to_top";	
	addNewLayerEditEntry.edit_label = "Layer to Top";	
	// add to the edit stack
	editStack.add(addNewLayerEditEntry);

	applyEditHistory();	
	
}

layerPanel.moveLayerToBottom = function(){
	// If only one layer cant move up
	if(layerStack.length == 1 || layerIndex == 0){
		// alert("can't move topmost layer up");
		return;
	}
	
	// Store Layer Index - since we move layer to top set to highest index
	EditorUtils.storeLayerIndex(0);
	
	// apply any edits such as filter that were not applied with the 'Apply' button
	layerPanel.checkUnappliedEdit();
	
	// alert("moving on up");
	//var addNewLayerEditEntry = {};
	var addNewLayerEditEntry = new Object();
	addNewLayerEditEntry.edit = "move_current_layer_to_bottom";	
	addNewLayerEditEntry.edit_label = "Layer to Bottom";	
	// add to the edit stack
	editStack.add(addNewLayerEditEntry);

	applyEditHistory();	
}

layerPanel.mergeLayerDown = function(){

	if(layerStack.length == 1 || layerIndex < 1){
		return;
	}
	
	// Store Layer Index - the layer will move up in the stack so we have to store an incremented layer index
	EditorUtils.storeLayerIndex(parseInt(layerIndex) - 1);

	//alert("merge current layer DOWN");
	var mergeLayerEditEntry = new Object();
	mergeLayerEditEntry.edit = "merge_layer_down";	
	mergeLayerEditEntry.edit_label = "Merge Layers";	
	// add to the edit stack
	editStack.add(mergeLayerEditEntry);

	applyEditHistory();		
	
} 

// Merge Layer Up is not utilized
layerPanel.mergeLayerUp = function(){

	if(layerStack.length == 1 || layerIndex >= (layerStack.length  - 1)){
		return;
	}
	
	// For merge layer up the layer index should remain the same
	// Store Layer Index - the layer will move up in the stack so we have to store an incremented layer index
	EditorUtils.storeLayerIndex(parseInt(layerIndex));

	//alert("merge current layer UP");
	var mergeLayerEditEntry = new Object();
	mergeLayerEditEntry.edit = "merge_layer_up";	
	mergeLayerEditEntry.edit_label = "Merge Layers";	
	// add to the edit stack
	editStack.add(mergeLayerEditEntry);

	applyEditHistory();		
	
} 

layerPanel.flipLayerHorizontal = function(){

	//if(layerStack && layerStack.length > 0){
	if(editStack.stack.length > 0){
	
	}else{
		//alert("No opened document");
		return;
	}
	
	//alert("merge current layer UP");
	var flipLayerEditEntry = new Object();
	flipLayerEditEntry.edit = "flip_layer_horizontal";	
	flipLayerEditEntry.edit_label = "Flip Horizontally";	
	// add to the edit stack
	//alert(JSON.stringify(flipLayerEditEntry));
	editStack.add(flipLayerEditEntry);

	applyEditHistory();		
	
} 

layerPanel.flipLayerVertical = function(){

	//if(layerStack && layerStack.length > 0){
	if(editStack.stack.length > 0){
	
	}else{
		//alert("No opened document");
		return;
	}
	
	//alert("merge current layer UP");
	var flipLayerEditEntry = new Object();
	flipLayerEditEntry.edit = "flip_layer_vertical";	
	flipLayerEditEntry.edit_label = "Flip Vertically";	
	// add to the edit stack
	//alert(JSON.stringify(flipLayerEditEntry));
	editStack.add(flipLayerEditEntry);

	applyEditHistory();		
	
} 

layerPanel.rotateLayer = function(angle){

	//if(layerStack && layerStack.length > 0){
	if(editStack.stack.length > 0){
	
	}else{
		//alert("No opened document");
		return;
	}
	
	//alert("rotate layer at angle: " + angle);
	
	//alert("merge current layer UP");
	var rotateLayerEditEntry = new Object();
	rotateLayerEditEntry.edit = "rotate_layer";	
	rotateLayerEditEntry.edit_label = "Rotate";	
	rotateLayerEditEntry.angle = angle;	
	// add to the edit stack
	//alert(JSON.stringify(rotateLayerEditEntry));
	editStack.add(rotateLayerEditEntry);

	applyEditHistory();		
	
	
} 

layerPanel.setStackIndex = function(index){
	//alert(index);
	
	// set the new stack index and save the stack object to local store
	editStack.setIndex(index);
	applyEditHistory();
}

layerPanel.setCurrentLayerIndex = function(index){

	//alert(index);

	// set the selected layer index to that clicked in the stack
	if(layerIndex == index){
		// alert("already at index");
		return;
	}
	
	// Store Layer Index 
	EditorUtils.storeLayerIndex(parseInt(index));
	
	// apply any edits such as filter that were not applied with the 'Apply' button
	layerPanel.checkUnappliedEdit();
	
	/*
	var setLayerIndexEditEntry = {};
	setLayerIndexEditEntry["edit"] = "set_layer_index";
	setLayerIndexEditEntry["index"] = index;
	setLayerIndexEditEntry["flag"] = "continue";
	*/
	//alert("blah: " + index);
	var setLayerIndexEditEntry = new Object();
	setLayerIndexEditEntry.edit = "set_layer_index";
	setLayerIndexEditEntry.index = index;
	setLayerIndexEditEntry.flag = "continue";
	
	// add to the edit stack
	editStack.add(setLayerIndexEditEntry);

	applyEditHistory();		
	
}

layerPanel.setCurrentLayerBlendingMode = function(mode){

	/*
	alert(mode);
	return;
	*/
	
	// apply any edits such as filter that were not applied with the 'Apply' button
	layerPanel.checkUnappliedEdit();
	
	/*
	var setLayerBlendingModeEditEntry = {};
	setLayerBlendingModeEditEntry["edit"] = "set_layer_blending_mode";
		setLayerBlendingModeEditEntry["edit_label"] = "Layer Blend Mode";
	setLayerBlendingModeEditEntry["mode"] = mode;
	*/

	var setLayerBlendingModeEditEntry = new Object();
	setLayerBlendingModeEditEntry.edit = "set_layer_blending_mode";
	setLayerBlendingModeEditEntry.edit_label = "Layer Blend Mode";
	setLayerBlendingModeEditEntry.mode = mode;	
	
	// add to the edit stack
	editStack.add(setLayerBlendingModeEditEntry);

	applyEditHistory();		
	
}

layerPanel.getRasterThumb = function(layer){

	var thumb_height = 40;
	var thumb_width = 50;
	var thumbCanvas = document.createElement("canvas");
	var thumbCtx = thumbCanvas.getContext("2d");

	// Regular rasterized layer canvas
	// Draw the layer as it would be drawn on the canvas editor
	var layerCanvas = document.createElement("canvas");
	// find the scale of the height of the canvas to 40
	layerCanvas.width = canvasWidth;
	layerCanvas.height = canvasHeight;
	var layerCtx = layerCanvas.getContext("2d");
	//layerCtx.fillStyle = "red";
	//layerCtx.fillRect(0,0,canvasWidth, canvasHeight);
	//layerCtx.drawImage(layer.raster_mask.canvas, layer.cumulativeNegatives.x, layer.cumulativeNegatives.y);
	layerCtx.drawImage(layer.raster_mask.canvas, layer.raster_mask.cumulativeNegatives.x, layer.raster_mask.cumulativeNegatives.y);
	
	// Apply global transformations to the layer raster mask image
	EditorUtils.getTransormedCanvas(layerCtx.canvas);
	
	var thumbratio = 40/layerCanvas.height;
	thumbCanvas.width = layerCanvas.width*thumbratio;
	thumbCanvas.height = layerCanvas.height*thumbratio;
	
	thumbCtx.imageSmoothingEnabled = true;
	//thumbCtx.imageSmoothingQuality = "high";

	thumbCtx.filter = "grayscale(100%)";
	thumbCtx.drawImage(layerCanvas, 0, 0, thumbCanvas.width, thumbCanvas.height);
	
	// If the layer mask is disabled show a red 'X' across the raster mask thumb
	if(!layer.raster_mask.enabled){
		thumbCtx.save();
		thumbCtx.strokeStyle = "rgb(235, 10, 24)";
		thumbCtx.lineWidth = 3;
		thumbCtx.beginPath();
		// backword leaning line of x
		thumbCtx.moveTo(3, 3);
		thumbCtx.lineTo(thumbCtx.canvas.width - 3, thumbCtx.canvas.height - 3);
		// forward leaning line of x
		thumbCtx.moveTo(thumbCtx.canvas.width - 3, 3);
		thumbCtx.lineTo(3, thumbCtx.canvas.height - 3);
		thumbCtx.stroke();
		thumbCtx.restore();
	}
	
	thumb_height = 40;
	thumb_width = thumb_height*(canvasWidth/canvasHeight);
	// If the width of the scaled image goes beyond 40 it has to be scaled
	if(thumb_width > 50){
		thumb_width = 50;
	}
	
	return thumbCanvas;
	
}

layerPanel.render = function(){

	// alert(layerStack.length);

	// Layer Panels
	var layerpanelhtmltemplate = "";
	
	// For history
	layerpanelhtmltemplate += this.getHistoryPanel();
	
	// Selector that chooses layer
	// layer header
	layerpanelhtmltemplate += '	<div id="layerPanelHeaderDiv" class="panelHeaderDiv"><span style="color: rgb(160, 160, 160); font-size: 13px; font-weight: bold;">Layers</span></div>';
	layerpanelhtmltemplate += '	<div style="padding: 2px 4px 0px 2px; color: rgb(160, 160, 160); font-size: 13px;">';
	layerpanelhtmltemplate += '		<div style="float: left; padding: 0px 15px 0px 0px;">';
	layerpanelhtmltemplate += '	<select id="layerSelector" style="display: none;">';
	// Loop through the layers in reverse to make the last layer topmost in the layer dropdown list
	for(var i = layerStack.length - 1; i >= 0 ; i--){
		var selected = "";
		// make the current layer selected
		if(layerIndex == i){
			selected = "selected";
		}
		layerpanelhtmltemplate += '		<option value="' + i + '" ' + selected + '>Layer ' + i + '</option>';			
	}					
	layerpanelhtmltemplate += '	</select>';
	
	var blendModeArray = [];
	blendModeArray.push({value: "source-over", label: "Normal"}); 
	blendModeArray.push({value: "lighter", label: "Lighter"}); 
	blendModeArray.push({value: "multiply", label: "Multiply"}); 
	blendModeArray.push({value: "screen", label: "Screen"}); 
	blendModeArray.push({value: "overlay", label: "Overlay"}); 
	blendModeArray.push({value: "darken", label: "Darken"}); 
	blendModeArray.push({value: "lighten", label: "Lighten"}); 
	blendModeArray.push({value: "color-dodge", label: "Color Dodge"}); 
	blendModeArray.push({value: "color-burn", label: "Color Burn"}); 
	blendModeArray.push({value: "hard-light", label: "Hard Light"}); 
	blendModeArray.push({value: "soft-light", label: "Soft Light"}); 
	blendModeArray.push({value: "difference", label: "Difference"}); 
	blendModeArray.push({value: "exclusion", label: "Exclusion"}); 
	blendModeArray.push({value: "hue", label: "Hue"}); 
	blendModeArray.push({value: "saturation", label: "Saturation"}); 
	blendModeArray.push({value: "color", label: "Color"}); 
	blendModeArray.push({value: "luminosity", label: "Luminosity"});

	var blendmodeselectdisabled = "";
	/*
	if(layerStack.length <= 1 || layerIndex == 0){
		blendmodeselectdisabled = "disabled";
	}
	*/
	
	layerpanelhtmltemplate += '	<select ' + blendmodeselectdisabled + ' onchange="layerPanel.setCurrentLayerBlendingMode(this.value)" id="layerBlendingModeSelect">';
	for(var i = 0; i < blendModeArray.length; i++){
		var selected = "";
		if('blend_mode' in layerStack[layerIndex] && layerStack[layerIndex].blend_mode == blendModeArray[i].value){
			selected = "selected";
		}
		layerpanelhtmltemplate += '	<option ' + selected + ' value="' + blendModeArray[i].value + '">' + blendModeArray[i].label + '</option>';	
	}
	layerpanelhtmltemplate += '	</select>';	
	
	/*
	layerpanelhtmltemplate += '	<select onchange="layerPanel.setCurrentLayerBlendingMode(this.value)" id="layerBlendingModeSelect">';
	layerpanelhtmltemplate += '		<option value="source-over">Normal</option>';
	layerpanelhtmltemplate += '		<option value="lighter">Lighter</option>';
	layerpanelhtmltemplate += '		<option value="multiply">Multiply</option>';
	layerpanelhtmltemplate += '		<option value="screen">Screen</option>';
	layerpanelhtmltemplate += '		<option value="overlay">Overlay</option>';
	layerpanelhtmltemplate += '		<option value="darken">Darken</option>';
	layerpanelhtmltemplate += '		<option value="lighten">Lighten</option>';
	layerpanelhtmltemplate += '		<option value="color-dodge">Color Dodge</option>';
	layerpanelhtmltemplate += '		<option value="color-burn">Color Burn</option>';
	layerpanelhtmltemplate += '		<option value="hard-light">Hard Light</option>';
	layerpanelhtmltemplate += '		<option value="soft-light">Soft Light</option>';
	layerpanelhtmltemplate += '		<option value="difference">Difference</option>';
	layerpanelhtmltemplate += '		<option value="exclusion">Exclusion</option>';
	layerpanelhtmltemplate += '		<option value="hue">Hue</option>';
	layerpanelhtmltemplate += '		<option value="saturation">Saturation</option>';
	layerpanelhtmltemplate += '		<option value="color">Color</option>';
	layerpanelhtmltemplate += '		<option value="luminosity">Luminosity</option>';
	layerpanelhtmltemplate += '	</select>';
	*/	
	layerpanelhtmltemplate += '		</div>';
	layerpanelhtmltemplate += '		<div style="float: left; position: relative;">';
	if("opacity" in layerStack[layerIndex]){
		/*
		layerpanelhtmltemplate += '			opacity: <input type="text" onfocus="(console.log(1))"; onkeyup="layerPanel.layerOpacityInputKeyPressed(this.value,' + layerIndex + ', event.keyCode)" value="' + layerStack[layerIndex].opacity + '%" style="width: 40px;">';	
		//									Layer Opacity Slider - absolutely positioned to the opacity textbox container
		layerpanelhtmltemplate += '			<div style="position: absolute; top: 25px; left: 0px;">';
		layerpanelhtmltemplate += '				<input type="range" id="layerOpacitySlider">';	
		layerpanelhtmltemplate += '			</div>';
		//									End layer opacity slider	
		*/
		//alert(layerStack[layerIndex].opacity);
		layerpanelhtmltemplate += '			opacity: <input id="layerOpacityTxtInput" type="text" onfocus="layerPanel.layerOpacityFocused()" onkeyup="layerPanel.layerOpacityInputKeyPressed(this.value,' + layerIndex + ', event.keyCode)" value="' + layerStack[layerIndex].opacity + '%" style="user-select: none; width: 40px;">';		
		//									Layer Opacity Slider - absolutely positioned to the opacity textbox container
		layerpanelhtmltemplate += '			<div id="layerOpacitySliderDiv" style="z-index: 5000;display: none; position: absolute; top: 25px; right: 0px; background-color: rgba(34, 35, 38, .95); padding: 2px 10px;">';
		layerpanelhtmltemplate += '				<input type="range" id="layerOpacitySlider" value="' + layerStack[layerIndex].opacity + '" oninput="layerPanel.layerOpacitySliderMoved(this.value)"  onchange="layerPanel.layerOpacitySliderChanged(this.value)" >';	
		layerpanelhtmltemplate += '			</div>';
		//									End layer opacity slider				
	}else{
		layerpanelhtmltemplate += '			opacity: <input id="layerOpacityTxtInput" type="text" onfocus="layerPanel.layerOpacityFocused()" onkeyup="layerPanel.layerOpacityInputKeyPressed(this.value,' + layerIndex + ', event.keyCode)" value="100%" style="user-select: none; width: 40px;">';		
		//									Layer Opacity Slider - absolutely positioned to the opacity textbox container
		layerpanelhtmltemplate += '			<div id="layerOpacitySliderDiv" style="z-index: 5000;display: none; position: absolute; top: 25px; right: 0px; background-color: rgba(34, 35, 38, .95); padding: 2px 10px;">';
		layerpanelhtmltemplate += '				<input type="range" id="layerOpacitySlider" value="100" oninput="layerPanel.layerOpacitySliderMoved(this.value)"  onchange="layerPanel.layerOpacitySliderChanged(this.value)" >';	
		layerpanelhtmltemplate += '			</div>';
		//									End layer opacity slider	
	}

	layerpanelhtmltemplate += '		</div>';	
	layerpanelhtmltemplate += '		<div style="clear: both;">';	
	layerpanelhtmltemplate += '	</div>';

	//alert(canvasWidth + "," + canvasHeight);
	
	// Draw the rows of layer images for the Layer panel

	let tileImage = new Image();
	tileImage.onload = function(){
	
		// alert("tile loaded");
	
		layerpanelhtmltemplate += '	<div id="layerPanelDiv">'; // Layer panel div
		
		//alert(editingLayerMask);
		
		// STACK OF LAYERS
		for(var i = layerStack.length - 1; i >= 0 ; i--){
			// alert(i);
			
			var layer_bkgnd = "background-color: rgb(38, 39, 42);";
			
			if(i == layerIndex){
				// alert("Layer " + i + " is the current");
				//layer_bkgnd = "background-color: rgb(109, 126, 146);";			
				layer_bkgnd = "background-color: rgb(89, 106, 126);";			
			}
			
			// https://www.w3schools.com/html/html5_draganddrop.asp
			layerpanelhtmltemplate += '	<div class="layerPanelItem" id="panelLayerRow' + i + '" draggable="false" onclick="layerPanel.setCurrentLayerIndex(' + i + ')" style=" ' + layer_bkgnd + ' border-top: 1px solid rgb(24, 25, 28);">';
			
			// 1. Layer Eye
			layerpanelhtmltemplate += '		<div style="float: left; background-color: rgb(38, 39, 42); border-left: 1px solid rgb(24, 25, 28); ">';
			layerpanelhtmltemplate += '			<div style="height: 40px; padding: 5px 12px 5px 12px;">';
			var opacity = "opacity: 1;";
			if(!layerStack[i].visible){
				opacity = "opacity: .4;";				
			}
			layerpanelhtmltemplate += '				<img onclick="layerPanel.toggleLayerVisibility(' + i + ',event)" style="' + opacity + 'padding: 12px 0px 0px 0px;" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAKCAYAAAC9vt6cAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAOxAAADsQBlSsOGwAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAJASURBVCiRXZK7T1NhAMXPd79L4fbhRe5tb8UQCoRidKWQoEYSl7r6WAikkRAnJ0wbFUlY9C9QE4iDMLI0tS4W0lZEEBZgaZtC8CK0l0eH0kLTlub7HHwEPdMZzlnO7xD8p8DjQHNCTz0olU5vgJMWACIINwCyItaE6chCZPd8nvwxoVDItreXfbW1ufmoUCzsd3W5M/vZA0e5UjZZrZbCyckpUqnUFXB8EBl9ElmIfAcACgDBYNAlCHQR4NeGhgZXXW0ux/T7mauZbKYpl8vJ2azhsNvttjdvXy+nN9NO43D/aYer49u2vq3T2dk52WRiXzTNkfd6vRWbzab5/YGWYqFIAwE/BocGEYvGYBhGnaoq0ujo6BnAk+sbG/5WV2dYqK8vv5SkBovH4xEJIZZcLkePDo/qAMDT44Hb7YamaSCEIJlISgCoz+dr6bvelxAIeycSgtua5kwTQpoBQJZlZjKZeLVaJc+fjcHhsEPXdXDOoaj22u/JeLFQqAdYmg4MDKTy+fxYY6O8arVaFUoprLYLlHFIDZIEgYrQnJfQ6mpjww99B2azuTY1OZWNxWKdjLN75BeBj8OE8ElVVT739vYqjDHL0vKKkkim5EqlQlVFKfffunnY1HTxx/iLccva2norCL8TjUZX/2IMh8P9u7t7Uzv6zuX29raV7u7uklNz1pWrZWQyxtlc5JO6tLTs4ZzFGGcj8Xhc/+cHADAxMSEeHx/f3Upv3T8tlXoAOAHUAOwA/KvAhZn5+Pzi+c5PNuz1rPiW7X4AAAAASUVORK5CYII=" alt="" />';			
			layerpanelhtmltemplate += '			</div>';			
			layerpanelhtmltemplate += '		</div>';			
			
			// 2. Layer Thumb
			var thumb_height = 40;
			var thumb_width = 50;
			var thumbCanvas = document.createElement("canvas");
			var thumbCtx = thumbCanvas.getContext("2d");
			
			if(!('object' in layerStack[i])){
			
				// Regular rasterized layer canvas
				// Draw the layer as it would be drawn on the canvas editor
				var layerCanvas = document.createElement("canvas");
				// find the scale of the height of the canvas to 40
				layerCanvas.width = canvasWidth;
				layerCanvas.height = canvasHeight;
				var layerCtx = layerCanvas.getContext("2d");
				//layerCtx.fillStyle = "red";
				//layerCtx.fillRect(0,0,canvasWidth, canvasHeight);
				layerCtx.drawImage(layerStack[i].canvas, layerStack[i].cumulativeNegatives.x, layerStack[i].cumulativeNegatives.y);
				
				// Apply global transformations to the layer
				EditorUtils.getTransormedCanvas(layerCtx.canvas);
				
				var thumbratio = 40/layerCanvas.height;
				thumbCanvas.width = layerCanvas.width*thumbratio;
				thumbCanvas.height = layerCanvas.height*thumbratio;
				
				thumbCtx.imageSmoothingEnabled = true;
				//thumbCtx.imageSmoothingQuality = "high";
				
				// transparency tile patten
				var pattern = thumbCtx.createPattern(tileImage, 'repeat');
				thumbCtx.fillStyle = pattern;
				thumbCtx.fillRect(0, 0, thumbCanvas.width, thumbCanvas.height);
				thumbCtx.drawImage(layerCanvas, 0, 0, thumbCanvas.width, thumbCanvas.height);
				
				thumb_height = 40;
				thumb_width = thumb_height*(canvasWidth/canvasHeight);
				// If the width of the scaled image goes beyond 40 it has to be scaled
				if(thumb_width > 50){
					thumb_width = 50;
				}			
			
			}else{
				// Draw objects to layer
				if(layerStack[i].object.type == "text_object"){
				
					var thumb_width = 35;
					var thumb_height = 40;
				
					thumbCanvas.width = thumb_width;
					thumbCanvas.height = thumb_height;
					thumbCtx.fillStyle = "rgb(255, 255, 255)";
					thumbCtx.fillRect(0, 0, thumbCanvas.width, thumbCanvas.height);
					thumbCtx.strokeStyle = "rgb(0, 0, 0)";
					thumbCtx.strokeRect(.5, .5, thumbCanvas.width - 1, thumbCanvas.height - 1);
					
					// draw the 'T' to represent text layer
					thumbCtx.fillStyle = "rgb(0, 0, 0)";
					thumbCtx.font = "32px Times New Roman";
					thumbCtx.textBaseline = "top";
					thumbCtx.fillText("T", 7, 6);
				}
			}

			// set the background image of the image div to have a transparency tile data using dataURI ( file 'transparencytile_layer_thumb.jpg')
			//layerpanelhtmltemplate += '	<div style="float: left; height: ' + thumb_height + 'px; background: url(data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAIBAQIBAQICAgICAgICAwUDAwMDAwYEBAMFBwYHBwcGBwcICQsJCAgKCAcHCg0KCgsMDAwMBwkODw0MDgsMDAz/2wBDAQICAgMDAwYDAwYMCAcIDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAz/wAARCAAIAAgDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwBv/J1H/UC/sL/t68/zv++NuPK987u2OSiigD//2Q==);">';	
			layerpanelhtmltemplate += '		<div style="float: left; height: ' + thumb_height + 'px; border-left: 1px solid rgb(24, 25, 28); padding: 5px 5px 5px 5px;">';	
			// *Nb. Very important to note that we apply global transformations object to the thumb
			layerpanelhtmltemplate += '			<div style="position: relative;">'
			layerpanelhtmltemplate += '				<img onclick="layerPanel.editCurrentLayerCanvas(' + i + ',event)" style="height: ' + thumb_height + 'px; width: ' + thumb_width + 'px; object-fit: contain;"  src="' + thumbCanvas.toDataURL() + '">';
			if('raster_mask' in layerStack[i]){
				var showThumbBorder = "display: none;";
				//alert(layerIndex + "," + i);
				if(layerIndex == i && editingLayerMask == 0){
					showThumbBorder = "display: block;";
				}
				layerpanelhtmltemplate += '			<div id="layerCanvasSelectedBorder' + i + '" style="' + showThumbBorder + 'pointer-events: none; position: absolute; top: -2px; left: -2px; height: ' + thumb_height + 'px; width: ' + thumb_width + 'px; border: 2px dashed white;"></div>';
			}
			layerpanelhtmltemplate += '			</div>';			
			layerpanelhtmltemplate += '		</div>';
			
			
			// 3. Layer Mask (If available)
			if('raster_mask' in layerStack[i]){
			
				// DRAW THE CHAIN FOR LINKED/UNLINK
				layerpanelhtmltemplate += '		<div style="float: left; padding: 15px 2px 0px 2px;">';
				if(layerStack[i].raster_mask.raster_mask_linked){ 
					layerpanelhtmltemplate += '			<img onclick="layerPanel.unlinkRasterMask(' + i + ');" style="cursor: pointer; opacity: 0.9;" alt="l" src="https://storage.googleapis.com/gifgit_website_resources/images/toolicons/chain-link-icon.svg">';									
				}else{
					layerpanelhtmltemplate += '			<img onclick="layerPanel.linkRasterMask(' + i + ');" style="cursor: pointer; opacity: 0.9;" alt="l" src="https://storage.googleapis.com/gifgit_website_resources/images/toolicons/chain-link-broken-icon.svg">';									
				}
				layerpanelhtmltemplate += '		</div>';					
			
				var rasterMaskThumb = layerPanel.getRasterThumb(layerStack[i]);
			
				var showRasterMaskThumbBorder = "display: none;";
				if(layerIndex == i && editingLayerMask == 1){
					showRasterMaskThumbBorder = "display: block;";
				}
				layerpanelhtmltemplate += '		<div style="float: left; height: ' + thumb_height + 'px; padding: 5px 5px 5px 5px;">';	
				// *Nb. Very important to note that we apply global transformations object to the raster mask thumb just like the layer thumb
				layerpanelhtmltemplate += '			<div style="position: relative;">'
				//layerpanelhtmltemplate += '				<img onclick="layerPanel.editCurrentLayerRasterMask(' + i + ',event)" style="height: ' + thumb_height + 'px; width: ' + thumb_width + 'px; object-fit: contain;"  src="' + layerStack[i].raster_mask.canvas.toDataURL() + '">';
				layerpanelhtmltemplate += '				<img onclick="layerPanel.editCurrentLayerRasterMask(' + i + ',event)" style="height: ' + thumb_height + 'px; width: ' + thumb_width + 'px; object-fit: contain;"  src="' + rasterMaskThumb.toDataURL() + '">';
				layerpanelhtmltemplate += '				<div id="layerRasterMaskSelectedBorder' + i + '" style="' + showRasterMaskThumbBorder + 'pointer-events: none; position: absolute; top: -2px; left: -2px; height: ' + thumb_height + 'px; width: ' + thumb_width + 'px; border: 2px dashed white;"></div>';
				layerpanelhtmltemplate += '			</div>';			
				layerpanelhtmltemplate += '		</div>';				
			}
			
			// 4. Layer Label
			layerpanelhtmltemplate += '		<div style="float: left; padding: 12px 0px 0px 7px;">';	
			// check the layerstack object to see if the layer has a name -> if('layer_name' in layerStack[0]) else just write number
			if("name" in layerStack[i]){
				// The layer has a name
				var layername = layerStack[i].name;
				if(layername.length > 20){
					layername = layername.substring(0, 20) + "...";
				}				
				layerpanelhtmltemplate += '		<span id="layerPanel_layerNameLbl' + i + '" title="Edit layer name | Double click" onclick="event.stopPropagation();" ondblclick="layerPanel.layerNameLabelClicked(' + i + ',event)" style="color: rgb(160, 160, 160)">' + layername + '</span>';
				layerpanelhtmltemplate += '		<input id="layerPanel_layerNameInput' + i + '" type="text" onblur="layerPanel.layerNameInputBlurred(' + i + ')" onkeyup="layerPanel.layerNameInputKeyPressed(' + i + ', event.keyCode)" style="display: none; width: 100px;" value="' + layerStack[i].name + '">';					
				layerpanelhtmltemplate += '		<input id="layerPanel_layerNameHidden' + i + '" type="hidden" value="' + layerStack[i].name + '">';					
			}else{
				// The layer has no name
				layerpanelhtmltemplate += '		<span id="layerPanel_layerNameLbl' + i + '" title="Edit layer name | Double click" onclick="event.stopPropagation();" ondblclick="layerPanel.layerNameLabelClicked(' + i + ',event)" style="color: rgb(160, 160, 160)">Layer ' + i + '</span>';
				layerpanelhtmltemplate += '		<input id="layerPanel_layerNameInput' + i + '" type="text" onblur="layerPanel.layerNameInputBlurred(' + i + ')" onkeyup="layerPanel.layerNameInputKeyPressed(' + i + ', event.keyCode)" style="display: none; width: 100px;" value="Layer ' + i + '">';				
				layerpanelhtmltemplate += '		<input id="layerPanel_layerNameHidden' + i + '" type="hidden" value="Layer ' + i + '">';	
			}		
			layerpanelhtmltemplate += '		</div>';	
			layerpanelhtmltemplate += '		<div style="clear: both;"></div>';
			
			layerpanelhtmltemplate += '	</div>';	
		} // End of layer stack loop
		layerpanelhtmltemplate += '	</div>'; // end layer panel div	
		
		// Layer Panels Footer
		layerpanelhtmltemplate += '	<div style="border: 1px solid rgb(24, 25, 28); font-size: 11px; background-color: rgb(28, 29, 32);">';
		layerpanelhtmltemplate += '		<div style="padding: 5px 3px 6px 3px; border-top: 1px solid rgb(54, 55, 58);">';
		if(layerStack.length == 1){
			// If only a single Layer make these buttons faded
			layerpanelhtmltemplate += '		<div style="float: left;">';
			layerpanelhtmltemplate += '			<span title="Moves the current layer up in the layer stack" onclick="layerPanel.moveLayerUp()" style="color: rgb(100, 100, 100); cursor: pointer; padding: 2px 6px; border-radius: 2px; margin: 0px 0px 0px 3px; background-color: rgb(28, 29, 32);">Up</span>';			
			layerpanelhtmltemplate += '		</div>';
			layerpanelhtmltemplate += '		<div style="float: left;">';
			layerpanelhtmltemplate += '			<span title="Moves the current layer down in the layer stack" onclick="layerPanel.moveLayerDown()" style="color: rgb(100, 100, 100); cursor: pointer; padding: 2px 6px; border-radius: 2px; margin: 0px 0px 0px 3px; background-color: rgb(28, 29, 32);">Down</span>';			
			layerpanelhtmltemplate += '		</div>';		
		}else{
		
			// 'Up' Layer button
			if(layerIndex == layerStack.length - 1){
				// If the current layer is topmost fade the up button (color: rgb(100, 100, 100); )
				layerpanelhtmltemplate += '	<div style="float: left;">';
				layerpanelhtmltemplate += '		<span title="Moves the current layer up in the layer stack" onclick="layerPanel.moveLayerUp()" style="color: rgb(100, 100, 100); cursor: pointer; padding: 2px 6px; border-radius: 2px; margin: 0px 0px 0px 3px; background-color: rgb(28, 29, 32);">Up</span>';			
				layerpanelhtmltemplate += '	</div>';	
			}else{
				layerpanelhtmltemplate += '	<div style="float: left;">';
				layerpanelhtmltemplate += '		<span title="Moves the current layer up in the layer stack" onclick="layerPanel.moveLayerUp()" style="cursor: pointer; padding: 2px 6px; border-radius: 2px; margin: 0px 0px 0px 3px; background-color: rgb(28, 29, 32);">Up</span>';			
				layerpanelhtmltemplate += '	</div>';			
			}
			
			// 'Down' Layer button
			if(layerIndex == 0){
				layerpanelhtmltemplate += '	<div style="float: left;">';
				layerpanelhtmltemplate += '		<span title="Moves the current layer down in the layer stack" onclick="layerPanel.moveLayerDown()" style="color: rgb(100, 100, 100); cursor: pointer; padding: 2px 6px; border-radius: 2px; margin: 0px 0px 0px 3px; background-color: rgb(28, 29, 32);">Down</span>';			
				layerpanelhtmltemplate += '	</div>';
			}else{
				layerpanelhtmltemplate += '	<div style="float: left;">';
				layerpanelhtmltemplate += '		<span title="Moves the current layer down in the layer stack" onclick="layerPanel.moveLayerDown()" style="cursor: pointer; padding: 2px 6px; border-radius: 2px; margin: 0px 0px 0px 3px; background-color: rgb(28, 29, 32);">Down</span>';			
				layerpanelhtmltemplate += '	</div>';	
			}
			
		}
		layerpanelhtmltemplate += '			<div style="float: left;">';
		layerpanelhtmltemplate += '				<span title="Create a mask for the current layer" onclick="layerPanel.addLayerRasterMask(\'white\', true)" style="cursor: pointer; padding: 2px 6px; border-radius: 2px; margin: 0px 0px 0px 3px; background-color: rgb(28, 29, 32);">Mask</span>';			
		layerpanelhtmltemplate += '			</div>';
		layerpanelhtmltemplate += '			<div style="float: left;">';
		layerpanelhtmltemplate += '				<span title="Create a copy of the current higer in the stack" onclick="layerPanel.duplicateLayer()" style="cursor: pointer; padding: 2px 6px; border-radius: 2px; margin: 0px 0px 0px 3px; background-color: rgb(28, 29, 32);">Duplicate</span>';			
		layerpanelhtmltemplate += '			</div>';
		layerpanelhtmltemplate += '			<div style="float: left;">';
		layerpanelhtmltemplate += '				<span title="Create a new layer" onclick="layerPanel.addNewLayer()" style="cursor: pointer; padding: 2px 6px; border-radius: 2px; margin: 0px 0px 0px 3px; background-color: rgb(28, 29, 32);">New</span>';			
		layerpanelhtmltemplate += '			</div>';
		// 'Delete' Layer Button
		if(layerStack.length == 1){
			layerpanelhtmltemplate += '			<div style="float: left;">';
			layerpanelhtmltemplate += '				<span title="Delete this layer" onclick="layerPanel.deleteCurrentLayer()" style="color: rgb(100, 100, 100); cursor: pointer; padding: 2px 6px; border-radius: 2px; margin: 0px 0px 0px 3px; background-color: rgb(28, 29, 32);">Delete</span>';			
			layerpanelhtmltemplate += '			</div>';			
		}else{
			layerpanelhtmltemplate += '			<div style="float: left;">';
			layerpanelhtmltemplate += '				<span title="Delete this layer" onclick="layerPanel.deleteCurrentLayer()" style="cursor: pointer; padding: 2px 6px; border-radius: 2px; margin: 0px 0px 0px 3px; background-color: rgb(28, 29, 32);">Delete</span>';			
			layerpanelhtmltemplate += '			</div>';			
		}
		layerpanelhtmltemplate += '			<div style="clear: both;"></div>';
		layerpanelhtmltemplate += '		</div>';		
		layerpanelhtmltemplate += '	</div>';		
		
		
		// Set HTML content of Right Panels Container
		// $("#rightbox").html(layerpanelhtmltemplate);
		$("#floatingpanels").html(layerpanelhtmltemplate);
		
		var panelBox = document.getElementById("floatingpanels").getBoundingClientRect();
		var layerPanelDivHeight = (parseInt(panelBox.height/2) - 100);
		if(layerPanelDivHeight < 200){
			layerPanelDivHeight = 200;
		}
		var historyPanelDivHeight = (parseInt(panelBox.height/2) - 150);
		if(historyPanelDivHeight < 215){
			historyPanelDivHeight = 215;
		}
		document.getElementById("layerPanelDiv").style.height = layerPanelDivHeight + "px";
		document.getElementById("historyPanelDiv").style.height = historyPanelDivHeight + "px";
		
		
		// POSITION THE SCROLL OF THE HISTORY PANEL
		// set the position of the scroll for the history panel
		//alert(layerPanel.historyPanelItemIndex);
		// get the height of one historypanel item
		var historyItem = (document.getElementById("historyPanelDiv").getElementsByClassName("historyPanelItem"))[0];
		//alert(JSON.stringify(historyItem.getBoundingClientRect()));
		// layerPanel.historyPanelItemIndex stores the index of history item that is highlighted in the list
		document.getElementById("historyPanelDiv").scrollTop = layerPanel.historyPanelItemIndex*historyItem.getBoundingClientRect().height;	
		
		// POSITION THE SCROLL OF THE LAYER PANEL
		//alert(layerIndex);
		// set the position of the scroll for the layer panel
		var layerPanelItem = (document.getElementById("layerPanelDiv").getElementsByClassName("layerPanelItem"))[0];
		//alert(layerStack.length);
		//alert(layerPanelItem.getBoundingClientRect().height);
		// Use (layerStack.length - 1 - layerIndex) because the list s reverse indexed
		document.getElementById("layerPanelDiv").scrollTop = (layerStack.length - 1 - layerIndex)*layerPanelItem.getBoundingClientRect().height;	
		
		/*
		// set the top of the floatinf panels
		var editoptionsBox = document.getElementById("editOptionsDiv").getBoundingClientRect();
		document.getElementById("floatingpanels").style.top = parseInt(editoptionsBox.top + editoptionsBox.height) + "px";
		document.getElementById("floatingtoolbox").style.top = parseInt(editoptionsBox.top + editoptionsBox.height) + "px";
		*/

		var layerSelector = document.getElementById("layerSelector");
		layerSelector.addEventListener("change", function(){
			//alert("Layer change");
			//alert(this.value);
			
			//layerIndex = ;
			
			// set a change layer index edit in the stack
			var newLayerEditEntry = {};
			newLayerEditEntry["edit"] = "set_layer_index";
			newLayerEditEntry["index"] = this.value;
			// add to the edit stack
			editStack.add(newLayerEditEntry);

			applyEditHistory();
			
		});			
		
	};
	
	//load the tile image
	tileImage.src = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAIBAQIBAQICAgICAgICAwUDAwMDAwYEBAMFBwYHBwcGBwcICQsJCAgKCAcHCg0KCgsMDAwMBwkODw0MDgsMDAz/2wBDAQICAgMDAwYDAwYMCAcIDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAz/wAARCAAIAAgDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwBv/J1H/UC/sL/t68/zv++NuPK987u2OSiigD//2Q==";
	
}

layerPanel.getHistoryPanel = function(){
	//alert("hello");
	
	var historypanelhtml = '';
	historypanelhtml += '	<div id="historyPanelHeaderDiv" class="panelHeaderDiv"><span style="color: rgb(160, 160, 160); font-size: 13px; font-weight: bold;">History</span></div>';	
	historypanelhtml += '<div id="historyPanelDiv">';
	var start = false; // used to indicate that we have reached the "start" edit in the stack and can begin adding history items 
	
	// alert(editStack.index);
	
	// get all edit that are not 'continue'
	var tempstart = false;
	var tempEditStack = [];
	for(var i = 0; i < editStack.stack.length; i++){
	
		if(editStack.stack[i].edit == "start"){
			tempstart = true;
		}
		
		if(tempstart){
		
			if('flag' in editStack.stack[i]){
			
				// Do not add continue flagged edits to the tempStack

				if(editStack.stack[i].flag.indexOf("continue") >= 0){
					// We do not show this edit in history if it is a continue
				}else{
					var tempEditEntry = new Object();
					tempEditEntry.index = i;
					tempEditEntry.edit_object = editStack.stack[i];
					tempEditStack.push(tempEditEntry);
				}
				
			}else{
			
				var tempEditEntry = new Object();
				tempEditEntry.index = i;
				tempEditEntry.edit_object = editStack.stack[i];
				tempEditStack.push(tempEditEntry);	
				
			}
		}
	
	}
	
	// check if the current edit index is in the list of history navigable edits
	// if it's not we'll highlight the last history item because the current edit 
	// must be a 'continue' flagged edit like 'set_layer_index'.
	
	var editindexfound = false;
	for(var i = 0; i < tempEditStack.length; i++){
		if(tempEditStack[i].index == editStack.index){
			editindexfound = true;
		}		
	}	

	/*
	if(editindexfound){
		alert("found the current edit index in the history list");
	}else{
		alert("did not find the current edit index in the history list");
	}
	*/
	//console.log(JSON.stringify(tempEditStack));
	
	//alert(tempEditStack.length);
	
	for(var i = 0; i < tempEditStack.length; i++){
	
		var indexpassed = "color: rgb(130, 130, 130); font-weight: normal;"; // dull edit Label to indicate it has been Undone
		var highlighteddivstyle = "";
		
		// 1. Highlight the history item that is currently active
		if(tempEditStack[i].index == editStack.index){
			highlighteddivstyle = "background-color: rgb(26, 27, 30);";
			// make the history edit label a little brighter since it is selected 
			indexpassed = "color: rgb(150, 150, 150); font-weight: normal;";
			
			layerPanel.historyPanelItemIndex = i;
		}	

		// 2. If we have looped to the end and we did not find the current edit index in case 1. above to highlight
		// we highlight the last history item in the list
		if(i == (tempEditStack.length - 1) && !editindexfound){
			highlighteddivstyle = "background-color: rgb(26, 27, 30);";
			// make the history edit label a little brighter since it is selected 
			indexpassed = "color: rgb(150, 150, 150); font-weight: normal;";
			
			layerPanel.historyPanelItemIndex = i;
		}	

		// If the current history item shows a history entry that is passed the history entry the editor is currently
		// at, we make the text dimmer to show its not active
		if(tempEditStack[i].index > editStack.index){
			//indexpassed = "color: rgb(90, 90, 90); font-weight: normal;";
			indexpassed = "color: rgb(95, 95, 95); font-weight: normal;";
			//indexpassed = "color: rgb(80, 80, 80); font-weight: normal;";
			//indexpassed = "color: rgb(70, 70, 70); font-weight: normal;";
		}		
		
		historypanelhtml += '	<div class="historyPanelItem" style="' + highlighteddivstyle + indexpassed + '" onclick="layerPanel.setStackIndex(' + tempEditStack[i].index + ')">';
		if('edit_label' in tempEditStack[i].edit_object){
			historypanelhtml += 	tempEditStack[i].edit_object.edit_label;	
		}else{
			historypanelhtml += 	tempEditStack[i].edit_object.edit;			
		}
		historypanelhtml += '	</div>';		
	}
		
	/*
	for(var i = 0; i < editStack.stack.length; i++){
	
		var indexpassed = "color: rgb(130, 130, 130); font-weight: normal;"; // dull edit Label to indicate it has been Undone
		var highlighteddivstyle = "";
		
		if(i == editStack.index){
			highlighteddivstyle = "background-color: rgb(26, 27, 30);";
			// make the history edit label a little brighter since it is selected 
			indexpassed = "color: rgb(150, 150, 150); font-weight: normal;";
			
			layerPanel.historyPanelItemIndex = i;
		}
		
		// If we are at end and we did not find the current edit index in the history list we highlight the 
		// last history editable item
		if(i == tempEditStack[tempEditStack.length - 1].index && !editindexfound){
			highlighteddivstyle = "background-color: rgb(26, 27, 30);";
			// make the history edit label a little brighter since it is selected 
			indexpassed = "color: rgb(150, 150, 150); font-weight: normal;";
		}
		
		if(i > editStack.index){
			//indexpassed = "color: rgb(90, 90, 90); font-weight: normal;";
			indexpassed = "color: rgb(95, 95, 95); font-weight: normal;";
			//indexpassed = "color: rgb(80, 80, 80); font-weight: normal;";
			//indexpassed = "color: rgb(70, 70, 70); font-weight: normal;";
		}
		
		if(editStack.stack[i].edit == "start"){
			start = true;
		}
		if(start){
			if('flag' in editStack.stack[i]){
				if(editStack.stack[i].flag.indexOf("continue") >= 0){
					// We do not show this edit in history if it is a continue
				}else{

					historypanelhtml += '	<div style="' + highlighteddivstyle + indexpassed + '" onclick="layerPanel.setStackIndex(' + i + ')">';
					if('edit_label' in editStack.stack[i]){
						historypanelhtml += 	editStack.stack[i].edit_label;	
					}else{
						historypanelhtml += 	editStack.stack[i].edit;			
					}
					historypanelhtml += '	</div>';						
				}
			}else{
					historypanelhtml += '	<div style="' + highlighteddivstyle + indexpassed + '" onclick="layerPanel.setStackIndex(' + i + ')">';
					if('edit_label' in editStack.stack[i]){
						historypanelhtml += 	editStack.stack[i].edit_label;	
					}else{
						historypanelhtml += 	editStack.stack[i].edit;			
					}
					historypanelhtml += '	</div>';			
			}
		}
	}
	*/
	historypanelhtml += '</div>';
	
	// alert(layerPanel.historyPanelItemIndex);
	
	
	return historypanelhtml;
}


// layerPanel.render();