// ==========================================================================
// Project:   SproutCore Costello - Property Observing Library
// Copyright: ©2006-2011 Strobe Inc. and contributors.
//            Portions ©2008-2010 Apple Inc. All rights reserved.
//            Code within if (BLOSSOM) {} sections is ©2012 Fohr Motion 
//            Picture Studios. All rights reserved.
// License:   Most code licensed under MIT license (see SPROUTCORE-LICENSE).
//            Code within if (BLOSSOM) {} sections is under GPLv3 license
//            (see BLOSSOM-LICENSE).
// ==========================================================================
/*globals sc_assert */

SC.TextSelection = function(start, end) {
  this.start = start;
  this.end = end;

  sc_assert(this.isValid);

  return this;
};

var proto = SC.TextSelection.prototype;

Object.defineProperty(proto, 'length', {
  get: function() {
    return this.end - this.start;  
  }
});

Object.defineProperty(proto, 'isValid', {
  get: function() {
    var start = this.start,
        end = this.end;

    if (typeof start === 'number' && Math.floor(start) === start &&
        typeof end === 'number' && Math.floor(end) === end &&
        0 <= start && start <= end)
    {
      return true;
    } else return false;  
  }
});
