// ==========================================================================
// Project:   Blossom - Modern, Cross-Platform Application Framework
// Copyright: ©2012 Fohr Motion Picture Studios. All rights reserved.
// License:   Licensed under the GPLv3 license (see BLOSSOM-LICENSE).
// ==========================================================================
/*globals sc_assert */

sc_require('surfaces/composite');

SC.LayoutSurface = SC.CompositeSurface.extend(
  /** @scope SC.LayoutSurface.prototype */ {

  isLayoutSurface: true,

  updateLayout: function() {
    // console.log('SC.LayoutSurface#updateLayout()');
    var subsurfaces = this.get('subsurfaces'),
        frame = this._sc_frame,
        width = frame[2]/*width*/,
        height = frame[3]/*height*/,
        subsurface, layoutFunction,
        position;

    for (var idx=0, len=subsurfaces.length; idx<len; ++idx) {
      subsurface = subsurfaces[idx];
      layoutFunction = subsurface._sc_layoutFunction;

      if (layoutFunction) {
        position = subsurface._sc_position;
        frame = subsurface._sc_frame;

        layoutFunction(
          subsurface._sc_layoutValues,
          width, height,
          0, 0, // Force the `anchorPoint` to the top left.
          position,
          frame
        );

        // SC.Layer's layout code (which we're reusing here) won't update the 
        // origin of `frame`, so we need to apply the `position` value to the 
        // origin of `frame`. 
        frame[0]/*x*/ = position[0]/*x*/;
        frame[1]/*y*/ = position[1]/*y*/;
      }
    }
  },

  updateDisplay: SC.K

});
