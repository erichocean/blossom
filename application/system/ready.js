// ==========================================================================
// Project:   SproutCore - JavaScript Application Framework
// Copyright: ©2006-2011 Strobe Inc. and contributors.
//            Portions ©2008-2010 Apple Inc. All rights reserved.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================
/*global main */

sc_require('system/event');

SC.mixin({
  _isReadyBound: NO,
  
  /** @private configures the ready event handler if needed */
  _bindReady: function() {
    if (this._isReadyBound) return;
    this._isReadyBound = YES ;

    // Mozilla, Opera (see further below for it) and webkit nightlies 
    // currently support this event.  Use the handy event callback
    if ( document.addEventListener && !SC.browser.opera) {
      document.addEventListener( "DOMContentLoaded", SC.didBecomeReady, NO );
    }

    // If IE is used and is not in a frame
    // Continually check to see if the document is ready
    if (SC.browser.msie && (window === top)) {
      (function() {
        if (SC.isReady) return;
        try {
          // If IE is used, use the trick by Diego Perini
          // http://javascript.nwbox.com/IEContentLoaded/
          document.documentElement.doScroll("left");
        } catch( error ) {
          setTimeout( arguments.callee, 0 );
          return;
        }
        // and execute any waiting functions
        SC.didBecomeReady();
      })();
    }

    if ( SC.browser.opera ) {
      document.addEventListener( "DOMContentLoaded", function () {
        if (SC.isReady) return;
        for (var i = 0; i < document.styleSheets.length; i++) {
          if (document.styleSheets[i].disabled) {
            setTimeout( arguments.callee, 0 );
            return;
          }
        }
        // and execute any waiting functions
        SC.didBecomeReady();
      }, NO);
    }

    if (SC.browser.safari && SC.browser.safari < 530.0 ) {
      console.error("ready() is not yet supported on Safari 3.1 and earlier");
      // TODO: implement ready() in < Safari 4 
      // var numStyles;
      // (function(){
      //   if (SC.isReady) return;
      //   if ( document.readyState != "loaded" && document.readyState != "complete" ) {
      //     setTimeout( arguments.callee, 0 );
      //     return;
      //   }
      //   if ( numStyles === undefined ) numStyles = 0 ;
      //     //numStyles = SC.$("style, link[rel=stylesheet]").length;
      //   if ( document.styleSheets.length != numStyles ) {
      //     setTimeout( arguments.callee, 0 );
      //     return;
      //   }
      //   // and execute any waiting functions
      //   SC._didBecomeReady();
      // })();
    }

    // A fallback to window.onload, that will always work
    SC.Event.add( window, "load", SC.didBecomeReady);
  },

  /** @private invoked when the document becomes ready. */
  didBecomeReady: function() {
    // Only call once
    if (SC.isReady) return ;
    if (typeof SC.mapDisplayNames === SC.T_FUNCTION) SC.mapDisplayNames();
    if (typeof SC.addInvokeOnceLastDebuggingInfo === SC.T_FUNCTION) SC.addInvokeOnceLastDebuggingInfo();
     
    // setup locale
    SC.Locale.createCurrentLocale();
    
    // if there is a body tag on the document, set the language
    if (document && document.getElementsByTagName) {
      var body = document.getElementsByTagName('body')[0];
      if (body) {
        var className = body.className ;
        var language = SC.Locale.currentLanguage.toLowerCase() ;
        body.className = (className && className.length>0) ? [className, language].join(' ') : language ;
      }
    }

    SC.Benchmark.start('ready') ;
    
    // Begin runloop
    SC.run(function() {
      var handler, ary, idx, len ;

      // correctly handle queueing new SC.ready() calls
      do {
        ary = SC._readyQueue ;
        SC._readyQueue = [] ; // reset
        for (idx=0, len=ary.length; idx<len; idx++) {
          handler = ary[idx] ;
          var target = handler[0] || document ;
          var method = handler[1] ;
          if (method) method.call(target) ;
        }
      } while (SC._readyQueue.length > 0) ;

      // okay, now we're ready (any SC.ready() calls will now be called immediately)
      SC.isReady = YES ;

      // clear the queue
      SC._readyQueue = null ;

      // trigger any bound ready events
      SC.Event.trigger(document, "ready", null, NO);

      // Remove any loading div
      if (SC.removeLoading) SC.$('#loading').remove();

      // Now execute main, if defined and SC.UserDefaults is ready
      if(SC.userDefaults.get('ready')){
        if ((SC.mode === SC.APP_MODE) && (typeof main != "undefined") && (main instanceof Function) && !SC.suppressMain) main();
      } 
      else {
        SC.userDefaults.readyCallback(window, main);
      }
    }, this);
    
    SC.Benchmark.end('ready') ;
    if (SC.BENCHMARK_LOG_READY) SC.Benchmark.log();
  }

});

SC._bindReady();
SC.removeLoading = YES;

// default to app mode.  When loading unit tests, this will run in test mode
SC.APP_MODE = "APP_MODE";
SC.TEST_MODE = "TEST_MODE";
SC.mode = SC.APP_MODE;
