// ==========================================================================
// Project:   Blossom - Modern, Cross-Platform Application Framework
// Copyright: ©2012 Fohr Motion Picture Studios. All rights reserved.
// License:   Licensed under the GPLv3 license (see BLOSSOM-LICENSE).
// ==========================================================================
/*globals BLOSSOM */

sc_require('system/responder') ;

if (BLOSSOM) {

/** @class
  Base class for layer behavior.  Behaviors provide two functions:

  1. They translate state and events into actions on their view and layer 
     tree updates and redraws, using the statechart approach.

  2. They act as first responders for incoming keyboard, mouse, and
     touch events.

  Behavior Initialization
  -----------------------

  There are several methods you can override on SC.Behavior that will be 
  called at different times depending on how your behavior is created. Here 
  is a guide to the main methods you may want to override and when:

  - *init:* override this method for any general object setup (such as
    observers) that you need to happen whenever the behavior is created.

  - *updateLayer:* override this method to do more complex management of your 
    layer tree to reflect the current state of your behavior.  This method is 
    called whenever displayDidChange() is called, or one of the keys in  
    `displayProperties` is changed. By default, it calls render(), passing 
    `layer`'s `context` property. If you just need to draw, override 
    `render()` instead.

  @extends SC.Responder
  @since Blossom 1.0
*/
SC.Behavior = SC.Responder.extend({

  isBehavior: true, // Walk like a duck.

  dispatch: function(evt) {
    
  },

  state: null // a String, maps to a hash

});

} // BLOSSOM
