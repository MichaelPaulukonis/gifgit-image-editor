// Copyright (c) 2019 Kasey Thomas. All rights reserved.
// Use of this source code is governed by the EULA.

'use strict';

// alert("edit stack loaded");

var editStack = {
	layer: 0, // index of the current active layer
	index: 0, // index of the current edit operation for undos and redos
	stack: [], // history of operations applied to the edited image. The first entry is a start
	vector_layers: [] // array indicating what layers are vector layers
	/*
	version: 1
	*/
	/*
	test: 	function(msg){
			}	
	*/
};

editStack.start = function(dataURL){

	this.version = "1";
	
	// set start on edit entry on the edit stack
	//let startEditEntry = {edit: "start"};
	var startEditEntry = {edit: "start", edit_label: "Start"};
	this.add(startEditEntry);
	
}

// loads the stored edit stack string in a json object
editStack.load = function(){
	if (localStorage.getItem("edit_stack") === null) {
		alert("no edits");
	}else{
	
		//alert("edits");
		//alert(localStorage.getItem("edit_stack"));
		//alert(localStorage.getItem("edit_stack"));
		//this.stack = JSON.parse(localStorage.getItem("edit_stack"));
		//this.index = this.stack.length;
		
		//let stored_stack = JSON.parse(localStorage.getItem("edit_stack"));
		var stored_stack = JSON.parse(localStorage.getItem("edit_stack"));
		
		/*
		// not below cannot be used because it will erase the editStack methods which are
		// not stringified in the JSON object saved
		editStack = stored_stack;
		*/
		
		editStack.layer = stored_stack.layer;
		editStack.stack = stored_stack.stack;
		editStack.index = stored_stack.index;
		editStack.version = stored_stack.version;
		editStack.vector_layers = stored_stack.vector_layers;
		
		//alert(editStack.stack.length);
	}				
}


// Sets the new stack index and saves the updated stack object to local store
editStack.setIndex = function(index){

	this.index = index;
	//alert(this.stack.length);
	
	// Store the edit stack in the local storage
	localStorage.setItem("edit_stack", JSON.stringify(this));
	
}

/*
editStack.add = function(editEntry){

	// alert(JSON.stringify(editEntry));

	// set the layer that this edit is one based on the current selected layer in the stack
	editEntry.layer = layerIndex;

	if(editEntry.edit == "set_layer_index"){
		
		
		//==========================================
		//Special case for set_layer_index
		//'set_layer_index' is always appended at the end of all the edits. If undo was done such that the current edit
		//index is not at the end, it does not resize the array then append like 'Regular Edit' (see below).
		//==========================================
		
		
		// add edit to history of edits 
		// (In this case it will be a 
		this.stack.push(editEntry);
		
		// WE INCREMENT THE STACK INDEX ONLY IF THE CURRENT INDEX OF THE EDIT STACK IS AT THE END
		// If the edit index is at the end and was not move to previous edits by undo
		// we increment the editStack.index
		if((this.index + 1) == (this.stack.length - 1)){
			this.index++;		
		}

		//alert(this.index + "," + (this.stack.length - 1));

	}else{
	
		
		//=========================================
		//Regular Edit
		//=========================================
		
	
		if(this.index < this.stack.length - 1){
			
			// get rid of all the array indices after index
			// by setting stack length to a length that has
			// index as the maximum index
			this.stack.length = this.index + 1;
			
			//============================================
			//set layer index for the current layer edit
			var setLayerIndexEditEntry = new Object();
			setLayerIndexEditEntry.edit = "set_layer_index";
			setLayerIndexEditEntry.index = layerIndex;
			setLayerIndexEditEntry.flag = "continue";
			this.stack.push(setLayerIndexEditEntry);
			
			this.index++;
			//============================================
		}
		
		// add edit to history of edits
		this.stack.push(editEntry);

		// set to the length of stack so we are at last edit index	
		this.index = this.stack.length - 1;
	
	}
	
	// Store the edit stack in the local storage
	localStorage.setItem("edit_stack", JSON.stringify(this));
	
	
	// console.log("index: " + this.index + ", length" + stack.length);
	// console.log(JSON.stringify(stack));

	
	console.clear();
	console.log("===================================================");
	console.log("Edit Stack: " + this.stack.length);
	
	for(let i = 0; i < this.stack.length; i++){
		//console.log(stack[i].edit);
		console.log(i + ": " + JSON.stringify(this.stack[i]));
	}
	
	
	
	//for(let i = 0; i < this.stack.length; i++){
	//	console.log(stack[i].edit);
	//	console.log(i + ": " + this.stack[i].edit + " label: " + this.stack[i].edit_label);
	//}
					
}
*/

