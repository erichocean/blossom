// ==========================================================================
// Project:   Blossom - Modern, Cross-Platform Application Framework
// Copyright: ©2012 Fohr Motion Picture Studios. All rights reserved.
// License:   Licensed under the GPLv3 license (see BLOSSOM-LICENSE).
// ==========================================================================
/*globals global WidgetDemo */

WidgetDemo = global.WidgetDemo = SC.Object.create({

  value: 'red',
  valueDidChange: function() {
    console.log("value is now "+this.get('value'));
  }.observes('value')

});
