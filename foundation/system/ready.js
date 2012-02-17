// ==========================================================================
// Project:   Blossom - Modern, Cross-Platform Application Framework
// Copyright: ©2012 Fohr Motion Picture Studios. All rights reserved.
// License:   Licensed under the GPLv3 license (see BLOSSOM-LICENSE).
// ==========================================================================
/*global main */

var SC = global.SC; // Required to allow foundation to be re-namespaced as BT 
                    // when loaded by the buildtools.

SC.BENCHMARK_LOG_READY = NO;

SC.mixin({
  /** @private handlers scheduled to execute on ready. */
  _sc_readyQueue: [],

  isReady: NO,
  
  /** @private invoked when the document becomes ready. */
  didBecomeReady: function() {
    // Only call once
    if (SC.isReady) return ;
    if (typeof SC.mapDisplayNames === SC.T_FUNCTION) SC.mapDisplayNames();
    if (typeof SC.addInvokeOnceLastDebuggingInfo === SC.T_FUNCTION) SC.addInvokeOnceLastDebuggingInfo();

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
    });

    SC.Benchmark.end('ready') ;
    if (SC.BENCHMARK_LOG_READY) SC.Benchmark.log();
  },
  
  /** 
    Add the passed target and method to the queue of methods to invoke when
    the document is ready.  These methods will be called after the document
    has loaded and parsed, but before the main() function is called.
    
    Methods are called in the order they are added.
  
    If you add a ready handler when the main document is already ready, then
    your handler will be called immediately.
    
    @param target {Object} optional target object
    @param method {Function} method name or function to execute
    @returns {SC}
  */
  ready: function(target, method) {
    var queue = this._sc_readyQueue;
    
    // normalize
    if (method === undefined) {
      method = target; target = null ;
    } else if (SC.typeOf(method) === SC.T_STRING) {
      method = target[method] ;
    }
    
    if (!method) return this; // nothing to do.
    
    // if isReady, execute now.
    if (this.isReady) return method.call(target || document) ;
    
    // otherwise, add to queue.
    queue.push([target, method]) ;
    return this ; 
  }
  
});
