// ==========================================================================
// Project:   Blossom - Modern, Cross-Platform Application Framework
// Copyright: ©2012 Fohr Motion Picture Studios. All rights reserved.
// License:   Licensed under the GPLv3 license (see BLOSSOM-LICENSE).
// ==========================================================================
/*globals global WidgetDemo */

WidgetDemo = global.WidgetDemo = SC.Object.create({

  value: 'red',
  valueDidChange: function() {
    alert("value is now "+this.get('value'));
  }.observes('value'),

  _sc_activeSurfaceKey: 'buttonsSurface',
  activeSurface: function(key, val) {
    if (val !== undefined) {
      alert("activeSurface is now "+this._sc_activeSurfaceKey);
      this._sc_activeSurfaceKey = val;
    } else return this[this._sc_activeSurfaceKey];
  }.property()

});
