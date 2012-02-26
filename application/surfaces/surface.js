// ==========================================================================
// Project:   Blossom - Modern, Cross-Platform Application Framework
// Copyright: ©2012 Fohr Motion Picture Studios. All rights reserved.
// License:   Licensed under the GPLv3 license (see BLOSSOM-LICENSE).
// ==========================================================================
/*globals BLOSSOM sc_assert */

sc_require('system/responder');
sc_require('layers/layer');
sc_require('layers/layout');
sc_require('system/property_animation');
sc_require('surfaces/private/psurface');

if (BLOSSOM) {

/** @class
  `SC.Surface` is used to display content within the application's viewport.
  Each surface lives on the GPU and supports implicit, hardware-accelerated
  3D animation and transitions. Surfaces are responders, and will be
  forwarded events that occur to them by the application.

  Usually you will not work directly with the `SC.Surface` class, but with 
  one of its subclasses.  Subclasses of `SC.CompositeSurface` arrange 
  surfaces in a hierarchy, their frames are relative to their parent's frame, 
  rather than the application's viewport.

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

  Once a surface has been added to the app, it's `frame` property is used to 
  position the surface relative to the application's viewport.  The surface's 
  `isPresentInViewport` property will also be set to true.

  Removing a Surface from the Viewport
  ------------------------------------

  To remove a surface from the viewport, do:

      SC.app.removeSurface(mySurface);

  The surface's `isPresentInViewport` property will be set to false.

  A surface's underlying graphics resources are released when it is no longer 
  present in the viewport.  This occurs at the end of the run loop, so it is
  okay to remove a surface temporarily and move it somewhere else – it's
  resources will remain untouched during that time.

  If the surface consume any other resources for drawing, such as `SC.Layer` 
  instances, those resources should be released as well (`SC.Surface` cannot 
  do this for you).

  Receiving Events
  ----------------

  A surface will automatically receive any mouse events that occur on it for
  as long as it is present in the viewport.  To receive keyboard events,
  however, you must either set the surface as the app's `ui`:

      SC.app.set('ui', aSurface);

  Or, you can set the surface as the app's `inputSurface`:

      SC.app.set('inputSurface', aSurface);

  For surfaces that manage other responders, such as `SC.View`, the events 
  will be forwarded on to the appropriate responder within the surface.

  @extends SC.Responder
  @since Blossom 1.0
*/
SC.Surface = SC.Responder.extend({

  isSurface: true,
  isResponderContext: true, // We can dispatch to other responders.

  concatenatedProperties: ['displayProperties'],

  // ..........................................................
  // DISPLAY PROPERTIES
  //

  /**
    You can set this array to include any properties that should immediately
    invalidate the display.  The display will be automatically invalidated
    when one of these properties change (`this.__needsDisplay__` will be set 
    to `true`).

    Implementation note:  `isVisible` is also effectively a display property,
    but it is not declared as such because the same effect is implemented
    inside `_sc_isVisibleDidChange()`.  This avoids having two observers on
    `isVisible`, which is:
      a.  More efficient
      b.  More correct, because we can guarantee the order of operations

    @property {Array}
    @readOnly
  */
  displayProperties: 'backgroundColor cornerRadius zIndex'.w(),

  /**
    A string that evaluates to a CSS color.  Animatable.

    @property {CSSColor}
  */
  backgroundColor: 'transparent',

  cornerRadius: 0,

  zIndex: 0,

  // ..........................................................
  // VIEWPORT SUPPORT
  //

  /**
    Set to `true` when the surface is part of a surface tree that is
    currently present in the viewport; `false` otherwise.

    @property {Boolean}
    @isReadOnly
  */
  isPresentInViewport: false,

  // ..........................................................
  // VISIBILITY SUPPORT
  //

  /**
    The isVisible property determines if the view is shown in the view
    hierarchy it is a part of. A view can have isVisible == true and still have
    isVisibleInWindow == false. This occurs, for instance, when a parent view has
    isVisible == false. Default is true.

    The isVisible property is considered part of the layout and so changing it
    will trigger a layout update.

    @property {Boolean}
  */
  isVisible: true,
  isVisibleBindingDefault: SC.Binding.bool(),

  _sc_isVisibleDidChange: function() {
    var el = this.__sc_element__;
    el.style.visibility = this.get('isVisible')? "visible" : "hidden";
    this.triggerRendering();
  }.observes('isVisible'),

  // ..........................................................
  // RESPONDER SUPPORT
  //

  surface: function() { return this; }.property(),

  // ..........................................................
  // SURFACE TREE SUPPORT
  //

  /**
    Specifies receiver's supersurface.

    @property SC.Surface
    @readOnly
  */
  _sc_supersurface: null,
  supersurface: function(key, value) {
    if (value !== undefined) {
      sc_assert(value === null || value.kindOf(SC.Surface), "SC.Surface@supersurface must either be null or an SC.Surface instance.");
      sc_assert(value? value.get('subsurfaces').contains(this) : true, "The supersurface must already contain this surface in its subsurfaces array.");
      this._sc_supersurface = value;
    } else return this._sc_supersurface;
  }.property(),

  /**
    An array containing the receiver's subsurfaces, or `null` if the surface 
    does not support subsurfaces at all.

    The subsurfaces are listed in back to front order.

    @property Array or null
  */
  subsurfaces: null,

  // ..........................................................
  // LAYOUT & RENDERING SUPPORT
  //

  __needsLayout__: false,
  triggerLayout: function() {
    // console.log('SC.Surface#triggerLayout()');
    this.__needsLayout__ = true;
    SC.needsLayout = true;
  },

  __needsRendering__: false,
  triggerRendering: function() {
    // console.log('SC.Surface#triggerRendering()');
    this.__needsRendering__ = true;
    SC.needsRendering = true;
    // Also see code in _sc_notifyPropertyObservers, which should match.
  },

  triggerLayoutAndRendering: function() {
    // console.log('SC.Surface#triggerLayoutAndRendering()');
    this.__needsLayout__ = true;
    this.__needsRendering__ = true;
    SC.needsLayout = true;
    SC.needsRendering = true;
  },

  performLayoutIfNeeded: function(timestamp) {
    // console.log('SC.Surface#performLayoutIfNeeded()');
    var needsLayout = this.__needsLayout__,
        isVisible = this.get('isVisible');

    var benchKey = 'SC.Surface#performLayoutIfNeeded()',
        layoutKey = 'SC.Surface#performLayoutIfNeeded(): needsLayout';

    SC.Benchmark.start(benchKey);

    if (needsLayout && isVisible) {
      SC.Benchmark.start(layoutKey);
      if (this.get('isPresentInViewport')) {
        if (this.updateLayout) this.updateLayout();
        this.__needsLayout__ = false;
      } // else leave it set to true, we'll update it when it again becomes
        // visible in the viewport
      SC.Benchmark.end(layoutKey);
    }

    SC.Benchmark.end(benchKey);

    // This code is technically only needed for composite surfaces, but for
    // performance and code reuse, we fold the implementation into here
    // instead of calling `arguments.callee.base.apply(this, arguments)` in
    // `SC.CompositeSurface`.
    var subsurfaces = this.get('subsurfaces');
    if (subsurfaces === null) return;
    for (var idx=0, len=subsurfaces.length; idx<len; ++idx) {
      subsurfaces[idx].performLayoutIfNeeded(timestamp);
    }
  },

  performRenderingIfNeeded: function(timestamp) {
    // console.log('SC.Surface#performRenderingIfNeeded()');
    var needsLayout = this.__needsLayout__,
        needsDisplay = this.__needsRendering__,
        isVisible = this.get('isVisible');

    var benchKey = 'SC.Surface#performRenderingIfNeeded()',
        displayKey = 'SC.Surface#performRenderingIfNeeded(): needsDisplay';

    SC.Benchmark.start(benchKey);

    if (needsDisplay && isVisible) {
      SC.Benchmark.start(displayKey);
      if (this.get('isPresentInViewport')) {
        if (this.updateDisplay) this.updateDisplay();
        this.__needsRendering__ = false;
      } // else leave it set to true, we'll update it when it again becomes
        // visible in the viewport
      SC.Benchmark.end(displayKey);
    }

    SC.Benchmark.end(benchKey);

    // This code is technically only needed for composite surfaces, but for
    // performance and code reuse, we fold the implementation into here
    // instead of calling `arguments.callee.base.apply(this, arguments)` in
    // `SC.CompositeSurface`.
    var subsurfaces = this.get('subsurfaces');
    if (subsurfaces === null) return;
    for (var idx=0, len=subsurfaces.length; idx<len; ++idx) {
      subsurfaces[idx].performRenderingIfNeeded(timestamp);
    }
  },

  /**
    Specifies receiver's frame rectangle in the supersurface's coordinate
    space.  The value of this property is specified in points.  Animatable.

    Note: The frame does not take into account the surface's `transform`
    property, or the supersurface's `subsurfaceTransform` property. The value
    of `frame` is before these transforms have been applied.

    @property SC.Rect
  */
  frame: function(key, value) {
    // console.log('SC.Surface@frame', key, value);
    var frame = this._sc_frame;
    if (value !== undefined) {
      if (!SC.IsRect(value)) throw new TypeError("SC.Surface's 'frame' property can only be set to an SC.Rect.");

      // TODO: Probably shouldn't be altering the caller's frame here, right?
      value[0] = Math.floor(value[0]);
      value[1] = Math.floor(value[1]);
      value[2] = Math.ceil(value[2]);
      value[3] = Math.ceil(value[3]);

      // Cache the new frame so we don't need to compute it later.
      if (frame !== value) frame.set(value);
      this.__frameDidChange__  = true;
      this.triggerLayoutAndRendering();
    } else {
      return frame;
    }
  }.property(),

  // rasterizationScale: 1.0, // The scale at which to rasterize content, relative to the coordinate space of the layer. Animatable

  /**
    Defines the anchor point of the layer's bounds rectangle. Animatable.

    @property SC.Point3D
  */
  anchorPoint: function(key, value) {
    if (value !== undefined) {
      if (!SC.IsPoint3D(value)) throw new TypeError("SC.Surface's 'anchorPoint' property can only be set to an SC.Point3D.");
      throw "No implementation for SC.Surface#set('anchorPoint', value)";
    } else return this._sc_anchorPoint;
  }.property(),

  /**
    Specifies a transform applied to the surface when rendering.  Animatable.

    @property SC.Transform3D
  */
  transform: function(key, value) {
    if (value !== undefined) {
      if (!SC.IsTransform3D(value)) throw new TypeError("SC.Surface's 'transform' property can only be set to an SC.Transform3D.");
      throw "No implementation for SC.Surface#set('transform', value)";
    } else return this._sc_transform;
  }.property(),

  /**
    Specifies a transform applied to each subsurface when rendering.  
    Animatable.

    @property SC.Transform3D
  */
  subsurfaceTransform: function(key, value) {
    if (value !== undefined) {
      if (!SC.IsTransform3D(value)) throw new TypeError("SC.Surface's 'subsurfaceTransform' property can only be set to an SC.Transform3D.");
      throw "No implementation for SC.Surface#set('subsurfaceTransform', value)";
    } else return this._sc_subsurfaceTransform;
  }.property(),

  _sc_subsurfaceTransformTransformDidChange: function() {
    if (SC.IsIdentityTransform3D(this._sc_subsurfaceTransform)) {
      this._sc_hasSubsurfaceTransform = false;
    } else this._sc_hasSubsurfaceTransform = true; // only true when we don't have the identity transform
  }.observes('subsurfaceTransform'),

  // ..........................................................
  // KEY-VALUE CODING SUPPORT
  //

  isPresentInViewport: false,

  zIndex: 0,
  cornerRadius: 0,

  // /**
  //   Returns the visible region of the receiver, in its own coordinate space.
  //
  //   The visible region is the area not clipped by the containing scroll layer.
  //
  //   @property SC.Rect
  //   @readOnly
  // */
  // visibleRect: function(key, value) {
  //   throw "No implementation for SC.Surface#get/set('visibleRect', value)";
  // }.property(),

  /* @private */
  getPath: function(path) {
    var ary = path.split('.'),
        structureKey = ary[0],
        member = ary[1];

    if (SC.Surface.OBSERVABLE_STRUCTURES.indexOf(structureKey) >= 0) {
      // Get the internal structure directly, without using .get().
      return this['_sc_'+structureKey][member];
    } else return arguments.callee.base.apply(this, arguments);
  },

  /* @private */
  setPath: function(path, value) {
    var ary = path.split('.'),
        structureKey = ary[0],
        member = ary[1];

    if (SC.Surface.OBSERVABLE_STRUCTURES.indexOf(structureKey) >= 0) {
      // Set the internal structure directly, without using .set().
      this['_sc_'+structureKey][member] = value;
    } else arguments.callee.base.apply(this, arguments);
  },

  structureDidChange: function(struct, key, member, oldvalue, newvalue) {
    // console.log('SC.Surface#structureDidChangeForKey(', key, member, oldvalue, newvalue, ')');
    // debugger;
    if (key === 'frame' && oldvalue !== newvalue) {
      this.__frameDidChange__ = true;
      this.triggerLayoutAndRendering();
    }
    this.notifyPropertyChange(key, this['_sc_'+key]);
  },

  // ..........................................................
  // PSURFACE SUPPORT (Private)
  //

  __sc_element__: null,

  /** @private
    The ID to use when building CSS rules for this container surface.
  */
  id: function(key, value) {
    sc_assert(value === undefined);
    return this.__id__;
  }.property().cacheable(),

  __tagName__: 'div',

  __useContentSize__: false,

  // Note: this only ever called on roots.
  updatePsurfaceTree: function(surfaces) {
    // console.log('SC.Surface#updatePsurfaceTree()');

    if (surfaces) surfaces[this.__id__] = this;

    sc_assert(!this.get('supersurface'), "SC.Surface#updatePsurfaceTree() can only be called on a root surface.");
    sc_assert(this === SC.surfaces[this.__id__], "SC.Surface#updatePsurfaceTree() can only be called on active surfaces.");

    var rootPsurface = SC.Psurface.begin(this);

    // Sanity check.
    sc_assert(rootPsurface);
    sc_assert(rootPsurface instanceof SC.Psurface);
    sc_assert(rootPsurface.id === this.__id__);

    // Only defined for composite surfaces.
    if (this.updatePsurface) this.updatePsurface(rootPsurface, surfaces);

    SC.Psurface.end(this); // Required.
  },

  // ..........................................................
  // MISC
  //

  init: function() {
    // console.log('SC.Surface#init()');
    arguments.callee.base.apply(this, arguments);

    if (!this.__id__) this.__id__ = SC.guidFor(this);

    if (SC.app) {
      this.__sc_needFirstResponderInit__ = false;
      this._sc_firstResponderDidChange();
    } else {
      // This flag instructs SC.app to execute our
      // `_sc_firstResponderDidChange` method when we are first added to the
      // app's set of surfaces.
      this.__sc_needFirstResponderInit__ = true;
    }

    // Allocate our own structures to modify in-place. For performance, we
    // create a single ArrayBuffer up front and have all of the surface's
    // graphical structures reference it. This both reduces memory use and
    // improves memory locality, and since these structures are frequently
    // accessed together, overall performance improves too, especially during
    // critical animation loops.
    var buf = SC.MakeFloat32ArrayBuffer(39); // indicates num of floats needed

    // We want to allow a developer to specify initial properties inline,
    // but we actually need the computed properties for correct behavior.
    // The code below takes care of all this, as well as correct defaults.
    var P = this.constructor.prototype;
    function hasNonPrototypeNonComputedDefaultProperty(key) {
      return this[key] !== P[key] && this[key] && !this[key].isProperty;
    }

    if (hasNonPrototypeNonComputedDefaultProperty('frame')) {
      this._sc_frame = SC.MakeRectFromBuffer(buf, 0, this.frame);
      delete this.frame; // let the prototype shine through
    } else {
      this._sc_frame = SC.MakeRectFromBuffer(buf, 0);
    }

    if (hasNonPrototypeNonComputedDefaultProperty('transform')) {
      this._sc_transform = SC.MakeTransform3DFromBuffer(buf, 4, this.transform);
      delete this.transform; // let the prototype shine through
    } else {
      this._sc_transform = SC.MakeIdentityTransform3DFromBuffer(buf, 4);
    }

    if (hasNonPrototypeNonComputedDefaultProperty('subsurfaceTransform')) {
      this._sc_subsufaceTransform = SC.MakeTransform3DFromBuffer(buf, 20, this.subsurfaceTransform);
      delete this.subsurfaceTransform; // let the prototype shine through
      if (SC.IsIdentityTransform3D(this._sc_subsurfaceTransform)) {
        this._sc_hasSubsurfaceTransform = false;
      } else this._sc_hasSubsurfaceTransform = true; // only true when we don't have the identity transform
    } else {
      this._sc_subsurfaceTransform = SC.MakeIdentityTransform3DFromBuffer(buf, 20);
      this._sc_hasSubsurfaceTransform = false;
    }

    if (hasNonPrototypeNonComputedDefaultProperty('anchorPoint')) {
      this._sc_anchorPoint = SC.MakePoint3DFromBuffer(buf, 36, this.anchorPoint);
      delete this.anchorPoint; // let the prototype shine through
    } else {
      this._sc_anchorPoint = SC.MakePoint3DFromBuffer(buf, 36, 0.5, 0.5, 0.0);
    }

    // Float32Array's prototype has been enhanced with custom getters and
    // setters using named property keys (x, y, width, height, m11, tx, etc.)
    // These getters and setters are kvo-compliant if we configure them to
    // be so; do that now.
    var that = this;
    SC.Surface.OBSERVABLE_STRUCTURES.forEach(function (key) {
      var structure = that['_sc_'+key];
      sc_assert(structure.owner === undefined && structure.keyName === undefined);
      structure.owner = that;
      structure.keyName = key;
    });
  },

  // ..........................................................
  // ANIMATION SUPPORT
  //

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

  // mousePosition: null,
  //
  // updateMousePositionWithEvent: function(evt) {
  //   var containerPos = this.computeContainerPosition(),
  //       mouseX = evt.clientX - containerPos.left + window.pageXOffset,
  //       mouseY = evt.clientY - containerPos.top + window.pageYOffset,
  //       ret = { x: mouseX, y: mouseY };
  //
  //   this.set('mousePosition', ret);
  //   return ret;
  // },
  //
  // computeContainerPosition: function() {
  //   var el = this.__sc_element__,
  //       top = 0, left = 0;
  //
  //   while (el && el.tagName != "BODY") {
  //     top += el.offsetTop;
  //     left += el.offsetLeft;
  //     el = el.offsetParent;
  //   }
  //
  //   return { top: top, left: left };
  // },

  /**
    Finds the surface that is hit by this event, and returns its view.
  */
  targetSurfaceForEvent: function(evt) {
    return this;
  },

  /**
    Attempts to send the event down the responder chain for this surface.  If 
    you pass a target, this method will begin with the target and work up the 
    responder chain.  Otherwise, it will begin with the current responder 
    and walk up the chain looking for any responder that implements a handler 
    for the passed method and returns true when executed.

    @param {String} action
    @param {SC.Event} evt
    @param {SC.Responder} target
    @returns {SC.Object} object that handled the event
  */
  sendEvent: function(action, evt, target) {
    // console.log('SC.Surface#sendEvent(', action, evt, target, ')');
    var handler ;

    // Walk up the responder chain looking for a method to handle the event.
    if (!target) target = this.get('firstResponder') ;
    while(target && !target.tryToPerform(action, evt)) {

      // Even if someone tries to fill in the nextResponder on the surface, 
      // stop searching when we hit the surface.
      target = (target === this) ? null : target.get('nextResponder') ;
    }

    // If no handler was found in the responder chain, try the default
    if (!target && (target = this.get('defaultResponder'))) {
      if (typeof target === SC.T_STRING) {
        target = SC.objectForPropertyPath(target);
      }

      if (!target) target = null;
      else target = target.tryToPerform(action, evt) ? target : null ;
    }

    // If we don't have a default responder or no responders in the responder
    // chain handled the event, see if the surface itself implements the 
    // event.
    else if (!target && !(target = this.get('defaultResponder'))) {
      target = this.tryToPerform(action, evt) ? this : null ;
    }

    return evt.mouseHandler || target ;
  },

  performKeyEquivalent: function(keystring, evt) {
    var ret = false, defaultResponder = this.get('defaultResponder') ;
    if (defaultResponder) {
      // Try default responder's own performKeyEquivalent method,
      // if it has one...
      if (defaultResponder.performKeyEquivalent) {
        ret = defaultResponder.performKeyEquivalent(keystring, evt) ;
      }

      // Even if it does have one, if it doesn't handle the event, give
      // methodName-style key equivalent handling a try.
      if (!ret && defaultResponder.tryToPerform) {
        ret = defaultResponder.tryToPerform(keystring, evt) ;
      }
    }
    return ret ;
  },

  /** @private
    If the user presses the tab key and the surface does not have a first
    responder, try to give it to the next eligible responder.

    If the keyDown event reaches the surface, we can assume that no 
    responders in the responder chain, nor the default responder, handled the 
    event.
  */
  keyDown: function(evt) {
    var nextValidKeyView;

    // Handle tab key presses if we don't have a first responder already.
    if (evt.which === 9 && !this.get('firstResponder')) {
      // Cycle forwards by default, backwards if the shift key is held.
      if (evt.shiftKey) {
        nextValidKeyView = this.get('previousValidKeyView');
      } else {
        nextValidKeyView = this.get('nextValidKeyView');
      }

      if (nextValidKeyView) {
        this.set('firstResponder', nextValidKeyView);
        return true;
      }
    }

    return false;
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
  _sc_firstResponder: null, // Note: Required, we're strict about null checking.
  _sc_firstResponderDidChange: function(responder) {
    var old = this._sc_firstResponder,
        cur = this.get('firstResponder'),
        isInputSurface = SC.app.get('inputSurface') === this,
        isMenuSurface = SC.app.get('menuSurface') === this;

    sc_assert(old === null || old.kindOf(SC.Responder), "Blossom internal error: SC.Application^_sc_firstResponder is invalid.");
    sc_assert(cur === null || cur.kindOf(SC.Responder), "SC.Surface@firstResponder must either be null or an SC.Responder instance.");

    if (old === cur) return; // Nothing to do.

    if (old && old.willLoseFirstResponderTo) {
      old.willLoseFirstResponderTo(responder);
    }

    if (isInputSurface) {
      if (old && old.willLoseInputResponderTo) {
        old.willLoseInputResponderTo(cur);
      }
      if (cur && cur.willBecomeInputResponderFrom) {
        cur.willBecomeInputResponderFrom(old);
      }
    }

    if (isMenuSurface) {
      if (old && old.willLoseMenuResponderTo) {
        old.willLoseMenuResponderTo(cur);
      }
      if (cur && cur.willBecomeMenuResponderFrom) {
        cur.willBecomeMenuResponderFrom(old);
      }
    }

    if (old) {
      old.beginPropertyChanges();
      old.set('isFirstResponder', false);
      old.set('isInputResponder', false);
      old.set('isMenuResponder',  false);
      old.endPropertyChanges();
    }

    if (cur) {
      cur.beginPropertyChanges();
      cur.set('isMenuResponder',  isMenuSurface);
      cur.set('isInputResponder', isInputSurface);
      cur.set('isFirstResponder', true);
      cur.endPropertyChanges();
    }

    if (isMenuSurface) {
      if (cur && cur.didBecomeMenuResponderFrom) {
        cur.didBecomeMenuResponderFrom(old);
      }
      if (old && old.didLoseMenuResponderTo) {
        old.didLoseMenuResponderTo(cur);
      }
    }

    if (isInputSurface) {
      if (cur && cur.didBecomeInputResponderFrom) {
        cur.didBecomeInputResponderFrom(old);
      }
      if (old && old.didLoseInputResponderTo) {
        old.didLoseInputResponderTo(cur);
      }
    }

    if (cur && cur.didBecomeFirstResponderFrom) {
      cur.didBecomeFirstResponderFrom(old);
    }
  }.observes('firstResponder'),

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

  // .......................................................
  // APPLICATION FOCUS & BLUR SUPPORT
  //

  /**
    This property is maintained by SC.Application.  You can monitor it for
    changes if your surface needs to react to application focus/blur events.

    @type Boolean
  */
  applicationHasFocus: false

  // createLayersForContainer: function(container, width, height) {
  //   if (this._sc_didCreateLayers) return;
  //   this._sc_didCreateLayers = true;
  //
  //   // SC.Pane only has two layers `layer` and `hitTestLayer`.
  //   var K = this.get('layerClass');
  //   sc_assert(K && K.kindOf(SC.Layer));
  //
  //   // We want to allow the developer to provide a layout hash on the view,
  //   // or to override the 'layout' computed property.
  //   if (this.hasOwnProperty('layout')) {
  //     // It's still possible that layout is a computed property. Don't use
  //     // `get()` to find out!
  //     var layout = this.layout;
  //     if (typeof layout === "object") {
  //       // We assume `layout` is a layout hash. The layer will throw an
  //       // exception if `layout` is invalid -- don't test for that here.
  //       this._sc_layer = K.create({
  //         layout: layout,
  //         owner: this, // TODO: Do we need owner here?
  //         container: container,
  //         delegate: this
  //       });
  //       this._sc_hitTestLayer = K.create({
  //         layout: layout,
  //         isHitTestOnly: true,
  //         owner: this, // TODO: Do we need owner here?
  //         container: container,
  //         delegate: this
  //       });
  //     } else {
  //       this._sc_layer = K.create({
  //         // `layout` is whatever the default on SC.Layer is
  //         owner: this, // TODO: Do we need owner here?
  //         container: container,
  //         delegate: this
  //       });
  //       this._sc_hitTestLayer = K.create({
  //         // `layout` is whatever the default on SC.Layer is
  //         isHitTestOnly: true,
  //         owner: this, // TODO: Do we need owner here?
  //         container: container,
  //         delegate: this
  //       });
  //     }
  //
  //     // Only delete layout if it is not a computed property. This allows
  //     // the computed property on the prototype to shine through.
  //     if (typeof layout !== "function" || !layout.isProperty) {
  //       // console.log('deleting layout');
  //       delete this.layout;
  //     }
  //   } else {
  //     this._sc_layer = K.create({
  //       // `layout` is whatever the default on SC.Layer is
  //       owner: this, // TODO: Do we need owner here?
  //       container: container,
  //       delegate: this
  //     });
  //     this._sc_hitTestLayer = K.create({
  //       // `layout` is whatever the default on SC.Layer is
  //       isHitTestOnly: true,
  //       owner: this, // TODO: Do we need owner here?
  //       container: container,
  //       delegate: this
  //     });
  //   }
  //
  //   this.notifyPropertyChange('layer');
  //   this.notifyPropertyChange('hitTestLayer');
  // },

//   container: function(key, element) {
//     if (element !== undefined) {
//       this._pane_container = element ;
//     } else {
//       element = this._pane_container;
//       if (!element) {
//         this._pane_container = element = document.createElement('div');
//         element.id = this.get('containerId');
//         element.className = ['sc-pane', this.get('transitionsStyle')].join(' ');
// //        element.style.boxShadow = "0px 4px 14px rgba(0, 0, 0, 0.61)";
//         // element.style.webkitTransform = "translateZ(0)";
//         element.style.webkitTransform = "rotateY(45deg)";
//
//         // apply the layout style manually for now...
//         // var layoutStyle = this.get('layoutStyle');
//         // for (key in layoutStyle) {
//         //   if (!layoutStyle.hasOwnProperty(key)) continue;
//         //   if (layoutStyle[key] !== null) {
//         //     element.style[key] = layoutStyle[key];
//         //   }
//         // }
//
//         // Make sure SproutCore can find this view.
//         SC.surfaces[this.get('containerId')] = this;
//       }
//     }
//     return element ;
//   }.property(),

});

SC.AugmentBaseClassWithDisplayProperties(SC.Surface);

SC.Surface.OBSERVABLE_STRUCTURES = 'frame anchorPoint transform subsurfaceTransform'.w();

} // BLOSSOM
