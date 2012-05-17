// ==========================================================================
// Project:   Blossom - Modern, Cross-Platform Application Framework
// Copyright: ©2012 Fohr Motion Picture Studios. All rights reserved.
// License:   Licensed under the GPLv3 license (see BLOSSOM-LICENSE).
// ==========================================================================
/*globals sc_assert FAST_LAYOUT_FUNCTION BENCHMARK_LAYOUT_FUNCTION */

/*jslint evil:true */

sc_require('layers/layout_function');

if (FAST_LAYOUT_FUNCTION) {

console.log("Using FAST_LAYOUT_FUNCTION");

// This implementation generates optimized source code for each possible 
// layout function (there are 9,216). It then uses new Function() to create 
// the function with the optimized source code, and returns it. Each layout 
// function is only generated once.
SC.GetLayoutFunction = function(hmode, vmode, hmax, vmax, layoutMode) {
  sc_assert(hmode >= 0 && hmode < 16);
  sc_assert(vmode >= 0 && vmode < 16);
  sc_assert(typeof hmax === "boolean");
  sc_assert(typeof vmax === "boolean");
  sc_assert(layoutMode >= 0 && layoutMode < 9);

  var shouldBenchmark = BENCHMARK_LAYOUT_FUNCTION;

  var funcName = ['sc', hmode, vmode, hmax, vmax, layoutMode].join('_'),
      func = SC.layoutFunctions[funcName],
      src;

  if (!func) {
    src = [];

    if (shouldBenchmark) {
      src.push(['var benchKey = "', funcName, '";'].join(''));
      src.push('SC.Benchmark.start(benchKey);');
    }

    // Note: layoutMode 5 (top, left) does not depends on pheight, and pwidth 
    // at all, and thus does not have any post-layout adjustments.
    if (layoutMode === 5) {
      src.push('  var x, y, width, height;');

    // Modes 3 and 5 don't have x adjustment, but they do have y.
    } else if (layoutMode === 3 || layoutMode === 7) {
      src.push('  var minLayoutWidth,');
      src.push('    minLayoutHeight, yAdjustment = 0,');
      if (hmax) src.push('    maxLayoutWidth,');
      if (vmax) src.push('    maxLayoutHeight,');
      src.push('    x, y, width, height;');

      // Modes 1 and 6 have x adjustment, but they don't have y.
    } else if (layoutMode === 1 || layoutMode === 6) {
      src.push('  var minLayoutWidth,  xAdjustment = 0,');
      src.push('    minLayoutHeight,');
      if (hmax) src.push('    maxLayoutWidth,');
      if (vmax) src.push('    maxLayoutHeight,');
      src.push('    x, y, width, height;');
    } else {
      src.push('  var minLayoutWidth,  xAdjustment = 0,');
      src.push('    minLayoutHeight, yAdjustment = 0,');
      if (hmax) src.push('    maxLayoutWidth,');
      if (vmax) src.push('    maxLayoutHeight,');
      src.push('    x, y, width, height;');
    }

    if (layoutMode !== 5) {
      // Clamp pwidth and pheight to min/max layout values. This is a 
      // requirement for the layout process below: pwidth and pheight are 
      // assumed to lie within the correct range.
      src.push('minLayoutWidth  = layout[4]/*minLayoutWidth*/;');
      if (hmax) src.push('maxLayoutWidth  = layout[5]/*maxLayoutWidth*/;');
      src.push('if (pwidth < minLayoutWidth) {');
      if (layoutMode !== 3 && layoutMode !== 7) src.push('  xAdjustment = minLayoutWidth - pwidth;'); // a positive number
      src.push('  pwidth = minLayoutWidth;');
      if (hmax) {
        src.push('} else if (pwidth > maxLayoutWidth) {');
        if (layoutMode !== 3 && layoutMode !== 7) src.push('  xAdjustment = maxLayoutWidth - pwidth;'); // a negative number
        src.push('  pwidth = maxLayoutWidth;');
      }
      src.push('}');


      src.push('minLayoutHeight = layout[6]/*minLayoutHeight*/;');
      if (vmax) src.push('maxLayoutHeight = layout[7]/*maxLayoutHeight*/;');
      src.push('if (pheight < minLayoutHeight) {');
      if (layoutMode !== 1 && layoutMode !== 6) src.push('  yAdjustment = minLayoutHeight - pheight;'); // a positive number
      src.push('  pheight = minLayoutHeight;');
      if (vmax) {
        src.push('} else if (pheight > maxLayoutHeight) {');
        if (layoutMode !== 1 && layoutMode !== 6) src.push('  yAdjustment = maxLayoutHeight - pheight;'); // a negative number
        src.push('  pheight = maxLayoutHeight;');
      }
      src.push('}');
    }

    // Calculate x and width using layout and pwidth. Duplicate the switch 
    // statement, sorted by left value the first time (for x), right value 
    // the second time (for width). This keeps duplicate code at a minimum.
    switch (hmode) {
      case  0:                                                // left, width
      case  1:                                     // left percentage, width
      case  4:                                               // right, width
      case  5:                                    // right percentage, width
      case  8:                                             // centerX, width
      case  9:                                  // centerX percentage, width
        src.push('width = layout[1]/*width*/;');
        break;
      case  2:                                     // left, width percentage
      case  3:                          // left percentage, width percentage
      case  6:                                    // right, width percentage
      case  7:                         // right percentage, width percentage
      case 10:                                  // centerX, width percentage
      case 11:                       // centerX percentage, width percentage
        src.push('width = pwidth * layout[1]/*width percentage*/;');
        break;

      // Each of the following cases require both the first and second 
      // value.
      case 12: // left, right
        src.push('width = pwidth - layout[0]/*left*/ - layout[1]/*right*/;');
        break;
      case 13: // left percentage, right
        src.push('width = pwidth - (pwidth * layout[0]/*left percentage*/) - layout[1]/*right*/;');
        break;
      case 14: // left, right percentage
        src.push('width = pwidth - layout[0]/*left*/ - (pwidth * layout[1]/*right percentage*/);');
        break;
      case 15: // left percentage, right percentage
        src.push('width = pwidth - (pwidth * layout[0]/*left percentage*/) - (pwidth * layout[1]/*right percentage*/);');
        break;
    }

    switch (hmode) {
      case  0: // left, width
      case  2: // left, width percentage
      case 12: // left, right
      case 14: // left, right percentage
        src.push('x = layout[0]/*left*/;');
        break;
      case  1: // left percentage, width
      case  3: // left percentage, width percentage
      case 13: // left percentage, right
      case 15: // left percentage, right percentage
        src.push('x = pwidth * layout[0]/*left percentage*/;');
        break;
      case  4: // right, width
      case  6: // right, width percentage
        src.push('x = pwidth - layout[0]/*right*/ - width;');
        break;
      case  5: // right percentage, width
      case  7: // right percentage, width percentage
        src.push('x = pwidth - (pwidth * layout[0]/*right percentage*/) - width;');
        break;
      case  8: // centerX, width
      case 10: // centerX, width percentage
        src.push('x = (pwidth/2) + layout[0]/*centerX*/ - width/2;');
        break;
      case  9: // centerX percentage, width
      case 11: // centerX percentage, width percentage
        src.push('x = (pwidth/2) + (pwidth * layout[0]/*centerX percentage*/) - width/2;');
        break;
    }

    // Calculate position.y, bounds.height using layout and pheight. 
    // Duplicate the switch statement, sorted by left value the first time 
    // (for position.y), right value the second time (for bounds.height). 
    // This keeps duplicate code at a minimum.
    switch (vmode) {
      case  0:                                                // top, height
      case  1:                                     // top percentage, height
      case  4:                                             // bottom, height
      case  5:                                   // bottom prcentage, height
      case  8:                                            // centerY, height
      case  9:                                 // centerY percentage, height
        src.push('height = layout[3]/*height*/;');
        break;
      case  2:                                     // top, height percentage
      case  3:                          // top percentage, height percentage
      case  6:                                  // bottom, height percentage
      case  7:                       // bottom percentage, height percentage
      case 10:                                 // centerY, height percentage
      case 11:                      // centerY percentage, height percentage
        src.push('height = pheight * layout[3]/*height percentage*/;');
        break;

      // Each of the following cases require both the first and second value.
      case 12: // top, bottom
        src.push('height = pheight - layout[2]/*top*/ - layout[3]/*bottom*/;');
        break;
      case 13: // top percentage, bottom
        src.push('height = pheight - (pheight * layout[2]/*top percentage*/) - layout[3]/*bottom*/;');
        break;
      case 14: // top, bottom percentage
        src.push('height = pheight - layout[2]/*top*/ - (pheight * layout[3]/*bottom percentage*/);');
        break;
      case 15: // top percentage, bottom percentage
        src.push('height = pheight - (pheight * layout[2]/*top percentage*/) - (pheight * layout[3]/*bottom percentage*/);');
        break;
    }

    switch (vmode) {
      case  0: // top, height
      case  2: // top, height percentage
      case 12: // top, bottom
      case 14: // top, bottom percentage
        src.push('y = layout[2]/*top*/;');
        break;
      case  1: // top percentage, height
      case  3: // top percentage, height percentage
      case 13: // top percentage, bottom
      case 15: // top percentage, bottom percentage
        src.push('y = pheight * layout[2]/*top percentage*/;');
        break;
      case  4: // bottom, height
      case  6: // bottom, height percentage
        src.push('y = pheight - layout[2]/*bottom*/ - height;');
        break;
      case  5: // bottom percentage, height
      case  7: // bottom percentage, height percentage
        src.push('y = pheight - (pheight * layout[2]/*bottom percentage*/) - height;');
        break;
      case  8: // centerY, height
      case 10: // centerY, height percentage
        src.push('y = (pheight/2) + layout[2]/*centerY*/ - height/2;');
        break;
      case  9: // centerY percentage, height
      case 11: // centerY percentage, height percentage
        src.push('y = (pheight/2) + (pheight * layout[2]/*centerY percentage*/) - height/2;');
        break;
    }

    // All adjustments only affect x and y (position.x and position.y). 
    // Bounds are left unchanged.
    if (layoutMode !== 5) {
      switch (layoutMode) {
        case 0: // align center
        case 1: // align top
        case 2: // align bottom
          src.push('if (xAdjustment !== 0) x += xAdjustment/2;');
          break;
        // case 3: // align left
        // case 5: // align top left
        // case 7: // align bottom left
        //   // x is already correct
        //   break;
        case 4: // align right
        case 6: // align top right
        case 8: // align bottom right
          src.push('if (xAdjustment !== 0) x += xAdjustment;');
          break;
      }

      switch (layoutMode) {
        case 0: // align center
        case 3: // align left
        case 4: // align right
          src.push('if (yAdjustment !== 0) y += yAdjustment/2;');
          break;
        // case 1: // align top
        // case 5: // align top left
        // case 6: // align top right
        //   // y is already correct
        //   break;
        case 2: // align bottom
        case 7: // align bottom left
        case 8: // align bottom right
          src.push('if (yAdjustment !== 0) y += yAdjustment;');
          break;
      }
    }

    // Update the position and bounds structs with the newly-computed 
    // values, offset to take into account anchorX and anchorY.
    // src.push('position.x    = x + anchorX * width;');
    // src.push('position.y    = y + anchorY * height;');
    // src.push('bounds.width  = width;');
    // src.push('bounds.height = height;');
    src.push("Float32Array.prototype.__lookupSetter__('x').call(position, Math.floor(x + anchorX * width))");
    src.push("Float32Array.prototype.__lookupSetter__('y').call(position, Math.floor(y + anchorY * height))");
    src.push("Float32Array.prototype.__lookupSetter__('width').call(bounds, Math.ceil(width))");
    src.push("Float32Array.prototype.__lookupSetter__('height').call(bounds, Math.ceil(height))");

    if (shouldBenchmark) {
      src.push('SC.Benchmark.end(benchKey);');
    }

    src = src.join('\n  ');
    // if (funcName === "sc_12_12_false_false_5") console.log(src);
    func = SC.layoutFunctions[funcName] = new Function("layout", "pwidth", "pheight", "anchorX", "anchorY", "position", "bounds", src);
  }

  return func;
};

} // FAST_LAYOUT_FUNCTION
