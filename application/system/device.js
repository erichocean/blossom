// ==========================================================================
// Project:   SproutCore - JavaScript Application Framework
// Copyright: ©2006-2011 Strobe Inc. and contributors.
//            Portions ©2008-2010 Apple Inc. All rights reserved.
//            Code within if (BLOSSOM) {} sections is ©2012 Fohr Motion 
//            Picture Studios. All rights reserved.
// License:   Most code licensed under MIT license (see SPROUTCORE-LICENSE).
//            Code within if (BLOSSOM) {} sections is under GPLv3 license
//            (see BLOSSOM-LICENSE).
// ==========================================================================
/*globals BLOSSOM */

sc_require('system/platform');
sc_require('system/ready');
sc_require('system/root_responder');

if (! BLOSSOM) {

/**
  The device object allows you to check device specific properties such as 
  orientation and if the device is offline, as well as observe when they change 
  state.
  
  h1. Orientation
  When a touch device changes orientation, the orientation property will be
  set accordingly which you can observe
  
  h1. Offline support
  In order to build a good offline-capable web application, you need to know 
  when your app has gone offline so you can for instance queue your server 
  requests for a later time or provide a specific UI/message.
  
  Similarly, you also need to know when your application has returned to an 
  'online' state again, so that you can re-synchronize with the server or do 
  anything else that might be needed.
  
  By observing the 'isOffline' property you can be notified when this state
  changes. Note that this property is only connected to the navigator.onLine
  property, which is available on most modern browsers.
  
*/
SC.Device = SC.Object.extend({
  
  /**
    Sets the orientation for touch devices, either 'landscape' or 'portrait'. 
    Will be 'desktop' in the case of non-touch devices.
  
    @property {String}
    @default 'desktop'
  */
  orientation: 'desktop',
  
  /**
    Indicates whether the device is currently online or offline. For browsers
    that do not support this feature, the default value is false.
    
    Is currently inverse of the navigator.onLine property. Most modern browsers
    will update this property when switching to or from the browser's Offline 
    mode, and when losing/regaining network connectivity.
    
    @property {Boolean}
    @default false
  */
  isOffline: false,

  /**
    Returns a Point containing the last known X and Y coordinates of the
    mouse, if present.

    @property {Point}
  */
  mouseLocation: function() {
    var responder = SC.RootResponder.responder,
        lastX = responder._lastMoveX,
        lastY = responder._lastMoveY;

    if (SC.empty(lastX) || SC.empty(lastY)) {
      return null;
    }

    return { x: lastX, y: lastY };
  }.property(),

  /**
    Initialize the object with some properties up front
  */
  init: function() {
    arguments.callee.base.apply(this, arguments);
    if(SC.platform.touch) this.orientationchange();
    
    if(navigator && navigator.onLine===false) {
      this.set('isOffline', true);
    }
    
    this.panes = SC.Set.create();
  },
  
  // ..........................................................
  // EVENT HANDLING
  //
  
  orientationchange: function(evt) {
    if(window.orientation===0 || window.orientation===180) {
      this.set('orientation', 'portrait');
    }
    else {
      this.set('orientation', 'landscape');
    }
  },
  
  orientationObserver: function(){
    var body = SC.$(document.body),
        or = this.get('orientation');
    if(or === "portrait") {
      body.setClass('portrait', true);
      body.setClass('landscape', false);
    }
    if( or === "landscape" ) {
      body.setClass('portrait', false);
      body.setClass('landscape', true);
    }
  }.observes('orientation'),
  
  online: function(evt) {
    this.set('isOffline', false);
  },
  
  offline: function(evt) {
    this.set('isOffline', true);
  }

});

if (BLOSSOM) {

SC.Device = SC.Device.extend({

  /**
    As soon as the DOM is up and running, make sure we attach necessary
    event handlers
  */
  setup: function() {
    SC.app.listenFor('orientationchange'.w(), window, this);
    SC.app.listenFor('online offline'.w(), document, this);
  }

});

}

if (! BLOSSOM) {

SC.Device = SC.Device.extend({

  /**
    As soon as the DOM is up and running, make sure we attach necessary
    event handlers
  */
  setup: function() {
    var responder = SC.RootResponder.responder;
    responder.listenFor('orientationchange'.w(), window, this);
    responder.listenFor('online offline'.w(), document, this);
  }

});

/*
  Invoked when the document is ready, but before main is called.  Creates
  an instance and sets up event listeners as needed.
*/
SC.ready(function() {
  SC.device.setup() ;
});

} // ! BLOSSOM

SC.device = SC.Device.create();

} // ! BLOSSOM
