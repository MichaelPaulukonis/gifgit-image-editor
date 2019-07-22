	// Copyright (c) 2019 Kasey Thomas. All rights reserved.
	// Use of this source code is governed by the EULA.

	'use strict';
	
	// http://zetcode.com/javascript/mustache/
	
	/************ Global Listeners START************************
	*	1. 	Window resize listener to reload page
	*	2. 	Click outside listener to listen for click outside
			the rect for an assigned element id to close it.
	********************************************************/
	// Listener for window resize
	window.addEventListener('resize', function(){
		//location.reload();
	});
	
	// Add event listener for click outside
	var clickoutsideElementId;
	document.addEventListener('click', function(e){
		//console.log("body click at: (" + e.pageX + "," + e.pageY + ")");
		var x = e.pageX;		
		var y = e.pageY;

		if(clickoutsideElementId){
		
			var elementBox = document.getElementById(clickoutsideElementId).getBoundingClientRect();	

			//console.log(x + "," + y);			
			//console.log(JSON.stringify(elementBox));			
		
			if(x >= elementBox.left && x <= elementBox.right && y >= elementBox.top && y <= elementBox.bottom){
				console.log("inside");
			}else{
				console.log("outside");
				//close the element if clicked outside
				document.getElementById(clickoutsideElementId).style.display = "none";
				clickoutsideElementId = undefined;
			}
		}
	});		
	/************ Global Listeners END************************/
	
	//var globalZoom = 100;
	var zoomDirection = 1;
	var zoomPresets = [6.25,12.5,25,50,100,200,400,800,1600];
		
	var toolBoxWidth = 51; // the scrollbar width
	// Though I needed to adjust for toolbar scrollbar but apparently its not needed.
	/*
	//var toolBoxWidth = 51 + 8;
	// for some reason -webkite-scrollbar doesn't apply to firefox so I cant style
	// the browser to 8px width
	if(navigator.userAgent.toLowerCase().indexOf('firefox') > -1){
		 // Do Firefox-related activities
		 //toolBoxWidth = 51 + 17;
	}
	*/
	
	var workspacePaddingTop = 25;
	var workspacePaddingBottom = 80;
	var gradientEditorProfileCanvasPadding = 10;
	var editsMade = false; 
	var applyHistory = true;
	var transformSelection = false;
	var global_foregroundColor = "#000000";
	var global_backgroundColor = "#ffffff";
		
	// alert(window.location.href);
	// var selectedToolboxIconIndex = 0;
	
	// Sidebar Toolbox
	var toolBoxItems = [];
	
	// push toolbox {icon,link, title} objects in array
	
	toolBoxItems.push({
		url: "/image/move-tool", 
		icon: "https://storage.googleapis.com/gifgit_website_resources/images/toolicons/move-tool-icon.svg",
		//icon: "/tool-icons/move-tool-icon.svg",
		title: "Move tool"
	});
	
	toolBoxItems.push({
		url: "/image/rectangular-marquee-tool", 
		icon: "https://storage.googleapis.com/gifgit_website_resources/images/toolicons/rectangular-marquee-tool-icon.svg",
		//icon: "/tool-icons/rectangular-marquee-tool-icon.svg",
		title: "Rectangular marquee tool"
	});
	toolBoxItems.push({
		url: "/image/elliptical-marquee-tool", 
		icon: "https://storage.googleapis.com/gifgit_website_resources/images/toolicons/elliptical-marquee-tool-icon.svg",
		//icon: "/tool-icons/elliptical-marquee-tool-icon.svg",
		title: "Elliptical marquee tool"
	});	
	toolBoxItems.push({
		url: "/image/lasso-tool", 
		icon: "https://storage.googleapis.com/gifgit_website_resources/images/toolicons/lasso-tool-icon.svg",
		//icon: "/tool-icons/lasso-tool-icon.svg",
		title: "Lasso tool"
	});		
	toolBoxItems.push({
		url: "/image/polygon-lasso-tool", 
		icon: "https://storage.googleapis.com/gifgit_website_resources/images/toolicons/polygon-lasso-tool-icon.svg",
		//icon: "/tool-icons/polygon-lasso-tool-icon.svg",
		title: "Polygon lasso tool"
	});	
	toolBoxItems.push({
		url: "/image/crop-tool", 
		icon: "https://storage.googleapis.com/gifgit_website_resources/images/toolicons/crop-tool-icon.svg",
		//icon: "/tool-icons/crop-tool-icon.svg",
		title: "Crop tool"
	});
	toolBoxItems.push({
		url: "/image/color-picker-tool", 
		icon: "https://storage.googleapis.com/gifgit_website_resources/images/toolicons/color-picker-tool-icon.svg",
		//icon: "/tool-icons/color-picker-tool-icon.svg",
		title: "Color picker tool"
	});		
	toolBoxItems.push({
		url: "/image/brush-tool", 
		icon: "https://storage.googleapis.com/gifgit_website_resources/images/toolicons/brush-tool-icon.svg",
		//icon: "/tool-icons/brush-tool-icon.svg",
		title: "Brush tool"
	});	
	toolBoxItems.push({
		url: "/image/eraser-tool", 
		icon: "https://storage.googleapis.com/gifgit_website_resources/images/toolicons/eraser-tool-icon.svg",
		//icon: "/tool-icons/eraser-tool-icon.svg",
		title: "Eraser tool"
	});	
	toolBoxItems.push({
		url: "/image/background-eraser-tool", 
		icon: "https://storage.googleapis.com/gifgit_website_resources/images/toolicons/background-eraser-tool-icon.svg",
		//icon: "/tool-icons/background-eraser-tool-icon.svg",
		title: "Background Eraser Tool"
	});	
	toolBoxItems.push({
		url: "/image/gradient-tool", 
		icon: "https://storage.googleapis.com/gifgit_website_resources/images/toolicons/gradient-tool-icon.svg",
		//icon: "/tool-icons/gradient-tool-icon.svg",
		title: "Gradient Tool"
	});	

	toolBoxItems.push({
		url: "/image/blur-tool", 
		icon: "https://storage.googleapis.com/gifgit_website_resources/images/toolicons/blur-tool-icon.svg",
		//icon: "/tool-icons/blur-tool-icon.svg",
		title: "Blur Tool"
	});		

	toolBoxItems.push({
		url: "/image/sharpen-tool", 
		icon: "https://storage.googleapis.com/gifgit_website_resources/images/toolicons/sharpen-tool-icon.svg",
		//icon: "/tool-icons/sharpen-tool-icon.svg",
		title: "Sharpen Tool"
	});		

	toolBoxItems.push({
		url: "/image/clone-stamp-tool", 
		icon: "https://storage.googleapis.com/gifgit_website_resources/images/toolicons/clone-stamp-tool-icon.svg",
		//icon: "/tool-icons/clone-stamp-tool-icon.svg",
		title: "Clone Stamp Tool"
	});	
	
	toolBoxItems.push({
		url: "/image/zoom-tool", 
		icon: "https://storage.googleapis.com/gifgit_website_resources/images/toolicons/zoom-tool-icon.svg",
		//icon: "/tool-icons/zoom-tool-icon.svg",
		title: "Zoom Tool"
	});	

	toolBoxItems.push({
		url: "/image/type-tool", 
		icon: "https://storage.googleapis.com/gifgit_website_resources/images/toolicons/type-tool-icon.svg",
		//icon: "/tool-icons/zoom-tool-icon.svg",
		title: "Type Tool"
	});	
	
	function toolboxURLRedirect(toolIndex){
		//alert(url);
		//alert(document.getElementById("toolBoxItemLink" + toolIndex).value);
		window.location.href = document.getElementById("toolBoxItemLink" + toolIndex).value;
	}
	
	// Self invoking function
	(function () {
	
		// alert("header template called");
	
		// Toolpage header template with logo etc
		
		//var data = { logourl: "/logo.svg", ad_url: "/leaderboard.png" };
		// var data = { logourl: "https://storage.googleapis.com/gifgit_website_resources/images/logo.svg", ad_url: "https://storage.googleapis.com/gifgit_website_resources/images/tempunits/horizontalimg.jpg" };
		var data = {};
		data.logourl = "https://storage.googleapis.com/gifgit_website_resources/images/logo.svg";
		//data.ad_url = "https://storage.googleapis.com/gifgit_website_resources/images/tempunits/horizontalimg.jpg";
		data.ad_url = "https://storage.googleapis.com/support-kms-prod/SNP_BBFA15D142E88EAB62B5C247174644F87043_2922338_en_v2";
		
		var headertemplate = "";
		/*
		headertemplate += "	<div style='background-image: linear-gradient(to bottom, rgba(255,255,255,1), rgba(250,250,250,1));'>";
		headertemplate += "		<div style='float: left; padding: 0px 0px 0px 25px;'>";
		headertemplate += "			<a href='/' style='text-decoration: none;'>";
		headertemplate += "				<img src='{{ logourl }}' alt='logo'>";
		headertemplate += "			</a>";
		headertemplate += "		</div>";
		headertemplate += "		<div style='float: left; padding: 10px 0px 0px 0px;'>";
		// headertemplate +=	"	<img src='{{ ad_url }}'>";
		headertemplate += "		</div>";
		headertemplate += "		<div style='clear: both;'></div>";
		headertemplate += "	</div>";
		*/
		
		var headertext = Mustache.render(headertemplate, data);        

		//$("#pageHeader").html(headertext);
		// $("header").html(headertext);
		//$("header").html("");
		headertemplate += '	<div style="text-align: right; padding: 8px 30px 2px 30px; background-color: rgb(24, 25, 28)">';
		headertemplate += '		<div style="user-select: none; float: left; padding: 30px 0px 0px 0px;">';
		// headertemplate += '			<span style="color: rgb(0, 140, 218); font-size: 22px; font-weight: bold;">Gifgit</span>';	
		headertemplate += '			<a href="/" style="color: rgb(240, 240, 240); font-size: 25px; font-weight: bold; text-decoration: none;">gifgit.com</a>';	
		headertemplate += '			<a href="/" style="color: rgb(200, 200, 200); font-size: 18px; font-weight: normal; text-decoration: none;">&nbsp;&nbsp;Online Image Editing</a>';		
		headertemplate += '		</div>';
		headertemplate += '		<div style="float: right;">';
		headertemplate += '			<img src="/ad_728x90.jpg">';	
		headertemplate += '		</div>';
		headertemplate += '		<div style="clear: both;"></div>';	
		headertemplate += '	</div>';	
		//headertemplate = '<div style="padding: 4px 20px 8px 20px;"><a href="/" style="color: rgb(240, 240, 240); font-size: 18px; font-weight: normal; text-decoration: none;">gifgit.com</a></div>';	
		//$("header").html(headertemplate);
		//$("header").html(headertext);
		//$("header").html("");
		
		//$("footer").html("Copyright 2019 Gifgit - All rights reserved");
		$("footer").html("");
		
		var toolboxtext = "";
		
		toolboxtext += "<div id='floatingtoolboxHeader'>";
		toolboxtext += 		createForegroundBackgroundColorButton();
		toolboxtext += "</div>";
		//toolboxtext += "<br>";
		
		var toolboxitemstr = "";
		for(var i = 0; i < toolBoxItems.length; i++){
		
				/*
				<a href="/image/eraser-tool">
					<img src="https://storage.googleapis.com/gifgit_website_resources/images/toolicons/eraser-tool-icon.svg" alt="eraser tool icon" title="Eraser tool">
					<!-- Eraser -->
				</a>
				<br>
				*/
				var data = {};
				data.url = toolBoxItems[i].url;
				data.icon = toolBoxItems[i].icon;
				data.title = toolBoxItems[i].title;
				
				var toolboxitemtemplate = "";
				
				let background = "";
				
				if(window.location.href.indexOf(toolBoxItems[i].url) >= 0){
					// If the current page url is equal to the tool url
					// set to dark selected background
					background = "background-color: rgb(19, 20, 23);";
				}
				
				toolboxitemtemplate += "<div style='border-radius: 4px;" + background + "' onmouseover='toolIconOnMouseOver(this)' onmouseout='toolIconOnMouseOut(this)'>";	
				toolboxitemtemplate += "	<a href='{{ url }}'>";
				//toolboxitemtemplate += "	<a onclick='toolboxURLRedirect(" + i + ")'>";
				toolboxitemtemplate += "		<img src='{{ icon }}' title='{{ title }}'>";
				toolboxitemtemplate += "	</a>";
				toolboxitemtemplate += "	<input type='hidden' id='toolBoxItemLink" + i + "' value='" + toolBoxItems[i].url + "'>";
				toolboxitemtemplate += "</div>";	
				
				var toolitemtext = Mustache.render(toolboxitemtemplate, data); 

				//toolboxtext += toolitemtext;				
				toolboxitemstr += toolitemtext;
		}
		
		toolboxtext += "<div id='floatingtoolboxBody'>";
		toolboxtext += 		toolboxitemstr;
		toolboxtext += "</div>";
		
		//if($('#toolbox').length){
			$("#floatingtoolbox").html(toolboxtext);		
		//}
		
		//Menu Bar
		
		var menubartext = "";

		menubartext += '<div style="float: left;">';
		menubartext += '	<div class="navbar">';
		// menubartext += '		<a href="/" onmouseover="closeAllDropdowns();">Home</a>';
		menubartext += '		<div class="dropdown">';
		menubartext += '			<div class="dropbtn" onmouseout="menuBarButtonLeft()" onmouseover="showFileDropdown()">';
		menubartext += '				File';
		menubartext += '			</div>';
		menubartext += '			<div class="dropdown-content" id="fileDropdown">';
		menubartext += '				<a id="fileNewMenuBtn"><span>New</span></a>';
		menubartext += '				<a style="display: none;" id="fileOpenMenuBtn"><span style="opacity: 1;">Open</span></a>';
		menubartext += '				<a id="fileOpenAsLayerBtn"><span style="opacity: 1;">Open as Layer</span></a>';		
		menubartext += '				<a id="fileExportMenuBtn"><span>Export Image</span></a>';
		//menubartext += '				<a id="testMenuBtn"><span>Test</span></a>';
		menubartext += '				<a style="display: none;" id="testMenuBtn"><span>Test</span></a>';
		menubartext += '			</div>';
		menubartext += '		</div>'; 
		menubartext += '		<div class="dropdown">';
		menubartext += '			<div class="dropbtn" onmouseout="menuBarButtonLeft()" onmouseover="showEditDropdown()">';
		menubartext += '				Edit';
		menubartext += '			</div>';
		menubartext += '			<div class="dropdown-content" id="editDropdown">';
		menubartext += '				<a id="undoMenuBtn" ><span>Undo</span></a>';
		menubartext += '				<a id="redoMenuBtn" ><span>Redo</span></a>';
		menubartext += '				<a id="clearSelectionMenuBtn" ><span>Clear</span></a>';
		menubartext += '			</div>';
		menubartext += '		</div>'; 
		menubartext += '		<div class="dropdown">';
		menubartext += '			<div class="dropbtn" onmouseout="menuBarButtonLeft()" onmouseover="showSelectDropdown()">';
		menubartext += '				Select';
		menubartext += '			</div>';
		menubartext += '			<div class="dropdown-content" id="selectDropdown">';
		menubartext += '				<a id="closeSelectionMenuBtn" ><span>Deselect</span></a>';
		menubartext += '				<a id="invertSelectionMenuBtn" ><span>Invert</span></a>';
		menubartext += '				<a id="toggleViewSelectionMenuBtn" style="display: none;" ><span>Hide</span></a>';
		menubartext += '				<a id="transformSelectionMenuBtn"><span>Move Selection</span></a>';
		menubartext += '			</div>';
		menubartext += '		</div>'; 
		menubartext += '		<div class="dropdown">';
		menubartext += '			<div class="dropbtn" onmouseout="menuBarButtonLeft()" onmouseover="showImageDropdown()">';
		menubartext += '				Image';
		menubartext += '			</div>';
		menubartext += '			<div class="dropdown-content" id="imageDropdown">';
		menubartext += '				<a onclick="layerPanel.showCanvasSizeDialog()"><span>Canvas Size</span></a>';
		menubartext += '				<a onmouseover="showSubmenu(\'flipImageSubmenu\')" onmouseout="closeSubmenu(\'flipImageSubmenu\')">';
		menubartext += '					<span>Transform</span>';
		// 									Image > Flip submenu									
		menubartext += '					<div id="flipImageSubmenu" class="dropdown-content-submenu">';
		menubartext += '						<div style="padding: 0px 0px 0px 2px;">';
		menubartext += '							<span id="flipImageHorizontallyMenuBtn">Flip Horizontally</span>';
		menubartext += '							<span id="flipImageVerticallyMenuBtn">Flip Vertically</span>';
		menubartext += '							<span style="display: block;" id="rotateImage90ClockMenuBtn">Rotate 90&deg; clockwise</span>';
		menubartext += '							<span style="display: block;" id="rotateImage90CClockMenuBtn">Rotate 90&deg; anti-clockwise</span>';
		menubartext += '							<span style="display: block;" id="rotateImage180ClockMenuBtn">Rotate 180&deg;</span>';
		menubartext += '						</div>';		
		menubartext += '					</div>';
		// 									End Image > Flip submenu		
		menubartext += '				</a>';
		menubartext += '				<a style="display:none" href="/image/rotate-image"><span>Rotate Image</span></a>';
		menubartext += '				<a id="trimImageMenuBtn" ><span>Trim</span></a>';
		menubartext += '				<a id="cropToSelectionMenuBtn"><span>Crop to Selection</span></a>';
		menubartext += '			</div>';
		menubartext += '		</div>'; 
		menubartext += '		<div class="dropdown">';
		menubartext += '			<div class="dropbtn" onmouseout="menuBarButtonLeft()" onmouseover="showLayerDropdown()">';
		menubartext += '				Layer';
		menubartext += '			</div>';
		menubartext += '			<div class="dropdown-content" id="layerDropdown">';
		menubartext += '				<a onmouseover="showSubmenu(\'newLayerSubmenu\')" onmouseout="closeSubmenu(\'newLayerSubmenu\')">';
		menubartext += '					<span>New Layer</span>';
		// 									New Layer submenu	
		menubartext += '					<div id="newLayerSubmenu" class="dropdown-content-submenu">';
		menubartext += '						<div style="padding: 0px 0px 0px 2px;">';
		menubartext += '							<span onclick="layerPanel.addNewLayer(document.getElementById(\'foregroundColorInput\').value);">Foreground Color</span>';
		menubartext += '							<span onclick="layerPanel.addNewLayer(document.getElementById(\'backgroundColorInput\').value);">Background Color</span>';
		menubartext += '							<span onclick="document.getElementById(\'newLayerColorInput\').click()">Custom Color</span>';
		menubartext += '							<span onclick="layerPanel.addNewLayer(\'#ffffff\');">White</span>';
		menubartext += '							<span onclick="layerPanel.addNewLayer(\'#000000\');">Black</span>';
		menubartext += '							<span id="newLayerMenuBtn">Transparent</span>';
		menubartext += '						</div>';		
		menubartext += '					</div>';
		// 									End New Layer submenu		
		menubartext += '				</a>';
		menubartext += '				<a id="duplicateLayerMenuBtn"><span>Duplicate Layer</span></a>';
		menubartext += '				<a id="deleteLayerMenuBtn"><span>Delete</span></a>';
		menubartext += '				<a id="rasterizeLayerMenuBtn"><span>Rasterize</span></a>';
		menubartext += '				<a onmouseover="showSubmenu(\'layerMaskSubmenu\')" onmouseout="closeSubmenu(\'layerMaskSubmenu\')">';
		menubartext += '					<span>Layer Mask</span>';
		// 									Layer Mask submenu									
		menubartext += '					<div id="layerMaskSubmenu" class="dropdown-content-submenu">';
		menubartext += '						<div style="padding: 0px 0px 0px 2px;">';
		menubartext += '							<span id="addOpaqueLayerMaskMenuBtn" onclick="layerPanel.addLayerRasterMask(\'white\')">Add Opaque</span>';
		menubartext += '							<span id="addTransparentLayerMaskMenuBtn" onclick="layerPanel.addLayerRasterMask(\'black\')">Add Transparent</span>';
		menubartext += '							<span id="deleteLayerMaskMenuBtn">Delete</span>';
		menubartext += '							<span id="applyLayerRasterMaskMenuBtn">Apply</span>';
		menubartext += '							<span id="toggleEnableLayerRasterMaskMenuBtn">Enable/Disable</span>';
		menubartext += '						</div>';		
		menubartext += '					</div>';
		// 									end Layer Mask submenu
		menubartext += '				</a>';
		menubartext += '				<a onmouseover="showSubmenu(\'arrangeLayersSubmenu\')" onmouseout="closeSubmenu(\'arrangeLayersSubmenu\')">';
		menubartext += '					<span>Arrange Layers</span>';
		// 									Arrange Layers submenu									
		menubartext += '					<div id="arrangeLayersSubmenu" class="dropdown-content-submenu">';
		menubartext += '						<div style="padding: 0px 0px 0px 2px;">';
		menubartext += '							<span onclick="layerPanel.moveLayerUp()">Layer Up</span>';
		menubartext += '							<span onclick="layerPanel.moveLayerDown()">Layer Down</span>';
		menubartext += '							<span onclick="layerPanel.moveLayerToTop()">Layer to Top</span>';
		menubartext += '							<span onclick="layerPanel.moveLayerToBottom()">Layer to Bottom</span>';
		menubartext += '						</div>';		
		menubartext += '					</div>';
		// 									end submenu		
		menubartext += '				</a>';
		menubartext += '				<a id="mergeLayerDownMenuBtn"><span>Merge Down</span></a>';
		menubartext += '				<a id="mergeLayerUpMenuBtn" style="display: none;" ><span>Merge Up</span></a>';
		menubartext += '				<a id="mergeLayerUpMenuBtn" style="display: none;" ><span>Merge Up</span></a>';
		menubartext += '				<a onmouseover="showSubmenu(\'transformLayerSubmenu\')" onmouseout="closeSubmenu(\'transformLayerSubmenu\')">';
		menubartext += '					<span>Transform</span>';
		// 									Layer > Transform									
		menubartext += '					<div id="transformLayerSubmenu" class="dropdown-content-submenu">';
		menubartext += '						<div style="padding: 0px 0px 0px 2px;">';
		menubartext += '							<span onclick="layerPanel.flipLayerHorizontal()">Flip Horizontally</span>';
		menubartext += '							<span onclick="layerPanel.flipLayerVertical()">Flip Vertically</span>';
		menubartext += '							<span onclick="layerPanel.rotateLayer(90)">Rotate 90&deg; clockwise</span>';
		menubartext += '							<span onclick="layerPanel.rotateLayer(-90)">Rotate 90&deg; anti-clockwise</span>';
		menubartext += '							<span onclick="layerPanel.rotateLayer(180)">Rotate 180&deg;</span>';
		menubartext += '						</div>';		
		menubartext += '					</div>';
		// 									Layer > Transform	
		menubartext += '				</a>';
		menubartext += '			</div>';
		menubartext += '		</div>'; 
		menubartext += '		<div class="dropdown">';
		menubartext += '			<div  class="dropbtn" onmouseout="menuBarButtonLeft()" onmouseover="showToolDropdown()">';
		menubartext += '				Tools';
		menubartext += '			</div>';
		menubartext += '			<div class="dropdown-content" id="toolDropdown">';
		menubartext += '				<a href="/image/rectangular-marquee-tool">Rectangular Marquee</a>';
		menubartext += '				<a href="/image/elliptical-marquee-tool">Elliptical Marquee</a>';
		menubartext += '				<a href="/image/lasso-tool">Lasso</a>';
		menubartext += '				<a href="/image/polygon-lasso-tool">Polygon Lasso</a>';
		menubartext += '				<a href="/image/crop-tool">Crop</a>';
		menubartext += '				<a href="/image/brush-tool">Brush</a>';
		menubartext += '				<a href="/image/eraser-tool">Eraser</a>';
		menubartext += '				<a href="/image/background-eraser-tool">Background Eraser </a>';
		menubartext += '			</div>';
		menubartext += '		</div>'; 
		menubartext += '		<div class="dropdown">';
		menubartext += '			<div class="dropbtn" onmouseout="menuBarButtonLeft()" onmouseover="showColorDropdown()">';
		menubartext += '				Colors';
		menubartext += '			</div>';
		menubartext += '			<div class="dropdown-content" id="filterDropdown">';
		menubartext += '				<a style="display: none;" href="/image/blur-image">Blur</a>';     
		menubartext += '				<a href="/image/adjust-image-brightness">Brightness</a>';     
		menubartext += '				<a href="/image/adjust-image-contrast">Contrast</a>';  
		menubartext += '				<a href="/image/apply-duotone-effect">Duotone</a>';  
		menubartext += '				<a href="/image/grayscale-image">Grayscale</a>';  
		menubartext += '				<a href="/image/adjust-image-hue">Hue</a>';    
		menubartext += '				<a href="/image/invert-image-colors">Invert colors</a>';  
		//menubartext += '				<a href="/image/change-image-transparency">Opacity</a>';
		menubartext += '				<a href="/image/adjust-image-saturation">Saturation</a>'; 
		menubartext += '				<a href="/image/apply-sepia">Sepia</a>';      
		menubartext += '			</div>';
		menubartext += '		</div>'; 
		menubartext += '	</div>';
		menubartext += '</div>';
		menubartext += '<div style="float: right;">';
		menubartext += '	<!-- Right navbar items -->';
		menubartext += '</div>';
		menubartext += '<div style="clear: both;"></div>';
		menubartext += '<div style="position: absolute; top: 40px; right: 0px; height: 400px; background-color: #e2e2e2;">';
		menubartext += '	<!-- Right Floating Panels -->';
		menubartext += '	<div>';
				
		menubartext += '	</div>';
		menubartext += '</div>';
		
		//$("nav").html(menubartext);
		$("#menu_links").html(menubartext);
		
		// Right Panels
		// $("#rightbox").html("");
		
		//alert(JSON.stringify(document.getElementsByTagName("nav")[0].getBoundingClientRect()));
		//alert
		
		var windowWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
		var windowHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;		
		
		
		// set the top of the floating panels
		//var editoptionsBox = document.getElementById("editOptionsDiv").getBoundingClientRect();
		var navbox = document.getElementsByTagName("nav")[0].getBoundingClientRect();
		//console.log(navbox.top + "," + navbox.height);
		
		// Toolbox Dimensions and Setup
		document.getElementById("floatingtoolbox").style.top = parseInt(navbox.top + navbox.height) + "px";
		document.getElementById("floatingtoolbox").style.height = (windowHeight - parseInt(navbox.top + navbox.height) - 25) + "px";
		//alert(JSON.stringify(document.getElementById("floatingtoolboxHeader").getBoundingClientRect()));
		var toolboxHeaderDims = document.getElementById("floatingtoolboxHeader").getBoundingClientRect();
		//document.getElementById("floatingtoolboxBody").style.height = "200px";
		
		// Panels Dimensions and setup
		document.getElementById("floatingpanels").style.top = parseInt(navbox.top + navbox.height) + "px";
		document.getElementById("floatingpanels").style.height =  (windowHeight - parseInt(navbox.top + navbox.height) - 25) + "px";
		/*
		var w = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
		var h = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
		
		alert(w + "," + h);
		
		// check if has sidebar
		if (typeof window.innerWidth === 'number'){
			alert(window.innerWidth > document.documentElement.clientWidth);
		}
		
		
		// set up the footer
		document.getElementById("floatingfooter").style.left = toolBoxWidth + "px";
		//document.getElementById("floatingfooter").style.width = 
		*/
		
		workspacePaddingTop = parseInt(navbox.top + navbox.height + 25);
		workspacePaddingBottom = workspacePaddingTop;
		//alert(workspacePaddingTop);
		
		function createForegroundBackgroundColorButton(){
			var colorbtn = "";
			
			var foregroundColor = "#000000";
			var backgroundColor = "#ffffff";
			
			// get the background and foreground color from the storage if not set default to black and white
			if (localStorage.getItem("foreground_color_settings") === null) {
				// leave at black default
			}else{
				foregroundColor = localStorage.getItem("foreground_color_settings");
			}
			if (localStorage.getItem("background_color_settings") === null) {
				// leave at white default
			}else{
				backgroundColor = localStorage.getItem("background_color_settings");
			}	
			
			global_foregroundColor = foregroundColor;
			global_backgroundColor = backgroundColor;
			
			/*
			colorbtn += '	<svg width="18" height="18">';
			colorbtn += '		<rect width="18" height="18" style="fill:rgb(0,0,0);" />';
			colorbtn += '	</svg>';
			*/
			
			colorbtn += '<?xml version="1.0" encoding="UTF-8" standalone="no"?>';
			colorbtn += '<svg';
			colorbtn += '   xmlns:dc="http://purl.org/dc/elements/1.1/"';
			colorbtn += '   xmlns:cc="http://creativecommons.org/ns#"';
			colorbtn += '   xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"';
			colorbtn += '   xmlns:svg="http://www.w3.org/2000/svg"';
			colorbtn += '   xmlns="http://www.w3.org/2000/svg"';
			colorbtn += '   id="svg8"';
			colorbtn += '   version="1.1"';
			colorbtn += '   viewBox="0 0 7.4083331 7.4083335"';
			colorbtn += '   height="28"';
			colorbtn += '   width="28">';
			colorbtn += '  <defs';
			colorbtn += '	 id="defs2">';
			colorbtn += '	<filter';
			colorbtn += '	   id="filter842"';
			colorbtn += '	   style="color-interpolation-filters:sRGB">';
			colorbtn += '	  <feFlood';
			colorbtn += '		 id="feFlood832"';
			colorbtn += '		 result="flood"';
			colorbtn += '		 flood-color="rgb(0,0,0)"';
			colorbtn += '		 flood-opacity="0.498039" />';
			colorbtn += '	  <feComposite';
			colorbtn += '		 id="feComposite834"';
			colorbtn += '		 result="composite1"';
			colorbtn += '		 operator="in"';
			colorbtn += '		 in2="SourceGraphic"';
			colorbtn += '		 in="flood" />';
			colorbtn += '	  <feGaussianBlur';
			colorbtn += '		 id="feGaussianBlur836"';
			colorbtn += '		 result="blur"';
			colorbtn += '		 stdDeviation="0.5"';
			colorbtn += '		 in="composite1" />';
			colorbtn += '	  <feOffset';
			colorbtn += '		 id="feOffset838"';
			colorbtn += '		 result="offset"';
			colorbtn += '		 dy="0.5"';
			colorbtn += '		 dx="0" />';
			colorbtn += '	  <feComposite';
			colorbtn += '		 id="feComposite840"';
			colorbtn += '		 result="composite2"';
			colorbtn += '		 operator="over"';
			colorbtn += '		 in2="offset"';
			colorbtn += '		 in="SourceGraphic" />';
			colorbtn += '	</filter>';
			colorbtn += '  </defs>';
			colorbtn += '  <metadata';
			colorbtn += '	 id="metadata5">';
			colorbtn += '	<rdf:RDF>';
			colorbtn += '	  <cc:Work';
			colorbtn += '		 rdf:about="">';
			colorbtn += '		<dc:format>image/svg+xml</dc:format>';
			colorbtn += '		<dc:type';
			colorbtn += '		   rdf:resource="http://purl.org/dc/dcmitype/StillImage" />';
			colorbtn += '		<dc:title></dc:title>';
			colorbtn += '	  </cc:Work>';
			colorbtn += '	</rdf:RDF>';
			colorbtn += '  </metadata>';
			colorbtn += '  <g';
			colorbtn += '	 transform="translate(0,-289.59165)"';
			colorbtn += '	 id="layer1">';
			
			colorbtn += '	<rect id="backgroundColorBtnSwatch" onClick="openBackgroundColorPicker()" ';
			colorbtn += '	   y="291.24527"';
			colorbtn += '	   x="1.5213536"';
			colorbtn += '	   height="5.2916665"';
			colorbtn += '	   width="5.2916665"';
			colorbtn += '	   style="opacity:1;fill:' + backgroundColor + ';fill-opacity:1;stroke:none;stroke-width:0.26458332;stroke-linejoin:round;stroke-miterlimit:4;stroke-dasharray:none;stroke-dashoffset:0;stroke-opacity:1;filter:url(#filter842)" />';

			colorbtn += '	<rect id="foregroundColorBtnSwatch" onClick="openForegroundColorPicker()" ';			
			colorbtn += '	   y="289.59164"';
			colorbtn += '	   x="0"';
			colorbtn += '	   height="5.2916665"';
			colorbtn += '	   width="5.2916665"';
			colorbtn += '	   style="opacity:1;fill:' + foregroundColor + ';fill-opacity:1;stroke:none;stroke-width:0.26458332;stroke-linejoin:round;stroke-miterlimit:4;stroke-dasharray:none;stroke-dashoffset:0;stroke-opacity:1" />';
			colorbtn += '  </g>';
			colorbtn += '</svg>';
			colorbtn += '<input type="color" id="foregroundColorInput" onchange="updateForegroundColor(this.value)" style="display: none;" value="' + foregroundColor + '">';
			colorbtn += '<input type="color" id="backgroundColorInput" onchange="updateBackgroundColor(this.value)" style="display: none;" value="' + backgroundColor + '">';
			colorbtn += '<input type="color" id="newLayerColorInput" onchange="layerPanel.addNewLayer(this.value);" style="display: none;" value="#ffffff">';
			
			return colorbtn;
		}
		
	})();
	
	function updateForegroundColor(hexcolor){
	
		//alert("update foreground color " + editingLayerMask);
	
		global_foregroundColor = hexcolor;
	
		
		// layer canvas (0), raster mask (1), or vector mask (2)
		if(editingLayerMask == 0){
			// Editing regular layer canvas
			
			// alert("foreground");
			document.getElementById("foregroundColorInput").value = hexcolor;
			document.getElementById("foregroundColorBtnSwatch").style.fill = hexcolor;
			
			// If we are on the color picker page and we have 'set foreground color'
			// in the options bar 
			if(document.getElementById("colorSetSelect")){
				var colorSetSelect = document.getElementById("colorSetSelect");
				
				// what color to set
				if(colorSetSelect.value == 1){
					// foreground color set selected
					
					var RGB = EditorUtils.hexToRgb(hexcolor); 
					EditorUtils.setColorPickerColorLabels(RGB.r, RGB.b, RGB.g, hexcolor);					
				}
			}
			
		}else if(editingLayerMask == 1){
			// Editing layer raster mask canvas

			// Since we are editing Raster mask set the foregroundColorInput and backgroundColorInput to grayscale
			
			var foregroundRGB = EditorUtils.hexToRgb(hexcolor);
			var foregroundGrayscaleRGB = EditorUtils.rgbToGrayscale(foregroundRGB.r, foregroundRGB.g, foregroundRGB.b);
			var grayscaleHex = EditorUtils.rgbToHex(foregroundGrayscaleRGB.r, foregroundGrayscaleRGB.g, foregroundGrayscaleRGB.b);
			//alert(grayscaleHex);
			
			document.getElementById("foregroundColorInput").value = grayscaleHex;
			document.getElementById("foregroundColorBtnSwatch").style.fill = grayscaleHex;
			
		}else if(editingLayerMask == 2){
			// Editing layer vector mask
			
			// alert("foreground");
			document.getElementById("foregroundColorInput").value = hexcolor;
			document.getElementById("foregroundColorBtnSwatch").style.fill = hexcolor;
			
		}
		
		// If we are on the gradient page update the toolbar preview
		EditorUtils.updateGradientToolbarPreview();
		
		// save the foreground color to the local store
		localStorage.setItem("foreground_color_settings", hexcolor);
		
	}
	
	function updateBackgroundColor(hexcolor){
	
		global_backgroundColor = hexcolor;
	

		// layer canvas (0), raster mask (1), or vector mask (2)
		if(editingLayerMask == 0){
			// Editing regular layer canvas
			
			// alert("background");
			document.getElementById("backgroundColorInput").value = hexcolor;
			document.getElementById("backgroundColorBtnSwatch").style.fill = hexcolor;
			
			// If we are on the color picker page and we have 'set foreground color'
			// in the options bar 
			if(document.getElementById("colorSetSelect")){
				var colorSetSelect = document.getElementById("colorSetSelect");
				
				// what color to set
				if(colorSetSelect.value == 2){
					// background color set selected
					
					var RGB = EditorUtils.hexToRgb(hexcolor); 
					EditorUtils.setColorPickerColorLabels(RGB.r, RGB.b, RGB.g, hexcolor);					
				}
			}
			
		}else if(editingLayerMask == 1){
			// Editing layer raster mask canvas

			// Since we are editing Raster mask set the foregroundColorInput and backgroundColorInput to grayscale
			
			var backgroundRGB = EditorUtils.hexToRgb(hexcolor);
			var backgroundGrayscaleRGB = EditorUtils.rgbToGrayscale(backgroundRGB.r, backgroundRGB.g, backgroundRGB.b);
			var grayscaleHex = EditorUtils.rgbToHex(backgroundGrayscaleRGB.r, backgroundGrayscaleRGB.g, backgroundGrayscaleRGB.b);
			//alert(grayscaleHex);
			
			document.getElementById("backgroundColorInput").value = grayscaleHex;
			document.getElementById("backgroundColorBtnSwatch").style.fill = grayscaleHex;
			
		}else if(editingLayerMask == 2){
			// Editing layer vector mask
			
			// alert("foreground");
			document.getElementById("backgroundColorInput").value = hexcolor;
			document.getElementById("backgroundColorBtnSwatch").style.fill = hexcolor;
			
		}
		
		// If we are on the gradient page update the toolbar preview
		EditorUtils.updateGradientToolbarPreview();
		
		
		localStorage.setItem("background_color_settings", hexcolor);
	}	
	

	function openForegroundColorPicker(){
		document.getElementById("foregroundColorInput").click();
	}
	
	function openBackgroundColorPicker(){
		document.getElementById("backgroundColorInput").click();
	}
	
	function toolIconOnMouseOver(element){
		element.style.backgroundColor = "rgb(21, 22, 25)";
	}
	
	function toolIconOnMouseOut(element){
		// console.log(element.id);
		// get the icon image of the tool icon div
		let tool_icon_url = element.getElementsByTagName("input");
		//console.log(tool_icon_url[0].value);
		
		if(window.location.href.indexOf(tool_icon_url[0].value) >= 0){
			// The current tool ison is the tool pge so set background to black
			element.style.backgroundColor = "rgb(19, 20, 23);";
		}else{
			element.style.backgroundColor = "initial";			
		}

	}
	
	
	/*
	function colorBtnAlert(val){
		var keys = Object.keys(localStorage);
		alert(JSON.stringify(keys));
	}
	*/
		
