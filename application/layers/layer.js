// ==========================================================================
// Project:   Blossom - Modern, Cross-Platform Application Framework
// Copyright: ©2012 Fohr Motion Picture Studios. All rights reserved.
// License:   Licensed under the GPLv3 license (see BLOSSOM-LICENSE).
// ==========================================================================
/*globals BLOSSOM CanvasRenderingContext2D HTMLCanvasElement
  ENFORCE_BLOSSOM_2DCONTEXT_API sc_assert */

sc_require('system/matrix');
sc_require('ext/browser');
sc_require('ext/float32');

if (BLOSSOM) {

var ENFORCE_BLOSSOM_2DCONTEXT_API = true; // removes context.canvas

SC.Layer = SC.Object.extend({

  isLayer: true, // Walk like a duck.

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
    } else return this._sc_bounds;
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

  /**
    Specifies receiver's superlayer.

    @property SC.Layer
    @readOnly
  */
  superlayer: function(key, value) {
    if (value !== undefined) {
      throw "No implementation for SC.Layer#set('superlayer', value)";
    } else return this._sc_superlayer;
  }.property(),

  /**
    An array containing the receiver's sublayers.

    The layers are listed in back to front order. Defaults to null.

    @property Array
  */
  sublayers: null,

  /**
    Will this layer only be used for canvas hit-testing? Defaults to false.
    
    @property {Boolean}
    @readOnly
  */
  isHitTestOnly: false,

  width: 300,
  height: 500,

  /** @private
    Maintains the layer's dimensions – use width and height properties to 
    adjust.
  */
  widthOrHeightDidChange: function() {
    var canvas = this.__sc_element__;
    canvas.width = this.get('width');
    canvas.height = this.get('height');
  }.observes('width', 'height'),

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
    var width = this.get('width'),
        height = this.get('height'),
        context = this.get('context');

    context.clearRect(0, 0, width, height);
  },

  initElement: function() {
    var canvas = document.createElement('canvas'),
        context = canvas.getContext('2d');

    this.context = context;
    this.__sc_element__ = canvas;
    context.__sc_canvas__ = canvas;

    if (ENFORCE_BLOSSOM_2DCONTEXT_API) delete context.canvas;

    canvas.id = this.get('id');
    canvas.style.position = 'absolute';
    this.widthOrHeightDidChange(); // configures canvas with the right size

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

    var container = this.get('container');
    if (container) container.appendChild(canvas); // a DOM call
  },

  structureDidChange: function(struct, key, member, oldvalue, newvalue) {
    console.log('SC.Layer#structureDidChangeForKey(', key, member, oldvalue, newvalue, ')');
    this.notifyPropertyChange(key, this['_sc_'+key]);
  },

  // When the sublayers property changes, we need to observe it's members
  // for changes.
  _sc_sublayersDidChange: function() {
    // console.log("SC.Layer#_sc_sublayersDidChange()");
    var cur  = this.get('sublayers'),
        last = this._sc_sublayers,
        func = this._sc_sublayersMembersDidChange;
        
    if (last === cur) return this; // nothing to do

    // teardown old observer
    if (last && last.isEnumerable) last.removeObserver('[]', this, func);
    
    // save new cached values 
    this._sc_sublayers = cur ;
    
    // setup new observers
    if (cur && cur.isEnumerable) cur.addObserver('[]', this, func);

    // process the changes
    this._sc_sublayersMembersDidChange();
  }.observes('sublayers'),

  _sc_sublayersMembersDidChange: function() {
    // console.log("SC.Layer#_sc_sublayersMembersDidChange()");
  },

  /* @private */
  getPath: function(path) {
    var ary = path.split('.'),
        structureKey = ary[0],
        member = ary[1];

    if (SC.Layer.OBSERVABLE_STRUCTURES.indexOf(structureKey) >= 0) {
      // Get the internal structure directly, without using .get().
      return this['_sc_'+structureKey][member];
    } else return sc_super();
  },

  /* @private */
  setPath: function(path, value) {
    var ary = path.split('.'),
        structureKey = ary[0],
        member = ary[1];

    if (SC.Layer.OBSERVABLE_STRUCTURES.indexOf(structureKey) >= 0) {
      // Set the internal structure directly, without using .set().
      this['_sc_'+structureKey][member] = value;
    } else sc_super();
  },

  init: function() {
    sc_super();

    // Allocate our own structures to modify in-place. For performance, we 
    // create a single ArrayBuffer up front and have all of the layer's 
    // graphical structures reference it. This both reduces memory use and 
    // improves memory locality, and since these structures are frequently 
    // accessed together, overall performance improves too, especially during
    // critical animation loops.
    var buf = SC.MakeFloat32ArrayBuffer(48); // indicates num of floats needed

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

    this._sc_transformToLayer = SC.MakeIdentityAffineTransformFromBuffer(buf, 24);
    this._sc_transformFromLayer = SC.MakeIdentityAffineTransformFromBuffer(buf, 30);
    this._sc_transformToLayerIsDirty = this._sc_transformFromLayerIsDirty = true; // force re-compute

    // This is used by various methods for temporary computations.
    this._sc_tmpTransform = SC.MakeAffineTransformFromBuffer(buf, 36);
    this._sc_tmpPoint = SC.MakePointFromBuffer(buf, 42);
    this._sc_tmpRect = SC.MakeRectFromBuffer(buf, 44);

    // We need to observe sublayers for changes; set that up now.
    this.sublayers = [];
    this._sc_sublayersDidChange();

    this._sc_isHidden = true; // we start out hidden

    // This is a specialized initializer for our subclasses, so that each 
    // subclass can create their own backing layer type (canvas, video, etc.).
    this.initElement();
  },

  _sc_computeTransformFromLayer: function() {
    // Assume our callers have checked to determine if we should be called.
    // if (!this._sc_transformFromLayerIsDirty) return;

    // This implementation is designed to prevent any memory allocations.
    var anchorPoint = this._sc_anchorPoint,
        bounds = this._sc_bounds,
        position = this._sc_position,
        superlayer = this._sc_superlayer,
        transform = this._sc_transform,
        tmpTransform = this._sc_tmpTransform,
        transformFromLayer = this._sc_transformFromLayer;

    // Set our initial offset based on our anchorPoint and bounds.
    SC.SetIdentityAffineTransform(transformFromLayer);
    transformFromLayer[4]/*tx*/ = -bounds[2]/*width*/  * anchorPoint[0]/*x*/ - bounds[0]/*x*/;
    transformFromLayer[5]/*ty*/ = -bounds[3]/*height*/ * anchorPoint[1]/*y*/ - bounds[1]/*y*/;

    // Make a temporary transform from our position property.
    SC.SetIdentityAffineTransform(tmpTransform);
    tmpTransform[4]/*tx*/ = position[0]/*x*/;
    tmpTransform[5]/*ty*/ = position[1]/*y*/;

    // Take our primary transform and adjust its position using tmpTransform.
    // Note: Don't accidentally modify transform (reuse tmpTransform instead).
    SC.AffineTransformConcatTo(transform, tmpTransform, tmpTransform);

    // The final result is the initial offset result concatentated with the 
    // transform-concatentated-with-the-position result.
    SC.AffineTransformConcatTo(transformFromLayer, tmpTransform, transformFromLayer);

    // Unless, that is, our superlayer is pushing us around too...
    if (superlayer && superlayer._sc_hasSublayerTransform) {
      SC.AffineTransformConcatTo(transformFromLayer, superlayer._sc_sublayerTransform, transformFromLayer);
    }

    this._sc_transformFromLayerIsDirty = false;
  },

  _sc_computeTransformToLayer: function() {
    // Assume our callers have checked to determine if we should be called.
    // if (!this._sc_transformToLayerIsDirty) return;

    // _sc_transformToLayer is just the inverse of _sc_transformFromLayer. 
    // Make sure it's ready to be inverted first.
    if (this._sc_transformFromLayerIsDirty) this._sc_computeTransformFromLayer();

    // Actually do the inverse transform now.
    SC.AffineTransformInvertTo(this._sc_transformFromLayer, this._sc_transformToLayer);

    this._sc_transformToLayerIsDirty = false;
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

  /**
    Returns true if the layer contains the point. Point is specified in the 
    layer's own coordinate system.
    
    @param point the point to test
    @returns Boolean
  */
  containsPoint: function(point) {
    var bounds = this._sc_bounds;
    
    return (point[0]/*x*/ >= bounds[0]/*x*/ &&
            point[1]/*y*/ >= bounds[1]/*y*/ &&
            point[0]/*x*/ <  bounds[0]/*x*/ + bounds[2]/*width*/  &&
            point[1]/*y*/ <  bounds[1]/*y*/ + bounds[3]/*height*/ );
  },

  /**
    Returns the farthest descendant of this layer that contains the 
    specified point.

    @param point the point to test
    @returns the containing layer or null if there was no hit.
  */
  hitTest: function(point, force) {
    if (!force && this._sc_isHidden) return null;

    var tmpPoint = this._sc_tmpPoint,
        sublayers = this.sublayers,
        idx, len,
        layer, hits = [], hit,
        zIndex, tmp;

    // Make sure our transform is current.
    if (this._sc_transformToLayerIsDirty) this._sc_computeTransformToLayer();

    // Convert point from superlayer's coordinate system to our own.
    SC.PointApplyAffineTransformTo(point, this._sc_transformToLayer, tmpPoint);

    // See if any of our children contain the point.
    for (idx=0, len = sublayers.get('length'); idx<len; ++idx) {
      if (hit = sublayers.objectAt(idx).hitTest(tmpPoint)) hits.push(hit);
    }

    len = hits.length;
    if (len === 1) return hits[0]; // only one hit, return it!
    else if (len > 1) {
      // We need to return the hit that has the highest zIndex.
      zIndex = -1;
      for (idx=0; idx<len; ++idx) {
        hit = hits[idx];
        tmp = hit.get('zIndex');

        // In case of a tie, we favor sublayers defined later in the 
        // sublayers array.
        if (tmp >= zIndex) {
          zIndex = tmp;
          layer = hit;
        }
      }
      sc_assert(layer);
      return layer;
    } else {
      if (this.containsPoint(tmpPoint)) return this;
      else return null;
    }
  }

});

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
      // layer._sc_transformFromLayer isn't recomputed immediately. Check to
      // see if we need to recompute it now.
      if (layer._sc_transformFromLayerIsDirty) layer._sc_computeTransformFromLayer();
      SC.AffineTransformConcatTo(dest, layer._sc_transformFromLayer, dest);
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
    // layer._sc_transformToLayer isn't recomputed immediately. Check to
    // see if we need to recompute it now.
    if (layer._sc_transformToLayerIsDirty) layer._sc_computeTransformToLayer();
    SC.AffineTransformConcatTo(dest, layer._sc_transformToLayer, dest);
  }
};

} // BLOSSOM
