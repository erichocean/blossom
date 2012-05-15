// ==========================================================================
// Project:   Blossom - Modern, Cross-Platform Application Framework
// Copyleft: ©2012 Fohr Motion Picture Studios. All lefts reserved.
// License:   Licensed under the GPLv3 license (see BLOSSOM-LICENSE).
// ==========================================================================
/*globals sc_assert */

sc_require('widgets/button');
sc_require('surfaces/view');

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
  configure your `itemKey` properties, the select widget will read the 
  properties it needs from the array and construct the button.

  You can define the following properties on objects you pass in:

  | *itemTitleKey* | the title of the button |
  | *itemValueKey* | the value of the button |

  @extends SC.ButtonWidget
  @since Blossom 1.0
*/
SC.SelectWidget = SC.ButtonWidget.extend({

  /**
    The value of the selected menu item.

    The SelectWidget's value will always be the value of the currently
    selected menu item.  Setting this value will change the selected item.
    If you set this value to something that has no matching item, then
    no item will be selected.

    @field {Object}
  */
  value: null,

  _sc_value: null,
  _sc_valueDidChange: function() {
    console.log('SC.SelectWidget#_sc_valueDidChange()', SC.guidFor(this));
    var cur = this.get('value'),
        old = this._sc_value,
        menu = this._sc_menuView,
        val = menu.get('value');

    // cur === old === val on init(), so nothing to do.
    if (cur === old) {
      console.log('value did not change from', cur);
      return;
    }

    // This happens when our 'value' was updated by our select widget. Avoid 
    // a loop by not setting 'value' on select widget again.
    if (cur === val) {
      console.log('value was updated by our select widget to', val);
      this._sc_value = cur;

    // This happens when our 'value' has been updated by anyone but select 
    // widget.  Let our select widget know we've changed.
    } else {
      console.log('value was updated by our model to', cur);
      this._sc_value = cur;
      menu.set('value', cur);
    }
  }.observes('value'),

  /**
    If true, titles will be localized before display.
  */
  localize: true,

  // ..........................................................
  // MENU ITEMS DEFINITION
  //

  /**
    The array of items to display.  This can be a simple array of strings,
    objects or hashes.  If you pass objects or hashes, you must also set the
    various itemKey properties to tell the SelectWidget how to extract the
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
  itemKeys: 'itemTitleKey itemValueKey itemIsEnabledKey'.w(),

  /**
    This computed property is generated from the items array based on the
    itemKey properties that you set.  The return value is an array of arrays
    that contain private information used by the SelectWidget to render.

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
        if (itemType.length > 0) {
          cur = [item.humanize().titleize(), item, true, null, null,  null, idx, false] ;
        } else {
          cur = [item.humanize().titleize(), item, true, null, null,  null, idx, true] ;
        }

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

  cornerRadius: 5,

  renderButtonShape: function(ctx) {
    var bounds = this.get('bounds'),
        w = bounds.width, h = bounds.height,
        radius = this.get('cornerRadius');

    if (radius === undefined) radius = 5;

    SC.CreateRoundRectPath(ctx, 0.5, 0.5, w-1, h-1, radius);
  },

  render: function(ctx) {
    // console.log('SC.SelectWidget#render()', SC.guidFor(this));
    var selectedItem = this.get('selectedItem'),
        title = selectedItem? selectedItem[0] : "",
        selected = this.get('isSelected'),
        disabled = !this.get('isEnabled'),
        mixed = (selected === SC.MIXED_STATE),
        active = false,
        isDefault = this.get('isDefault'),
        bounds = this.get('bounds'),
        w = bounds.width, h = bounds.height;

    selected = (selected && (selected !== SC.MIXED_STATE));

    var isEnabled = this.get('isEnabled');

    var lingrad = ctx.createLinearGradient(0,0,0,h);
    lingrad.addColorStop(0, 'rgb(250,250,250)');
    lingrad.addColorStop(0.475, 'rgb(230,230,230)');
    lingrad.addColorStop(0.525, 'rgb(220,220,220)');
    lingrad.addColorStop(1, 'rgb(194,194,194)');

    ctx.globalAlpha = isEnabled? 1.0 : 0.5;

    ctx.beginPath();
    ctx.fillStyle = lingrad;
    this.renderButtonShape(ctx);
    ctx.fill();
    ctx.strokeStyle = 'grey';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Draw some text.
    ctx.fillStyle = isEnabled?  'black' : 'rgba(0,0,0,0.7)';
    ctx.font = "10pt Helvetica";
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

    if (displayItems.length === 0) return;

    for (idx=0, len=displayItems.length; idx<len; ++idx) {
      if (displayItems[idx][1] === value) break;
    }

    if (idx < 0) idx = 0;
    if (evt.hitPoint.x < menuView.measuredWidth) {
      menuView._sc_activeMenuItem = menuView.get('layers')[idx];
      if (menuView._sc_activeMenuItem) {
        menuView._sc_activeMenuItem.set('isActive', true);
      }
    }

    // var surface = this.get('surface'),
    //     rowOffsetForLayerTree = 0,
    //     superlayer = this,
    //     rootLayer = superlayer;
    // 
    // while (superlayer) {
    //   rootLayer = superlayer;
    //   superlayer = superlayer.get('superlayer');
    // }
    // 
    // if (surface && surface.rowOffsetForLayerTree) {
    //   rowOffsetForLayerTree = surface.rowOffsetForLayerTree(rootLayer);
    // }

    frame.x = evt.clientX - evt.hitPoint.x;
    frame.y = evt.clientY - evt.hitPoint.y - idx*24 - 6; // + rowOffsetForLayerTree;
    frame.width = menuView.measuredWidth;
    frame.height = menuView.measuredHeight;

    if (frame.width === 0 || frame.height === 0) return;

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

  font: "10pt Helvetica",

  init: function() {
    arguments.callee.base.apply(this, arguments);

    var that = this, menuView;
    menuView = this._sc_menuView = SC.SelectWidgetMenuView.create({
      value: this.get('value'),

      _sc_backgroundColor: 'rgb(70,70,70)',

      action: function() {
        that.set('value', this.get('value'));
      },

      theme: this.get('theme'),
      themeBinding: SC.Binding.from('theme', this).oneWay().noDelay(),

      isEnabled: this.get('isEnabled'),
      isEnabledBinding: SC.Binding.from('isEnabled', this).oneWay().noDelay(),

      localize: this.get('localize'),
      localizeBinding: SC.Binding.from('localize', this).oneWay().noDelay(),

      items: this.get('items'),
      itemsBinding: SC.Binding.from('items', this).oneWay().noDelay(),

      itemTitleKey: this.get('itemTitleKey'),
      itemTitleKeyBinding: SC.Binding.from('itemTitleKey', this).oneWay().noDelay(),

      itemValueKey: this.get('itemValueKey'),
      itemValueKeyBinding: SC.Binding.from('itemValueKey', this).oneWay().noDelay(),

      itemIsEnabledKey: this.get('itemIsEnabledKey'),
      itemIsEnabledKeyBinding: SC.Binding.from('itemIsEnabledKey', this).oneWay().noDelay()
    });

    // menuView.set('backgroundColor', 'rgb(70,70,70)');

    this._sc_valueDidChange();
  }

});

SC.SelectWidgetMenuView = SC.View.extend({

  _sc_cornerRadius: 9,

  /**
    The value of the selected menu item.

    The SelectWidgetMenuView's value will always be the value of the 
    currently selected button.  Setting this value will change the selected 
    button. If you set this value to something that has no matching button, 
    then no buttons will be selected.

    @field {Object}
  */
  value: null,

  /**
    Set to true to enabled the select widget menu view, false to disabled it.
  */
  isEnabled: true,

  /**
    If true, clicking a selected button again will deselect it, setting the
    select widget menu's value to null.  Defaults to false.
  */
  allowsEmptySelection: false,

  /**
    If true, then clicking on a menu item will not deselect the other menu 
    items, it will simply add or remove it from the selection.
  */
  allowsMultipleSelection: false,

  /**
    If true, titles will be localized before display.
  */
  localize: true,

  // ..........................................................
  // MENU ITEMS DEFINITION
  //

  /**
    The array of items to display.  This can be a simple array of strings,
    objects or hashes.  If you pass objects or hashes, you must also set the
    various itemKey properties to tell the SelectWidgetMenuView how to 
    extract the information it needs.

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
    that contain private information used by the SelectWidgetMenuView to 
    render.

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
        if (item.length > 0) {
          cur = [item.humanize().titleize(), item, true, null, null,  null, idx, false] ;
        } else {
          cur = [item.humanize().titleize(), item, true, null, null,  null, idx, true] ;
        }

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
    var menuItem = evt.layer,
        old = this._sc_activeMenuItem;

    if (old) old.set('isActive', false);
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
    if (cur && cur.get('isEnabled') && this.get('isEnabled') && !cur.get('isSpacer')) {
      this._sc_activeMenuItem = cur;
      document.body.style.cursor = "pointer";
      this._sc_activeMenuItem = cur;
      cur.set('isActive', true);
    } else {
      this._sc_activeMenuItem = null;
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
        y = 6, padding = 50, height = 24, spacerHeight = 12, maxWidth = 0;

    displayItems.forEach(function(item, idx) {
      var width = Math.ceil(SC.MeasureText(font, item[0]).width + padding); // Magic!
      if (width % 2 !== 0) width++;

      var menuItem = SC.SelectMenuItemLayer.create({
        layout: { left: 0, right: 0, top: y, height: item[7]? spacerHeight : height },
        title: item[0],
        isEnabled: item[2],
        isSelected: item[1] === value? true : false,
        font: font,
        isSpacer: item[7]
      });
      menuItems.push(menuItem);

      maxWidth = Math.max(maxWidth, width);
      // console.log('item[7]', item[7]);
      y += item[7]? spacerHeight : height;
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

  font: "10pt Helvetica",

  measuredWidth: 10,

  measuredHeight: 10,

  init: function() {
    arguments.callee.base.apply(this, arguments);
    this._sc_itemsDidChange() ;
  },

  willRenderLayers: function(ctx) {
    ctx.strokeStyle = 'grey';
    ctx.lineWidth = 2;
    ctx.strokeRect(0,0,ctx.w, ctx.h);
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
        bounds = this.get('bounds'),
        w = bounds.width, h = bounds.height;

    selected = (selected && (selected !== SC.MIXED_STATE));

    ctx.beginPath();
    ctx.moveTo(1, 0.5);
    ctx.lineTo(w-2, 0.5);
    ctx.lineTo(w-2, h);
    ctx.lineTo(1, h);
    ctx.closePath();

    var lingrad = ctx.createLinearGradient(0,0,0,h);
    lingrad.addColorStop(0, 'rgb(252,188,126)');
    lingrad.addColorStop(0.9, 'rgb(255,102,0)');
    lingrad.addColorStop(1, 'rgb(255,178,128)');

    if ((disabled && !selected) || (disabled && !active && !selected)) {
      ctx.globalAlpha = 1.0;
      ctx.fillStyle = 'rgb(70,70,70)';
      ctx.fill();

      ctx.fillStyle = 'rgb(70,70,70)';
      ctx.strokeStyle = 'rgb(70,70,70)';

    } else if (disabled && selected) {
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = lingrad;
      ctx.fill();

      ctx.fillStyle = 'rgb(0,0,0,0.5)';
      ctx.strokeStyle = 'rgb(0,0,0,0.5)';

    } else if (active) {
      ctx.fillStyle = lingrad;
      ctx.fill();

      ctx.fillStyle = 'white';
      ctx.strokeStyle = 'white';

    } else {
      // console.log('rendering normally');
      ctx.globalAlpha = 1.0;
      ctx.fillStyle = 'rgb(70,70,70)';
      ctx.fill();

      ctx.fillStyle = 'white';
      ctx.strokeStyle = 'white';
    }

    // Draw Title
    ctx.font = "10pt Helvetica";
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";
    ctx.shadowBlur = 0;
    ctx.shadowColor = "rgba(0,0,0,0)";
    ctx.fillText(title, 15, h/2);

    if (this.get('isSpacer')) {
      ctx.beginPath();
      ctx.moveTo(1, Math.floor(h/2)+0.5);
      ctx.lineTo(w-1, Math.floor(h/2)+0.5);
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'grey';
      ctx.stroke();
    }

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
