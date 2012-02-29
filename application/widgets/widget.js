// ==========================================================================
// Project:   Blossom - Modern, Cross-Platform Application Framework
// Copyright: ©2012 Fohr Motion Picture Studios. All rights reserved.
// License:   Licensed under the GPLv3 license (see BLOSSOM-LICENSE).
// ==========================================================================
/*globals BLOSSOM CanvasRenderingContext2D HTMLCanvasElement
  ENFORCE_BLOSSOM_2DCONTEXT_API sc_assert */

sc_require('layers/layer');

if (BLOSSOM) {

// NOTE: Keep this in sync with SC.Responder's implementation.
SC.Widget = SC.Layer.extend({

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
    responder will have its `isKeyboardResponder` property set to true.
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
  }

});

} // BLOSSOM