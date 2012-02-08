// ==========================================================================
// Project:   Blossom - Modern, Cross-Platform Application Framework
// Copyright: ©2012 Fohr Motion Picture Studios. All rights reserved.
// License:   Licensed under the GPLv3 license (see BLOSSOM-LICENSE).
// ==========================================================================
/*globals BLOSSOM sc_assert */

sc_require('surfaces/surface');
sc_require('surfaces/transitions/surface_transition');

if (BLOSSOM) {

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
    console.log('SC.ViewSurface#createSurface()');
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

  updateSurface: function() {
    console.log('SC.ViewSurface#updateSurface()');
    sc_assert(document.getElementById(this.__sc_element__.id));
    this.render(this.getPath('layer.context'));
  },

  // ..........................................................
  // CONTENT VIEW SUPPORT
  //

  contentView: null,

  _sc_contentView: null,
  _sc_contentViewDidChange: function() {
    // console.log('SC.ViewSurface#_sc_contentViewDidChange()');
    var old = this._sc_contentView,
        cur = this.get('_sc_contentView');

    sc_assert(old === null || old.kindOf(SC.View), "Blossom internal error: SC.Application^_sc_contentView is invalid.");
    sc_assert(cur === null || cur.kindOf(SC.View), "SC.Application@ui must either be null or an SC.View instance.");

    if (old === cur) return; // Nothing to do.

    this.displayDidChange();
  }.observes('contentView')

});

} // BLOSSOM