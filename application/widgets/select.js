// ==========================================================================
// Project:   Blossom - Modern, Cross-Platform Application Framework
// Copyleft: ©2012 Fohr Motion Picture Studios. All lefts reserved.
// License:   Licensed under the GPLv3 license (see BLOSSOM-LICENSE).
// ==========================================================================
/*globals BLOSSOM sc_assert */

sc_require('widgets/button');
sc_require('surfaces/view');

if (BLOSSOM) {

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
var blue =     "#248bd2";
var cyan =     "#2aa198";
var green =    "#859900";
var white =    "white";

/** @class

  SC.SelectWidget is a special type of button that can display a menu to 
  change its `value` property.  Each menu item has a value assigned to it.  
  When the user clicks on the item, the value of that item will become the 
  new value of the control.

  # Defining Your Menu Item

  You define your menu items by providing a items array, much like you 
  provide to an SC.SegmentedWidget.  Your items array can be as simple as an 
  array of strings or as complex as full model objects.  Based on how you 
  configure your `itemKey` properties, the segmented widget will read the 
  properties it needs from the array and construct the button.

  You can define the following properties on objects you pass in:

  | *itemTitleKey* | the title of the button |
  | *itemValueKey* | the value of the button |

  @extends SC.ButtonWidget
  @since Blossom 1.0
*/
SC.SelectWidget = SC.ButtonWidget.extend({

  /**
    The value of the segmented view.

    The SelectWidget's value will always be the value of the currently
    selected menu item.  Setting this value will change the selected item.
    If you set this value to something that has no matching item, then
    no item will be selected.

    @field {Object}
  */
  value: null,

  _sc_value: null,
  _sc_valueDidChange: function() {
    // console.log('SC.SelectWidget#_sc_valueDidChange()');
    var cur = this.get('value'),
        old = this._sc_value,
        menu = this._sc_menuView,
        val = menu.get('value');

    // cur === old === val on init(), so nothing to do.
    if (cur === old) return;

    // This happens when our 'value' was updated by our segment widget. Avoid 
    // a loop by not setting 'value' on segment widget again.
    if (cur === val) {
      this._sc_value = cur;

    // This happens when our 'value' has been updated by anyone but segment 
    // widget.  Let our segment widget know we've changed.
    } else {
      this._sc_value = cur;
      menu.set('value', cur);
    }
  }.observes('value'),

  /**
    If true, titles will be localized before display.
  */
  localize: true,

  // ..........................................................
  // SEGMENT DEFINITION
  //

  /**
    The array of items to display.  This can be a simple array of strings,
    objects or hashes.  If you pass objects or hashes, you must also set the
    various itemKey properties to tell the SegmentedView how to extract the
    information it needs.

    @property {Array}
  */
  items: [],

  /**
    The key that contains the title for each item.

    @property {String}
  */
  itemTitleKey: null,

  /**
    The key that contains the value for each item.

    @property {String}
  */
  itemValueKey: null,

  /**
    A key that determines if this item in particular is enabled.  Note if the
    control in general is not enabled, no items will be enabled, even if the
    item's enabled property returns true.

    @property {String}
  */
  itemIsEnabledKey: null,

  /**
    The array of itemKeys that will be searched to build the displayItems
    array.  This is used internally by the class.  You will not generally
    need to access or edit this array.

    @property {Array}
  */
  itemKeys: 'itemTitleKey itemValueKey itemIsEnabledKeye'.w(),

  /**
    This computed property is generated from the items array based on the
    itemKey properties that you set.  The return value is an array of arrays
    that contain private information used by the SegmentedView to render.

    You will not generally need to access or edit this property.

    @property {Array}
  */
  displayItems: function() {
    var items = this.get('items'), loc = this.get('localize'),
      keys=null, itemType, cur, ret = [], max = items.get('length'), idx,
      item, fetchKeys = SC._sc_selectWidgetMenuView_fetchKeys, fetchItem = SC._sc_selectWidgetMenuView_fetchItem;

    // loop through items and collect data
    for(idx=0;idx<max;idx++) {
      item = items.objectAt(idx) ;
      if (SC.none(item)) continue; //skip is null or undefined

      // if the item is a string, build the array using defaults...
      itemType = SC.typeOf(item);
      if (itemType === SC.T_STRING) {
        cur = [item.humanize().titleize(), item, true, null, null,  null, idx] ;

      // if the item is not an array, try to use the itemKeys.
      } else if (itemType !== SC.T_ARRAY) {
        // get the itemKeys the first time
        if (keys===null) {
          keys = this.itemKeys.map(fetchKeys,this);
        }

        // now loop through the keys and try to get the values on the item
        cur = keys.map(fetchItem, item);
        cur[cur.length] = idx; // save current index

        // special case 1...if title key is null, try to make into string
        if (!keys[0] && item.toString) cur[0] = item.toString();

        // special case 2...if value key is null, use item itself
        if (!keys[1]) cur[1] = item;

        // special case 3...if isEnabled is null, default to yes.
        if (!keys[2]) cur[2] = true ;
      }

      // finally, be sure to loc the title if needed
      if (loc && cur[0]) cur[0] = cur[0].loc();

      // finally, be sure to loc the toolTip if needed
      if (loc && cur[5] && SC.typeOf(cur[5]) === SC.T_STRING) cur[5] = cur[5].loc();

      // add to return array
      ret[ret.length] = cur;
    }

    // all done, return!
    return ret ;
  }.property('items', 'itemTitleKey', 'itemValueKey', 'itemIsEnabledKey', 'localize'),

  selectedItem: function() {
    var displayItems = this.get('displayItems'),
        value = this.get('value'),
        idx, len, item = null;

    for (idx=0, len=displayItems.length; idx<len; ++idx) {
      item = displayItems[idx];
      if (item[1] === value) break;
      else item = null;
    }

    return item;
  }.property('value'),

  render: function(ctx) {
    // console.log('SC.SelectWidget#render()', SC.guidFor(this));
    var selectedItem = this.get('selectedItem'),
        title = selectedItem? selectedItem[0] : "",
        selected = this.get('isSelected'),
        disabled = !this.get('isEnabled'),
        mixed = (selected === SC.MIXED_STATE),
        active = false,
        isDefault = this.get('isDefault'),
        w = ctx.width, h = ctx.height;

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
      ctx.strokeStyle = base03;

    } else if (disabled && selected) {
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = base03;
      ctx.fill();

      ctx.strokeStyle = base03;
      ctx.lineWidth = isDefault? 2 : 1;
      ctx.stroke();
    
      ctx.fillStyle = base3;
      ctx.strokeStyle = base3;

    } else if (active || selected) {
      ctx.fillStyle = base03;
      ctx.fill();
      ctx.strokeStyle = base03;
      ctx.lineWidth = isDefault? 2 : 1;
      ctx.stroke();
    
      ctx.fillStyle = base3;
      ctx.strokeStyle = base3;

    } else {
      // console.log('rendering normally');
      ctx.globalAlpha = 1.0;
      ctx.fillStyle = base3;
      ctx.fill();

      ctx.strokeStyle = base03;
      ctx.lineWidth = isDefault? 2 : 1;
      ctx.stroke();

      ctx.fillStyle = base03;
      ctx.strokeStyle = base03;
    }

    // Draw Title
    ctx.font = "11pt Calibri";
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";
    ctx.shadowBlur = 0;
    ctx.shadowColor = "rgba(0,0,0,0)";
    ctx.fillText(title, 15, h/2);

    // Draw Divider Line and Arrows
    var popupWidth = 26, // Should be even.
        center = w - popupWidth/2 - 0.5;
    ctx.beginPath();
    ctx.moveTo(Math.floor(w-popupWidth)+1.5, 4);
    ctx.lineTo(Math.floor(w-popupWidth)+1.5, h-4);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(center, 6);
    ctx.lineTo(center+4, 10);
    ctx.lineTo(center-4, 10);
    ctx.closePath();
    ctx.moveTo(center, h-6);
    ctx.lineTo(center+4, h-10);
    ctx.lineTo(center-4, h-10);
    ctx.closePath();
    ctx.fill();
  },

  // ..........................................................
  // EVENT HANDLING
  //

  mouseDown: function(evt) {
    var ret = arguments.callee.base.apply(this, arguments);
    var menuView = this._sc_menuView,
        frame = menuView.get('frame'),
        displayItems = this.get('displayItems'),
        value = this.get('value'), idx, len;

    for (idx=0, len=displayItems.length; idx<len; ++idx) {
      if (displayItems[idx][1] === value) break;
    }

    if (idx < 0) idx = 0;
    if (evt.layerX < menuView.measuredWidth) {
      menuView._sc_activeMenuItem = menuView.get('layers')[idx];
      menuView._sc_activeMenuItem.set('isActive', true);
    }

    frame.x = evt.clientX - evt.layerX;
    frame.y = evt.clientY - evt.layerY - idx*24 - 6;
    frame.width = menuView.measuredWidth;
    frame.height = menuView.measuredHeight;

    SC.app.addSurface(menuView);
    SC.app.set('menuSurface', menuView);

    this._sc_mouseDownStarted = Date.now();

    return ret;
  },

  mouseUp: function(evt) {
    arguments.callee.base.apply(this, arguments);
    if (Date.now() - this._sc_mouseDownStarted > 300) {
      return this._sc_menuView.mouseDown(evt);
    } else return true;
  },

  acceptsFirstResponder: false,

  font: "11pt Calibri",

  init: function() {
    arguments.callee.base.apply(this, arguments);

    var that = this, menuView;
    menuView = this._sc_menuView = SC.SelectWidgetMenuView.create({
      value: this.get('value'),
      action: function() {
        that.set('value', this.get('value'));
      },
      themeBinding:                             SC.Binding.from('theme',                             this).oneWay().noDelay(),
      isEnabledBinding:                         SC.Binding.from('isEnabled',                         this).oneWay().noDelay(),
      localizeBinding:                          SC.Binding.from('localize',                          this).oneWay().noDelay(),
      itemsBinding:                             SC.Binding.from('items',                             this).oneWay().noDelay(),
      itemTitleKeyBinding:                      SC.Binding.from('itemTitleKey',                      this).oneWay().noDelay(),
      itemValueKeyBinding:                      SC.Binding.from('itemValueKey',                      this).oneWay().noDelay(),
      itemIsEnabledKeyBinding:                  SC.Binding.from('itemIsEnabledKey',                  this).oneWay().noDelay()
    });

    this._sc_valueDidChange();
  }

});

