// ==========================================================================
// Project:   SproutCore - JavaScript Application Framework
// Copyright: ©2006-2011 Strobe Inc. and contributors.
//            Portions ©2008-2010 Apple Inc. All rights reserved.
//            Code within if (BLOSSOM) {} sections is ©2012 Fohr Motion 
//            Picture Studios. All rights reserved.
// License:   Most code licensed under MIT license (see SPROUTCORE-LICENSE).
//            Code within if (BLOSSOM) {} sections is under GPLv3 license
//            (see BLOSSOM-LICENSE).
// ==========================================================================
/*globals BLOSSOM */

if (BLOSSOM) {

SC.isMozilla = function() {
  var isMozilla = this._sc_isMozilla, userAgent;
  if (isMozilla === undefined) {
    userAgent = navigator.userAgent.toLowerCase();
    isMozilla = this._sc_isMozilla = (/mozilla/).test(userAgent) && !(/(compatible|webkit)/).test(userAgent);
  }
  return isMozilla;
};

} // BLOSSOM
