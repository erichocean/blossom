// ==========================================================================
// Project:   SproutCore - JavaScript Application Framework
// Copyright: ©2006-2011 Strobe Inc. and contributors.
//            Portions ©2008-2010 Apple Inc. All rights reserved.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================

// These commands are used by the build tools to control load order.  On the
// client side these are a no-op.
var require = require || function require() { } ;
var sc_require = sc_require || require;
var sc_resource = sc_resource || function sc_resource() {};
sc_require('license') ;

var sc_assert = function(assertion, msg) {
  if (!assertion) throw msg || "sc_assert()";
};