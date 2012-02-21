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
      var ctx = this.getPath('layer.context');

      // Draw background.
      ctx.fillStyle = base3;
      ctx.fillRect(0, 0, ctx.width, ctx.height);

      // Draw fps meter.
      ctx.fillStyle = green;
      ctx.font = "16pt Calibri";
      ctx.textBaseline = "middle";
      ctx.textAlign = "center";
      ctx.fillText(SC.Benchmark.fps(), ctx.width/2, ctx.height/2);

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
      layer.set('foo', true);

      s.get('subsurfaces').objectAt(1).set('subsurfaces', []);

      this.triggerRendering();
      return qd.mouseup(evt);
    }

  });

  SC.app.set('ui', surface);

  qd.canvas = surface.get('layer').__sc_element__; // HACK

  // SC.CompositeSurface.create().updatePsurfaceTree();
  // console.log('*****');

  var s  = SC.ContainerSurface.create(),
      s2 = SC.ContainerSurface.create(),
      s3 = SC.ContainerSurface.create();
    
  s2.get('subsurfaces').push(SC.View.create(), SC.View.create(), SC.View.create());
  s3.get('subsurfaces').push(SC.View.create(), s2, SC.View.create());
  s.get('subsurfaces') .push(SC.View.create(), s3, SC.View.create());

  SC.app.get('surfaces').add(s);

  // console.log('*****');
  // SC.CompositeSurface.create().updatePsurfaceTree();
}
