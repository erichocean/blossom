// ==========================================================================
// Project:   Blossom - Modern, Cross-Platform Application Framework
// Copyright: ©2012 Fohr Motion Picture Studios. All rights reserved.
// License:   Licensed under the GPLv3 license (see BLOSSOM-LICENSE).
// ==========================================================================
/*globals QuadDemo */

sc_require('quaddemo');

var base3 =    "#fdf6e3";

function main() {
  SC.Application.create(); // Assigns itself automatically to SC.app

  var sz = SC.app.computeViewportSize();

  var qd = new QuadDemo(sz.width, sz.height);

  var surface = SC.View.create({

    updateDisplay: function() {
      // console.log('updateDisplay');
      var ctx = this.getPath('layer.context');

      // Draw background.
      ctx.fillStyle = base3;
      ctx.fillRect(0, 0, ctx.width, ctx.height);

      qd.draw(ctx);
    },

    mouseDown: function(evt) {
      this.set('needsDisplay', true);
      return qd.mousedown(evt);
    },

    mouseDragged: function(evt) {
      this.set('needsDisplay', true);
      return qd.mousemove(evt);
    },

    mouseUp: function(evt) {
      this.set('needsDisplay', true);
      return qd.mouseup(evt);
    }

  });

  SC.app.set('ui', surface);

  qd.canvas = surface.get('layer').__sc_element__; // HACK
}
