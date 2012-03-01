// ==========================================================================
// Project:   Blossom - Modern, Cross-Platform Application Framework
// Copyright: ©2012 Fohr Motion Picture Studios. All rights reserved.
// License:   Licensed under the GPLv3 license (see BLOSSOM-LICENSE).
// ==========================================================================
/*globals BLOSSOM sc_assert */

sc_require('widgets/widget');
sc_require('mixins/control');

if (BLOSSOM) {

SC.ALIGN_LEFT = 'left';
SC.ALIGN_RIGHT = 'right';
SC.ALIGN_CENTER = 'center';

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

  SC.SegmentedWidget is a special type of button that can display multiple
  segments.  Each segment has a value assigned to it.  When the user clicks
  on the segment, the value of that segment will become the new value of
  the control.

  You can also optionally configure a target/action that will fire whenever
  the user clicks on an item.  This will give your code an opportunity to take
  some action depending on the new value.  (Of course, you can always bind to
  the value as well, which is generally the preferred approach.)

  # Defining Your Segments

  You define your segments by providing a items array, much like you provide
  to an SC.RadioWidget.  Your items array can be as simple as an array of 
  strings or as complex as full model objects.  Based on how you configure 
  your `itemKey` properties, the segmented widget will read the properties it 
  needs from the array and construct the button.

  You can define the following properties on objects you pass in:

  | *itemTitleKey* | the title of the button |
  | *itemValueKey* | the value of the button |
  | *itemWidthKey* | the preferred width. if omitted, it autodetects |
  | *itemIconKey*  | an icon |
  | *itemActionKey* | an optional action to fire when pressed |
  | *itemTargetKey* | an optional target for the action |

  @extends SC.Widget
  @since Blossom 1.0
*/
SC.SegmentedWidget = SC.Widget.extend(SC.Control, {

  theme: 'square',

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
    If true, it will set the segment value even if an action is defined.
  */
  selectSegmentWhenTriggeringAction: false,

  /**
    If true, titles will be localized before display.
  */
  localize: true,

  align: SC.ALIGN_CENTER,

  /**
    Change the layout direction to make this a vertical set of tabs instead
    of horizontal ones.
  */
  layoutDirection: SC.LAYOUT_HORIZONTAL,

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
      item, fetchKeys = SC._sc_segmented_fetchKeys, fetchItem = SC._sc_segmented_fetchItem;

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

  render: function(ctx) {
    ctx.clearRect(0, 0, ctx.width, ctx.height);
  },


  // ..........................................................
  // EVENT HANDLING
  //

  /** @private
    Remove the active class on mouseExited if mouse is down.
  */
  mouseExited: function(evt) {
    document.body.style.cursor = "default";
    if (this.isMouseDown) { this.set('isActive', false); }
    return true;
  },

  /** @private
    If mouse was down and we renter the button area, set the active state 
    again.
  */
  mouseEntered: function(evt) {
    var segment = evt.layer;
    if (segment !== this && segment.get('isEnabled') && this.get('isEnabled')) {
      document.body.style.cursor = "pointer";
    }
    if (this.isMouseDown) { this.set('isActive', true); }
    return true;
  },

  mouseDown: function(evt) {
    var segment = evt.layer;

    // Nothing to do if we're not enabled.
    if (!this.get('isEnabled')) {
      return true;

    // Nothing to do if a radio button wasn't actually clicked on.
    } else if (segment === this) {
      return false;

    // Nothing to do if the radio buttion isn't enabled.
    } else if (!segment.get('isEnabled')) {
      return true;

    // Mark the segment as active.
    } else {
      this._sc_activeSegment = segment;
      segment.set('isActive', true);

      // Even if radiobuttons are not set to get firstResponder, allow 
      // default action, that way textfields loose focus as expected.
      evt.allowDefault();
      return true;
    }
  },

  mouseUp: function(evt) {
    var active = this._sc_activeSegment;

    if (active) active.set('isActive', false);
    this._sc_activeSegment = null;

    // Nothing to do if we're not enabled.
    if (!this.get('isEnabled')) {
      return true;

    // Nothing to do if there's no active radio button.
    } else if (!active) {
      return true;

    // Okay, we need to deal with the mouseUp event.
    } else {
      sc_assert(active);
      var segment = evt.layer;

      // Nothing to do if the mouse did not go up over a radio button.
      if (segment === this) {
        return true;

      // Nothing to do if the mouse did not go up over the active radio button.
      } else if (segment !== active) {
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

  /**
    Simulates the user clicking on the segment at the specified index. This
    will update the value if possible and fire the action.
  */
  triggerItemAtIndex: function(idx) {
    var items = this.get('displayItems'),
        item  = items.objectAt(idx),
        sel, value, val, empty, mult;

    if (!item[2]) return this; // nothing to do!

    empty = this.get('allowsEmptySelection');
    mult = this.get('allowsMultipleSelection');

    // Get new value... bail if not enabled.  Also save original for later.
    sel = item[1];
    value = val = this.get('value') ;
    if (!SC.isArray(value)) value = [value]; // force to array

    // If we do not allow multiple selection, either replace the current
    // selection or deselect it
    if (!mult) {
      // If we allow empty selection and the current value is the same as
      // the selected value, then deselect it.
      if (empty && (value.get('length')===1) && (value.objectAt(0)===sel)){
        value = [];

      // Otherwise, simply replace the value.
      } else value = [sel] ;

    // If we do allow multiple selection, then add or remove item to the
    // array.
    } else {
      if (value.indexOf(sel) >= 0) {
        if (value.get('length')>1 || (value.objectAt(0)!==sel) || empty) {
          value = value.without(sel);
        }
      } else value = value.concat([sel]) ;
    }

    // Normalize back to non-array form.
    switch (value.get('length')) {
      case 0:
        value = null;
        break;
      case 1:
        value = value.objectAt(0);
        break;
      default:
        break;
    }

    // Trigger item target/action if needed.
    var actionKey = this.get('itemActionKey'),
        targetKey = this.get('itemTargetKey'),
        action, target = null;

    if (actionKey && (item = this.get('items').objectAt(item[6]))) {
      // get the source item from the item array.  use the index stored...
      action = item.get ? item.get(actionKey) : item[actionKey];
      if (targetKey) {
        target = item.get ? item.get(targetKey) : item[targetKey];
      }
      SC.app.sendAction(action, target, this, this.get('surface'));
    }

    if (val !== undefined && (!action || this.get('selectSegmentWhenTriggeringAction'))) {
      this.set('value', value);
    }

    // If a target/action is defined on self, do that too.
    action = this.get('action');
    if (action) {
      SC.app.sendAction(action, this.get('target'), this, this.get('surface'));
    }
  },

  acceptsFirstResponder: false,

  _sc_valueDidChange: function() {
    var value = this.get('value'),
        displayItems = this.get('displayItems'),
        segments = this.get('sublayers'),
        selected;

    displayItems.forEach(function(item, idx) {
      if (item[1] === value) selected = segments[idx];
    });

    if (selected) {
      selected.set('isSelected', true);
      segments.without(selected).invoke('setIfChanged', 'isSelected', false);
    } else {
      segments.invoke('setIfChanged', 'isSelected', false);
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
        isEnabled = this.get('isEnabled');

    // console.log(displayItems);

    // FIXME: This is totally wrong, neeed to measure the text and do the 
    // layout horizontally.
    var segments = [], len = displayItems.length, last = len-1,
        theme = this.get('theme');
    displayItems.forEach(function(item, idx) {
      var segmentType;
      if (idx === 0) {
        segmentType = (len === 1)? 'full' : 'left';
      } else if (idx === last) {
        segmentType = 'right';
      } else {
        segmentType = 'center';
      }

      var segment = SC.SegmentWidget.create({
        layout: { left: idx*100, width: 100, top: 0, height: 24 },
        title: item[0],
        isEnabled: item[2],
        isSelected: item[1] === value? true : false,
        segmentType: segmentType,
        theme: theme
      });
      segments.push(segment);
    });

    this.set('sublayers', segments);
  },

  init: function() {
    arguments.callee.base.apply(this, arguments);
    this._sc_itemsDidChange() ;
  }

});

// Helpers defined here to avoid creating lots of closures...
SC._sc_segmented_fetchKeys = function(k) { return this.get(k); };
SC._sc_segmented_fetchItem = function(k) {
  if (!k) return null;
  return this.get ? this.get(k) : this[k];
};

sc_require('widgets/button');

SC.CreateRoundRectPathLeft = function(ctx, x, y, width, height, radius) {
  // console.log('SC.CreateRoundRectPathLeft');
  if (radius === undefined) radius = 5;

  ctx.beginPath();
  ctx.moveTo(x + width, y); // Top-right
  ctx.lineTo(x + radius, y);
  ctx.quadraticCurveTo(x, y, x, y + radius);
  ctx.lineTo(x, y + height - radius);
  ctx.quadraticCurveTo( x, y + height, x + radius, y + height);
  ctx.lineTo(x + width, y + height);
  // Don't close the path, segments draw the line on the right (only).
};

SC.CreateRoundRectPathRight = function(ctx, x, y, width, height, radius) {
  // console.log('SC.CreateRoundRectPathRight');
  if (radius === undefined) radius = 5;

  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x, y + height);
  ctx.lineTo(x, y);
  ctx.closePath();
};

/** @private */
SC.SegmentWidget = SC.ButtonWidget.extend({

  behavior: null, // Allows SC.SegmentedWidget to define our behavior.

  buttonBehavior: SC.TOGGLE_BEHAVIOR,

  theme: 'regular',

  render: function(ctx) {
    // console.log('SC.SegmentWidget#render()', SC.guidFor(this));
    var title = this.get('displayTitle') || "(no title)",
        selected = this.get('isSelected'),
        disabled = !this.get('isEnabled'),
        mixed = (selected === SC.MIXED_STATE),
        active = this.get('isActive'),
        segmentType = this.get('segmentType');

    selected = (selected && (selected !== SC.MIXED_STATE));

    ctx.clearRect(0, 0, ctx.width, ctx.height);

    sc_assert(this.get('theme') !== 'checkbox', "Please use SC.CheckboxWidget instead.");
    sc_assert(this.get('theme') !== 'radio', "Please use SC.RadioWidget instead.");

    if (segmentType === 'left') {
      switch (this.get('theme')) {
        case 'square':
          SC.CreateRoundRectPathLeft(ctx, 1.5, 1.5, ctx.width-2, ctx.height-3, 0);
          break;
        case 'capsule':
          SC.CreateRoundRectPathLeft(ctx, 1.5, 1.5, ctx.width-2, ctx.height-3, 12);
          break;
        case 'regular':
          SC.CreateRoundRectPathLeft(ctx, 1.5, 1.5, ctx.width-2, ctx.height-3, 5);
          break;
        default:
          sc_assert(false, "Unknown theme:"+this.get('theme'));
          break;
      }

    } else if (segmentType === 'right') {
      switch (this.get('theme')) {
        case 'square':
          SC.CreateRoundRectPathRight(ctx, 0.5, 1.5, ctx.width-1, ctx.height-3, 0);
          break;
        case 'capsule':
          SC.CreateRoundRectPathRight(ctx, 0.5, 1.5, ctx.width-1, ctx.height-3, 12);
          break;
        case 'regular':
          SC.CreateRoundRectPathRight(ctx, 0.5, 1.5, ctx.width-1, ctx.height-3, 5);
          break;
        default:
          sc_assert(false, "Unknown theme:"+this.get('theme'));
          break;
      }

    } else if (segmentType === 'center') {
      ctx.beginPath();
      ctx.moveTo(0.5 + ctx.width-1, 1.5); // Top-right
      ctx.lineTo(0.5, 1.5);
      ctx.lineTo(0.5, 1.5 + ctx.height-3);
      ctx.lineTo(0.5 + ctx.width-1, 1.5 + ctx.height-3);
      // Don't close the path, segments draw the line on the right (only).

    } else { // 'full'
      switch (this.get('theme')) {
        case 'square':
          SC.CreateRoundRectPath(ctx, 1.5, 1.5, ctx.width-3, ctx.height-3, 0);
          break;
        case 'capsule':
          SC.CreateRoundRectPath(ctx, 1.5, 1.5, ctx.width-3, ctx.height-3, 12);
          break;
        case 'regular':
          SC.CreateRoundRectPath(ctx, 1.5, 1.5, ctx.width-3, ctx.height-3, 5);
          break;
        default:
          sc_assert(false, "Unknown theme:"+this.get('theme'));
          break;
      }
    }

    if ((disabled && !selected) || (disabled && !active && !selected)) {
      ctx.globalAlpha = 1.0;
      ctx.fillStyle = base3;
      ctx.fill();

      ctx.globalAlpha = 0.5;
      ctx.strokeStyle = base03;
      ctx.lineWidth = 1;
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
      ctx.lineWidth = 1;
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
      ctx.lineWidth = 1;
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
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = base03;
      ctx.font = "11pt Calibri";
      ctx.textBaseline = "middle";
      ctx.textAlign = "center";
      ctx.shadowBlur = 0;
      ctx.shadowColor = "rgba(0,0,0,0)";
      ctx.fillText(title || "(no title)", ctx.width/2, ctx.height/2);
    }
  }

});

} // BLOSSOM
