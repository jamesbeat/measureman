/* -*- JavaScript -*- */
/*
 * potential TODO
 * - clean up. This is mostly experimental code right now figuring out how
 *   JavaScript works and stuff :) Put things with their own state in objects.
 * - Endpoints should have the T, but angle-centers just a little circle.
 *   (so: points that have > 1 lines attached to a point)
 * - circle radius estimation (separate mode)
 *    o three dots circle, 4 ellipsis,  but allow multiple dots
 *      and minimize error.
 *    o axis where the center would be plus two dots.
 * - modes: draw single line, polyline, mark circle, select (for delete)
 * - select: left click selects a line (endpoints and center). Highlight;
 *   del deletes.
 * - shift + mouse movement: only allow for discrete 360/16 angles.
 * - alt + mouse movement: snap to point in the vicinity.
 * - provide a 'reference straight line' defining the 0 degree angle.
 * - 'collision detection' for labels. Labels should in general be drawn
 *   separately and optimized for non-collision with other labels, lines and
 *   arcs. Make them align with lines, unless too steep angle (+/- 60 degrees?).
 * - checkbox 'show angles', 'show labels'
 * - export as SVG that includes the original image.
 *   background, labels, support-lines (arcs and t-lines) and lines
 *   should be in separate layers to individually look at them.
 *   (exporting just an image with the lines on top crashes browsers; play
 *   with toObjectUrl for download).
 */
"use strict";

// Some constants.

// How lines usually look like (blue with yellow background should make
// it sufficiently distinct in many images).
var line_style = "#00f";
var background_line_style = 'rgba(255, 255, 0, 0.4)';
var background_line_width = 7;

var box_style = "#00f";
var background_box_style = 'rgba(255, 0, 0, 0.4)';
var background_box_width = 7;

// On highlight.
var highlight_line_style = "#f00";
var background_highlight_line_style = 'rgba(0, 255, 255, 0.4)';
var highlight_box_style = "#f00";
var background_highlight_box_style = 'rgba(0, 255, 255, 0.4)';

var length_font_pixels = 12;
var angle_font_pixels = 10;
var loupe_magnification = 15;
var end_bracket_len = 5;

// These variables need to be cut down and partially be private
// to the modules.
var help_system;
var aug_view;
var backgroundImage;  // if loaded. Also used by the loupe.


// Init function. Call once on page-load.
function augenmass_init() {
    help_system = new HelpSystem(document.getElementById('helptext'));
    aug_view = new AugenmassView(document.getElementById('measure'));

    var show_delta_checkbox = document.getElementById('show-deltas');
    show_delta_checkbox.addEventListener("change", function(e) {
	aug_view.setShowDeltas(show_delta_checkbox.checked);
	aug_view.drawAll();
    });

    var show_angle_checkbox = document.getElementById('show-angles');
    show_angle_checkbox.addEventListener("change", function(e) {
	aug_view.setShowAngles(show_angle_checkbox.checked);
	aug_view.drawAll();
    });

    loupe_canvas = document.getElementById('loupe');
    loupe_canvas.style.left = document.body.clientWidth - loupe_canvas.width - 10;
    loupe_ctx = loupe_canvas.getContext('2d');
    // We want to see the pixels:
    loupe_ctx.imageSmoothingEnabled = false;
    loupe_ctx.mozImageSmoothingEnabled = false;
    loupe_ctx.webkitImageSmoothingEnabled = false;

    aug_view.resetWithSize(10, 10);   // Some default until we have an image.

    var chooser = document.getElementById("file-chooser");
    chooser.addEventListener("change", function(e) {
	load_background_image(chooser);
    });

    var download_link = document.getElementById('download-result');
    download_link.addEventListener('click', function() {
	download_result(download_link) },  false);
    download_link.style.opacity = 0;  // not visible at first.
    download_link.style.cursor = "default";
}

