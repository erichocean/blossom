// ==========================================================================
// Project:   Blossom - Modern, Cross-Platform Application Framework
// Copyright: ©2012 Fohr Motion Picture Studios. All rights reserved.
// License:   Licensed under the GPLv3 license (see BLOSSOM-LICENSE).
// ==========================================================================
/*globals BLOSSOM sc_assert */

sc_require('layers/layer');
sc_require('system/property_animation');

if (BLOSSOM) {

/** @class
  `SC.Surface` is used to display content within the application's viewport. 
  Each surface lives on the GPU and supports implicit, hardware-accelerated 
  3D animation and transitions. Surfaces are responders, and will be 
  forwarded events that occur to them by the application.

  Usually you will not work directly with the `SC.Surface` class, but with one 
  of its subclasses.  Subclasses of `SC.ContainerSurface` arrange surfaces in 
  a hierarchy, allowing their layout to depend on their parent's position and 
  size, rather than the application's viewport.

  A surface should only consume resources when it is present in the viewport. 
  You can observe the `isPresentInViewport` property for changes; it will be 
  set to true when the surface is added to the viewport, and false when the 
  surface is removed.

  Mere presence in the viewport does not imply the surface is visibile. The 
  surface could be positioned off screen, or have its opacity set to zero, 
  or be occluded by another surface.  On the other hand, a surface that is 
  *not* present in the viewport is *never* visible.

  Adding a Surface to the Viewport
  --------------------------------

  To add a surface to the viewport, you add the surface to your app, which 
  manages the viewport for you:

     mySurface = SC.ImageSurface.create(...);
     SC.app.addSurface(mySurface);

  Once a surface has been added to the app, it will be sized and positioned 
  according to the layout you have specified relative to the application's 
  viewport.  It will then automatically resize if necessary when the 
  application's viewport changes size.

  The surface's `isPresentInViewport` property will also be set to true.

  Removing a Surface from the Viewport
  ------------------------------------

  To remove a surface from the viewport, do:

      SC.app.removeSurface(mySurface);

  The surface's `isPresentInViewport` property will also be set to false.

  A surface's underlying graphics resources are released when it is no longer 
  present in the viewport.  This occurs at the end of the run loop, so it is 
  okay to remove a surface temporarily and move it somewhere else – it's 
  resources will remain untouched during that time.

  Receiving Events
  ----------------

  A surface will automatically receive any mouse events that occur on it for 
  as long as it is present in the viewport.  To receive keyboard events, 
  however, you must either set the surface as the app's `ui`:

      SC.app.set('ui', aSurface);

  Or, you can set the surface as the app's `inputPane`: 

      SC.app.set('inputPane', aSurface);

  For surfaces that manage other responders, such as `SC.ViewSurface`, the 
  events will be forwarded on to the appropriate responder within the surface.

  @extends SC.Responder
  @since Blossom 1.0
*/
SC.Surface = SC.Responder.extend({

  isResponderContext: true, // We can dispatch events and actions.

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
    // var context = this.getPath('hitTestLayer.context'),
    //     hitLayer = null, zIndex = -1,
    //     mousePosition, x, y;
    // 
    // mousePosition = this.updateMousePositionWithEvent(evt);
    // x = mousePosition.x;
    // y = mousePosition.y;
    // 
    // function hitTestSublayer(sublayer) {
    //   if (sublayer.get('isHidden')) return;
    //   context.save();
    // 
    //   // Prevent this layer and any sublayer from drawing paths outside our 
    //   // bounds.
    //   sublayer.renderBoundsPath(context);
    //   context.clip();
    // 
    //   // Make sure the layer's transform is current.
    //   if (sublayer._sc_transformFromSuperlayerToLayerIsDirty) {
    //     sublayer._sc_computeTransformFromSuperlayerToLayer();
    //   }
    // 
    //   // Apply the sublayer's transform from our layer (it's superlayer).
    //   var t = sublayer._sc_transformFromSuperlayerToLayer;
    //   context.transform(t[0], t[1], t[2], t[3], t[4], t[5]);
    // 
    //   // First, test our sublayers.
    //   sublayer.get('sublayers').forEach(hitTestSublayer);
    // 
    //   // Only test ourself if (a) no hit has been found, or (b) our zIndex is 
    //   // higher than whatever hit has been found so far.
    //   var sublayerZ = sublayer.get('zIndex');
    //   if (!hitLayer || zIndex < sublayerZ) {
    //     // See if we actually hit something. Start by beginning a new path.
    //     context.beginPath();
    // 
    //     // Next, draw the path(s) we'll test.
    //     sublayer.renderHitTestPath(context);
    // 
    //     // Finally, test the point for intersection with the path(s).
    //     if (context.isPointInPath(x, y)) {
    //       hitLayer = sublayer;
    //       zIndex = sublayerZ;
    //     }
    //   }
    // 
    //   context.restore();
    // }
    // 
    // context.save();
    // 
    // // First, clip the context to the pane's layer's bounds.
    // context.beginPath();
    // this.get('layer').renderBoundsPath(context);
    // context.clip();
    // 
    // // Next, begin the hit testing process. When this completes, hitLayer 
    // // will contain the layer that was hit with the highest zIndex.
    // this.getPath('layer.sublayers').forEach(hitTestSublayer);
    // 
    // context.restore();
    // 
    // // We don't need to test `layer`, because we already know it was hit when 
    // // this method is called by SC.RootResponder.
    // return hitLayer? hitLayer.get('view') : this ;
  },

  /**
    Invoked by the application whenever the viewport resizes, and the surface 
    is part of the application.  This should simply begin the process of 
    notifying children that the viewport size has changed.

    @param {SC.Size} size the new viewport size
  */
  // viewportSizeDidChange: function(size) {},

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
    var ret = arguments.callee.base.apply(this, arguments); // try normal view behavior first
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
  // RESPONDER MANAGEMENT
  //

  /**
    The first responder.  This is the first responder that should receive 
    action events.  Whenever you click on a responder, it will usually become 
    `firstResponder`.  You can also make a responder first with code:

        theResponder.becomeFirstResponder();

    If this surface is also assigned as the `SC.app@inputSurface`, the 
    `firstResponder` will have it's `isInputResponder` property set to true.

    @property {SC.Responder}
    @isReadOnly
  */
  firstResponder: null,

  /**
    Makes the passed responder into the new `firstResponder` for this 
    surface.  This will cause the current `firstResponder` to lose its 
    first responder status and possibly its input responder status as well.

    @param {SC.Responder} responder
  */
  makeFirstResponder: function(responder) {
    var current = this.get('firstResponder'),
        isInputSurface = SC.app.get('inputSurface') === this,
        isMenuSurface = SC.app.get('menuSurface') === this;

    if (current === responder) return; // nothing to do

    sc_assert(responder? responder.kindOf('SC.Responder') : true);

    if (current && current.willLoseFirstResponderTo) {
      current.willLoseFirstResponderTo(responder);
    }

    if (isInputSurface) {
      if (current && current.willLoseInputResponderTo) {
        current.willLoseInputResponderTo(responder);
      }
      if (responder && responder.willBecomeInputResponderFrom) {
        responder.willBecomeInputResponderFrom(current);
      }
    }

    if (isMenuSurface) {
      if (current && current.willLoseMenuResponderTo) {
        current.willLoseMenuResponderTo(responder);
      }
      if (responder && responder.willBecomeMenuResponderFrom) {
        responder.willBecomeMenuResponderFrom(current);
      }
    }

    if (current) {
      current.beginPropertyChanges();
      current.set('isFirstResponder', false);
      current.set('isInputResponder', false);
      current.set('isMenuResponder',  false);
      current.endPropertyChanges();
    }

    this.set('firstResponder', responder);

    if (responder) {
      responder.beginPropertyChanges();
      responder.set('isMenuResponder',  isMenuSurface);
      responder.set('isInputResponder', isInputSurface);
      responder.set('isFirstResponder', true);
      responder.endPropertyChanges();
    }

    if (isMenuSurface) {
      if (responder && responder.didBecomeMenuResponderFrom) {
        responder.didBecomeMenuResponderFrom(current);
      }
      if (current && current.didLoseMenuResponderTo) {
        current.didLoseMenuResponderTo(responder);
      }
    }

    if (isInputSurface) {
      if (responder && responder.didBecomeInputResponderFrom) {
        responder.didBecomeInputResponderFrom(current);
      }
      if (current && current.didLoseInputResponderTo) {
        current.didLoseInputResponderTo(responder);
      }
    }

    if (responder && responder.didBecomeFirstResponderFrom) {
      responder.didBecomeFirstResponderFrom(current);
    }
  },

  didBecomeInputSurfaceFrom: function(surface) {
    sc_assert(SC.app.get('inputSurface') === this);
    this._sc_triggerFirstResponderNotificationsFor('Become', 'Input');
  },

  didLoseInputSurfaceTo: function(surface) {
    sc_assert(SC.app.get('inputSurface') !== this);
    this._sc_triggerFirstResponderNotificationsFor('Lose', 'Input');
  },

  didBecomeMenuSurfaceFrom: function(surface) {
    sc_assert(SC.app.get('menuSurface') === this);
    this._sc_triggerFirstResponderNotificationsFor('Become', 'Menu');
  },

  didLoseMenuSurfaceTo: function(surface) {
    sc_assert(SC.app.get('menuSurface') !== this);
    this._sc_triggerFirstResponderNotificationsFor('Lose', 'Menu');
  },

  _sc_triggerFirstResponderNotificationsFor: function(type, property) {
    var firstResponder = this.get('firstResponder'), key;
    if (firstResponder) {
      key = 'will'+type+property+'ResponderTo';
      if (firstResponder[key]) firstResponder[key](null);

      firstResponder.set('is'+property+'Responder', type === 'Become'? true : false);

      key = 'did'+type+property+'ResponderTo';
      if (firstResponder[key]) firstResponder[key](null);
    }
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
    if (this._sc_didCreateLayers) return;
    this._sc_didCreateLayers = true;

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
        // element.style.webkitTransform = "translateZ(0)";
        element.style.webkitTransform = "rotateY(45deg)";

        // apply the layout style manually for now...
        // var layoutStyle = this.get('layoutStyle');
        // for (key in layoutStyle) {
        //   if (!layoutStyle.hasOwnProperty(key)) continue;
        //   if (layoutStyle[key] !== null) {
        //     element.style[key] = layoutStyle[key];
        //   }
        // }

        // Make sure SproutCore can find this view.
        SC.View.views[this.get('containerId')] = this;
      }
    }
    return element ;
  }.property(),

  didAttach: function() {
    var container = this.get('container');

    // Okay, the order here is very important; otherwise, the layers will 
    // not know their correct size.

    this.createLayersForContainer(container);
    this.render(this.getPath('layer.context'), true);
    this.surfaceDidActivate();

    container = null; // avoid memory leak
  },

  didDetach: function() {
    console.log('Implement me! Destroy layers...');
  },

  render: function(context) {},

  // ...........................................
  // LAYOUT SUPPORT
  //

  /**
    True when the surface is currently part of the application (i.e. present 
    in `SC.app@surfaces`).  Read only.
    
    @property {Boolean}
    @readOnly
  */
  isSurfaceActive: false,
  
  /** @private
    Called when the pane is attached to a DOM element in a window, this will 
    change the view status to be visible in the window and also register 
    with the rootResponder.
  */
  surfaceDidActivate: function() {
    // hook into root responder
    var app = (this.rootResponder = SC.app);
    app.surfaces.add(this);
    this.set('isSurfaceActive', YES);
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

  /** @private */
  init: function() {
    arguments.callee.base.apply(this, arguments);
    this.pane = this; // Needed so that our childViews can get our "pane".
  }

});

} // BLOSSOM
