// ==========================================================================
// Project:   Blossom - Modern, Cross-Platform Application Framework
// Copyright: ©2012 Fohr Motion Picture Studios. All rights reserved.
// License:   Licensed under the GPLv3 license (see BLOSSOM-LICENSE).
// ==========================================================================
/*globals BLOSSOM DEBUG_PSURFACES sc_assert */

if (BLOSSOM) {

SC.ptransitionAnimations = {};

SC.PTransitionAnimation = function(key, value, duration, delay, timingFunction) {
  if (key === 'cornerRadius') {
    this.key = 'border-radius';
    this.value = value;
  } else if (key === 'isVisible') {
    this.key = 'visibility';
    this.value = value? 'visible': 'hidden';
  } else {
    this.key = key.dasherize();
    this.value = value;
  }
  this.duration = duration;
  this.delay = delay;
  this.timingFunction = timingFunction;

  return this;
};

} // BLOSSOM
