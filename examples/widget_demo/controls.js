// ==========================================================================
// Project:   Blossom - Modern, Cross-Platform Application Framework
// Copyright: ©2012 Fohr Motion Picture Studios. All rights reserved.
// License:   Licensed under the GPLv3 license (see BLOSSOM-LICENSE).
// ==========================================================================
/*globals global WidgetDemo */

WidgetDemo.controlsSurface = SC.View.create();

WidgetDemo.controlsSurface.get('layers').pushObject(SC.ButtonWidget.create({
  layout: { centerX: 0, centerY: 0, width: 100, height: 24 },

  title: "click me",

  action: function() { SC.app.set('ui', WidgetDemo.buttonsSurface); }

}));

