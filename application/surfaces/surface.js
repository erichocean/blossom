// ==========================================================================
// Project:   Blossom - Modern, Cross-Platform Application Framework
// Copyright: ©2012 Fohr Motion Picture Studios. All rights reserved.
// License:   Licensed under the GPLv3 license (see BLOSSOM-LICENSE).
// ==========================================================================
/*globals sc_assert */

sc_require('system/responder');
sc_require('layers/layer');
sc_require('layers/layout');
sc_require('surfaces/private/psurface');
sc_require('surfaces/private/ptransition_animation');
sc_require('animations/transition');

SC.surfaceTransitions = {};
// SC.surfaceAnimations  = {};

SC.animatablePropertyBuilder = function(key, assertion) {
  var privateProperty = '_sc_'+key;
  return function(key, value) {
    // console.log('SC.Surface@%@'.fmt(key), value);
    var property = this[privateProperty];
    if (value !== undefined) {
      if (assertion) assertion(value);
      this[privateProperty] = value;

      // Determine the current transition for this property.
      var transition = this.transitionForKey? this.transitionForKey(key) : null;
      if (!transition) {
        var transitions = this.getPath('transitions');
        sc_assert(transitions === null || (typeof transitions === "object" && transitions instanceof Object));
        transition = transitions? transitions[key] : null;
      }
      if (!transition) transition = SC.Surface.transitions[key];
      sc_assert(transition, "An SC.TransitionAnimation could not be found for '%@'.".fmt(key));
      sc_assert(transition.kindOf(SC.TransitionAnimation));

      // Determine the current duration and delay values for the transition.
      var transaction = SC.AnimationTransaction.top();
      sc_assert(transaction, "No active animation transaction found, this means your code is running outside the runloop.");
      var transactionDuration = transaction.get('duration');
      var transactionDelay    = transaction.get('delay');
      var duration = transactionDuration !== null? transactionDuration : transition.get('duration');
      var delay = transactionDelay !== null? transactionDelay : transition.get('delay');

      // Create an SC.PTransitionAnimation instance and add it.
      var ptransition = new SC.PTransitionAnimation(key, value, duration, delay, transition.get('timingFunction'));
      var transitionsHash = SC.surfaceTransitions[this.__id__];
      if (!transitionsHash) transitionsHash = SC.surfaceTransitions[this.__id__] = {};
      transitionsHash[key] = ptransition;
      SC.needsRendering = true;
    } else return property;
  }.property();
};

