// ==========================================================================
// Project:   Blossom - Modern, Cross-Platform Application Framework
// Copyright: ©2012 Fohr Motion Picture Studios. All rights reserved.
// License:   Licensed under the GPLv3 license (see BLOSSOM-LICENSE).
// ==========================================================================
/*globals BLOSSOM sc_assert ENFORCE_BLOSSOM_2DCONTEXT_API */

sc_require('surfaces/leaf');

if (BLOSSOM) {

var base03 =   "#002b36";
var base02 =   "#073642";
var base01 =   "#586e75";
var base00 =   "#657b83";
var base0 =    "#839496";
var base1 =    "#93a1a1";
var base2 =    "#eee8d5";
var base3 =    "#fdf6e3";
var yellow =   "#b58900";
var orange =   "#cb4b16";
var red =      "#dc322f";
var magenta =  "#d33682";
var violet =   "#6c71c4";
var blue =     "#268bd2";
var cyan =     "#2aa198";
var green =    "#859900";
var white =    "white";

/** @class
  `SC.View` implements an view controller, composed of a layer tree with 
  associated behaviors.

  @extends SC.Surface
  @since Blossom 1.0
*/
SC.View = SC.LeafSurface.extend({

  // ..........................................................
  // PSURFACE SUPPORT
  //

  __tagName__: 'canvas',

  __useContentSize__: true, // we need our width and height attributes set

  init: function() {
    arguments.callee.base.apply(this, arguments);
    this.layers = [];
    this._sc_layersDidChange();

    this._sc_hitTestLayer = SC.Layer.create({
      // `layout` is whatever the default on SC.Layer is
      isHitTestOnly: true,
      surface: this,
      delegate: this
    });
  },

  layers: [],

  // ..........................................................
  // LAYER TREE SUPPORT
  //

  // When the subsurfaces property changes, we need to observe it's members
  // for changes.
  _sc_layers: null,
  _sc_layersDidChange: function() {
    // console.log("SC.View#_sc_layersDidChange()");
    var cur  = this.get('layers'),
        last = this._sc_layers,
        func = this._sc_layersMembersDidChange;

    if (last === cur) return this; // nothing to do

    // teardown old observer
    sc_assert(last? last.isEnumerable : true);
    if (last) last.removeObserver('[]', this, func);

    // save new cached values 
    sc_assert(cur && cur.constructor.prototype === Array.prototype);
    this._sc_subsurfaces = cur;

    // setup new observers
    sc_assert(cur? cur.isEnumerable : true);
    if (cur) cur.addObserver('[]', this, func);

    // process the changes
    this._sc_layersMembersDidChange();
  }.observes('layers'),

  _sc_layersMembersDidChange: function() {
    // console.log("SC.View#_sc_layersMembersDidChange()");
    var layers = this.get('layers');

    // FIXME: Do this smarter!
    for (var idx=0, len=layers.length; idx<len; ++idx) {
      layers[idx].set('surface', this);
    }

    this.triggerLayoutAndRendering();
  },

  // ..........................................................
  // RENDERING SUPPORT
  //

  performRenderingIfNeeded: function(timestamp) {
    // console.log('SC.Surface#performRenderingIfNeeded()');
    var needsLayout = this.__needsLayout__,
        needsDisplay = this.__needsRendering__,
        isVisible = this.get('isVisible');

    var benchKey = 'SC.Surface#performRenderingIfNeeded()',
        displayKey = 'SC.Surface#performRenderingIfNeeded(): needsDisplay';

    SC.Benchmark.start(benchKey);

    SC.Benchmark.start(displayKey);
    if (this.get('isPresentInViewport')) {
      if (this.updateDisplay) this.updateDisplay();
      this.__needsRendering__ = false;
    } // else leave it set to true, we'll update it when it again becomes
      // visible in the viewport
    SC.Benchmark.end(displayKey);

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
  triggerLayoutAndRendering: function() {
    // console.log('SC.View#triggerLayoutAndRendering()', SC.guidFor(this));
    arguments.callee.base.apply(this, arguments);
    var layers = this.get('layers');

    // FIXME: Do this smarter!
    for (var idx=0, len=layers.length; idx<len; ++idx) {
      layers[idx].triggerLayoutAndRendering();
    }
  },

  updateLayout: function() {
    // console.log('SC.View#updateLayout()', SC.guidFor(this));
    var benchKey = 'SC.View#updateLayout()';
    SC.Benchmark.start(benchKey);

    var layers = this.get('layers'), layer,
        textLayersNeedingLayout = [];

    for (var idx=0, len=layers.length; idx<len; ++idx) {
      layer = layers[idx];
      layer.updateLayout();
      if (layer.updateTextLayout && layer.__needsTextLayout__) {
        textLayersNeedingLayout.push(layer);
      }
    }
    this._sc_hitTestLayer.updateLayout();

    for (idx=0, len=textLayersNeedingLayout.length; idx<len; ++idx) {
      textLayersNeedingLayout[idx].updateTextLayout();
    }

    SC.Benchmark.end(benchKey);
  },

  clearBackground: true,

  _sc_backgroundColor: base3,

  didCreateElement: function(canvas) {
    arguments.callee.base.apply(this, arguments);
    var ctx = canvas.getContext('2d');

    // Enables ctx.width and ctx.height to work.
    ctx.__sc_canvas__ = canvas;

    if (ENFORCE_BLOSSOM_2DCONTEXT_API) delete ctx.canvas;
    this._sc_context = ctx;
  },

  updateDisplay: function() {
    // console.log('SC.View#updateDisplay()', SC.guidFor(this));
    var benchKey = 'SC.ViewSurface#updateDisplay()',
        updateKey = 'SC.ViewSurface#updateDisplay() - update',
        copyKey = 'SC.ViewSurface#updateDisplay() - copy';
    SC.Benchmark.start(benchKey);

    SC.Benchmark.start(updateKey);
    var layers = this.get('layers');
    for (var idx=0, len=layers.length; idx<len; ++idx) {
      layers[idx].updateDisplay();
    }
    SC.Benchmark.end(updateKey);

    var ctx = this._sc_context;
    sc_assert(ctx);
    sc_assert(document.getElementById(ctx.__sc_canvas__.id));

    // Clear the background if requested.
    if (this.get('clearBackground')) ctx.clearRect(0, 0, ctx.w, ctx.h);

    if (this.willRenderLayers) {
      ctx.save();
      this.willRenderLayers(ctx);
      ctx.restore();
    }

    // Draw layers.
    SC.Benchmark.start(copyKey);
    for (idx=0, len=layers.length; idx<len; ++idx) {
      layers[idx].copyIntoContext(ctx);
    }
    SC.Benchmark.end(copyKey);

    if (this.didRenderLayers) {
      ctx.save();
      this.didRenderLayers(ctx);
      ctx.restore();
    }

    SC.Benchmark.end(benchKey);
  },

  /**
    Finds the layer that is hit by this event, and returns its behavior if it 
    exists.  Otherwise, returns the receiver.
  */
  targetResponderForEvent: function(evt) {
    // console.log('SC.ViewSurface#targetResponderForEvent(', evt, ')');
    var context = this._sc_hitTestLayer.get('context'),
        hitLayer = null, zIndex = -1,
        boundingRect, x, y;

    // debugger;
    boundingRect = evt.target.getBoundingClientRect();
    x = evt.clientX - boundingRect.left + window.pageXOffset;
    y = evt.clientY - boundingRect.top + window.pageYOffset;
    // console.log('*****', evt.type, x, y, '*****');

    function spaces(depth) {
      console.log(depth);
      var ret = "", idx, len;
      for (idx = 0, len = depth; idx<len; ++idx) ret += "--";
      return ret;
    }

    function hitTestLayer(layer, point, depth) {
      // debugger;
      // console.log(spaces(depth), "on entry:", point.x, point.y);
      if (layer.get('isHidden')) return;
      context.save();

      // Prevent this layer and any sublayer from drawing paths outside our
      // bounds.
      layer.renderBoundsPath(context);
      context.clip();

      // Make sure the layer's transform is current.
      if (layer._sc_transformFromSuperlayerToLayerIsDirty) {
        layer._sc_computeTransformFromSuperlayerToLayer();
      }

      // Apply the sublayer's transform from our layer (it's superlayer).
      var t = layer._sc_transformFromSuperlayerToLayer;
      context.transform(t[0], t[1], t[2], t[3], t[4], t[5]);
      SC.PointApplyAffineTransformTo(point, t, point);
      var frame = layer.get('frame');
      // console.log(spaces(depth), 'frame:', frame.x, frame.y, frame.width, frame.height);
      // console.log(spaces(depth), 'transformed:', point.x, point.y);

      // First, test our sublayers.
      var sublayers = layer.get('sublayers'), idx = sublayers.length;
      depth++;
      while (idx--) {
        hitTestLayer(sublayers[idx], SC.MakePoint(point), depth);
      }

      // Only test ourself if (a) no hit has been found, or (b) our zIndex is
      // higher than whatever hit has been found so far.
      var layerZ = layer.get('zIndex');
      if (!hitLayer || zIndex < layerZ) {
        // See if we actually hit something. Start by beginning a new path.
        context.beginPath();

        // Next, draw the path(s) we'll test.
        layer.renderHitTestPath(context);

        // Finally, test the point for intersection with the path(s).
        if (context.isPointInPath(x, y)) {
          evt.hitPoint = SC.MakePoint(x - point[0]/*x*/, y - point[1]/*y*/);
          hitLayer = layer;
          zIndex = layerZ;
        }
      }

      context.restore();
    }

    // Next, begin the hit testing process. When this completes, hitLayer
    // will contain the layer that was hit with the highest zIndex.
    var layers = this.get('layers'), idx = layers.length;

    while (idx--) {
      hitTestLayer(layers[idx], SC.MakePoint(), 0);
    }

    // We don't need to test `layer`, because we already know it was hit when
    // this method is called by SC.RootResponder.
    if (!hitLayer) return this;
    else {
      // If we hit a layer, remember it so our view knows.
      evt.layer = hitLayer;

      // Try and find the behavior attached to this layer.
      var behavior = hitLayer.get('behavior');
      while (!behavior && hitLayer) {
        hitLayer = hitLayer.get('superlayer');
        if (hitLayer) behavior = hitLayer.get('behavior');
      }
      return behavior || this;
    }
  },

  /**
    This updates the `layer` and `hitPoint` properties on evt as if the layer 
    was clicked by the mouse.

    The layer must be part of a layer tree in this surface, the event must be 
    a mouse event, and the surface must have been active (part of SC.app's 
    `surfaces` or the `ui` surface) *before* the event occurred. 
  */
  updateEventForLayer: function(evt, layer) {
    sc_assert(layer);
    sc_assert(layer.kindOf(SC.Layer));
    sc_assert(evt);
    sc_assert(evt instanceof SC.Event);
    var psurface, boundingRect, x, y, parents, superlayer, type = evt.type;

    if (layer.get('surface') !== this) return;

    // If we're not currently an active surface, there's nothing to do.
    psurface = SC.psurfaces[this.__id__];
    if (!psurface) return;

    // Must be a mouse event.
    if (type !== 'mousedown' && type !== 'mousemove' && type !== 'mouseup') return;

    evt.layer = layer;

    boundingRect = psurface.__element__.getBoundingClientRect();
    x = evt.clientX - boundingRect.left + window.pageXOffset;
    y = evt.clientY - boundingRect.top + window.pageYOffset;

    // Gather the superlayers (with the layer first).
    parents = [layer];
    superlayer = layer.get('superlayer');
    while (superlayer) {
      parents.push(superlayer);
      superlayer = superlayer.get('superlayer');
    }

    var len = parents.length,
        point = SC.MakePoint();

    // Transform point from top-most superlayer on down to the layer.
    while (len--) {
      layer = parents[len];

      // Make sure the layer's transform is current.
      if (layer._sc_transformFromSuperlayerToLayerIsDirty) {
        layer._sc_computeTransformFromSuperlayerToLayer();
      }

      var t = layer._sc_transformFromSuperlayerToLayer;
      SC.PointApplyAffineTransformTo(point, t, point);
    }

    // Adjust for the surface.
    point[0]/*x*/ = x-point[0]/*x*/;
    point[1]/*y*/ = y-point[1]/*y*/;

    // point has now been transformed to layer's coordinate system
    evt.hitPoint = point;
  }

});

} // BLOSSOM
