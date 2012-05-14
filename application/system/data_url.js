// ==========================================================================
// Project:   Blossom - Modern, Cross-Platform Application Framework
// Copyright: ©2012 Fohr Motion Picture Studios. All rights reserved.
// License:   Licensed under the GPLv3 license (see BLOSSOM-LICENSE).
// ==========================================================================
/*globals sc_assert */

SC.renderToDataUrl = function(size, type, renderFunction) {
  if (arguments.length === 2) {
    renderFunction = type;
    type = 'image/png';
  }

  sc_assert(SC.IsSize(size), "`size` should be of type SC.Size");
  sc_assert(size.width > 0,    "`size.width` too small in SC.rendorToDataUrl: " + size.width);
  sc_assert(size.width < 2048, "`size.width` too big in SC.rendorToDataUrl: " + size.width);
  sc_assert(size.height > 0,   "`size.height` too small in SC.rendorToDataUrl: " + size.height);
  sc_assert(size.width < 2048, "`size.height` too big in SC.rendorToDataUrl: " + size.height);
  sc_assert(typeof type === 'string', "`type` argument must be a string");
  sc_assert(typeof renderFunction === 'function', "`renderFunction` must be a function");

  var canvas = SC._cachedCanvas;
  if (!canvas) {
    canvas = SC._cachedCanvas = document.createElement('canvas');
  }

  // This implicitly clears the canvas.
  canvas.width = size.width;
  canvas.height = size.height;

  renderFunction(canvas.getContext('2d'));

  try {
    var dataUrl = canvas.toDataURL(type);    
  } catch (e) {
    console.log("Problem converting canvas to data URL with type", type, e);
    dataUrl = null;
  }
  return dataUrl;
};
