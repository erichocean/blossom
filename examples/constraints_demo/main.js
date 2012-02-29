// ==========================================================================
// Project:   Blossom - Modern, Cross-Platform Application Framework
// Copyright: ©2012 Fohr Motion Picture Studios. All rights reserved.
// License:   Licensed under the GPLv3 license (see BLOSSOM-LICENSE).
// ==========================================================================
/*globals QuadDemo */

sc_require('quaddemo');

var base3 =    "#fdf6e3";
var green =    "#859900";

function main() {
  // console.log('main()');
  SC.Application.create(); // Assigns itself automatically to SC.app

  var sz = SC.app.computeViewportSize();

  var qd = new QuadDemo(sz.width, sz.height);

  var surface = SC.View.create({

    updateDisplay: function() {
      // console.log('updateDisplay');
      var psurface = SC.psurfaces[this.__id__],
          canvas = psurface? psurface.__element__ : null,
          ctx = canvas? canvas.getContext('2d') : null,
          w = canvas.width, h = canvas.height;

      qd.canvas = canvas; // HACK

      // Draw background.
      ctx.fillStyle = base3;
      ctx.fillRect(0, 0, w, h);

      // Draw fps meter.
      ctx.fillStyle = green;
      ctx.font = "16pt Calibri";
      ctx.textBaseline = "middle";
      ctx.textAlign = "center";
      ctx.fillText(SC.Benchmark.fps(), w/2, h/2);

      qd.draw(ctx);
    },

    mouseDown: function(evt) {
      // console.log('mouseDown');
      this.triggerRendering();
      return qd.mousedown(evt);
    },

    mouseDragged: function(evt) {
      // console.log('mouseDragged');
      this.triggerRendering();
      return qd.mousemove(evt);
    },

    mouseUp: function(evt) {
      // console.log('mouseUp');
      var layer = this.get('layer');
      this.triggerRendering();
      return qd.mouseup(evt);
    }

  });

  SC.app.set('ui', surface);
}
