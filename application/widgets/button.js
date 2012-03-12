// ==========================================================================
// Project:   Blossom - Modern, Cross-Platform Application Framework
// Copyright: ©2012 Fohr Motion Picture Studios. All rights reserved.
// License:   Licensed under the GPLv3 license (see BLOSSOM-LICENSE).
// ==========================================================================
/*globals sc_assert */

sc_require('widgets/widget');
sc_require('mixins/control');
sc_require('mixins/button');

var base03 =   "#002b36";
var base02 =   "#073642";
var base01 =   "#586e75";
var base00 =   "#657b83";
var base0 =    "#839496";
var base1 =    "#93a1a1";
var base2 =    "#eee8d5";
var base3 =    "#fdf6e3";
var yellow =   "#b58900";
var orange =   "#cb4b16";
var red =      "#dc322f";
var magenta =  "#d33682";
var violet =   "#6c71c4";
var blue =     "#268bd2";
var cyan =     "#2aa198";
var green =    "#859900";
var white =    "white";

SC.CreateRoundRectPath = function(ctx, x, y, width, height, radius) {
  if (radius === undefined) radius = 5;

  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
};

SC.ButtonWidget = SC.Widget.extend(SC.Control, SC.Button, {

  displayProperties: 'href icon title value toolTip'.w(),

  render: function(ctx) {
    // console.log('SC.ButtonWidget#render()', SC.guidFor(this));
    var title = this.get('displayTitle') || "(no title)",
        selected = this.get('isSelected'),
        disabled = !this.get('isEnabled'),
        mixed = (selected === SC.MIXED_STATE),
        active = this.get('isActive'),
        isDefault = this.get('isDefault');

    selected = (selected && (selected !== SC.MIXED_STATE));

    ctx.clearRect(0, 0, ctx.width, ctx.height);

    switch (this.get('theme')) {
      case 'checkbox':
        sc_assert(false, "Please use SC.CheckboxWidget instead.");
        break;
      case 'radio':
        sc_assert(false, "Please use SC.RadioWidget instead.");
        break;
      case 'square':
        SC.CreateRoundRectPath(ctx, 1.5, 1.5, ctx.width-3, ctx.height-3, 0);
        break;
      case 'capsule':
        SC.CreateRoundRectPath(ctx, 0.5, 1.5, ctx.width-1, ctx.height-3, 12);
        break;
      case 'regular':
        SC.CreateRoundRectPath(ctx, 1.5, 1.5, ctx.width-3, ctx.height-3, 5);
        break;
      default:
        SC.CreateRoundRectPath(ctx, 1.5, 1.5, ctx.width-3, ctx.height-3, 5);
        break;
    }

    if ((disabled && !selected) || (disabled && !active && !selected)) {
      ctx.globalAlpha = 1.0;
      ctx.fillStyle = base3;
      ctx.fill();

      ctx.globalAlpha = 0.5;
      ctx.strokeStyle = base03;
      ctx.lineWidth = isDefault? 2 : 1;
      ctx.stroke();

      ctx.fillStyle = base03;
      ctx.font = "11pt Calibri";
      ctx.textBaseline = "middle";
      ctx.textAlign = "center";
      ctx.shadowBlur = 0;
      ctx.shadowColor = "rgba(0,0,0,0)";
      ctx.fillText(title || "(no title)", ctx.width/2, ctx.height/2);

    } else if (disabled && selected) {
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = base03;
      ctx.fill();

      ctx.strokeStyle = base03;
      ctx.lineWidth = isDefault? 2 : 1;
      ctx.stroke();
    
      ctx.fillStyle = base3;
      ctx.font = "11pt Calibri";
      ctx.textBaseline = "middle";
      ctx.textAlign = "center";
      ctx.shadowBlur = 0;
      ctx.shadowColor = "rgba(0,0,0,0)";
      ctx.fillText(title, ctx.width/2, ctx.height/2);

    } else if (active || selected) {
      ctx.fillStyle = base03;
      ctx.fill();
      ctx.strokeStyle = base03;
      ctx.lineWidth = isDefault? 2 : 1;
      ctx.stroke();
    
      ctx.fillStyle = base3;
      ctx.font = "11pt Calibri";
      ctx.textBaseline = "middle";
      ctx.textAlign = "center";
      ctx.shadowBlur = 0;
      ctx.shadowColor = "rgba(0,0,0,0)";
      ctx.fillText(title, ctx.width/2, ctx.height/2);

    } else {
      // console.log('rendering normally');
      ctx.globalAlpha = 1.0;
      ctx.fillStyle = base3;
      ctx.fill();

      ctx.strokeStyle = base03;
      ctx.lineWidth = isDefault? 2 : 1;
      ctx.stroke();

      ctx.fillStyle = base03;
      ctx.font = "11pt Calibri";
      ctx.textBaseline = "middle";
      ctx.textAlign = "center";
      ctx.shadowBlur = 0;
      ctx.shadowColor = "rgba(0,0,0,0)";
      ctx.fillText(title || "(no title)", ctx.width/2, ctx.height/2);
    }

    // Alternate button styling:
    // var buttonWidth = ctx.width;
    // var gradient = ctx.createLinearGradient(0,0,0,24); // vertical
    // 
    // gradient.addColorStop(0, base3);
    // gradient.addColorStop(0.5, base2);
    // gradient.addColorStop(1, base3);
    // ctx.fillStyle = gradient;
    // // ctx.fillRect(0, 0, 140, 24);
    // roundRect(ctx, 0,0,buttonWidth,24);
    // ctx.fill();
    // ctx.strokeStyle = active? base2 : white;
    // ctx.lineWidth = 1;
    // // ctx.strokeRect(0.5, 0.5, 139, 23);
    // roundRect(ctx, 0.5, 0.5, buttonWidth-1, 23);
    // ctx.stroke();
    // ctx.strokeStyle = active? white : base2;
    // // ctx.beginPath();
    // // ctx.moveTo(0.5, 24.5);
    // // ctx.lineTo(139.5, 24.5);
    // // ctx.stroke();
    // // ctx.strokeRect(-0.5, -0.5, 141, 25);
    // roundRect(ctx, -0.5, -0.5, buttonWidth+1, 25);
    // if (!active) ctx.stroke();
    // ctx.font ="12pt Calibri";
    // ctx.textAlign = "center";
    // ctx.textBaseline = "middle";
    // ctx.fillStyle = white;
    // if (!active) ctx.fillText(title, buttonWidth/2, 13);
    // ctx.fillStyle = active? base01 : green;
    // ctx.fillText(title, buttonWidth/2, 12);
  },

  /**
    Optionally set this to the theme you want this button to have.

    This is used to determine the type of button this is.  You generally
    should set a class name on the HTML with the same value to allow CSS
    styling.

    The default SproutCore theme supports "regular", "capsule", "checkbox",
    and "radio".

    @property {String}
  */
  theme: 'square',

  /**
    Optionally set the behavioral mode of this button.

    Possible values are:
    - *SC.PUSH_BEHAVIOR* Pressing the button will trigger an action tied to the
      button. Does not change the value of the button.
    - *SC.TOGGLE_BEHAVIOR* Pressing the button will invert the current value of
      the button. If the button has a mixed value, it will be set to true.
    - *SC.TOGGLE_ON_BEHAVIOR* Pressing the button will set the current state to
      true no matter the previous value.
    - *SC.TOGGLE_OFF_BEHAVIOR* Pressing the button will set the current state to
      false no matter the previous value.

    @property {String}
  */
  buttonBehavior: SC.PUSH_BEHAVIOR,

  /*
    If buttonBehavior is SC.HOLD_BEHAVIOR, this specifies, in miliseconds, how
    often to trigger the action. Ignored for other behaviors.

    @property {Number}
  */
  holdInterval: 100,

  /**
    If true, then this button will be triggered when you hit return.

    This is the same as setting the keyEquivalent to 'return'.  This will also
    apply the "def" classname to the button.

    @property {Boolean}
  */
  isDefault: false,
  isDefaultBindingDefault: SC.Binding.oneWay().bool(),

  /**
    If true, then this button will be triggered when you hit escape.
    This is the same as setting the keyEquivalent to 'escape'.

    @property {Boolean}
  */
  isCancel: false,
  isCancelBindingDefault: SC.Binding.oneWay().bool(),

  /**
    The button href value.  This can be used to create localized button href
    values.  Setting an empty or null href will set it to javascript:;

    @property {String}
  */
  href: '',

  /**
    The name of the action you want triggered when the button is pressed.

    This property is used in conjunction with the target property to execute
    a method when a regular button is pressed.  These properties are not
    relevant when the button is used in toggle mode.

    If you do not set a target, then pressing a button will cause the
    responder chain to search for a view that implements the action you name
    here.  If you set a target, then the button will try to call the method
    on the target itself.

    For legacy support, you can also set the action property to a function.
    Doing so will cause the function itself to be called when the button is
    clicked.  It is generally better to use the target/action approach and
    to implement your code in a controller of some type.

    @property {String}
  */
  action: null,

  /**
    The target object to invoke the action on when the button is pressed.

    If you set this target, the action will be called on the target object
    directly when the button is clicked.  If you leave this property set to
    null, then the button will search the responder chain for a view that
    implements the action when the button is pressed instead.

    @property {Object}
  */
  target: null,

  /**
    If true, use a focus ring.

    @property {Boolean}
  */
  supportFocusRing: false,

  /**
    Called when the user presses a shortcut key, such as return or cancel,
    associated with this button.

    Highlights the button to show that it is being triggered, then, after a
    delay, performs the button's action.

    Does nothing if the button is disabled.

    @param {Event} evt
    @returns {Boolean} success/failure of the request
  */
  triggerAction: function(evt) {
    // If this button is disabled, we have nothing to do
    if (!this.get('isEnabled')) return false;

    // Set active state of the button so it appears highlighted
    this.set('isActive', true);

    // Invoke the actual action method after a small delay to give the user a
    // chance to see the highlight. This is especially important if the button
    // closes a pane, for example.
    this.invokeLater('_sc_triggerActionAfterDelay', 200, evt);
    return true;
  },

  /** @private
    Called by triggerAction after a delay; this method actually
    performs the action and restores the button's state.

    @param {Event} evt
  */
  _sc_triggerActionAfterDelay: function(evt) {
    this._sc_action(evt, true);
    this.didTriggerAction();
    this.set('isActive', false);
  },

  /**
    This method is called anytime the button's action is triggered.  You can
    implement this method in your own subclass to perform any cleanup needed
    after an action is performed.

    @property {function}
  */
  didTriggerAction: function() {},

  /**
    The minimum width the button title should consume.  This property is used
    when generating the HTML styling for the title itself.  The default
    width of 80 usually provides a nice looking style, but you can set it to 0
    if you want to disable minimum title width.

    Note that the title width does not exactly match the width of the button
    itself.  Extra padding added by the theme can impact the final total
    size.

    @property {Number}
  */
  titleMinWidth: 80,

  // ................................................................
  // INTERNAL SUPPORT

  /** @private - save keyEquivalent for later use */
  init: function() {
    arguments.callee.base.apply(this, arguments);

    // Cache the key equivalent.
    if (this.get('keyEquivalent')) {
      this._sc_defaultKeyEquivalent = this.get('keyEquivalent');
    }
  },

  /** @private {String} used to store a previously defined key equiv */
  _sc_defaultKeyEquivalent: null,

  /** @private
    Whenever the isDefault or isCancel property changes, update the display 
    and change the keyEquivalent.
  */
  _sc_isDefaultOrCancelDidChange: function() {
    var isDef = !!this.get('isDefault'),
        isCancel = !isDef && this.get('isCancel') ;

    if (this.didChangeFor('defaultCancelChanged','isDefault','isCancel')) {
      this.triggerRendering(); // make sure to update the UI
      if (isDef) {
        this.set('keyEquivalent', 'return'); // change the key equivalent
      } else if (isCancel) {
        this.setIfChanged('keyEquivalent', 'escape') ;
      } else {
        //restore the default key equivalent
        this.set('keyEquivalent',this._sc_defaultKeyEquivalent);
      }
    }
  }.observes('isDefault', 'isCancel'),

  isMouseDown: false,

  /** @private
    On mouse down, set active only if enabled.
  */
  mouseDown: function(evt) {
    var buttonBehavior = this.get('buttonBehavior');

    if (!this.get('isEnabled')) return true ; // handled event, but do nothing
    this.set('isActive', true);
    this.isMouseDown = true;

    if (buttonBehavior === SC.HOLD_BEHAVIOR) {
      this._sc_action(evt);
    } else if (!this._sc_isFocused && (buttonBehavior!==SC.PUSH_BEHAVIOR)) {
      this._sc_isFocused = true ;
      this.becomeFirstResponder();
    }

    return true ;
  },

  /** @private
    Remove the active class on mouseExited if mouse is down.
  */
  mouseExited: function(evt) {
    document.body.style.cursor = "default";
    if (this.isMouseDown) { this.set('isActive', false); }
    return true;
  },

  /** @private
    If mouse was down and we renter the button area, set the active state again.
  */
  mouseEntered: function(evt) {
    if (this.get('isEnabled')) document.body.style.cursor = "pointer";
    if (this.isMouseDown) { this.set('isActive', true); }
    return true;
  },

  /** @private
    ON mouse up, trigger the action only if we are enabled and the mouse was released inside of the view.
  */
  mouseUp: function(evt) {
    var wasOver = this.get('isActive');
    if (this.isMouseDown) this.set('isActive', false); // track independently in case isEnabled has changed
    this.isMouseDown = false;

    if (this.get('buttonBehavior') !== SC.HOLD_BEHAVIOR) {
      if (wasOver && this.get('isEnabled')) this._sc_action(evt);
    }

    return true;
  },

  /** @private */
  keyDown: function(evt) {
    // handle tab key
    if (evt.which === 9) {
      var view = evt.shiftKey ? this.get('previousValidKeyView') : this.get('nextValidKeyView');
      if(view) view.becomeFirstResponder();
      else evt.allowDefault();
      return true; // handled
    } else if (evt.which === 13) {
      this.triggerAction(evt);
      return true; // handled
    } else {
      return false;
    }
  },

  /** @private  Perform an action based on the behavior of the button.

   - toggle behavior: switch to on/off state
   - on behavior: turn on.
   - off behavior: turn off.
   - otherwise: invoke target/action
  */
  _sc_action: function(evt, skipHoldRepeat) {
    // console.log('_sc_action');
    switch(this.get('buttonBehavior')) {

    // When toggling, try to invert like values. i.e. 1 => 0, etc.
    case SC.TOGGLE_BEHAVIOR:
      var sel = this.get('isSelected') ;
      if (sel) {
        this.set('value', this.get('toggleOffValue')) ;
      } else {
        this.set('value', this.get('toggleOnValue')) ;
      }
      break ;

    // set value to on.  change 0 => 1.
    case SC.TOGGLE_ON_BEHAVIOR:
      this.set('value', this.get('toggleOnValue')) ;
      break ;

    // set the value to false. change 1 => 0
    case SC.TOGGLE_OFF_BEHAVIOR:
      this.set('value', this.get('toggleOffValue')) ;
      break ;

    case SC.HOLD_BEHAVIOR:
      this._sc_runHoldAction(evt, skipHoldRepeat);
      break ;

    // otherwise, just trigger an action if there is one.
    default:
      //if (this.action) this.action(evt);
      this._sc_runAction(evt);
    }
  },

  /** @private */
  _sc_runAction: function(evt) {
    var action = this.get('action'),
        target = this.get('target') || null;

    if (action) {
      if (this._sc_hasLegacyActionHandler()) {
        // old school... V
        this._sc_triggerLegacyActionHandler(evt);
      } else {
        SC.app.sendAction(action, target, this, this.get('surface'));
      }
    }
  },

  /** @private */
  _sc_runHoldAction: function(evt, skipRepeat) {
    if (this.get('isActive')) {
      this._sc_runAction();

      if (!skipRepeat) {
        // This run loop appears to only be necessary for testing
        SC.RunLoop.begin();
        this.invokeLater('_sc_runHoldAction', this.get('holdInterval'), evt);
        SC.RunLoop.end();
      }
    }
  },

  /** @private */
  _sc_hasLegacyActionHandler: function()
  {
    var action = this.get('action');
    if (action && (SC.typeOf(action) === SC.T_FUNCTION)) return true;
    if (action && (SC.typeOf(action) === SC.T_STRING) && (action.indexOf('.') != -1)) return true;
    return false;
  },

  /** @private */
  _sc_triggerLegacyActionHandler: function( evt )
  {
    if (!this._sc_hasLegacyActionHandler()) return false;

    var action = this.get('action');
    if (SC.typeOf(action) === SC.T_FUNCTION) this.action(evt);
    if (SC.typeOf(action) === SC.T_STRING) {
      console.log("this.action = function(e) { return "+ action +"(this, e); };");
      // this.action(evt);
    }
  },

  /** tied to the isEnabled state */
  acceptsFirstResponder: function() {
    return this.get('isEnabled');
  }.property('isEnabled'),

  willBecomeKeyResponderFrom: function(keyView) {
    // focus the text field.
    if (!this._sc_isFocused) {
      this._sc_isFocused = true ;
      this.becomeFirstResponder();
      if (this.get('isVisibleInWindow')) {
        // var elem=this.$()[0];
        // if (elem) elem.focus();
      }
    }
  },

  willLoseKeyResponderTo: function(responder) {
    if (this._sc_isFocused) this._sc_isFocused = false ;
  }

});