editStack.deleteUnusedImageAssets = function(){
	//alert("we may need to delete unused image assets");
	// scan all edits after the current edit index if there is a 'load_image_to_layer'
	// edit we have to delete the asset id associated with it using the asset manager
	for(var i = editStack.index + 1; i < editStack.stack.length; i++){
		//alert(editStack.stack[i].edit);
		if(editStack.stack[i].edit == "load_image_to_layer"){
			//alert(assetManager.getCount() + " assets");
			//alert("delete asset_id: " + editStack.stack[i].asset_id);
			assetManager.remove(editStack.stack[i].asset_id);
			//alert(assetManager.getCount() + " assets");
		}
	}
}

editStack.add = function(editEntry){

	//alert("add");

	// alert(JSON.stringify(editEntry));

	// set the layer that this edit is one based on the current selected layer in the stack
	editEntry.layer = layerIndex;

	// If we are not adding an edit behind the last edit but behind one that is at an index that
	// is a result of an 'Undo' action.
	if(this.index < this.stack.length - 1){
	
		editStack.deleteUnusedImageAssets();

		// get rid of all the array indices after index
		// by setting stack length to a length that has
		// index as the maximum index
		this.stack.length = this.index + 1;
	}
	
	// add edit to history of edits
	this.stack.push(editEntry);

	// set to the length of stack so we are at last edit index	
	this.index = this.stack.length - 1;
	
	// Store the edit stack in the local storage
	localStorage.setItem("edit_stack", JSON.stringify(this));
	
	/*
	console.clear();
	console.log("Edit Stack: " + this.stack.length);
	for(let i = 0; i < this.stack.length; i++){
		//console.log(stack[i].edit);
		console.log(i + ": " + JSON.stringify(this.stack[i]));
	}
	*/
	
					
}

editStack.setLayer = function(layer){
	//alert(layer);
	this.layer = layer;
	
	// Store the edit stack in the local storage
	localStorage.setItem("edit_stack", JSON.stringify(this));
}

/*
	This gets all edits that do not have a continue flag
*/
editStack.getHistoryIndices = function(){
	// Get all edits that are not continue flagged for Undo/Redo action
	var start = false;
	var historyindices = [];
	var allindices = [];
	for(var i = 0; i < editStack.stack.length; i++){
	
		allindices.push({index: i, label: editStack.stack[i].edit});
		
		if(editStack.stack[i].edit == "start"){
			start = true;
		}
		if(start){
			if('flag' in editStack.stack[i]){
				if(editStack.stack[i].flag.indexOf("continue") >= 0){
					// We do not show this edit in history if it is a continue
				}else{

					// Add to edit index array	
					historyindices.push({index: i, label: editStack.stack[i].edit});
				}
			}else{
				// Add to edit index array	
				historyindices.push({index: i, label: editStack.stack[i].edit});
			}
		}
	}
	
	return historyindices;
}

editStack.undo = function(){

	//Important - for certain edits we set the layerIndex when performing Undo
	editStack.checkSetLayerIndexOnUndo();

	// Get all the edit indices that are history
	//alert(JSON.stringify(editStack.getHistoryIndices()));
	
	var undoRedoIndices = editStack.getHistoryIndices();
	
	// get the location of our current edit in the array
	var current_edit_location_in_undo_redo_array = -1;
	
	for(var i = 0; i < undoRedoIndices.length; i++){
		if(undoRedoIndices[i].index == editStack.index){
			current_edit_location_in_undo_redo_array = i;
			break;
		}
	}
	
	// current index wasn't found in undo-redo array most likely it is on a continue flagged item
	// so just set the current edit index to the last history item
	if(current_edit_location_in_undo_redo_array < 0){
		current_edit_location_in_undo_redo_array = undoRedoIndices.length - 1;
	}
	
	// decrement and store the index of the decrement
	if(current_edit_location_in_undo_redo_array > 0){
		current_edit_location_in_undo_redo_array--;
		editStack.index = undoRedoIndices[current_edit_location_in_undo_redo_array].index;
	}
	
	
	// Store the edit stack in the local storage
	localStorage.setItem("edit_stack", JSON.stringify(this));	

}

