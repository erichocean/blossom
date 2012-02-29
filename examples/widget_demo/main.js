// ==========================================================================
// Project:   Blossom - Modern, Cross-Platform Application Framework
// Copyright: ©2012 Fohr Motion Picture Studios. All rights reserved.
// License:   Licensed under the GPLv3 license (see BLOSSOM-LICENSE).
// ==========================================================================
/*global WidgetDemo */

function main() {
  var surface = SC.View.create();

  surface.get('layers').pushObject(SC.ButtonWidget.create({
    layout: { centerX: 0, centerY: 0, width: 100, height: 24 },

    title: "click me",
    // isEnabled: false,

    action: function() { alert('clicked'); }

  }));

  SC.Application.create();
  SC.app.set('ui', surface);
}
