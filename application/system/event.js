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

sc_require('system/browser');

SC.MODIFIER_KEYS = {
  16:'shift', 17:'ctrl', 18: 'alt'
};

SC.FUNCTION_KEYS = {
  8: 'backspace',  9: 'tab',  13: 'return',  19: 'pause',  27: 'escape',  
  33: 'pageup', 34: 'pagedown', 35: 'end', 36: 'home', 
  37: 'left', 38: 'up', 39: 'right', 40: 'down', 44: 'printscreen', 
  45: 'insert', 46: 'delete', 112: 'f1', 113: 'f2', 114: 'f3', 115: 'f4', 
  116: 'f5', 117: 'f7', 119: 'f8', 120: 'f9', 121: 'f10', 122: 'f11', 
  123: 'f12', 144: 'numlock', 145: 'scrolllock'
} ;

SC.PRINTABLE_KEYS = {
  32: ' ', 48:"0", 49:"1", 50:"2", 51:"3", 52:"4", 53:"5", 54:"6", 55:"7",
  56:"8", 57:"9", 59:";", 61:"=", 65:"a", 66:"b", 67:"c", 68:"d", 69:"e",
  70:"f", 71:"g", 72:"h", 73:"i", 74:"j", 75:"k", 76:"l", 77:"m", 78:"n",
  79:"o", 80:"p", 81:"q", 82:"r", 83:"s", 84:"t", 85:"u", 86:"v", 87:"w",
  88:"x", 89:"y", 90:"z", 107:"+", 109:"-", 110:".", 188:",", 190:".",
  191:"/", 192:"`", 219:"[", 220:"\\", 221:"]", 222:"\""
} ;

/**
  The event class provides a simple cross-platform event class that is the 
  same on both web browsers and Blossom's native runtimes.
  
  SproutCore events implement the standard W3C event API as well as some 
  additional helper methods.

  @constructor
  @param {Event} originalEvent (optional)
  @returns {SC.Event} event instance
  
  @since SproutCore 1.0
*/
SC.Event = function(originalEvent) { 
  // Copy properties from original event, if passed in.
  if (originalEvent) {
    this.originalEvent = originalEvent ;
    var props = SC.Event._sc_props, idx = props.length, key;
    while(--idx >= 0) {
      key = props[idx] ;
      this[key] = originalEvent[key] ;
    }

    if (originalEvent.isBehaviorEvent) return this;
  }

  // Fix timeStamp property, if necessary.
  this.timeStamp = this.timeStamp || Date.now();

  // Fix target property, if necessary.
  // Fixes #1925 where srcElement might not be defined either
  if (!this.target) this.target = this.srcElement || document; 

  // Check if target is a textnode (Safari fix).
  if (this.target.nodeType === 3 ) this.target = this.target.parentNode;

  // Add relatedTarget, if necessary.
  if (!this.relatedTarget && this.fromElement) {
    this.relatedTarget = (this.fromElement === this.target) ? this.toElement : this.fromElement;
  }

  // Calculate pageX/Y if missing and clientX/Y available.
  if (SC.none(this.pageX) && !SC.none(this.clientX)) {
    sc_assert(false, 'SC.Event@pageX should always be defined in a Blossom-supported browser.');
    // var doc = document.documentElement, body = document.body;
    // this.pageX = this.clientX + (doc && doc.scrollLeft || body && body.scrollLeft || 0) - (doc.clientLeft || 0);
    // this.pageY = this.clientY + (doc && doc.scrollTop || body && body.scrollTop || 0) - (doc.clientTop || 0);
  }

  // Add which property for key events.
  if (!this.which && ((this.charCode || originalEvent.charCode === 0) ? this.charCode : this.keyCode)) {
    this.which = this.charCode || this.keyCode;
  }

  // Add metaKey to non-Mac browsers (use ctrl for PC's and Meta for Macs).
  if (!this.metaKey && this.ctrlKey) this.metaKey = this.ctrlKey;

  // Add which for click: 1 == left; 2 == middle; 3 == right.
  // Note: button is not normalized, so don't use it.
  if (!this.which && this.button) {
    this.which = ((this.button & 1) ? 1 : ((this.button & 2) ? 3 : ( (this.button & 4) ? 2 : 0 ) ));
  }
  
  // Normalize wheel delta values for mousewheel events.
  // if (this.type === 'mousewheel' || this.type === 'DOMMouseScroll') {
  //   var deltaMultiplier = 1,
  //       version = parseFloat(SC.browser.version);
  // 
  //   // normalize wheelDelta, wheelDeltaX, & wheelDeltaY for Safari
  //   if (SC.browser.safari && originalEvent.wheelDelta!==undefined) {
  //     this.wheelDelta = 0-(originalEvent.wheelDeltaY || originalEvent.wheelDeltaX);
  //     this.wheelDeltaY = 0-(originalEvent.wheelDeltaY||0);
  //     this.wheelDeltaX = 0-(originalEvent.wheelDeltaX||0);
  // 
  //     // Scrolling in Safari 5.0.1, which is huge for some reason
  //     if (version >= 533.17 && version <= 533.19) {
  //       deltaMultiplier = 0.004;
  // 
  //     // Scrolling in Safari 5.0
  //     } else if (version < 533 || version >= 534) {
  //       deltaMultiplier = 40;
  //     }
  // 
  //   // normalize wheelDelta for Firefox
  //   // note that we multiple the delta on FF to make it's acceleration more 
  //   // natural.
  //   } else if (!SC.none(originalEvent.detail)) {
  //     deltaMultiplier = 10;
  //     if (originalEvent.axis && (originalEvent.axis === originalEvent.HORIZONTAL_AXIS)) {
  //       this.wheelDeltaX = originalEvent.detail;
  //       this.wheelDeltaY = this.wheelDelta = 0;
  //     } else {
  //       this.wheelDeltaY = this.wheelDelta = originalEvent.detail ;
  //       this.wheelDeltaX = 0 ;
  //     }
  // 
  //   // handle all other legacy browser
  //   } else {
  //     this.wheelDelta = this.wheelDeltaY = SC.browser.msie ? 0-originalEvent.wheelDelta : originalEvent.wheelDelta ;
  //     this.wheelDeltaX = 0 ;
  //   }
  // 
  //   this.wheelDelta *= deltaMultiplier;
  //   this.wheelDeltaX *= deltaMultiplier;
  //   this.wheelDeltaY *= deltaMultiplier;
  // }

  return this; 
} ;

