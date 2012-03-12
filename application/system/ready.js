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
/*global main sc_assert */

sc_require('system/browser');
sc_require('system/event');

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
      SC.isReady = true ;

      // clear the queue
      SC._sc_readyQueue = null ;

      // trigger any bound ready events
      SC.Event.trigger(document, "ready", null, false);

      // Now execute main, if defined and SC.UserDefaults is ready
      if (SC.userDefaults.get('ready')) {
        SC.isExecutingMain = true;
        if ((SC.mode === SC.APP_MODE) && (typeof main != "undefined") && (main instanceof Function) && !SC.suppressMain) main();
        SC.isExecutingMain = false;
      } else {
        SC.userDefaults.readyCallback(window, main);
      }
    }, this);

    SC.Benchmark.end('ready') ;
    if (SC.BENCHMARK_LOG_READY) SC.Benchmark.log();
  }

});

SC._sc_bindReady();
SC.removeLoading = true;

// default to app mode.  When loading unit tests, this will run in test mode
SC.APP_MODE = "APP_MODE";
SC.TEST_MODE = "TEST_MODE";
SC.mode = SC.APP_MODE;
