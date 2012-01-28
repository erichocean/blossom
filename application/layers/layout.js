// ==========================================================================
// Project:   Blossom - Modern, Cross-Platform Application Framework
// Copyright: ©2012 Fohr Motion Picture Studios. All rights reserved.
// License:   Licensed under the GPLv3 license (see BLOSSOM-LICENSE).
// ==========================================================================
/*globals sc_assert BLOSSOM */

sc_require('layers/layer');

if (BLOSSOM) {

SC.Layer.LAYOUT_X_PROPERTIES = 'left right centerX width'.w();
SC.Layer.LAYOUT_Y_PROPERTIES = 'top bottom centerY height'.w();
SC.Layer.LAYOUT_MINMAX_PROPERTIES = 'minLayoutWidth minLayoutHeight maxLayoutWidth maxLayoutHeight position'.w();
SC.Layer.LAYOUT_ALL_PROPERTIES = SC.Layer.LAYOUT_X_PROPERTIES.concat(
    SC.Layer.LAYOUT_Y_PROPERTIES,
    SC.Layer.LAYOUT_MINMAX_PROPERTIES
  );
// DO NOT CHANGE THE ORDER OF LAYOUT_POSITIONS.
SC.Layer.LAYOUT_POSITIONS = {
  "center"       : 0,
  "top"          : 1,
  "bottom"       : 2,
  "left"         : 3,
  "right"        : 4, 
  "top left"     : 5,
  "top right"    : 6,
  "bottom left"  : 7,
  "bottom right" : 8
};

SC.Layer.PERCENT_REGEX = /(([+\-]?\d+)|([+\-]?((\d*\.\d+)|(\d+\.\d*))))\%/;
SC.Layer.POSITIVE_PERCENT_REGEX = /(([+]?\d+)|([+]?((\d*\.\d+)|(\d+\.\d*))))\%/;

/**
  This method takes a layout hash, verifies it's valid, and then updates 
  this._sc_layoutValues and this._sc_layoutFunction to match. Layout is 
  actually done later, during the animation loop.
*/
SC.Layer.prototype.updateLayoutRules = function() {
  var layout = this.get('layout'),
      values = this._sc_layoutValues,
      isValid = true, key, val, ary, tmp = [], re, re2, percentages = {},
      hmode, vmode, hmax, vmax, layoutMode;

  if (typeof layout !== "object") {
    throw new TypeError("layout must be a hash");
  } else if (layout.isObject || layout.isClass) {
    throw new TypeError("layout must not be a SproutCore object or class");
  }

  // First, make sure the hash doesn't contain any invalid keys.
  ary = SC.Layer.LAYOUT_ALL_PROPERTIES;
  for (key in layout) {
    if (!layout.hasOwnProperty(key)) continue;
    if (ary.indexOf(key) === -1) tmp.push(key);
  }
  if (tmp.length > 0) {
    throw new TypeError("layout contains invalid keys: "+tmp);
  }

  // Next, make sure we have only two X properties and two Y properties.
  ary = SC.Layer.LAYOUT_X_PROPERTIES;
  for (key in layout) {
    if (!layout.hasOwnProperty(key)) continue;
    if (ary.indexOf(key) !== -1) tmp.push(key);
  }
  if (tmp.length > 2) {
    throw new TypeError("layout has too many horizontal properties (it should have exactly two): "+tmp);
  } else if (tmp.length < 2) {
    throw new TypeError("layout has too few horizontal properties (it should have exactly two): "+tmp);
  }
  tmp.length = 0;

  ary = SC.Layer.LAYOUT_Y_PROPERTIES;
  for (key in layout) {
    if (!layout.hasOwnProperty(key)) continue;
    if (ary.indexOf(key) !== -1) tmp.push(key);
  }
  if (tmp.length > 2) {
    throw new TypeError("layout has too many vertical properties (it should have exactly two): "+tmp);
  } else if (tmp.length < 2) {
    throw new TypeError("layout has too few vertical properties (it should have exactly two): "+tmp);
  }

  // If the position property is present, make sure it is valid.  Also, cache 
  // it's value now.
  if (layout.position !== undefined) {
    layoutMode = SC.Layer.LAYOUT_POSITIONS[layout.position];
    if (layoutMode === undefined) {
      throw new TypeError("layout has an invalid position key: "+layout.position);
    }
  } else layoutMode = 5; // default is "top left" (for speed)

  // At this point, we at least don't have any invalid keys, but it's also 
  // possible that the keys we do have don't contain good values. Verify the 
  // values, and convert any percentage strings into their floating-point 
  // equivalent. Also note which keys contain percentages.
  re = SC.Layer.PERCENT_REGEX;
  re2 = SC.Layer.POSITIVE_PERCENT_REGEX;
  for (key in layout) {
    if (!layout.hasOwnProperty(key)) continue;
    val = layout[key];
    switch (key) {
      case "left":
      case "right":
      case "centerX":
      case "top":
      case "bottom":
      case "centerY":
        if (typeof val === "number") {
          if (val > 0 && val < 1) percentages[key] = true;
        } else if (typeof val === "string") {
          if (!re.test(val)) {
            throw new TypeError("layout."+key+" is not a percentage: "+val);
          } else {
            layout[key] = val.slice(0,-1)/100; // converts string to number
            percentages[key] = true;
          }
        } else {
          throw new TypeError("layout."+key+" must be either a number or a percentage. It's a "+typeof key);
        }
        break;
      case "width":
      case "height":
        if (typeof val === "number" && val >= 0) {
          if (val > 0 && val < 1) percentages[key] = true;
        } else if (typeof val === "string") {
          if (!re2.test(val)) {
            throw new TypeError("layout."+key+" is not a positive percentage: "+val);
          } else {
            layout[key] = val.slice(0,-1)/100; // converts string to number
            percentages[key] = true;
          }
        } else {
          throw new TypeError("layout."+key+" must be either a number or a positive percentage. It's a "+typeof key);
        }
        break;
      case "minLayoutWidth":
      case "maxLayoutWidth":
      case "minLayoutHeight":
      case "maxLayoutHeight":
        if (typeof val === "number") {
          if (val >= 0) continue;
          else {
            throw new TypeError("layout."+key+" is not a positive number: "+val);
          }
        } else {
          throw new TypeError("layout."+key+" must be a positive number. It's a "+typeof key);
        }
        break;
    }
  }

  // Okay, the values for the keys supplied are okay, and any percentages 
  // have been converted. (If a key's value is a percentage, an entry has 
  // been made in the percentages hash.)
};

} // BLOSSOM
