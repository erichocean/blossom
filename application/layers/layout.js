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
SC.Layer.LAYOUT_ALL_PROPERTIES = SC.Layer.LAYOUT_X_PROPERTIES.concat(SC.Layer.LAYOUT_Y_PROPERTIES, SC.Layer.LAYOUT_MINMAX_PROPERTIES);

SC.Layer.LAYOUT_POSITIONS = {
  "center"       : 0, "top"          : 1, "bottom"       : 2,
  "left"         : 3, "right"        : 4, "top left"     : 5,
  "top right"    : 6, "bottom left"  : 7, "bottom right" : 8
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
  } else if (tmp.indexOf("centerX") !== -1) {
    // only centerX, width is allowed
    if (tmp.indexOf("width") === -1) {
      throw new TypeError("centerX can only be combined with width in a layout hash");
    }
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
  } else if (tmp.indexOf("centerY") !== -1) {
    // only centerY, height is allowed
    if (tmp.indexOf("height") === -1) {
      throw new TypeError("centerY can only be combined with height in a layout hash");
    }
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
  // been made in the percentages hash.) For the next part, it's easiest if 
  // we know what kind of layout we're dealing with. That means we need to 
  // solve for hmode, vmode, hmax, and vmax (layoutMode we've already solved 
  // for).

  // Solve for hmode.
  if (layout.left !== undefined) {
    if (percentages.left) {
      if (layout.width !== undefined) {
        if (percentages.width) {
          // left percentage, width percentage
          hmode = 3;
        } else {
          // left percentage, width
          hmode = 1;
        }
      } else if (layout.right !== undefined) {
        if (percentages.right) {
          // left percentage, right percentage
          hmode = 15;
        } else {
          // left percentage, right
          hmode = 13;
        }
      }
    } else {
      if (layout.width !== undefined) {
        if (percentages.width) {
          // left, width percentage
          hmode = 2;
        } else {
          // left, width
          hmode = 0;
        }
      } else if (layout.right !== undefined) {
        if (percentages.right) {
          // left, right percentage
          hmode = 14;
        } else {
          // left, right
          hmode = 12;
        }
      }
    }
  } else if (layout.right !== undefined) {
    if (percentages.right) {
      if (layout.width !== undefined) {
        if (percentages.width) {
          // right percentage, width percentage
          hmode = 7;
        } else {
          // right percentage, width
          hmode = 5;
        }
      }
    } else {
      if (layout.width !== undefined) {
        if (percentages.width) {
          // right, width percentage
          hmode = 6;
        } else {
          // right, width
          hmode = 4;
        }
      }
    }
  } else if (layout.centerX !== undefined) {
    if (percentages.centerX) {
      if (layout.width !== undefined) {
        if (percentages.width) {
          // centerX percentage, width percentage
          hmode = 11;
        } else {
          // centerX percentage, width
          hmode = 9;
        }
      }
    } else {
      if (layout.width !== undefined) {
        if (percentages.width) {
          // centerX, width percentage
          hmode = 10;
        } else {
          // centerX, width
          hmode = 8;
        }
      }
    }
  }

  // Solve for vmode.
  if (layout.top !== undefined) {
    if (percentages.top) {
      if (layout.height !== undefined) {
        if (percentages.height) {
          // top percentage, height percentage
          vmode = 3;
        } else {
          // top percentage, height
          vmode = 1;
        }
      } else if (layout.bottom !== undefined) {
        if (percentages.bottom) {
          // top percentage, bottom percentage
          vmode = 15;
        } else {
          // top percentage, bottom
          vmode = 13;
        }
      }
    } else {
      if (layout.height !== undefined) {
        if (percentages.height) {
          // top, height percentage
          vmode = 2;
        } else {
          // top, height
          vmode = 0;
        }
      } else if (layout.bottom !== undefined) {
        if (percentages.bottom) {
          // top, bottom percentage
          vmode = 14;
        } else {
          // top, bottom
          vmode = 12;
        }
      }
    }
  } else if (layout.bottom !== undefined) {
    if (percentages.bottom) {
      if (layout.height !== undefined) {
        if (percentages.height) {
          // bottom percentage, height percentage
          vmode = 7;
        } else {
          // bottom percentage, height
          vmode = 5;
        }
      }
    } else {
      if (layout.height !== undefined) {
        if (percentages.height) {
          // bottom, height percentage
          vmode = 6;
        } else {
          // bottom, height
          vmode = 4;
        }
      }
    }
  } else if (layout.centerY !== undefined) {
    if (percentages.centerY) {
      if (layout.height !== undefined) {
        if (percentages.width) {
          // centerY percentage, height percentage
          vmode = 11;
        } else {
          // centerY percentage, height
          vmode = 9;
        }
      }
    } else {
      if (layout.height !== undefined) {
        if (percentages.height) {
          // centerY, height percentage
          vmode = 10;
        } else {
          // centerY, height
          vmode = 8;
        }
      }
    }
  }

  // Solve for hmax and vmax.
  hmax = layout.maxLayoutWidth  !== undefined;
  vmax = layout.maxLayoutHeight !== undefined;
};

} // BLOSSOM
