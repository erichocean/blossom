// ==========================================================================
// Project:   Blossom - Modern, Cross-Platform Application Framework
// Copyright: ©2012 Fohr Motion Picture Studios. All rights reserved.
// License:   Licensed under the GPLv3 license (see BLOSSOM-LICENSE).
// ==========================================================================
/*globals sc_assert */

sc_require('widgets/widget');
sc_require('mixins/control');

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

/** @class

  A RadioWidget is used to create a group of radio buttons.  The user can use
  these buttons to pick from a choice of options.

  This view renders simulated radio buttons that can display a mixed state and
  has other features not found in platform-native controls.

  RadioWidget accepts a number of properties, for example:

      items: [{ title: "Red",
                value: "red",
                enabled: true,
                icon: "button_red" },
              { title: "Green",
                value: "green",
                enabled: true,
                icon: 'button_green' }],
      value: 'red',
      itemTitleKey: 'title',
      itemValueKey: 'value',
      itemIconKey: 'icon',
      itemIsEnabledKey: 'enabled',
      isEnabled: true,
      layoutDirection: SC.LAYOUT_HORIZONTAL

  Default layoutDirection is vertical.
  Default isEnabled is true.

  The value property can be either a string, as above, or an array of strings
  for pre-checking multiple values.

  The items array can contain either strings, or as in the example above a
  hash. When using a hash, make sure to also specify the itemTitleKey
  and itemValueKey you are using. Similarly, you will have to provide
  itemIconKey if you are using icons radio buttons. The individual items
  enabled property is true by default, and the icon is optional.

  @extends SC.Widget
  @since Blossom 1.0
*/
SC.RadioWidget = SC.Widget.extend(SC.Control, {

  /**
    The value of the currently selected item, and which will be checked in the
    UI. This can be either a string or an array with strings for checking
    multiple values.
  */
  value: null,

  /**
    This property indicates how the radio buttons are arranged.
  */
  layoutDirection: SC.LAYOUT_VERTICAL,

  /**
    The items property can be either an array with strings, or a
    hash. When using a hash, make sure to also specify the appropriate
    itemTitleKey, itemValueKey, itemIsEnabledKey and itemIconKey.
  */
  items: [],

  /**
    If items property is a hash, specify which property will function as
    the title with this itemTitleKey property.
  */
  itemTitleKey: null,

  /**
    If items property is a hash, specify which property will function as
    the item width with this itemWidthKey property. This is only used when
    layoutDirection is set to SC.LAYOUT_HORIONZTAL and can be used to override
    the default value provided by the framework or theme CSS.

    @property {String}
    @default null
  */
  itemWidthKey: null,

  /**
    If items property is a hash, specify which property will function as
    the value with this itemValueKey property.
  */
  itemValueKey: null,

  /**
    If items property is a hash, specify which property will function as
    the value with this itemIsEnabledKey property.
  */
  itemIsEnabledKey: null,

  /**
    If items property is a hash, specify which property will function as
    the value with this itemIconKey property.
  */
  itemIconKey: null,

  // ..........................................................
  // PRIVATE SUPPORT
  //

  /** @private
    Will iterate the items property to return an array with items that is
    indexed in the following structure:
      [0] => Title (or label)
      [1] => Value
      [2] => Enabled (true default)
      [3] => Icon (image URL)
  */
  displayItems: function() {
    var items = this.get('items'),
        loc = this.get('localize'),
        titleKey = this.get('itemTitleKey'),
        valueKey = this.get('itemValueKey'),
        widthKey = this.get('itemWidthKey'),
        isHorizontal = this.get('layoutDirection') === SC.LAYOUT_HORIZONTAL,
        isEnabledKey = this.get('itemIsEnabledKey'),
        iconKey = this.get('itemIconKey'),
        ret = [], max = (items)? items.get('length') : 0,
        item, title, width, value, idx, isArray, isEnabled, icon;

    for (idx=0;idx<max;idx++) {
      item = items.objectAt(idx);

      // if item is an array, just use the items...
      if (SC.typeOf(item) === SC.T_ARRAY) {
        title = item[0];
        value = item[1];

        // otherwise, possibly use titleKey,etc.
      } else if (item) {
        // get title.  either use titleKey or try to convert the value to a
        // string.
        if (titleKey) {
          title = item.get ? item.get(titleKey) : item[titleKey];
        } else title = (item.toString) ? item.toString() : null;

        if (widthKey && isHorizontal) {
          width = item.get ? item.get(widthKey) : item[widthKey];
        }

        if (valueKey) {
          value = item.get ? item.get(valueKey) : item[valueKey];
        } else value = item;

        if (isEnabledKey) {
          isEnabled = item.get ? item.get(isEnabledKey) : item[isEnabledKey];
        } else isEnabled = true;

        if (iconKey) {
          icon = item.get ? item.get(iconKey) : item[iconKey];
        } else icon = null;

        // if item is nil, use somedefaults...
      } else {
        title = value = icon = null;
        isEnabled = false;
      }

      // localize title if needed
      if (loc) title = title.loc();
      ret.push([title, value, isEnabled, icon, width]);
    }

    return ret; // done!
  }.property('items', 'itemTitleKey', 'itemWidthKey', 'itemValueKey',
             'itemIsEnabledKey', 'localize', 'itemIconKey'),

  render: function(ctx) {},

  // ..........................................................
  // EVENT HANDLING
  //

  /** @private
    Remove the active class on mouseExited if mouse is down.
  */
  mouseExited: function(evt) {
    var active = this._sc_activeRadioButton;

    document.body.style.cursor = "default";
    if (this.isMouseDown) { this.set('isActive', false); }
    if (active) active.set('isActive', false);
    return true;
  },

  /** @private
    If mouse was down and we renter the button area, set the active state 
    again.
  */
  mouseEntered: function(evt) {
    var active = this._sc_activeRadioButton,
        button = evt.layer;

    if (button !== this && button.get('isEnabled') && this.get('isEnabled')) {
      document.body.style.cursor = "pointer";
    }
    if (this.isMouseDown) { this.set('isActive', true); }
    if (active) active.set('isActive', true);
    return true;
  },

  /**
    If the user clicks on of the items mark it as active on mouseDown unless
    is disabled.

    Save the element that was clicked on so we can remove the active state on
    mouseUp.
  */
  mouseDown: function(evt) {
    var button = evt.layer;

    // Nothing to do if we're not enabled.
    if (!this.get('isEnabled')) {
      return true;

    // Nothing to do if a radio button wasn't actually clicked on.
    } else if (button === this) {
      return false;

    // Nothing to do if the radio buttion isn't enabled.
    } else if (!button.get('isEnabled')) {
      return true;

    // Mark the radio button as active.
    } else {
      this._sc_activeRadioButton = button;
      button.set('isActive', true);

      // Even if radiobuttons are not set to get firstResponder, allow 
      // default action, that way textfields loose focus as expected.
      evt.allowDefault();
      return true;
    }
  },

  /**
    If we have a radio element that was clicked on previously, make sure we
    remove the active state. Then update the value if the item clicked is
    enabled.
  */
  mouseUp: function(evt) {
    var active = this._sc_activeRadioButton;

    if (active) active.set('isActive', false);
    this._sc_activeRadioButton = null;

    // Nothing to do if we're not enabled.
    if (!this.get('isEnabled')) {
      return true;

    // Nothing to do if there's no active radio button.
    } else if (!active) {
      return true;

    // Okay, we need to deal with the mouseUp event.
    } else {
      sc_assert(active);
      var button = evt.layer;

      // Nothing to do if the mouse did not go up over a radio button.
      if (button === this) {
        return true;

      // Nothing to do if the mouse did not go up over the active radio button.
      } else if (button !== active) {
        return true;

      // Okay, the mouse went up over the active radio button.  We need to 
      // update our value with it's value, select it, and unselected the 
      // currently selected radio button.
      } else {
        var index = this.get('sublayers').indexOf(active),
            item = this.get('displayItems').objectAt(index);

        sc_assert(index >= 0);
        sc_assert(item);

        // Update our 'value' property.  _sc_valueDidChange() will handle 
        // updating the radio button's isSelected values.
        this.set('value', item[1]);
        return true;
      }
    }
  },

  _sc_valueDidChange: function() {
    var value = this.get('value'),
        displayItems = this.get('displayItems'),
        buttons = this.get('sublayers'),
        selected;

    displayItems.forEach(function(item, idx) {
      if (item[1] === value) selected = buttons[idx];
    });

    if (selected) {
      selected.set('isSelected', true);
      buttons.without(selected).invoke('setIfChanged', 'isSelected', false);
    } else {
      buttons.invoke('setIfChanged', 'isSelected', false);
    }
  }.observes('value'),

  /** @private
    If the items array itself changes, add/remove observer on item...
  */
  _sc_itemsDidChange: function() {
    var func = this._sc_itemContentDidChange,
        old = this._sc_items,
        cur = this.get('items');

    if (old === cur) return;

    if (old) old.removeObserver('[]', this, func);
    this._sc_items = cur;
    if (cur) cur.addObserver('[]', this, func);

    this._sc_itemContentDidChange();
  }.observes('items'),

  /**
    Invoked whenever the item array or an item in the array is changed.
    This method will regenerate the layer's subsurfaces.
  */
  _sc_itemContentDidChange: function() {
    var displayItems = this.get('displayItems'),
        value = this.get('value'),
        isEnabled = this.get('isEnabled');

    // console.log(displayItems);

    var buttons = [];
    displayItems.forEach(function(item, idx) {
      var button = SC.RadioButtonWidget.create({
        layout: { left: 0, right: 0, top: idx*24, height: 24 },
        title: item[0],
        isEnabled: item[2],
        isSelected: item[1] === value? true : false
      });
      buttons.push(button);
    });

    this.set('sublayers', buttons);
  },

  init: function() {
    arguments.callee.base.apply(this, arguments);
    this._sc_itemsDidChange();
  }

});

