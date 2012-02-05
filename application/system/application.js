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
/*globals SPROUTCORE BLOSSOM sc_assert */

sc_require('mixins/responder_context');

if (BLOSSOM) {

/** @class
  The root object for a SproutCore application.  Usually you will create a 
  single SC.Application instance as your root namespace.

  h1. Event Types

  Applications can route four types of events:

  - Direct events, such as mouse and touch events.  These are routed to the
    nearest view managing the target DOM elment. RootResponder also handles
    multitouch events so that they are delegated to the correct views.
  - Keyboard events. These are sent to the keyPane, which will then send the
    event to the current firstResponder and up the responder chain.
  - Resize events. When the viewport resizes, these events will be sent to all
    panes.
  - Keyboard shortcuts. Shortcuts are sent to the keyPane first, which
    will go down its view hierarchy. Then they go to the mainPane, which will
    go down its view hierarchy.
  - Actions. Actions are generic messages that your application can send in
    response to user action or other events. You can either specify an
    explicit target, or allow the action to traverse the hierarchy until a
    view is found that handles it.

  @extends SC.Responder
  @since Blossom 1.0
*/
SC.Application = SC.Responder.extend(
/** SC.Application.prototype */ {

  isResponderContext: true, // We can dispatch events and actions.

  /**
    Contains a list of all panes currently visible on screen.  Everytime a
    pane attaches or detaches, it will update itself in this array.
  */
  panes: null,
  
  init: function() {
    arguments.callee.base.apply(this, arguments);
    this.panes = SC.Set.create();
    sc_assert(SC.app === undefined, "You can only create one instance of SC.Application");
    SC.app = this;

    // FIXME: Use SC.app, not SC.RootResponder.responder throughout Blossom.
    SC.RootResponder = { responder: this };

    SC.ready(function() { SC.app.setup(); });
  },

  // .......................................................
  // MAIN PANE
  //

  /** @property
    The main pane.  This pane receives shortcuts and actions if the
    focusedPane does not respond to them.  There can be only one main pane.
    You can swap main panes by calling makeMainPane() here.

    Usually you will not need to edit the main pane directly.  Instead, you
    should use a MainPane subclass, which will automatically make itself main
    when you append it to the document.
  */
  mainPane: null,

  /**
    Swaps the main pane.  If the current main pane is also the key pane, then
    the new main pane will also be made key view automatically.  In addition
    to simply updating the mainPane property, this method will also notify the
    panes themselves that they will lose/gain their mainView status.

    Note that this method does not actually change the Pane's place in the
    document body.  That will be handled by the Pane itself.

    @param {SC.Pane} pane
    @returns {SC.RootResponder} receiver
  */
  makeMainPane: function(pane) {
    var currentMain = this.get('mainPane') ;
    if (currentMain === pane) return this ; // nothing to do

    this.beginPropertyChanges() ;

    // change key focus if needed.
    if (this.get('keyPane') === currentMain) this.makeKeyPane(pane) ;

    // change setting
    this.set('mainPane', pane) ;

    // notify panes.  This will allow them to remove themselves.
    if (currentMain) currentMain.blurMainTo(pane) ;
    if (pane) pane.focusMainFrom(currentMain) ;

    this.endPropertyChanges() ;
    return this ;
  },

  // ..........................................................
  // MENU PANE
  //

  /**
    The current menu pane. This pane receives keyboard events before all other
    panes, but tends to be transient, as it is only set when a pane is open.

    @type SC.MenuPane
  */
  menuPane: null,

  /**
    Sets a pane as the menu pane. All key events will be directed to this
    pane, but the current key pane will not lose focus.

    Usually you would not call this method directly, but allow instances of
    SC.MenuPane to manage the menu pane for you. If your pane does need to
    become menu pane, you should relinquish control by calling this method
    with a null parameter. Otherwise, key events will always be delivered to
    that pane.

    @param {SC.MenuPane} pane
    @returns {SC.RootResponder} receiver
  */
  makeMenuPane: function(pane) {
    // Does the specified pane accept being the menu pane?  If not, there's
    // nothing to do.
    if (pane  &&  !pane.get('acceptsMenuPane')) {
      return this;
    } else {
      var currentMenu = this.get('menuPane');
      if (currentMenu === pane) return this; // nothing to do

      this.set('menuPane', pane);
    }

    return this;
  },

  // .......................................................
  // KEY PANE
  //

  /**
    The current key pane. This pane receives keyboard events, shortcuts, and
    actions first, unless a menu is open. This pane is usually the highest
    ordered pane or the mainPane.

    @type SC.Pane
  */
  keyPane: null,

  /** @property
    A stack of the previous key panes.

    *IMPORTANT: Property is not observable*
  */
  previousKeyPanes: [],

  /**
    Makes the passed pane the new key pane.  If you pass null or if the pane
    does not accept key focus, then key focus will transfer to the previous
    key pane (if it is still attached), and so on down the stack.  This will
    notify both the old pane and the new root View that key focus has changed.

    @param {SC.Pane} pane
    @returns {SC.RootResponder} receiver
  */
  makeKeyPane: function(pane) {
    // Was a pane specified?
    var newKeyPane, previousKeyPane, previousKeyPanes;

    if (pane) {
      // Does the specified pane accept being the key pane?  If not, there's
      // nothing to do.
      if (!pane.get('acceptsKeyPane')) {
        return this ;
      } else {
        // It does accept key pane status?  Then push the current keyPane to
        // the top of the stack and make the specified pane the new keyPane.
        // First, though, do a sanity-check to make sure it's not already the
        // key pane, in which case we have nothing to do.
        previousKeyPane = this.get('keyPane') ;
        if (previousKeyPane === pane) {
          return this ;
        } else {
          if (previousKeyPane) {
            previousKeyPanes = this.get('previousKeyPanes') ;
            previousKeyPanes.push(previousKeyPane) ;
          }

          newKeyPane = pane ;
        }
      }
    } else {
      // No pane was specified?  Then pop the previous key pane off the top 
      // of the stack and make it the new key pane, assuming that it's still
      // attached and accepts key pane (its value for acceptsKeyPane might
      // have changed in the meantime).  Otherwise, we'll keep going up the
      // stack.
      previousKeyPane = this.get('keyPane') ;
      previousKeyPanes = this.get('previousKeyPanes') ;

      newKeyPane = null ;
      while (previousKeyPanes.length > 0) {
        var candidate = previousKeyPanes.pop();
        if (candidate.get('isPaneAttached') && candidate.get('acceptsKeyPane')) {
          newKeyPane = candidate ;
          break ;
        }
      }
    }

    // If we found an appropriate candidate, make it the new key pane.
    // Otherwise, make the main pane the key pane (if it accepts it).
    if (!newKeyPane) {
      var mainPane = this.get('mainPane') ;
      if (mainPane && mainPane.get('acceptsKeyPane')) newKeyPane = mainPane;
    }

    // Now notify old and new key views of change after edit.
    if (previousKeyPane) previousKeyPane.willLoseKeyPaneTo(newKeyPane);
    if (newKeyPane) newKeyPane.willBecomeKeyPaneFrom(previousKeyPane);

    this.set('keyPane', newKeyPane) ;

    if (newKeyPane) newKeyPane.didBecomeKeyPaneFrom(previousKeyPane);
    if (previousKeyPane) previousKeyPane.didLoseKeyPaneTo(newKeyPane);

    return this ;
  },

  // ..........................................................
  // VIEWPORT STATE
  //

  /**
    The last known window size.
    @type Rect
    @isReadOnly
  */
  currentWindowSize: null,

  /**
    Computes the window size from the DOM.

    @returns Rect
  */
  computeWindowSize: function() {
    return {
      width: window.innerWidth,
      height: window.innerHeight
    };
  },

  /**
    Indicates whether or not the window currently has focus.  If you need
    to do something based on whether or not the window is in focus, you can
    setup a binding or observer to this property.  Note that SproutCore
    automatically adds an sc-focus or sc-blur CSS class to the body tag as
    appropriate.  If you only care about changing the appearance of your
    controls, you should use those classes in your CSS rules instead.
  */
  hasFocus: NO,

  dragDidStart: function(drag) {
    this._sc_mouseDownView = drag ;
    this._sc_drag = drag ;
  },

  // .......................................................
  // ACTIONS
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
    @returns {Boolean} YES if action was performed, NO otherwise
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
    var pane, ret;

    SC.run(function() {
      // get the target pane
      if (target) pane = target.get('pane') ;
      else pane = this.get('menuPane') || this.get('keyPane') || this.get('mainPane') ;

      // if we found a valid pane, send the event to it
      ret = (pane) ? pane.sendEvent(action, evt, target) : null ;
    }, this);

    return ret ;
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
    @returns {SC.RootResponder} receiver
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
  // KEYBOARD HANDLING
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
      evt.isIMEInput = YES;
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

    return (changed) ? (this.sendEvent('flagsChanged', evt) ? evt.hasCustomEventHandling : YES) : YES ;
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
  
    return (handler) ? evt.hasCustomEventHandling : YES ;
  },

  _sc_lastHovered: null,

  // these methods are used to prevent unnecessary text-selection in IE,
  // there could be some more work to improve this behavior and make it
  // a bit more useful; right now it's just to prevent bugs when dragging
  // and dropping.

  _sc_mouseCanDrag: YES,

  selectstart: function(evt) {
    var targetView = this.targetViewForEvent(evt),
        result = this.sendEvent('selectStart', evt, targetView);

    // If the target view implements mouseDragged, then we want to ignore the
    // 'selectstart' event.
    if (targetView && targetView.respondsTo('mouseDragged')) {
      return (result !==null ? YES: NO) && !this._sc_mouseCanDrag;
    }
    else {
      return (result !==null ? YES: NO);
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

    return view ? evt.hasCustomEventHandling : YES;
  },

  webkitAnimationIteration: function(evt) {
    try {
      var view = this.targetViewForEvent(evt) ;
      this.sendEvent('animationDidIterate', evt, view) ;
    } catch (e) {
      console.warn('Exception during animationDidIterate: %@'.fmt(e)) ;
      throw e;
    }

    return view ? evt.hasCustomEventHandling : YES;
  },

  webkitAnimationEnd: function(evt) {
    try {
      var view = this.targetViewForEvent(evt) ;
      this.sendEvent('animationDidEnd', evt, view) ;
    } catch (e) {
      console.warn('Exception during animationDidEnd: %@'.fmt(e)) ;
      throw e;
    }

    return view ? evt.hasCustomEventHandling : YES;
  },

  /**
    Called when the document is ready to begin handling events.  Setup event
    listeners in this method that you are interested in observing for your
    particular platform.  Be sure to call arguments.callee.base.apply(this, arguments);.

    @returns {void}
  */
  setup: function() {
    // handle touch events
    this.listenFor('touchstart touchmove touchend touchcancel'.w(), document);

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

    // do some initial set
    this.set('currentWindowSize', this.computeWindowSize()) ;
    this.focus(); // assume the window is focused when you load.
  },

  /**
    Handle window focus.  Change hasFocus and add sc-focus CSS class
    (removing sc-blur).  Also notify panes.
  */
  focus: function() { 
    if (!this.get('hasFocus')) this.set('hasFocus', true);
    return true; // allow default
  },
  
  /**
    Handle window focus.  Change hasFocus and add sc-focus CSS class (removing
    sc-blur).  Also notify panes.
  */
  blur: function() {
    if (this.get('hasFocus')) this.set('hasFocus', false);
    return false; // allow default
  },

  /**
    Finds the view that appears to be targeted by the passed event.  This only
    works on events with a valid target property.

    @param {SC.Event} evt
    @returns {SC.View} view instance or null
  */
  targetViewForEvent: function(evt) {
    // FIXME: this only works for panes for now...
    var pane = evt.target ? SC.View.views[evt.target.id] : null,
        ret = pane? pane.targetViewForEvent(evt) : null ;
    
    // console.log('target', ret);
    return ret;
  },

  /**
    On window resize, notifies panes of the change.

    @returns {Boolean}
  */
  resize: function() {
    var oldSize = this.get('currentWindowSize'),
        newSize = this.computeWindowSize();

    this.set('currentWindowSize', newSize);

    if (!SC.rectsEqual(newSize, oldSize)) {
      this.panes.invoke('windowSizeDidChange', oldSize, newSize);
    }

    return YES; // Allow normal processing to continue.
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
    if (SC.none(evt)) return YES;

    var keyCode = evt.keyCode,
        isFirefox = SC.isMozilla();

    // Fix for IME input (japanese, mandarin).
    // If the KeyCode is 229 wait for the keyup and
    // trigger a keyDown if it is is enter onKeyup.
    if (keyCode===229){
      this._IMEInputON = YES;
      return this.sendEvent('keyDown', evt);
    }

    // If user presses the escape key while we are in the middle of a
    // drag operation, cancel the drag operation and handle the event.
    if (keyCode === 27 && this._sc_drag) {
      this._sc_drag.cancelDrag();
      this._sc_drag = null;
      this._sc_mouseDownView = null;
      return YES;
    }

    // Firefox does NOT handle delete here...
    if (isFirefox && (evt.which === 8)) return true ;

    // modifier keys are handled separately by the 'flagsChanged' event
    // send event for modifier key changes, but only stop processing if this
    // is only a modifier change
    var ret = this._sc_handleModifierChanges(evt),
        target = evt.target || evt.srcElement,
        forceBlock = (evt.which === 8) && !SC.allowsBackspaceToPreviousPage && (target === document.body);

    if (this._sc_isModifierKey(evt)) return (forceBlock ? NO : ret);

    // if this is a function or non-printable key, try to use this as a key
    // equivalent.  Otherwise, send as a keyDown event so that the focused
    // responder can do something useful with the event.
    ret = YES ;
    if (this._sc_isFunctionOrNonPrintableKey(evt)) {
      // Otherwise, send as keyDown event.  If no one was interested in this
      // keyDown event (probably the case), just let the browser do its own
      // processing.

      // Arrow keys are handled in keypress for firefox
      if (keyCode>=37 && keyCode<=40 && isFirefox) return YES;


      ret = this.sendEvent('keyDown', evt) ;

      // attempt key equivalent if key not handled
      if (!ret) {
        ret = !this.attemptKeyEquivalent(evt) ;
      } else {
        ret = evt.hasCustomEventHandling ;
        if (ret) forceBlock = NO ; // code asked explicitly to let delete go
      }
    }

    return forceBlock ? NO : ret ;
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
      return ret ? (SC.allowsBackspaceToPreviousPage || evt.hasCustomEventHandling) : YES ;

    // normal processing.  send keyDown for printable keys...
    //there is a special case for arrow key repeating of events in FF.
    } else {
      var isFirefoxArrowKeys = (keyCode >= 37 && keyCode <= 40 && isFirefox),
          charCode           = evt.charCode;
      if ((charCode !== undefined && charCode === 0) && !isFirefoxArrowKeys) return YES;
      if (isFirefoxArrowKeys) evt.which = keyCode;
      return this.sendEvent('keyDown', evt) ? evt.hasCustomEventHandling:YES;
    }
  },

  /**
    IE's default behavior to blur textfields and other controls can only be
    blocked by returning NO to this event. However we don't want to block
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
    //   if (view && view.get('blocksIEDeactivate')) return NO;
    // }
    return YES;
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
    if (view) fr = view.getPath('pane.firstResponder');
    if (fr && fr.kindOf(SC.InlineTextFieldView) && fr !== view) {
      fr.resignFirstResponder();
    }

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

} // BLOSSOM

if (SPROUTCORE) {

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

} // SPROUTCORE
