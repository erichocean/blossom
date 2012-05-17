// ==========================================================================
// Project:   Blossom - Modern, Cross-Platform Application Framework
// Copyright: ©2012 Fohr Motion Picture Studios. All rights reserved.
// License:   Licensed under the GPLv3 license (see BLOSSOM-LICENSE).
// ==========================================================================
/*globals BLOSSOM DEBUG_PSURFACES sc_assert */

sc_require('system/browser');

SC.ptransitionAnimations = {};

if (SC.isIE()) {
  console.log("Blossom has detected Internet Explorer.");
  SC.vendorPrefix = 'ms';
  SC.cssPrefix = '-ms-';
} else if (SC.isMozilla()) {
  console.log("Blossom has detected FireFox/Mozilla.");
  SC.vendorPrefix = 'Moz';
  SC.cssPrefix = '-moz-';
} else { // assume WebKit otherwise
  console.log("Blossom has detected WebKit/Safari/Chrome.");
  SC.vendorPrefix = 'webkit';
  SC.cssPrefix = '-webkit-';
}

SC.vendorProperties = {
  perspective: true,
  perspectiveOrigin: true,
  transform: true,
  transformOrigin: true
};

SC.PTransitionAnimation = function(key, value, duration, delay, timingFunction) {
  if (key === 'cornerRadius') {
    this.vendorKey = 'borderRadius';
    this.cssKey = 'border-radius';
    this.value = value;

  } else if (key === 'isVisible') {
    this.vendorKey = 'visibility';
    this.cssKey = 'visibility';
    this.value = value? 'visible': 'hidden';

  } else if (key in SC.vendorProperties) {
    this.vendorKey = SC.vendorPrefix+key.slice(0,1).toUpperCase()+key.slice(1);
    this.cssKey = SC.cssPrefix+key.dasherize();
    this.value = value;

  } else {
    this.vendorKey = key;
    this.cssKey = key.dasherize();
    this.value = value;
  }

  this.duration = duration;
  this.delay = delay;
  this.timingFunction = timingFunction;

  return this;
};