SC.mixin(SC.Event, /** @scope SC.Event */ {

  /** @private
    Standard method to create a new event.  Pass the native browser event you
    wish to wrap if needed.
  */
  create: function(e) { return new SC.Event(e); },

  // the code below was borrowed from jQuery, Dean Edwards, and Prototype.js
  
  /** @private
    Bind an event to an element.

    This method will cause the passed handler to be executed whenever a
    relevant event occurs on the named element.  This method supports a
    variety of handler types, depending on the kind of support you need.

    Simple Function Handlers
    ------------------------

    Example:

        SC.Event.add(anElement, 'click', myClickHandler);

    The most basic type of handler you can pass is a function.  This function
    will be executed everytime an event of the type you specify occurs on the
    named element.  You can optionally pass an additional context object which
    will be included on the event in the event.data property.

    When your handler function is called the, the function's "this" property
    will point to the element the event occurred on.

    The click handler for this method must have a method signature like:

        function(event) { return true|false; }

    Method Invocations
    ------------------

        SC.Event.add(anElement, "click", myObject, myObject.aMethod) ;

    Optionally you can specify a target object and a method on the object to 
    be invoked when the event occurs.  This will invoke the method function
    with the target object you pass as "this".  The method should have a 
    signature like:

        function(event, targetElement) { return true|false; }

    Like function handlers, you can pass an additional context data paramater
    that will be included on the event in the event.data property.

    Handler Return Values
    ---------------------

    Both handler functions should return true if you want the event to 
    continue to propagate and false if you want it to stop.  Returning false will
    both stop bubbling of the event and will prevent any default action 
    taken by the browser.  You can also control these two behaviors separately
    by calling the stopPropagation() or preventDefault() methods on the event
    itself, returning true from your method.

    @param {Element} elem a DOM element, window, or document object
    @param {String} eventType the event type you want to respond to
    @param {Object} target The target object for a method call or a function.
    @param {Object} method optional method or method name if target passed
    @param {Object} context optional context to pass to the handler as event.data
  */
  add: function(elem, eventType, target, method, context) {
    // Must be given an `elem` param.
    sc_assert(elem);

    // Cannot register events on text nodes, etc.
    sc_assert(elem.nodeType !== 3 && elem.nodeType !== 8);

    // For whatever reason, IE has trouble passing the window object around, 
    // causing it to be cloned in the process
    // if (SC.browser.msie && elem.setInterval) elem = window;

    // If target is a function, treat it as the method, with optional context.
    if (typeof target === 'function') {
      sc_assert(!target.isClass);
      context = method; method = target; target = null;

    // Handle case where passed method is a key on the target.
    } else if (target && typeof method === 'string') {
      method = target[method];
    }

    // Get the handlers queue for this element/eventType.  If the queue does
    // not exist yet, create it and also set up the shared listener for this
    // eventType.
    var events = SC.data(elem, "events") || SC.data(elem, "events", {}) ,
        handlers = events[eventType]; 

    if (!handlers) {
      handlers = events[eventType] = {} ;
      this._sc_addEventListener(elem, eventType) ;
    }

    // Build the handler array and add to queue.
    handlers[SC.hashFor(target, method)] = [target, method, context];
    SC.Event._sc_global[eventType] = true ; // optimization for global triggers

    // Nullify elem to prevent memory leaks in IE.
    // elem = events = handlers = null ;
  },

  /** @private
    Removes a specific handler or all handlers for an event or event+type.

    To remove a specific handler, you must pass in the same function or the
    same target and method as you passed into SC.Event.add().  See that method
    for full documentation on the parameters you can pass in.

    If you omit a specific handler but provide both an element and eventType,
    then all handlers for that element will be removed.  If you provide only
    and element, then all handlers for all events on that element will be
    removed.

    @param {Element} elem a DOM element, window, or document object
    @param {String} eventType the event type to remove
    @param {Object} target The target object for a method call.  Or a function.
    @param {Object} method optional name of method
  */
  remove: function(elem, eventType, target, method) {
    // Must be given an `elem` param.
    sc_assert(elem);

    // Cannot unregister events on text nodes, etc.
    sc_assert(elem.nodeType !== 3 && elem.nodeType !== 8);

    // For whatever reason, IE has trouble passing the window object around, 
    // causing it to be cloned in the process.
    // if (SC.browser.msie && elem.setInterval) elem = window;

    var handlers, key, events = SC.data(elem, "events");
    if (!events) return; // nothing to do if no events are registered

    // If no type is provided, remove all types for this element.
    if (eventType === undefined) {
      for (eventType in events) this.remove(elem, eventType);

    // Otherwise, remove the handler for this specific eventType if found.
    } else if (handlers = events[eventType]) {
      var cleanupHandlers = false;

      // If a target/method is provided, remove only that one.
      if (target || method) {

        // Normalize the target/method.
        if (typeof target === 'function') {
          sc_assert(!target.isClass);
          method = target; target = null ;
        } else if (target && typeof method === 'string') {
          method = target[method];
        }

        delete handlers[SC.hashFor(target, method)];

        // Check to see if there are handlers left on this event/eventType.
        // If not, then cleanup the handlers.
        key = null;
        for (key in handlers) break;
        if (key===null) cleanupHandlers = true;

      // Otherwise, just cleanup all the handlers.
      } else cleanupHandlers = true;
      
      // If there are no more handlers left on this event type, remove 
      // eventType hash from queue.
      if (cleanupHandlers) {
        delete events[eventType];
        this._sc_removeEventListener(elem, eventType);
      }
      
      // Verify that there are still events registered on this element.  If 
      // there aren't, cleanup the element completely to avoid memory leaks.
      key = null ;
      for (key in events) break;
      if (!key) {
        SC.removeData(elem, "events") ;
        delete this._sc_elements[SC.guidFor(elem)]; // avoid memory leaks
      }
    }
    
    elem = events = handlers = null ; // avoid memory leaks
  },

  false_BUBBLE: ['blur', 'focus', 'change'],
  
  /** @private
    Generates a simulated event object.  This is mostly useful for unit 
    testing.  You can pass the return value of this property into the 
    `trigger()` method to actually send the event.
    
    @param {Element} elem the element the event targets
    @param {String} eventType event type.  mousedown, mouseup, etc
    @param {Hash} attrs optional additonal attributes to apply to event.
    @returns {Hash} simulated event object
  */
  simulateEvent: function(elem, eventType, attrs) {
    var ret = SC.Event.create({
      type: eventType,
      target: elem,
      preventDefault: function() { this.cancelled = true; },
      stopPropagation: function() { this.bubbles = false; },
      allowDefault: function() { this.hasCustomEventHandling = true; },
      timeStamp: Date.now(),
      bubbles: (this.false_BUBBLE.indexOf(eventType) < 0),
      cancelled: false,
      normalized: true
    });
    if (attrs) SC.mixin(ret, attrs);
    return ret;
  },
  
  /** @private
    Trigger an event execution immediately.  You can use this method to 
    simulate arbitrary events on arbitary elements:

        SC.Event.trigger(view.get('layer'), 'mousedown');

    @param elem {Element} the target element
    @param eventType {String} the event type
    @param args {Array} optional argument or arguments to pass to handler.
    @param donative ??
    @returns {Boolean} Return value of trigger or undefined if not fired
  */
  trigger: function(elem, eventType, args, donative) {
    // Must be given an `elem` param.
    sc_assert(elem);

    // Cannot trigger events on text nodes, etc.
    sc_assert(elem.nodeType !== 3 && elem.nodeType !== 8);

    // Normalize to an array
    args = SC.A(args);

    var ret, fn = typeof (elem[eventType] || null) === 'function',
        event, current, onfoo, isClick;

    // Get the event to pass, creating a fake one if necessary.
    event = args[0];
    if (!event || !event.preventDefault) {
      event = this.simulateEvent(elem, eventType);
      args.unshift(event);
    }
  
    event.type = eventType;
    
    // Trigger the event - bubble if enabled
    current = elem;
    do {
      ret = SC.Event.handle.apply(current, args);
      current = (current===document) ? null : (current.parentNode || document);
    } while (!ret && event.bubbles && current);    
    current = null;

    // Handle triggering native .onfoo handlers
    // onfoo = elem["on" + eventType] ;
    // isClick = SC.CoreQuery.nodeName(elem, 'a') && eventType === 'click';
    // if ((!fn || isClick) && onfoo && onfoo.apply(elem, args) === false) ret = false;

    // Trigger the native events (except for clicks on links)
    if (fn && donative !== false && ret !== false && !isClick) {
      this.triggered = true;
      try {
        sc_assert(!elem[eventType].isClass);
        elem[eventType]();
      // Prevent IE from throwing an error for some hidden elements.
      } catch (e) {}
    }
    
    this.triggered = false;
    return ret;
  },

  /** @private
    This method will handle the passed event, finding any registered listeners
    and executing them.  If you have an event you want handled, you can 
    manually invoke this method.  This function expects it's `this` value to
    be the element the event occurred on, so you should always call this 
    method like:

        SC.Event.handle.call(element, event);

    @param event {Event} the event to handle
    @returns {Boolean}
  */
  handle: function(event) {
    sc_assert(this !== SC.Event, "SC.Event.handle() expects it's `this` value to be the element the event occurred on.");

    // Ignore events triggered after window is unloaded or if double-called
    // from within a trigger.
    if ((typeof SC === "undefined") || SC.Event.triggered) return true ;
    
    // returned undefined or false
    var val, ret, namespace, all, handlers, args, key, handler, method, target;

    // Normalize event across browsers.  The new event will actually wrap the
    // real event with a normalized API.
    args = SC.A(arguments);
    args[0] = event = SC.Event.normalizeEvent(event || window.event);

    // console.log(event.type);

    // get the handlers for this event type
    handlers = (SC.data(this, "events") || {})[event.type];
    if (!handlers) return false; // nothing to do

    // invoke all handlers
    for (key in handlers ) {
      handler = handlers[key];
      method = handler[1] ;

      // Pass in a reference to the handler function itself
      // So that we can later remove it
      event.handler = method;
      event.data = event.context = handler[2];

      target = handler[0] || this ;
      ret = method.apply( target, args );

      if (val !== false) val = ret;

      // If method returned false, do not continue.  Stop propogation and return 
      // the default.  Note that we test explicitly for false since if the 
      // handler returns no specific value, we do not want to stop.
      if (ret === false) {
        event.preventDefault();
        event.stopPropagation();
      }
    }

    return val;
  },

  /** @private
    This method is called just before the window unloads to unhook all 
    registered events.
  */
  unload: function() {
    var key, elements = this._sc_elements ;
    for(key in elements) this.remove(elements[key]) ;
    
    // Just in case some book-keeping was screwed up, avoid memory leaks.
    for (key in elements) delete elements[key] ;
    delete this._sc_elements ; 
  },

  KEY_BACKSPACE: 8,
  KEY_TAB:       9,
  KEY_RETURN:   13,
  KEY_ESC:      27,
  KEY_LEFT:     37,
  KEY_UP:       38,
  KEY_RIGHT:    39,
  KEY_DOWN:     40,
  KEY_DELETE:   46,
  KEY_HOME:     36,
  KEY_END:      35,
  KEY_PAGEUP:   33,
  KEY_PAGEDOWN: 34,
  KEY_INSERT:   45,

  /** @private
    Adds the primary event listener for the named type on the element.

    @param elem {Element} the target element
    @param eventType {String} the event type
  */
  _sc_addEventListener: function(elem, eventType) {
    // Must be given an `elem` param.
    sc_assert(elem);

    // Save element in cache.  This must be removed later to avoid memory 
    // leaks.
    var listener, guid = SC.guidFor(elem);
    this._sc_elements[guid] = elem;

    listener = SC.data(elem, "listener") || SC.data(elem, "listener", 
      function() {
        SC.RunLoop.begin();
        var ret = SC.Event.handle.apply(SC.Event._sc_elements[guid], arguments);
        SC.RunLoop.end();
        return ret;
    });
    
    // Bind the global event handler to the element.
    sc_assert(elem.addEventListener);
    elem.addEventListener(eventType, listener, false);

    elem = listener = null; // avoid memory leak
  },

  /** @private
    Removes the primary event listener for the named type on the element.

    Note that this will not clear the element from the _sc_elements hash.  
    You must call `SC.Event.unload()` on unload to make sure that is cleared.

    @param elem {Element} the target element
    @param eventType {String} the event type
  */
  _sc_removeEventListener: function(elem, eventType) {
    // Must be given an `elem` param.
    sc_assert(elem);

    var listener = SC.data(elem, "listener") ;
    if (listener) {
      sc_assert(elem.removeEventListener);
      elem.removeEventListener(eventType, listener, false);
    }

    elem = listener = null; // avoid memory leak
  },

  _sc_elements: {},
  
  // TODO: Implement preventDefault() in a cross platform way.
  
  /** @private Take an incoming event and convert it to a normalized event. */
  normalizeEvent: function(event) {
    if (event === window.event) {
      // IE can't do event.normalized on an Event object
      return SC.Event.create(event) ; 
    } else {
      return event.normalized ? event : SC.Event.create(event) ;
    }
  },
  
  _sc_global: {},

  /** @private properties to copy from native event onto the event */
  _sc_props: ("altKey attrChange attrName bubbles button cancelable "        +
    "charCode clientX clientY ctrlKey currentTarget data detail eventPhase " +
    "fromElement handler keyCode metaKey newValue originalTarget pageX "     +
    "pageY prevValue relatedNode relatedTarget screenX screenY shiftKey "    +
    "srcElement target timeStamp toElement touches targetTouches "           +
    "changedTouches type view which animationName elapsedTime").split(" ")

});

