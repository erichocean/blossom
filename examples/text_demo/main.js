// ==========================================================================
// Project:   Blossom - Modern, Cross-Platform Application Framework
// Copyright: ©2012 Fohr Motion Picture Studios. All rights reserved.
// License:   Licensed under the GPLv3 license (see BLOSSOM-LICENSE).
// ==========================================================================
/*globals TextDemo DEBUG_PSURFACES */

var text = "In olden times when wishing still helped one, there lived a king whose daughters were all beautiful; and the youngest was so beautiful that the sun itself, which has seen so much, was astonished whenever it shone in her face. Close by the king's castle lay a great dark forest, and under an old lime-tree in the forest was a well, and when the day was very warm, the king's child went out to the forest and sat down by the fountain; and when she was bored she took a golden ball, and threw it up on high and caught it; and this ball was her favorite plaything.";

var base03 = "#002b36";

DEBUG_PSURFACES = true;

function main() {
  SC.Application.create();

  var surface = SC.View.create();

  var textLayer = SC.TextLayer.create({
    layout: { top: 100, centerX: 0, width: 400, height: 10 },
    value: text,
    font: "12pt Calibri",
    textAlign: 'justify',
    lineHeight: 24
  });

  var fpsLayer = SC.TextLayer.create({
    layout: { bottom: 50, left: 50, width: 400, height: 10 },
    value: function() {
      return SC.Benchmark.fps();
    }.property(),
    font: "12pt Calibri",
    lineHeight: 28
  });

  surface.get('layers').pushObject(textLayer);
  surface.get('layers').pushObject(fpsLayer);

  SC.app.set('ui', surface);

  var draggableSurface = SC.CompositeSurface.create({
    mouseDown: function(evt) {
      // console.log('draggableSurface#mouseDown');
      this._clientX = evt.clientX;
      this._clientY = evt.clientY;
      return true;
    },

    mouseDragged: function(evt) {
      // console.log('draggableSurface#mouseDragged');
      SC.AnimationTransaction.begin({ duration: 0 });
      var frame = this.get('frame');
      frame.x = frame.x + evt.clientX - this._clientX;
      frame.y = frame.y + evt.clientY - this._clientY;
      this._clientX = evt.clientX;
      this._clientY = evt.clientY;
      SC.AnimationTransaction.end();
      return true;
    },

    mouseUp: function(evt) {
      // console.log('draggableSurface#mouseUp');
      SC.AnimationTransaction.begin({ duration: 0 });
      var frame = this.get('frame');
      frame.x = frame.x + evt.clientX - this._clientX;
      frame.y = frame.y + evt.clientY - this._clientY;
      delete this._clientX;
      delete this._clientY;
      SC.AnimationTransaction.end();
      return true;
    }
  });
  draggableSurface.set('frame', SC.MakeRect(50, 50, 400, 220));
  draggableSurface.set('backgroundColor', base03);

  var textSurface = SC.TextSurface.create({
    value: "Hello world"
  });
  textSurface.set('frame', SC.MakeRect(0, 20, 400, 200));

  draggableSurface.get('subsurfaces').pushObject(textSurface);

  SC.app.addSurface(draggableSurface);

  TextDemo.textSurface = textSurface;
}
