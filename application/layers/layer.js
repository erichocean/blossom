// ==========================================================================
// Project:   Blossom - Modern, Cross-Platform Application Framework
// Copyright: ©2012 Fohr Motion Picture Studios. All rights reserved.
// License:   Licensed under the GPLv3 license (see BLOSSOM-LICENSE).
// ==========================================================================
/*globals CanvasRenderingContext2D HTMLCanvasElement
  ENFORCE_BLOSSOM_2DCONTEXT_API sc_assert */

sc_require('system/matrix');
sc_require('ext/browser');
sc_require('ext/float32');

SC.Layer = SC.Object.extend({

  isLayer: true, // Walk like a duck.

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
  displayProperties: ['isVisible'],

  view: function() {
    var view = this.get('view'),
        superlayer = view? null : this.get('superlayer');

    while (superlayer && !view) {
      view = superlayer.get('view');
      superlayer = superlayer.get('superlayer');
    }

    sc_assert(view === null || view.kindOf(SC.View));
    return view;
  },

  // ..........................................................
  // VISIBILITY SUPPORT
  //

  /**
    The isVisible property determines if the view is shown in the view
    hierarchy it is a part of. A view can have isVisible == true and still have
    isVisibleInWindow == false. This occurs, for instance, when a parent view has
    isVisible == false. Default is true.

    The isVisible property is considered part of the layout and so changing it
    will trigger a layout update.

    @property {Boolean}
  */
  isVisible: true,
  isVisibleBindingDefault: SC.Binding.bool(),

  // ..........................................................
  // RENDERING SUPPORT
  //

  __needsTextLayout__: false,

  __needsLayout__: false,
  triggerLayout: function() {
    // console.log('SC.Layer#triggerLayout()');
    this.__needsLayout__ = true;
    this.__needsTextLayout__ = true;
    if (this.get('surface')) SC.needsLayout = true;
  },

  __needsRendering__: false,
  triggerRendering: function() {
    // console.log('SC.Layer#triggerRendering()');
    this.__needsRendering__ = true;
    if (this.get('surface')) SC.needsRendering = true;
  },

  triggerLayoutAndRendering: function() {
    // console.log('SC.Layer#triggerLayoutAndRendering()');
    this.__needsLayout__ = true;
    this.__needsRendering__ = true;
    this.__needsTextLayout__ = true;
    if (this.get('surface')) SC.needsLayout = SC.needsRendering = true;
  },

  updateLayout: function() {
    // console.log('SC.Layer#updateLayout()', SC.guidFor(this));
    if (this.__needsLayout__) {
      var bounds = this.get('bounds'), // Sets this.__needsLayout__ to false.
          canvas = this.__sc_element__;

      canvas.width = bounds.width;
      canvas.height = bounds.height;
      this._sc_transformFromSuperlayerToLayerIsDirty = true; // HACK
      this._sc_computeTransformFromSuperlayerToLayer();
    }

    this.get('sublayers').invoke('updateLayout');
  },

  updateDisplay: function() {
    // console.log('SC.Layer#updateDisplay()', SC.guidFor(this));
    var benchKey = 'SC.Layer#updateDisplay()';
    SC.Benchmark.start(benchKey);

    var ctx = this.get('context');

    if (this.__needsRendering__) {
      ctx.save();
      this.display(ctx);
      ctx.restore();
      this.__needsRendering__ = false;
    }
    this.get('sublayers').invoke('updateDisplay');

    SC.Benchmark.end(benchKey);
  },

  display: function(ctx) {
    var benchKey = 'SC.Layer#display()';
    SC.Benchmark.start(benchKey);

    // console.log('SC.Layer#display()', SC.guidFor(this));
    var delegate = this.get('delegate');
    if (delegate && delegate.render) delegate.render(ctx, this);
    else this.render(ctx);

    SC.Benchmark.end(benchKey);
  },

  render: function(ctx) {},

  copyIntoContext: function(ctx) {
    // console.log('SC.Layer#copyIntoContext()', SC.guidFor(this));
    var t = this._sc_transformFromSuperlayerToLayer;

    if (!this.get('isVisible')) return;

    ctx.save();
    sc_assert(Math.round(t[4]) === t[4]);
    sc_assert(Math.round(t[5]) === t[5]);
    // console.log(t[0], t[1], t[2], t[3], t[4], t[5]);
    ctx.transform(t[0], t[1], t[2], t[3], t[4], t[5]);
    ctx.drawLayer(this, 0, 0);
    this.get('sublayers').invoke('copyIntoContext', ctx);
    ctx.restore();
  },

  // ..........................................................
  // SURFACE SUPPORT
  //

  /**
    The current surface this layer is a child of (may be null).
    @property {SC.Surface}
  */
  surface: null,

  _sc_surface: null,
  _sc_surfaceDidChange: function() {
    // console.log('SC.Layer#_sc_surfaceDidChange()');
    var old = this._sc_surface,
        cur = this.get('surface'),
        sublayers = this.get('sublayers'),
        len = sublayers.length, idx;

    sc_assert(old === null || old.kindOf(SC.Surface), "Blossom internal error: SC.View^_sc_surface is invalid.");
    sc_assert(cur === null || cur.kindOf(SC.Surface), "SC.View@surface must either be null or an SC.Surface instance.");

    if (old === cur) return; // Nothing to do.

    this._sc_surface = cur;

    for (idx=0; idx<len; ++idx) {
      sublayers[idx].set('surface', cur);
    }

    if (cur) {
      this.triggerLayout();

      // If we already needed layout, then the above line won't cause our 
      // observer to fire.  Force our layout to be updated, but keep the 
      // previous line, because the surface will check for true there to 
      // determine if layout *really* needs to be done.
      cur.triggerLayout();
    }
  }.observes('surface'),

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

  _sc_layoutDidChange: function() {
    this.updateLayoutRules(); // Lots of code, so it's put in its own file.
    this.triggerLayout();
  }.observes('layout'),

  zIndex: 0,
  cornerRadius: 0,

  /**
    Defines the anchor point of the layer's bounds rectangle. Animatable.
    
    @property SC.Point
  */
  anchorPoint: function(key, value) {
    if (value !== undefined) {
      throw "No implementation for SC.Layer#set('anchorPoint', value)";
    } else return this._sc_anchorPoint;
  }.property(),

  /**
    Specifies the receiver’s position in the superlayer’s coordinate system. Animatable.

    @property SC.Point
  */
  position: function(key, value) {
    if (value !== undefined) {
      throw "No implementation for SC.Layer#set('position', value)";
    } else return this._sc_position;
  }.property(),

  /**
    Specifies the bounds rectangle of the receiver. Animatable.

    @property SC.Rect
  */
  bounds: function(key, value) {
    if (value !== undefined) {
      sc_assert(SC.IsRect(value));
      throw "No implementation for SC.Layer#set('bounds', value)";
    } else {
      if (this.__needsLayout__) {
        var surface = this.get('surface'),
            superlayer = this.get('superlayer'),
            anchorPoint = this.get('anchorPoint'),
            pbounds;

        if (superlayer) {
          // Use our superlayer's bounds.
          pbounds = superlayer.get('bounds');
          // debugger;
        } else if (surface) {
          // debugger;
          // Use our surfaces's bounds.
          pbounds = surface.get('frame');
        } else {
          // Give width and height a try, otherwise we'll get the minimum
          // possible size once `this._sc_layoutFunction()` runs.
          pbounds = {
            width: this.get('width') || 0,
            height: this.get('height') || 0
          };
        }

        // This updates `position` and `bounds`.
        this._sc_layoutFunction(
            this._sc_layoutValues,
            pbounds.width, pbounds.height,
            anchorPoint[0]/*x*/, anchorPoint[1]/*y*/,
            this._sc_position,
            this._sc_bounds
          );

        this.__needsLayout__ = false;
      }
      return this._sc_bounds;
    }
  }.property(),

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

    @property SC.Rect
  */
  frame: function(key, value) {
    var frame = this._sc_frame, anchorPoint, bounds, position;
    if (value !== undefined) {
      if (!SC.IsRect(value)) throw new TypeError("SC.Layer's 'frame' property can only be set to an SC.Rect.");

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
      throw "No implementation for SC.Layer#set('sublayerTransform', value)";
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
      throw "No implementation for SC.Layer#set('transform', value)";
    } else return this._sc_transform;
  }.property(),

  /**
    Returns the visible region of the receiver, in its own coordinate space.
    
    The visible region is the area not clipped by the containing scroll layer.

    @property SC.Rect
    @readOnly
  */
  visibleRect: function(key, value) {
    throw "No implementation for SC.Layer#get/set('visibleRect', value)";
  }.property(),

  // ..........................................................
  // LAYER TREE SUPPORT
  //

  /**
    Specifies receiver's superlayer.

    @property SC.Layer
    @readOnly
  */
  superlayer: function(key, value) {
    if (value !== undefined) {
      sc_assert(value === null || value.kindOf(SC.Layer), "SC.Layer@superlayer must either be null or an SC.Layer instance.");
      this._sc_superlayer = value;
    } else return this._sc_superlayer;
  }.property(),

  _sc_superlayer: null,
  _sc_superlayerDidChange: function() {
    // console.log('SC.Layer#_sc_superlayerDidChange()');
    var superlayer = this.get('superlayer'),
        old = this.get('surface'),
        cur = superlayer? superlayer.get('surface') : null ;

    if (old !== cur) {
      this.set('surface', cur); // Also updates our sublayers.
    }

    if (cur) this.triggerLayout();
  }.observes('superlayer'),

  /**
    An array containing the receiver's sublayers.

    The layers are listed in back to front order. Defaults to null.

    @property Array
  */
  sublayers: null,

  // When the sublayers property changes, we need to observe it's members
  // for changes.
  _sc_sublayersDidChange: function() {
    // console.log("SC.Layer#_sc_sublayersDidChange()");
    var cur  = this.get('sublayers'),
        last = this._sc_sublayers,
        func = this._sc_sublayersMembersDidChange;

    if (last === cur) return this; // nothing to do

    // teardown old observer
    if (last && last.isEnumerable) {
      last.invoke('set', 'superlayer', null);
      last.removeObserver('[]', this, func);
    }

    // save new cached values 
    sc_assert(SC.typeOf(cur) === SC.T_ARRAY);
    this._sc_sublayers = cur ;

    // setup new observers
    if (cur && cur.isEnumerable) cur.addObserver('[]', this, func);

    // process the changes
    this._sc_sublayersMembersDidChange();
  }.observes('sublayers'),

  _sc_sublayersMembersDidChange: function() {
    // console.log("SC.Layer#_sc_sublayersMembersDidChange()");
    this.get('sublayers').invoke('setIfChanged', 'superlayer', this);
  },

  /**
    Will this layer only be used for canvas hit-testing? Defaults to false.
    
    @property {Boolean}
    @readOnly
  */
  isHitTestOnly: false,

  /**
    The ID to use when trying to locate the layer in the DOM.  If you do not
    set the layerId explicitly, then the layer's GUID will be used instead.
    This ID must be set at the time the layer is created.
    
    @property {String}
    @readOnly
  */
  id: function(key, value) {
    if (value) this._layerId = value;
    if (this._layerId) return this._layerId;
    return SC.guidFor(this) ;
  }.property().cacheable(),

  /**
    This layer's canvas's 2D graphics context.
    
    @property {CanvasRenderingContext2D}
    @readOnly
  */
  context: null,

  /** @private Used by drawLayer to get the element to pass to drawImage */
  __sc_element__: null,

  /**
    The view that owns this layer.

    @property {SC.View}
  */
  owner: null,

  /** Returns a CanvasPattern for use in `context`, based on the layer's 
     content.
  */
  patternForContext: function(context, repetition) {
    var el = this.__sc_element__;
    repetition = repetition || 'repeat';
    return (!context || !el) ? null : context._sc_createPattern(el, repetition);
  },

  /**
    Clears the layer.
  */
  clear: function() {
    var context = this.get('context');
    if (context) context.clearRect(0, 0, context.width, context.height);
  },

  initElement: function() {
    var canvas = document.createElement('canvas'),
        context = canvas.getContext('2d'),
        bounds = this.get('bounds');

    this.context = context;
    this.__sc_element__ = canvas;
    context.__sc_canvas__ = canvas;

    if (ENFORCE_BLOSSOM_2DCONTEXT_API) delete context.canvas;

    canvas.id = this.get('id');
    canvas.width = bounds[2]/*width*/;
    canvas.height = bounds[3]/*height*/;

    if (this.get('isHitTestOnly')) {
      var defineRect = SC.Layer._sc_defineRect, K = SC.K;

      // Override those drawing operations that take time, but that we'll 
      // never see the visible effects of.
      SC.mixin(context, {
        stroke: K,
        fill: K,
        drawImage: K,
        fillText: K,
        strokeText: K,
        fillRect: defineRect,
        strokeRect: defineRect
      });
    }
  },

  structureDidChange: function(struct, key, member, oldvalue, newvalue) {
    // console.log('SC.Layer#structureDidChangeForKey(', key, member, oldvalue, newvalue, ')');
    this.notifyPropertyChange(key, this['_sc_'+key]);
  },

  /* @private */
  getPath: function(path) {
    var ary = path.split('.'),
        structureKey = ary[0],
        member = ary[1];

    if (SC.Layer.OBSERVABLE_STRUCTURES.indexOf(structureKey) >= 0) {
      // Get the internal structure directly, without using .get().
      return this['_sc_'+structureKey][member];
    } else return arguments.callee.base.apply(this, arguments);
  },

  /* @private */
  setPath: function(path, value) {
    var ary = path.split('.'),
        structureKey = ary[0],
        member = ary[1];

    if (SC.Layer.OBSERVABLE_STRUCTURES.indexOf(structureKey) >= 0) {
      // Set the internal structure directly, without using .set().
      this['_sc_'+structureKey][member] = value;
    } else arguments.callee.base.apply(this, arguments);
  },

  init: function() {
    // debugger;
    // console.log('SC.Layer#init()');
    arguments.callee.base.apply(this, arguments);

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

    // We need to observe sublayers for changes; set that up now.
    if (this.sublayers === null) {
      this.sublayers = [];
      this._sc_sublayersDidChange();
    }

    this._sc_isHidden = false; // we start out visible

    // This is a specialized initializer for our subclasses, so that each 
    // subclass can create their own backing layer type (canvas, video, etc.).
    this.initElement();

    // debugger;
    this.__needsLayout__ = true;
    this.__needsRendering__ = true;

    // this._sc_superlayerDidChange();
    // this._sc_needsLayoutDidChange();
    // this._sc_needsDisplayDidChange();
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

    transformFromSuperlayer[4]/*tx*/ = Math.round(transformFromSuperlayer[4]);
    transformFromSuperlayer[5]/*tx*/ = Math.round(transformFromSuperlayer[5]);

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

  renderBoundsPath: function(context) {
    var b = this.get('bounds'),
        cornerRadius = this.get('cornerRadius');

    // We use zero here for x and y because the origin of the CTM is already 
    // adjusted so that bounds.x and bounds.y are positioned at (0,0).
    if (cornerRadius > 0) {
      var width =  b[2]/*width*/,
          height = b[3]/*height*/;

      context.moveTo(cornerRadius, 0);
      context.lineTo(width - cornerRadius, 0);
      context.quadraticCurveTo(width, 0, width, cornerRadius);
      context.lineTo(width, height - cornerRadius);
      context.quadraticCurveTo(width, height, width - cornerRadius, height);
      context.lineTo(cornerRadius, height);
      context.quadraticCurveTo(0, height, 0, height - cornerRadius);
      context.lineTo(0, cornerRadius);
      context.quadraticCurveTo(0, 0, cornerRadius, 0);
      context.closePath();
    } else {
      context.rect(0, 0, b[2]/*width*/, b[3]/*height*/);
    }
  },

  /**
    This method is called to render the path that should be tested to 
    determine if the mouse intersects with this layer.

    By default, the layer's bounds are used as the path. You can override 
    this method to provide a smaller path.

    You do not need to call context.beginPath(); it has already been called 
    for you.  See http://www.w3.org/TR/2dcontext/#complex-shapes-paths for a 
    list of drawing operations that construct paths.

    Note: `context` is not the same drawing context as the layer's context.

    Note: Text is not represented as paths; use the text's bounding box if 
    you need to know when the area where the text is drawn is hit.

    @param context {CanvasRenderingContext2D} the context to construct the path in
  */
  renderHitTestPath: function(context) {
    this.renderBoundsPath(context);
  },

  /**
    This method is called to determine if a given point should be considered 
    to 'hit' the layer.

    @param x {Number} x-coordinate
    @param y {Number} y-coordinate
    @param context {CanvasRenderingContext2D} the context to perform any hit-testing in
  */
  hitsPointInContext: function(x, y, context) {
    // See if we actually hit something. Start by beginning a new path.
    context.beginPath();

    // Next, draw the path(s) we'll test.
    this.renderHitTestPath(context);

    // Finally, test the point for intersection with the path(s).
    return context.isPointInPath(x, y);
  },

  isHidden: function(key, value) {
    if (value !== undefined) {
      throw "No implementation for SC.Layer#set('isHidden', value)";
    } else return this._sc_isHidden;
  }.property(),

  /**
    Destroy the layer (and all of its sublayers), including any related 
    resources (e.g. drawing contexts, backing storage, etc.).
  */
  destroy: function() {
    console.log("SC.Layer#destroy()");
    console.log("FIXME: Implement me.");
    sc_assert(!this.get('superlayer'));
  },

  addSublayer: function(layer) {
    sc_assert(layer && layer.instanceOf(SC.Layer));
    sc_assert(!layer.get('superlayer'));
    
    var sublayers = this.get('sublayers');
    sublayers.push(layer);
    layer.set('superlayer', this);
  },

  removeSublayer: function(layer) {
    sc_assert(layer && layer.instanceOf(SC.Layer));
    sc_assert(layer.get('superlayer') === this);
    
    var sublayers = this.get('sublayers');
    sc_assert(sublayers.indexOf(layer) !== -1);
    sublayers.removeObject(layer);
    layer.set('superlayer', null);
  }

});

SC.AugmentBaseClassWithDisplayProperties(SC.Layer);

SC.Layer._sc_defineRect = function(x, y, width, height) {
  this.rect(x, y, width, height);
};

SC.Layer.OBSERVABLE_STRUCTURES = 'bounds position anchorPoint transform sublayerTransform'.w();

SC.Layer.computeLayerTransformTo = function(fromLayer, toLayer, dest) {
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
