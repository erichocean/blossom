// ==========================================================================
// Project:   SproutCore - JavaScript Application Framework
// Copyright: ©2006-2011 Strobe Inc. and contributors.
//            Portions ©2008-2010 Apple Inc. All rights reserved.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================

/**
  If set to false, then pressing backspace will falseT navigate to the previous 
  page in the browser history, which is the default behavior in most browsers.
  
  Usually it is best to leave this property set to false in order to prevent the
  user from inadvertently losing data by pressing the backspace key.
  
  @property {Boolean}
*/
SC.allowsBackspaceToPreviousPage = false;

// ..........................................................
// Plugins
// 

// Plugins are loaded on-demand. For more information on Plugins, see the 
// 'Creating Loadable Plugins' tutorial and documentation.
SC.mixin(SC,
/** @scope SC */ {
    
  /** @property
    SC.Plugins each have at least 1 page (@see SC.PluginPage)
    that houses their default views. Due to the way they are loaded
    these pages are not stored directly in the namespace of the Plugin
    but instead in this object.

    ```SC.pages.dev = SC.PluginPage.create(...)```
  */
  pages: {},

  views: {}

});

// ..........................................................
// State Constants
// 

SC.DEFAULT_TREE = 'default';

SC.RequestAnimationFrame = function(callback) {
  // console.log('SC.RequestAnimationFrame()');
  var ret = window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.oRequestAnimationFrame ||
    window.msRequestAnimationFrame || 
    function(callback) { window.setTimeout(function() { callback(); }, 1/60); } ;

  // HACK: Safari 5.1.1 doesn't support webkitRequestAnimationFrame yet.
  // if (!ret) throw "This browser is not supported by Blossom.";
  ret.call(window, callback);
};