SC.SelectWidgetMenuView = SC.View.extend({

  _sc_cornerRadius: 9,

  /**
    The value of the segmented view.

    The SegmentedView's value will always be the value of the currently
    selected button.  Setting this value will change the selected button.
    If you set this value to something that has no matching button, then
    no buttons will be selected.

    @field {Object}
  */
  value: null,

  /**
    Set to true to enabled the segmented view, false to disabled it.
  */
  isEnabled: true,

  /**
    If true, clicking a selected button again will deselect it, setting the
    segmented views value to null.  Defaults to false.
  */
  allowsEmptySelection: false,

  /**
    If true, then clicking on a tab will not deselect the other segments, it
    will simply add or remove it from the selection.
  */
  allowsMultipleSelection: false,

  /**
    If true, titles will be localized before display.
  */
  localize: true,

  // ..........................................................
  // SEGMENT DEFINITION
  //

  /**
    The array of items to display.  This can be a simple array of strings,
    objects or hashes.  If you pass objects or hashes, you must also set the
    various itemKey properties to tell the SegmentedView how to extract the
    information it needs.

    @property {Array}
  */
  items: [],

  /**
    The key that contains the title for each item.

    @property {String}
  */
  itemTitleKey: null,

  /**
    The key that contains the value for each item.

    @property {String}
  */
  itemValueKey: null,

  /**
    A key that determines if this item in particular is enabled.  Note if the
    control in general is not enabled, no items will be enabled, even if the
    item's enabled property returns true.

    @property {String}
  */
  itemIsEnabledKey: null,

  /**
    The key that contains the icon for each item.  If omitted, no icons will
    be displayed.

    @property {String}
  */
  itemIconKey: null,

  /**
    The key that contains the desired width for each item.  If omitted, the
    width will autosize.

    @property {String}
  */
  itemWidthKey: null,

  /**
    The key that contains the action for this item.  If defined, then
    selecting this item will fire the action in addition to changing the
    value.  See also itemTargetKey.

    @property {String}
  */
  itemActionKey: null,

  /**
    The key that contains the target for this item.  If this and itemActionKey
    are defined, then this will be the target of the action fired.

    @property {String}
  */
  itemTargetKey: null,

  /**
    The key that contains the key equivalent for each item.  If defined then
    pressing that key equivalent will be like selecting the tab.  Also,
    pressing the Alt or Option key for 3 seconds will display the key
    equivalent in the tab.
  */
  itemKeyEquivalentKey: null,

  /**
    The array of itemKeys that will be searched to build the displayItems
    array.  This is used internally by the class.  You will not generally
    need to access or edit this array.

    @property {Array}
  */
  itemKeys: 'itemTitleKey itemValueKey itemIsEnabledKey itemIconKey itemWidthKey itemToolTipKey'.w(),

  /**
    This computed property is generated from the items array based on the
    itemKey properties that you set.  The return value is an array of arrays
    that contain private information used by the SegmentedView to render.

    You will not generally need to access or edit this property.

    @property {Array}
  */
  displayItems: function() {
    var items = this.get('items'), loc = this.get('localize'),
      keys=null, itemType, cur, ret = [], max = items.get('length'), idx,
      item, fetchKeys = SC._sc_selectWidgetMenuView_fetchKeys, fetchItem = SC._sc_selectWidgetMenuView_fetchItem;

    // loop through items and collect data
    for(idx=0;idx<max;idx++) {
      item = items.objectAt(idx) ;
      if (SC.none(item)) continue; //skip is null or undefined

      // if the item is a string, build the array using defaults...
      itemType = SC.typeOf(item);
      if (itemType === SC.T_STRING) {
        cur = [item.humanize().titleize(), item, true, null, null,  null, idx] ;

      // if the item is not an array, try to use the itemKeys.
      } else if (itemType !== SC.T_ARRAY) {
        // get the itemKeys the first time
        if (keys===null) {
          keys = this.itemKeys.map(fetchKeys,this);
        }

        // now loop through the keys and try to get the values on the item
        cur = keys.map(fetchItem, item);
        cur[cur.length] = idx; // save current index

        // special case 1...if title key is null, try to make into string
        if (!keys[0] && item.toString) cur[0] = item.toString();

        // special case 2...if value key is null, use item itself
        if (!keys[1]) cur[1] = item;

        // special case 3...if isEnabled is null, default to yes.
        if (!keys[2]) cur[2] = true ;
      }

      // finally, be sure to loc the title if needed
      if (loc && cur[0]) cur[0] = cur[0].loc();

      // finally, be sure to loc the toolTip if needed
      if (loc && cur[5] && SC.typeOf(cur[5]) === SC.T_STRING) cur[5] = cur[5].loc();

      // add to return array
      ret[ret.length] = cur;
    }

    // all done, return!
    return ret ;
  }.property('items', 'itemTitleKey', 'itemValueKey', 'itemIsEnabledKey',
             'localize', 'itemIconKey', 'itemWidthKey', 'itemToolTipKey'),

  // ..........................................................
  // EVENT HANDLING
  //

  /** @private
    Remove the active class on mouseExited if mouse is down.
  */
  mouseExited: function(evt) {
    var active = this._sc_activeMenuItem;

    document.body.style.cursor = "default";
    if (active) {
      active.set('isActive', false);
      this._sc_activeMenuItem = null;
    }
    return true;
  },

  /** @private
    If mouse was down and we renter the button area, set the active state 
    again.
  */
  mouseEntered: function(evt) {
    var menuItem = evt.layer;

    if (menuItem && menuItem.get('isEnabled') && this.get('isEnabled')) {
      document.body.style.cursor = "pointer";
      this._sc_activeMenuItem = menuItem;
      menuItem.set('isActive', true);
    }
    return true;
  },

  /** @private
    If mouse was down and we renter the button area, set the active state 
    again.
  */
  mouseMoved: function(evt) {
    var old = this._sc_activeMenuItem,
        cur = evt.layer;

    if (old === cur) return true;

    if (old) old.set('isActive', false);
    this._sc_activeMenuItem = cur;
    if (cur && cur.get('isEnabled') && this.get('isEnabled')) {
      document.body.style.cursor = "pointer";
      this._sc_activeMenuItem = cur;
      cur.set('isActive', true);
    }
    return true;
  },

  mouseDown: function(evt) {
    var active = this._sc_activeMenuItem,
        ret = false;

    if (active) active.set('isActive', false);
    this._sc_activeMenuItem = null;

    // Nothing to do if we're not enabled.
    if (!this.get('isEnabled')) {
      ret = true;

    // Nothing to do if no menu item was active.
    } else if (!active) {
      ret = true;

    // Okay, we need to deal with the mouseDown event.
    } else {
      sc_assert(active);
      var menuItem = evt.layer;

      // Nothing to do if we didn't click an enable menu item.
      if (!menuItem.get('isEnabled')) {
        ret = true;

      // Okay, the mouse went up over an enable menu item.  We need to 
      // update our value with it's value, select it, and unselected the 
      // currently selected menu item.
      } else {
        var index = this.get('layers').indexOf(menuItem),
            item = this.get('displayItems').objectAt(index);

        sc_assert(index >= 0);
        sc_assert(item);

        // Update our 'value' property.  _sc_valueDidChange() will handle 
        // updating the radio button's isSelected values.
        this.set('value', item[1]);

        // Let our SelectWidget know.
        this.get('action').call(this);

        ret = true;
      }
    }

    SC.app.set('menuSurface', null);
    SC.app.removeSurface(this);

    return ret;
  },

  acceptsFirstResponder: false,

  _sc_valueDidChange: function() {
    var value = this.get('value'),
        displayItems = this.get('displayItems'),
        menuItems = this.get('layers'),
        selected;

    displayItems.forEach(function(item, idx) {
      if (item[1] === value) selected = menuItems[idx];
    });

    if (selected) {
      selected.set('isSelected', true);
      menuItems.without(selected).invoke('setIfChanged', 'isSelected', false);
    } else {
      menuItems.invoke('setIfChanged', 'isSelected', false);
    }
  }.observes('value'),

  /** If the items array itself changes, add/remove observer on item... */
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
    This method will reginerate the list of items.
  */
  _sc_itemContentDidChange: function() {
    var displayItems = this.get('displayItems'),
        value = this.get('value'),
        isEnabled = this.get('isEnabled'),
        font = this.get('font');

    // console.log(displayItems);

    var menuItems = [], len = displayItems.length, last = len-1,
        y = 6, padding = 50, height = 24, maxWidth = 0;

    displayItems.forEach(function(item, idx) {
      var width = Math.ceil(SC.MeasureText(font, item[0]).width + padding); // Magic!
      if (width % 2 !== 0) width++;

      var menuItem = SC.SelectMenuItemLayer.create({
        layout: { left: 0, right: 0, top: y, height: 24 },
        title: item[0],
        isEnabled: item[2],
        isSelected: item[1] === value? true : false,
        font: font
      });
      menuItems.push(menuItem);

      maxWidth = Math.max(maxWidth, width);
      y += height;
    });

    y += 6;

    this.set('layers', menuItems);
    this.set('measuredWidth', maxWidth);
    this.set('measuredHeight', y);
    this._sc_triggerSublayerLayout = true;
  },

  updateLayout: function() {
    // console.log('SC.SelectWidgetMenuView#updateLayout()', SC.guidFor(this));
    if (this._sc_triggerSublayerLayout) {
      this._sc_triggerSublayerLayout = false;
      this.get('layers').invoke('triggerLayout');
    }
    arguments.callee.base.apply(this, arguments);
  },

  font: "11pt Calibri",

  measuredWidth: 10,

  measuredHeight: 10,

  init: function() {
    arguments.callee.base.apply(this, arguments);
    this._sc_itemsDidChange() ;
  }

});

