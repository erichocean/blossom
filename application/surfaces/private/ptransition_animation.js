// ==========================================================================
// Project:   Blossom - Modern, Cross-Platform Application Framework
// Copyright: ©2012 Fohr Motion Picture Studios. All rights reserved.
// License:   Licensed under the GPLv3 license (see BLOSSOM-LICENSE).
// ==========================================================================
/*globals BLOSSOM DEBUG_PSURFACES sc_assert */

SC.ptransitionAnimations = {};

SC.webkitProperties = {
  perspective: true,
  perspectiveOrigin: true,
  transform: true,
  transformOrigin: true
};

SC.PTransitionAnimation = function(key, value, duration, delay, timingFunction) {
  if (key === 'cornerRadius') {
    this.cssKey = 'border-radius';
    this.value = value;

  } else if (key === 'isVisible') {
    this.cssKey = 'visibility';
    this.value = value? 'visible': 'hidden';

  } else if (key in SC.webkitProperties) {
    this.cssKey = '-webkit-'+key.dasherize();
    this.value = value;

  } else {
    this.cssKey = key.dasherize();
    this.value = value;
  }

  this.duration = duration;
  this.delay = delay;
  this.timingFunction = timingFunction;

  return this;
};
