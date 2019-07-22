// Copyright (c) 2019 Kasey Thomas. All rights reserved.
// Use of this source code is governed by the EULA.

'use strict';

// alert("asset manager");

var assetManager = {

};

assetManager.add = function(asset_id, asset_type, asset_data){
	
	// alert(asset_id + "," + asset_type + "," + asset_data);
	
	// create the asset entrry object
	var assetEntry = {type: asset_type, data: asset_data};
	
	// check if asset library exists if not create one, 
	// if already exists... update
	
	if (localStorage.getItem("asset_library") === null) {
	
		// create a new asset library object and use the asset_id to
		// point to the assetEntry object
		var newAssetLibrary = new Object();
		newAssetLibrary[asset_id] = assetEntry;
		
		// alert(JSON.stringify(newAssetLibrary));
		
		// save the asset library to local store
		localStorage.setItem("asset_library", JSON.stringify(newAssetLibrary));
		
	}else{
		
		//alert("update existing asset library");
		var assetLibrary = JSON.parse(localStorage.getItem("asset_library"));
		assetLibrary[asset_id] = assetEntry;

		// save the asset library with newly added entry to local store
		localStorage.setItem("asset_library", JSON.stringify(assetLibrary));		
		
	}
}	

assetManager.remove = function(asset_id){
	var assetLibrary = JSON.parse(localStorage.getItem("asset_library"));
	delete assetLibrary[asset_id];
	
	// save the asset library with newly added entry to local store
	localStorage.setItem("asset_library", JSON.stringify(assetLibrary));
}

assetManager.get = function(asset_id){
	
	if (localStorage.getItem("asset_library") === null) {
	
		return undefined;
		
	}else{
		var assetLibary =  JSON.parse(localStorage.getItem("asset_library"));
		return assetLibary[asset_id].data;
	}
}

assetManager.getCount = function(){
	var assetLibary =  JSON.parse(localStorage.getItem("asset_library"));
	return (Object.getOwnPropertyNames(assetLibary)).length;
}	