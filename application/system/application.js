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

sc_require('mixins/responder_context');
sc_require('ext/float32');
sc_require('surfaces/surface');
sc_require('surfaces/container');
sc_require('surfaces/transitions/surface_transition');

if (BLOSSOM) {

/** @class
  This class is the brains behind a Blossom application.  You must create 
  exactly one instance of `SC.Application` somewhere in your code.  
  This instance will be available to you at `SC.app` automatically:

      SC.Application.create(); // instance is stored at `SC.app`

  You can also store it there explicitly:

      SC.app = SC.Application.create(); // also okay

  Managing Surfaces
  -----------------

  `SC.Application` manages the surfaces that are present in your app's 
  viewport at any given time.  To add a surface to the viewport, do:

      SC.app.addSurface(aSurface);

  To remove a surface from the viewport, do:

      SC.app.removeSurface(aSurface);

  You can also modify the `surfaces` property directly:

      SC.app.get('surfaces').add(aSurface);
      SC.app.get('surfaces').remove(aSurface);

  Surfaces added to the `surfaces` set, or using `add|removeSurface` play no 
  special role in the application.  You can also add surfaces for particular 
  roles, the most common of which is the `ui` role:

      SC.app.set('ui', aSurface);

  The surface representing the app's user interface ("ui") has its layout set 
  to the viewport automatically.  (This surface is *not* added to the app's 
  `surfaces` set, and it is removed if it's there.)  (You should not add the 
  `ui` surface to the `surfaces` set later; doing so will result in an 
  assertion failure.)

  You can also assign an `inputSurface` that receives text input events 
  before the `ui` surface is given a chance to respond:

      SC.app.set('inputSurface', aSurface);

  A `menuSurface` receives text input and keyboard shortcuts before both the 
  `inputSurface` and `ui` surface have had a chance to respond:

      SC.app.set('menuSurface', aSurface);

  See "Dispatching Events" below for detailed documentation on how these 
  surfaces are used by `SC.Application`.

  If you remove a surface that is currently either the `menuSurface` or the 
  `inputSurface`, that surface will be removed and the corresponding property 
  set to null.

  Dispatching Events
  ------------------

  `SC.Application` routes five kinds of events to surfaces:

  - **Mouse events.**  These are routed to the surface the event occured on.
  - **Input events.**  These are sent to the `inputSurface`.
  - **Viewport events.** When the viewport resizes, each surface will have 
    its `viewportSizeDidChange` method called, if it implements it.
  - **Keyboard shortcuts.**  Shortcuts are first sent to the `menuSurface`, 
    if it exists.  If unhandled, the `inputSurface` is a given a chance to 
    act on the shortcut.  Finally, if the shortcut is still unhandled, the 
    `ui` surface will be given a chance to handle it.
  - **Actions.**  Actions are generic messages that your application can send 
    in response to user action or other events. You can either specify a 
    responder to target, or if not specified, the `ui` surface's 
    `firstResponder` is made the target.  The target is then given the chance 
    to handle the action, and if not handled, the action moves up the 
    responder chain until a responder is found that does handle it.

  Animated UI Transitions
  -----------------------

  When the `ui` property is set, one of three animated transitions will 
  apply. See the documentation for the `ui` property for more information on 
  how to configure these animations, or turn them off completely.

  @extends SC.Responder
  @extends SC.DelegateSupport
  @since Blossom 1.0
*/
SC.Application = SC.Responder.extend(SC.DelegateSupport,
/** SC.Application.prototype */ {

  isApp: true, // Walk like a duck.
  isResponderContext: true, // We can dispatch events and actions.

  init: function() {
    arguments.callee.base.apply(this, arguments);

    this.set('surfaces', SC.Set.create());
    sc_assert(SC.app === undefined, "You can only create one instance of SC.Application.");
    SC.app = this;

    SC.ready(this, function() {
      this.awake();
      this._sc_perspectiveDidChange();
      this._sc_uiDidChange();
    });
  },

  // .......................................................
  // LAYOUT AND RENDERING
  //

  _sc_didRequestLayoutAndRendering: false,
  requestLayoutAndRendering: function() {
    // console.log('SC.Application#requestLayoutAndRendering()');
    if (!this._sc_didRequestLayoutAndRendering) {
      this._sc_didRequestLayoutAndRendering = true;
      SC.RequestAnimationFrame(function(timestamp) {
        // console.log('SC.RequestAnimationFrame() - callback');
        SC.app._sc_performLayoutAndRendering(timestamp);
      });
    }
  },

  _sc_performLayoutAndRendering: function(timestamp) {
    // console.log('SC.Application#_sc_performLayoutAndRendering()');
    sc_assert(SC.app === this, "SC.Application#_sc_performLayoutAndRendering() called with this != SC.app.");
    sc_assert(this._sc_didRequestLayoutAndRendering, "SC.Application#_sc_performLayoutAndRendering() called when layout and rendering was not requested.");
    sc_assert(!SC.isAnimating, "SC.Application#_sc_performLayoutAndRendering() called when SC.isAnimating is true (should be false).");

    SC.isAnimating = true;
    this._sc_didRequestLayoutAndRendering = false;

    this.get('surfaces').invoke('performLayoutAndRenderingIfNeeded', timestamp);
    this.get('ui').performLayoutAndRenderingIfNeeded(timestamp);

    SC.isAnimating = false;
    sc_assert(!SC.RunLoop.currentRunLoop.flushApplicationQueues(), "The run loop should not be needed during layout and rendering.");
  },

  // .......................................................
  // SURFACE HANDLING
  //

  /** @property
    Contains the set of all surfaces currently present in the viewport, and 
    that are not in the process of being added or removed from the viewport.  
    You can add surfaces to this set directly, or use the `addSurface` and 
    `removeSurface` helpers, which do the same thing but also allow a surface 
    transition to be specified.

    You can also replace this set with an entirely new set of surfaces.  If 
    you do, the current `ui` surface will be automatically added to the set 
    if not already present.  For the `menuSurface` and `inputSurface`, these 
    properties will be set to `null` if the surface is *not* part of the new 
    surface set.  Any surfaces currently transitioning in or out of the 
    viewport will be removed immediately.

    When a surface is added, its `isPresentInViewport` property is set to 
    true, and when removed, it is set to false.

    @type SC.Set<SC.Surface>
  */
  surfaces: null,

  /**
    Adds a surface to the viewport.

    @param {SC.Surface} surface
    @param {SC.SurfaceTransition} transition (optional)
  */
  addSurface: function(surface) {
    var surfaces = this.get('surfaces');

    sc_assert(surface && surface.kindOf(SC.Surface));
    sc_assert(surface !== this.get('ui'), "Don't add SC.app@ui to the SC.app@surfaces set.");
    // sc_assert(!surfaces.contains(surface));

    surfaces.add(surface);
  },

  /**
    Removes a surface from the viewport.

    @param {SC.Surface} surface
    @param {SC.SurfaceTransition} transition (optional)
  */
  removeSurface: function(surface) {
    var surfaces = this.get('surfaces');

    sc_assert(surface && surface.kindOf(SC.Surface));
    // sc_assert(surfaces.contains(surface));

    surfaces.remove(surface);
  },

  /** @private */
  didAddItem: function(set, surface) {
    sc_assert(set === this.get('surfaces'));
    sc_assert(surface.kindOf(SC.Surface));
    sc_assert(surface !== this.get('ui'), "Don't add SC.app@ui to the SC.app@surfaces set.");

    surface.setIfChanged('isPresentInViewport', true);
    surface.setIfChanged('applicationHasFocus', this.get('hasFocus'));

    // Some surfaces are created before the application is created, and the 
    // _sc_firstResponderDidChange() method accesses the SC.app instance. To 
    // handle this, surfaces that are created before SC.app exists set their 
    // `__sc_needFirstResponderInit__` property to true, leaving us 
    // responsible for triggering the surface's _sc_firstResponderDidChange() 
    // method.
    if (surface.__sc_needFirstResponderInit__) {
      surface.__sc_needFirstResponderInit__ = false;
      surface._sc_firstResponderDidChange();
    }
  },

  /** @private */
  didRemoveItem: function(set, surface) {
    sc_assert(set === this.get('surfaces'));
    sc_assert(surface.kindOf(SC.Surface));
    sc_assert(surface !== this.get('ui'), "You must not remove the 'ui' surface directly. Set the 'ui' property to null instead.");

    surface.set('isPresentInViewport', false);

    // If we remove a surface that is currently the menuSurface or 
    // inputSurface, set the correspoding property to null.
    SC.Application.TRANSIENT_SURFACES.forEach(function(key) {
      if (this.get(key) === surface) this.set(key, null);
    }, this);
  },

  // When the surfaces property changes, we need to observe the new set for 
  // additions and removals.
  _sc_surfacesDidChange: function() {
    // console.log("SC.Surface#_sc_surfacesDidChange()");
    var cur  = this.get('surfaces'),
        last = this._sc_surfaces,
        ui = this.get('ui');
        
    if (last === cur) return this; // nothing to do

    sc_assert(cur && cur.isSet);

    // Tear down old set observer and update surface status.
    if (last) {
      last.removeSetObserver(this);
      last.forEach(function(surface) {
        this.didRemoveItem(surface);
      }, this);
    }

    // Save new set.
    this._sc_surfaces = cur;

    // `ui` should never be part of the `surfaces` set.
    if (ui && cur.contains(ui)) cur.remove(ui);

    // Set up new set observer and update their surface status.
    if (cur) {
      cur.addSetObserver(this);
      cur.forEach(function(surface) {
        this.didAddItem(surface);
      }, this);

      // `menuSurface` and `inputSurface` should be set to null if they are 
      // no longer present.
      SC.Application.TRANSIENT_SURFACES.forEach(function(key) {
        if (!cur.contains(this.get(key))) this.set(key, null);
      }, this);
    }
  }.observes('surfaces'),

  /** @property
    The 3D persective property for the app's UI. You can override this on 
    individual surfaces if you want; otherwise, the surface will exist in 
    the same 3D space as the `ui` surface.

    @type Integer
  */
  perspective: 1000,

  _sc_perspectiveDidChange: function() {
    var perspective = this.get('perspective');
    sc_assert(!isNaN(perspective));   // Must be a Number.
    sc_assert(perspective % 1 === 0); // Must be an Integer (can be negative).
    document.body.style.webkitPerspective = perspective+'px';
  }.observes('perspective'),

  // .......................................................
  // UI SURFACE
  //

  /** @property
    The app's user interface.  This surface receives shortcuts and actions if 
    the `menuSurface` does not respond to them, and the `inputSurface` does 
    not respond to them.  If will also receive text input events if a 
    separate `inputSurface` has not been defined; otherwise, it does not 
    receive text input events.

    The `ui` surface's parent layout is the size of the viewport.

    Animated, hardware-accelerated 3D transitions are available when changing 
    the 'ui' surface.  There are three possible transitions:

    - order in (defaults to SC.ENTER_LEFT)
    - replace (defaults to SC.SLIDE_FLIP_LEFT)
    - order out (defaults to SC.EXIT_RIGHT)

    You can change the type of transition for each of these situations, and 
    that transition will be used whenever your app's 'ui' surface is changed.

    @type SC.Surface or null
  */
  ui: null,

  uiOrderInTransition:  SC.ENTER_LEFT,
  uiReplaceTransition:  SC.SLIDE_FLIP_LEFT,
  uiOrderOutTransition: SC.EXIT_RIGHT,

  /** @private */
  uiContainer: function(key, value) {
    sc_assert(value === undefined); // We're read only.
    var uiContainer = this._sc_uiContainer;
    if (!uiContainer) {
      var uiElement = document.getElementById('ui');
      sc_assert(uiElement);

      // Don't bind the `ui` property, we need to send some delegate methods 
      // before the container sees the change to the `ui` property.
      uiContainer = this._sc_uiContainer = SC.ContainerSurface.create({
        __sc_element__: uiElement,
        bounds: this.computeViewportSize(),
        orderInTransitionBinding:  SC.Binding.from('uiOrderInTransition', this).oneWay().noDelay(),
        replaceTransitionBinding:  SC.Binding.from('uiReplaceTransition', this).oneWay().noDelay(),
        orderOutTransitionBinding: SC.Binding.from('uiOrderOutTransition', this).oneWay().noDelay(),

        viewportSizeDidChange: function(size) { this.set('bounds', size); }
      });

      uiContainer.set('isPresentInViewport', true);
    }
    return uiContainer;
  }.property(),

  _sc_ui: null, // Note: Required, we're strict about null checking.
  _sc_uiDidChange: function() {
    var old = this._sc_ui,
        cur = this.get('ui'),
        uiContainer = this.get('uiContainer');

    sc_assert(old === null || old.kindOf(SC.Surface), "Blossom internal error: SC.Application^_sc_ui is invalid.");
    sc_assert(cur === null || cur.kindOf(SC.Surface), "SC.Application@ui must either be null or an SC.Surface instance.");

    if (old === cur) return; // Nothing to do.

    if (old && old.willLoseUserInterfaceTo) {
      old.willLoseUserInterfaceTo(cur);
    }

    if (cur && cur.willBecomeUserInterfaceFrom) {
      cur.willBecomeUserInterfaceFrom(old);
    }

    this._sc_ui = cur;
    if (cur) this.removeSurface(cur);
    uiContainer.set('surface', cur);

    if (old && old.didLoseUserInterfaceTo) {
      old.didLoseUserInterfaceTo(cur);
    }

    if (cur && cur.didBecomeUserInterfaceFrom) {
      cur.didBecomeUserInterfaceFrom(old);
    }
  }.observes('ui'),

  // .......................................................
  // INPUT SURFACE
  //

  /**
    The current text input surface. This surface receives text input events, 
    shortcuts, and actions first, unless `menuSurface` is set, in which case 
    it only receives those events if the `menuSurface` does not handle them.  
    This surface is usually the highest ordered surface, or if not defined, 
    the `ui` surface will assume the input surface role automatically.

    @type SC.Surface or null
  */
  inputSurface: null,

  _sc_inputSurface : null, // Note: Required, we're strict about null checking.
  _sc_inputSurfaceDidChange: function() {
    var old = this._sc_inputSurface,
        cur = this.get('menuSurface');

    sc_assert(old === null || old.kindOf(SC.Surface), "Blossom internal error: SC.Application^_sc_inputSurface is invalid.");
    sc_assert(cur === null || cur.kindOf(SC.Surface), "SC.Application@inputSurface must either be null or an SC.Surface instance.");

    if (old === cur) return; // Nothing to do.

    if (old) old.willLoseInputSurfaceTo(cur);
    if (cur) cur.willBecomeInputSurfaceFrom(old);

    this._sc_inputSurface = cur;

    if (old) old.didLoseInputTo(cur);
    if (cur) cur.didBecomeInputFrom(old);
  }.observes('inputSurface'),

  // ..........................................................
  // MENU SURFACE
  //

  /**
    The current menu surface. This surface receives text input events before 
    any other surface, but tends to be transient, as it is usually only set 
    when a surface representing a "menu" is open.

    @type SC.Surface or null
  */
  menuSurface: null,

  _sc_menuSurface : null, // Note: Required, we're strict about null checking.
  _sc_menuSurfaceDidChange: function() {
    var old = this._sc_menuSurface,
        cur = this.get('menuSurface');

    sc_assert(old === null || old.kindOf(SC.Surface), "Blossom internal error: SC.Application^_sc_menuSurface is invalid.");
    sc_assert(cur === null || cur.kindOf(SC.Surface), "SC.Application@menuSurface must either be null or an SC.Surface instance.");

    if (old === cur) return; // Nothing to do.

    if (old) old.willLoseMenuSurfaceTo(cur);
    if (cur) cur.willBecomeMenuSurfaceFrom(old);

    this._sc_menuSurface = cur;

    if (old) old.didLoseMenuSurfaceTo(cur);
    if (cur) cur.didBecomeMenuSurfaceFrom(old);
  }.observes('menuSurface'),

  // ..........................................................
  // VIEWPORT STATE
  //

  /**
    The most-recently computed viewport size.  Calling `computeViewportSize` 
    updates this value, and `SC.Application` will also update this value 
    whenever a viewport change is detected.

    @type SC.Size
    @isReadOnly
  */
  viewportSize: SC.MakeSize(0,0),

  /**
    Computes the viewport size. Also notifies surfaces if the computed value 
    has changed.

    @returns SC.Size
  */
  computeViewportSize: function() {
    // TODO: Move to a shared buffer.
    var old = this.get('viewportSize'),
        cur = SC.MakeSize(window.innerWidth, window.innerHeight);

    if (!SC.EqualSize(old, cur)) {
      this.set('viewportSize', cur);
      this.get('surfaces').invoke('viewportSizeDidChange', cur);
      this.get('uiContainer').viewportSizeDidChange(cur);
    }
    return cur;
  },

  /** @private
    On viewport resize, notifies surfaces of the change.

    @returns {Boolean}
  */
  resize: function() {
    this.computeViewportSize();
    return true; // Allow normal processing to continue. FIXME: Is this correct?
  },

  // .......................................................
  // FOCUS & BLUR SUPPORT
  //

  /**
    Indicates whether or not the application currently has focus.  If you 
    need to do something based on whether or not the application has focus, 
    you can set up a binding or observer to this property.

    Surfaces will automatically have their `applicationHasFocus` property set 
    to this value when they are added, and whenever it changes.

    @type Boolean
  */
  hasFocus: false,

  /** @private
    Handles window focus events.  Also notifies surfaces.
  */
  focus: function() { 
    if (!this.get('hasFocus')) this.set('hasFocus', true);
    this.get('surfaces').invoke('set', 'applicationHasFocus', true);
    this.get('uiContainer').set('applicationHasFocus', true);
    return true; // allow default
  },
  
  /** @private
    Handles window blur events.  Also notifies surfaces.
  */
  blur: function() {
    if (this.get('hasFocus')) this.set('hasFocus', false);
    this.get('surfaces').invoke('set', 'applicationHasFocus', false);
    this.get('uiContainer').set('applicationHasFocus', false);
    return false; // allow default
  },

  // .......................................................
  // ACTION HANDLING
  //

  /**
    Set this to a delegate object that can respond to actions as they are sent
    down the responder chain.

    @type SC.Object
  */
  defaultResponder: null,

  /**
    Route an action message to the appropriate responder.  This method will
    walk the responder chain, attempting to find a responder that implements
    the action name you pass to this method.  Set 'target' to null to search
    the responder chain.

    IMPORTANT: This method's API and implementation will likely change
    significantly after SproutCore 1.0 to match the version found in
    SC.ResponderContext.

    You generally should not call or override this method in your own
    applications.

    @param {String} action The action to perform - this is a method name.
    @param {SC.Responder} target object to set method to (can be null)
    @param {Object} sender The sender of the action
    @param {SC.Pane} pane optional pane to start search with
    @param {Object} context optional. only passed to ResponderContexts
    @returns {Boolean} true if action was performed, false otherwise
    @test in targetForAction
  */
  sendAction: function( action, target, sender, pane, context) {
    target = this.targetForAction(action, target, sender, pane) ;

    // HACK: If the target is a ResponderContext, forward the action.
    if (target && target.isResponderContext) {
      return !!target.sendAction(action, sender, context);
    } else return target && target.tryToPerform(action, sender);
  },

  _sc_responderFor: function(target, methodName) {
    var defaultResponder = target ? target.get('defaultResponder') : null;

    if (target) {
      target = target.get('firstResponder') || target;
      do {
        if (target.respondsTo(methodName)) return target ;
      } while ((target = target.get('nextResponder'))) ;
    }

    // HACK: Eventually we need to normalize the sendAction() method between
    // this and the ResponderContext, but for the moment just look for a
    // ResponderContext as the defaultResponder and return it if present.
    if (typeof defaultResponder === SC.T_STRING) {
      defaultResponder = SC.objectForPropertyPath(defaultResponder);
    }

    if (!defaultResponder) return null;
    else if (defaultResponder.isResponderContext) return defaultResponder;
    else if (defaultResponder.respondsTo(methodName)) return defaultResponder;
    else return null;
  },

  /**
    Attempts to determine the initial target for a given action/target/sender
    tuple.  This is the method used by sendAction() to try to determine the
    correct target starting point for an action before trickling up the
    responder chain.

    You send actions for user interface events and for menu actions.

    This method returns an object if a starting target was found or null if no
    object could be found that responds to the target action.

    Passing an explicit target or pane constrains the target lookup to just
    them; the defaultResponder and other panes are *not* searched.

    @param {Object|String} target or null if no target is specified
    @param {String} method name for target
    @param {Object} sender optional sender
    @param {SC.Pane} optional pane
    @returns {Object} target object or null if none found
  */
  targetForAction: function(methodName, target, sender, pane) {

    // 1. no action, no target...
    if (!methodName || typeof methodName !== "string") {
      return null;
    }

    // 2. an explicit target was passed...
    if (target) {
      if (typeof target === 'string') {
        target = SC.objectForPropertyPath(target) || 
                 SC.objectForPropertyPath(target, sender);
      }

      if (target && !target.isResponderContext) {
        if (typeof target.respondsTo === 'function' && !target.respondsTo(methodName)) {
          target = null;
        } else if (typeof target[methodName] !== 'function') {
          target = null;
        }
      }

      return target ;
    }

    // 3. an explicit pane was passed...
    if (pane) return this._sc_responderFor(pane, methodName);

    // 4. no target or pane passed... try to find target in the active panes
    // and the defaultResponder
    var keyPane = this.get('keyPane'), mainPane = this.get('mainPane') ;

    // ...check key and main panes first
    if (keyPane) {
      target = this._sc_responderFor(keyPane, methodName);
    }
    if (!target && mainPane && (mainPane !== keyPane)) {
      target = this._sc_responderFor(mainPane, methodName);
    }

    // ...still no target? check the defaultResponder...
    if (!target && (target = this.get('defaultResponder'))) {
      if (typeof target === 'string') {
        target = SC.objectForPropertyPath(target) ;
        if (target) this.set('defaultResponder', target) ; // cache if found
      }
      if (target && !target.isResponderContext) {
        if (target.respondsTo && !target.respondsTo(methodName)) {
          target = null;
        } else if (SC.typeOf(target[methodName]) !== SC.T_FUNCTION) {
          target = null;
        }
      }
    }

    return target ;
  },

  /**
    Attempts to send an event down the responder chain.  This method will
    invoke the sendEvent() method on either the keyPane or on the pane owning
    the target view you pass in.  It will also automatically begin and end
    a new run loop.

    If you want to trap additional events, you should use this method to
    send the event down the responder chain.

    @param {String} action
    @param {SC.Event} evt
    @param {Object} target
    @returns {Object} object that handled the event or null if not handled
  */
  sendEvent: function(action, evt, target) {
    // console.log('SC.Application#sendEvent(', action, evt, target, ')');
    var surface, ret;

    // SC.run(function() {
      // get the target pane
      if (target) {
        surface = target.get('surface') ;
        if (!surface) surface = target.get('container') ;
      }
      else surface = this.get('menuSurface') || this.get('inputSurface') || this.get('ui') ;

      // if we found a valid pane, send the event to it
      ret = (surface) ? surface.sendEvent(action, evt, target) : null ;
    // }, this);

    return ret;
  },

  // .......................................................
  // EVENT LISTENER SETUP
  //

  /**
    Default method to add an event listener for the named event.  If you simply
    need to add listeners for a type of event, you can use this method as
    shorthand.  Pass an array of event types to listen for and the element to
    listen in.  A listener will only be added if a handler is actually installed
    on the RootResponder (or receiver) of the same name.

    @param {Array} keyNames
    @param {Element} target
    @param {Object} receiver - optional if you don't want 'this'
    @returns {SC.Application} receiver
  */
  listenFor: function(keyNames, target, receiver) {
    receiver = receiver ? receiver : this;
    keyNames.forEach(function(keyName) {
      var method = receiver[keyName] ;
      if (method) SC.Event.add(target, keyName, receiver, method);
    }, this);
    target = null; // avoid memory leak
    return receiver;
  },

  // ..........................................................
  // TEXT INPUT & KEYBOARD HANDLING
  //

  keyup: function(evt) {
    // to end the simulation of keypress in firefox set the _ffevt to null
    if (this._ffevt) this._ffevt = null;

    // Modifier keys are handled separately by the 'flagsChanged' event.
    // Send event for modifier key changes, but stop processing if this is 
    // only a modifier change.
    var ret = this._sc_handleModifierChanges(evt);
    if (this._sc_isModifierKey(evt)) return ret;

    // Fix for IME input (japanese, mandarin). If the KeyCode is 229 wait for 
    // the keyup and trigger a keyDown if it is enter onKeyup.
    if (this._IMEInputON && evt.keyCode === 13) {
      evt.isIMEInput = true;
      this.sendEvent('keyDown', evt);
      this._IMEInputON = false;
    }

    return this.sendEvent('keyUp', evt) ? evt.hasCustomEventHandling : true ;
  },

  /**
    Invoked on a keyDown event that is not handled by any actual value.  This
    will get the key equivalent string and then walk down the keyPane, then
    the focusedPane, then the mainPane, looking for someone to handle it.
    Note that this will walk DOWN the view hierarchy, not up it like most.

    @returns {Object} Object that handled evet or null
  */
  attemptKeyEquivalent: function(evt) {
    var ret = null ;

    // `keystring` is a method name representing the keys pressed (i.e
    // 'alt_shift_escape')
    var keystring = evt.commandCodes()[0];

    // Couldn't build a keystring for this key event, nothing to do.
    if (!keystring) return false;

    var menuPane = this.get('menuPane'),
        keyPane  = this.get('keyPane'),
        mainPane = this.get('mainPane');

    if (menuPane) {
      ret = menuPane.performKeyEquivalent(keystring, evt) ;
      if (ret) return ret;
    }

    // Try the keyPane.  If it's modal, then try the equivalent there but on
    // nobody else.
    if (keyPane) {
      ret = keyPane.performKeyEquivalent(keystring, evt) ;
      if (ret || keyPane.get('isModal')) return ret ;
    }

    // if not, then try the main pane
    if (!ret && mainPane && (mainPane!==keyPane)) {
      ret = mainPane.performKeyEquivalent(keystring, evt);
      if (ret || mainPane.get('isModal')) return ret ;
    }

    return ret ;
  },

  _sc_lastModifiers: null,

  /** @private
    Modifier key changes are notified with a keydown event in most browsers.
    We turn this into a flagsChanged keyboard event.  Normally this does not
    stop the normal browser behavior.
  */
  _sc_handleModifierChanges: function(evt) {
    // if the modifier keys have changed, then notify the first responder.
    var m;
    m = this._sc_lastModifiers = (this._sc_lastModifiers || { alt: false, ctrl: false, shift: false });

    var changed = false;
    if (evt.altKey !== m.alt) { m.alt = evt.altKey; changed=true; }
    if (evt.ctrlKey !== m.ctrl) { m.ctrl = evt.ctrlKey; changed=true; }
    if (evt.shiftKey !== m.shift) { m.shift = evt.shiftKey; changed=true;}
    evt.modifiers = m; // save on event

    return (changed) ? (this.sendEvent('flagsChanged', evt) ? evt.hasCustomEventHandling : true) : true ;
  },

  /** @private
    Determines if the keyDown event is a nonprintable or function key. These
    kinds of events are processed as keyboard shortcuts.  If no shortcut
    handles the event, then it will be sent as a regular keyDown event.
  */
  _sc_isFunctionOrNonPrintableKey: function(evt) {
    return !!(evt.altKey || evt.ctrlKey || evt.metaKey || ((evt.charCode !== evt.which) && SC.FUNCTION_KEYS[evt.which]));
  },

  /** @private
    Determines if the event simply reflects a modifier key change.  These
    events may generate a flagsChanged event, but are otherwise ignored.
  */
  _sc_isModifierKey: function(evt) {
    return !!SC.MODIFIER_KEYS[evt.charCode];
  },

  // ..........................................................
  // MOUSE HANDLING
  //

  mousewheel: function(evt) {
    var view = this.targetViewForEvent(evt) ,
        handler = this.sendEvent('mouseWheel', evt, view) ;
  
    return (handler) ? evt.hasCustomEventHandling : true ;
  },

  _sc_lastHovered: null,

  // these methods are used to prevent unnecessary text-selection in IE,
  // there could be some more work to improve this behavior and make it
  // a bit more useful; right now it's just to prevent bugs when dragging
  // and dropping.

  _sc_mouseCanDrag: true,

  selectstart: function(evt) {
    var targetView = this.targetViewForEvent(evt),
        result = this.sendEvent('selectStart', evt, targetView);

    // If the target view implements mouseDragged, then we want to ignore the
    // 'selectstart' event.
    if (targetView && targetView.respondsTo('mouseDragged')) {
      return (result !==null ? true: false) && !this._sc_mouseCanDrag;
    }
    else {
      return (result !==null ? true: false);
    }
  },

  drag: function() { return false; },

  contextmenu: function(evt) {
    var view = this.targetViewForEvent(evt) ;
    return this.sendEvent('contextMenu', evt, view);
  },

  // ..........................................................
  // ANIMATION HANDLING
  //

  webkitAnimationStart: function(evt) {
    try {
      var view = this.targetViewForEvent(evt) ;
      this.sendEvent('animationDidStart', evt, view) ;
    } catch (e) {
      console.warn('Exception during animationDidStart: %@'.fmt(e)) ;
      throw e;
    }

    return view ? evt.hasCustomEventHandling : true;
  },

  webkitAnimationIteration: function(evt) {
    try {
      var view = this.targetViewForEvent(evt) ;
      this.sendEvent('animationDidIterate', evt, view) ;
    } catch (e) {
      console.warn('Exception during animationDidIterate: %@'.fmt(e)) ;
      throw e;
    }

    return view ? evt.hasCustomEventHandling : true;
  },

  webkitAnimationEnd: function(evt) {
    try {
      var view = this.targetViewForEvent(evt) ;
      this.sendEvent('animationDidEnd', evt, view) ;
    } catch (e) {
      console.warn('Exception during animationDidEnd: %@'.fmt(e)) ;
      throw e;
    }

    return view ? evt.hasCustomEventHandling : true;
  },

  /**
    Called when the document is ready to begin handling events.  Setup event
    listeners in this method that you are interested in observing for your
    particular platform.  Be sure to call arguments.callee.base.apply(this, arguments);.

    @returns {void}
  */
  awake: function() {
    // console.log('SC.Application#awake()');
    // handle touch events
    // this.listenFor('touchstart touchmove touchend touchcancel'.w(), document);

    // handle basic events
    this.listenFor('keydown keyup beforedeactivate mousedown mouseup click mousemove selectstart contextmenu'.w(), document);
    this.listenFor('resize'.w(), window);
        
    // if ((/msie/).test(navigator.userAgent.toLowerCase())) this.listenFor('focusin focusout'.w(), document);
    // else {
      this.listenFor('focus blur'.w(), window);
    // }

    // handle animation events
    this.listenFor('webkitAnimationStart webkitAnimationIteration webkitAnimationEnd'.w(), document);
    
    // handle special case for keypress- you can't use normal listener to block the backspace key on Mozilla
    if (this.keypress) {
      if (SC.CAPTURE_BACKSPACE_KEY && SC.browser.mozilla) {
        var responder = this ;
        document.onkeypress = function(e) {
          e = SC.Event.normalizeEvent(e);
          return responder.keypress.call(responder, e);
        };

        // SC.Event.add(window, 'unload', this, function() { document.onkeypress = null; }); // be sure to cleanup memory leaks

      // Otherwise, just add a normal event handler.
      } else SC.Event.add(document, 'keypress', this, this.keypress);
    }

    // handle these two events specially in IE
    'drag selectstart'.w().forEach(function(keyName) {
      var method = this[keyName] ;
      if (method) {
        // if (SC.browser.msie) {
        //   var responder = this ;
        //   document.body['on' + keyName] = function(e) {
        //     // return method.call(responder, SC.Event.normalizeEvent(e));
        //     return method.call(responder, SC.Event.normalizeEvent(event || window.event)); // this is IE :(
        //   };
        // 
        //   // be sure to cleanup memory leaks
        //    SC.Event.add(window, 'unload', this, function() {
        //     document.body['on' + keyName] = null;
        //   });
        // 
        // } else {
          SC.Event.add(document, keyName, this, method);
        // }
      }
    }, this);

    SC.Event.add(document, 'mousewheel', this, this.mousewheel);

    // If the browser is identifying itself as a touch-enabled browser, but
    // touch events are not present, assume this is a desktop browser doing
    // user agent spoofing and simulate touch events automatically.
    // if (SC.browser && SC.platform && SC.browser.mobileSafari && !SC.platform.touch) {
    //   SC.platform.simulateTouchEvents();
    // }

    // Do some initial set up.
    this.computeViewportSize();
    this.focus();
  },

  /**
    Finds the view that appears to be targeted by the passed event.  This only
    works on events with a valid target property.

    @param {SC.Event} evt
    @returns {SC.View} view instance or null
  */
  targetViewForEvent: function(evt) {
    // console.log('SC.Application#targetViewForEvent()');
    // FIXME: this only works for panes for now...
    // debugger;
    // var surface = evt.target ? SC.Surface.surfaces[evt.target.id] : null,
    //     ret = surface? surface.targetViewForEvent(evt) : null ;

    var parentNode = evt.target, id, ret, surfaces = SC.Surface.surfaces;

    while (parentNode && !ret) {
      id = parentNode.id;
      if (id) ret = surfaces[id];
      parentNode = parentNode.parentNode;
    }

    ret = ret? ret.targetViewForEvent(evt) : null;
    return ret;
  },

  // ..........................................................
  // KEYBOARD HANDLING
  //

  /** @private
    The keydown event occurs whenever the physically depressed key changes.
    This event is used to deliver the flagsChanged event and to with function
    keys and keyboard shortcuts.

    All actions that might cause an actual insertion of text are handled in
    the keypress event.
  */
  keydown: function(evt) {
    if (SC.none(evt)) return true;

    var keyCode = evt.keyCode,
        isFirefox = SC.isMozilla();

    // Fix for IME input (japanese, mandarin).
    // If the KeyCode is 229 wait for the keyup and
    // trigger a keyDown if it is is enter onKeyup.
    if (keyCode===229){
      this._IMEInputON = true;
      return this.sendEvent('keyDown', evt);
    }

    // If user presses the escape key while we are in the middle of a
    // drag operation, cancel the drag operation and handle the event.
    if (keyCode === 27 && this._sc_drag) {
      this._sc_drag.cancelDrag();
      this._sc_drag = null;
      this._sc_mouseDownView = null;
      return true;
    }

    // Firefox does NOT handle delete here...
    if (isFirefox && (evt.which === 8)) return true ;

    // modifier keys are handled separately by the 'flagsChanged' event
    // send event for modifier key changes, but only stop processing if this
    // is only a modifier change
    var ret = this._sc_handleModifierChanges(evt),
        target = evt.target || evt.srcElement,
        forceBlock = (evt.which === 8) && !SC.allowsBackspaceToPreviousPage && (target === document.body);

    if (this._sc_isModifierKey(evt)) return (forceBlock ? false : ret);

    // if this is a function or non-printable key, try to use this as a key
    // equivalent.  Otherwise, send as a keyDown event so that the focused
    // responder can do something useful with the event.
    ret = true ;
    if (this._sc_isFunctionOrNonPrintableKey(evt)) {
      // Otherwise, send as keyDown event.  If no one was interested in this
      // keyDown event (probably the case), just let the browser do its own
      // processing.

      // Arrow keys are handled in keypress for firefox
      if (keyCode>=37 && keyCode<=40 && isFirefox) return true;


      ret = this.sendEvent('keyDown', evt) ;

      // attempt key equivalent if key not handled
      if (!ret) {
        ret = !this.attemptKeyEquivalent(evt) ;
      } else {
        ret = evt.hasCustomEventHandling ;
        if (ret) forceBlock = false ; // code asked explicitly to let delete go
      }
    }

    return forceBlock ? false : ret ;
  },

  /** @private
    The keypress event occurs after the user has typed something useful that
    the browser would like to insert.  Unlike keydown, the input codes here
    have been processed to reflect that actual text you might want to insert.

    Normally ignore any function or non-printable key events.  Otherwise, just
    trigger a keyDown.
  */
  keypress: function(evt) {
    var ret,
        keyCode   = evt.keyCode,
        isFirefox = SC.isMozilla();

    // delete is handled in keydown() for most browsers
    if (isFirefox && (evt.which === 8)) {
      //get the keycode and set it for which.
      evt.which = keyCode;
      ret = this.sendEvent('keyDown', evt);
      return ret ? (SC.allowsBackspaceToPreviousPage || evt.hasCustomEventHandling) : true ;

    // normal processing.  send keyDown for printable keys...
    //there is a special case for arrow key repeating of events in FF.
    } else {
      var isFirefoxArrowKeys = (keyCode >= 37 && keyCode <= 40 && isFirefox),
          charCode           = evt.charCode;
      if ((charCode !== undefined && charCode === 0) && !isFirefoxArrowKeys) return true;
      if (isFirefoxArrowKeys) evt.which = keyCode;
      return this.sendEvent('keyDown', evt) ? evt.hasCustomEventHandling:true;
    }
  },

  /**
    IE's default behavior to blur textfields and other controls can only be
    blocked by returning false to this event. However we don't want to block
    its default behavior otherwise textfields won't loose focus by clicking on 
    an empty area as it's expected. If you want to block IE from bluring another 
    control set blockIEDeactivate to true on the especific view in which you 
    want to avoid this. Think of an autocomplete menu, you want to click on 
    the menu but don't loose focus. 
  */
  beforedeactivate: function(evt) {
    // var toElement = evt.toElement;
    // if (toElement && toElement.tagName && toElement.tagName!=="IFRAME") {
    //   var view = SC.$(toElement).view()[0];
    //   //The following line is neccesary to allow/block text selection for IE,
    //   // in combination with the selectstart event.
    //   if (view && view.get('blocksIEDeactivate')) return false;
    // }
    return true;
  },

  // ..........................................................
  // MOUSE HANDLING
  //

  /**
    mouseUp only gets delivered to the view that handled the mouseDown evt.
    we also handle click and double click notifications through here to
    ensure consistant delivery.  Note that if mouseDownView is not
    implemented, then no mouseUp event will be sent, but a click will be
    sent.
  */
  mouseup: function(evt) {
    if (this._sc_drag) {
      this._sc_drag.tryToPerform('mouseUp', evt);
      this._sc_drag = null;
      // FIXME: Shouldn't we return at this point?
    }

    var handler = null, view = this._sc_mouseDownView,
        targetView = this.targetViewForEvent(evt);

    this._sc_lastMouseUpAt = Date.now(); // Why not evt.timeStamp?

    // record click count.
    evt.clickCount = this._sc_clickCount;

    // Attempt a mouseup call only when there is a target. We don't want a 
    // mouseup going to anyone unless they also handled the mousedown.
    if (view) {
      handler = this.sendEvent('mouseUp', evt, view);

      // Didn't handle it, try doubleClick.
      if (!handler && (this._sc_clickCount === 2)) {
        handler = this.sendEvent('doubleClick', evt, view);
      }

      // Hmm. Try single click.
      if (!handler) {
        handler = this.sendEvent('click', evt, view);
      }
    }

    // Try whoever's under the mouse if we haven't handle the mouse up yet.
    if (!handler) {

      // Try doubleClick.
      if (this._sc_clickCount === 2) {
        handler = this.sendEvent('doubleClick', evt, targetView);
      }

      // No handler, try singleClick.
      if (!handler) {
        handler = this.sendEvent('click', evt, targetView);
      }
    }

    // cleanup
    this._sc_mouseCanDrag = false;
    this._sc_mouseDownView = null;

    return (handler) ? evt.hasCustomEventHandling : true ;
  },

  mousedown: function(evt) {
    // console.log('SC.Application#mousedown()');
    // if(!SC.browser.msie) window.focus();
    window.focus();
    
    // First, save the click count. The click count resets if the mouse down
    // event occurs more than 200 ms later than the mouse up event or more
    // than 8 pixels away from the mouse down event.
    this._sc_clickCount++;
    if (!this._sc_lastMouseUpAt || ((Date.now()-this._sc_lastMouseUpAt) > 200)) {
      this._sc_clickCount = 1;
    } else {
      var deltaX = this._sc_lastMouseDownX - evt.clientX,
          deltaY = this._sc_lastMouseDownY - evt.clientY,
          distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      if (distance > 8.0) this._sc_clickCount = 1;
    }

    evt.clickCount = this._sc_clickCount;

    this._sc_lastMouseDownX = evt.clientX;
    this._sc_lastMouseDownY = evt.clientY;

    var fr, view = this.targetViewForEvent(evt);

    // HACK: InlineTextField needs to loose firstResponder whenever you click 
    // outside the view.  This is a special case as textfields are not 
    // supposed to loose focus unless you click on a list, another textfield 
    // or on a special view/control.
    // if (view) fr = view.getPath('pane.firstResponder');
    // if (fr && fr.kindOf(SC.InlineTextFieldView) && fr !== view) {
    //   fr.resignFirstResponder();
    // }

    view = this._sc_mouseDownView = this.sendEvent('mouseDown', evt, view);
    if (view && view.respondsTo('mouseDragged')) this._sc_mouseCanDrag = true;

    return view ? evt.hasCustomEventHandling : true ;
  },

  /**
   This will send mouseEntered, mouseExited, mousedDragged and mouseMoved
   to the views you hover over.  To receive these events, you must implement
   the method. If any subviews implement them and return true, then you won't
   receive any notices.

   If there is a target mouseDown view, then mouse moved events will also
   trigger calls to mouseDragged.
  */
  mousemove: function(evt) {
    // We'll record the last positions in all browsers, in case a special pane
    // or some such UI absolutely needs this information.
    this._sc_lastMoveX = evt.clientX;
    this._sc_lastMoveY = evt.clientY;

    // only do mouse[Moved|Entered|Exited|Dragged] if not in a drag session
    // drags send their own events, e.g. drag[Moved|Entered|Exited]
    if (this._sc_drag) {
        this._sc_drag.tryToPerform('mouseDragged', evt);
    } else {
      var lh = this._sc_lastHovered || [] , nh = [] , exited, loc, len,
          view = this.targetViewForEvent(evt);

      // First, collect all the responding view starting with the target view 
      // from the given mouse move event.
      while (view && (view !== this)) {
        nh.push(view);
        view = view.get('nextResponder');
      }

      // Next, exit views that are no longer part of the responding chain.
      for (loc=0, len=lh.length; loc<len; ++loc) {
        view = lh[loc];
        exited = view.respondsTo('mouseExited');
        if (exited && nh.indexOf(view) === -1) {
          view.tryToPerform('mouseExited', evt);
        }
      }

      // Finally, either perform mouse moved or mouse entered depending on
      // whether a responding view was or was not part of the last hovered 
      // views.
      for (loc=0, len=nh.length; loc < len; loc++) {
        view = nh[loc];
        if (lh.indexOf(view) !== -1) {
          view.tryToPerform('mouseMoved', evt);
        } else {
          view.tryToPerform('mouseEntered', evt);
        }
      }

      // Keep track of the view that were last hovered.
      this._sc_lastHovered = nh;

      // Also, if a mouseDownView exists, call the mouseDragged action, if
      // it exists.
      if (this._sc_mouseDownView) {
        this._sc_mouseDownView.tryToPerform('mouseDragged', evt);
      }
    }
  }

});

SC.Application.TRANSIENT_SURFACES = 'menuSurface inputSurface'.w();

} // BLOSSOM

if (! BLOSSOM) {

/** @class

  The root object for a SproutCore application.  Usually you will create a 
  single SC.Application instance as your root namespace.  SC.Application is
  required if you intend to use SC.Responder to route events.
  
  h2. Example
  
  {{{
    Contacts = SC.Application.create({
      store: SC.Store.create(SC.Record.fixtures),
      
      // add other useful properties here
    });
  }}}

  h2. Sending Events
  
  You can send actions and events down an application-level responder chain
  by 
  
  @extends SC.ResponderContext
  @since SproutCore 1.0
*/
SC.Application = SC.Responder.extend(SC.ResponderContext,
/** SC.Application.prototype */ {

});

} // ! BLOSSOM
