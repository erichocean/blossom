// ==========================================================================
// Project:   SproutCore - JavaScript Application Framework
// Copyright: ©2006-2011 Strobe Inc. and contributors.
//            Portions ©2008-2010 Apple Inc. All rights reserved.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================

/**
  Adds a transform to format the DateTime value to a String value according
  to the passed format string. 
  
  {{
    valueBinding: SC.Binding.dateTime('%Y-%m-%d %H:%M:%S')
                  .from('MyApp.myController.myDateTime');
  }}

  @param {String} format format string
  @returns {SC.Binding} this
*/
SC.Binding.dateTime = function(format) {
  return this.transform(function(value, binding) {
    return value ? value.toFormattedString(format) : null;
  });
};
