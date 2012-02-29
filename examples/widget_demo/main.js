// ==========================================================================
// Project:   Blossom - Modern, Cross-Platform Application Framework
// Copyright: ©2012 Fohr Motion Picture Studios. All rights reserved.
// License:   Licensed under the GPLv3 license (see BLOSSOM-LICENSE).
// ==========================================================================
/*global WidgetDemo */

function main() {
  var enabledButton = SC.ButtonWidget.create({
    layout: { centerX: 70, centerY: 0, width: 120, height: 24 },

    isEnabled: true,
    title: "I'm enabled",

    action: function() { setTimeout(function() { alert('clicked'); }, 0); }
  });

  var disbledButton = SC.ButtonWidget.create({
    layout: { centerX: -70, centerY: 0, width: 120, height: 24 },

    isEnabled: false,
    title: "I'm disabled",

    action: function() { alert('clicked'); }
  });

  var surface = SC.View.create();
  surface.get('layers').pushObjects([enabledButton, disbledButton]);

  SC.Application.create();
  SC.app.set('ui', surface);
}
