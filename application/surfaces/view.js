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
  }

  // bounds: function() {
  //   // FIXME!
  //   return this.getPath('container.bounds');
  // }.property(),

  /**
    Finds the layer that is hit by this event, and returns its view.
  */
  // targetSurfaceForEvent: function(evt) {
  //   // console.log('SC.ViewSurface#targetSurfaceForEvent(', evt, ')');
  //   var context = this.getPath('hitTestLayer.context'),
  //       contentView = this.get('contentView'),
  //       hitLayer = null, zIndex = -1,
  //       mousePosition, x, y;
  // 
  //   // debugger;
  //   mousePosition = this.updateMousePositionWithEvent(evt);
  //   x = mousePosition.x;
  //   y = mousePosition.y;
  // 
  //   if (!contentView) return this;
  // 
  //   function hitTestSublayer(sublayer) {
  //     // debugger;
  //     if (sublayer.get('isHidden')) return;
  //     context.save();
  // 
  //     // Prevent this layer and any sublayer from drawing paths outside our
  //     // bounds.
  //     sublayer.renderBoundsPath(context);
  //     context.clip();
  // 
  //     // Make sure the layer's transform is current.
  //     if (sublayer._sc_transformFromSuperlayerToLayerIsDirty) {
  //       sublayer._sc_computeTransformFromSuperlayerToLayer();
  //     }
  // 
  //     // Apply the sublayer's transform from our layer (it's superlayer).
  //     var t = sublayer._sc_transformFromSuperlayerToLayer;
  //     context.transform(t[0], t[1], t[2], t[3], t[4], t[5]);
  // 
  //     // First, test our sublayers.
  //     sublayer.get('sublayers').forEach(hitTestSublayer);
  // 
  //     // Only test ourself if (a) no hit has been found, or (b) our zIndex is
  //     // higher than whatever hit has been found so far.
  //     var sublayerZ = sublayer.get('zIndex');
  //     if (!hitLayer || zIndex < sublayerZ) {
  //       // See if we actually hit something. Start by beginning a new path.
  //       context.beginPath();
  // 
  //       // Next, draw the path(s) we'll test.
  //       sublayer.renderHitTestPath(context);
  // 
  //       // Finally, test the point for intersection with the path(s).
  //       if (context.isPointInPath(x, y)) {
  //         hitLayer = sublayer;
  //         zIndex = sublayerZ;
  //       }
  //     }
  // 
  //     context.restore();
  //   }
  // 
  //   context.save();
  // 
  //   var layer = contentView.get('layer');
  // 
  //   // First, clip the context to the pane's layer's bounds.
  //   context.beginPath();
  //   layer.renderBoundsPath(context);
  //   context.clip();
  // 
  //   // Next, begin the hit testing process. When this completes, hitLayer
  //   // will contain the layer that was hit with the highest zIndex.
  //   hitTestSublayer(layer);
  // 
  //   context.restore();
  // 
  //   // console.log(hitLayer, hitLayer? hitLayer.get('view') : undefined);
  // 
  //   // We don't need to test `layer`, because we already know it was hit when
  //   // this method is called by SC.RootResponder.
  //   return hitLayer? hitLayer.get('view') : this ;
  // },

  // initElement: function() {
  //   arguments.callee.base.apply(this, arguments);
  //   var element = this.__sc_element__;
  //   this._sc_contentViewDidChange();
  // },

  // ..........................................................
  // VIEWPORT SUPPORT
  //

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
  // hitTestLayer: null,
  // 
  // hitTestLayer: function(key, value) {
  //   sc_assert(value === undefined); // We're read only.
  //   return this._sc_hitTestLayer;
  // }.property(),

  // createSurface: function() {
  //   // console.log('SC.View#createSurface()');
  // 
  //   // For now, just do this one time.
  //   if (this._sc_didCreateSurface) return;
  //   this._sc_didCreateSurface = true;
  // 
  //   arguments.callee.base.apply(this, arguments);
  //   var container = this;
  // 
  //   // SC.ViewSurface only has two layers: `layer` and `hitTestLayer`.
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
  // 
  // destroySurface: function() {
  //   console.log('SC.ViewSurface#destroySurface()');
  // },

  // ..........................................................
  // CONTENT VIEW SUPPORT
  //

  // contentView: null,
  // 
  // _sc_contentView: null,
  // _sc_contentViewDidChange: function() {
  //   // console.log('SC.ViewSurface#_sc_contentViewDidChange()');
  //   var old = this._sc_contentView,
  //       cur = this.get('contentView'),
  //       layer = this.get('layer');
  // 
  //   if (cur && cur.isViewClass) {
  //     this.set('contentView', cur.create());
  //     return;
  //   }
  // 
  //   sc_assert(old === null || old.kindOf(SC.View), "Blossom internal error: SC.Application^_sc_contentView is invalid.");
  //   sc_assert(cur === null || cur.kindOf(SC.View), "SC.Application@ui must either be null or an SC.View instance.");
  // 
  //   if (old === cur) return; // Nothing to do.
  // 
  //   if (old) old.set('surface', null);
  //   if (cur) cur.set('surface', this);
  // 
  //   this.displayDidChange();
  // }.observes('contentView')

});

// HACK: FIXME
// SC.LAYOUT_AUTO = 'auto';
// SC._VIEW_DEFAULT_DIMS = 'marginTop marginLeft'.w();

} // BLOSSOM