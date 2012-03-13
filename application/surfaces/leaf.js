// ==========================================================================
// Project:   Blossom - Modern, Cross-Platform Application Framework
// Copyright: ©2012 Fohr Motion Picture Studios. All rights reserved.
// License:   Licensed under the GPLv3 license (see BLOSSOM-LICENSE).
// ==========================================================================
/*globals sc_assert */

sc_require('surfaces/surface');

SC.LeafSurface = SC.Surface.extend(
  /** @scope SC.LeafSurface.prototype */ {

  isLeafSurface: true,

  // ..........................................................
  // SURFACE TREE SUPPORT
  //

  _sc_subsurfacesDidChange: function() {
    throw "An SC.LeafSurface instance does not support the 'subsurfaces' property.";
  }.observes('subsurfaces')

});
