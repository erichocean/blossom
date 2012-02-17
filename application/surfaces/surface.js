// ==========================================================================
// Project:   Blossom - Modern, Cross-Platform Application Framework
// Copyright: ©2012 Fohr Motion Picture Studios. All rights reserved.
// License:   Licensed under the GPLv3 license (see BLOSSOM-LICENSE).
// ==========================================================================
/*globals BLOSSOM sc_assert */

sc_require('system/responder');
sc_require('layers/layer');
sc_require('layers/layout');
sc_require('system/property_animation');

if (BLOSSOM) {

/** @class
  `SC.Surface` is used to display content within the application's viewport. 
  Each surface lives on the GPU and supports implicit, hardware-accelerated 
  3D animation and transitions. Surfaces are responders, and will be 
  forwarded events that occur to them by the application.

  Usually you will not work directly with the `SC.Surface` class, but with one
  of its subclasses.  Subclasses of `SC.CompositeSurface` arrange surfaces in 
  a hierarchy, allowing their layout to depend on their parent's position and 
  size, rather than the application's viewport.

  A surface should only consume resources when it is present in the viewport. 
  You can observe the `isPresentInViewport` property for changes; it will be 
  set to true when the surface is added to the viewport, and false when the 
  surface is removed.

  Mere presence in the viewport does not imply the surface is visibile. The 
  surface could be positioned off screen, or have its opacity set to zero, 
  or be occluded by another surface.  On the other hand, a surface that is 
  *not* present in the viewport is *never* visible.

  Adding a Surface to the Viewport
  --------------------------------

  To add a surface to the viewport, you add the surface to your app, which 
  manages the viewport for you:

     mySurface = SC.ImageSurface.create(...);
     SC.app.addSurface(mySurface);

  Once a surface has been added to the app, it will be sized and positioned 
  according to the layout you have specified relative to the application's 
  viewport.  It will then automatically resize if necessary when the 
  application's viewport changes size.

  The surface's `isPresentInViewport` property will also be set to true.

  Removing a Surface from the Viewport
  ------------------------------------

  To remove a surface from the viewport, do:

      SC.app.removeSurface(mySurface);

  The surface's `isPresentInViewport` property will also be set to false.

  A surface's underlying graphics resources are released when it is no longer 
  present in the viewport.  This occurs at the end of the run loop, so it is 
  okay to remove a surface temporarily and move it somewhere else – it's 
  resources will remain untouched during that time.

  Receiving Events
  ----------------

  A surface will automatically receive any mouse events that occur on it for 
  as long as it is present in the viewport.  To receive keyboard events, 
  however, you must either set the surface as the app's `ui`:

      SC.app.set('ui', aSurface);

  Or, you can set the surface as the app's `inputSurface`: 

      SC.app.set('inputPane', aSurface);

  For surfaces that manage other responders, such as `SC.ViewSurface`, the 
  events will be forwarded on to the appropriate responder within the surface.

  @extends SC.Responder
  @since Blossom 1.0
*/
SC.Surface = SC.Responder.extend({

  isSurface: true,
  isResponderContext: true, // We can dispatch events and actions.

  concatenatedProperties: ['displayProperties'],

  // ..........................................................
  // DISPLAY PROPERTIES
  //

  /**
    You can set this array to include any properties that should immediately
    invalidate the display.  The display will be automatically invalidated
    when one of these properties change.

    Implementation note:  `isVisible` is also effectively a display property,
    but it is not declared as such because the same effect is implemented
    inside `_sc_isVisibleDidChange()`.  This avoids having two observers on
    `isVisible`, which is:
      a.  More efficient
      b.  More correct, because we can guarantee the order of operations

    @property {Array}
    @readOnly
  */
  displayProperties: [],

  /**
    This method is invoked whenever a display property changes.  It will set
    the needsDisplay property to true.  If you need to perform additional 
    set up whenever the display changes, you can override this 
    method as well.
  */
  displayDidChange: function() {
    this.set('needsDisplay', true);
  },

  // ..........................................................
  // VISIBILITY SUPPORT
  //

  /**
    The isVisible property determines if the view is shown in the view
    hierarchy it is a part of. A view can have isVisible == YES and still have
    isVisibleInWindow == NO. This occurs, for instance, when a parent view has
    isVisible == NO. Default is YES.

    The isVisible property is considered part of the layout and so changing it
    will trigger a layout update.

    @property {Boolean}
  */
  isVisible: true,
  isVisibleBindingDefault: SC.Binding.bool(),

  _sc_isVisibleDidChange: function() {
    var el = this.__sc_element__;
    el.style.visibility = this.get('isVisible')? "visible" : "hidden";
    this.displayDidChange();
  }.observes('isVisible'),

  // ..........................................................
  // SURFACE TREE SUPPORT
  //

  /**
    Specifies receiver's supersurface.

    @property SC.Surface
    @readOnly
  */
  supersurface: function(key, value) {
    if (value !== undefined) {
      sc_assert(value === null || value.kindOf(SC.Surface), "SC.Surface@supersurface must either be null or an SC.Surface instance.");
      sc_assert(value? value.get('subsurfaces').contains(this) : true, "The supersurface must already contain this surface in its subsurfaces array.");
      this._sc_supersurface = value;
    } else return this._sc_supersurface;
  }.property(),

  /**
    An array containing the receiver's subsurfaces.

    The subsurfaces are listed in back to front order. Defaults to null.

    @property Array
  */
  subsurfaces: null,

  // ..........................................................
  // RENDERING SUPPORT
  //

  needsLayout: false,
  needsTextLayout: false,
  needsContraintSolver: false,
  needsDisplay: false,

  /** @private
    Schedules the `updateIfNeeded` method to run at the end of the runloop 
    whenever `needsDisplay`, `needsLayout`, or `needsTextLayout` are set to 
    true.
  */
  _sc_updateIfNeededObserver: function(observer, key) {
    // console.log('SC.Surface#_sc_updateIfNeededObserver()', SC.guidFor(this), key);
    if (this.get(key)) this.invokeOnce(this.updateIfNeeded);
  }.observes('needsLayout', 'needsTextLayout', 'needsConstraintSolver', 'needsDisplay'),

  /**
    Updates the surface only if the surface is visible, in the viewport, and 
    if `needsDisplay` is true.  Normally you will not invoke this method 
    directly.  Instead you'd set the `needsDisplay` property to true and this 
    method will be called once at the end of the runloop.

    If you need to update the surface sooner than the end of the runloop, you
    can call this method directly. If the surface is not even present in the 
    viewport, this method does nothing.

    You should not override this method.  Instead override updateSurface().

    @param {Boolean} ignoreVisibility
  */
  updateIfNeeded: function(ignoreVisibility) {
    // console.log('SC.Surface#updateIfNeeded()');
    SC.app.requestAnimationLoop();

    // var needsLayout = this.get('needsLayout'),
    //     needsDisplay = this.get('needsDisplay');
    // 
    // // debugger;
    // 
    // var benchKey = 'SC.Surface#updateIfNeeded()',
    //     layoutKey = 'SC.Surface#updateIfNeeded(): needsLayout',
    //     displayKey = 'SC.Surface#updateIfNeeded(): needsDisplay';
    // 
    // SC.Benchmark.start(benchKey);
    // 
    // if (needsLayout && (ignoreVisibility || this.get('isVisible'))) {
    //   SC.Benchmark.start(layoutKey);
    //   if (this.get('isPresentInViewport')) {
    //     this.updateLayout();
    //     this.set('needsLayout', false);
    //   } // else leave it set to true, we'll update it when it again becomes 
    //     // visible in the viewport
    //   SC.Benchmark.end(layoutKey);
    // }
    // 
    // if (needsDisplay && (ignoreVisibility || this.get('isVisible'))) {
    //   SC.Benchmark.start(displayKey);
    //   if (this.get('isPresentInViewport')) {
    //     this.updateDisplay();
    //     this.set('needsDisplay', false);
    //   } // else leave it set to true, we'll update it when it again becomes 
    //     // visible in the viewport
    //   SC.Benchmark.end(displayKey);
    // }
    // 
    // SC.Benchmark.end(benchKey);
  },

  updateAnimationIfNeeded: function(timestamp) {
    // console.log('SC.Surface#updateAnimationIfNeeded()');
    var needsLayout = this.get('needsLayout'),
        needsDisplay = this.get('needsDisplay'),
        isVisible = this.get('isVisible');

    // debugger;

    var benchKey = 'SC.Surface#updateAnimationIfNeeded()',
        layoutKey = 'SC.Surface#updateAnimationIfNeeded(): needsLayout',
        displayKey = 'SC.Surface#updateAnimationIfNeeded(): needsDisplay';

    SC.Benchmark.start(benchKey);

    if (needsLayout && isVisible) {
      SC.Benchmark.start(layoutKey);
      if (this.get('isPresentInViewport')) {
        this.updateLayout();
        this.set('needsLayout', false);
      } // else leave it set to true, we'll update it when it again becomes 
        // visible in the viewport
      SC.Benchmark.end(layoutKey);
    }

    if (needsDisplay && isVisible) {
      SC.Benchmark.start(displayKey);
      if (this.get('isPresentInViewport')) {
        this.updateDisplay();
        this.set('needsDisplay', false);
      } // else leave it set to true, we'll update it when it again becomes 
        // visible in the viewport
      SC.Benchmark.end(displayKey);
    }

    SC.Benchmark.end(benchKey);
  },

  updateLayout: function() {
    console.log('All SC.Surface subclasses should override updateLayout()');
  },

  updateDisplay: function() {
    console.log('All SC.Surface subclasses should override updateDisplay()');
  },

  // ..........................................................
  // VIEWPORT SUPPORT
  //

  isPresentInViewport: false,

  _sc_isPresentInViewportDidChange: function() {
    // console.log('SC.Surface#_sc_isPresentInViewportDidChange()', SC.guidFor(this));

    // Either (a) we set up our layers, or (b) we schedule them to be 
    // destroyed at the end of the run loop.
    if (this.get('isPresentInViewport')) this.createSurface();
    else this.invokeLast(this.destroySurfaceIfNeeded);
  }.observes('isPresentInViewport'),

  createSurface: function() {
    var element = this.__sc_element__, key;
    // apply the layout style manually for now...
    var layoutStyle = this.get('layoutStyle');
    // console.log(layoutStyle);
    for (key in layoutStyle) {
      if (!layoutStyle.hasOwnProperty(key)) continue;
      if (layoutStyle[key] !== null) {
        element.style[key] = layoutStyle[key];
      }
    }
  },

  destroySurfaceIfNeeded: function() {
    if (!this.get('isPresentInViewport')) this.destroySurface();
  },

  destroySurface: function() {},

  // ..........................................................
  // LAYOUT SUPPORT
  //

  /**
    The `layout` property describes how you want the layer to be sized and 
    positioned on the screen, relative to its superlayer.  You can define the 
    following layout properties:

    Horizontal axis (pick exactly two):
     - left: an offset from the left edge
     - right: an offset from the right edge
     - centerX: an offset from center X
     - width: a width

    Vertical axis (pick exactly two):
     - top: an offset from the top edge
     - bottom: an offset from the bottom edge
     - centerY: an offset from center Y
     - height: a height

    Layout rectangle constraints (all are optional):
     - minLayoutWidth: the minimum width at which to do layout on the x-axis
     - maxLayoutWidth: the maximum width at which to do layout on the x-axis
     - minLayoutHeight: the minimum height at which to do layout on the y-axis
     - maxLayoutHeight: the maximum height at which to do layout on the y-axis

    You can also specify where to position the layout rectangle relative to 
    the parent's layout rectangle when it is smaller or larger on a 
    particular axis due to layout rectangle min/max clamping:
     - position: valid strings are: "center", "top", "bottom", "left"
       "top left", "bottom left", "right", "top right", and "bottom right".

    Each of these layout properties can take either an absolute value, or a 
    percentage (with the exception of `position`, which only takes the 
    strings listed above). Percentages can be defined in one of two ways:
      - a number between -1 and 1, e.g. 0.5 or -0.2. Note that -1 and 1 are 
        not considered to be percentages; they are absolute values.
      - a string containing a number followed by the '%' character
      - for width and height only: negative numbers are not allowed

    When a negative number or percentage is given, it will specify a negative 
    offset. For example, `top: -10` offsets the layer -10 units in the y axis 
    relative to its superlayer.

    An exception is thrown when `layout` is set to an invalid value.

    Note: `centerX` may only be combined with `width`, and `centerY` may only 
    be combined with `height`.
  */
  layout: { top: 0, left: 0, bottom: 0, right: 0 },

  container: null,

  _sc_layoutDidChange: function() {
    this.updateLayoutRules(); // Lots of code, so it's put in its own file.
    this.set('surfaceNeedsLayout', true);
  }.observes('layout'),

  _sc_containerDidChange: function() {
    this.set('surfaceNeedsLayout', true);
  }.observes('container'),

  zIndex: 0,
  cornerRadius: 0,

  /**
    Defines the anchor point of the layer's bounds rectangle. Animatable.
    
    @property SC.Point
  */
  anchorPoint: function(key, value) {
    if (value !== undefined) {
      throw "No implementation for SC.Surface#set('anchorPoint', value)";
    } else return this._sc_anchorPoint;
  }.property(),

  /**
    Specifies the receiver’s position in the superlayer’s coordinate system. Animatable.

    @property SC.Point
  */
  position: function(key, value) {
    if (value !== undefined) {
      throw "No implementation for SC.Surface#set('position', value)";
    } else return this._sc_position;
  }.property(),

  surfaceNeedsLayout: true,

  /**
    Specifies the bounds rectangle of the receiver. Animatable.

    @property SC.Rect
  */
  bounds: function(key, value) {
    if (value !== undefined) {
      sc_assert(SC.IsRect(value));
      throw "No implementation for SC.Surface#set('bounds', value)";
    } else {
      if (this.get('surfaceNeedsLayout')) {
        var container = this.get('container'),
            anchorPoint = this.get('anchorPoint'),
            pbounds;

        if (container) {
          // Use the container's bounds as the parents bounds.
          pbounds = container.get('bounds');
        } else {
          // We'll get the minimum layout allowed.
          pbounds = { width: 0, height: 0 };
        }

        // This updates `position` and `bounds`.
        this._sc_layoutFunction(
            this._sc_layoutValues,
            pbounds.width, pbounds.height,
            anchorPoint[0]/*x*/, anchorPoint[1]/*y*/,
            this._sc_position,
            this._sc_bounds
          );

        this.set('surfaceNeedsLayout', false);
      }
      return this._sc_bounds;
    }
  }.property(),

  _sc_frameDidChange: function() {
    this._sc_frameIsDirty = true;
  }.observes('bounds', 'position', 'anchorPoint'),

  /**
    Specifies receiver's frame rectangle in the superlayer's coordinate space.

    The value of frame is derived from the bounds, anchorPoint and position 
    properties. When the frame is set, the receiver's position and the size 
    of the receiver's bounds are changed to match the new frame rectangle. 
    The value of this property is specified in points.

    Setting the frame _does not_ cause implicit animation to occur. If you 
    desire animation, please set the bounds and positions properties 
    directly.

    Note: The frame does not take into account the layer's transform 
    property, or the superlayer's sublayerTransform property. The value of 
    frame is before these transforms have been applied.

    Note: `frame` is not observable.

    @property SC.Rect
  */
  frame: function(key, value) {
    var frame = this._sc_frame, anchorPoint, bounds, position;
    if (value !== undefined) {
      if (!SC.IsRect(value)) throw new TypeError("SC.Surface's 'frame' property can only be set to an SC.Rect.");

      anchorPoint = this._sc_anchorPoint;
      bounds = this._sc_bounds;
      position = this._sc_position;

      // The bounds' size should have the same size as the frame. Set this 
      // first so that the position can take into account the new size.
      bounds[2]/*width*/  = value[2]/*width*/;
      bounds[3]/*height*/ = value[3]/*height*/;

      // Position is updated relative to the bounds' origin, taking into account the layer's anchorPoint.
      position[0]/*x*/ = -((-bounds[2]/*width*/  * anchorPoint[0]/*x*/ - bounds[0]/*x*/) - value[0]/*x*/);
      position[1]/*y*/ = -((-bounds[3]/*height*/ * anchorPoint[1]/*y*/ - bounds[1]/*y*/) - value[1]/*y*/);

      // Cache the new frame so we don't need to compute it later.
      frame.set(value);
      this._sc_frameIsDirty = false;
    } else {
      if (this._sc_frameIsDirty) {
        anchorPoint = this._sc_anchorPoint;
        bounds = this._sc_bounds;
        position = this._sc_position;

        // The x and y coordinates take into account the bounds, anchorPoint, and position properties.
        frame[0]/*x*/ = (-bounds[2]/*width*/  * anchorPoint[0]/*x*/ - bounds[0]/*x*/) + position[0]/*x*/;
        frame[1]/*y*/ = (-bounds[3]/*height*/ * anchorPoint[1]/*y*/ - bounds[1]/*y*/) + position[1]/*y*/;

        // The frame has the same size as the bounds.
        frame[2]/*width*/  = bounds[2]/*width*/;
        frame[3]/*height*/ = bounds[3]/*height*/;

        this._sc_frameIsDirty = false;
      }
      return SC.MakeRect(frame); // give caller a copy
    }
  }.property(),
  
  // rasterizationScale: 1.0, // The scale at which to rasterize content, relative to the coordinate space of the layer. Animatable

  /**
    Specifies a transform applied to each sublayer when rendering. Animatable.

    @property SC.AffineTransform
  */
  sublayerTransform: function(key, value) {
    if (value !== undefined) {
      throw "No implementation for SC.Surface#set('sublayerTransform', value)";
    } else return this._sc_sublayerTransform;
  }.property(),

  _sc_sublayerTransformDidChange: function() {
    if (SC.IsIdentityAffineTransform(this._sc_sublayerTransform)) {
      this._sc_hasSublayerTransform = false;
    } else this._sc_hasSublayerTransform = true; // only true when we don't have the identity transform
  }.observes('sublayerTransform'),

  /**
    Specifies a transform applied to each sublayer when rendering. Animatable.

    @property SC.AffineTransform
  */
  transform: function(key, value) {
    if (value !== undefined) {
      throw "No implementation for SC.Surface#set('transform', value)";
    } else return this._sc_transform;
  }.property(),

  /**
    Returns the visible region of the receiver, in its own coordinate space.
    
    The visible region is the area not clipped by the containing scroll layer.

    @property SC.Rect
    @readOnly
  */
  visibleRect: function(key, value) {
    throw "No implementation for SC.Surface#get/set('visibleRect', value)";
  }.property(),

  /**
    Specifies receiver's superlayer.

    @property SC.Surface
    @readOnly
  */
  container: null,

  // ..........................................................
  // DOM SUPPORT (Private, Browser-only)
  //

  __sc_element__: null,

  /* @private */
  getPath: function(path) {
    var ary = path.split('.'),
        structureKey = ary[0],
        member = ary[1];

    if (SC.Surface.OBSERVABLE_STRUCTURES.indexOf(structureKey) >= 0) {
      // Get the internal structure directly, without using .get().
      return this['_sc_'+structureKey][member];
    } else return arguments.callee.base.apply(this, arguments);
  },

  /* @private */
  setPath: function(path, value) {
    var ary = path.split('.'),
        structureKey = ary[0],
        member = ary[1];

    if (SC.Surface.OBSERVABLE_STRUCTURES.indexOf(structureKey) >= 0) {
      // Set the internal structure directly, without using .set().
      this['_sc_'+structureKey][member] = value;
    } else arguments.callee.base.apply(this, arguments);
  },

  structureDidChange: function(struct, key, member, oldvalue, newvalue) {
    // console.log('SC.Surface#structureDidChangeForKey(', key, member, oldvalue, newvalue, ')');
    this.notifyPropertyChange(key, this['_sc_'+key]);
  },

  /** @private
    The ID to use when building CSS rules for this container surface.
  */
  id: function(key, value) {
    if (value) this._sc_id = value;
    if (this._sc_id) return this._sc_id;
    return SC.guidFor(this) ;
  }.property().cacheable(),

  /** @private Overriden by subclasses as needed. */
  initElement: function() {
    // Use the element we're given; otherwise, create one.
    var el = this.__sc_element__, id;
    if (!el) {
      el = this.__sc_element__ = document.createElement('div');
      id = el.id = this.get('id');
    } else {
      id = el.id;
      if (id) this.set('id', id);
      else el.id = this.get('id')
    }

    // el.className = ['sc-pane', this.get('transitionsStyle')].join(' ');
    // el.style.boxShadow = "0px 4px 14px rgba(0, 0, 0, 0.61)";
    // el.style.webkitTransform = "translateZ(0)";
    // el.style.webkitTransform = "rotateY(45deg)";

    this.foo = el;

    // HACK: Make sure SproutCore can find this surface.
    SC.View.views[id] = this;
  },

  init: function() {
    arguments.callee.base.apply(this, arguments);
    this.initElement();
    this.displayDidChange();

    this.pane = this; // Needed so that our childViews can get our "pane".

    if (SC.app) {
      this.__sc_needFirstResponderInit__ = false;
      this._sc_firstResponderDidChange();
    } else {
      // This flag instructs SC.app to execute our 
      // `_sc_firstResponderDidChange` method when we are first added to the 
      // app's set of surfaces.
      this.__sc_needFirstResponderInit__ = true;
    }

    // Allocate our own structures to modify in-place. For performance, we 
    // create a single ArrayBuffer up front and have all of the layer's 
    // graphical structures reference it. This both reduces memory use and 
    // improves memory locality, and since these structures are frequently 
    // accessed together, overall performance improves too, especially during
    // critical animation loops.
    var buf = SC.MakeFloat32ArrayBuffer(58); // indicates num of floats needed

    // We want to allow a developer to specify initial properties inline,
    // but we actually need the computed properties for correct behavior.
    // The code below takes care of all this, as well as correct defaults.
    var P = this.constructor.prototype;
    function hasNonPrototypeNonComputedDefaultProperty(key) {
      return this[key] !== P[key] && this[key] && !this[key].isProperty;
    }

    // The various SC.Make*FromBuffer functions all validate their arguments.
    if (hasNonPrototypeNonComputedDefaultProperty('bounds')) {
      this._sc_bounds = SC.MakeRectFromBuffer(buf, 0, this.bounds);
      delete this.bounds; // let the prototype shine through
    } else {
      this._sc_bounds = SC.MakeRectFromBuffer(buf, 0);
    }

    if (hasNonPrototypeNonComputedDefaultProperty('position')) {
      this._sc_position = SC.MakePointFromBuffer(buf, 4, this.position);
      delete this.position; // let the prototype shine through
    } else {
      this._sc_position = SC.MakePointFromBuffer(buf, 4);
    }

    if (hasNonPrototypeNonComputedDefaultProperty('anchorPoint')) {
      this._sc_anchorPoint = SC.MakePointFromBuffer(buf, 6, this.anchorPoint);
      delete this.anchorPoint; // let the prototype shine through
    } else {
      this._sc_anchorPoint = SC.MakePointFromBuffer(buf, 6, 0.5, 0.5);
    }

    if (hasNonPrototypeNonComputedDefaultProperty('transform')) {
      this._sc_transform = SC.MakeIdentityAffineTransformFromBuffer(buf, 8, this.transform);
      delete this.transform; // let the prototype shine through
    } else {
      this._sc_transform = SC.MakeIdentityAffineTransformFromBuffer(buf, 8);
    }

    if (hasNonPrototypeNonComputedDefaultProperty('sublayerTransform')) {
      this._sc_sublayerTransform = SC.MakeIdentityAffineTransformFromBuffer(buf, 14, this.sublayerTransform);
      delete this.sublayerTransform; // let the prototype shine through
      if (SC.IsIdentityAffineTransform(this._sc_sublayerTransform)) {
        this._sc_hasSublayerTransform = false;
      } else this._sc_hasSublayerTransform = true; // only true when we don't have the identity transform
    } else {
      this._sc_sublayerTransform = SC.MakeIdentityAffineTransformFromBuffer(buf, 14);
      this._sc_hasSublayerTransform = false;
    }

    // Float32Array's prototype has been enhanced with custom getters and 
    // setters using named property keys (x, y, width, height, m11, tx, etc.)
    // These getters and setters are kvo-compliant if we configure them to
    // be so; do that now.
    var that = this;
    SC.Layer.OBSERVABLE_STRUCTURES.forEach(function (key) {
      var structure = that['_sc_'+key];
      sc_assert(structure.owner === undefined && structure.keyName === undefined);
      structure.owner = that;
      structure.keyName = key;
    });

    this._sc_frame = SC.MakeRectFromBuffer(buf, 20);
    this._sc_frameIsDirty = true; // force re-compute on get('frame')

    this._sc_transformFromSuperlayerToLayer = SC.MakeIdentityAffineTransformFromBuffer(buf, 24);
    this._sc_transformFromLayerToSuperlayer = SC.MakeIdentityAffineTransformFromBuffer(buf, 30);
    this._sc_transformFromSuperlayerToLayerIsDirty = this._sc_transformFromLayerToSuperlayerIsDirty = true; // force re-compute

    // This is used by various methods for temporary computations.
    this._sc_tmpTransform = SC.MakeAffineTransformFromBuffer(buf, 36);
    this._sc_tmpPoint = SC.MakePointFromBuffer(buf, 42);
    this._sc_tmpPoint2 = SC.MakePointFromBuffer(buf, 44);
    this._sc_tmpRect = SC.MakeRectFromBuffer(buf, 46);

    // This is used by layout functions, which know the meaning of the sixteen
    // indices in the context of a particular layout function.
    this._sc_layoutValues = SC.MakeLayoutValuesFromBuffer(buf, 50);
    this._sc_layoutDidChange();

    this.invokeOnce(this.updateIfNeeded);
  },

  /* @private
    This method computes the accumulated transform from this layer's 
    coordinate system to it's superlayer's coordinate system, taking into 
    account all properties of this layer and this layer's superlayer that 
    go into that accumulated transform. The 
    _sc_computeTransformFromSuperlayerToLayer() method computes the inverse.

    This transform is used internally by the various convert*FromLayer() 
    methods to transform points, sizes and rects in this layer's coordinate 
    system to their equivalent values in the layer's superlayer's coordinate 
    system.

    Here are the properties that go into this computation:
      - from this layer: anchorPoint, bounds, position, transform
      - from this layer's superlayer: sublayerTransform
  */
  _sc_computeTransformFromLayerToSuperlayer: function() {
    // Assume our callers have checked to determine if we should be called.
    // if (!this._sc_transformFromLayerToSuperlayerIsDirty) return;
    sc_assert(this._sc_transformFromLayerToSuperlayerIsDirty);

    // _sc_transformFromSuperlayerToLayer is just the inverse of _sc_transformFromLayerToSuperlayer. 
    // Make sure it's ready to be inverted first.
    if (this._sc_transformFromSuperlayerToLayerIsDirty) this._sc_computeTransformFromSuperlayerToLayer();

    // Actually do the inverse transform now.
    SC.AffineTransformInvertTo(this._sc_transformFromSuperlayerToLayer, this._sc_transformFromLayerToSuperlayer);

    this._sc_transformFromLayerToSuperlayerIsDirty = false;
  },

  _sc_computeTransformFromSuperlayerToLayer: function() {
    // Assume our callers have checked to determine if we should be called.
    // if (!this._sc_transformFromSuperlayerToLayerIsDirty) return;
    sc_assert(this._sc_transformFromSuperlayerToLayerIsDirty);

    // This implementation is designed to prevent any memory allocations.
    var anchorPoint = this._sc_anchorPoint,
        bounds = this._sc_bounds,
        position = this._sc_position,
        superlayer = this._sc_superlayer,
        transform = this._sc_transform,
        computedAnchorPoint = this._sc_tmpPoint,
        transformedAnchorPoint = this._sc_tmpPoint2,
        transformFromSuperlayer = this._sc_transformFromSuperlayerToLayer;

    // Our `transformFromSuperlayer` starts out as just our `transform`. 
    // Later, we'll adjust it to account for `anchorPoint` and `position`.
    SC.CopyAffineTransformTo(transform, transformFromSuperlayer);

    // Calculate the computed anchor point within `bounds`.
    computedAnchorPoint[0]/*x*/ = bounds[0]/*x*/ + (bounds[2]/*width*/  * anchorPoint[0]/*x*/);
    computedAnchorPoint[1]/*y*/ = bounds[1]/*y*/ + (bounds[3]/*height*/ * anchorPoint[1]/*y*/);

    // Find the new location of our anchorPoint, post-transformation.
    SC.PointApplyAffineTransformTo(computedAnchorPoint, transformFromSuperlayer, transformedAnchorPoint);

    // Adjust the co-ordinate system's origin so that (0,0) is at `bounds`' 
    // origin, taking into account `anchorPoint` and `position`, as well as 
    // how `transform` modified the actual location of `anchorPoint`.
    transformFromSuperlayer[4]/*tx*/ = position[0]/*x*/ - computedAnchorPoint[0]/*x*/ + (computedAnchorPoint[0]/*x*/ - transformedAnchorPoint[0]/*x*/);
    transformFromSuperlayer[5]/*ty*/ = position[1]/*y*/ - computedAnchorPoint[1]/*y*/ + (computedAnchorPoint[1]/*y*/ - transformedAnchorPoint[1]/*y*/);

    // Our superlayer can apply a sublayerTransform before we are drawn. 
    // Pre-concatenate that to the transform so far if it exists.
    if (superlayer && superlayer._sc_hasSublayerTransform) {
      SC.AffineTransformConcatTo(superlayer._sc_sublayerTransform, transformFromSuperlayer, transformFromSuperlayer);
    }

    this._sc_transformFromSuperlayerToLayerIsDirty = false;
  },

  /**
    Converts a point from the specified layer's coordinate system into the 
    receiver's coordinate system and places the result in dest.
    
    @param point the point to convert
    @param layer the layer coordinate system to convert from
    @param dest where to put the resulting point
  */
  convertPointFromLayerTo: function(point, layer, dest) {
    var tmpTransform = this._sc_tmpTransform;
    SC.Layer.computeLayerTransformTo(layer, this, tmpTransform);
    SC.PointApplyAffineTransformTo(point, tmpTransform, dest);
  },

  /**
    Converts a point from the receiver's coordinate system to the specified 
    layer's coordinate system and places the result in dest.

    @param point the point to convert
    @param layer the layer coordinate system to convert to
    @param dest where to put the resulting point
  */
  convertPointToLayerTo: function(point, layer, dest) {
    var tmpTransform = this._sc_tmpTransform;
    SC.Layer.computeLayerTransformTo(this, layer, tmpTransform);
    SC.PointApplyAffineTransformTo(point, tmpTransform, dest);
  },

  /**
    Converts a rectangle from the specified layer's coordinate system into 
    the receiver's coordinate system and places the result in dest.

    @param rect the rect to convert
    @param layer the layer coordinate system to convert from
    @param dest where to put the resulting rect
  */
  convertRectFromLayerTo: function(rect, layer, dest) {
    var tmpTransform = this._sc_tmpTransform;
    SC.Layer.computeLayerTransformTo(layer, this, tmpTransform);
    SC.RectApplyAffineTransformTo(rect, tmpTransform, dest);
  },

  /**
    Converts a rectangle from the receiver's coordinate system to the 
    specified layer's coordinate system and places the result in dest.

    @param rect the rect to convert
    @param layer the layer coordinate system to convert to
    @param dest where to put the resulting rect
  */
  convertRectToLayerTo: function(rect, layer, dest) {
    var tmpTransform = this._sc_tmpTransform;
    SC.Layer.computeLayerTransformTo(this, layer, tmpTransform);
    SC.RectApplyAffineTransformTo(rect, tmpTransform, dest);
  },

  // ..........................................................
  // ANIMATION SUPPORT
  //

  transitions: {},

  transitionsStyle: function() {
    // create a unique style rule and add it to the shared cursor style sheet
    var transitionStyle = this._transitionStyle;

    if (!transitionStyle) {
      var transitions = this.get('transitions') || {},
          properties = [] ,
          durations = [],
          timingFunctions = [],
          delays = [],
          ss = SC.PropertyAnimation.sharedStyleSheet();

      this._transitionStyle = transitionStyle = SC.guidFor(this);

      for (var key in transitions) {
        var transition = transitions[key];
        if (transition && transition.isPropertyAnimation) {
          properties.push(key);
          durations.push(transition.get('duration'));
          timingFunctions.push(transition.get('timingFunction'));
          delays.push(transition.get('delay'));
        }
      }

      var propertyRule = '-webkit-transition-property: '+properties.join(', '),
          durationRule = '-webkit-transition-duration: '+durations.join(', '),
          timingFunctionRule = '-webkit-transition-timing-function: '+timingFunctions.join(', '),
          delayRule = '-webkit-transition-delay: '+delays.join(', '),
          rule = [propertyRule, durationRule, timingFunctionRule, delayRule].join(';\n');

      // console.log(rule);
      if (ss.insertRule) { // WC3
        // console.log('WC3: adding rule');
        ss.insertRule(
          '.'+transitionStyle+' { '+rule+'; }',
          ss.cssRules ? ss.cssRules.length : 0
        ) ;
      } else if (ss.addRule) { // IE
        // console.log('IE: adding rule');
        ss.addRule('.'+transitionStyle, rule) ;
      }
    }

    return transitionStyle ;
  }.property(),

  top: function(key, value) {
    var container, top;
    if (value !== undefined) {
      container = this.get('container');
      container.style.top = value;
      top = this._sc_top = value;
    } else {
      top = this._sc_top;
      if (!top) {
        container = this.get('container');
        top = this._sc_top = container.style.top;
      }
    }
    return top;
  }.property(),

  left: function(key, value) {
    var container, left;
    if (value !== undefined) {
      container = this.get('container');
      container.style.left = value;
      left = this._sc_left = value;
    } else {
      left = this._sc_left;
      if (!left) {
        container = this.get('container');
        left = this._sc_left = container.style.left;
      }
    }
    return left;
  }.property(),

  opacity: function(key, value) {
    var container, opacity;
    if (value !== undefined) {
      container = this.get('container');
      container.style.opacity = value;
      opacity = this._sc_opacity = value;
    } else {
      opacity = this._sc_opacity;
      if (!opacity) {
        container = this.get('container');
        opacity = this._sc_opacity = container.style.opacity;
      }
    }
    return opacity;
  }.property(),

  mousePosition: null,

  updateMousePositionWithEvent: function(evt) {
    var containerPos = this.computeContainerPosition(),
        mouseX = evt.clientX - containerPos.left + window.pageXOffset,
        mouseY = evt.clientY - containerPos.top + window.pageYOffset,
        ret = { x: mouseX, y: mouseY };

    this.set('mousePosition', ret);
    return ret;
  },

  computeContainerPosition: function() {
    var el = this.__sc_element__,
        top = 0, left = 0;

    while (el && el.tagName != "BODY") {
      top += el.offsetTop;
      left += el.offsetLeft;
      el = el.offsetParent;
    }

    return { top: top, left: left };
  },

  /**
    Finds the layer that is hit by this event, and returns its view.
  */
  targetViewForEvent: function(evt) {
    return this;
  },

  /**
    Invoked by the application whenever the viewport resizes, and the surface 
    is part of the application.  This should simply begin the process of 
    notifying children that the viewport size has changed.

    @param {SC.Size} size the new viewport size
  */
  // viewportSizeDidChange: function(size) {},

  /**
    Attempts to send the event down the responder chain for this pane.  If you 
    pass a target, this method will begin with the target and work up the 
    responder chain.  Otherwise, it will begin with the current rr 
    and walk up the chain looking for any responder that implements a handler 
    for the passed method and returns YES when executed.

    @param {String} action
    @param {SC.Event} evt
    @param {Object} target
    @returns {Object} object that handled the event
  */
  sendEvent: function(action, evt, target) {
    // console.log('SC.Surface#sendEvent(', action, evt, target, ')');
    var handler ;

    // walk up the responder chain looking for a method to handle the event
    if (!target) target = this.get('firstResponder') ;
    while(target && !target.tryToPerform(action, evt)) {

      // even if someone tries to fill in the nextResponder on the pane, stop
      // searching when we hit the pane.
      target = (target === this) ? null : target.get('nextResponder') ;
    }

    // if no handler was found in the responder chain, try the default
    if (!target && (target = this.get('defaultResponder'))) {
      if (typeof target === SC.T_STRING) {
        target = SC.objectForPropertyPath(target);
      }

      if (!target) target = null;
      else target = target.tryToPerform(action, evt) ? target : null ;
    }

    // if we don't have a default responder or no responders in the responder
    // chain handled the event, see if the pane itself implements the event
    else if (!target && !(target = this.get('defaultResponder'))) {
      target = this.tryToPerform(action, evt) ? this : null ;
    }

    return evt.mouseHandler || target ;
  },

  performKeyEquivalent: function(keystring, evt) {
    var ret = arguments.callee.base.apply(this, arguments); // try normal view behavior first
    if (!ret) {
      var defaultResponder = this.get('defaultResponder') ;
      if (defaultResponder) {
        // try default responder's own performKeyEquivalent method,
        // if it has one...
        if (defaultResponder.performKeyEquivalent) {
          ret = defaultResponder.performKeyEquivalent(keystring, evt) ;
        }

        // even if it does have one, if it doesn't handle the event, give
        // methodName-style key equivalent handling a try
        if (!ret && defaultResponder.tryToPerform) {
          ret = defaultResponder.tryToPerform(keystring, evt) ;
        }
      }
    }
    return ret ;
  },

  /** @private
    If the user presses the tab key and the pane does not have a first
    responder, try to give it to the next eligible responder.

    If the keyDown event reaches the pane, we can assume that no responders in
    the responder chain, nor the default responder, handled the event.
  */
  keyDown: function(evt) {
    var nextValidKeyView;

    // Handle tab key presses if we don't have a first responder already
    if (evt.which === 9 && !this.get('firstResponder')) {
      // Cycle forwards by default, backwards if the shift key is held
      if (evt.shiftKey) {
        nextValidKeyView = this.get('previousValidKeyView');
      } else {
        nextValidKeyView = this.get('nextValidKeyView');
      }

      if (nextValidKeyView) {
        this.set('firstResponder', nextValidKeyView);
        return YES;
      }
    }

    return NO;
  },

  // .......................................................
  // RESPONDER MANAGEMENT
  //

  /**
    The first responder.  This is the first responder that should receive 
    action events.  Whenever you click on a responder, it will usually become 
    `firstResponder`.  You can also make a responder first with code:

        theResponder.becomeFirstResponder();

    If this surface is also assigned as the `SC.app@inputSurface`, the 
    `firstResponder` will have it's `isInputResponder` property set to true.

    @property {SC.Responder}
    @isReadOnly
  */
  firstResponder: null,

  /**
    Makes the passed responder into the new `firstResponder` for this 
    surface.  This will cause the current `firstResponder` to lose its 
    first responder status and possibly its input responder status as well.

    @param {SC.Responder} responder
  */
  _sc_firstResponder: null, // Note: Required, we're strict about null checking.
  _sc_firstResponderDidChange: function(responder) {
    var old = this._sc_firstResponder,
        cur = this.get('firstResponder'),
        isInputSurface = SC.app.get('inputSurface') === this,
        isMenuSurface = SC.app.get('menuSurface') === this;

    sc_assert(old === null || old.kindOf(SC.Responder), "Blossom internal error: SC.Application^_sc_firstResponder is invalid.");
    sc_assert(cur === null || cur.kindOf(SC.Responder), "SC.Surface@firstResponder must either be null or an SC.Responder instance.");

    if (old === cur) return; // Nothing to do.

    if (old && old.willLoseFirstResponderTo) {
      old.willLoseFirstResponderTo(responder);
    }

    if (isInputSurface) {
      if (old && old.willLoseInputResponderTo) {
        old.willLoseInputResponderTo(cur);
      }
      if (cur && cur.willBecomeInputResponderFrom) {
        cur.willBecomeInputResponderFrom(old);
      }
    }

    if (isMenuSurface) {
      if (old && old.willLoseMenuResponderTo) {
        old.willLoseMenuResponderTo(cur);
      }
      if (cur && cur.willBecomeMenuResponderFrom) {
        cur.willBecomeMenuResponderFrom(old);
      }
    }

    if (old) {
      old.beginPropertyChanges();
      old.set('isFirstResponder', false);
      old.set('isInputResponder', false);
      old.set('isMenuResponder',  false);
      old.endPropertyChanges();
    }

    if (cur) {
      cur.beginPropertyChanges();
      cur.set('isMenuResponder',  isMenuSurface);
      cur.set('isInputResponder', isInputSurface);
      cur.set('isFirstResponder', true);
      cur.endPropertyChanges();
    }

    if (isMenuSurface) {
      if (cur && cur.didBecomeMenuResponderFrom) {
        cur.didBecomeMenuResponderFrom(old);
      }
      if (old && old.didLoseMenuResponderTo) {
        old.didLoseMenuResponderTo(cur);
      }
    }

    if (isInputSurface) {
      if (cur && cur.didBecomeInputResponderFrom) {
        cur.didBecomeInputResponderFrom(old);
      }
      if (old && old.didLoseInputResponderTo) {
        old.didLoseInputResponderTo(cur);
      }
    }

    if (cur && cur.didBecomeFirstResponderFrom) {
      cur.didBecomeFirstResponderFrom(old);
    }
  }.observes('firstResponder'),

  didBecomeInputSurfaceFrom: function(surface) {
    sc_assert(SC.app.get('inputSurface') === this);
    this._sc_triggerFirstResponderNotificationsFor('Become', 'Input');
  },

  didLoseInputSurfaceTo: function(surface) {
    sc_assert(SC.app.get('inputSurface') !== this);
    this._sc_triggerFirstResponderNotificationsFor('Lose', 'Input');
  },

  didBecomeMenuSurfaceFrom: function(surface) {
    sc_assert(SC.app.get('menuSurface') === this);
    this._sc_triggerFirstResponderNotificationsFor('Become', 'Menu');
  },

  didLoseMenuSurfaceTo: function(surface) {
    sc_assert(SC.app.get('menuSurface') !== this);
    this._sc_triggerFirstResponderNotificationsFor('Lose', 'Menu');
  },

  _sc_triggerFirstResponderNotificationsFor: function(type, property) {
    var firstResponder = this.get('firstResponder'), key;
    if (firstResponder) {
      key = 'will'+type+property+'ResponderTo';
      if (firstResponder[key]) firstResponder[key](null);

      firstResponder.set('is'+property+'Responder', type === 'Become'? true : false);

      key = 'did'+type+property+'ResponderTo';
      if (firstResponder[key]) firstResponder[key](null);
    }
  },

  // .......................................................
  // APPLICATION FOCUS & BLUR SUPPORT
  //

  /**
    This property is maintained by SC.Application.  You can monitor it for 
    changes if your surface needs to react to application focus/blur events.

    @type Boolean
  */
  applicationHasFocus: false,

  // /**
  //   The SC.Layer subclass to instantiate to create this view's layer.
  // 
  //   @property {SC.Layer}
  // */
  // layerClass: SC.Layer,
  // 
  // layer: function(key, value) {
  //   sc_assert(value === undefined); // We're read only.
  //   return this._sc_layer;
  // }.property(),
  // 
  // hitTestLayer: function(key, value) {
  //   sc_assert(value === undefined); // We're read only.
  //   return this._sc_hitTestLayer;
  // }.property(),
  // 
  // containerId: function(key, value) {
  //   if (value) this._containerId = value;
  //   if (this._containerId) return this._containerId;
  //   return SC.guidFor(this) ;
  // }.property().cacheable(),

  // createLayersForContainer: function(container, width, height) {
  //   if (this._sc_didCreateLayers) return;
  //   this._sc_didCreateLayers = true;
  // 
  //   // SC.Pane only has two layers `layer` and `hitTestLayer`.
  //   var K = this.get('layerClass');
  //   sc_assert(K && K.kindOf(SC.Layer));
  // 
  //   // We want to allow the developer to provide a layout hash on the view, 
  //   // or to override the 'layout' computed property.
  //   if (this.hasOwnProperty('layout')) {
  //     // It's still possible that layout is a computed property. Don't use 
  //     // `get()` to find out!
  //     var layout = this.layout;
  //     if (typeof layout === "object") {
  //       // We assume `layout` is a layout hash. The layer will throw an 
  //       // exception if `layout` is invalid -- don't test for that here.
  //       this._sc_layer = K.create({
  //         layout: layout,
  //         owner: this, // TODO: Do we need owner here?
  //         container: container,
  //         delegate: this
  //       });
  //       this._sc_hitTestLayer = K.create({
  //         layout: layout,
  //         isHitTestOnly: true,
  //         owner: this, // TODO: Do we need owner here?
  //         container: container,
  //         delegate: this
  //       });
  //     } else {
  //       this._sc_layer = K.create({
  //         // `layout` is whatever the default on SC.Layer is
  //         owner: this, // TODO: Do we need owner here?
  //         container: container,
  //         delegate: this
  //       });
  //       this._sc_hitTestLayer = K.create({
  //         // `layout` is whatever the default on SC.Layer is
  //         isHitTestOnly: true,
  //         owner: this, // TODO: Do we need owner here?
  //         container: container,
  //         delegate: this
  //       });
  //     }
  // 
  //     // Only delete layout if it is not a computed property. This allows 
  //     // the computed property on the prototype to shine through.
  //     if (typeof layout !== "function" || !layout.isProperty) {
  //       // console.log('deleting layout');
  //       delete this.layout;
  //     }
  //   } else {
  //     this._sc_layer = K.create({
  //       // `layout` is whatever the default on SC.Layer is
  //       owner: this, // TODO: Do we need owner here?
  //       container: container,
  //       delegate: this
  //     });
  //     this._sc_hitTestLayer = K.create({
  //       // `layout` is whatever the default on SC.Layer is
  //       isHitTestOnly: true,
  //       owner: this, // TODO: Do we need owner here?
  //       container: container,
  //       delegate: this
  //     });
  //   }
  // 
  //   this.notifyPropertyChange('layer');
  //   this.notifyPropertyChange('hitTestLayer');
  // },

//   container: function(key, element) {
//     if (element !== undefined) {
//       this._pane_container = element ;
//     } else {
//       element = this._pane_container;
//       if (!element) {
//         this._pane_container = element = document.createElement('div');
//         element.id = this.get('containerId');
//         element.className = ['sc-pane', this.get('transitionsStyle')].join(' ');
// //        element.style.boxShadow = "0px 4px 14px rgba(0, 0, 0, 0.61)";
//         // element.style.webkitTransform = "translateZ(0)";
//         element.style.webkitTransform = "rotateY(45deg)";
// 
//         // apply the layout style manually for now...
//         // var layoutStyle = this.get('layoutStyle');
//         // for (key in layoutStyle) {
//         //   if (!layoutStyle.hasOwnProperty(key)) continue;
//         //   if (layoutStyle[key] !== null) {
//         //     element.style[key] = layoutStyle[key];
//         //   }
//         // }
// 
//         // Make sure SproutCore can find this view.
//         SC.View.views[this.get('containerId')] = this;
//       }
//     }
//     return element ;
//   }.property(),

  didAttach: function() {
    // var container = this.get('container');
    // 
    // // Okay, the order here is very important; otherwise, the layers will 
    // // not know their correct size.
    // 
    // this.createLayersForContainer(container);
    // this.render(this.getPath('layer.context'), true);
    // 
    // container = null; // avoid memory leak
  },

  didDetach: function() {
    // console.log('Implement me! Destroy layers...');
  },

  render: function(context) {},

  // ...........................................
  // LAYOUT SUPPORT
  //

  /** FIXME: Remove this method.
    layoutStyle describes the current styles to be written to your element
    based on the layout you defined.  Both layoutStyle and frame reset when
    you edit the layout property.  Both are read only.

    Computes the layout style settings needed for the current anchor.

    @property {Hash}
    @readOnly
  */
  layoutStyle: function() {
    var layout = this.get('layout'), ret = {}, pdim = null, error,
        AUTO = SC.LAYOUT_AUTO,
        dims = SC._VIEW_DEFAULT_DIMS, loc = dims.length, x, value, key,
        stLayout = this.get('useStaticLayout'),
        lR = layout.right,
        lL = layout.left,
        lT = layout.top,
        lB = layout.bottom,
        lW = layout.width,
        lH = layout.height,
        lMW = layout.maxWidth,
        lMH = layout.maxHeight,
        lcX = layout.centerX,
        lcY = layout.centerY,
        hasAcceleratedLayer = this.get('hasAcceleratedLayer'),
        translateTop = 0,
        translateLeft = 0;
    if (lW !== undefined && lW === SC.LAYOUT_AUTO && !stLayout) {
      error= SC.Error.desc("%@.layout() you cannot use width:auto if "+
              "staticLayout is disabled".fmt(this),"%@".fmt(this),-1);
      // console.error(error.toString()) ;
      throw error ;
    }

    if (lH !== undefined && lH === SC.LAYOUT_AUTO && !stLayout) {
      error = SC.Error.desc("%@.layout() you cannot use height:auto if "+
                "staticLayout is disabled".fmt(this),"%@".fmt(this),-1);
      // console.error(error.toString()) ;
      throw error ;
    }

    // X DIRECTION

    // handle left aligned and left/right
    if (!SC.none(lL)) {
      if(SC.isPercentage(lL)) {
        ret.left = (lL*100)+"%";  //percentage left
      } else if (hasAcceleratedLayer && !SC.empty(lW)) {
        translateLeft = Math.floor(lL);
        ret.left = 0;
      } else {
        ret.left = Math.floor(lL); //px left
      }
      ret.marginLeft = 0 ;

      if (lW !== undefined) {
        if(lW === SC.LAYOUT_AUTO) ret.width = SC.LAYOUT_AUTO ;
        else if(SC.isPercentage(lW)) ret.width = (lW*100)+"%"; //percentage width
        else ret.width = Math.floor(lW) ; //px width
        ret.right = null ;
      } else {
        ret.width = null ;
        if(lR && SC.isPercentage(lR)) ret.right = (lR*100)+"%"; //percentage right
        else ret.right = Math.floor(lR || 0) ; //px right
      }

    // handle right aligned
    } else if (!SC.none(lR)) {
      if(SC.isPercentage(lR)) {
        ret.right = Math.floor(lR*100)+"%";  //percentage left
      }else{
        ret.right = Math.floor(lR) ;
      }
      ret.marginLeft = 0 ;

      if (SC.none(lW)) {
        if (SC.none(lMW)) ret.left = 0;
        ret.width = null;
      } else {
        ret.left = null ;
        if(lW === SC.LAYOUT_AUTO) ret.width = SC.LAYOUT_AUTO ;
        else if(lW && SC.isPercentage(lW)) ret.width = (lW*100)+"%" ; //percentage width
        else ret.width = Math.floor(lW || 0) ; //px width
      }

    // handle centered
    } else if (!SC.none(lcX)) {
      ret.left = "50%";
      if(lW && SC.isPercentage(lW)) ret.width = (lW*100)+"%" ; //percentage width
      else ret.width = Math.floor(lW || 0) ;
      if(lW && SC.isPercentage(lW) && (SC.isPercentage(lcX) || SC.isPercentage(lcX*-1))){
        ret.marginLeft = Math.floor((lcX - lW/2)*100)+"%" ;
      }else if(lW && lW >= 1 && !SC.isPercentage(lcX)){
        ret.marginLeft = Math.floor(lcX - ret.width/2) ;
      }else {
        // This error message happens whenever width is not set.
        // console.warn("You have to set width and centerX usign both percentages or pixels");
        ret.marginLeft = "50%";
      }
      ret.right = null ;

    // if width defined, assume top/left of zero
    } else if (!SC.none(lW)) {
      ret.left =  0;
      ret.right = null;
      if(lW === SC.LAYOUT_AUTO) ret.width = SC.LAYOUT_AUTO ;
      else if(SC.isPercentage(lW)) ret.width = (lW*100)+"%";
      else ret.width = Math.floor(lW);
      ret.marginLeft = 0;

    // fallback, full width.
    } else {
      ret.left = 0;
      ret.right = 0;
      ret.width = null ;
      ret.marginLeft= 0;
    }


    // handle min/max
    ret.minWidth = (layout.minWidth === undefined) ? null : layout.minWidth ;
    ret.maxWidth = (layout.maxWidth === undefined) ? null : layout.maxWidth ;

    // Y DIRECTION

    // handle top aligned and left/right
    if (!SC.none(lT)) {
      if(SC.isPercentage(lT)) {
        ret.top = (lT*100)+"%";
      } else if (hasAcceleratedLayer && !SC.empty(lH)) {
        translateTop = Math.floor(lT);
        ret.top = 0;
      } else {
        ret.top = Math.floor(lT);
      }
      if (lH !== undefined) {
        if(lH === SC.LAYOUT_AUTO) ret.height = SC.LAYOUT_AUTO ;
        else if(SC.isPercentage(lH)) ret.height = (lH*100)+"%" ;
        else ret.height = Math.floor(lH) ;
        ret.bottom = null ;
      } else {
        ret.height = null ;
        if(lB && SC.isPercentage(lB)) ret.bottom = (lB*100)+"%" ;
        else ret.bottom = Math.floor(lB || 0) ;
      }
      ret.marginTop = 0 ;

    // handle bottom aligned
    } else if (!SC.none(lB)) {
      ret.marginTop = 0 ;
      if(SC.isPercentage(lB)) ret.bottom = (lB*100)+"%";
      else ret.bottom = Math.floor(lB) ;
      if (SC.none(lH)) {
        if (SC.none(lMH)) ret.top = 0;
        ret.height = null ;
      } else {
        ret.top = null ;
        if(lH === SC.LAYOUT_AUTO) ret.height = SC.LAYOUT_AUTO ;
        else if(lH && SC.isPercentage(lH)) ret.height = (lH*100)+"%" ;
        else ret.height = Math.floor(lH || 0) ;
      }

    // handle centered
    } else if (!SC.none(lcY)) {
      ret.top = "50%";
      ret.bottom = null ;

      if(lH && SC.isPercentage(lH)) ret.height = (lH*100)+ "%" ;
      else ret.height = Math.floor(lH || 0) ;

      if(lH && SC.isPercentage(lH) && (SC.isPercentage(lcY) || SC.isPercentage(lcY*-1))){ //height is percentage and lcy too
        ret.marginTop = Math.floor((lcY - lH/2)*100)+"%" ;
      }else if(lH && lH >= 1 && !SC.isPercentage(lcY)){
        ret.marginTop = Math.floor(lcY - ret.height/2) ;
      }else {
        // console.warn("You have to set height and centerY to use both percentages or pixels");
        ret.marginTop = "50%";
      }
    } else if (!SC.none(lH)) {
      ret.top = 0;
      ret.bottom = null;
      if(lH === SC.LAYOUT_AUTO) ret.height = SC.LAYOUT_AUTO ;
      else if(lH && SC.isPercentage(lH)) ret.height = (lH*100)+"%" ;
      else ret.height = Math.floor(lH || 0) ;
      ret.marginTop = 0;

    // fallback, full width.
    } else {
      ret.top = 0;
      ret.bottom = 0;
      ret.height = null ;
      ret.marginTop= 0;
    }

    // handle min/max
    ret.minHeight = (layout.minHeight === undefined) ?
      null :
      layout.minHeight ;
    ret.maxHeight = (layout.maxHeight === undefined) ?
      null :
      layout.maxHeight ;

    // if zIndex is set, use it.  otherwise let default shine through
    ret.zIndex = SC.none(layout.zIndex) ? null : layout.zIndex.toString();

    // if backgroundPosition is set, use it.
    // otherwise let default shine through
    ret.backgroundPosition = SC.none(layout.backgroundPosition) ?
      null :
      layout.backgroundPosition.toString() ;

    // set default values to null to allow built-in CSS to shine through
    // currently applies only to marginLeft & marginTop
    while(--loc >=0) {
      x = dims[loc];
      if (ret[x]===0) ret[x]=null;
    }

    if (hasAcceleratedLayer) {
      var transform = 'translateX('+translateLeft+'px) translateY('+translateTop+'px)';
      if (SC.platform.supportsCSS3DTransforms) transform += ' translateZ(0px)'
      ret[SC.platform.domCSSPrefix+'Transform'] = transform;
    }

    // convert any numbers into a number + "px".
    for(key in ret) {
      value = ret[key];
      if (typeof value === SC.T_NUMBER) ret[key] = (value + "px");
    }
    return ret ;
  }.property().cacheable()

});

SC.Surface.OBSERVABLE_STRUCTURES = 'bounds position anchorPoint transform sublayerTransform'.w();

SC.Surface.computeLayerTransformTo = function(fromLayer, toLayer, dest) {
  var ary, idx, layer;

  SC.SetIdentityAffineTransform(dest);

  if (fromLayer) {
    layer = fromLayer;
    while (layer && layer !== toLayer) {
      // layer._sc_transformFromLayerToSuperlayer isn't recomputed immediately. Check to
      // see if we need to recompute it now.
      if (layer._sc_transformFromLayerToSuperlayerIsDirty) layer._sc_computeTransformFromLayerToSuperlayer();
      SC.AffineTransformConcatTo(dest, layer._sc_transformFromLayerToSuperlayer, dest);
      layer = layer._sc_superlayer;
    }

    if (!toLayer || layer === toLayer) return ; // EARLY EXIT <===============
  }

  // Gather layers _up_ the tree, so we can apply their transforms in reverse 
  // (down the tree). TODO: Remove this array allocation and use the layers 
  // as a linked list.
  ary = []; layer = toLayer;
  while (layer) {
    ary.push(layer);
    layer = layer._sc_superlayer;
  }

  idx = ary.length;
  while (idx--) {
    layer = ary[idx];
    // layer._sc_transformFromSuperlayerToLayer isn't recomputed immediately. Check to
    // see if we need to recompute it now.
    if (layer._sc_transformFromSuperlayerToLayerIsDirty) layer._sc_computeTransformFromSuperlayerToLayer();
    SC.AffineTransformConcatTo(dest, layer._sc_transformFromSuperlayerToLayer, dest);
  }
};

SC.Surface.prototype.updateLayoutRules = SC.Layer.prototype.updateLayoutRules;

} // BLOSSOM
