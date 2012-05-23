// ==========================================================================
// Project:   Blossom - Modern, Cross-Platform Application Framework
// Copyright: ©2012 Fohr Motion Picture Studios. All rights reserved.
// License:   Licensed under the GPLv3 license (see BLOSSOM-LICENSE).
// ==========================================================================
/*globals sc_assert formatter linebreak */

sc_require('widgets/widget');

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
var black =    "black";

SC.TextFieldWidget = SC.Widget.extend({

  displayProperties: 'value isEnabled'.w(),

  isTextField: true,

  acceptsFirstResponder: function() {
    var value = this.get('value'),
        isEnabled = this.get('isEnabled');

    return isEnabled || (value && String(value).length > 0);
  }.property('value'),

  // FIXME: Add more text properties.
  font: "10pt Helvetica, sans",
  color: base03,
  backgroundColor: base3,
  textBaseline: 'top',
  textAlign: 'left',
  tolerance: 10,
  lineHeight: 18,

  isSingleLine: false,

  isPassword: false,

  _sc_textPropertiesDidChange: function() {
    var surface = this.get('surface');
    if (surface) surface.triggerLayoutAndRendering();
  }.observes('font', 'color', 'backgroundColor', 'textBaseline',
             'textBaseline', 'tolerance', 'lineHeight'),

  value: null, // should be a String or null

  _sc_value: null,
  _sc_valueDidChange: function() {
    var value = this.get('value');
    if (value !== this._sc_value) {
      this._sc_value = value;
      var surface = this.get('surface');
      if (surface) surface.triggerLayoutAndRendering();
    }
  }.observes('value'),

  init: function() {
    arguments.callee.base.apply(this, arguments);
    this._sc_valueDidChange();
  },

  behavior: function(key, val) {
    sc_assert(val === undefined, "This property is read-only.");
    return this;
  }.property().cacheable(),

  // ..........................................................
  // IS ENABLED SUPPORT
  //

  /**
    Set to true when the item is enabled.   Note that changing this value
    will also alter the isVisibleInWindow property for this view and any
    child views.

    Note that if you apply the SC.Control mixin, changing this property will
    also automatically add or remove a 'disabled' CSS class name as well.

    This property is observable and bindable.

    @property {Boolean}
  */
  isEnabled: true,
  isEnabledBindingDefault: SC.Binding.oneWay().bool(),

  /** @private
    Observes the isEnabled property and resigns first responder if set to false.
    This will avoid cases where, for example, a disabled text field retains
    its focus rings.

    @observes isEnabled
  */
  _sc_isEnabledDidChange: function() {
    if (!this.get('isEnabled') && this.get('isFirstResponder')) {
      this.resignFirstResponder();
    }
  }.observes('isEnabled'),

  _sc_didBecomeInputResponder: function() {
    // console.log('SC.TextFieldWidget#_sc_didBecomeInputResponder');
    if (this.get('isInputResponder')) {
      if (this.get('isPassword')) {
        SC.OpenPasswordEditorFor(this);
      } else {
        SC.OpenFieldEditorFor(this);
      }
    }
  }.observes('isInputResponder'),

  mouseDown: function(evt) {
    // debugger;
    SC.app.set('inputSurface', this.get('surface'));
    if (!this.get('isFirstResponder')) this.becomeFirstResponder();
    else if (this.get('isInputResponder')) {
      if (this.get('isPassword')) {
        SC.OpenPasswordEditorFor(this);
      } else {
        SC.OpenFieldEditorFor(this);
      }
    }
    return true;
  },

  color: function() {
    return this.get('isEnabled')? black : 'white'; // 'rgba(0,43,54,0.5)';
  }.property('isEnabled'),

  backgroundColor: function() {
    return this.get('isEnabled')? white : 'rgba(70,70,70, 0.5)';
  }.property('isEnabled'),

  borderColor: function() {
    return this.get('isEnabled')? 'rgb(128,128,128)' : 'rgba(128,128,128,0.5)'; // ''rgba(0,43,54,0.5)';
  }.property('isEnabled'),

  borderWidth: 1,

  render: function(ctx) {
    var bounds = this.get('bounds'),
        h = bounds.height, w = bounds.width,
        isEnabled = this.get('isEnabled');

    ctx.fillStyle = this.get('backgroundColor');
    SC.CreateRoundRectPath(ctx, 0.5, 0.5, w-1, h-1, 5);
    ctx.fill();

    // Draw the text.
    ctx.textBaseline = this.get('textBaseline');
    ctx.font = this.get('font');
    ctx.fillStyle = this.get('color');
    var val = this.get('value');
    if (this.get('isPassword')) val = "\u2022".repeat(val.length);
    if (val && val.elide) val = val.elide(ctx, w - 23);
    ctx.fillText(val, 4, 3);

    // Draw the box.
    ctx.strokeStyle = this.get('borderColor');
    SC.CreateRoundRectPath(ctx, 0.5, 0.5, w-1, h-1, 5);
    ctx.lineWidth = this.get('borderWidth');
    ctx.stroke();
  },

  valueForFieldEditor: function() {
    return this.get('value');
  },

  computeSupersurface: function() {
    var surface = this.get('surface');
    sc_assert(surface);
    while (surface.isLeafSurface) surface = surface.get('supersurface');
    sc_assert(surface);
    return surface;
  },

  computeFrameInSupersurface: function() {
    // Determine our position relative to our immediate surface.  This is a 
    // little bit involved and involves a few levels of indirection.
    var surface = this.get('surface'),
        surfaceFrame = surface.get('frame'),
        textFrame = this.get('frame'),
        x = textFrame.x, y = textFrame.y,
        superlayer = this.get('superlayer'), frame;

    // `textFrame` must be expressed in the coordinate space of `surfaceFrame`
    // (its currently expressed in terms of its superlayer OR its surface). 
    // Walk up the layer tree until we no longer have a superlayer, taking into 
    // account the frames on the way up.
    var rootLayer = superlayer;
    while (superlayer) {
      rootLayer = superlayer;
      frame = superlayer.get('frame');
      x += frame.x;
      y += frame.y;
      superlayer = superlayer.get('superlayer');
    }

    // FIXME: Also need to take into account the accumulated layer transform.

    var rowOffsetForLayerTree = 0;
    if (surface.rowOffsetForLayerTree) rowOffsetForLayerTree = surface.rowOffsetForLayerTree(rootLayer);

    return SC.MakeRect(
        surfaceFrame.x + x,
        surfaceFrame.y + y + rowOffsetForLayerTree,
        textFrame.width,
        textFrame.height
      );
  },

  styleInputElement: function(input) {
    var style = input.style,
        frame = this.computeFrameInSupersurface();

    input.value = this.valueForFieldEditor();

    style.display = 'block';
    style.border  = this.get('borderWidth') + 'px';
    style.borderStyle = 'solid ';
    style.borderRadius = '5px';
    style.borderColor = this.get('isEnabled') ? 'rgb(252,188,126)' : 'grey'; // this.get('borderColor');
    style.font = this.get('font');
    style.textAlight = 'left';
    style.color = this.get('color');
    style.backgroundColor = this.get('isEnabled') ? this.get('backgroundColor') : 'rgb(70,70,70)';
    style.backgroundImage = 'none';
    style.outline = 'none'; // FIXME: This breaks other users of the field editor.
    if (this.get('isEnabled')) {
      style.boxShadow = '0px 0px 3px 1px ' + 'rgb(252,102,32)' + ', 0px 0px 1px 0px ' + 'rgb(128,128,128)' + ' inset';
    } else style.boxShadow = 'none';

    // Without the 'px' ending, these do nothing in WebKit.
    style.paddingTop = '0px';
    style.paddingLeft = '2px';
    style.paddingRight = '1px';
    style.top    = frame.y      + 'px';
    style.left   = frame.x      + 'px';
    style.width  = frame.width  + 'px';
    style.height = frame.height + 'px';
  },

  setSelectionForInputElement: function(input) {
    var value = String(this.get('value'));
    input.setSelectionRange(0, value? value.length : 0);
  }

});
