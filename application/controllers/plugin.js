// ==========================================================================
// Project:   SproutCore Plugin Architecture
// Copyright: ©2012 xTuple. All rights reserved.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================

sc_require("ext/common");

/** @class
  
  The plugin controller is responsible for supplying an interface
  to available plugins for application objects at runtime but also
  coordinates plugin routines and execution, visibility, and ensures
  consistency, etc.

*/
SC.PluginController = SC.Object.create(
  /** @scope SC.PluginController.prototype */ {

  //..........................................
  // Public Properties
  //

  /** @property */
  availablePlugins: null,

  /** @property */
  loadedPlugins: null,

  /** @property */
  pluginOrder: null,

  /** @property */
  currentPlugin: null,

  /** @property */
  previousPlugin: null,

  //..........................................
  // Public Methods
  //

  /** @public 
    Loads a requested plugin (asynchronously) and executes any callbacks
    supplied. Can take any number of callbacks to be executed synchronously
    upon the plugin being completely loaded.
  */
  load: function() {
    var args = Array.prototype.slice.call(arguments),
        request = args.shift(); 
    this._load(request, args);
    return true;
  },

  /** @public
    Returns whether or not the requested plugin is loaded.
  */
  isLoaded: function(request) {
    return this.get("loadedPlugins").contains(request);
  },

  /** @public
    Returns whether or not the requested plugin is a valid plugin.
  */
  isPlugin: function(request) {
    return !! this._plugins[request];
  },

  /** @public
    Convenience method to load a plugin and append it after it
    is loaded.
  */
  append: function(request) {
    this.load(request, this._appendPlugin);
  },

  /** @public
    Register via a conventional string-format for an event to be
    executed on a target when a particular plugin is loaded.
  */
  registerHook: function(hook, target) {
    var hooks = this.get("_pluginHooks"),
        name = (hook.split(":")[1] || "").capitalize();
    hooks.push({ plugin: name, target: target, hook: hook });
  },

  //..........................................
  // Private Properties
  //

  /** @private */
  _currentPlugin: null,

  /** @private */
  _pluginHooks: [],

  /** @private */
  name: "Plugin.Controller",

  //..........................................
  // Bindings
  // 

  _statusBinding: SC.Binding.from("XT.Session.isActive").oneWay(),

  //..........................................
  // Observers
  // 

  /** @private */
  _currentPluginDidChange: function() {
    this.warn("_currentPluginDidChange");
    var _cp = this.get("_currentPlugin"),
        cp = this.get("currentPlugin");
    if(cp.get("pluginName") && !_cp
        || cp.get("pluginName") !== _cp.get("pluginName")) {
      this.set("previousPlugin", _cp);
      this.set("_currentPlugin", cp);
    }
  }.observes("currentPlugin"),

  //..........................................
  // Private Methods
  // 

  /** @private */
  _didLoadPlugin: function(request) {
    var name = this._plugins[request].name,
        plugin = SC.objectForPropertyPath(name);
    plugin.set("moduleName", request);
    plugin.set("controller", this);
    this.set(request, plugin);  
    this.set(name, plugin);
    this.get("loadedPlugins").push(name);
    this.get("loadedPlugins").push(request);
    plugin.set("isRegistered", true);
    this.log("Just registered %@ (%@)".fmt(name, request));
    this._invokeHooksFor(name);
  },

  /** @private */
  pluginDidGetFocus: function(plugin) {
  
    console.warn("pluginDidGetFocus => ", plugin);

    this.set("currentPlugin", plugin);
  },

  /** @private */
  _load: function(request, callbacks) {
    if(!this.get("_status") && !(request !== "Login" || request !== "xt/login")) {
      this.error("Cannot load plugins without an active session (%@)".fmt(request));
      return;
    }
    if(!this.isPlugin(request)) this.error("Request for non-plugin `%@`".fmt(request), true);
    request = this._moduleFor(request);

    console.warn("_load: ", request);

    if(this.isLoaded(request)) return this._invokeCallbacks(callbacks, request);

    console.warn("_load: Plugin was not loaded! (%@)".fmt(request));

    var self = this, func;
    func = function() {
      self._didLoadPlugin(request);
      self._invokeCallbacks(callbacks, request); 
    }; 

    console.warn("_load (Plugin): ", request, callbacks, func);

    SC.ready(function() { SC.Module.loadModule(request, func); });
  },

  /** @private */
  _appendPlugin: function(plugin) {
    if(!plugin || !plugin.isPlugin) return NO;
    plugin.append();
  },

  /** @private */
  _moduleFor: function(request) {
    var p = this._plugins;
    return p[request].module;  
  },

  /** @private */
  _invokeHooksFor: function(pluginName) {
    var hooks = this.get("_pluginHooks"),
        jobs;
    console.warn("invoking hooks for %@".fmt(pluginName), hooks);
    jobs = hooks.filter(function(job) { 
      if(job.plugin === pluginName) { 
        console.warn("apprently ", job.plugin, " == ", pluginName); 
        return true; } else { return NO; } });
    if(jobs.length > 0) {
      while(jobs.length > 0) {
        var job = jobs.shift();
        if(SC.typeOf(job.target) === SC.T_STRING) {
          job.target = SC.objectForPropertyPath(job.target);
        }
        job.target.sendEvent(job.hook);
      }
    }
  },

  /** @private */
  _processPlugins: function() {
    var d = this._deferred,
        p = this._prefetched,
        i = this._inlined,
        c = [].concat(d, p, i),
        plugins = {}, modules = {};
    c.filter(function(loadable) {
      if(loadable && loadable.type === "plugin") {
        modules[loadable.module] = loadable;
        plugins[loadable.module] = loadable;
        plugins[loadable.name] = loadable;
        return true;
      }
      return NO;
    });
    this._loadables = modules;
    this._plugins = plugins;
    this.set("availablePlugins", this._plugins);
  },

  /** @private */
  init: function() {
    arguments.callee.base.apply(this, arguments);
    this._info = SC.__LOADABLEINFO__;
    this._deferred = this._info.DEFERRED;
    this._prefetched = this._info.PREFETCHED;
    this._inlined = this._info.INLINED;
    this._loaded = {};
    this._processPlugins();
    this.set("loadedPlugins", []);
  },

  /** @private */
  _invokeCallbacks: function(callbacks, request) {
    if(SC.none(callbacks)) return;
    if(SC.typeOf(callbacks) !== SC.T_ARRAY) {
      if(SC.typeOf(callbacks) === SC.T_FUNCTION) {
        callbacks = [callbacks];
      } else { this.error("Callbacks are supposed to be an array of functions", true); }
    }
    var plugin = this.get(request), i=0;
    for(; i<callbacks.length; ++i) {
      callbacks[i](plugin);
    }
  }

}) ;
