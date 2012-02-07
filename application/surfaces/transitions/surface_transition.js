// ==========================================================================
// Project:   Blossom - Modern, Cross-Platform Application Framework
// Copyright: ©2012 Fohr Motion Picture Studios. All rights reserved.
// License:   Licensed under the GPLv3 license (see BLOSSOM-LICENSE).
// ==========================================================================
/*globals BLOSSOM sc_assert */

if (BLOSSOM) {

SC.ENTER_LEFT = 'enter-left';
SC.SLIDE_FLIP_LEFT = 'slide-flip-left';
SC.EXIT_RIGHT = 'exit-right';

SC.SurfaceTransition = SC.Object.extend({

  kind: null, // one of 'order-in', 'order-out', or 'replace'

  // a surface
  from: null,

  // a surface
  to: null,

  beginTransition: function() {},

  endTransition: function() {}

});

} // BLOSSOM
