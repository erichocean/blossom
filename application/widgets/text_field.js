// ==========================================================================
// Project:   Blossom - Modern, Cross-Platform Application Framework
// Copyright: ©2012 Fohr Motion Picture Studios. All rights reserved.
// License:   Licensed under the GPLv3 license (see BLOSSOM-LICENSE).
// ==========================================================================
/*globals BLOSSOM sc_assert */

sc_require('layers/text');

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

// NOTE: Keep this in sync with SC.Responder's implementation.
SC.TextFieldWidget = SC.TextLayer.extend(SC.DelegateSupport, {

  isWidget: true, // Walk like a duck.

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

  // ..........................................................
  // PRETEND WE'RE AN SC.RESPONDER SUBCLASS
  //

  isResponder: true,

  /** @property
    Set to true if your responder is willing to accept first responder status.
    This is used when calculcating the key responder loop.
  */
  acceptsFirstResponder: true,

  /** @property
    The surface this responder belongs to.  This is used to determine where 
    you belong to in the responder chain.  Normally you should leave this 
    property set to null.

    @type SC.Surface
  */
  surface: null,

  /** @property 
    True when the responder is currently the first responder.  This property 
    is always updated by a surface when its `firstResponder` property is set.

    @type {Boolean}
  */
  isFirstResponder: false,

  /** @property 
    True when the responder is currently the input responder.  This property 
    is always updated by a surface when its `firstResponder` property is set.

    @type {Boolean}
  */
  isInputResponder: false,

  /** @property 
    True when the responder is currently the menu responder.  This property 
    is always updated by a surface when its `firstResponder` property is set.

    @type {Boolean}
  */
  isMenuResponder: false,

  /** @property
    This is the nextResponder in the responder chain.  If the receiver does 
    not implement a particular event handler, it will bubble up to the next 
    responder.
  */
  nextResponder: function(key, val) {
    sc_assert(val === undefined, "This property is read-only.");
    var superlayer = this.get('superlayer');
    while (superlayer && !superlayer.isResponder) {
      superlayer = superlayer.get('superlayer');
    }
    return superlayer || null;
  }.property('superlayer'),

  /** 
    Call this method on your responder to make it become the first responder 
    in its surface.  If the surface is also the app's keyboard surface, the 
    responder will have its `isInputResponder` property set to true.
  */
  becomeFirstResponder: function() {  
    var surface = this.get('surface');
    if (surface && this.get('acceptsFirstResponder')) {
      if (surface.get('firstResponder') !== this) {
        surface.set('firstResponder', this);
      }
    }
  },

  /**
    Call this method on your responder to resign your first responder status. 
    Normally this is not necessary since you will lose first responder status 
    automatically when another responder becomes first responder.
  */
  resignFirstResponder: function() {
    var surface = this.get('surface');
    if (surface && surface.get('firstResponder') === this) {
      surface.set('firstResponder', null);
    }
  },

  lineHeight: 22,

  _sc_didBecomeInputResponder: function() {
    console.log('SC.TextFieldWidget#_sc_didBecomeInputResponder');
    if (this.get('isInputResponder')) {
      // Need to begin editing.  That involves retrieving the field editor 
      // for the application, configuring it correctly styling-wise and with 
      // the correct textual contents, and then placing it over ourself.  The
      // field editor is platform-native, although you interact with it 
      // within Blossom the same way on all platforms.
      var surface = this.get('surface');
      sc_assert(surface);
      sc_assert(surface.isLeafSurface);

      var fieldEditor = SC.app.get('fieldEditor');
      sc_assert(fieldEditor);
      
    }
  }.observes('isInputResponder'),

  mouseDown: function(evt) {
    SC.app.set('inputSurface', this.get('surface'));
    this.becomeFirstResponder();
    return false;
  },

  render: function(ctx) {
    var h = ctx.height,
        w = ctx.width,
        isEnabled = this.get('isEnabled');

    ctx.fillStyle = this.get('backgroundColor');
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.translate(4, 2);
    arguments.callee.base.apply(this, arguments);
    ctx.restore();

    ctx.globalAlpha = isEnabled? 1 : 0.5;

    // Draw the box.
    ctx.strokeStyle = base03;
    ctx.beginPath();
    ctx.moveTo(0.5, 0.5);
    ctx.lineTo(0.5, h-0.5);
    ctx.lineTo(w-0.5, h-0.5);
    ctx.lineTo(w-0.5, 0.5);
    ctx.closePath();
    ctx.lineWidth = 1;
    ctx.stroke();
  }

});

} // BLOSSOM