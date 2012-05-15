// ==========================================================================
// Project:   SproutCore - JavaScript Application Framework
// Copyright: ©2006-2011 Strobe Inc. and contributors.
//            Portions ©2008-2010 Apple Inc. All rights reserved.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================

sc_require('system/locale');

/**
  @namespace
  
  SproutCore implements a variety of enhancements to the built-in String 
  object that make it easy to perform common substitutions and conversions.
  
  Most of the utility methods defined here mirror those found in Prototype
  1.6.
  
  @since SproutCore 1.0
*/
SC.mixin(SC.String, {

  /**
    Localizes the string.  This will look up the reciever string as a key 
    in the current Strings hash.  If the key matches, the loc'd value will be
    used.  The resulting string will also be passed through fmt() to insert
    any variables.
    
    @param args {Object...} optional arguments to interpolate also
    @returns {String} the localized and formatted string.
  */
  loc: function() {
    // NB: This could be implemented as a wrapper to locWithDefault() but
    // it would add some overhead to deal with the arguments and adds stack
    // frames, so we are keeping the implementation separate.
    if(!SC.Locale.currentLocale) SC.Locale.createCurrentLocale();
    var str = SC.Locale.currentLocale.locWithDefault(this);
    if (SC.typeOf(str) !== SC.T_STRING) str = this;
    return str.fmt.apply(str,arguments) ;
  },

  /**
    Works just like loc() except that it will return the passed default 
    string if a matching key is not found.
    
    @param {String} def the default to return
    @param {Object...} args optional formatting arguments
    @returns {String} localized and formatted string
  */
  locWithDefault: function(def) {
    if(!SC.Locale.currentLocale) SC.Locale.createCurrentLocale();
    var str = SC.Locale.currentLocale.locWithDefault(this, def);
    if (SC.typeOf(str) !== SC.T_STRING) str = this;
    var args = SC.$A(arguments); args.shift(); // remove def param
    return str.fmt.apply(str,args) ;
  },

  /**
    Accepts canvas 2D rendering context and maximum pixel length arguments 
    and returns a string that does not exceed the maximum width. If the 
    original string is too long for the width it will be truncated with 
    elipses placed at the beginning of a text aligned right context or the 
    end of a text aligned left or center context.

    @param {CanvasRenderingContext2D} context
    @param {Number) maxLength maximum length in pixels of the resulting
  */
  elide: function(context, maxLength) {
    if (maxLength <= 0) return '';
    var ret = this, isRight = context.textAlign === 'right';
    if (context.measureText(ret).width > maxLength) {
      var e = '...', len = context.measureText(e).width;
      while (context.measureText(ret).width+len > maxLength) {
        ret = ret.slice(0, ret.length-1);
      }
      ret = ret+e;
    }
    return ret;
  }

});

/** @private */
String.prototype.loc = SC.String.loc;

/** @private */
String.prototype.locWithDefault = SC.String.locWithDefault;

/** @private */
String.prototype.elide = SC.String.elide;
