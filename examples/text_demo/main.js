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
    layout: { top: 100, left: 100, width: 300, height: 50 },
    value: text,
    lineHeight: 32
  });

  surface.get('layers').pushObject(textLayer);

  SC.app.set('ui', surface);
}
