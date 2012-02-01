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

sc_require('system/responder');
sc_require('mixins/responder_context');
sc_require('views/view');
sc_require('layers/layer');
sc_require('system/property_animation');

if (BLOSSOM) {

/** @class
  A pane is the onscreen container for views and their layers. Panes support 
  implicit animation, just like layers, and can b e
  
  A Pane is like a regular view except that it does not need to live within a 
  parent view.  You usually use a Pane to form the root of a view hierarchy in 
  your application, such as your main application view or for floating 
  palettes, popups, menus, etc.

  Usually you will not work directly with the SC.Pane class, but with one of 
  its subclasses such as SC.MainPane, SC.Panel, or SC.PopupPane.

  h1. Showing a Pane

  To make a pane visible, you need to add it to your HTML document.  The 
  simplest way to do this is to call the append() method:

  {{{
     myPane = SC.Pane.create();
     myPane.append(); // adds the pane to the document
  }}}

  This will insert your pane into the end of your HTML document body, causing 
  it to display on screen.  It will also register your pane with the 
  SC.RootResponder for the document so you can start to receive keyboard, 
  mouse, and touch events.

  If you need more specific control for where you pane appears in the 
  document, you can use several other insertion methods such as appendTo(), 
  prependTo(), before() and after().  These methods all take a an element to 
  indicate where in your HTML document you would like you pane to be inserted.

  Once a pane is inserted into the document, it will be sized and positioned 
  according to the layout you have specified.  It will then automatically 
  resize with the window if needed, relaying resize notifications to children 
  as well.

  h1. Hiding a Pane

  When you are finished with a pane, you can hide the pane by calling the 
  remove() method.  This method will actually remove the Pane from the 
  document body, as well as deregistering it from the RootResponder so that it 
  no longer receives events.

  The isVisibleInWindow method will also change to NO for the Pane and all of 
  its childViews and the views will no longer have their updateDisplay methods 
  called.  

  You can readd a pane to the document again any time in the future by using 
  any of the insertion methods defined in the previous section.

  h1. Receiving Events

  Your pane and its child views will automatically receive any mouse or touch 
  events as long as it is on the screen.  To receive keyboard events, however, 
  you must focus the keyboard on your pane by calling makeKeyPane() on the 
  pane itself.  This will cause the RootResponder to route keyboard events to 
  your pane.  The pane, in turn, will route those events to its current 
  keyView, if there is any.

  Note that all SC.Views (anything that implements SC.ClassicResponder, 
  really) will be notified when it is about or gain or lose keyboard focus.  
  These notifications are sent both when the view is made keyView of a 
  particular pane and when the pane is made keyPane for the entire 
  application.

  You can prevent your Pane from becoming key by setting the acceptsKeyPane 
  to NO on the pane.  This is useful when creating palettes and other popups 
  that should not steal keyboard control from another view.

  @extends SC.Responder
  @extends SC.ResponderContext
  @since Blossom 1.0
*/
SC.Pane = SC.Responder.extend(SC.ResponderContext, {

  transitions: {},

  transitionsStyle: function() {
    // create a unique style rule and add it to the shared cursor style sheet
    var transitionStyle = this._transitionStyle;

    if (!transitionStyle) {
      var transitions = this.get('transitions') || {},
          properties = [] ,
          durations = [],
          timingFunctions = [],
          delays = [],
          ss = SC.PropertyAnimation.sharedStyleSheet();

      this._transitionStyle = transitionStyle = SC.guidFor(this);

      for (var key in transitions) {
        var transition = transitions[key];
        if (transition && transition.isPropertyAnimation) {
          properties.push(key);
          durations.push(transition.get('duration'));
          timingFunctions.push(transition.get('timingFunction'));
          delays.push(transition.get('delay'));
        }
      }

      var propertyRule = '-webkit-transition-property: '+properties.join(', '),
          durationRule = '-webkit-transition-duration: '+durations.join(', '),
          timingFunctionRule = '-webkit-transition-timing-function: '+timingFunctions.join(', '),
          delayRule = '-webkit-transition-delay: '+delays.join(', '),
          rule = [propertyRule, durationRule, timingFunctionRule, delayRule].join(';\n');

      // console.log(rule);
      if (ss.insertRule) { // WC3
        // console.log('WC3: adding rule');
        ss.insertRule(
          '.'+transitionStyle+' { '+rule+'; }',
          ss.cssRules ? ss.cssRules.length : 0
        ) ;
      } else if (ss.addRule) { // IE
        // console.log('IE: adding rule');
        ss.addRule('.'+transitionStyle, rule) ;
      }
    }

    return transitionStyle ;
  }.property(),

  top: function(key, value) {
    var container, top;
    if (value !== undefined) {
      container = this.get('container');
      container.style.top = value;
      top = this._sc_top = value;
    } else {
      top = this._sc_top;
      if (!top) {
        container = this.get('container');
        top = this._sc_top = container.style.top;
      }
    }
    return top;
  }.property(),

  left: function(key, value) {
    var container, left;
    if (value !== undefined) {
      container = this.get('container');
      container.style.left = value;
      left = this._sc_left = value;
    } else {
      left = this._sc_left;
      if (!left) {
        container = this.get('container');
        left = this._sc_left = container.style.left;
      }
    }
    return left;
  }.property(),

  opacity: function(key, value) {
    var container, opacity;
    if (value !== undefined) {
      container = this.get('container');
      container.style.opacity = value;
      opacity = this._sc_opacity = value;
    } else {
      opacity = this._sc_opacity;
      if (!opacity) {
        container = this.get('container');
        opacity = this._sc_opacity = container.style.opacity;
      }
    }
    return opacity;
  }.property(),

  mousePosition: null,

  updateMousePositionWithEvent: function(evt) {
    var containerPos = this.computeContainerPosition(),
        mouseX = evt.clientX - containerPos.left + window.pageXOffset,
        mouseY = evt.clientY - containerPos.top + window.pageYOffset,
        ret = { x: mouseX, y: mouseY };

    this.set('mousePosition', ret);
    return ret;
  },

  computeContainerPosition: function() {
    var el = this.get('container'),
        top = 0, left = 0;

    while (el && el.tagName != "BODY") {
      top += el.offsetTop;
      left += el.offsetLeft;
      el = el.offsetParent;
    }

    return { top: top, left: left };
  },

  hitTestLayer: null,

  /**
    Finds the layer that is hit by this event, and returns its view.
  */
  targetViewForEvent: function(evt) {
    return this; // FIXME
    // console.log('SC.Pane#targetViewForEvent(', evt, ')');
    var context = this.getPath('hitTestLayer.context'),
        hitLayer = null, zIndex = -1,
        mousePosition, x, y;

    mousePosition = this.updateMousePositionWithEvent(evt);
    x = mousePosition.x;
    y = mousePosition.y;

    function hitTestSublayer(sublayer) {
      if (sublayer.get('isHidden')) return;
      context.save();

      // Prevent this layer and any sublayer from drawing paths outside our 
      // bounds.
      sublayer.renderBoundsPath(context);
      context.clip();

      // Make sure the layer's transform is current.
      if (sublayer._sc_transformFromSuperlayerToLayerIsDirty) {
        sublayer._sc_computeTransformFromSuperlayerToLayer();
      }

      // Apply the sublayer's transform from our layer (it's superlayer).
      var t = sublayer._sc_transformFromSuperlayerToLayer;
      context.transform(t[0], t[1], t[2], t[3], t[4], t[5]);

      // First, test our sublayers.
      sublayer.get('sublayers').forEach(hitTestSublayer);

      // Only test ourself if (a) no hit has been found, or (b) our zIndex is 
      // higher than whatever hit has been found so far.
      var sublayerZ = sublayer.get('zIndex');
      if (!hitLayer || zIndex < sublayerZ) {
        // See if we actually hit something. Start by beginning a new path.
        context.beginPath();

        // Next, draw the path(s) we'll test.
        sublayer.renderHitTestPath(context);

        // Finally, test the point for intersection with the path(s).
        if (context.isPointInPath(x, y)) {
          hitLayer = sublayer;
          zIndex = sublayerZ;
        }
      }

      context.restore();
    }

    context.save();

    // First, clip the context to the pane's layer's bounds.
    context.beginPath();
    this.get('layer').renderBoundsPath(context);
    context.clip();

    // Next, begin the hit testing process. When this completes, hitLayer 
    // will contain the layer that was hit with the highest zIndex.
    this.getPath('layer.sublayers').forEach(hitTestSublayer);

    context.restore();

    // We don't need to test `layer`, because we already know it was hit when 
    // this method is called by SC.RootResponder.
    return hitLayer? hitLayer.get('view') : this ;
  },

    /** 
      Invoked by the root responder whenever the window resizes.  This should
      simply begin the process of notifying children that the view size has
      changed, if needed.

      @param {Rect} oldSize the old window size
      @param {Rect} newSize the new window size
      @returns {SC.Pane} receiver
    */
    windowSizeDidChange: function(oldSize, newSize) {
      this.set('currentWindowSize', newSize) ;
      return this ;
    },

    /** @private */
    paneLayoutDidChange: function() {
      this.invokeOnce(this.updateLayout);
    }.observes('layout'),

    /**
      Attempts to send the event down the responder chain for this pane.  If you 
      pass a target, this method will begin with the target and work up the 
      responder chain.  Otherwise, it will begin with the current rr 
      and walk up the chain looking for any responder that implements a handler 
      for the passed method and returns YES when executed.

      @param {String} action
      @param {SC.Event} evt
      @param {Object} target
      @returns {Object} object that handled the event
    */
    sendEvent: function(action, evt, target) {
      // console.log('SC.Pane#sendEvent(', action, evt, target, ')');
      var handler ;

      // walk up the responder chain looking for a method to handle the event
      if (!target) target = this.get('firstResponder') ;
      while(target && !target.tryToPerform(action, evt)) {

        // even if someone tries to fill in the nextResponder on the pane, stop
        // searching when we hit the pane.
        target = (target === this) ? null : target.get('nextResponder') ;
      }

      // if no handler was found in the responder chain, try the default
      if (!target && (target = this.get('defaultResponder'))) {
        if (typeof target === SC.T_STRING) {
          target = SC.objectForPropertyPath(target);
        }

        if (!target) target = null;
        else target = target.tryToPerform(action, evt) ? target : null ;
      }

      // if we don't have a default responder or no responders in the responder
      // chain handled the event, see if the pane itself implements the event
      else if (!target && !(target = this.get('defaultResponder'))) {
        target = this.tryToPerform(action, evt) ? this : null ;
      }

      return evt.mouseHandler || target ;
    },

    performKeyEquivalent: function(keystring, evt) {
      var ret = arguments.callee.base.apply(this, arguments); ; // try normal view behavior first
      if (!ret) {
        var defaultResponder = this.get('defaultResponder') ;
        if (defaultResponder) {
          // try default responder's own performKeyEquivalent method,
          // if it has one...
          if (defaultResponder.performKeyEquivalent) {
            ret = defaultResponder.performKeyEquivalent(keystring, evt) ;
          }

          // even if it does have one, if it doesn't handle the event, give
          // methodName-style key equivalent handling a try
          if (!ret && defaultResponder.tryToPerform) {
            ret = defaultResponder.tryToPerform(keystring, evt) ;
          }
        }
      }
      return ret ;
    },

    // .......................................................
    // RESPONDER CONTEXT
    //

    /**
      Pane's never have a next responder.

      @property {SC.Responder}
      @readOnly
    */
    nextResponder: function() {
      return null;
    }.property().cacheable(),

    /**
      The first responder.  This is the first view that should receive action 
      events.  Whenever you click on a view, it will usually become 
      firstResponder. 

      @property {SC.Responder}
    */
    firstResponder: null,

    /** 
      If YES, this pane can become the key pane.  You may want to set this to NO 
      for certain types of panes.  For example, a palette may never want to 
      become key.  The default value is YES.

      @property {Boolean}
    */
    acceptsKeyPane: YES,

    /**
      This is set to YES when your pane is currently the target of key events. 

      @property {Boolean}
    */
    isKeyPane: NO,

    /**
      Make the pane receive key events.  Until you call this method, the 
      keyView set for this pane will not receive key events. 

      @returns {SC.Pane} receiver
    */
    becomeKeyPane: function() {
      if (this.get('isKeyPane')) return this ;
      if (this.rootResponder) this.rootResponder.makeKeyPane(this) ;
      return this ;
    },

    /**
      Remove the pane view status from the pane.  This will simply set the 
      keyPane on the rootResponder to null.

      @returns {SC.Pane} receiver
    */
    resignKeyPane: function() {
      if (!this.get('isKeyPane')) return this ;
      if (this.rootResponder) this.rootResponder.makeKeyPane(null);
      return this ;
    },

    /**
      Makes the passed view (or any object that implements SC.Responder) into 
      the new firstResponder for this pane.  This will cause the current first
      responder to lose its responder status and possibly keyResponder status as
      well.

      @param {SC.View} view
      @param {Event} evt that cause this to become first responder
      @returns {SC.Pane} receiver
    */
    makeFirstResponder: function(view, evt) {
      var current=this.get('firstResponder'), isKeyPane=this.get('isKeyPane');
      if (current === view) return this ; // nothing to do
      if (SC.platform.touch && view && view.kindOf(SC.TextFieldView) && !view.get('focused')) return this;

      // notify current of firstResponder change
      if (current) current.willLoseFirstResponder(current, evt);

      // if we are currently key pane, then notify key views of change also
      if (isKeyPane) {
        if (current) current.willLoseKeyResponderTo(view) ;
        if (view) view.willBecomeKeyResponderFrom(current) ;
      }

      // change setting
      if (current) {
        current.beginPropertyChanges()
          .set('isFirstResponder', NO).set('isKeyResponder', NO)
        .endPropertyChanges();
      }

      this.set('firstResponder', view) ;

      if (view) {
        view.beginPropertyChanges()
          .set('isFirstResponder', YES).set('isKeyResponder', isKeyPane)
        .endPropertyChanges();
      }

      // and notify again if needed.
      if (isKeyPane) {
        if (view) view.didBecomeKeyResponderFrom(current) ; 
        if (current) current.didLoseKeyResponderTo(view) ;
      }

      if (view) view.didBecomeFirstResponder(view);
      return this ;
    },

    /** @private
      If the user presses the tab key and the pane does not have a first
      responder, try to give it to the next eligible responder.

      If the keyDown event reaches the pane, we can assume that no responders in
      the responder chain, nor the default responder, handled the event.
    */
    keyDown: function(evt) {
      var nextValidKeyView;

      // Handle tab key presses if we don't have a first responder already
      if (evt.which === 9 && !this.get('firstResponder')) {
        // Cycle forwards by default, backwards if the shift key is held
        if (evt.shiftKey) {
          nextValidKeyView = this.get('previousValidKeyView');
        } else {
          nextValidKeyView = this.get('nextValidKeyView');
        }

        if (nextValidKeyView) {
          this.makeFirstResponder(nextValidKeyView);
          return YES;
        }
      }

      return NO;
    },

    /** @private method forwards status changes in a generic way. */
    _forwardKeyChange: function(shouldForward, methodName, pane, isKey) {
      var keyView, responder, newKeyView;
      if (shouldForward && (responder = this.get('firstResponder'))) {
        newKeyView = (pane) ? pane.get('firstResponder') : null ;
        keyView = this.get('firstResponder') ;
        if (keyView) keyView[methodName](newKeyView);

        if ((isKey !== undefined) && responder) {
          responder.set('isKeyResponder', isKey);
        }
      } 
    },

    /**
      Called just before the pane loses it's keyPane status.  This will notify 
      the current keyView, if there is one, that it is about to lose focus, 
      giving it one last opportunity to save its state. 

      @param {SC.Pane} pane
      @returns {SC.Pane} reciever
    */
    willLoseKeyPaneTo: function(pane) {
      this._forwardKeyChange(this.get('isKeyPane'), 'willLoseKeyResponderTo', pane, NO);
      return this ;
    },

    /**
      Called just before the pane becomes keyPane.  Notifies the current keyView 
      that it is about to gain focus.  The keyView can use this opportunity to 
      prepare itself, possibly stealing any value it might need to steal from 
      the current key view.

      @param {SC.Pane} pane
      @returns {SC.Pane} receiver
    */
    willBecomeKeyPaneFrom: function(pane) {
      this._forwardKeyChange(!this.get('isKeyPane'), 'willBecomeKeyResponderFrom', pane, YES);
      return this ;
    },


    /**
      Called just after the pane has lost its keyPane status.  Notifies the 
      current keyView of the change.  The keyView can use this method to do any 
      final cleanup and changes its own display value if needed.

      @param {SC.Pane} pane
      @returns {SC.Pane} reciever
    */
    didLoseKeyPaneTo: function(pane) {
      var isKeyPane = this.get('isKeyPane');
      this.set('isKeyPane', NO);
      this._forwardKeyChange(isKeyPane, 'didLoseKeyResponderTo', pane);
      return this ;
    },

    /**
      Called just after the keyPane focus has changed to the receiver.  Notifies 
      the keyView of its new status.  The keyView should use this method to 
      update its display and actually set focus on itself at the browser level 
      if needed.

      @param {SC.Pane} pane
      @returns {SC.Pane} receiver

    */
    didBecomeKeyPaneFrom: function(pane) {
      var isKeyPane = this.get('isKeyPane');
      this.set('isKeyPane', YES);
      this._forwardKeyChange(!isKeyPane, 'didBecomeKeyResponderFrom', pane, YES);
      return this ;
    },

    // .......................................................
    // MAIN PANE SUPPORT
    //

    /**
      Returns YES whenever the pane has been set as the main pane for the 
      application.

      @property {Boolean}
    */
    isMainPane: NO,

    /**
      Invoked when the pane is about to become the focused pane.  Override to
      implement your own custom handling.

      @param {SC.Pane} pane the pane that currently have focus
      @returns {void}
    */
    focusFrom: function(pane) {},

    /**
      Invoked when the the pane is about to lose its focused pane status.  
      Override to implement your own custom handling

      @param {SC.Pane} pane the pane that will receive focus next
      @returns {void}
    */
    blurTo: function(pane) {},

    /**
      Invoked when the view is about to lose its mainPane status.  The default 
      implementation will also remove the pane from the document since you can't 
      have more than one mainPane in the document at a time.

      @param {SC.Pane} pane
      @returns {void}
    */
    blurMainTo: function(pane) {
      this.set('isMainPane', NO) ;
    },

    /** 
      Invokes when the view is about to become the new mainPane.  The default 
      implementation simply updates the isMainPane property.  In your subclass, 
      you should make sure your pane has been added to the document before 
      trying to make it the mainPane.  See SC.MainPane for more information.

      @param {SC.Pane} pane
      @returns {void}
    */
    focusMainFrom: function(pane) {
      this.set('isMainPane', YES);
    },

    // .......................................................
    // ADDING/REMOVE PANES TO SCREEN
    //  

    /**
      The layout property shadows the layout property on this view's root 
      layer (aka the result of `this.get('layer')`).

      As a special, non-standard capability, if you set this property to a hash 
      when creating the view, the hash will be used as the initial `layout` of 
      the root layer. The hash will then be deleted from the view, allowing the 
      computed property below to shine through from the prototype.

      Note: since `layer` is read only, we don't add the unnecessary observer 
      on the `layer` key.
    */
    layout: function(key, value) {
      var layer = this.get('layer');
      if (value !== undefined) layer.set('layout', value);
      else return layer.get('layout');
    }.property(),

    /**
      The SC.Layer subclass to instantiate to create this view's layer.

      @property {SC.Layer}
    */
    layerClass: SC.Layer,

    layer: function(key, value) {
      sc_assert(value === undefined); // We're read only.
      return this._sc_layer;
    }.property(),

    hitTestLayer: function(key, value) {
      sc_assert(value === undefined); // We're read only.
      return this._sc_hitTestLayer;
    }.property(),

    containerId: function(key, value) {
      if (value) this._containerId = value;
      if (this._containerId) return this._containerId;
      return SC.guidFor(this) ;
    }.property().cacheable(),

    createLayersForContainer: function(container, width, height) {
      // SC.Pane only has two layers `layer` and `hitTestLayer`.
      var K = this.get('layerClass');
      sc_assert(K && K.kindOf(SC.Layer));

      // We want to allow the developer to provide a layout hash on the view, 
      // or to override the 'layout' computed property.
      if (this.hasOwnProperty('layout')) {
        // It's still possible that layout is a computed property. Don't use 
        // `get()` to find out!
        var layout = this.layout;
        if (typeof layout === "object") {
          // We assume `layout` is a layout hash. The layer will throw an 
          // exception if `layout` is invalid -- don't test for that here.
          this._sc_layer = K.create({
            layout: layout,
            owner: this, // TODO: Do we need owner here?
            container: container,
            delegate: this
          });
          this._sc_hitTestLayer = K.create({
            layout: layout,
            isHitTestOnly: true,
            owner: this, // TODO: Do we need owner here?
            container: container,
            delegate: this
          });
        } else {
          this._sc_layer = K.create({
            // `layout` is whatever the default on SC.Layer is
            owner: this, // TODO: Do we need owner here?
            container: container,
            delegate: this
          });
          this._sc_hitTestLayer = K.create({
            // `layout` is whatever the default on SC.Layer is
            isHitTestOnly: true,
            owner: this, // TODO: Do we need owner here?
            container: container,
            delegate: this
          });
        }

        // Only delete layout if it is not a computed property. This allows 
        // the computed property on the prototype to shine through.
        if (typeof layout !== "function" || !layout.isProperty) {
          console.log('deleting layout');
          delete this.layout;
        }
      } else {
        this._sc_layer = K.create({
          // `layout` is whatever the default on SC.Layer is
          owner: this, // TODO: Do we need owner here?
          container: container,
          delegate: this
        });
        this._sc_hitTestLayer = K.create({
          // `layout` is whatever the default on SC.Layer is
          isHitTestOnly: true,
          owner: this, // TODO: Do we need owner here?
          container: container,
          delegate: this
        });
      }

      this.notifyPropertyChange('layer');
      this.notifyPropertyChange('hitTestLayer');
    },

    container: function(key, element) {
      if (element !== undefined) {
        this._pane_container = element ;
      } else {
        element = this._pane_container;
        if (!element) {
          this._pane_container = element = document.createElement('div');
          element.id = this.get('containerId');
          element.className = ['sc-pane', this.get('transitionsStyle')].join(' ');
  //        element.style.boxShadow = "0px 4px 14px rgba(0, 0, 0, 0.61)";
          element.style.webkitTransform = "translateZ(0)";

          // apply the layout style manually for now...
          var layoutStyle = this.get('layoutStyle');
          for (key in layoutStyle) {
            if (!layoutStyle.hasOwnProperty(key)) continue;
            if (layoutStyle[key] !== null) {
              element.style[key] = layoutStyle[key];
            }
          }

          // Make sure SproutCore can find this view.
          SC.View.views[this.get('containerId')] = this;
        }
      }
      return element ;
    }.property(),

    attach: function() {
      var container = this.get('container'),
          elem = document.body;

      if (this.get('isPaneAttached') && (container.parentNode === elem)) {
        return this; // nothing to do
      }

      // Okay, the order here is very important; otherwise, the layers will 
      // not know their correct size.

      elem.insertBefore(container, null); // add to DOM

      this.createLayersForContainer(container);

      this.render(this.getPath('layer.context'), true);

      elem = container = null;

      this.paneDidAttach();
    },

  render: function(context) {},

  // ...........................................
  // LAYOUT SUPPORT
  //

  /** @private
    Called when the pane is attached to a DOM element in a window, this will 
    change the view status to be visible in the window and also register 
    with the rootResponder.
  */
  paneDidAttach: function() {
    // hook into root responder
    var responder = (this.rootResponder = SC.RootResponder.responder);
    responder.panes.add(this);
  
    // set currentWindowSize
    this.set('currentWindowSize', responder.computeWindowSize()) ;
    
    // update my own location
    this.set('isPaneAttached', YES) ;

    return this ;
  },

  /** FIXME: Remove this method.
    layoutStyle describes the current styles to be written to your element
    based on the layout you defined.  Both layoutStyle and frame reset when
    you edit the layout property.  Both are read only.

    Computes the layout style settings needed for the current anchor.

    @property {Hash}
    @readOnly
  */
  layoutStyle: function() {
    var layout = this.get('layout'), ret = {}, pdim = null, error,
        AUTO = SC.LAYOUT_AUTO,
        dims = SC._VIEW_DEFAULT_DIMS, loc = dims.length, x, value, key,
        stLayout = this.get('useStaticLayout'),
        lR = layout.right,
        lL = layout.left,
        lT = layout.top,
        lB = layout.bottom,
        lW = layout.width,
        lH = layout.height,
        lMW = layout.maxWidth,
        lMH = layout.maxHeight,
        lcX = layout.centerX,
        lcY = layout.centerY,
        hasAcceleratedLayer = this.get('hasAcceleratedLayer'),
        translateTop = 0,
        translateLeft = 0;
    if (lW !== undefined && lW === SC.LAYOUT_AUTO && !stLayout) {
      error= SC.Error.desc("%@.layout() you cannot use width:auto if "+
              "staticLayout is disabled".fmt(this),"%@".fmt(this),-1);
      console.error(error.toString()) ;
      throw error ;
    }

    if (lH !== undefined && lH === SC.LAYOUT_AUTO && !stLayout) {
      error = SC.Error.desc("%@.layout() you cannot use height:auto if "+
                "staticLayout is disabled".fmt(this),"%@".fmt(this),-1);
      console.error(error.toString()) ;
      throw error ;
    }

    // X DIRECTION

    // handle left aligned and left/right
    if (!SC.none(lL)) {
      if(SC.isPercentage(lL)) {
        ret.left = (lL*100)+"%";  //percentage left
      } else if (hasAcceleratedLayer && !SC.empty(lW)) {
        translateLeft = Math.floor(lL);
        ret.left = 0;
      } else {
        ret.left = Math.floor(lL); //px left
      }
      ret.marginLeft = 0 ;

      if (lW !== undefined) {
        if(lW === SC.LAYOUT_AUTO) ret.width = SC.LAYOUT_AUTO ;
        else if(SC.isPercentage(lW)) ret.width = (lW*100)+"%"; //percentage width
        else ret.width = Math.floor(lW) ; //px width
        ret.right = null ;
      } else {
        ret.width = null ;
        if(lR && SC.isPercentage(lR)) ret.right = (lR*100)+"%"; //percentage right
        else ret.right = Math.floor(lR || 0) ; //px right
      }

    // handle right aligned
    } else if (!SC.none(lR)) {
      if(SC.isPercentage(lR)) {
        ret.right = Math.floor(lR*100)+"%";  //percentage left
      }else{
        ret.right = Math.floor(lR) ;
      }
      ret.marginLeft = 0 ;

      if (SC.none(lW)) {
        if (SC.none(lMW)) ret.left = 0;
        ret.width = null;
      } else {
        ret.left = null ;
        if(lW === SC.LAYOUT_AUTO) ret.width = SC.LAYOUT_AUTO ;
        else if(lW && SC.isPercentage(lW)) ret.width = (lW*100)+"%" ; //percentage width
        else ret.width = Math.floor(lW || 0) ; //px width
      }

    // handle centered
    } else if (!SC.none(lcX)) {
      ret.left = "50%";
      if(lW && SC.isPercentage(lW)) ret.width = (lW*100)+"%" ; //percentage width
      else ret.width = Math.floor(lW || 0) ;
      if(lW && SC.isPercentage(lW) && (SC.isPercentage(lcX) || SC.isPercentage(lcX*-1))){
        ret.marginLeft = Math.floor((lcX - lW/2)*100)+"%" ;
      }else if(lW && lW >= 1 && !SC.isPercentage(lcX)){
        ret.marginLeft = Math.floor(lcX - ret.width/2) ;
      }else {
        // This error message happens whenever width is not set.
        console.warn("You have to set width and centerX usign both percentages or pixels");
        ret.marginLeft = "50%";
      }
      ret.right = null ;

    // if width defined, assume top/left of zero
    } else if (!SC.none(lW)) {
      ret.left =  0;
      ret.right = null;
      if(lW === SC.LAYOUT_AUTO) ret.width = SC.LAYOUT_AUTO ;
      else if(SC.isPercentage(lW)) ret.width = (lW*100)+"%";
      else ret.width = Math.floor(lW);
      ret.marginLeft = 0;

    // fallback, full width.
    } else {
      ret.left = 0;
      ret.right = 0;
      ret.width = null ;
      ret.marginLeft= 0;
    }


    // handle min/max
    ret.minWidth = (layout.minWidth === undefined) ? null : layout.minWidth ;
    ret.maxWidth = (layout.maxWidth === undefined) ? null : layout.maxWidth ;

    // Y DIRECTION

    // handle top aligned and left/right
    if (!SC.none(lT)) {
      if(SC.isPercentage(lT)) {
        ret.top = (lT*100)+"%";
      } else if (hasAcceleratedLayer && !SC.empty(lH)) {
        translateTop = Math.floor(lT);
        ret.top = 0;
      } else {
        ret.top = Math.floor(lT);
      }
      if (lH !== undefined) {
        if(lH === SC.LAYOUT_AUTO) ret.height = SC.LAYOUT_AUTO ;
        else if(SC.isPercentage(lH)) ret.height = (lH*100)+"%" ;
        else ret.height = Math.floor(lH) ;
        ret.bottom = null ;
      } else {
        ret.height = null ;
        if(lB && SC.isPercentage(lB)) ret.bottom = (lB*100)+"%" ;
        else ret.bottom = Math.floor(lB || 0) ;
      }
      ret.marginTop = 0 ;

    // handle bottom aligned
    } else if (!SC.none(lB)) {
      ret.marginTop = 0 ;
      if(SC.isPercentage(lB)) ret.bottom = (lB*100)+"%";
      else ret.bottom = Math.floor(lB) ;
      if (SC.none(lH)) {
        if (SC.none(lMH)) ret.top = 0;
        ret.height = null ;
      } else {
        ret.top = null ;
        if(lH === SC.LAYOUT_AUTO) ret.height = SC.LAYOUT_AUTO ;
        else if(lH && SC.isPercentage(lH)) ret.height = (lH*100)+"%" ;
        else ret.height = Math.floor(lH || 0) ;
      }

    // handle centered
    } else if (!SC.none(lcY)) {
      ret.top = "50%";
      ret.bottom = null ;

      if(lH && SC.isPercentage(lH)) ret.height = (lH*100)+ "%" ;
      else ret.height = Math.floor(lH || 0) ;

      if(lH && SC.isPercentage(lH) && (SC.isPercentage(lcY) || SC.isPercentage(lcY*-1))){ //height is percentage and lcy too
        ret.marginTop = Math.floor((lcY - lH/2)*100)+"%" ;
      }else if(lH && lH >= 1 && !SC.isPercentage(lcY)){
        ret.marginTop = Math.floor(lcY - ret.height/2) ;
      }else {
        console.warn("You have to set height and centerY to use both percentages or pixels");
        ret.marginTop = "50%";
      }
    } else if (!SC.none(lH)) {
      ret.top = 0;
      ret.bottom = null;
      if(lH === SC.LAYOUT_AUTO) ret.height = SC.LAYOUT_AUTO ;
      else if(lH && SC.isPercentage(lH)) ret.height = (lH*100)+"%" ;
      else ret.height = Math.floor(lH || 0) ;
      ret.marginTop = 0;

    // fallback, full width.
    } else {
      ret.top = 0;
      ret.bottom = 0;
      ret.height = null ;
      ret.marginTop= 0;
    }

    // handle min/max
    ret.minHeight = (layout.minHeight === undefined) ?
      null :
      layout.minHeight ;
    ret.maxHeight = (layout.maxHeight === undefined) ?
      null :
      layout.maxHeight ;

    // if zIndex is set, use it.  otherwise let default shine through
    ret.zIndex = SC.none(layout.zIndex) ? null : layout.zIndex.toString();

    // if backgroundPosition is set, use it.
    // otherwise let default shine through
    ret.backgroundPosition = SC.none(layout.backgroundPosition) ?
      null :
      layout.backgroundPosition.toString() ;

    // set default values to null to allow built-in CSS to shine through
    // currently applies only to marginLeft & marginTop
    while(--loc >=0) {
      x = dims[loc];
      if (ret[x]===0) ret[x]=null;
    }

    if (hasAcceleratedLayer) {
      var transform = 'translateX('+translateLeft+'px) translateY('+translateTop+'px)';
      if (SC.platform.supportsCSS3DTransforms) transform += ' translateZ(0px)'
      ret[SC.platform.domCSSPrefix+'Transform'] = transform;
    }

    // convert any numbers into a number + "px".
    for(key in ret) {
      value = ret[key];
      if (typeof value === SC.T_NUMBER) ret[key] = (value + "px");
    }
    return ret ;
  }.property().cacheable(),

  /**
    YES when the pane is currently attached to a document DOM.  Read only.
    
    @property {Boolean}
    @readOnly
  */
  isPaneAttached: NO,
  
  /** @private */
  init: function() {
    arguments.callee.base.apply(this, arguments); ;
    this.pane = this; // Needed so that our childViews can get our "pane".
  }

});

} // BLOSSOM

