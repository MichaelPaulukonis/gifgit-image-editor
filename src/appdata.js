// Copyright (c) 2019 Kasey Thomas. All rights reserved.
// Use of this source code is governed by the EULA.

'use strict';

// alert("app data");

var clearAllDataBtn = document.getElementById("clearAllDataBtn");

var dataList = document.getElementById("dataList");

if (typeof(Storage) !== "undefined") {

	var keys = Object.keys(localStorage);
	
	//let dataTable = document.createElement("table");
	let dataTable = document.getElementById("dataListTable");
	
	for(var i = 0; i < keys.length; i++){
		
		// create the table row
		let dataTableRow = document.createElement("tr");
		
			// create column for field name
			let fieldNameColumn = document.createElement("td");
			fieldNameColumn.style = "font-size: 14px;";
			fieldNameColumn.innerText = keys[i];
		
			// create column for field data
			let data = localStorage.getItem(keys[i]);
			let fieldDataColumn = document.createElement("td");
				// create a textarea or textbox to hold the field data
				if(data.length <= 100){
					// textbox for small amount of data
					let dataTextBox = document.createElement("input");
					dataTextBox.setAttribute("type", "text");
					dataTextBox.value = data;	
					// attach the textbox to the column
					fieldDataColumn.appendChild(dataTextBox);					
				}else{
					// textarea for larger data
					let dataTextArea = document.createElement("textarea");
					dataTextArea.setAttribute("cols", "50");
					dataTextArea.setAttribute("rows", "4");
					dataTextArea.value = data;
					// attach the textarea to the column
					fieldDataColumn.appendChild(dataTextArea);
				}
				
		// insert the columns in the row
		dataTableRow.appendChild(fieldNameColumn);
		dataTableRow.appendChild(fieldDataColumn);

		// Finally after attaching all columns to the row attach the row to the table
		dataTable.appendChild(dataTableRow);
		
	}
	
	dataList.appendChild(dataTable);	
	
}else{

	
}

clearAllDataBtn.onclick = function(){

	if(confirm("Are you sure you want to clear all Locally stored data")){
		localStorage.clear();
		location.reload();		
	}
	
}