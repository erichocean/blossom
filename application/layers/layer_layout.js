/*globals sc_assert */

function layoutFunction(layoutValues, pbounds, anchorPoint, position, bounds, hmode, hlimit, vmode, vlimit, contentMode) {
  sc_assert(hmode >= 0 && hmode < 16);
  sc_assert(hlimit >= 0 && hlimit < 3);
  sc_assert(vmode >= 0 && vmode < 16);
  sc_assert(vlimit >= 0 && vlimit < 3);
  sc_assert(contentMode >= 0 && contentMode < 12);

  var limitsWereNotSatisfied = false,
      pwidth = pbounds[2]/*width*/,
      pheight = pbounds[3]/*height*/,
      minLeft, maxLeft, minRight, maxRight, minWidth,  maxWidth,
      minTop, maxTop, minBottom, maxBottom, minHeight, maxHeight;

  // Calculate position.x, bounds.width using layoutValues and pbounds. 
  // Duplicate the switch statement, sorted by left value the first time 
  // (for position.x), right value the second time (for bounds.width). This 
  // keeps duplicate code at a minimum.
  switch (hmode) {
    case  0: // left, width
    case  2: // left, width percentage
    case 12: // left, right
    case 14: // left, right percentage
      position.x = layoutValues[0]/*left*/;
      break;
    case  1: // left percentage, width
    case  3: // left percentage, width percentage
    case 13: // left percentage, right
    case 15: // left percentage, right percentage
      position.x = pwidth * layoutValues[0]/*left percentage*/;
      break;
    case  4: // right, width
    case  6: // right, width percentage
      position.x = pwidth + layoutValues[0]/*right*/;
      break;
    case  5: // right percentage, width
    case  7: // right percentage, width percentage
      position.x = pwidth + (pwidth * layoutValues[0]/*right percentage*/);
      break;
    case  8: // centerX, width
    case 10: // centerX, width percentage
      position.x = (pwidth/2) + layoutValues[0]/*centerX*/;
      break;
    case  9: // centerX percentage, width
    case 11: // centerX percentage, width percentage
      position.x = (pwidth/2) + (pwidth * layoutValues[0]/*centerX percentage*/);
      break;
  }
  switch (hmode) {
    case  0:                          // left, width
    case  1:               // left percentage, width
    case  4:                         // right, width
    case  5:              // right percentage, width
    case  8:                       // centerX, width
    case  9:            // centerX percentage, width
      bounds.width = layoutValues[1]/*width*/;
      break;
    case  2:               // left, width percentage
    case  3:    // left percentage, width percentage
    case  6:              // right, width percentage
    case  7:   // right percentage, width percentage
    case 10:            // centerX, width percentage
    case 11: // centerX percentage, width percentage
      bounds.width = pwidth * layoutValues[1]/*width percentage*/;
      break;

    // Each of the following cases require both the first and second value.
    case 12: // left, right
      bounds.width = pwidth - layoutValues[0]/*left*/ - layoutValues[1]/*right*/;
      break;
    case 13: // left percentage, right
      bounds.width = pwidth - (pwidth * layoutValues[0]/*left percentage*/) - layoutValues[1]/*right*/;
      break;
    case 14: // left, right percentage
      bounds.width = pwidth - layoutValues[0]/*left*/ - (pwidth * layoutValues[1]/*right percentage*/);
      break;
    case 15: // left percentage, right percentage
      bounds.width = pwidth - (pwidth * layoutValues[0]/*left percentage*/) - (pwidth * layoutValues[1]/*right percentage*/);
      break;
  }

  // Calculate minLeft, maxLeft, minRight, maxRight, minWidth, and maxWidth.
  switch (hlimit) {
    // case 0: // no limits (skip)
    //   break;
    case 1: // horizontal limits (no percentages)
      minLeft  = layoutValues[4]/*minLeft*/;
      maxLeft  = layoutValues[5]/*maxLeft*/;
      minRight = layoutValues[6]/*minRight*/;
      maxRight = layoutValues[7]/*maxRight*/;
      minWidth = layoutValues[8]/*minWidth*/;
      maxWidth = layoutValues[9]/*maxWidth*/;
      break;
    case 2: // horizontal w/ percentage limits – test each individually
      minLeft = layoutValues[4]/*minLeft, could be a percentage*/;
      if (minLeft > 0 && minLeft <= 1) minLeft = pwidth * minLeft;

      maxLeft = layoutValues[5]/*maxLeft, could be a percentage*/;
      if (maxLeft > 0 && maxLeft <= 1) maxLeft = pwidth * maxLeft;

      minRight = layoutValues[6]/*minRight, could be a percentage*/;
      if (minRight > 0 && minRight <= 1) minRight = pwidth * minRight;

      maxRight = layoutValues[7]/*maxRight, could be a percentage*/;
      if (maxRight > 0 && maxRight <= 1) maxRight = pwidth * maxRight;

      minWidth = layoutValues[8]/*minWidth, could be a percentage*/;
      if (minWidth > 0 && minWidth <= 1) minWidth = pwidth * minWidth;

      maxWidth = layoutValues[9]/*maxWidth, could be a percentage*/;
      if (maxWidth > 0 && maxWidth <= 1) maxWidth = pwidth * maxWidth;
      break;
  }

  // Apply limits to position.x, bounds.width.  Set limitsWereNotSatisfied to 
  // true if the proposed limits cannot be satisfied.  Note that a value of 0 
  // (no limits) for hlimit will skip this.
  if (hlimit) {
    
  }

  // Calculate position.y, bounds.height using layoutValues and pbounds. 
  // Duplicate the switch statement, sorted by left value the first time 
  // (for position.y), right value the second time (for bounds.height). This 
  // keeps duplicate code at a minimum.
  switch (vmode) {
    case  0: // top, height
    case  2: // top, height percentage
    case 12: // top, bottom
    case 14: // top, bottom percentage
      position.y = layoutValues[2]/*top*/;
      break;
    case  1: // top percentage, height
    case  3: // top percentage, height percentage
    case 13: // top percentage, bottom
    case 15: // top percentage, bottom percentage
      position.y = pheight * layoutValues[2]/*top percentage*/;
      break;
    case  4: // bottom, height
    case  6: // bottom, height percentage
      position.y = pheight + layoutValues[2]/*bottom*/;
      break;
    case  5: // bottom percentage, height
    case  7: // bottom percentage, height percentage
      position.y = pheight + (pheight * layoutValues[2]/*bottom percentage*/);
      break;
    case  8: // centerY, height
    case 10: // centerY, height percentage
      position.y = (pheight/2) + layoutValues[2]/*centerY*/;
      break;
    case  9: // centerY percentage, height
    case 11: // centerY percentage, height percentage
      position.y = (pheight/2) + (pheight * layoutValues[2]/*centerY percentage*/);
      break;
  }
  switch (vmode) {
    case  0:                           // top, height
    case  1:                // top percentage, height
    case  4:                        // bottom, height
    case  5:             // bottom percentage, height
    case  8:                       // centerY, height
    case  9:            // centerY percentage, height
      bounds.height = layoutValues[3]/*height*/;
      break;
    case  2:                // top, height percentage
    case  3:     // top percentage, height percentage
    case  6:             // bottom, height percentage
    case  7:  // bottom percentage, height percentage
    case 10:            // centerY, height percentage
    case 11: // centerY percentage, height percentage
      bounds.height = pheight * layoutValues[3]/*height percentage*/;
      break;

    // Each of the following cases require both the first and second value.
    case 12: // top, bottom
      bounds.height = pheight - layoutValues[2]/*top*/ - layoutValues[3]/*bottom*/;
      break;
    case 13: // top percentage, bottom
      bounds.height = pheight - (pheight * layoutValues[2]/*top percentage*/) - layoutValues[3]/*bottom*/;
      break;
    case 14: // top, bottom percentage
      bounds.height = pheight - layoutValues[2]/*top*/ - (pheight * layoutValues[3]/*bottom percentage*/);
      break;
    case 15: // top percentage, bottom percentage
      bounds.height = pheight - (pheight * layoutValues[2]/*top percentage*/) - (pheight * layoutValues[3]/*bottom percentage*/);
      break;
  }

  // Calculate minTop, maxTop, minBottom, maxBottom, minHeight, and maxHeight.
  switch (vlimit) {
    // case 0: // no limits (skip)
    //   break;
    case 1: // vertical limits (no percentages)
      minTop    = layoutValues[10]/*minTop*/;
      maxTop    = layoutValues[11]/*maxTop*/;
      minBottom = layoutValues[12]/*minBottom*/;
      maxBottom = layoutValues[13]/*maxBottom*/;
      minHeight = layoutValues[14]/*minHeight*/;
      maxHeight = layoutValues[15]/*maxHeight*/;
      break;
    case 2: // vertical w/ percentage limits – test each individually
      minTop = layoutValues[10]/*minTop, could be a percentage*/;
      if (minTop > 0 && minTop <= 1) minTop = pheight * minTop;

      maxTop = layoutValues[11]/*maxTop, could be a percentage*/;
      if (maxTop > 0 && maxTop <= 1) maxTop = pheight * maxTop;

      minBottom = layoutValues[12]/*minBottom, could be a percentage*/;
      if (minBottom > 0 && minBottom <= 1) minBottom = pheight * minBottom;

      maxBottom = layoutValues[13]/*maxBottom, could be a percentage*/;
      if (maxBottom > 0 && maxBottom <= 1) maxBottom = pheight * maxBottom;

      minHeight = layoutValues[14]/*minHeight, could be a percentage*/;
      if (minHeight > 0 && minHeight <= 1) minHeight = pheight * minHeight;

      maxHeight = layoutValues[15]/*maxHeight, could be a percentage*/;
      if (maxHeight > 0 && maxHeight <= 1) maxHeight = pheight * maxHeight;
      break;
  }

  // Apply limits to position.y, bounds.height.  Set limitsWereNotSatisfied 
  // to true if the proposed limits cannot be satisfied.  Note that a value 
  // of 0 (no limits) for vlimit will skip this.
  if (vlimit) {
    
  }

  if (limitsWereNotSatisfied) {
    // Apply contentMode to proposed position, bounds.
    switch (contentMode) {
      case  0: // scale to fill
        break;
      case  1: // scale aspect fit
        break;
      case  2: // scale aspect fill
        break;
      case  3: // align center
        break;
      case  4: // align top
        break;
      case  5: // align bottom
        break;
      case  6: // align left
        break;
      case  7: // align right
        break;
      case  8: // align top left
        break;
      case  9: // align top right
        break;
      case 10: // align bottom left
        break;
      case 11: // align bottom right
        break;
    }
  }
}
