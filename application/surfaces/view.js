// ==========================================================================
// Project:   Blossom - Modern, Cross-Platform Application Framework
// Copyright: ©2012 Fohr Motion Picture Studios. All rights reserved.
// License:   Licensed under the GPLv3 license (see BLOSSOM-LICENSE).
// ==========================================================================
/*globals BLOSSOM sc_assert */

sc_require('surfaces/surface');
sc_require('surfaces/transitions/surface_transition');

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
  `SC.ViewSurface` implements an SC.View host.  You set a view as the 
  `contentView` property, and it will be sized relative to the `bounds` of 
  the view surface.

  @extends SC.Surface
  @since Blossom 1.0
*/
SC.ViewSurface = SC.Surface.extend({

  // bounds: function() {
  //   // FIXME!
  //   return this.getPath('container.bounds');
  // }.property(),

  // ..........................................................
  // RENDERING SUPPORT
  //

  updateLayout: function() {
    // console.log('SC.ViewSurface#updateLayout()', SC.guidFor(this));
    var layer = this.getPath('contentView.layer');
    if (layer && layer.get('needsLayout')) layer.updateLayout();
  },

  updateDisplay: function() {
    // console.log('SC.ViewSurface#updateDisplay()', SC.guidFor(this));
    sc_assert(document.getElementById(this.__sc_element__.id));
    var layer = this.getPath('contentView.layer');
    // debugger;


    if (layer && layer.get('needsDisplay')) layer.updateDisplay();

    var ctx = this.getPath('layer.context'),
        w = ctx.width, h = ctx.height;

    sc_assert(ctx);

    // Draw background.
    ctx.fillStyle = base3;
    ctx.fillRect(0, 0, ctx.width, ctx.height);
    // ctx.strokeStyle = base0;
    // ctx.lineWidth = 2; // overlap of 1 on the inside
    // ctx.strokeRect(0, 0, ctx.width, ctx.height);

    layer.copyIntoContext(ctx);

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
  },

  // ..........................................................
  // DOM SUPPORT (Private, Browser-only)
  //

  initElement: function() {
    arguments.callee.base.apply(this, arguments);
    var element = this.__sc_element__;
    this._sc_contentViewDidChange();
  },

  // ..........................................................
  // VIEWPORT SUPPORT
  //

  /**
    The SC.Layer subclass to instantiate to create this view's layer.

    @property {SC.Layer}
  */
  layerClass: SC.Layer,

  layer: function(key, value) {
    sc_assert(value === undefined); // We're read only.
    return this._sc_layer;
  }.property(),

  hitTestLayer: null,

  hitTestLayer: function(key, value) {
    sc_assert(value === undefined); // We're read only.
    return this._sc_hitTestLayer;
  }.property(),

  createSurface: function() {
    // console.log('SC.ViewSurface#createSurface()');

    // For now, just do this one time.
    if (this._sc_didCreateSurface) return;
    this._sc_didCreateSurface = true;

    arguments.callee.base.apply(this, arguments);
    var container = this;

    // SC.ViewSurface only has two layers: `layer` and `hitTestLayer`.
    var K = this.get('layerClass');
    sc_assert(K && K.kindOf(SC.Layer));

    // We want to allow the developer to provide a layout hash on the view, 
    // or to override the 'layout' computed property.
    if (this.hasOwnProperty('layout')) {
      // It's still possible that layout is a computed property. Don't use 
      // `get()` to find out!
      var layout = this.layout;
      if (typeof layout === "object") {
        // We assume `layout` is a layout hash. The layer will throw an 
        // exception if `layout` is invalid -- don't test for that here.
        this._sc_layer = K.create({
          layout: layout,
          owner: this, // TODO: Do we need owner here?
          container: container,
          delegate: this
        });
        this._sc_hitTestLayer = K.create({
          layout: layout,
          isHitTestOnly: true,
          owner: this, // TODO: Do we need owner here?
          container: container,
          delegate: this
        });
      } else {
        this._sc_layer = K.create({
          // `layout` is whatever the default on SC.Layer is
          owner: this, // TODO: Do we need owner here?
          container: container,
          delegate: this
        });
        this._sc_hitTestLayer = K.create({
          // `layout` is whatever the default on SC.Layer is
          isHitTestOnly: true,
          owner: this, // TODO: Do we need owner here?
          container: container,
          delegate: this
        });
      }

      // Only delete layout if it is not a computed property. This allows 
      // the computed property on the prototype to shine through.
      if (typeof layout !== "function" || !layout.isProperty) {
        // console.log('deleting layout');
        delete this.layout;
      }
    } else {
      this._sc_layer = K.create({
        // `layout` is whatever the default on SC.Layer is
        owner: this, // TODO: Do we need owner here?
        container: container,
        delegate: this
      });
      this._sc_hitTestLayer = K.create({
        // `layout` is whatever the default on SC.Layer is
        isHitTestOnly: true,
        owner: this, // TODO: Do we need owner here?
        container: container,
        delegate: this
      });
    }

    this.notifyPropertyChange('layer');
    this.notifyPropertyChange('hitTestLayer');
  },

  destroySurface: function() {
    console.log('SC.ViewSurface#destroySurface()');
  },

  // ..........................................................
  // CONTENT VIEW SUPPORT
  //

  contentView: null,

  _sc_contentView: null,
  _sc_contentViewDidChange: function() {
    // console.log('SC.ViewSurface#_sc_contentViewDidChange()');
    var old = this._sc_contentView,
        cur = this.get('contentView'),
        layer = this.get('layer');

    if (cur && cur.isViewClass) {
      this.set('contentView', cur.create());
      return;
    }

    sc_assert(old === null || old.kindOf(SC.View), "Blossom internal error: SC.Application^_sc_contentView is invalid.");
    sc_assert(cur === null || cur.kindOf(SC.View), "SC.Application@ui must either be null or an SC.View instance.");

    if (old === cur) return; // Nothing to do.

    if (old) old.set('surface', null);
    if (cur) cur.set('surface', this);

    this.displayDidChange();
  }.observes('contentView')

});

} // BLOSSOM