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
/*globals BLOSSOM sc_assert */

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

if (BLOSSOM) {

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

} // BLOSSOM

if (! BLOSSOM) {

/** @class

  Provides common methods for sending events down a responder chain.
  Responder chains are used most often to deliver events to user interface
  elements in your application, but you can also use them to deliver generic
  events to any part of your application, including controllers.

  @extends SC.Object
  @since SproutCore 1.0
*/
SC.Responder = SC.Responder.extend( /** SC.Responder.prototype */ {

  /** @property
    The pane this responder belongs to.  This is used to determine where you 
    belong to in the responder chain.  Normally you should leave this property
    set to null.
  */
  pane: null,
  
  /** @property
    The app this responder belongs to.  For non-user-interface responder 
    chains, this is used to determine the context.  Usually this
    is the property you will want to work with.
  */
  responderContext: null,
  
  /** @property
    This is the nextResponder in the responder chain.  If the receiver does 
    not implement a particular event handler, it will bubble to the next 
    responder.
    
    This can point to an object directly or it can be a string, in which case
    the path will be resolved from the responderContext root.
  */
  nextResponder: null,
  
  /** @property 
    true if the responder is currently the first responder.  This property is 
    always updated by a pane during its makeFirstResponder() method.

    @type {Boolean}
  */
  isFirstResponder: false,

  /** @property
  
    true the responder is somewhere in the responder chain.  This currently
    only works when used with a ResponderContext.
    
    @type {Boolean}
  */
  hasFirstResponder: false,    
  
  becomingFirstResponder: false,
  
  /** 
    Call this method on your view or responder to make it become first 
    responder.
    
    @returns {SC.Responder} receiver
  */
  becomeFirstResponder: function() {  
    var pane = this.get('pane') || this.get('responderContext') ||
              this.pane();
    if (pane && this.get('acceptsFirstResponder')) {
      if (pane.get('firstResponder') !== this) pane.makeFirstResponder(this);
    } 
    return this ;
  },
  
  /**
    Call this method on your view or responder to resign your first responder 
    status. Normally this is not necessary since you will lose first responder 
    status automatically when another view becomes first responder.
    
    @param {Event} the original event that caused this method to be called
    @returns {SC.Responder} receiver
  */
  resignFirstResponder: function(evt) {
    var pane = this.get('pane') || this.get('responderContext');
    if (pane && (pane.get('firstResponder') === this)) {
      pane.makeFirstResponder(null, evt);
    }
    return true;
  },

  /**
    Called just before the responder or any of its subresponder's are about to
    lose their first responder status.  The passed responder is the responder
    that is about to lose its status. 
    
    Override this method to provide any standard teardown when the first 
    responder changes.
    
    @param {SC.Responder} responder the responder that is about to change
    @returns {void}
  */
  willLoseFirstResponder: function(responder) {},
  
  /**
    Called just after the responder or any of its subresponder's becomes a 
    first responder.  
    
    Override this method to provide any standard setup when the first 
    responder changes.
    
    @param {SC.Responder} responder the responder that changed
    @returns {void}
  */
  didBecomeFirstResponder: function(responder) {}

});

} // ! BLOSSOM