function AugenmassController(canvas, view) {
    // This doesn't have any public methods.
    this.start_line_time_ = 0;

    var self = this;
    canvas.addEventListener("mousedown", function(e) {
	extract_event_pos(e, function(e,x,y) { self.onClick(e,x,y); });
    });
    canvas.addEventListener("contextmenu", function(e) {
	e.preventDefault();
    });
    canvas.addEventListener("mousemove", function(e) {
	extract_event_pos(e, onMove);
    });
    canvas.addEventListener("dblclick", function(e) {
	extract_event_pos(e, onDoubleClick);
    });
      
    document.addEventListener("keydown", onKeyEvent);
    document.addEventListener("keyup", offKeyEvent);

    function extract_event_pos(e, callback) {
	// browser and scroll-independent extraction of mouse cursor in canvas.
	var x, y;
	if (e.pageX != undefined && e.pageY != undefined) {
	    x = e.pageX;
	    y = e.pageY;
	}
	else {
	    x = e.clientX + scrollLeft();
	    y = e.clientY + scrollY();
	}
	x -= canvas.offsetLeft;
	y -= canvas.offsetTop;
	
	callback(e, x, y);
    }

    function getModel() { return view.getModel(); }
    function getView() { return view; }

    function cancelCurrentLine() {
		if (getModel().hasEditLine()) {
		    getModel().forgetEditLine();
		    getView().drawAll();
		}
    }
    
    function cancelCurrentBox() {
		if (getModel().hasEditBox()) {
		    getModel().forgetEditBox();
		    getView().drawAll();
		}
    }
    
    function onKeyEvent(e) {
		if (e.keyCode == 27) {  // ESC key.
		    cancelCurrentLine();
		}
		if (e.keyCode == 16) {  // Shiftkey.
		   
		}
		if (e.keyCode == 18) {  // Alt key.
		    
		}
		
    }
    function offKeyEvent(e){
	    
	    if (e.keyCode == 16) {  // Shiftkey.
		    
		}
		if (e.keyCode == 18) {  // Alt key.
		     
		}

    }

    function onMove(e, x, y) {
		if (backgroundImage === undefined)
		    return;
		     showFadingLoupe(x, y);
		var has_editline = getModel().hasEditLine();
		var has_editbox = getModel().hasEditBox();
		if (has_editline) {
		    getModel().updateEditLine(x, y);
		   
		}
		else if(has_editbox){
			 getModel().updateEditBox(x, y);
			 
		}
		else{
			return;
		}
		showFadingLoupe(x, y);
		getView().drawAll();
    }
    
    this.onClick = function(e, x, y) {
	        
		var now = new Date().getTime();
		
		if(e.which != undefined && e.which == 3){ //Right mouseclick: BOX
			
			if (!getModel().hasEditBox()) {
			    getModel().startEditBox(x, y);
			    this.start_line_time_ = now;
			    help_system.achievementUnlocked(HelpLevelEnum.DONE_START_BOX);
			    
			    console.log("box1");
			} else {
			    var box = getModel().updateEditBox(x, y);
			    // Make sure that this was not a double-click event.
			    // (are there better ways ?)
			    if (box.width() > 50
				|| (box.width() > 0 && (now - this.start_line_time_) > 500)) {
				getModel().commitEditBox();
				help_system.achievementUnlocked(HelpLevelEnum.DONE_FINISH_BOX);
			    } else {
				getModel().forgetEditBox();
			    }
			     console.log("box2");
			}
			getView().drawAll();

			
		}
		else{ //Right mouseclick: LINE
						
			if (!getModel().hasEditLine()) {
			    getModel().startEditLine(x, y);
			    this.start_line_time_ = now;
			    
			    help_system.achievementUnlocked(HelpLevelEnum.DONE_START_LINE);
			} else {
			    var line = getModel().updateEditLine(x, y);
			    // Make sure that this was not a double-click event.
			    // (are there better ways ?)
			    if (line.length() > 50
				|| (line.length() > 0 && (now - this.start_line_time_) > 500)) {
				getModel().commitEditLine();
				help_system.achievementUnlocked(HelpLevelEnum.DONE_FINISH_LINE);
			    } else {
				getModel().forgetEditLine();
			    }
			}
			getView().drawAll();
		}
    }

    function onDoubleClick(e, x, y) {
		cancelCurrentLine();
		cancelCurrentBox();
		var selected_line = getModel().findClosestLine(x, y);
		var selected_box = getModel().findClosestBox(x, y);
		
		if (selected_line == undefined){		}
		else{
				  
			getView().highlightLine(selected_line);
								    			    
			if (confirm('Delete?')) {
			    selected_line = getModel().removeLine(selected_line);
			    getView().drawAll();
			} 
		}
				
		if (selected_box == undefined){		}
		else{
				  
			getView().highlightBox(selected_box);
								    			    
			if (confirm('Delete?')) {
			    selected_box = getModel().removeBox(selected_box);
			    getView().drawAll();
			} 
		}
		
		
	}
}

function scrollTop() {
    return document.body.scrollTop + document.documentElement.scrollTop;
}

function scrollLeft() {
    return document.body.scrollLeft + document.documentElement.scrollLeft;
}

function init_download(filename) {
    var pos = filename.lastIndexOf(".");
    if (pos > 0) {
	filename = filename.substr(0, pos);
    }
    var download_link = document.getElementById('download-result');
    download_link.download = "augenmass-" + filename + ".png";
    download_link.style.cursor = "pointer";
    download_link.style.opacity = 1;
}

function download_result(download_link) {
    if (backgroundImage === undefined)
	return;
    aug_view.drawAll();
    download_link.href = aug_view.getCanvas().toDataURL('image/png');
}

function load_background_image(chooser) {
    if (chooser.value == "" || !chooser.files[0].type.match(/image.*/))
	return;

    var img_reader = new FileReader();
    img_reader.readAsDataURL(chooser.files[0]);
    img_reader.onload = function(e) {
	var new_img = new Image();
	// Image loading in the background canvas. Once we have the image, we
	// can size the canvases to a proper size.
	var background_canvas = document.getElementById('background-img');
	new_img.onload = function() {
	    var bg_context = background_canvas.getContext('2d');
	    background_canvas.width = new_img.width;
	    background_canvas.height = new_img.height;
	    bg_context.drawImage(new_img, 0, 0);
	    
	    aug_view.resetWithSize(new_img.width, new_img.height);

	    help_system.achievementUnlocked(HelpLevelEnum.DONE_FILE_LOADING);
	    backgroundImage = new_img;
	    init_download(chooser.files[0].name);
	}
	new_img.src = e.target.result;
    }
}
