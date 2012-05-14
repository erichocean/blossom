// ==========================================================================
// Project:   Blossom - Modern, Cross-Platform Application Framework
// Copyright: ©2012 Fohr Motion Picture Studios. All rights reserved.
// License:   Licensed under the GPLv3 license (see BLOSSOM-LICENSE).
// ==========================================================================
/*globals sc_assert */

sc_require('surfaces/composite');
sc_require('surfaces/view');
sc_require('layers/layer');

SC.LAYOUT_HORIZONTAL = 'sc-layout-horizontal';
SC.LAYOUT_VERTICAL = 'sc-layout-vertical';

SC.RESIZE_TOP_LEFT = 'resize-top-left';
SC.RESIZE_BOTTOM_RIGHT = 'resize-bottom-right';

/** @class

  A split surface is used to show surfaces that the user can resize or 
  collapse.  To use a split surface you need to set a `topLeftSurface`, a 
  `topLeftSurface` and, optionally, a `splitDividerLayer`.  You can also set 
  various other propertiesto control the minimum and maximum thickness 
  allowed for the surfaces.

  Example:

      SC.SplitSurface.create({

        // the left surface...
        topLeftSurface: SC.View.create({
          // surface contents
        }),
        
        // the right surface
        bottomRightSurface: SC.View.create({
          // surface contents
        })
      });

  When the user clicks and drags the split divider, it will automatically 
  resize the surfaces immediately before and after the split divider. You can 
  constrain the resizing allowed by the split surface either by setting a 
  `minThickness` and a `maxThickness` property on the surfaces themselves, or 
  by implementing the method `splitSurfaceConstrainThickness` on a delegate 
  object.
  
  In addition to resizing surface, users can also collapse surfaces by double
  clicking on the split divider.  When a surface is collapsed, its `isVisible`
  property is set to `false` and its space it removed from the view.  Double
  clicking on the divider again will restore a collapsed surface.  A user can 
  also start to drag the divider to show the collapsed surface.
  
  You can programmatically control collapsing behavior using various 
  properties on either the split surface or its child surface, and/or by 
  implementing the method `splitSurfaceCanCollapse` on the delegate object.
  
  Finally, split surfaces can lay out their child surfaces either 
  horizontally or vertically.  To choose the direction of layout, set the 
  `layoutDirection` property on the surface.
  
  @extends SC.CompositeSurface
  @since Blossom 1.0
  
  @author Charles Jolley
  @author Lawrence Pit
  @author Erich Ocean
*/
SC.SplitSurface = SC.CompositeSurface.extend(SC.DelegateSupport,
  /** @scope SC.SplitSurface.prototype */ {

  isSplitSurface: true, // Walk like a duck.

  displayProperties: ['layoutDirection'],

  /**
    delegate for controlling split view behavior.
  */
  delegate: null,

  /**
    Direction of layout.  Must be SC.LAYOUT_HORIZONTAL or SC.LAYOUT_VERTICAL.

    @property {String}
  */
  layoutDirection: SC.LAYOUT_HORIZONTAL,

  /**
    Set to false to disable collapsing for both surfaces.
  */
  canCollapseSurfaces: true,

  /*
    Configure which surface(s) you want to autoresize when this split 
    surface's frame changes.  Possible options are:

    - SC.RESIZE_BOTTOM_RIGHT (default) resizes bottomRightSurface
    - SC.RESIZE_TOP_LEFT resized topLeftSurface
  */
  autoresizeBehavior: SC.RESIZE_BOTTOM_RIGHT,

  /**
    Specifies how much space the fixed surface should use when the split 
    surface does its first layout.  A number less than one will be treated as 
    a percentage, while a number greater than one will be treated as a pixel 
    width or height.

    The thickness will be applied to the opposite surface defined by 
    autoresizeBehavior (i.e. the surface that would not change dimensions 
    when the frame changes).

    @property {Number}
  */
  defaultThickness: 0.5,

  // add default surfaces
  topLeftSurface: SC.View,

  _sc_topLeftSurfaceDidChange: function() {
    var old = this._sc_topLeftSurface,
        cur = this.get('topLeftSurface');

    if (cur && cur.isClass) {
      this.set('topLeftSurface', cur.create());
      return;
    }

    var subsurfaces = this.get('subsurfaces');
    if (old) subsurfaces.removeObject(old);

    this._sc_topLeftSurface = cur;

    if (cur) subsurfaces.pushObject(cur);

    this.triggerLayoutAndRendering();
  }.observes('topLeftSurface'),

  bottomRightSurface: SC.View,

  _sc_bottomRightSurfaceDidChange: function() {
    var old = this._sc_bottomRightSurface,
        cur = this.get('bottomRightSurface');

    if (cur && cur.isClass) {
      this.set('bottomRightSurface', cur.create());
      return;
    }

    var subsurfaces = this.get('subsurfaces');
    if (old) subsurfaces.removeObject(old);

    this._sc_bottomRightSurface = cur;

    if (cur) subsurfaces.pushObject(cur);

    this.triggerLayoutAndRendering();
  }.observes('bottomRightSurface'),

  /**
    The current thickness for the topLeftSurface
  */
  topLeftThickness: function() {
    var surface = this.get('topLeftSurface');
    return surface ? this.thicknessForSurface(surface) : 0;
  }.property('topLeftSurface').cacheable(),

  /**
    The current thickness for the bottomRightSurface
  */
  bottomRightThickness: function() {
    var surface = this.get('bottomRightSurface');
    return surface ? this.thicknessForSurface(surface) : 0;
  }.property('bottomRightSurface').cacheable(),

  /**
     The cursor to be shown over the split divider.

    @property {SC.Cursor}
  */
  dividerCursor: null,

  /**
    Used by split divider to decide if the surface can be collapsed.
  */
  canCollapseSurface: function(surface) {
    return this.invokeDelegateMethod(this.delegate, 'splitSurfaceCanCollapse', this, surface);
  },

  /**
    Returns the thickness for a given view.

    @param {SC.View} view the view to get.
    @returns the view with the width.
  */
  thicknessForSurface: function(surface) {
    var direction = this.get('layoutDirection'),
        ret = surface.get('frame');

    return (direction === SC.LAYOUT_HORIZONTAL) ? ret.width : ret.height;
  },

  _sc_updateLayoutFirstTime: true,
  updateLayout: function() {
    // console.log('SC.SplitSurface#updateLayout()', SC.guidFor(this));
    var layoutDirection = this.get('layoutDirection'),
        frame = this.get('frame'),
        splitViewThickness,
        desiredThickness = this.get('defaultThickness'),
        autoResizeBehavior = this.get('autoresizeBehavior');

    SC.AnimationTransaction.begin({ duration: 0 });

    var dividerThickness = this.get('dividerThickness');
    dividerThickness = (!SC.none(dividerThickness)) ? dividerThickness : 7;

    splitViewThickness = (layoutDirection === SC.LAYOUT_HORIZONTAL) ? frame[2]/*width*/ : frame[3]/*height*/;

    // Turn a flag on to recalculate the spliting if the desired thickness
    // is a percentage.
    if (this._sc_recalculateDivider===undefined && desiredThickness < 1) {
      this._sc_recalculateDivider = true;
    } else if (this._sc_recalculateDivider) {
      this._sc_recalculateDivider = false;
    }

    if (this._sc_updateLayoutFirstTime) {
      // console.log('setting default layout first time');
      this._sc_updateLayoutFirstTime = false;
      // If default thickness is < 1, convert from percentage to absolute.
      if (SC.none(desiredThickness) || (desiredThickness > 0 && desiredThickness < 1)) {
        desiredThickness =  Math.floor((splitViewThickness - (dividerThickness))* (desiredThickness || 0.5));
      }

      if (autoResizeBehavior === SC.RESIZE_BOTTOM_RIGHT) {
        this._sc_desiredTopLeftThickness = desiredThickness ;
      } else { // (autoResizeBehavior === SC.RESIZE_TOP_LEFT)
        this._sc_desiredTopLeftThickness =  splitViewThickness - dividerThickness - desiredThickness;
      }

      // Make sure we don't exceed our min and max values, and that collapse 
      // settings are respected.  Cached values are required by 
      // `_sc_updateTopLeftThickness()` below...
      this._sc_topLeftSurface = this.get('topLeftSurface');
      this._sc_bottomRightSurface = this.get('bottomRightSurface');
      this._sc_topLeftSurfaceThickness = this.thicknessForSurface(this.get('topLeftSurface'));
      this._sc_bottomRightThickness = this.thicknessForSurface(this.get('bottomRightSurface'));
      this._sc_dividerThickness = this.get('dividerThickness');
      this._sc_layoutDirection = this.get('layoutDirection');

      this._sc_updateTopLeftThickness(0);
    }

    var topLeftSurface = this.get('topLeftSurface'),
        bottomRightSurface = this.get('bottomRightSurface'),
        dividerLayer = this.get('dividerLayer'),
        direction = this.get('layoutDirection'),
        topLeftThickness = this._sc_desiredTopLeftThickness;

    var bottomRightThickness = splitViewThickness - dividerThickness - topLeftThickness,
        autoresizeBehavior = this.get('autoresizeBehavior'),
        layout, isCollapsed;

    // top/left surface
    isCollapsed = topLeftSurface.get('isCollapsed') || false;
    topLeftSurface.setIfChanged('isVisible', !isCollapsed);
    layout = SC.MakeRect();

    // `layout` is all zeros; only set what we need to change.
    if (direction === SC.LAYOUT_HORIZONTAL) {
      layout[3]/*height*/ = frame[3]/*height*/;
      switch (autoresizeBehavior) {
        case SC.RESIZE_TOP_LEFT:
          layout[2]/*width*/ = frame[2]/*width*/ - (bottomRightThickness + dividerThickness);
          break ;
        case SC.RESIZE_BOTTOM_RIGHT:
          layout[2]/*width*/ = topLeftThickness;
          break;
      }
    } else {
      layout[2]/*width*/ = frame[2]/*width*/;
      switch (autoresizeBehavior) {
        case SC.RESIZE_TOP_LEFT:
          layout[3]/*height*/ = frame[3]/*height*/ - (bottomRightThickness + dividerThickness);
          break;
        case SC.RESIZE_BOTTOM_RIGHT:
          layout[3]/*height*/ = topLeftThickness;
          break;
      }
    }
    topLeftSurface.set('frame', layout);

    if (dividerThickness > 0) {
      var dividerSurface = this._sc_dividerSurface;
      if (!dividerSurface) {
        dividerSurface = this.addDividerSurface();
      }
      layout.set(SC.ZERO_RECT);

      if (direction === SC.LAYOUT_HORIZONTAL) {
        layout[2]/*width*/ = dividerThickness;
        layout[3]/*height*/ = frame[3]/*height*/;
        switch (autoresizeBehavior) {
          case SC.RESIZE_TOP_LEFT:
            layout[0]/*x*/ = frame[2]/*width*/ - bottomRightThickness;
            break;
          case SC.RESIZE_BOTTOM_RIGHT:
            layout[0]/*x*/ = topLeftThickness;
            break;
        }
      } else {
        layout[2]/*width*/ = frame[2]/*width*/;
        layout[3]/*height*/ = dividerThickness;
        switch (autoresizeBehavior) {
          case SC.RESIZE_TOP_LEFT:
            layout[1]/*y*/ = frame[3]/*height*/ - bottomRightThickness;
            break;
          case SC.RESIZE_BOTTOM_RIGHT:
            layout[1]/*y*/ = topLeftThickness;
            break;
        }
      }
      dividerSurface.set('frame', layout);

    } else if (this._sc_dividerSurface) {
      this.removeDividerSurface();
    }

    // bottom/right surface
    isCollapsed = bottomRightSurface.get('isCollapsed') || false;
    bottomRightSurface.setIfChanged('isVisible', !isCollapsed);
    layout.set(SC.ZERO_RECT);

    // `layout` is all zeros; only set what we need to change.
    if (direction === SC.LAYOUT_HORIZONTAL) {
      layout[3]/*height*/ = frame[3]/*height*/;
      switch (autoresizeBehavior) {
        case SC.RESIZE_BOTTOM_RIGHT:
          layout[0]/*x*/ = topLeftThickness + dividerThickness;
          layout[2]/*width*/ = frame[2]/*width*/ - (topLeftThickness + dividerThickness);
          break;
        case SC.RESIZE_TOP_LEFT:
          layout[0]/*x*/ = frame[2]/*width*/ - bottomRightThickness;
          layout[2]/*width*/ = bottomRightThickness ;
          break;
      }
    } else {
      layout[2]/*width*/ = frame[2]/*width*/;
      switch (autoresizeBehavior) {
        case SC.RESIZE_BOTTOM_RIGHT:
          layout[1]/*y*/ = topLeftThickness + dividerThickness;
          layout[3]/*height*/ = frame[3]/*height*/ - (topLeftThickness + dividerThickness);
          break;
        case SC.RESIZE_TOP_LEFT:
          layout[1]/*y*/ = frame[3]/*height*/ - bottomRightThickness;
          layout[3]/*height*/ = bottomRightThickness;
          break;
      }
    }
    bottomRightSurface.set('frame', layout);

    this.notifyPropertyChange('topLeftThickness');
    this.notifyPropertyChange('bottomRightThickness');

    if (topLeftSurface) topLeftSurface.updateLayout();
    if (bottomRightSurface) bottomRightSurface.updateLayout();

    SC.AnimationTransaction.end();
  },

  updateDisplay: function() {
    // console.log('SC.SplitSurface#updateDisplay()', SC.guidFor(this));
    var topLeftSurface = this.get('topLeftSurface');
    if (topLeftSurface) topLeftSurface.updateDisplay();

    var bottomRightSurface = this.get('bottomRightSurface');
    if (bottomRightSurface) bottomRightSurface.updateDisplay();

    var ctx = this._sc_dividerContext;
    // Can be null when our dividerSurface has zero thickness.
    if (ctx) {
      sc_assert(document.getElementById(ctx.__sc_canvas__.id));

      ctx.save();
      this.renderDivider(ctx);
      ctx.restore();
    }
  },

  renderDivider: function(ctx) {
    // console.log('render', ctx.width, ctx.height);
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, ctx.width, ctx.height);

    ctx.strokeStyle = 'grey';
    ctx.beginPath();
    if (this.get('layoutDirection') === SC.LAYOUT_HORIZONTAL) {
      ctx.moveTo(0.5, 0);
      ctx.lineTo(0.5, ctx.height);
      ctx.moveTo(ctx.width-0.5, 0);
      ctx.lineTo(ctx.width-0.5, ctx.height);
    } else {
      ctx.moveTo(0, 0.5);
      ctx.lineTo(ctx.width, 0.5);
      ctx.moveTo(0, ctx.height - 0.5);
      ctx.lineTo(ctx.width, ctx.height - 0.5);
    }
    ctx.stroke();
  },

  /**
    Update the split surface's layout based on mouse movement.

    Call this method in the mouseDown: method of your thumb view. The split view
    will begin tracking the mouse and will update its own layout to reflect the movement 
    of the mouse. As a result, the position of your thumb view will also be updated.

    @returns {Boolean}
  */
  adjustSplitDivider: function(evt) {
    // We're not the target of the mouseDown:, so we need to capture events 
    // manually to receive them during the drag.
    SC.app.dragDidStart(this);

    // Cache for later.
    this._sc_mouseDownX = evt.pageX;
    this._sc_mouseDownY = evt.pageY;
    this._sc_topLeftSurface = this.get('topLeftSurface');
    this._sc_bottomRightSurface = this.get('bottomRightSurface');
    this._sc_topLeftSurfaceThickness = this.thicknessForSurface(this.get('topLeftSurface'));
    this._sc_bottomRightThickness = this.thicknessForSurface(this.get('bottomRightSurface'));
    this._sc_dividerThickness = this.get('dividerThickness');
    this._sc_layoutDirection = this.get('layoutDirection');

    return true;
  },

  mouseDown: function(evt) {
    return this.adjustSplitDivider(evt);
  },

  mouseDragged: function(evt) {
    // console.log('SC.SplitSurface#mouseDragged()', SC.guidFor(this));
    var offset;

    if (this._sc_layoutDirection === SC.LAYOUT_HORIZONTAL) {
      offset = evt.pageX - this._sc_mouseDownX;
    } else {
      offset = evt.pageY - this._sc_mouseDownY;
    }

    this._sc_updateTopLeftThickness(offset);
    return true;
  },

  mouseUp: function(evt) {
    return true ;
  },

  toggleCollapsedSurface: function(evt) {
    var surface = this._sc_topLeftSurface,
        isCollapsed = surface.get('isCollapsed') || false;

    if (!isCollapsed && !this.canCollapseSurface(surface)) {
      surface = this._sc_bottomRightSurface ;
      isCollapsed = surface.get('isCollapsed') || false;
      if (!isCollapsed && !this.canCollapseSurface(surface)) return false;
    }

    if (!isCollapsed) {
      // Remember thickness in it's uncollapsed state.
      this._sc_uncollapsedThickness = this.thicknessForSurface(surface);
      if (surface === this._sc_topLeftSurface) {
        this._sc_updateTopLeftThickness(this.get('topLeftThickness') * -1);
      } else {
        this._sc_updateBottomRightThickness(this.get('bottomRightThickness') * -1);
      }

      // If however the split surface decided not to collapse, clear:
      if (!surface.get('isCollapsed')) {
        this._sc_uncollapsedThickness = null;
      }
    } else {
      // uncollapse to the last thickness in it's uncollapsed state
      if (surface === this._sc_topLeftSurface) {
        this._sc_updateTopLeftThickness(this._sc_uncollapsedThickness);
      } else {
        this._sc_updateBottomRightThickness(this._sc_uncollapsedThickness);
      }
      surface._sc_uncollapsedThickness = null;
    }

    this._sc_setCursorStyle();
    return true;
  },

  /** @private */
  _sc_updateTopLeftThickness: function(offset) {
    // console.log('SC.SplitSurface#_sc_updateTopLeftThickness()', offset, this._sc_topLeftSurfaceThickness);
    var topLeftSurface = this._sc_topLeftSurface,
        bottomRightSurface = this._sc_bottomRightSurface,
        // The current thickness, not the original thickness.
        topLeftSurfaceThickness = this.thicknessForSurface(topLeftSurface), 
        bottomRightSurfaceThickness = this.thicknessForSurface(bottomRightSurface),
        minAvailable = this._sc_dividerThickness,
        maxAvailable = 0,
        proposedThickness = this._sc_topLeftSurfaceThickness + offset,
        direction = this._sc_layoutDirection,
        bottomRightCanCollapse = this.canCollapseSurface(bottomRightSurface),
        thickness = proposedThickness,
        // Constrain to thickness set on top/left.
        max = this.get('topLeftMaxThickness'),
        min = this.get('topLeftMinThickness'),
        bottomRightThickness, tlCollapseAtThickness, brCollapseAtThickness;

    if (!topLeftSurface.get('isCollapsed')) {
      maxAvailable += topLeftSurfaceThickness;
    }

    if (!bottomRightSurface.get('isCollapsed')) {
      maxAvailable += bottomRightSurfaceThickness;
    }

    if (!SC.none(max)) thickness = Math.min(max, thickness);
    if (!SC.none(min)) thickness = Math.max(min, thickness);

    // Constrain to thickness set on bottom/right.
    max = this.get('bottomRightMaxThickness');
    min = this.get('bottomRightMinThickness');
    bottomRightThickness = maxAvailable - thickness;
    if (!SC.none(max)) {
      bottomRightThickness = Math.min(max, bottomRightThickness);
    }
    if (!SC.none(min)) {
      bottomRightThickness = Math.max(min, bottomRightThickness);
    }
    thickness = maxAvailable - bottomRightThickness;

    // Constrain to thickness determined by delegate.
    thickness = this.invokeDelegateMethod(this.delegate, 'splitSurfaceConstrainThickness', this, topLeftSurface, thickness);

    // Cannot be more than what's available.
    thickness = Math.min(thickness, maxAvailable);

    // Cannot be less than zero.
    thickness = Math.max(0, thickness);

    tlCollapseAtThickness = topLeftSurface.get('collapseAtThickness');
    if (!tlCollapseAtThickness) tlCollapseAtThickness = 0;
    brCollapseAtThickness = bottomRightSurface.get('collapseAtThickness');
    brCollapseAtThickness = SC.none(brCollapseAtThickness) ? maxAvailable : (maxAvailable - brCollapseAtThickness);

    if ((proposedThickness <= tlCollapseAtThickness) && this.canCollapseSurface(topLeftSurface)) {
      // Want to collapse top/left, check if this doesn't violate the max thickness of bottom/right.
      max = bottomRightSurface.get('maxThickness');
      if (!max || (minAvailable + maxAvailable) <= max) {
        // collapse top/left view, even if it has a minThickness
        thickness = 0 ;
      }
    } else if (proposedThickness >= brCollapseAtThickness && this.canCollapseSurface(bottomRightSurface)) {
      // Want to collapse bottom/right, check if this doesn't violate the max thickness of top/left.
      max = topLeftSurface.get('maxThickness');
      if (!max || (minAvailable + maxAvailable) <= max) {
        // Collapse bottom/right view, even if it has a minThickness.
        thickness = maxAvailable;
      }
    }

    // Now apply constrained value.
    if (thickness != this.thicknessForSurface(topLeftSurface)) {
      // console.log('new thickness', thickness);
      this._sc_desiredTopLeftThickness = thickness;

      // Un-collapse if needed.
      topLeftSurface.set('isCollapsed', thickness === 0);
      bottomRightSurface.set('isCollapsed', thickness >= maxAvailable);

      // console.log('SC.SplitSurface: triggering layout and rendering');
      this.triggerLayoutAndRendering();
    }
  },

  _sc_updateBottomRightThickness: function(offset) {
    var topLeftSurface = this._sc_topLeftSurface ,
        bottomRightSurface = this._sc_bottomRightSurface,
        // The current thickness, not the original thickness.
        topLeftSurfaceThickness = this.thicknessForSurface(topLeftSurface),
        bottomRightSurfaceThickness = this.thicknessForSurface(bottomRightSurface),
        minAvailable = this._sc_dividerThickness ,
        maxAvailable = 0,
        proposedThickness = this._sc_topLeftSurfaceThickness + offset,
        direction = this._sc_layoutDirection,
        bottomRightCanCollapse = this.canCollapseSurface(bottomRightSurface),
        thickness = proposedThickness,
        // Constrain to thickness set on top/left.
        max = this.get('topLeftMaxThickness'),
        min = this.get('topLeftMinThickness'),
        bottomRightThickness, tlCollapseAtThickness, brCollapseAtThickness;

    if (!topLeftSurface.get("isCollapsed")) maxAvailable += topLeftSurfaceThickness;
    if (!bottomRightSurface.get("isCollapsed")) maxAvailable += bottomRightSurfaceThickness;

    if (!SC.none(max)) thickness = Math.min(max, thickness);
    if (!SC.none(min)) thickness = Math.max(min, thickness);

    // Constrain to thickness set on bottom/right.
    max = this.get('bottomRightMaxThickness');
    min = this.get('bottomRightMinThickness');
    bottomRightThickness = maxAvailable - thickness ;
    if (!SC.none(max)) bottomRightThickness = Math.min(max, bottomRightThickness);
    if (!SC.none(min)) bottomRightThickness = Math.max(min, bottomRightThickness);
    thickness = maxAvailable - bottomRightThickness;

    // Constrain to thickness determined by delegate.
    thickness = this.invokeDelegateMethod(this.delegate, 'splitSurfaceConstrainThickness', this, topLeftSurface, thickness);

    // Cannot be more than what's available.
    thickness = Math.min(thickness, maxAvailable);

    // Gannot be less than zero.
    thickness = Math.max(0, thickness);

    tlCollapseAtThickness = topLeftSurface.get('collapseAtThickness');
    if (!tlCollapseAtThickness) tlCollapseAtThickness = 0;
    brCollapseAtThickness = bottomRightSurface.get('collapseAtThickness');
    brCollapseAtThickness = SC.none(brCollapseAtThickness) ? maxAvailable : (maxAvailable - brCollapseAtThickness);

    if ((proposedThickness <= tlCollapseAtThickness) && this.canCollapseSurface(topLeftSurface)) {
      // Want to collapse top/left, check if this doesn't violate the max 
      // thickness of bottom/right.
      max = bottomRightSurface.get('maxThickness');
      if (!max || (minAvailable + maxAvailable) <= max) {
        // Collapse top/left view, even if it has a minThickness.
        thickness = 0;
      }
    } else if (proposedThickness >= brCollapseAtThickness && this.canCollapseSurface(bottomRightSurface)) {
      // Want to collapse bottom/right, check if this doesn't violate the max 
      // thickness of top/left.
      max = topLeftSurface.get('maxThickness');
      if (!max || (minAvailable + maxAvailable) <= max) {
        // Collapse bottom/right view, even if it has a minThickness.
        thickness = maxAvailable;
      }
    }

    // Now apply constrained value.
    if (thickness != this.thicknessForSurface(topLeftSurface)) {
      this._sc_desiredTopLeftThickness = thickness;

      // un-collapse if needed.
      topLeftSurface.set('isCollapsed', thickness === 0);
      bottomRightSurface.set('isCollapsed', thickness >= maxAvailable);

      this.triggerLayoutAndRendering();
    }
  },

  /** 
    This observes 'layoutDirection' to update the cursor style immediately
    after the value of the layoutDirection of Split view is changed

    @private 
  */
  _sc_setCursorStyle: function() {
    var topLeftSurface = this._sc_topLeftSurface,
        bottomRightSurface = this._sc_bottomRightSurface,
        dividerCursor = this.get('dividerCursor'),
        // updates the cursor of the thumb view that called 
        // mouseDownInThumbView() to reflect the status of the drag
        tlThickness = this.thicknessForSurface(topLeftSurface),
        brThickness = this.thicknessForSurface(bottomRightSurface),
        dir;

    dir = this._sc_layoutDirection = this.get('layoutDirection');

    if (topLeftSurface.get('isCollapsed') ||
        tlThickness === this.get("topLeftMinThickness") ||
        brThickness == this.get("bottomRightMaxThickness"))
    {
      dividerCursor.set('cursorStyle', dir === SC.LAYOUT_HORIZONTAL ? "e-resize" : "s-resize");

    } else if (bottomRightSurface.get('isCollapsed') ||
               tlThickness === this.get("topLeftMaxThickness") ||
               brThickness == this.get("bottomRightMinThickness"))
    {
      dividerCursor.set('cursorStyle', dir === SC.LAYOUT_HORIZONTAL ? "w-resize" : "n-resize");

    } else {
      if (SC.browser.msie) {
        dividerCursor.set('cursorStyle', dir === SC.LAYOUT_HORIZONTAL ? "e-resize" : "n-resize");
      } else {
        dividerCursor.set('cursorStyle', dir === SC.LAYOUT_HORIZONTAL ? "ew-resize" : "ns-resize");
      }
    }
  }.observes('layoutDirection'),

  /**
    (DELEGATE) Control whether a view can be collapsed.

    The default implemention returns false if the split view property
    canCollapseSurfaces is set to false or when the given view has
    property canCollapse set to false, otherwise it returns true.

    @param {SC.SplitView} splitView the split view
    @param {SC.View} view the view we want to collapse.
    @returns {Boolean} true to allow collapse.
  */
  splitSurfaceCanCollapse: function(splitSurface, surface) {
    if (!splitSurface.get('canCollapseSurfaces')) return false;
    else if (!surface.get('canCollapse')) return false;
    else return true;
  },

  /**
    (DELEGATE) Constrain a views allowed thickness.

    The default implementation allows any thickness.  The view will
    automatically constrain the view to not allow views to overflow the
    visible area.

    @param {SC.SplitView} splitView the split view
    @param {SC.View} view the view in question
    @param {Number} proposedThickness the proposed thickness.
    @returns the allowed thickness
  */
  splitSurfaceConstrainThickness: function(splitSurface, surface, proposedThickness) {
    return proposedThickness;
  },

  addDividerSurface: function() {
    var that = this, dividerSurface;

    dividerSurface = this._sc_dividerSurface = SC.LeafSurface.create({
      __tagName__: 'canvas',
      __useContentSize__: true, // we need our width and height attributes set,

      didCreateElement: function(canvas) {
        arguments.callee.base.apply(this, arguments);
        var ctx = canvas.getContext('2d');

        // Enables ctx.width and ctx.height to work.
        ctx.__sc_canvas__ = canvas;

        that._sc_dividerContext = ctx;
      },

      mouseDown: function(evt) {
        return this.get('supersurface').mouseDown(evt);
      }
    });

    this.get('subsurfaces').pushObject(dividerSurface);
    return dividerSurface;
  },

  removeDividerSurface: function() {
    var dividerSurface = this._sc_dividerSurface;
    if (dividerSurface) {
      this.get('subsurfaces').removeObject(dividerSurface);
      this._sc_dividerSurface = null;
      this._sc_dividerContext = null;
    }
  },

  init: function() {
    var dividerSurface;
    arguments.callee.base.apply(this, arguments);
    this._sc_topLeftSurfaceDidChange();
    this._sc_bottomRightSurfaceDidChange();
  }

});
