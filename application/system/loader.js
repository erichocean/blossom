// ==========================================================================
// Project:   SproutCore - JavaScript Application Framework
// Copyright: ©2006-2011 Strobe Inc. and contributors.
//            Portions ©2008-2010 Apple Inc. All rights reserved.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================

sc_require('system/browser');

SC.bundleDidLoad = function(bundle) {
  var info = this.BUNDLE_INFO[bundle] ;
  if (!info) info = this.BUNDLE_INFO[bundle] = {} ;
  info.loaded = true ;
};

SC.bundleIsLoaded = function(bundle) {
  var info = this.BUNDLE_INFO[bundle] ;
  return info ? !!info.loaded : false ;
};

SC.loadBundle = function() { throw "SC.loadBundle(): SproutCore is not loaded."; };
