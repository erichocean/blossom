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
    var ret = this;
    var len = context.measureText(ret).width;
    
    // if no width is provided use the one we can find...
    if (!maxLength) maxLength = context.width;
    
    // fast-path for short text
    if (len <= maxLength) return ret;
    
    // distance margin/error
    var allow = 0.1;
    var m = context.measureText('M').width;
    var d = context.measureText('.').width*3;
    var max;
    
    // lets try and shortcut this with guesswork
    // calculate the number of M's we could use
    // with the elipses and clip the string to this
    // length arbitrarily
    max = Math.round((maxLength - d) / ((m) || 1));
    ret = ret.slice(0, max);
    
    // since the guesswork might be a bit overzealous we will
    // work hard to make it a little better but still do
    // less work than if we'd started at the end and worked
    // ourselves back...in most cases   
    while (((maxLength - (context.measureText(ret).width+d))/maxLength) > allow) {
      ret = ret + this[ret.length];
    }
    
    // boom
    return ret + '...';
  }

});

/** @private */
String.prototype.loc = SC.String.loc;

/** @private */
String.prototype.locWithDefault = SC.String.locWithDefault;

/** @private */
String.prototype.elide = SC.String.elide;
