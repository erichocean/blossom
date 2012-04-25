// ==========================================================================
// Project:   Blossom - Modern, Cross-Platform Application Framework
// Copyright: ©2012 Fohr Motion Picture Studios. All rights reserved.
// License:   Licensed under the GPLv3 license (see BLOSSOM-LICENSE).
// ==========================================================================
/*globals sc_assert */

SC.MeasureText = function(font, str) {
  var ctx = this._sc_measureTextContext;
  if (!ctx) {
    var el = document.createElement('canvas');
    el.width = 16;
    el.height = 16;
    ctx = this._sc_measureTextContext = el.getContext('2d');
  }

  sc_assert(ctx);
  sc_assert(font);
  sc_assert(typeof font === 'string');
  sc_assert(typeof str === 'string' || (str && str.constructor === String));
  ctx.font = font;
  return ctx.measureText(str);
};
