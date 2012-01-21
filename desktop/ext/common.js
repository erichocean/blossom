// ==========================================================================
// Project:   SproutCore Plugin Architecture
// Copyright: ©2012 xTuple. All rights reserved.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================

// These are common objects/items used by plugins.
SC.DEFAULT_NAME             = "default-name";
SC.LEFT_TO_RIGHT            = "left-to-right"; 
SC.RIGHT_TO_LEFT            = "right-to-left"; 
SC.DEFAULT_TOP_PADDING      = 75;
SC.DEFAULT_BOTTOM_PADDING   = 75;
SC.DEFAULT_VIEW             = "defaultView";

// FIXME: This is really tightly bound to what Postbooks is doing.
SC._baseFrameBinding = function(target) {
  var bind;

  // if possible, reuse the binding so as not to create an
  // infinite number of them as plugins (or other?) are swapped
  // in and out
  if (target._basePaneFrameBinding && target._basePaneFrameBinding.isBinding) {
    bind = target._basePaneFrameBinding;
  } else {
    bind = SC.Binding
      .from("SC.BASE_PANE.frame")
      .to("_basePaneFrame", target)
      .oneWay();
  }
  bind
    .sync()
    .connect()
    .flushPendingChanges();
  return bind;
} ;
