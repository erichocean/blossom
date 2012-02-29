// ==========================================================================
// Project:   Blossom - Modern, Cross-Platform Application Framework
// Copyright: ©2012 Fohr Motion Picture Studios. All rights reserved.
// License:   Licensed under the GPLv3 license (see BLOSSOM-LICENSE).
// ==========================================================================
/*globals TextDemo */

var text = "In olden times when wishing still helped one, there lived a king whose daughters were all beautiful; and the youngest was so beautiful that the sun itself, which has seen so much, was astonished whenever it shone in her face. Close by the king's castle lay a great dark forest, and under an old lime-tree in the forest was a well, and when the day was very warm, the king's child went out to the forest and sat down by the fountain; and when she was bored she took a golden ball, and threw it up on high and caught it; and this ball was her favorite plaything.";

function main() {
  SC.Application.create();

  var surface = SC.View.create();

  var textLayer = SC.TextLayer.create({
    layout: { top: 100, centerX: 0, width: 400, height: 10 },
    value: text,
    font: "12pt Calibri",
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
}
