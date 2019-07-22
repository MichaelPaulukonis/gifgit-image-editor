// Copyright (c) 2019 Kasey Thomas. All rights reserved.
// Use of this source code is governed by the EULA.

// MIT LICENSE

// Working with objects
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Working_with_Objects

// https://github.com/kig/canvasfilters
// Based on http://www.html5rocks.com/en/tutorials/canvas/imagefilters/

// Image kernels
// http://setosa.io/ev/image-kernels/

// http://northstar-www.dartmouth.edu/doc/idl/html_6.2/Sharpening_an_Image.html

Filters = {};

Filters.type = "filter object";

Filters.displayType = function() {  // Method which will display type of Animal
    alert(this.type);
}


// 'pixels' is imagedata from a canvas context
Filters.convole = function(pixels, weights, opaque) {
  var side = Math.round(Math.sqrt(weights.length));
  var halfSide = Math.floor(side/2);
  var src = pixels.data;
  var sw = pixels.width;
  var sh = pixels.height;
  // pad output by the convolution matrix
  var w = sw;
  var h = sh;
  
  // var output = Filters.createImageData(w, h);  
  // my code substitutes above
  var output_canvas = document.createElement("canvas");
  output_canvas.width = w;
  output_canvas.height = h;
  var output_ctx = output_canvas.getContext("2d");
  
  var output = output_ctx.getImageData(0, 0, w, h);
  
  var dst = output.data;
  // go through the destination image pixels
  var alphaFac = opaque ? 1 : 0;
  for (var y=0; y<h; y++) {
    for (var x=0; x<w; x++) {
      var sy = y;
      var sx = x;
      var dstOff = (y*w+x)*4;
      // calculate the weighed sum of the source image pixels that
      // fall under the convolution matrix
      var r=0, g=0, b=0, a=0;
      for (var cy=0; cy<side; cy++) {
        for (var cx=0; cx<side; cx++) {
          var scy = sy + cy - halfSide;
          var scx = sx + cx - halfSide;
          if (scy >= 0 && scy < sh && scx >= 0 && scx < sw) {
            var srcOff = (scy*sw+scx)*4;
            var wt = weights[cy*side+cx];
            r += src[srcOff] * wt;
            g += src[srcOff+1] * wt;
            b += src[srcOff+2] * wt;
            a += src[srcOff+3] * wt;
          }
        }
      }
      dst[dstOff] = r;
      dst[dstOff+1] = g;
      dst[dstOff+2] = b;
      dst[dstOff+3] = a + alphaFac*(255-a);
    }
  }
  return output;
};