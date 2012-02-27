// ==========================================================================
// Project:   Blossom - Modern, Cross-Platform Application Framework
// Copyright: ©2012 Fohr Motion Picture Studios. All rights reserved.
// License:   Licensed under the GPLv3 license (see BLOSSOM-LICENSE).
// ==========================================================================
/*globals BLOSSOM sc_assert */

if (BLOSSOM) {

SC.Animation = SC.Object.extend({

  isAnimation: true, // Walk like a duck.

  key: null,

  duration: 250, // in milliseconds

  delay: 0       // in milliseconds

});

} // BLOSSOM
