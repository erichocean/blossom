// ==========================================================================
// Project:   Blossom - Modern, Cross-Platform Application Framework
// Copyright: ©2012 Fohr Motion Picture Studios. All rights reserved.
// License:   Licensed under the GPLv3 license (see BLOSSOM-LICENSE).
// ==========================================================================
/*globals BLOSSOM sc_assert */

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

    var layers = this.get('layers');
    for (var idx=0, len=layers.length; idx<len; ++idx) {
      layers[idx].updateLayout();
    }
    this._sc_hitTestLayer.updateLayout();

    SC.Benchmark.end(benchKey);
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

    var psurface = SC.psurfaces[this.__id__],
        canvas = psurface? psurface.__element__ : null,
        ctx = canvas? canvas.getContext('2d') : null,
        w = canvas.width, h = canvas.height;

    sc_assert(ctx);

    // Draw background.
    ctx.fillStyle = base3;
    ctx.fillRect(0, 0, w, h);

    // Draw layers.
    SC.Benchmark.start(copyKey);
    for (idx=0, len=layers.length; idx<len; ++idx) {
      layers[idx].copyIntoContext(ctx);
    }
    SC.Benchmark.end(copyKey);

    // Draw lines overlay.
    ctx.beginPath();
    var line = h/2;
    if (h%2 === 0) line += 0.5;
    ctx.moveTo(0, line);
    ctx.lineTo(w, line);
    var vline = w/2;
    if (w%2 === 0) vline += 0.5;
    ctx.moveTo(vline, 0);
    ctx.lineTo(vline, h);
    ctx.strokeStyle = orange;
    ctx.lineWidth = 0.5;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(w/2, h/2, 3, 0, 2*Math.PI, false);
    ctx.fillStyle = orange;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(w/2, h/2, 15, 0, 2*Math.PI, false);
    ctx.lineWidth = 0.5;
    ctx.stroke();

    SC.Benchmark.end(benchKey);
  },

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
    var el = SC.psurfaces[this.__id__].__element__,
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
  targetResponderForEvent: function(evt) {
    // console.log('SC.ViewSurface#targetResponderForEvent(', evt, ')');
    var context = this._sc_hitTestLayer.get('context'),
        hitLayer = null, zIndex = -1,
        mousePosition, x, y;

    // debugger;
    mousePosition = this.updateMousePositionWithEvent(evt);
    x = mousePosition.x;
    y = mousePosition.y;

    function hitTestLayer(layer) {
      // debugger;
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

      // First, test our sublayers.
      var sublayers = layer.get('sublayers'), idx = sublayers.length;
      while (idx--) {
        hitTestLayer(sublayers[idx]);
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
      hitTestLayer(layers[idx]);
    }

    // If we hit a layer, remember it so our view knows.
    evt.layer = hitLayer;

    // We don't need to test `layer`, because we already know it was hit when
    // this method is called by SC.RootResponder.
    return hitLayer? (hitLayer.get('behavior') || this) : this ;
  }

});

} // BLOSSOM