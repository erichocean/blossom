/*globals sc_assert */

function layoutFunction(layoutValues, pbounds, anchorPoint, position, bounds, hmode, hlimit, vmode, vlimit, contentMode) {
  sc_assert(hmode >= 0 && hmode < 16);
  sc_assert(hlimit >= 0 && hlimit < 3);
  sc_assert(vmode >= 0 && vmode < 16);
  sc_assert(vlimit >= 0 && vlimit < 3);
  sc_assert(contentMode >= 0 && contentMode < 12);

  var limitsWereNotSatisfied = false,
      pwidth = pbounds[2]/*width*/,
      pheight = pbounds[3]/*height*/;

  // Calculate position.x, bounds.width using layoutValues and pbounds. 
  // Duplicate the switch statement, sorted by right value the first time 
  // (for position.x), left value the second time (for bounds.width). This 
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

  // Apply limits to position.x, bounds.width.  Set limitsWereNotSatisfied to 
  // true if the proposed limits cannot be satisfied.
  switch (hlimit) {
    case 0: // no limit (skip)
      break;
    case 1: // horizontal limit
      break;
    case 2: // horizontal percentage limit
      break;
  }

  // Calculate position.y, bounds.height.
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

  // Apply limits to position.y, bounds.height.  Set limitsWereNotSatisfied 
  // to true if the proposed limits cannot be satisfied.
  switch (vlimit) {
    case 0: // no limit (skip)
      break;
    case 1: // vertical limit
      break;
    case 2: // vertical percentage limit
      break;
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
