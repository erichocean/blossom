// ==========================================================================
// Project:   Blossom - Modern, Cross-Platform Application Framework
// Copyright: ©2012 Fohr Motion Picture Studios. All rights reserved.
// License:   Licensed under the GPLv3 license (see BLOSSOM-LICENSE).
// ==========================================================================
/*globals BLOSSOM sc_assert */

sc_require('surfaces/surface');

if (BLOSSOM) {

SC.LeafSurface = SC.Surface.extend(
  /** @scope SC.LeafSurface.prototype */ {

  isLeafSurface: true,

  triggerContentSizeUpdate: function() {
    this.__needsRendering__ = true;
    this.__contentSizeNeedsUpdate__ = true;
    SC.needsLayoutAndRendering = true;
  },

  __contentWidth__: 0,
  __contentHeight__: 0,

  __contentSizeNeedsUpdate__: false,

  // ..........................................................
  // SURFACE TREE SUPPORT
  //

  _sc_subsurfacesDidChange: function() {
    throw "An SC.LeafSurface instance does not support the 'subsurfaces' property.";
  }.observes('subsurfaces')

});

} // BLOSSOM