sc_require('widgets/button');

/** @private */
SC.RadioButtonWidget = SC.ButtonWidget.extend({

  behavior: null, // Allows SC.RadioWidget to define our behavior.

  buttonBehavior: SC.TOGGLE_BEHAVIOR,

  theme: 'radio',

  render: function(ctx) {
    // console.log('SC.RadioButtonWidget#render()', SC.guidFor(this));
    var title = this.get('displayTitle') || "(no title)",
        selected = this.get('isSelected'),
        disabled = !this.get('isEnabled'),
        mixed = (selected === SC.MIXED_STATE),
        active = this.get('isActive'),
        bounds = this.get('bounds'),
        w = bounds.width, h = bounds.h;

    selected = (selected && (selected !== SC.MIXED_STATE));
    disabled = disabled || !this.getPath('superlayer.isEnabled');

    sc_assert(this.get('theme') === 'radio');

    ctx.beginPath();
    ctx.arc(9, 12, 7, 0, Math.PI*2);
    ctx.closePath();

    var radgrad = ctx.createRadialGradient(9, 2, 0.5, 9, 14, 7);
    radgrad.addColorStop(0, 'rgb(252,188,126)');
    radgrad.addColorStop(1, 'rgb(255,102,0)');

    if ((disabled && !selected) || (disabled && !active && !selected)) {
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = radgrad;
      ctx.fill();

      ctx.globalAlpha = 0.5;
      ctx.strokeStyle = white;
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.font = "10pt Helvetica";
      ctx.textBaseline = "middle";
      ctx.textAlign = "left";
      ctx.shadowBlur = 0;
      ctx.shadowColor = "rgba(0,0,0,0)";
      ctx.fillText(title, 22, bounds.height/2 + 1);

    } else if (disabled) {
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = radgrad;
      ctx.fill();

      ctx.strokeStyle = white;
      ctx.lineWidth = 2;
      ctx.stroke();
    
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.font = "10pt Helvetica";
      ctx.textBaseline = "middle";
      ctx.textAlign = "left";
      ctx.shadowBlur = 0;
      ctx.shadowColor = "rgba(0,0,0,0)";
      ctx.fillText(title, 22, bounds.height/2 + 1);

    } else if (active) {
      radgrad = ctx.createRadialGradient(9, 2, 0.5, 9, 14, 7);
      radgrad.addColorStop(0, 'rgb(252,188,126)');
      radgrad.addColorStop(1, 'rgb(255,178,128)');

      ctx.fillStyle = radgrad;
      ctx.fill();
      ctx.strokeStyle = white;
      ctx.lineWidth = 2;
      ctx.stroke();
    
      ctx.fillStyle = white;
      ctx.font = "10pt Helvetica";
      ctx.textBaseline = "middle";
      ctx.textAlign = "left";
      ctx.shadowBlur = 0;
      ctx.shadowColor = "rgba(0,0,0,0)";
      ctx.fillText(title, 22, bounds.height/2 + 1);

    } else {
      // console.log('rendering normally');
      ctx.globalAlpha = 1.0;
      ctx.fillStyle = radgrad;
      ctx.fill();

      ctx.strokeStyle = white;
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = white;
      ctx.font = "10pt Helvetica";
      ctx.textBaseline = "middle";
      ctx.textAlign = "left";
      ctx.shadowBlur = 0;
      ctx.shadowColor = "rgba(0,0,0,0)";
      ctx.fillText(title, 22, bounds.height/2 + 1);
    }

    if ((selected && !active) || (!selected && active)) {
      // Draw the button mark.
      ctx.beginPath();
      ctx.arc(9, 12, 3, 0, Math.PI*2);
      ctx.closePath();
      ctx.fillStyle = (active || disabled)? 'rgba(255,255,255,0.7)' : white;
      ctx.fill();
      ctx.strokeStyle = (active || disabled)? 'rgba(255,255,255,0.7)' : white;
      ctx.lineCap = 'round';
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }
  }

});
