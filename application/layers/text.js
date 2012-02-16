// ==========================================================================
// Project:   Blossom - Modern, Cross-Platform Application Framework
// Copyright: ©2012 Fohr Motion Picture Studios. All rights reserved.
// License:   Licensed under the GPLv3 license (see BLOSSOM-LICENSE).
// ==========================================================================
/*globals BLOSSOM */

sc_require('layers/layer');

SC.TextLayer = SC.Layer.extend({

  // FIXME: Add more text properties.
  font: "14px 'times new roman', 'FreeSerif', serif",
  textBaseline: 'top',

  value: null, // should be a String or null

  _sc_value: null,
  _sc_valueDidChange: function() {
    var value = this.get('value');
    if (value !== this._sc_value) {
      this._sc_value = value;
      this.set('needsTextLayout', true);
    }
  }.observes('value'),

  needsTextLayout: false,

  _sc_needsTextLayoutDidChange: function() {
    var surface = this.get('surface');
    if (surface && this.get('needsTextLayout')) {
      // debugger;
      surface.set('needsTextLayout', true);
    }
  }.observes('needsTextLayout'),

  initElement: function() {
    this._sc_valueDidChange();
  }

});
