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
/*global SPROUTCORE BLOSSOM main sc_assert */

sc_require('system/browser');
sc_require('system/event');

if (BLOSSOM) {

SC.mixin({
  _sc_isReadyBound: false,

  /** @private configures the ready event handler if needed */
  _sc_bindReady: function() {
    if (this._sc_isReadyBound) return;
    this._sc_isReadyBound = true;

    sc_assert(document.addEventListener);
    document.addEventListener('DOMContentLoaded', SC.didBecomeReady, false);

    // A fallback to window.onload, that will always work.
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
        body.className = (className && className.length > 0) ? [className, language].join(' ') : language ;
      }
    }

    SC.Benchmark.start('ready') ;

    // Begin runloop
    SC.run(function() {
      var handler, ary, idx, len ;

      // correctly handle queueing new SC.ready() calls
      do {
        ary = SC._sc_readyQueue ;
        SC._sc_readyQueue = [] ; // reset
        for (idx=0, len=ary.length; idx<len; idx++) {
          handler = ary[idx] ;
          var target = handler[0] || document ;
          var method = handler[1] ;
          if (method) method.call(target) ;
        }
      } while (SC._sc_readyQueue.length > 0) ;

      // okay, now we're ready (any SC.ready() calls will now be called immediately)
      SC.isReady = YES ;

      // clear the queue
      SC._sc_readyQueue = null ;

      // trigger any bound ready events
      SC.Event.trigger(document, "ready", null, NO);

      // Now execute main, if defined and SC.UserDefaults is ready
      if (SC.userDefaults.get('ready')) {
        if ((SC.mode === SC.APP_MODE) && (typeof main != "undefined") && (main instanceof Function) && !SC.suppressMain) main();
      } else {
        SC.userDefaults.readyCallback(window, main);
      }
    }, this);

    SC.Benchmark.end('ready') ;
    if (SC.BENCHMARK_LOG_READY) SC.Benchmark.log();
  }

});

} // BLOSSOM

if (SPROUTCORE) {

SC.mixin({
  _sc_isReadyBound: NO,
  
  /** @private configures the ready event handler if needed */
  _sc_bindReady: function() {
    if (this._sc_isReadyBound) return;
    this._sc_isReadyBound = YES ;

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
        ary = SC._sc_readyQueue ;
        SC._sc_readyQueue = [] ; // reset
        for (idx=0, len=ary.length; idx<len; idx++) {
          handler = ary[idx] ;
          var target = handler[0] || document ;
          var method = handler[1] ;
          if (method) method.call(target) ;
        }
      } while (SC._sc_readyQueue.length > 0) ;

      // okay, now we're ready (any SC.ready() calls will now be called immediately)
      SC.isReady = YES ;

      // clear the queue
      SC._sc_readyQueue = null ;

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

} // SPROUTCORE

SC._sc_bindReady();
SC.removeLoading = YES;

// default to app mode.  When loading unit tests, this will run in test mode
SC.APP_MODE = "APP_MODE";
SC.TEST_MODE = "TEST_MODE";
SC.mode = SC.APP_MODE;