SC.Event.prototype = {

  /**
    Set to true if you have called either `preventDefault()` or 
    `stopPropagation()`.  This allows a generic event handler to notice if 
    you want to provide detailed control over how the browser handles the 
    real event.
  */
  hasCustomEventHandling: false,
  
  /**
    Indicates that you want to allow the normal default behavior.  Sets
    the `hasCustomEventHandling` property to true but does not cancel the 
    event.
    
    @returns {SC.Event} receiver
  */
  allowDefault: function() {
    this.hasCustomEventHandling = true ;
    return this ;  
  },
  
  /** @private
    Implements W3C standard.  Will prevent the browser from performing its
    default action on this event.
    
    @returns {SC.Event} receiver
  */
  preventDefault: function() {
    var evt = this.originalEvent ;
    if (evt) {
      if (evt.preventDefault) evt.preventDefault() ;
      evt.returnValue = false ; // IE
    }
    this.hasCustomEventHandling = true ;
    return this ;
  },

  /** @private
    Implements W3C standard.  Prevents further bubbling of the event.

    @returns {SC.Event} receiver
  */
  stopPropagation: function() {
    var evt = this.originalEvent ;
    if (evt) {
      if (evt.stopPropagation) evt.stopPropagation() ;
      evt.cancelBubble = true ; // IE
    }
    this.hasCustomEventHandling = true ; 
    return this ;
  },

  /** @private
    Stops both the default action and further propogation.  This is more 
    convenient than calling both.

    @returns {SC.Event} receiver
  */
  stop: function() {
    return this.preventDefault().stopPropagation();
  },

  /** Always true to indicate the event was normalized. */
  normalized: true,

  /** Returns the pressed character (found in this.which) as a string. */
  getCharString: function() {
    // if (SC.browser.msie) {
    //   if (this.keyCode == 8 || this.keyCode == 9 || (this.keyCode >= 37 && this.keyCode <= 40)) {
    //     return String.fromCharCode(0);
    //   } else {
    //     return (this.keyCode > 0) ? String.fromCharCode(this.keyCode) : null;  
    //   }
    // } else {
    //   return (this.charCode > 0) ? String.fromCharCode(this.charCode) : null;
    // }
    return String.fromCharCode(this.charCode);
    // FIXME: Need text input overhaul! See: http://unixpapa.com/js/key.html
  },

  /**
    Returns character codes for the event.  The first value is the normalized 
    code string, with any shift or ctrl characters added to the begining.  
    The second value is the char string by itself.

    @returns {Array}
  */
  commandCodes: function() {
    // FIXME: Need text input overhaul! See: http://unixpapa.com/js/key.html
    var code = this.keyCode, ret = null, key = null,
        modifiers = '', lowercase;
    
    // Handle function keys.
    if (code) {
      ret = SC.FUNCTION_KEYS[code];
      if (!ret && (this.altKey || this.ctrlKey || this.metaKey)) {
        ret = SC.PRINTABLE_KEYS[code];
      }

      if (ret) {
        if (this.ctrlKey) modifiers += 'ctrl_' ;
        if (this.altKey) modifiers += 'alt_' ;
        if (this.metaKey) modifiers += 'meta_' ;
        if (this.shiftKey) modifiers += 'shift_' ;
      }
    }

    // Otherwise just go get the right key.
    if (!ret) {
      code = this.which;
      key = ret = String.fromCharCode(code);
      lowercase = ret.toLowerCase();
      if (this.metaKey) {
        modifiers = 'meta_';
        ret = lowercase;
        
      } else ret = null;
    }

    if (ret) ret = modifiers + ret;
    return [ret, key] ;
  }

} ;

// Create these ones, and re-use when needed.
SC.DefaultEvent = SC.Event.create({
  isBehaviorEvent: true,
  type: 'defaultTransition',
  target: null
});

SC.EnterEvent = SC.Event.create({
  isBehaviorEvent: true,
  type: 'enter',
  target: null
});

SC.ExitEvent = SC.Event.create({
  isBehaviorEvent: true,
  type: 'exit',
  target: null
});
