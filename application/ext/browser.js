// ==========================================================================
// Project:   Blossom - Modern, Cross-Platform Application Framework
// Copyright: ©2012 Fohr Motion Picture Studios. All rights reserved.
// License:   Licensed under the GPLv3 license (see BLOSSOM-LICENSE).
// ==========================================================================
/*globals sc_assert CanvasRenderingContext2D HTMLCanvasElement 
  ENFORCE_BLOSSOM_2DCONTEXT_API */

var ENFORCE_BLOSSOM_2DCONTEXT_API = false; // removes context.canvas and context.drawImage()

CanvasRenderingContext2D.prototype.__defineGetter__('width', function() {
  var canvas = this.__sc_canvas__;
  return canvas? canvas.width : 0;
});

CanvasRenderingContext2D.prototype.__defineGetter__('height', function() {
  var canvas = this.__sc_canvas__;
  return canvas? canvas.height : 0;
});

CanvasRenderingContext2D.prototype.__defineGetter__('w', function() {
  var canvas = this.__sc_canvas__;
  return canvas? canvas.width : 0;
});

CanvasRenderingContext2D.prototype.__defineGetter__('h', function() {
  var canvas = this.__sc_canvas__;
  return canvas? canvas.height : 0;
});

CanvasRenderingContext2D.prototype._sc_drawImage = CanvasRenderingContext2D.prototype.drawImage;
CanvasRenderingContext2D.prototype._sc_createPattern = CanvasRenderingContext2D.prototype.createPattern;

if (ENFORCE_BLOSSOM_2DCONTEXT_API) {
  console.log("*** ENFORCE_BLOSSOM_2DCONTEXT_API is ON ***");
  CanvasRenderingContext2D.prototype.drawImage = function() {
    throw "CanvasRenderingContext2D#drawImage() is not available in Blossom. Use #drawLayer() instead."; 
  };
  CanvasRenderingContext2D.prototype.createPattern = function() {
    throw "CanvasRenderingContext2D#createPattern() is not available in Blossom. Use SC.Layer#patternForContext(context, repetition) instead."; 
  };
}

CanvasRenderingContext2D.prototype.drawLayer = function(layer, sx, sy, sw, sh, dx, dy, dw, dh) {
  if (!layer.isLayer) throw TypeError;
  var el = layer.__sc_element__;
  switch (arguments.length) {
    case  3: return this._sc_drawImage(el, /*dx*/sx, /*dy*/sy);
    case  5: return this._sc_drawImage(el, /*dx*/sx, /*dy*/sy, /*dw*/sw, /*dh*/sh);
    default: return this._sc_drawImage(el, sx, sy, sw, sh, dx, dy, dw, dh);
  }
};
