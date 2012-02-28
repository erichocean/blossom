// ==========================================================================
// Project:   Blossom - Modern, Cross-Platform Application Framework
// Copyright: ©2012 Fohr Motion Picture Studios. All rights reserved.
// License:   Licensed under the GPLv3 license (see BLOSSOM-LICENSE).
// ==========================================================================
/*globals BLOSSOM sc_assert */

if (BLOSSOM) {

SC.Animation = SC.Object.extend({

  isAnimation: true, // Walk like a duck.

  duration: 250, // in milliseconds

  delay: 0,      // in milliseconds,

  init: function() {
    arguments.callee.base.apply(this, arguments);
    sc_assert(typeof this.get('duration') === "number");
    sc_assert(this.get('duration') === Math.floor(this.get('duration'))); // Integral
    sc_assert(this.get('duration') >= 0);
    sc_assert(typeof this.get('delay') === "number");
    sc_assert(this.get('delay') === Math.floor(this.get('delay'))); // Integral
  }

});

} // BLOSSOM