if (SPROUTCORE) {

/** @class
  A Pane is like a regular view except that it does not need to live within a 
  parent view.  You usually use a Pane to form the root of a view hierarchy in 
  your application, such as your main application view or for floating 
  palettes, popups, menus, etc.
  
  Usually you will not work directly with the SC.Pane class, but with one of 
  its subclasses such as SC.MainPane, SC.Panel, or SC.PopupPane.

  h1. Showing a Pane
  
  To make a pane visible, you need to add it to your HTML document.  The 
  simplest way to do this is to call the append() method:
  
  {{{
     myPane = SC.Pane.create();
     myPane.append(); // adds the pane to the document
  }}}
  
  This will insert your pane into the end of your HTML document body, causing 
  it to display on screen.  It will also register your pane with the 
  SC.RootResponder for the document so you can start to receive keyboard, 
  mouse, and touch events.
  
  If you need more specific control for where you pane appears in the 
  document, you can use several other insertion methods such as appendTo(), 
  prependTo(), before() and after().  These methods all take a an element to 
  indicate where in your HTML document you would like you pane to be inserted.
  
  Once a pane is inserted into the document, it will be sized and positioned 
  according to the layout you have specified.  It will then automatically 
  resize with the window if needed, relaying resize notifications to children 
  as well.
  
  h1. Hiding a Pane
  
  When you are finished with a pane, you can hide the pane by calling the 
  remove() method.  This method will actually remove the Pane from the 
  document body, as well as deregistering it from the RootResponder so that it 
  no longer receives events.
  
  The isVisibleInWindow method will also change to NO for the Pane and all of 
  its childViews and the views will no longer have their updateDisplay methods 
  called.  
  
  You can readd a pane to the document again any time in the future by using 
  any of the insertion methods defined in the previous section.
  
  h1. Receiving Events
  
  Your pane and its child views will automatically receive any mouse or touch 
  events as long as it is on the screen.  To receive keyboard events, however, 
  you must focus the keyboard on your pane by calling makeKeyPane() on the 
  pane itself.  This will cause the RootResponder to route keyboard events to 
  your pane.  The pane, in turn, will route those events to its current 
  keyView, if there is any.
  
  Note that all SC.Views (anything that implements SC.ClassicResponder, 
  really) will be notified when it is about or gain or lose keyboard focus.  
  These notifications are sent both when the view is made keyView of a 
  particular pane and when the pane is made keyPane for the entire 
  application.
  
  You can prevent your Pane from becoming key by setting the acceptsKeyPane 
  to NO on the pane.  This is useful when creating palettes and other popups 
  that should not steal keyboard control from another view.

  @extends SC.View
  @extends SC.ResponderContext
  @since SproutCore 1.0
*/
SC.Pane = SC.View.extend(SC.ResponderContext,
/** @scope SC.Pane.prototype */ {

  /** 
    Returns YES for easy detection of when you reached the pane. 
    @property {Boolean}
  */
  isPane: YES,
  
  /** 
    Set to the current page when the pane is instantiated from a page object.
    @property {SC.Page}
  */
  page: null,
  
  // .......................................................
  // ROOT RESPONDER SUPPORT
  //

  /**
    The rootResponder for this pane.  Whenever you add a pane to a document, 
    this property will be set to the rootResponder that is now forwarding 
    events to the pane.
    
    @property {SC.Responder}
  */
  rootResponder: null,  
  
  /** 
    Last known window size. 
    
    @property {Rect}
  */
  currentWindowSize: null,
  
  /** 
    The parent dimensions are always the last known window size. 
    
    @returns {Rect} current window size 
  */
  computeParentDimensions: function() {
    if(this.get('designer') && SC.suppressMain) return arguments.callee.base.apply(this, arguments);;
    
    var wframe = this.get('currentWindowSize'),
        wDim = {x: 0, y: 0, width: 1000, height: 1000},
        layout = this.get('layout');

    if (wframe){
      wDim.width = wframe.width;
      wDim.height = wframe.height;
    }
    // Call the RootResponder instance...
    else if (SC.RootResponder.responder) {
      var wSize = SC.RootResponder.responder.get('currentWindowSize');
      if (wSize){
        wDim.width = wSize.width;
        wDim.height = wSize.height;
      }
    }
    // If all else fails then we need to Calculate it from the window size and DOM
    else {
      var size, body, docElement;
      if(!this._bod || !this._docElement){
        body = document.body;
        docElement = document.documentElement;
        this._body=body;
        this._docElement=docElement;
      }else{
        body = this._body;
        docElement = this._docElement;
      }
      
      if (window.innerHeight) {
        wDim.width = window.innerWidth;
        wDim.height = window.innerHeight;
      } else if (docElement && docElement.clientHeight) {
        wDim.width = docElement.clientWidth;
        wDim.height = docElement.clientHeight; 
      } else if (body) {
        wDim.width = body.clientWidth;
        wDim.height = body.clientHeight;
      }
      this.windowSizeDidChange(null, wDim);
    }


    // If there is a minWidth or minHeight set on the pane, take that
    // into account when calculating dimensions.
  
    if (layout.minHeight || layout.minWidth) {
      if (layout.minHeight) {
        wDim.height = Math.max(wDim.height, layout.minHeight);
      }
      if (layout.minWidth) {
        wDim.width = Math.max(wDim.width, layout.minWidth);
      }
    }
    return wDim;
  },
    
  /** @private Disable caching due to an known bug in SC. */
  frame: function() {
    if(this.get('designer') && SC.suppressMain) return arguments.callee.base.apply(this, arguments);;    
    return this.computeFrameWithParentFrame(null) ;
  }.property(),
  
  /** 
    Invoked by the root responder whenever the window resizes.  This should
    simply begin the process of notifying children that the view size has
    changed, if needed.
    
    @param {Rect} oldSize the old window size
    @param {Rect} newSize the new window size
    @returns {SC.Pane} receiver
  */
  windowSizeDidChange: function(oldSize, newSize) {
    this.set('currentWindowSize', newSize) ;
    this.parentViewDidResize(); // start notifications.
    return this ;
  },

  /** @private */
  paneLayoutDidChange: function() {
    this.invokeOnce(this.updateLayout);
  }.observes('layout'),

  /**
    Attempts to send the event down the responder chain for this pane.  If you 
    pass a target, this method will begin with the target and work up the 
    responder chain.  Otherwise, it will begin with the current rr 
    and walk up the chain looking for any responder that implements a handler 
    for the passed method and returns YES when executed.

    @param {String} action
    @param {SC.Event} evt
    @param {Object} target
    @returns {Object} object that handled the event
  */
  sendEvent: function(action, evt, target) {
    // console.log('SC.Pane#sendEvent(', action, evt, target, ')');
    var handler ;
    
    // walk up the responder chain looking for a method to handle the event
    if (!target) target = this.get('firstResponder') ;
    while(target && !target.tryToPerform(action, evt)) {

      // even if someone tries to fill in the nextResponder on the pane, stop
      // searching when we hit the pane.
      target = (target === this) ? null : target.get('nextResponder') ;
    }
    
    // if no handler was found in the responder chain, try the default
    if (!target && (target = this.get('defaultResponder'))) {
      if (typeof target === SC.T_STRING) {
        target = SC.objectForPropertyPath(target);
      }

      if (!target) target = null;
      else target = target.tryToPerform(action, evt) ? target : null ;
    }

    // if we don't have a default responder or no responders in the responder
    // chain handled the event, see if the pane itself implements the event
    else if (!target && !(target = this.get('defaultResponder'))) {
      target = this.tryToPerform(action, evt) ? this : null ;
    }

    return evt.mouseHandler || target ;
  },

  performKeyEquivalent: function(keystring, evt) {
    var ret = arguments.callee.base.apply(this, arguments); ; // try normal view behavior first
    if (!ret) {
      var defaultResponder = this.get('defaultResponder') ;
      if (defaultResponder) {
        // try default responder's own performKeyEquivalent method,
        // if it has one...
        if (defaultResponder.performKeyEquivalent) {
          ret = defaultResponder.performKeyEquivalent(keystring, evt) ;
        }
        
        // even if it does have one, if it doesn't handle the event, give
        // methodName-style key equivalent handling a try
        if (!ret && defaultResponder.tryToPerform) {
          ret = defaultResponder.tryToPerform(keystring, evt) ;
        }
      }
    }
    return ret ;
  },

  // .......................................................
  // RESPONDER CONTEXT
  //

  /**
    Pane's never have a next responder.

    @property {SC.Responder}
    @readOnly
  */
  nextResponder: function() {
    return null;
  }.property().cacheable(),

  /**
    The first responder.  This is the first view that should receive action 
    events.  Whenever you click on a view, it will usually become 
    firstResponder. 
    
    @property {SC.Responder}
  */
  firstResponder: null,
  
  /** 
    If YES, this pane can become the key pane.  You may want to set this to NO 
    for certain types of panes.  For example, a palette may never want to 
    become key.  The default value is YES.
    
    @property {Boolean}
  */
  acceptsKeyPane: YES,
  
  /**
    This is set to YES when your pane is currently the target of key events. 
    
    @property {Boolean}
  */
  isKeyPane: NO,

  /**
    Make the pane receive key events.  Until you call this method, the 
    keyView set for this pane will not receive key events. 
  
    @returns {SC.Pane} receiver
  */
  becomeKeyPane: function() {
    if (this.get('isKeyPane')) return this ;
    if (this.rootResponder) this.rootResponder.makeKeyPane(this) ;
    return this ;
  },
  
  /**
    Remove the pane view status from the pane.  This will simply set the 
    keyPane on the rootResponder to null.
    
    @returns {SC.Pane} receiver
  */
  resignKeyPane: function() {
    if (!this.get('isKeyPane')) return this ;
    if (this.rootResponder) this.rootResponder.makeKeyPane(null);
    return this ;
  },
  
  /**
    Makes the passed view (or any object that implements SC.Responder) into 
    the new firstResponder for this pane.  This will cause the current first
    responder to lose its responder status and possibly keyResponder status as
    well.
    
    @param {SC.View} view
    @param {Event} evt that cause this to become first responder
    @returns {SC.Pane} receiver
  */
  makeFirstResponder: function(view, evt) {
    var current=this.get('firstResponder'), isKeyPane=this.get('isKeyPane');
    if (current === view) return this ; // nothing to do
    if (SC.platform.touch && view && view.kindOf(SC.TextFieldView) && !view.get('focused')) return this;
    
    // notify current of firstResponder change
    if (current) current.willLoseFirstResponder(current, evt);
    
    // if we are currently key pane, then notify key views of change also
    if (isKeyPane) {
      if (current) current.willLoseKeyResponderTo(view) ;
      if (view) view.willBecomeKeyResponderFrom(current) ;
    }
    
    // change setting
    if (current) {
      current.beginPropertyChanges()
        .set('isFirstResponder', NO).set('isKeyResponder', NO)
      .endPropertyChanges();
    }

    this.set('firstResponder', view) ;
    
    if (view) {
      view.beginPropertyChanges()
        .set('isFirstResponder', YES).set('isKeyResponder', isKeyPane)
      .endPropertyChanges();
    }
    
    // and notify again if needed.
    if (isKeyPane) {
      if (view) view.didBecomeKeyResponderFrom(current) ; 
      if (current) current.didLoseKeyResponderTo(view) ;
    }
    
    if (view) view.didBecomeFirstResponder(view);
    return this ;
  },

  /** @private
    If the user presses the tab key and the pane does not have a first
    responder, try to give it to the next eligible responder.

    If the keyDown event reaches the pane, we can assume that no responders in
    the responder chain, nor the default responder, handled the event.
  */
  keyDown: function(evt) {
    var nextValidKeyView;

    // Handle tab key presses if we don't have a first responder already
    if (evt.which === 9 && !this.get('firstResponder')) {
      // Cycle forwards by default, backwards if the shift key is held
      if (evt.shiftKey) {
        nextValidKeyView = this.get('previousValidKeyView');
      } else {
        nextValidKeyView = this.get('nextValidKeyView');
      }

      if (nextValidKeyView) {
        this.makeFirstResponder(nextValidKeyView);
        return YES;
      }
    }

    return NO;
  },

  /** @private method forwards status changes in a generic way. */
  _forwardKeyChange: function(shouldForward, methodName, pane, isKey) {
    var keyView, responder, newKeyView;
    if (shouldForward && (responder = this.get('firstResponder'))) {
      newKeyView = (pane) ? pane.get('firstResponder') : null ;
      keyView = this.get('firstResponder') ;
      if (keyView) keyView[methodName](newKeyView);
      
      if ((isKey !== undefined) && responder) {
        responder.set('isKeyResponder', isKey);
      }
    } 
  },
  
  /**
    Called just before the pane loses it's keyPane status.  This will notify 
    the current keyView, if there is one, that it is about to lose focus, 
    giving it one last opportunity to save its state. 
    
    @param {SC.Pane} pane
    @returns {SC.Pane} reciever
  */
  willLoseKeyPaneTo: function(pane) {
    this._forwardKeyChange(this.get('isKeyPane'), 'willLoseKeyResponderTo', pane, NO);
    return this ;
  },
  
  /**
    Called just before the pane becomes keyPane.  Notifies the current keyView 
    that it is about to gain focus.  The keyView can use this opportunity to 
    prepare itself, possibly stealing any value it might need to steal from 
    the current key view.
    
    @param {SC.Pane} pane
    @returns {SC.Pane} receiver
  */
  willBecomeKeyPaneFrom: function(pane) {
    this._forwardKeyChange(!this.get('isKeyPane'), 'willBecomeKeyResponderFrom', pane, YES);
    return this ;
  },


  /**
    Called just after the pane has lost its keyPane status.  Notifies the 
    current keyView of the change.  The keyView can use this method to do any 
    final cleanup and changes its own display value if needed.
    
    @param {SC.Pane} pane
    @returns {SC.Pane} reciever
  */
  didLoseKeyPaneTo: function(pane) {
    var isKeyPane = this.get('isKeyPane');
    this.set('isKeyPane', NO);
    this._forwardKeyChange(isKeyPane, 'didLoseKeyResponderTo', pane);
    return this ;
  },
  
  /**
    Called just after the keyPane focus has changed to the receiver.  Notifies 
    the keyView of its new status.  The keyView should use this method to 
    update its display and actually set focus on itself at the browser level 
    if needed.
    
    @param {SC.Pane} pane
    @returns {SC.Pane} receiver

  */
  didBecomeKeyPaneFrom: function(pane) {
    var isKeyPane = this.get('isKeyPane');
    this.set('isKeyPane', YES);
    this._forwardKeyChange(!isKeyPane, 'didBecomeKeyResponderFrom', pane, YES);
    return this ;
  },
  
  // .......................................................
  // MAIN PANE SUPPORT
  //
  
  /**
    Returns YES whenever the pane has been set as the main pane for the 
    application.
    
    @property {Boolean}
  */
  isMainPane: NO,
  
  /**
    Invoked when the pane is about to become the focused pane.  Override to
    implement your own custom handling.
    
    @param {SC.Pane} pane the pane that currently have focus
    @returns {void}
  */
  focusFrom: function(pane) {},
  
  /**
    Invoked when the the pane is about to lose its focused pane status.  
    Override to implement your own custom handling
    
    @param {SC.Pane} pane the pane that will receive focus next
    @returns {void}
  */
  blurTo: function(pane) {},
  
  /**
    Invoked when the view is about to lose its mainPane status.  The default 
    implementation will also remove the pane from the document since you can't 
    have more than one mainPane in the document at a time.
    
    @param {SC.Pane} pane
    @returns {void}
  */
  blurMainTo: function(pane) {
    this.set('isMainPane', NO) ;
  },
  
  /** 
    Invokes when the view is about to become the new mainPane.  The default 
    implementation simply updates the isMainPane property.  In your subclass, 
    you should make sure your pane has been added to the document before 
    trying to make it the mainPane.  See SC.MainPane for more information.
    
    @param {SC.Pane} pane
    @returns {void}
  */
  focusMainFrom: function(pane) {
    this.set('isMainPane', YES);
  },
  
  // .......................................................
  // ADDING/REMOVE PANES TO SCREEN
  //  

  /**
    Inserts the pane at the end of the document.  This will also add the pane 
    to the rootResponder.
    
    @param {SC.RootResponder} rootResponder
    @returns {SC.Pane} receiver
  */
  append: function() {
    return this.appendTo(document.body) ;
  },
  
  /**
    Removes the pane from the document.  This will remove the
    DOM node and deregister you from the document window.
    
    @returns {SC.Pane} receiver
  */
  remove: function() {
    if (!this.get('isVisibleInWindow')) return this ; // nothing to do
    if (!this.get('isPaneAttached')) return this ; // nothing to do
  
    // remove layer...
    var dom = this.get('layer') ;
    if (dom && dom.parentNode) dom.parentNode.removeChild(dom) ;
    dom = null ;
  
    // remove intercept
    this._removeIntercept();
  
    // resign keyPane status, if we had it
    this.resignKeyPane();
  
    // remove the pane
    var rootResponder = this.rootResponder ;
    if (this.get('isMainPane')) rootResponder.makeMainPane(null) ;
    rootResponder.panes.remove(this) ;
    this.rootResponder = null ;
  
    // clean up some of my own properties
    this.set('isPaneAttached', NO) ;
    this.parentViewDidChange();
    return this ;
  },
  
  /**
    Inserts the pane into the DOM as the last child of the passed DOM element. 
    You can pass in either a CoreQuery object or a selector, which will be 
    converted to a CQ object.  You can optionally pass in the rootResponder 
    to use for this operation.  Normally you will not need to pass this as 
    the default responder is suitable.
    
    @param {DOMElement} elem the element to append to
    @returns {SC.Pane} receiver
  */
  appendTo: function(elem) {
    var layer = this.get('layer');
    if (!layer) layer =this.createLayer().get('layer'); 
  
    if (this.get('isPaneAttached') && (layer.parentNode === elem)) {
      return this; // nothing to do
    }
  
    elem.insertBefore(layer, null); // add to DOM
    elem = layer = null ;

    return this.paneDidAttach(); // do the rest of the setup
  },

  /** 
    inserts the pane's rootElement into the top of the passed DOM element.
    
    @param {DOMElement} elem the element to append to
    @returns {SC.Pane} receiver
  */
  prependTo: function(elem) {
    if (this.get('isPaneAttached')) return this;
  
    var layer = this.get('layer');
    if (!layer) layer =this.createLayer().get('layer'); 
  
    if (this.get('isPaneAttached') && (layer.parentNode === elem)) {
      return this; // nothing to do
    }
  
    elem.insertBefore(layer, elem.firstChild); // add to DOM
    elem = layer = null ;

    return this.paneDidAttach(); // do the rest of the setup
  },

  /** 
    inserts the pane's rootElement into the hierarchy before the passed 
    element.
    
    @param {DOMElement} elem the element to append to
    @returns {SC.Pane} receiver
  */
  before: function(elem) {
    if (this.get('isPaneAttached')) return this;
  
    var layer = this.get('layer');
    if (!layer) layer =this.createLayer().get('layer');
  
    var parent = elem.parentNode ; 

    if (this.get('isPaneAttached') && (layer.parentNode === parent)) {
      return this; // nothing to do
    }
  
    parent.insertBefore(layer, elem); // add to DOM
    parent = elem = layer = null ;

    return this.paneDidAttach(); // do the rest of the setup
  },

  /** 
    inserts the pane's rootElement into the hierarchy after the passed 
    element.
    
    @param {DOMElement} elem the element to append to
    @returns {SC.Pane} receiver
  */
  after: function(elem) {
    var layer = this.get('layer');
    if (!layer) layer =this.createLayer().get('layer'); 
  
    var parent = elem.parentNode ;

    if (this.get('isPaneAttached') && (layer.parentNode === parent)) {
      return this; // nothing to do
    }
  
    parent.insertBefore(layer, elem.nextSibling); // add to DOM
    parent = elem = layer = null ;

    return this.paneDidAttach(); // do the rest of the setup
  },
  
  /**
    This method has no effect in the pane.  Instead use remove().
    
    @returns {void}
  */
  removeFromParent: function() { },
  
  /**
    YES when the pane is currently attached to a document DOM.  Read only.
    
    @property {Boolean}
    @readOnly
  */
  isPaneAttached: NO,
  
  /**
    If YES, a touch itnercept pane will be added above this pane.
  */
  hasTouchIntercept: NO,
  
  /**
    The Z-Index of the pane. Currently, you have to match this in CSS.
    TODO: ALLOW THIS TO AUTOMATICALLY SET THE Z-INDEX OF THE PANE (as an option).
  */
  zIndex: 0,
  
  /**
    The amount over the pane's z-index that the touch intercept should be.
  */
  touchZ: 99,

  _addIntercept: function() {
    if (this.get("hasTouchIntercept") && SC.platform.touch) {
      this.set("usingTouchIntercept", YES);
      var div = document.createElement("div");
      var divStyle = div.style;
      divStyle.position = "absolute";
      divStyle.left = "0px";
      divStyle.top = "0px";
      divStyle.right = "0px";
      divStyle.bottom = "0px";
      divStyle.webkitTransform = "translateZ(0px)";
      divStyle.zIndex = this.get("zIndex") + this.get("touchZ");
      div.className = "touch-intercept";
      div.id = "touch-intercept-" + SC.guidFor(this);
      this._touchIntercept = div;
      document.body.appendChild(div);
    }
  },
  
  _removeIntercept: function() {
    if (this._touchIntercept) {
      document.body.removeChild(this._touchIntercept);
      this._touchIntercept = null;
    }
  },
  
  hideTouchIntercept: function() {
    if (this._touchIntercept) this._touchIntercept.style.display = "none";
  },
  
  showTouchIntercept: function() {
    if (this._touchIntercept) this._touchIntercept.style.display = "block";
  },

  /** @private
    Called when the pane is attached to a DOM element in a window, this will 
    change the view status to be visible in the window and also register 
    with the rootResponder.
  */
  paneDidAttach: function() {
    // hook into root responder
    var responder = (this.rootResponder = SC.RootResponder.responder);
    responder.panes.add(this);
  
    // set currentWindowSize
    this.set('currentWindowSize', responder.computeWindowSize()) ;
    
    // update my own location
    this.set('isPaneAttached', YES) ;
    this.parentViewDidChange() ;
    
    //notify that the layers have been appended to the document
    this._notifyDidAppendToDocument();
    
    // handle intercept if needed
    this._addIntercept();
    return this ;
  },

  /** @private */
  updateLayerLocation: function() {
    if(this.get('designer') && SC.suppressMain) return arguments.callee.base.apply(this, arguments);;
    // note: the normal code here to update node location is removed 
    // because we don't need it for panes.
    return this ; 
  },

  /** @private */
  init: function() {
    // if a layer was set manually then we will just attach to existing 
    // HTML.
    var hasLayer = !!this.get('layer') ;
    arguments.callee.base.apply(this, arguments); ;
    if (hasLayer) this.paneDidAttach();
  },

  /** @private */
  classNames: 'sc-pane'.w()
  
});

} // SPROUTCORE
