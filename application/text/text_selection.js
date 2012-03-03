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
/*globals BLOSSOM sc_assert */

if (BLOSSOM) {

SC.TextSelection = function(start, end) {
  this.start = start;
  this.end = end;

  sc_assert(this.isValid);

  return this;
};

SC.TextSelection.prototype.__defineGetter__('length', function() {
  return this.end - this.start;
});

SC.TextSelection.prototype.__defineGetter__('isValid', function() {
  var start = this.start,
      end = this.end;

  if (typeof start === 'number' && Math.floor(start) === start &&
      typeof end === 'number' && Math.floor(end) === end &&
      0 <= start && start <= end)
  {
    return true;
  } else return false;
});

} // BLOSSOM

if (! BLOSSOM) {

/**
  @class
  
  A simple object representing the selection inside a text field.  Each
  object is frozen and contains exactly three properties:
  
    *  start
    *  end
    *  length
  
  Important note:  In Internet Explorer, newlines in textara elements are
  considered two characters.  SproutCore does not currently try to hide this from you.
  
  @extends SC.Object
  @extends SC.Copyable
  @extends SC.Freezable
  @since SproutCore 1.0
*/

SC.TextSelection = SC.Object.extend(SC.Copyable, SC.Freezable,
/** @scope SC.TextSelection.prototype */ {  

  /**
    The number of characters appearing to the left of the beginning of the
    selection, starting at 0.
    
    @type {Number}
  */
  start: -1,
  
  
  /**
    The number of characters appearing to the left of the end of the
    selection.

    This will have the same value as 'start' if there is no selection and
    instead there is only a caret.
    
    @type {Number}
  */
  end: -1,
 
   
  /**
    The length of the selection.  This is equivalent to (end - start) and
    exists mainly as a convenience.
    
    @property {Number}
  */
  length: function() {
    var start = this.get('start') ;
    var end   = this.get('end') ;
    if ((start) === -1  ||  (end === -1)) {
      return -1 ;
    }
    else {
      return end - start ;
    }
  }.property('start', 'end').cacheable(),
  
  
  
  // ..........................................................
  // INTERNAL SUPPORT
  //
  
  init: function() {
    arguments.callee.base.apply(this, arguments);
    this.freeze();
  },
  
  
  copy: function() {
    return SC.TextSelection.create({
      start: this.get('start'),
      end:   this.get('end')
    });
  },
  
  
  toString: function() {
    var length = this.get('length');
    if (length  &&  length > 0) {
      if (length === 1) {
        return "[%@ character selected: {%@, %@}]".fmt(length, this.get('start'), this.get('end'));
      }
      else {
        return "[%@ characters selected: {%@, %@}]".fmt(length, this.get('start'), this.get('end'));
      }
    }
    else {
      return "[no text selected; caret at %@]".fmt(this.get('start'));
    }
  }

}) ;

} // ! BLOSSOM
