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

/** @mixin

  Provides common methods for sending events down a responder chain.
  Responder chains are used most often to deliver events to user interface
  elements in your application, but you can also use them to deliver generic
  events to any part of your application, including controllers.

  @since Blossom 1.0
*/
SC.Responder = {

  isResponder: true, // Walk like a duck.

  /** @property
    Set this to the tooltip Blossom should show when the mouse hovers over 
    this responder.

    @type String
  */
  tooltip: null,

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
    True when the responder is behaviorly the first responder.  This property
    is always updated by a surface when its `firstResponder` property is set.

    @type {Boolean}
  */
  isFirstResponder: false,

  /** @property
    True when the responder is behaviorly the input responder.  This property
    is always updated by a surface when its `firstResponder` property is set.

    @type {Boolean}
  */
  isInputResponder: false,

  /** @property
    True when the responder is behaviorly the menu responder.  This property
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

  nextInputResponder: null,

  previousInputResponder: null,

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

  __behaviorKey__: null,
  __trace__: false,
  __traceMouseEvents__: false,
  __traceTouchEvents__: false,
  __step__: false,

  _sc_transitionKey: null,
  _sc_handled: false,
  _sc_dispatching: false,
  _sc_behaviorPath: null,
  _sc_behaviorDepth: 0,

  initMixin: function() {
    // console.log('SC.Responder#initMixin');
    var behaviorKey = this.__behaviorKey__;
    if (!behaviorKey) return; // Not using behaviors.

    sc_assert(typeof behaviorKey === 'string', "`__behaviorKey__` must be a string.");

    var behavior = this[behaviorKey];
    sc_assert(behavior, "Object for `__behaviorKey__` does not exist.");
    sc_assert(behavior.isBehavior, "Object for `__behaviorKey__` is not a behavior.");
    sc_assert(typeof behavior.call === 'function', "Object for `__behaviorKey__` is not callable.");

    this._sc_behaviorPath = []; // We reuse this to avoid repeated allocations.

    // Don't call initBehavior() here, we want to allow everything to be
    // inited first.  (It'll be called by _object_init() instead.)
  },

  initBehavior: function() {
    // console.log('SC.Responder#initBehavior');
    sc_assert(SC.isReady, '`initBehavior() called when Blossom was not ready.`');

    var behaviorKey = this.__behaviorKey__,
        behavior = this[behaviorKey];

    sc_assert(behavior, "Object for `__behaviorKey__` does not exist.");
    sc_assert(behavior.isBehavior, "Object for `__behaviorKey__` is not a behavior.");
    sc_assert(typeof behavior.call === 'function', "Object for `__behaviorKey__` is not callable.");

    // Okay, does the behavior have any superbehaviors? If so, we need to
    // enter them first.
    var path = this._sc_behaviorPath,
        idx = 0;

    sc_assert(SC.typeOf(path) === SC.T_ARRAY, "`this._sc_behaviorPath` is not an array.");
    sc_assert(path.length === 0, "`this._sc_behaviorPath` should have zero length.");

    // Push the initial behavior.
    path[idx++] = behaviorKey;

    // Append the behavior's parents, if any.
    var superbehaviorKey = behavior.__superbehaviorKey__;
    while (superbehaviorKey) {
      path[idx++] = superbehaviorKey;
      superbehaviorKey = this[superbehaviorKey].__superbehaviorKey__;
    }

    if (this.__trace__) {
      // We only dispatch once, so we don't need to indent.
      var msg = "%@#initBehavior()".fmt(this);
      console.log(msg);
      if (this.__step__) alert(msg);
    }

    // Enter all behaviors in reverse order (parent's first).
    while (idx > 0) this._sc_enterBehavior(path[--idx]);

    // Does the inital behavior have any subbehaviors? If so, we need to
    // enter them too.
    this._sc_initBehavior(behaviorKey);

    sc_assert(idx === 0);
    path.length = 0; // reset

    var stopKey = behaviorKey,
        transitionKey = this._sc_transitionKey;

    // Required.
    this._sc_transitionKey = null;
    this._sc_handled = false;

    while (transitionKey) {
      var transition = this[transitionKey];
      sc_assert(transition, "Object for `_sc_transitionKey` does not exist.");
      sc_assert(transition.isBehavior, "Object for `_sc_transitionKey` is not a behavior.");
      sc_assert(typeof transition.call === 'function', "Object for `_sc_transitionKey` is not callable.");

      // Push the subbehavior.
      path[idx++] = transitionKey;

      // There may be states inbetween the state we're transitioning to, and
      // our initial behavior.  Gather and enter them, as needed.
      superbehaviorKey = transition.__superbehaviorKey__;
      while (superbehaviorKey && (superbehaviorKey !== stopKey)) {
        path[idx++] = superbehaviorKey;
        superbehaviorKey = this[superbehaviorKey].__superbehaviorKey__;
      }

      // Enter all subbehaviors in reverse order (parent's first).
      while (idx > 0) this._sc_enterBehavior(path[--idx]);

      sc_assert(idx === 0);
      path.length = 0; // reset

      // Keep initing subbehaviors we transition to until we don't make a
      // transition.
      this._sc_initBehavior(transitionKey);

      // Don't need to init any further than the transition we just made.
      stopKey = transitionKey;
      transitionKey = this._sc_transitionKey;

      // Required.
      this._sc_transitionKey = null;
      this._sc_handled = false;
    }

    this.__behaviorKey__ = stopKey;
  },

  /**
    Attemps to invoke the named method, passing the included two arguments.  
    Returns false if the method is either not implemented or if the handler 
    returns false (indicating that it did not handle the event).  This method 
    is invoked to deliver actions from menu items and to deliver events.  
    You can override this method to provide additional handling if you 
    prefer.

    @param {String} methodName
    @param {Object} arg1
    @param {Object} arg2
    @returns {Boolean} true if handled, false if not handled
  */
  tryToPerform: function(methodName, arg1, arg2) {
    // console.log('SC.Responder#tryToPerform(', methodName, ')');
    var ret, oldType;

    if (this.__behaviorKey__) {
      // Are we trying to perform an event?
      if (arg1 && arg1 instanceof SC.Event) {
        oldType = arg1.type;
        arg1.type = methodName;
        ret = this.dispatchEvent(arg1);

      // No, we're trying to perform an action.
      } else {
        ret = this.dispatchEvent(SC.Event.create({
          type: methodName,
          arg1: arg1,
          arg2: arg2
        }));
      }
    }
    
    if (!ret && this.respondsTo(methodName)) {
      if (oldType) arg1.type = oldType;
      ret = this[methodName](arg1, arg2) !== false;
    }
    
    return ret;
  },

  transition: function(behaviorKey) {
    sc_assert(this._sc_transitionKey === null, "`transition()` called twice without being cleared first.");
    sc_assert(this._sc_handled === false, "`transition()` or `handled()` called twice without being cleared first.");

    sc_assert(behaviorKey, "No `behaviorKey` provided to this.transition().");
    sc_assert(typeof behaviorKey === 'string', "`behaviorKey` must be a string.");
    sc_assert(this[behaviorKey], "Object for `behaviorKey` does not exist.");
    sc_assert(this[behaviorKey].isBehavior, "Object for `behaviorKey` is not a behavior.");
    sc_assert(typeof this[behaviorKey].call === 'function', "Object for `behaviorKey` is not callable.");

    this._sc_transitionKey = behaviorKey;
    this._sc_handled = true;
  },

  handled: function() {
    sc_assert(this._sc_handled === false, "`transition()` or `handled()` called twice without being cleared first.");

    this._sc_handled = true;
  },

  dispatchAction: function(key) {
    sc_assert(key);
    sc_assert(typeof key === 'string');
    return this.dispatchEvent(SC.Event.create({
      type: key
    }));
  },

  dispatchEvent: function(evt) {
    // console.log('SC.Responder#dispatchEvent(', evt, ')');
    sc_assert(evt, "No `evt` provided.");
    sc_assert(evt instanceof SC.Event, "`evt` has wrong type.");
    sc_assert(evt.type, "`evt` does not have a type.");
    sc_assert(typeof evt.type === 'string', "`evt.type` is not a string.");

    var behaviorKey = this.__behaviorKey__;
    if (!behaviorKey) return false; // Not using behaviors.

    sc_assert(typeof behaviorKey === 'string', "`behaviorKey` is not a string.");

    if (this._sc_dispatching) {
      if (this.__trace__) console.log("Ignoring '%@' event because we are already dispatching an event.".fmt(evt.type));
      return false;
    }

    // We can only safely dispatch one event at a time.
    this._sc_dispatching = true;

    // Trace if needed.
    if (this.__trace__) {
      var ignore = false,
          msg, type = evt.type;

      if (type.match(/^mouse+/) && !this.__traceMouseEvents__) ignore = true;
      else if (type.match(/^touch+/) && !this.__traceTouchEvents__) ignore = true;

      // Include the actual key pressed when keyDown occurs, if we know what
      // it is.
      if (type === 'keyDown') {
        var charString = evt.getCharString();
        if (charString) type = type + ':' + charString;
      }

      if (!ignore) {
        // We only dispatch once, so we don't need to indent.
        msg = "%@#dispatchEvent(%@)".fmt(this, type);
        console.log(msg);
        if (this.__step__) alert(msg);
      }
    }

    // Try and handle the event.
    var depth = this._sc_behaviorDepth,
        handlerKey = behaviorKey;

    sc_assert(depth >= 0);

    this._sc_behaviorEvent(behaviorKey, evt, depth--);

    var superbehaviorKey = this[behaviorKey].__superbehaviorKey__;
    while (!this._sc_handled && superbehaviorKey) {
      this._sc_behaviorEvent(superbehaviorKey, evt, depth--);
      handlerKey = superbehaviorKey;
      superbehaviorKey = this[superbehaviorKey].__superbehaviorKey__;
    }

    if (!this._sc_handled) {
      this._sc_dispatching = false;
      return false; // No behavior handled the event.
    }

    // Great, we handled the event.  Was a transition taken?  If so,
    // `this._sc_transitionKey` is now set to the transitionKey behavior.
    // Figure out (and possibly execute) entry and exit actions as needed.
    // `handelerKey` is the behavior that handled the event and made the 
    // transition.
    sc_assert(this._sc_handled);
    sc_assert(handlerKey);

    var transitionKey = this._sc_transitionKey;
    if (transitionKey) {
      // Get and reset our temp array, used to avoid repeated allocations.
      var path = this._sc_behaviorPath, idx;
      path.length = 0;

      // The transitionKey behavior is the last behavior we'll enter.
      path[0] = transitionKey;

      // Exit the current behavior until we find the behavior that handled 
      // the event.
      if (behaviorKey !== handlerKey) {
        this._sc_exitBehavior(behaviorKey);
        superbehaviorKey = this[behaviorKey].__superbehaviorKey__;

        while (superbehaviorKey && superbehaviorKey !== handlerKey) {
          this._sc_exitBehavior(superbehaviorKey);
          superbehaviorKey = this[superbehaviorKey].__superbehaviorKey__;
        }
      }

      // We've now exited from the original behaviorKey behavior up to the 
      // handlerKey behavior that actually requested the transition, so make 
      // it the new behaviorKey now.
      this.__behaviorKey__ = transitionKey;

      // Now we need to determine the relationship between the handlerKey and 
      // the transitionKey so we can correctly exit and enter behaviors.  As 
      // we go, we'll exit behavior we know need to be exited, leaving a 
      // record in `path` of the behaviors to be entered, and setting `idx`
      // to the first index of a behavior that needs to be entered.
      // Behaviors in `path` should be entered backwards.

      // Did we transition to ourself?
      if (handlerKey === transitionKey) {
        // Exit ourself.
        this._sc_exitBehavior(handlerKey);

        // Enter ourself (but actually do it below, so we can handle the init 
        // event appropriately).
        idx = 0;

      // Is the handlerKey behavior the parent of the transitionKey behavior?
      } else if (handlerKey === this[transitionKey].__superbehaviorKey__) {
        // Don't exit the handlerKey behavior.

        // Enter the transitionKey behavior (but actually do it below, so we 
        // can handle the init event appropriately).
        idx = 0;

      // Do the handlerKey behavior and the transitionKey behavior have the 
      // same parent?
      } else if (this[handlerKey].__superbehaviorKey__ === this[transitionKey].__superbehaviorKey__) {
        // Exit the handlerKey behavior.
        this._sc_exitBehavior(handlerKey);

        // Enter the transitionKey behavior (but actually do it below, so we 
        // can handle the init event appropriately).
        idx = 0;

      // Is the handlerKey behavior's parent the transitionKey behavior?
      } else if (this[handlerKey].__superbehaviorKey__ === transitionKey) {
        // Exit the handing behavior.
        this._sc_exitBehavior(handlerKey);

        // Don't enter the transitionKey behavior, since we're already in it.
        idx = -1;

      // Is the handlerKey behavior a distant ancestor of the transitionKey 
      // behavior? (We know they do not have the same parent.)
      } else {
        // Remember that we need to enter the transitionKey behavior's 
        // superbehavior.
        superbehaviorKey = path[1] = this[transitionKey].__superbehaviorKey__;
        idx = 1;

        // Then loop over the superbehaviorKey's ancestors, looking for the
        // handlerKey behavior (and store the path while we do).
        if (superbehaviorKey) {
          superbehaviorKey = this[superbehaviorKey].__superbehaviorKey__;
          while (superbehaviorKey) {
            path[++idx] = superbehaviorKey; // store the entry path state key

            // Did we find the handlerKey behavior?
            if (superbehaviorKey === handlerKey) {
              // Don't exit the handlerKey behavior.

              // Don't enter the handlerKey behavior either.
              --idx;

              break;

            // Okay, we didn't find the handlerKey behavior, so keep going.
            } else {
              superbehaviorKey = this[superbehaviorKey].__superbehaviorKey__;
            }
          }
        }

        // If we've reached the root behavior (null), we failed to find the 
        // handlerKey behavior in the ancestors of transitionKey. Now we need 
        // to find the least-common ancestor of the two ancestor trees (could 
        // be the root behavior).
        if (!superbehaviorKey) {
          // Start the actual loop. `path` contains the entire ancestor 
          // tree for transitionKey, all the way to the root. For each 
          // ancestor of handlerKey, we find its location in `path`. If it 
          // exists, we set `idx` to that value, minus 1.
          this._sc_exitBehavior(handlerKey);
          superbehaviorKey = this[handlerKey].__superbehaviorKey__;
          while (superbehaviorKey) {
            var loc = path.indexOf(superbehaviorKey);

            if (loc >= 0) {
              // Don't exit the superbehaviorKey behavior.

              // Don't enter the superbehaviorKey behavior, either.
              idx = loc - 1;

              // Note: idx will be - when transitionKey was a distant 
              // ancestory of handlerKey.  Since it's already been entered, 
              // we don't want to enter it again.
              break;

            // Keep going.
            } else {
              this._sc_exitBehavior(superbehaviorKey);
              superbehaviorKey = this[superbehaviorKey].__superbehaviorKey__;
            }
          }
        }
      }

      // `path` now contains any behaviors to enter, starting at `idx` and 
      // working backwards.
      while (idx >= 0) this._sc_enterBehavior(path[idx--]);

      // Now we need to initialize the transitionKey behavior and see if 
      // it has any subbehavior to automatically enter.  We do this 
      // recursively, until there are no more subbehaviors to automatically 
      // enter.
      idx = 0;
      path.length = 0; // reset so we can use it again

      // Required.
      this._sc_transitionKey = null;
      this._sc_handled = false;

      this._sc_initBehavior(transitionKey);

      var stopKey = transitionKey;
      transitionKey = this._sc_transitionKey;

      // Required.
      this._sc_transitionKey = null;
      this._sc_handled = false;

      while (transitionKey) {
        var transition = this[transitionKey];
        sc_assert(transition, "Object for `_sc_transitionKey` does not exist.");
        sc_assert(transition.isBehavior, "Object for `_sc_transitionKey` is not a behavior.");
        sc_assert(typeof transition.call === 'function', "Object for `_sc_transitionKey` is not callable.");

        // Push the subbehavior.
        path[idx++] = transitionKey;

        // There may be states inbetween the state we're transitioning to, and
        // our initial behavior.  Gather and enter them, as needed.
        superbehaviorKey = transition.__superbehaviorKey__;
        while (superbehaviorKey && (superbehaviorKey !== stopKey)) {
          path[idx++] = superbehaviorKey;
          superbehaviorKey = this[superbehaviorKey].__superbehaviorKey__;
        }

        // Enter all subbehaviors in reverse order (parent's first).
        while (idx > 0) this._sc_enterBehavior(path[--idx]);

        sc_assert(idx === 0);
        path.length = 0; // reset

        // Keep initing subbehaviors we transition to until we don't make a
        // transition.
        this._sc_initBehavior(transitionKey);

        // Don't need to init any further than the transition we just made.
        stopKey = transitionKey;
        transitionKey = this._sc_transitionKey;

        // Required.
        this._sc_transitionKey = null;
        this._sc_handled = false;
      }

      this.__behaviorKey__ = stopKey;
    } else {
      // Required.
      this._sc_handled = false;
    }

    sc_assert(this._sc_handled === false);
    sc_assert(this._sc_transitionKey === null);

    this._sc_dispatching = false;
    return true;
  },

  /** @private */
  _sc_enterBehavior: function(behaviorKey) {
    sc_assert(behaviorKey, "No `behaviorKey` provided to this.transition().");
    sc_assert(typeof behaviorKey === 'string', "`behaviorKey` must be a string.");
    sc_assert(this[behaviorKey], "Object for `behaviorKey` does not exist.");
    sc_assert(this[behaviorKey].isBehavior, "Object for `behaviorKey` is not a behavior.");
    sc_assert(typeof this[behaviorKey].call === 'function', "Object for `behaviorKey` is not callable.");

    // The core thing we're trying to do.
    this[behaviorKey].call(this, SC.EnterEvent);

    if (this.__trace__) {
      var depth = ++this._sc_behaviorDepth,
          padding = '', msg;

      while (depth-- > 0) padding = padding + '  ';

      msg = padding + "=> Entering " + behaviorKey + ".";
      if (this.__step__) alert(msg);
      console.log(msg);
    }
  },

  /** @private */
  _sc_exitBehavior: function(behaviorKey) {
    sc_assert(behaviorKey, "No `behaviorKey` provided to this.transition().");
    sc_assert(typeof behaviorKey === 'string', "`behaviorKey` must be a string.");
    sc_assert(this[behaviorKey], "Object for `behaviorKey` does not exist.");
    sc_assert(this[behaviorKey].isBehavior, "Object for `behaviorKey` is not a behavior.");
    sc_assert(typeof this[behaviorKey].call === 'function', "Object for `behaviorKey` is not callable.");

    // The core thing we're trying to do.
    this[behaviorKey].call(this, SC.ExitEvent);

    if (this.__trace__) {
      var depth = this._sc_behaviorDepth--,
          padding = '', msg;

      while (depth-- > 0) padding = padding + '  ';

      msg = padding + "<= Exiting " + behaviorKey + ".";
      if (this.__step__) alert(msg);
      console.log(msg);
    }
  },

  /** @private */
  _sc_initBehavior: function(behaviorKey) {
    sc_assert(behaviorKey, "No `behaviorKey` provided to this.transition().");
    sc_assert(typeof behaviorKey === 'string', "`behaviorKey` must be a string.");
    sc_assert(this[behaviorKey], "Object for `behaviorKey` does not exist.");
    sc_assert(this[behaviorKey].isBehavior, "Object for `behaviorKey` is not a behavior.");
    sc_assert(typeof this[behaviorKey].call === 'function', "Object for `behaviorKey` is not callable.");

    // The core thing we're trying to do. Behavior may call this.transition().
    this[behaviorKey].call(this, SC.DefaultEvent);

    var transitionKey = this._sc_transitionKey;
    if (this.__trace__ && transitionKey) {
      var depth = this._sc_behaviorDepth,
          padding = '', msg;

      while (depth-- > 0) padding = padding + '  ';

      msg = padding + "Making a default transition to " + transitionKey + " from " + behaviorKey + ".";
      if (this.__step__) alert(msg);
      console.log(msg);
    }
  },

  /** @private */
  _sc_behaviorEvent: function(behaviorKey, evt, depth) {
    sc_assert(this._sc_transitionKey === null, "`_sc_behaviorEvent()` called without `_sc_transitionKey` being cleared first.");
    sc_assert(this._sc_handled === false, "`_sc_behaviorEvent()` called without `_sc_handled` being cleared first.");

    sc_assert(behaviorKey, "No `behaviorKey` provided to this.transition().");
    sc_assert(typeof behaviorKey === 'string', "`behaviorKey` must be a string.");
    sc_assert(this[behaviorKey], "Object for `behaviorKey` does not exist.");
    sc_assert(this[behaviorKey].isBehavior, "Object for `behaviorKey` is not a behavior.");
    sc_assert(typeof this[behaviorKey].call === 'function', "Object for `behaviorKey` is not callable.");

    sc_assert(evt, "No `evt` provided.");
    sc_assert(evt instanceof SC.Event, "`evt` has wrong type.");
    sc_assert(evt.type, "`evt` does not have a type.");
    sc_assert(typeof evt.type === 'string', "`evt.type` is not a string.");

    sc_assert(depth !== undefined);
    sc_assert(depth >= 0);

    // The core thing we're trying to do. Behavior may call this.transition()
    // or this.handled().
    this[behaviorKey].call(this, evt);

    if (this.__trace__) {
      var ignore = false,
          padding = '',
          msg, type = evt.type;

      while (depth-- > 0) padding = padding + '  ';

      if (type.match(/^((mouse+)|click|doubleClick)/) && !this.__traceMouseEvents__) ignore = true;
      else if (type.match(/^touch+/) && !this.__traceTouchEvents__) ignore = true;

      // Include the actual key pressed when keyDown occurs, if we know what
      // it is.
      if (type === 'keyDown') {
        var charString = evt.getCharString();
        if (charString) type = type + '(' + charString + ')';
      }

      if (this._sc_transitionKey) {
        msg = padding + behaviorKey + " handled the '" + type + "' event with a transition to " + this._sc_transitionKey + ".";
        ignore = false; // always trace when we handle something
      } else if (this._sc_handled) {
        msg = padding + behaviorKey + " handled the '" + type + "' event and did not transition.";
        ignore = false; // always trace when we handle something
      } else {
        msg = padding + behaviorKey + " ignored the '" + type + "' event.";
      }

      if (!ignore) {
        if (this.__step__) alert(msg);
        console.log(msg);
      }
    }
  }

};
