// ==========================================================================
// Project:   SproutCore - JavaScript Application Framework
// Copyright: ©2006-2011 Strobe Inc. and contributors.
//            Portions ©2008-2010 Apple Inc. All rights reserved.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================
/*global BLOSSOM sc_assert */

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

if (BLOSSOM) {

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

/**
  Adds displayProperties -> displayPropertiesHash handling to the classe's
  `extend` and `create` methods.  This will be automatically picked up by any 
  subclasses, so you only need to call this on the base class that first 
  defines `displayProperties`.
*/
SC.AugmentBaseClassWithDisplayProperties = function(K) {

  // Handle displayProperties on the base class.
  var displayProperties = K.prototype.displayProperties,
      displayPropertiesHash, idx, len, key;

  if (displayProperties !== undefined) {
    displayPropertiesHash = {};
    // sc_assert(displayProperties && SC.typeOf(displayProperties) === SC.T_ARRAY);
    for (idx=0, len=displayProperties.length; idx<len; ++idx) {
      key = displayProperties[idx];
      if (displayPropertiesHash[key] !== undefined) throw "A displayProperty collides with a predefined name on Object: "+key+". Please use a different name.";
      displayPropertiesHash[key] = true;
    }
    K.prototype.displayPropertiesHash = displayPropertiesHash;
  } else throw "Base class does not define any displayProperties!";

  K.extend = function(props) {
    var bench = SC.BENCHMARK_OBJECTS ;
    if (bench) SC.Benchmark.start('SC.Object.extend') ;

    // build a new constructor and copy class methods.  Do this before 
    // adding any other properties so they are not overwritten by the copy.
    var prop, ret = function(props) { return this._object_init(props); } ;
    for(prop in this) {
      if (!this.hasOwnProperty(prop)) continue ;
      ret[prop] = this[prop];
    }

    // manually copy toString() because some JS engines do not enumerate it
    if (this.hasOwnProperty('toString')) ret.toString = this.toString;

    // now setup superclass, guid
    ret.superclass = this ;
    SC.generateGuid(ret); // setup guid

    ret.subclasses = SC.Set.create();
    this.subclasses.add(ret); // now we can walk a class hierarchy

    // setup new prototype and add properties to it
    var base = (ret.prototype = SC.beget(this.prototype));
    var idx, len = arguments.length;
    for(idx=0;idx<len;idx++) SC._object_extend(base, arguments[idx]) ;
    base.constructor = ret; // save constructor

    var displayProperties = base.displayProperties,
        displayPropertiesHash, key;

    if (displayProperties !== undefined) {
      displayPropertiesHash = {};
      // sc_assert(displayProperties && SC.typeOf(displayProperties) === SC.T_ARRAY);
      for (idx=0, len=displayProperties.length; idx<len; ++idx) {
        key = displayProperties[idx];
        if (displayPropertiesHash[key] !== undefined) throw "A displayProperty collides with a predefined name on Object: "+key+". Please use a different name.";
        displayPropertiesHash[key] = true;
      }
      base.displayPropertiesHash = displayPropertiesHash;
    }

    if (bench) SC.Benchmark.end('SC.Object.extend') ;
    return ret ;
  };

  K.create = function() {
    var C=this, ret = new C(arguments),
        hasDisplayProperties = ret.hasOwnProperty('displayProperties'),
        displayProperties, displayPropertiesHash, idx, len, key;

    if (hasDisplayProperties) {
      displayProperties = ret.displayProperties;
      displayPropertiesHash = {};
      // sc_assert(displayProperties && SC.typeOf(displayProperties) === SC.T_ARRAY);
      for (idx=0, len=displayProperties.length; idx<len; ++idx) {
        key = displayProperties[idx];
        if (displayPropertiesHash[key] !== undefined) throw "A displayProperty collides with a predefined name on Object: "+key+". Please use a different name.";
        displayPropertiesHash[key] = true;
      }
      console.log(displayPropertiesHash);
      ret.displayPropertiesHash = displayPropertiesHash;
    }

    return ret ; 
  };
};

} // BLOSSOM
