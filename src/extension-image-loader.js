// Copyright (c) 2019 Kasey Thomas. All rights reserved.
// Use of this source code is governed by the EULA.

'use strict';

var image = document.getElementById("gifgit_extensionImage");
image.onload = function(){

	// Clear all local stores but the settings for brushes,etc
	var keys = Object.keys(localStorage);
			
	for(var i = 0; i < keys.length; i++){
		if(keys[i].indexOf("settings") >= 0){
			// console.log("leave: " + keys[i]);
		}else{
			// console.log("remove: " + keys[i]);	
			localStorage.removeItem(keys[i]);				
		}
	}
	
	try {
	
		// set the editor image and file name to local storage
		// localStorage.setItem("editor_image", dataURL); // this will be moved to asset library storage
		localStorage.setItem("image_filename", "img_" + Date.now());
		localStorage.setItem("canvas_width", image.width);
		localStorage.setItem("canvas_height", image.height);
		
		// add the image as an asset to the asset library
		// assetManager.add() (id, type, data)
		
		var asset_id = Date.now();
		
		assetManager.add(asset_id, "image_data_url", this.src);
		
		// set the first edit entry to load the image from the asset library using its id
		var loadImageEditEntry = {};
		loadImageEditEntry["edit"] = "load_image_asset";
		loadImageEditEntry["asset_id"] = asset_id;

		// add to the crop edit stack
		editStack.add(loadImageEditEntry);			
		
		// start indicates the point beyond which undo actions won't go
		editStack.start();
		
	}catch(err) {
	
		alert("The image is too large for the online editor storage.");
		//localStorage.clear();
		
		for(var i = 0; i < keys.length; i++){
			if(keys[i].indexOf("settings") >= 0){
				// console.log("leave: " + keys[i]);
			}else{
				// console.log("remove: " + keys[i]);	
				localStorage.removeItem(keys[i]);				
			}
		}
		
	}	

	// Redirect to the tool
	setTimeout(function(){ 
		//window.location = "/image/brush-tool";
		window.location = "/image/" + getParameterByName("redir", window.location.href);
	}, 3000);	

}
// The image source is set by the extension content script
//image.src = ""

/*
let loadingInterval;

// poll for image data from the extension
loadingInterval = setInterval(function(){ 

	// We have image data from the extension
	if(document.getElementById("extensionImageData").value != ""){
	
		clearInterval(loadingInterval);
	
		var dataURL = document.getElementById("extensionImageData").value;
	
		// Load image data into the editor
		var loadImage = new Image();
		loadImage.onload = function(){
		
			// clear the local storage
			localStorage.clear();			
		
			//alert(loadImage.width + "," + loadImage.height);
		
			// set the editor image and file name to local storage
			// localStorage.setItem("editor_image", dataURL); // this will be moved to asset library storage
			localStorage.setItem("image_filename", "img_" + Date.now());
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
			
			
			// Redirect to the tool
			
			window.location = "/image/brush-tool";
			
		};
		loadImage.src = dataURL;
	
	}
	
}, 250);
*/


// Get parameters from url query string
function getParameterByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, '\\$&');
    var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
}