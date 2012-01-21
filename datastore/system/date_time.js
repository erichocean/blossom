// ==========================================================================
// Project:   SproutCore - JavaScript Application Framework
// Copyright: ©2006-2011 Strobe Inc. and contributors.
//            Portions ©2008-2010 Apple Inc. All rights reserved.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================

sc_require('models/record_attribute');

/**
  Registers a transform to allow SC.DateTime to be used as a record attribute,
  ie SC.Record.attr(SC.DateTime);

  Because SC.RecordAttribute is in the datastore framework and SC.DateTime in
  the foundation framework, and we don't know which framework is being loaded
  first, this chunck of code is duplicated in both frameworks.

  IF YOU EDIT THIS CODE MAKE SURE YOU COPY YOUR CHANGES to record_attribute.js. 
*/
SC.RecordAttribute.registerTransform(SC.DateTime, {

  /** @private
    Convert a String to a DateTime
  */
  to: function(str, attr) {
    if (SC.none(str) || SC.instanceOf(str, SC.DateTime)) return str;
    var format = attr.get('format');
    return SC.DateTime.parse(str, format ? format : SC.DateTime.recordFormat);
  },

  /** @private
    Convert a DateTime to a String
  */
  from: function(dt, attr) {
    if (SC.none(dt)) return dt;
    var format = attr.get('format');
    return dt.toFormattedString(format ? format : SC.DateTime.recordFormat);
  }

});
