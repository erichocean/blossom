// ==========================================================================
// Project:   Blossom - Modern, Cross-Platform Application Framework
// Copyright: ©2012 Fohr Motion Picture Studios. All rights reserved.
// License:   Licensed under the GPLv3 license (see BLOSSOM-LICENSE).
// ==========================================================================
/*global BulletTest */

sc_require('bullet');

function main() {
  var stage = SC.StagePane.create({
    layout: { top: 20, left: 20, width: 600, height: 600 },
    containerId: 'container'
  });

  stage.attach(); // Must currently attach *before* adding shapes.

  BulletTest.bulletExample(stage);
}