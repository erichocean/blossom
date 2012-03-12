// ==========================================================================
// Project:   SproutCore - JavaScript Application Framework
// Copyright: ©2006-2011 Strobe Inc. and contributors.
//            Portions ©2008-2010 Apple Inc. All rights reserved.
//            Code within if (BLOSSOM) {} sections is ©2012 Fohr Motion 
//            Picture Studios. All rights reserved.
// License:   Most code licensed under MIT license (see SPROUTCORE-LICENSE).
//            Code within if (BLOSSOM) {} sections is under GPLv3 license
//            (see BLOSSOM-LICENSE).
// ==========================================================================
/*globals sc_assert */

/** @class

  Provides common methods for sending events down a responder chain.
  Responder chains are used most often to deliver events to user interface
  elements in your application, but you can also use them to deliver generic
  events to any part of your application, including controllers.

  @extends SC.Object
  @since SproutCore 1.0
*/
SC.Responder = SC.Object.extend( /** SC.Responder.prototype */ {

  isResponder: true, // Walk like a duck.
  
  /** @property
    Set to true if your responder is willing to accept first responder status.
    This is used when calculcating the key responder loop.
  */
  acceptsFirstResponder: true

});

SC.Responder = SC.Responder.extend( /** SC.Responder.prototype */ {

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
  nextResponder: null,
  
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
