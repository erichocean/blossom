// ==========================================================================
// Project:   Blossom - Modern, Cross-Platform Application Framework
// Copyright: ©2012 Fohr Motion Picture Studios. All rights reserved.
// License:   Licensed under the GPLv3 license (see BLOSSOM-LICENSE).
// ==========================================================================
/*globals sc_assert formatter linebreak */

sc_require('layers/layer');

var base3 =  "#fdf6e3";
var base03 = "#002b36";

SC.LabelLayer = SC.Layer.extend({

  isLabelLayer: true, // Walk like a duck.

  displayProperties: 'value'.w(),

  // FIXME: Add more text properties.
  font: "11pt Helvetica, sans",
  color: base03,
  backgroundColor: base3,
  textAlign: 'left',

  _sc_textPropertiesDidChange: function() {
    this.__needsTextLayout__ = true;
    var surface = this.get('surface');
    if (surface) surface.triggerLayoutAndRendering();
  }.observes('font', 'color', 'backgroundColor', 'textBaseline'),

  value: null, // should be a String or null

  _sc_value: null,
  _sc_valueDidChange: function() {
    var value = this.get('value');
    if (value !== this._sc_value) {
      this._sc_value = value;
      if (value) {
        this.__needsTextLayout__ = true;
        var surface = this.get('surface');
        if (surface) surface.triggerLayoutAndRendering();
      }
    }
  }.observes('value'),

  updateTextLayout: function(context) {
    // console.log('SC.LabelLayer#updateTextLayout()');
    var str = String(this.get('value') || ''),
        width;

    this.__needsTextLayout__ = false;
    sc_assert(context);

    width = context.measureText(str).width;
    this.get('frame').width = width;
  },

  render: function(ctx) {
    // console.log('SC.LabelLayer#render()');
    var str = String(this.get('value') || ''),
        bounds = this.get('bounds'),
        w = bounds.width, h = bounds.height,
        textAlign = this.get('textAlign');

    sc_assert(!this.__needsTextLayout__);

    ctx.fillStyle = this.get('backgroundColor');
    ctx.fillRect(0, 0, w, h);

    ctx.textAlign = textAlign;
    ctx.font = this.get('font');
    ctx.fillStyle = this.get('color');

    if (textAlign === 'left') ctx.fillText(str, 0, h/2);
    else if (textAlign === 'right') ctx.fillText(str, w, h/2);
    else /*textAlign === 'center'*/ ctx.fillText(str, w/2, h/2);
  },

  init: function() {
    arguments.callee.base.apply(this, arguments);
    this._sc_valueDidChange();
  }

});