/** @class
  `SC.Surface` is used to display content within the application's viewport.
  Each surface lives on the GPU and supports implicit, hardware-accelerated
  3D animation and transitions. Surfaces are responders, and will be
  forwarded events that occur to them by the application.

  Usually you will not work directly with the `SC.Surface` class, but with 
  one of its subclasses.  Subclasses of `SC.CompositeSurface` arrange 
  surfaces in a hierarchy, their frames are relative to their parent's frame, 
  rather than the application's viewport.

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

  Once a surface has been added to the app, it's `frame` property is used to 
  position the surface relative to the application's viewport.  The surface's 
  `isPresentInViewport` property will also be set to true.

  Removing a Surface from the Viewport
  ------------------------------------

  To remove a surface from the viewport, do:

      SC.app.removeSurface(mySurface);

  The surface's `isPresentInViewport` property will be set to false.

  A surface's underlying graphics resources are released when it is no longer 
  present in the viewport.  This occurs at the end of the run loop, so it is
  okay to remove a surface temporarily and move it somewhere else – it's
  resources will remain untouched during that time.

  If the surface consume any other resources for drawing, such as `SC.Layer` 
  instances, those resources should be released as well (`SC.Surface` cannot 
  do this for you).

  Receiving Events
  ----------------

  A surface will automatically receive any mouse events that occur on it for
  as long as it is present in the viewport.  To receive keyboard events,
  however, you must either set the surface as the app's `ui`:

      SC.app.set('ui', aSurface);

  Or, you can set the surface as the app's `inputSurface`:

      SC.app.set('inputSurface', aSurface);

  For surfaces that manage other responders, such as `SC.View`, the events 
  will be forwarded on to the appropriate responder within the surface.

  @extends SC.Responder
  @since Blossom 1.0
*/
SC.Surface = SC.Object.extend(SC.Responder, {

  isSurface: true,
  isResponderContext: true, // We can dispatch to other responders.

  concatenatedProperties: ['displayProperties'],

  // ..........................................................
  // DISPLAY PROPERTIES
  //

  /**
    You can set this array to include any properties that should cause 
    rendering to occur (this is equivalent to calling 
    `this.triggerRendering()` when one of these properties is set).

    @property {Array}
    @readOnly
  */
  displayProperties: 'backgroundColor borderColor borderWidth opacity cornerRadius zIndex perspective isVisible'.w(),

  /**
    A string that evaluates to a CSS color.  Animatable.

    @property {CSSColor}
  */
  _sc_backgroundColor: 'transparent',
  backgroundColor: SC.animatablePropertyBuilder('backgroundColor', function(value) {
    sc_assert(typeof value === 'string');
  }),

  _sc_borderColor: 'transparent',
  borderColor: SC.animatablePropertyBuilder('borderColor', function(value) {
    sc_assert(typeof value === 'string');
  }),

  _sc_borderWidth: 0,
  borderWidth: SC.animatablePropertyBuilder('borderWidth', function(value) {
    sc_assert(typeof value === 'number');
    sc_assert(value >= 0);
  }),

  _sc_opacity: 1.0, // opaque
  opacity: SC.animatablePropertyBuilder('opacity', function(value) {
    sc_assert(typeof value === 'number');
    sc_assert(value >= 0.0);
    sc_assert(value <= 1.0);
  }),

  _sc_cornerRadius: 0,
  cornerRadius: SC.animatablePropertyBuilder('cornerRadius', function(value) {
    sc_assert(typeof value === 'number');
    sc_assert(value >= 0);
  }),

  _sc_zIndex: 0,
  zIndex: SC.animatablePropertyBuilder('zIndex', function(value) {
    sc_assert(typeof value === 'number');
    sc_assert(Math.floor(value) === value); // Integers only
    // Negative numbers are allowed.
  }),

  /**
    The isVisible property determines if the view is shown in the view
    hierarchy it is a part of. A view can have isVisible == true and still have
    isVisibleInWindow == false. This occurs, for instance, when a parent view has
    isVisible == false. Default is true.

    The isVisible property is considered part of the layout and so changing it
    will trigger a layout update.

    @property {Boolean}
  */
  _sc_isVisible: true,
  isVisible: SC.animatablePropertyBuilder('isVisible', function(value) {
    sc_assert(typeof value === 'boolean');
  }),
  isVisibleBindingDefault: SC.Binding.bool(),

  _sc_perspective: 1000,
  perspective: SC.animatablePropertyBuilder('perspective', function(value) {
    sc_assert(typeof value === 'number');
    sc_assert(Math.floor(value) === value); // Integers only
  }),

  /**
    This property effectively sets the x and y position at which the viewer 
    appears to be looking at the subsurfaces of this surface.  `x` and `y` 
    values must be between -1 and 1.  Animatable.

    @property SC.Point
  */
  perspectiveOrigin: function(key, value) {
    var perspectiveOrigin = this._sc_perspectiveOrigin;
    if (value !== undefined) {
      if (!SC.IsPoint3D(value)) throw new TypeError("SC.Surface's 'perspectiveOrigin' property can only be set to an SC.Point.");
      sc_assert(value.x <=  1.0);
      sc_assert(value.x >= -1.0);
      sc_assert(value.y <=  1.0);
      sc_assert(value.y >= -1.0);
      if (value !== perspectiveOrigin) perspectiveOrigin.set(value);
      this._sc_triggerPerspectiveOriginChange();
    } else return anchorPoint;
  }.property(),

  _sc_triggerPerspectiveOriginChange: function() {
    // console.log('SC.Surface#_sc_triggerPerspectiveOriginChange());
    SC.needsRendering = true;
    this._sc_triggerStructureChange('perspectiveOrigin');
  },

  /**
    Specifies receiver's frame rectangle in the supersurface's coordinate
    space.  The value of this property is specified in points.  Animatable.

    Note: The frame does not take into account the surface's `transform`
    property, or the supersurface's `subsurfaceTransform` property. The value
    of `frame` is before these transforms have been applied.

    @property SC.Rect
  */
  frame: function(key, value) {
    // console.log('SC.Surface@frame', key, value);
    var frame = this._sc_frame;
    if (value !== undefined) {
      if (!SC.IsRect(value)) throw new TypeError("SC.Surface's 'frame' property can only be set to an SC.Rect.");

      // TODO: Probably shouldn't be altering the caller's frame here, right?
      value[0] = Math.floor(value[0]);
      value[1] = Math.floor(value[1]);
      value[2] = Math.ceil(value[2]);
      value[3] = Math.ceil(value[3]);

      // Cache the new frame so we don't need to compute it later.
      if (!SC.EqualRect(frame, value)) {
        frame.set(value);
        this._sc_triggerFrameChange('x', 'y', 'width', 'height');

        this.__contentWidth__  = frame[2]/*width*/;
        this.__contentHeight__ = frame[3]/*height*/;
        this.triggerContentSizeUpdate();
      }
    } else {
      return frame;
    }
  }.property(),

  // rasterizationScale: 1.0, // The scale at which to rasterize content, relative to the coordinate space of the layer. Animatable

  _sc_triggerFrameChange: function() {
    // console.log('SC.Surface#_sc_triggerFrameChange());
    this.triggerLayoutAndRendering();
    this._sc_triggerStructureChange('frame');
  },

  /**
    Specifies a transform applied to the surface when rendering.  Animatable.

    @property SC.Transform3D
  */
  transform: function(key, value) {
    var transform = this._sc_transform;
    if (value !== undefined) {
      if (!SC.IsTransform3D(value)) throw new TypeError("SC.Surface's 'transform' property can only be set to an SC.Transform3D.");
      if (value !== transform) transform.set(value);
      this._sc_triggerTransformChange();
    } else return transform;
  }.property(),

  _sc_triggerTransformChange: function() {
    // console.log('SC.Surface#_sc_triggerTransformChange());
    SC.needsRendering = true;
    this._sc_triggerStructureChange('transform');
  },

  /**
    Establishes the origin for transforms applied to the surface.  Animatable.

    @property SC.Point3D
  */
  transformOrigin: function(key, value) {
    var transformOrigin = this._sc_transformOrigin;
    if (value !== undefined) {
      if (!SC.IsPoint3D(value)) throw new TypeError("SC.Surface's 'transformOrigin' property can only be set to an SC.Point3D.");
      sc_assert(value.x <=  1.0);
      sc_assert(value.x >= -1.0);
      sc_assert(value.y <=  1.0);
      sc_assert(value.y >= -1.0);
      if (value !== transformOrigin) transformOrigin.set(value);
      this._sc_triggerTransformOriginChange();
    } else return transformOrigin;
  }.property(),

  _sc_triggerTransformOriginChange: function() {
    // console.log('SC.Surface#_sc_triggerTransformOriginChange());
    SC.needsRendering = true;
    this._sc_triggerStructureChange('transformOrigin');
  },

  // Shared helper.
  _sc_triggerStructureChange: function(key) {
    // Determine the current transition for this property.
    var transition = this.transitionForKey? this.transitionForKey(key) : null;
    if (!transition) {
      var transitions = this.getPath('transitions');
      sc_assert(transitions === null || (typeof transitions === "object" && transitions instanceof Object));
      transition = transitions? transitions.anchorPoint : null;
    }
    if (!transition) transition = SC.Surface.transitions[key];
    sc_assert(transition, "An SC.TransitionAnimation could not be found for '%@'.".fmt(key));
    sc_assert(transition.kindOf(SC.TransitionAnimation));

    // Determine the current duration and delay values for the transition.
    var transaction = SC.AnimationTransaction.top();
    sc_assert(transaction);
    var transactionDuration = transaction.get('duration');
    var transactionDelay    = transaction.get('delay');
    var duration = transactionDuration !== null? transactionDuration : transition.get('duration');
    var delay = transactionDelay !== null? transactionDelay : transition.get('delay');

    // Create an SC.PTransitionAnimation instance and add it.
    var ptransition = new SC.PTransitionAnimation(key, this['_sc_'+key], duration, delay, transition.get('timingFunction'));
    var transitionsHash = SC.surfaceTransitions[this.__id__];
    if (!transitionsHash) transitionsHash = SC.surfaceTransitions[this.__id__] = {};
    transitionsHash[key] = ptransition;
  },

  // ..........................................................
  // LAYOUT SUPPORT
  //

  /**
    The `layout` property describes how you want the surface to be sized and 
    positioned on the screen, relative to its supersurface, **when that 
    supersurface is an `SC.LayoutSurface` only**; otherwise, this property 
    is ignored. Set this property to `null` to disable frame layout entirely
    (`null` is the default).

    You can define the following layout properties:

    Horizontal axis (pick exactly two):
     - left: an offset from the left edge
     - right: an offset from the right edge
     - centerX: an offset from center X (may only be combined with `width`)
     - width: a width

    Vertical axis (pick exactly two):
     - top: an offset from the top edge
     - bottom: an offset from the bottom edge
     - centerY: an offset from center Y (may only be combined with `height`)
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
  */
  layout: null,

  _sc_layoutDidChange: function() {
    var layout = this.get('layout');

    if (layout === null) this._sc_layoutFunction = null;
    else this.updateLayoutRules(); // updates this._sc_layoutFunction

    this.triggerLayout();
  }.observes('layout'),

  /** @private Re-use SC.Layer's implementation. */
  updateLayoutRules: SC.Layer.prototype.updateLayoutRules,

  // ..........................................................
  // ANIMATION SUPPORT
  //

  transitions: {},

  // ..........................................................
  // VIEWPORT SUPPORT
  //

  /**
    Set to `true` when the surface is part of a surface tree that is
    currently present in the viewport; `false` otherwise.

    @property {Boolean}
    @isReadOnly
  */
  isPresentInViewport: false,

  _sc_surfaceIsPresentInViewport: function() {
    var isPresentInViewport = this.get('isPresentInViewport');
    if (isPresentInViewport) this.triggerRendering();
  }.observes('isPresentInViewport'),

  // ..........................................................
  // RESPONDER SUPPORT
  //

  surface: function() { return this; }.property(),

  // ..........................................................
  // SURFACE TREE SUPPORT
  //

  /**
    Specifies receiver's supersurface.

    @property SC.Surface
    @readOnly
  */
  _sc_supersurface: null,
  supersurface: function(key, value) {
    if (value !== undefined) {
      sc_assert(value === null || value.kindOf(SC.Surface), "SC.Surface@supersurface must either be null or an SC.Surface instance.");
      sc_assert(value? value.get('subsurfaces') !== null && value.get('subsurfaces').contains(this) : true, "The supersurface must already contain this surface in its subsurfaces array.");
      this._sc_supersurface = value;
    } else return this._sc_supersurface;
  }.property(),

  /**
    An array containing the receiver's subsurfaces, or `null` if the surface 
    does not support subsurfaces at all.

    The subsurfaces are listed in back to front order.

    @property Array or null
  */
  subsurfaces: null,

  // ..........................................................
  // LAYOUT & RENDERING SUPPORT
  //

  __needsLayout__: false,
  triggerLayout: function() {
    // console.log('SC.Surface#triggerLayout()');
    this.__needsLayout__ = true;
    SC.needsLayout = true;
  },

  // __needsRendering__: false,
  __sc_needsRendering__: false,
  triggerRendering: function() {
    // console.log('SC.Surface#triggerRendering()');
    this.__needsRendering__ = true;
    SC.needsRendering = true;
    // Also see code in _sc_notifyPropertyObservers, which should match.
  },

  triggerLayoutAndRendering: function() {
    // console.log('SC.Surface#triggerLayoutAndRendering()');
    this.__needsLayout__ = true;
    this.__needsRendering__ = true;
    SC.needsLayout = true;
    SC.needsRendering = true;
  },

  performLayoutIfNeeded: function(timestamp) {
    // console.log('SC.Surface#performLayoutIfNeeded()', SC.guidFor(this));
    var needsLayout = this.__needsLayout__,
        isVisible = this.get('isVisible');

    var benchKey = 'SC.Surface#performLayoutIfNeeded()',
        layoutKey = 'SC.Surface#performLayoutIfNeeded(): needsLayout';

    SC.Benchmark.start(benchKey);

    if (needsLayout && isVisible) {
      SC.Benchmark.start(layoutKey);
      if (this.get('isPresentInViewport')) {
        if (this.updateLayout) this.updateLayout();
        this.__needsLayout__ = false;
      } // else leave it set to true, we'll update it when it again becomes
        // visible in the viewport
      SC.Benchmark.end(layoutKey);
    }
    // else console.log('skipping layout: not needed or visible');

    SC.Benchmark.end(benchKey);

    // This code is technically only needed for composite surfaces, but for
    // performance and code reuse, we fold the implementation into here
    // instead of calling `arguments.callee.base.apply(this, arguments)` in
    // `SC.CompositeSurface`.
    var subsurfaces = this.get('subsurfaces');
    if (subsurfaces === null) return;
    for (var idx=0, len=subsurfaces.length; idx<len; ++idx) {
      subsurfaces[idx].performLayoutIfNeeded(timestamp);
    }
  },

  performRenderingIfNeeded: function(timestamp) {
    // console.log('SC.Surface#performRenderingIfNeeded()');
    var needsLayout = this.__needsLayout__,
        needsDisplay = this.__needsRendering__,
        isVisible = this.get('isVisible');

    var benchKey = 'SC.Surface#performRenderingIfNeeded()',
        displayKey = 'SC.Surface#performRenderingIfNeeded(): needsDisplay';

    SC.Benchmark.start(benchKey);

    if (needsDisplay && isVisible) {
      SC.Benchmark.start(displayKey);
      if (this.get('isPresentInViewport')) {
        if (this.updateDisplay) this.updateDisplay();
        this.__needsRendering__ = false;
      } // else leave it set to true, we'll update it when it again becomes
        // visible in the viewport
      SC.Benchmark.end(displayKey);
    }

    SC.Benchmark.end(benchKey);

    // This code is technically only needed for composite surfaces, but for
    // performance and code reuse, we fold the implementation into here
    // instead of calling `arguments.callee.base.apply(this, arguments)` in
    // `SC.CompositeSurface`.
    var subsurfaces = this.get('subsurfaces');
    if (subsurfaces === null) return;
    for (var idx=0, len=subsurfaces.length; idx<len; ++idx) {
      subsurfaces[idx].performRenderingIfNeeded(timestamp);
    }
  },

  // ..........................................................
  // KEY-VALUE CODING SUPPORT
  //

  structureDidChange: function(struct, key, member, oldvalue, newvalue) {
    // console.log('SC.Surface#structureDidChangeForKey(', key, member, oldvalue, newvalue, ')');
    if (key === 'frame' && oldvalue !== newvalue) {
      this._sc_triggerFrameChange();
      var didChange = false;
      if (member === 'width') {
        this.__contentWidth__ = newvalue;
        didChange = true;
      } else if (member === 'height') {
        this.__contentHeight__ = newvalue;
        didChange = true;
      }
      if (didChange) this.triggerContentSizeUpdate();
    }

    else if (key === 'anchorPoint'       && oldvalue !== newvalue) this._sc_triggerAnchorPointChange();
    else if (key === 'transform'         && oldvalue !== newvalue) this._sc_triggerTransformChange();
    else if (key === 'perspectiveOrigin' && oldvalue !== newvalue) this._sc_triggerPerspectiveOriginChange();

    this.notifyPropertyChange(key, this['_sc_'+key]);
  },

  // /**
  //   Returns the visible region of the receiver, in its own coordinate space.
  //
  //   The visible region is the area not clipped by the containing scroll layer.
  //
  //   @property SC.Rect
  //   @readOnly
  // */
  // visibleRect: function(key, value) {
  //   throw "No implementation for SC.Surface#get/set('visibleRect', value)";
  // }.property(),

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

  // ..........................................................
  // PSURFACE SUPPORT (Private)
  //

  __sc_element__: null,

  /** @private
    The ID to use when building CSS rules for this container surface.
  */
  id: function(key, value) {
    sc_assert(value === undefined);
    return this.__id__;
  }.property().cacheable(),

  __tagName__: 'div',

  __useContentSize__: false,

  __neverAnimate__: false,

  // These only apply to leaf surfaces, but I'm putting them here because the 
  // frame method is what updates them.
  __contentWidth__: 0,
  __contentHeight__: 0,

  __contentSizeNeedsUpdate__: false,

  triggerContentSizeUpdate: function() {
    // console.log('content size did update for surface', this.__id__);
    this.__needsRendering__ = true;
    this.__contentSizeNeedsUpdate__ = true;
    SC.needsLayout = true;
  },

  // Note: this only ever called on roots.
  updatePsurfaceTree: function(surfaces) {
    // console.log('SC.Surface#updatePsurfaceTree()');

    if (surfaces) surfaces[this.__id__] = this;

    sc_assert(!this.get('supersurface'), "SC.Surface#updatePsurfaceTree() can only be called on a root surface.");
    sc_assert(this === SC.surfaces[this.__id__], "SC.Surface#updatePsurfaceTree() can only be called on active surfaces.");

    var rootPsurface = SC.Psurface.begin(this);

    // Sanity check.
    sc_assert(rootPsurface);
    sc_assert(rootPsurface instanceof SC.Psurface);
    sc_assert(rootPsurface.id === this.__id__);

    // Only defined for composite surfaces.
    if (this.updatePsurface) this.updatePsurface(rootPsurface, surfaces);

    SC.Psurface.end(this); // Required.
  },

  /** @private */
  didCreateElement: function(el) {
    // console.log('SC.Surface#didCreateElement()', SC.guidFor(this), this.__tagName__);
    sc_assert(el);
    sc_assert(el.nodeName === this.__tagName__.toUpperCase());
    sc_assert(!document.getElementById(el.id));

    // We need to apply our initial CSS properties to the element's style, 
    // without any CSS transition logic.
    var style = el.style,
        styleProperties = SC.Surface.styleProperties,
        cssProperties = SC.Surface.cssProperties,
        vendorProperties = SC.Surface.vendorProperties,
        idx, len, key, value, cssKey, vendorKey;

    for (idx=0, len=styleProperties.length; idx<len; ++idx) {
      key = styleProperties[idx];
      value = this[key];
      cssKey = cssProperties[idx];
      vendorKey = vendorProperties[idx];

      if (key === '_sc_frame') {
        style.left   = value[0]/*x*/      + 'px';
        style.top    = value[1]/*y*/      + 'px';
        style.width  = value[2]/*width*/  + 'px';
        style.height = value[3]/*height*/ + 'px';

      } else if (key === '_sc_perspectiveOrigin') {
        style[cssKey+'-x'] = Math.floor(value[0]/*x*/ * 100)+'%';
        style[cssKey+'-y'] = Math.floor(value[1]/*y*/ * 100)+'%';
    
      } else if (key === '_sc_transformOrigin') {
        style[cssKey+'-x'] = Math.floor(value[0]/*x*/ * 100)+'%';
        style[cssKey+'-y'] = Math.floor(value[1]/*y*/ * 100)+'%';
        style[cssKey+'-z'] = Math.floor(value[2]/*z*/)+'px';
    
      } else if (key === '_sc_transform') {
        style[cssKey] = 'matrix3d('+[
          value[0] .toFixed(10) , value[1] .toFixed(10) , value[2] .toFixed(10) , value[3] .toFixed(10) ,
          value[4] .toFixed(10) , value[5] .toFixed(10) , value[6] .toFixed(10) , value[7] .toFixed(10) ,
          value[8] .toFixed(10) , value[9] .toFixed(10) , value[10].toFixed(10) , value[11].toFixed(10) ,
          value[12].toFixed(10) , value[13].toFixed(10) , value[14].toFixed(10) , value[15].toFixed(10)
        ].join(', ')+')';

      } else if (key === '_sc_isVisible') {
        style[vendorKey] = value? 'visible': 'hidden';

      } else { // The remaining properties are set directly.
        style[vendorKey] = value;
      }
    }
    // 
    // style.overflow = 'auto';
  },

  // ..........................................................
  // MISC
  //

  nextResponder: function() {
    var supersurface = this.get('supersurface');
    return supersurface? supersurface : this.get('container');
  }.property('supersurface', 'container'),

  init: function() {
    // console.log('SC.Surface#init()');
    arguments.callee.base.apply(this, arguments);

    if (!this.__id__) this.__id__ = SC.guidFor(this);

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
    // create a single ArrayBuffer up front and have all of the surface's
    // graphical structures reference it. This both reduces memory use and
    // improves memory locality, and since these structures are frequently
    // accessed together, overall performance improves too, especially during
    // critical animation loops.
    var buf = SC.MakeFloat32ArrayBuffer(35); // indicates num of floats needed

    // We want to allow a developer to specify initial properties inline,
    // but we actually need the computed properties for correct behavior.
    // The code below takes care of all this, as well as correct defaults.
    var P = this.constructor.prototype, that = this;
    function hasNonPrototypeNonComputedDefaultProperty(key) {
      return that[key] !== P[key] && that[key] && !that[key].isProperty;
    }

    if (hasNonPrototypeNonComputedDefaultProperty('frame')) {
      this._sc_frame = SC.MakeRectFromBuffer(buf, 0, this.frame);
      delete this.frame; // let the prototype shine through
    } else {
      this._sc_frame = SC.MakeRectFromBuffer(buf, 0);
    }

    if (hasNonPrototypeNonComputedDefaultProperty('transform')) {
      this._sc_transform = SC.MakeTransform3DFromBuffer(buf, 4, this.transform);
      delete this.transform; // let the prototype shine through
    } else {
      this._sc_transform = SC.MakeIdentityTransform3DFromBuffer(buf, 4);
    }

    if (hasNonPrototypeNonComputedDefaultProperty('transformOrigin')) {
      this._sc_transformOrigin = SC.MakePoint3DFromBuffer(buf, 20, this.transformOrigin);
      delete this.transformOrigin; // let the prototype shine through
    } else {
      this._sc_transformOrigin = SC.MakePoint3DFromBuffer(buf, 20, 0.5, 0.5, 0.0);
    }

    if (hasNonPrototypeNonComputedDefaultProperty('perspectiveOrigin')) {
      this._sc_perspectiveOrigin = SC.MakePointFromBuffer(buf, 23, this.perspectiveOrigin);
      delete this.perspectiveOrigin; // let the prototype shine through
    } else {
      this._sc_perspectiveOrigin = SC.MakePointFromBuffer(buf, 23, 0.5, 0.5);
    }

    SC.Surface.animatableProperties.forEach(function(key) {
      if (hasNonPrototypeNonComputedDefaultProperty(key)) {
        this['_sc_'+key] = this[key];
        delete this[key]; // let the prototype shine through
      }
    }, this);

    // Float32Array's prototype has been enhanced with custom getters and
    // setters using named property keys (x, y, width, height, m11, tx, etc.)
    // These getters and setters are kvo-compliant if we configure them to
    // be so; do that now.
    SC.Surface.OBSERVABLE_STRUCTURES.forEach(function (key) {
      var structure = that['_sc_'+key];
      sc_assert(structure.owner === undefined && structure.keyName === undefined);
      structure.owner = that;
      structure.keyName = key;
    });

    this._sc_position = SC.MakePointFromBuffer(buf, 25);
    this._sc_layoutValues = SC.MakeLayoutValuesFromBuffer(buf, 27);
    this._sc_layoutDidChange();
  },

  /**
    Finds the surface that is hit by this event, and returns its view.
  */
  targetResponderForEvent: function(evt) {
    return this;
  },

  /**
    Attempts to send the event down the responder chain for this surface.  If 
    you pass a target, this method will begin with the target and work up the 
    responder chain.  Otherwise, it will begin with the current responder 
    and walk up the chain looking for any responder that implements a handler 
    for the passed method and returns true when executed.

    @param {String} action
    @param {SC.Event} evt
    @param {SC.Responder} target
    @returns {SC.Object} object that handled the event
  */
  sendEvent: function(action, evt, target) {
    // console.log('SC.Surface#sendEvent(', action, evt, target, ')');
    var handler ;

    // Walk up the responder chain looking for a method to handle the event.
    if (!target) target = this.get('firstResponder') ;
    while(target && !target.tryToPerform(action, evt)) {

      // Even if someone tries to fill in the nextResponder on the surface, 
      // stop searching when we hit the surface.
      target = (target === this) ? null : target.get('nextResponder') ;
    }

    // If no handler was found in the responder chain, try the default
    if (!target && (target = this.get('defaultResponder'))) {
      if (typeof target === SC.T_STRING) {
        target = SC.objectForPropertyPath(target);
      }

      if (!target) target = null;
      else target = target.tryToPerform(action, evt) ? target : null ;
    }

    // If we don't have a default responder or no responders in the responder
    // chain handled the event, see if the surface itself implements the 
    // event.
    else if (!target && !(target = this.get('defaultResponder'))) {
      target = this.tryToPerform(action, evt) ? this : null ;
    }

    return evt.mouseHandler || target ;
  },

  performKeyEquivalent: function(keystring, evt) {
    var ret = false, defaultResponder = this.get('defaultResponder') ;
    if (defaultResponder) {
      // Try default responder's own performKeyEquivalent method,
      // if it has one...
      if (defaultResponder.performKeyEquivalent) {
        ret = defaultResponder.performKeyEquivalent(keystring, evt) ;
      }

      // Even if it does have one, if it doesn't handle the event, give
      // methodName-style key equivalent handling a try.
      if (!ret && defaultResponder.tryToPerform) {
        ret = defaultResponder.tryToPerform(keystring, evt) ;
      }
    }
    return ret ;
  },

  /** @private
    If the user presses the tab key and the surface does not have a first
    responder, try to give it to the next eligible responder.

    If the keyDown event reaches the surface, we can assume that no 
    responders in the responder chain, nor the default responder, handled the 
    event.
  */
  keyDown: function(evt) {
    var nextValidKeyView;

    // Handle tab key presses if we don't have a first responder already.
    if (evt.which === 9 && !this.get('firstResponder')) {
      // Cycle forwards by default, backwards if the shift key is held.
      if (evt.shiftKey) {
        nextValidKeyView = this.get('previousValidKeyView');
      } else {
        nextValidKeyView = this.get('nextValidKeyView');
      }

      if (nextValidKeyView) {
        this.set('firstResponder', nextValidKeyView);
        return true;
      }
    }

    return false;
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
  _sc_firstResponderDidChange: function() {
    var old = this._sc_firstResponder,
        cur = this.get('firstResponder'),
        isInputSurface = SC.app.get('inputSurface') === this,
        isMenuSurface = SC.app.get('menuSurface') === this;

    sc_assert(old === null || old.isResponder, "Blossom internal error: SC.Application^_sc_firstResponder is invalid.");
    sc_assert(cur === null || cur.isResponder, "SC.Surface@firstResponder must either be null or an SC.Responder instance.");

    if (old === cur) return; // Nothing to do.

    if (old && old.willLoseFirstResponderTo) {
      old.willLoseFirstResponderTo(old);
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
  applicationHasFocus: false

});

SC.AugmentBaseClassWithDisplayProperties(SC.Surface);

SC.Surface.OBSERVABLE_STRUCTURES = 'frame perspectiveOrigin transform transformOrigin'.w();

SC.Surface.transitions = {
  backgroundColor:   SC.TransitionAnimation.create(),
  borderColor:       SC.TransitionAnimation.create(),
  borderWidth:       SC.TransitionAnimation.create(),
  opacity:           SC.TransitionAnimation.create(),
  cornerRadius:      SC.TransitionAnimation.create(),
  zIndex:            SC.TransitionAnimation.create(),
  isVisible:         SC.TransitionAnimation.create(),
  frame:             SC.TransitionAnimation.create(),
  transform:         SC.TransitionAnimation.create(),
  transformOrigin:   SC.TransitionAnimation.create(),
  perspective:       SC.TransitionAnimation.create(),
  perspectiveOrigin: SC.TransitionAnimation.create()
};

SC.Surface.animatableProperties = ('backgroundColor borderColor borderWidth '+
  'opacity cornerRadius zIndex perspective isVisible').w();

// These two must line up exactly.
SC.Surface.styleProperties = ('backgroundColor borderColor borderWidth '+
  'opacity cornerRadius zIndex isVisible frame transform transformOrigin '+
  'perspective perspectiveOrigin').w().map(function(key) {
    // We add the _sc_ prefix because our _sc_didCreateElement method
    // uses these keys to directly index the private properties.
    return '_sc_'+key;
  });

SC.Surface.cssProperties = [];
SC.Surface.styleProperties.forEach(function(key) {
  if (key === '_sc_cornerRadius') {
    SC.Surface.cssProperties.push('border-radius');

  } else if (key === '_sc_isVisible') {
    SC.Surface.cssProperties.push('visibility');

  } else if ('_sc_'+key in SC.vendorProperties) {
    SC.Surface.cssProperties.push(SC.cssPrefix+key.dasherize());

  } else {
    // Need to drop the '_sc_' in front.
    SC.Surface.cssProperties.push(key.slice(4).dasherize());
  }
});

SC.Surface.vendorProperties = [];
SC.Surface.styleProperties.forEach(function(key) {
  if (key === '_sc_cornerRadius') {
    SC.Surface.vendorProperties.push('borderRadius');

  } else if (key === '_sc_isVisible') {
    SC.Surface.vendorProperties.push('visibility');

  } else if ('_sc_'+key in SC.vendorProperties) {
    SC.Surface.vendorProperties.push(SC.vendorPrefix+key.slice(0,1).toUpperCase()+key.slice(1));

  } else {
    // Need to drop the '_sc_' in front.
    SC.Surface.vendorProperties.push(key.slice(4));
  }
});

(function() {
  var p = SC.Surface.prototype;

  Object.defineProperty(p, '__needsRendering__', {
    get: function() {
      return this.__sc_needsRendering__;  
    },
    set: function(value) {
      this.__sc_needsRendering__ = value;  
    },
    enumerable: false,
    configurable: false
  });
})();
