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
  SC.Benchmark.start("SC.Layer#updateLayoutRules");
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
  // solve for `hmode`, `vmode`, `hmax`, and `vmax` (`layoutMode` we've 
  // already solved for).

  // Solve for `hmode`.
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

  // Solve for `vmode`.
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

  // Solve for `hmax` and `vmax`.
  hmax = layout.maxLayoutWidth  !== undefined;
  vmax = layout.maxLayoutHeight !== undefined;

  // Time to update `values`.
  switch (hmode) {
    case  0: // left, width
    case  2: // left, width percentage
    case 12: // left, right
    case 14: // left, right percentage
    case  1: // left percentage, width
    case  3: // left percentage, width percentage
    case 13: // left percentage, right
    case 15: // left percentage, right percentage
      values[0]/*left OR left percentage*/ = layout.left;
      break;
    case  4: // right, width
    case  6: // right, width percentage
    case  5: // right percentage, width
    case  7: // right percentage, width percentage
      values[0]/*right OR right percentage*/ = layout.right;
      break;
    case  8: // centerX, width
    case 10: // centerX, width percentage
    case  9: // centerX percentage, width
    case 11: // centerX percentage, width percentage
      values[0]/*centerX OR centerX percentage*/ = layout.centerX;
      break;
  }

  switch (hmode) {                 
    case  0:                                                // left, width
    case  1:                                     // left percentage, width
    case  4:                                               // right, width
    case  5:                                    // right percentage, width
    case  8:                                             // centerX, width
    case  9:                                  // centerX percentage, width
    case  2:                                     // left, width percentage
    case  3:                          // left percentage, width percentage
    case  6:                                    // right, width percentage
    case  7:                         // right percentage, width percentage
    case 10:                                  // centerX, width percentage
    case 11:                       // centerX percentage, width percentage
      values[1]/*width OR width percentage*/ = layout.width;
      break;

    // Each of the following cases require both the first and second 
    // value.
    case 12: // left, right
    case 13: // left percentage, right
    case 14: // left, right percentage
    case 15: // left percentage, right percentage
      values[1]/*right OR right percentage*/ = layout.right;
      break;
  }

  switch (vmode) {
    case  0: // top, height
    case  2: // top, height percentage
    case 12: // top, bottom
    case 14: // top, bottom percentage
    case  1: // top percentage, height
    case  3: // top percentage, height percentage
    case 13: // top percentage, bottom
    case 15: // top percentage, bottom percentage
      values[2]/*top OR top percentage*/ = layout.top;
      break;
    case  4: // bottom, height
    case  6: // bottom, height percentage
    case  5: // bottom percentage, height
    case  7: // bottom percentage, height percentage
      values[2]/*bottom OR bottom percentage*/ =  layout.bottom;
      break;
    case  8: // centerY, height
    case 10: // centerY, height percentage
    case  9: // centerY percentage, height
    case 11: // centerY percentage, height percentage
      values[2]/*centerY OR centerY percentage*/ = layout.centerY;
      break;
  }

  switch (vmode) {
    case  0:                                                // top, height
    case  1:                                     // top percentage, height
    case  4:                                             // bottom, height
    case  5:                                   // bottom prcentage, height
    case  8:                                            // centerY, height
    case  9:                                 // centerY percentage, height
    case  2:                                     // top, height percentage
    case  3:                          // top percentage, height percentage
    case  6:                                  // bottom, height percentage
    case  7:                       // bottom percentage, height percentage
    case 10:                                 // centerY, height percentage
    case 11:                      // centerY percentage, height percentage
      values[3]/*height OR height percentage*/ =  layout.height;
      break;

    // Each of the following cases require both the first and second value.
    case 12: // top, bottom
    case 13: // top percentage, bottom
    case 14: // top, bottom percentage
    case 15: // top percentage, bottom percentage
      values[3]/*bottom OR bottom percentage*/ = layout.bottom;
      break;
  }

  // Okay, time to deal with the min/max limits. minLayoutWidth depends on 
  // hmode.
  var minLayoutWidth, maxLayoutWidth, minLayoutHeight, maxLayoutHeight;
  switch (hmode) {
    case  0: // left, width
      minLayoutWidth = layout.left + layout.width;
      break;
    case  1: // left percentage, width
    case  5: // right percentage, width
    case  8: // centerX, width
    case  9: // centerX percentage, width
      minLayoutWidth = layout.width;
      break;
    case  2: // left, width percentage
    case 14: // left, right percentage
      minLayoutWidth = layout.left;
      break;
    case  3: // left percentage, width percentage
    case  7: // right percentage, width percentage
    case 10: // centerX, width percentage
    case 11: // centerX percentage, width percentage
    case 15: // left percentage, right percentage
      minLayoutWidth = 0;
      break;
    case  4: // right, width
      minLayoutWidth = layout.right + layout.width;
      break;
    case  6: // right, width percentage
    case 13: // left percentage, right
      minLayoutWidth = layout.right;
      break;
    case 12: // left, right
      minLayoutWidth = layout.left + layout.right;
      break;
  }

  if (layout.minLayoutWidth !== undefined) {
    if (layout.minLayoutWidth > minLayoutWidth) {
      minLayoutWidth = layout.minLayoutWidth;
    }
  }
  values[4] = minLayoutWidth;

  if (layout.maxLayoutWidth !== undefined) {
    if (layout.maxLayoutWidth >= minLayoutWidth) {
      maxLayoutWidth = layout.maxLayoutWidth;
    } else {
      maxLayoutWidth = minLayoutWidth;
    }
  } else {
    maxLayoutWidth = Infinity;
  }
  values[5] = maxLayoutWidth;

  switch (vmode) {
    case  0: // top, height
      minLayoutHeight = layout.top + layout.height;
      break;
    case  1: // top percentage, height
    case  5: // bottom percentage, height
    case  8: // centerY, height
    case  9: // centerY percentage, height
      minLayoutHeight = layout.height;
      break;
    case  2: // top, height percentage
    case 14: // top, bottom percentage
      minLayoutHeight = layout.top;
      break;
    case  3: // top percentage, height percentage
    case  7: // bottom percentage, height percentage
    case 10: // centerY, height percentage
    case 11: // centerY percentage, height percentage
    case 15: // top percentage, bottom percentage
      minLayoutHeight = 0;
      break;
    case  4: // bottom, height
      minLayoutHeight = layout.bottom + layout.height;
      break;
    case  6: // bottom, height percentage
    case 13: // top percentage, bottom
      minLayoutHeight = layout.bottom;
      break;
    case 12: // top, bottom
      minLayoutHeight = layout.top + layout.bottom;
      break;
  }

  if (layout.minLayoutHeight !== undefined) {
    if (layout.minLayoutHeight > minLayoutHeight) {
      minLayoutHeight = layout.minLayoutHeight;
    }
  }
  values[6] = minLayoutHeight;

  if (layout.maxLayoutHeight !== undefined) {
    if (layout.maxLayoutHeight >= minLayoutHeight) {
      maxLayoutHeight = layout.maxLayoutHeight;
    } else {
      maxLayoutHeight = minLayoutHeight;
    }
  } else {
    maxLayoutHeight = Infinity;
  }
  values[7] = maxLayoutHeight;

  // Now that values is fully updated, assign the correct layout function.
  this._sc_layoutFunction = SC.GetLayoutFunction(hmode, vmode, hmax, vmax, layoutMode);
  SC.Benchmark.end("SC.Layer#updateLayoutRules");
};

} // BLOSSOM
