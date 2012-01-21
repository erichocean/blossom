// ==========================================================================
// Project:   Blossom - Modern, Cross-Platform Application Framework
// Copyright: ©2012 Fohr Motion Picture Studios. All rights reserved.
// License:   Licensed under the GPLv3 license (see BLOSSOM-LICENSE).
// ==========================================================================
/*global BlossomTest */

sc_require('clipdrag');
sc_require('tooltip');
sc_require('physics');
sc_require('color');
sc_require('stress');
sc_require('drag');

function main() {
  var stage = SC.StagePane.create({
    layout: { top: 20, left: 20, width: 600, height: 600 },
    containerId: 'container'
  });

  stage.attach(); // Must currently attach *before* adding shapes.

  // BlossomTest.clipDragExample(stage);
  // BlossomTest.tooltipExample(stage);
  BlossomTest.curvesExample(stage);
  // BlossomTest.physicsExample(stage);
  // BlossomTest.colorExample(stage);
  // BlossomTest.stressExample(stage);
  // BlossomTest.dragExample(stage);
}