// Helpers defined here to avoid creating lots of closures...
SC._sc_selectWidgetMenuView_fetchKeys = function(k) { return this.get(k); };
SC._sc_selectWidgetMenuView_fetchItem = function(k) {
  if (!k) return null;
  return this.get ? this.get(k) : this[k];
};

/** @private */
SC.SelectMenuItemLayer = SC.Layer.extend(SC.Control, {

  isEnabled: true,

  title: null,

  font: null,

  render: function(ctx) {
    // console.log('SC.SelectMenuItemLayer#render()', SC.guidFor(this));
    var title = this.get('title') || "",
        selected = this.get('isSelected'),
        disabled = !this.get('isEnabled'),
        mixed = (selected === SC.MIXED_STATE),
        active = this.get('isActive'),
        font = this.get('font'),
        w = ctx.width, h = ctx.height;

    selected = (selected && (selected !== SC.MIXED_STATE));

    ctx.clearRect(0, 0, ctx.width, ctx.height);

    ctx.beginPath();
    ctx.moveTo(0, 0.5);
    ctx.lineTo(w, 0.5);
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();

    if ((disabled && !selected) || (disabled && !active && !selected)) {
      ctx.globalAlpha = 1.0;
      ctx.fillStyle = base3;
      ctx.fill();

      ctx.fillStyle = base03;
      ctx.strokeStyle = base03;

    } else if (disabled && selected) {
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = base03;
      ctx.fill();

      ctx.fillStyle = base3;
      ctx.strokeStyle = base3;

    } else if (active) {
      ctx.fillStyle = base03;
      ctx.fill();

      ctx.fillStyle = base3;
      ctx.strokeStyle = base3;

    } else {
      // console.log('rendering normally');
      ctx.globalAlpha = 1.0;
      ctx.fillStyle = base3;
      ctx.fill();

      ctx.fillStyle = base03;
      ctx.strokeStyle = base03;
    }

    // Draw Title
    ctx.font = "11pt Calibri";
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";
    ctx.shadowBlur = 0;
    ctx.shadowColor = "rgba(0,0,0,0)";
    ctx.fillText(title, 15, h/2);

    // Draw Checkbox
    // ctx.translate(2, 0);
    // if ((selected && !active)) {
    //   // Draw the check mark.
    //   ctx.beginPath();
    //   ctx.moveTo(8.5, 17);
    //   ctx.lineTo(3.5, 13.5);
    //   ctx.lineTo(5.5, 12.5);
    //   ctx.lineTo(8.5, 16);
    //   ctx.lineTo(12.5, 7);
    //   ctx.lineTo(14, 9);
    //   ctx.lineTo(8.5, 17);
    //   ctx.closePath();
    //   ctx.fillStyle = (active || disabled)? base3 : base03;
    //   ctx.fill();
    //   ctx.strokeStyle = (active || disabled)? base3 : base03;
    //   ctx.lineCap = 'round';
    //   ctx.lineWidth = 0.5;
    //   ctx.stroke();
    // }
  }

});

} // BLOSSOM