editStack.redo = function(){

	// Get all the edit indices that are history
	//alert(JSON.stringify(editStack.getHistoryIndices()));
	
	var undoRedoIndices = editStack.getHistoryIndices();
	
	// get the location of our current edit in the array
	var current_edit_location_in_undo_redo_array = 0;
	
	for(var i = 0; i < undoRedoIndices.length; i++){
		if(undoRedoIndices[i].index == editStack.index){
			current_edit_location_in_undo_redo_array = i;
			break;
		}
	}
	
	// decrement and store the index of the decrement
	if(current_edit_location_in_undo_redo_array < undoRedoIndices.length - 1){
	
		current_edit_location_in_undo_redo_array++;
		
		if(current_edit_location_in_undo_redo_array > (undoRedoIndices.length - 1)){
			current_edit_location_in_undo_redo_array = undoRedoIndices.length - 1
		}
		
		editStack.index = undoRedoIndices[current_edit_location_in_undo_redo_array].index;
	}	
	
	// Store the edit stack in the local storage
	localStorage.setItem("edit_stack", JSON.stringify(this));
	
	//Important - for certain edits we set the layerIndex when performing Redo
	// We place the check at the end for redo because we need to check the current index stored
	// layer index. 
	// !!! REMEMBER editStack.layer stores the layerIndex before the current edit is applied
	editStack.checkSetLayerIndexOnRedo();
		
}

editStack.checkSetLayerIndexOnUndo = function(){

	//console.log(editStack.stack[editStack.index].edit + "," + editStack.stack[editStack.index].layer);
	// *Nb. Mostly layer ordering edits should restore the stored layerIndex
	if(editStack.stack[editStack.index].edit == "move_current_layer_up"){
		EditorUtils.storeLayerIndex(parseInt(editStack.stack[editStack.index].layer));
	}
	if(editStack.stack[editStack.index].edit == "move_current_layer_down"){
		EditorUtils.storeLayerIndex(parseInt(editStack.stack[editStack.index].layer));
	}		
	if(editStack.stack[editStack.index].edit == "duplicate_current_layer"){
		EditorUtils.storeLayerIndex(parseInt(editStack.stack[editStack.index].layer));
	}	
	if(editStack.stack[editStack.index].edit == "add_new_layer"){
		EditorUtils.storeLayerIndex(parseInt(editStack.stack[editStack.index].layer));
	}	
	if(editStack.stack[editStack.index].edit == "delete_current_layer"){
		EditorUtils.storeLayerIndex(parseInt(editStack.stack[editStack.index].layer));
	}
	if(editStack.stack[editStack.index].edit == "move_current_layer_to_top"){
		EditorUtils.storeLayerIndex(parseInt(editStack.stack[editStack.index].layer));
	}		
	if(editStack.stack[editStack.index].edit == "move_current_layer_to_bottom"){
		EditorUtils.storeLayerIndex(parseInt(editStack.stack[editStack.index].layer));
	}	
	if(editStack.stack[editStack.index].edit == "merge_layer_down"){
		EditorUtils.storeLayerIndex(parseInt(editStack.stack[editStack.index].layer));
	}
	if(editStack.stack[editStack.index].edit == "merge_layer_up"){
		EditorUtils.storeLayerIndex(parseInt(editStack.stack[editStack.index].layer));
	}
	if(editStack.stack[editStack.index].edit == "load_image_to_layer"){
		EditorUtils.storeLayerIndex(parseInt(editStack.stack[editStack.index].layer));
	}	
}

editStack.checkSetLayerIndexOnRedo = function(){

	// !!! REMEMBER editStack.stack[editStack.index].layer stores the layerIndex before the current edit is applied
	// So we have to do layer index arithmetic for each edit
	// Treat editStack.stack[editStack.index].layer as the layerIndex before the edit was applied

	//alert("redo check");
	//console.log(editStack.stack[editStack.index].edit + "," + editStack.stack[editStack.index].layer);
	// *Nb. Mostly layer ordering edits should restore the stored layerIndex
	if(editStack.stack[editStack.index].edit == "move_current_layer_up"){
		EditorUtils.storeLayerIndex(parseInt(editStack.stack[editStack.index].layer) + 1);
	}
	if(editStack.stack[editStack.index].edit == "move_current_layer_down"){
		EditorUtils.storeLayerIndex(parseInt(editStack.stack[editStack.index].layer) - 1);
	}		
	if(editStack.stack[editStack.index].edit == "duplicate_current_layer"){
		EditorUtils.storeLayerIndex(parseInt(editStack.stack[editStack.index].layer) + 1);
	}	
	if(editStack.stack[editStack.index].edit == "add_new_layer"){
		EditorUtils.storeLayerIndex(parseInt(editStack.stack[editStack.index].layer) + 1);
	}	
	if(editStack.stack[editStack.index].edit == "delete_current_layer"){
		EditorUtils.storeLayerIndex(parseInt(editStack.stack[editStack.index].layer) - 1);
	}
	if(editStack.stack[editStack.index].edit == "move_current_layer_to_top"){
		EditorUtils.storeLayerIndex(layerStack.length - 1);
	}		
	if(editStack.stack[editStack.index].edit == "move_current_layer_to_bottom"){
		EditorUtils.storeLayerIndex(0);
	}	
	if(editStack.stack[editStack.index].edit == "merge_layer_down"){
		//alert(parseInt(editStack.stack[editStack.index].layer) - 1);
		EditorUtils.storeLayerIndex(parseInt(editStack.stack[editStack.index].layer) - 1);
	}
	if(editStack.stack[editStack.index].edit == "merge_layer_up"){
		EditorUtils.storeLayerIndex(parseInt(editStack.stack[editStack.index].layer));
	}
	if(editStack.stack[editStack.index].edit == "load_image_to_layer"){
		EditorUtils.storeLayerIndex(parseInt(editStack.stack[editStack.index].layer) + 1);
	}
	
}

/*
editStack.redo = function(){

	// Look ahead if the next edit (1 index higher) in the stack has a continue 
	// 1. 	If it does we loop for ward until we 
	// 		meet an index in the stack that has no 'continue' flag.
	// 2. 	If no 'continue' in the higher index stack edit just do regular increment of index
	
	var saveindex = editStack.index;
	
	if((editStack.index + 1) < editStack.stack.length && 'flag' in editStack.stack[editStack.index + 1] && editStack.stack[editStack.index + 1].flag == "continue"){
	
		// 1. Loop forward for an index that does not have the 'continue' flag	
		for(var j = editStack.index + 1; j < editStack.stack.length; j++){
			console.log(j);
			if('flag' in editStack.stack[j] && editStack.stack[j].flag == "continue"){
			}else{
				//  STOP - edit doesn't have the continue flag
				break;
			}
			
		}
		console.log("end: " + j);
		editStack.index = j;
		
	}else{
		this.index++;	
	}
	
	console.log("Redo to: " + editStack.index + "(" + editStack.stack.length + ")");

	if(this.index > this.stack.length - 1){
		this.index = this.stack.length - 1;
	}
	
	// if the edit we stopped at is a continue flag we go back to the original
	// stack index
	if('flag' in editStack.stack[editStack.index] && editStack.stack[editStack.index].flag == "continue"){
		//alert("we stopped at a continue");
		editStack.index = saveindex;
		console.log("we stopped at a continue");
		console.log("Redo to: " + editStack.index + "(" + editStack.stack.length + ")");
	}
	
	// Store the edit stack in the local storage
	localStorage.setItem("edit_stack", JSON.stringify(this));
	
}
*/


editStack.test = function(msg){
	alert(msg);
}



// editStack.test("alert this message");