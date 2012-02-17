// ==========================================================================
// Project:   SproutCore Plugin Architecture
// Copyright: ©2012 xTuple. All rights reserved.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================

sc_require("ext/common");
sc_require("pages/plugin_page");

/** @class

  Plugins are loaded on-demand. For more information on Plugins, see the 
  'Creating Loadable Plugins' tutorial and documentation.

  Each plugin must have a core.js file that houses an
  object that is an instance of this object.

*/
SC.Plugin = SC.Object.extend(
  /** @scope SC.Plugin.prototype */ {
  
  //..........................................
  // Public Properties
  //


  /** @property
    Walk like a duck?
  */
  isPlugin: true,

  /** @property
    The default view to be shown when the plugin is loaded
    and focused (shown) in the application.

    @type {String}
  */
  defaultView: 'defaultView',

  /** @property
    Each plugin needs a valid and unique index (integer). This
    will indicate to the Plugin.Controller the ordering of the
    plugins so as to animate their entry and exit dynamically
    but correctly depending on the plugin that is removing/being-
    removed and appended.

    @type {Numeric}
  */
  pluginIndex: null,

  /** @property
    Critical value to allow internal representation of the
    plugin. Must be unique.

    @type {String}
  */
  pluginName: 'defaultName',

  /** @property
    The page that houses the default content for the plugin.
    Additional pages can be added/used internally but this
    is a required page/content for the plugin to work
    successfully out of the box.

    @type {SC.Plugin.Page | String}
  */
  page: SC.PluginPage,

  /** @property
    If the plugin has been loaded and the global plugin
    controller knows about it, this property will return
    true, otherwise false.

    @type {Boolean}
  */
  isRegistered: NO,

  //..........................................
  // Bindings
  //

  /** @public */
  isShowingBinding: SC.Binding.from("baseView.isShowing").oneWay(),

  //..........................................
  // Calculated Properties
  //

  /** @property */
  baseView: function() {
    var p = this.get("page"),
        d = this.get("defaultView"), v;
    if(SC.typeOf(p) === SC.T_STRING) p = this.get(p);
    v = p.get(d);
    if(!v) this.error("No default view found in plugin %@".fmt(this.get("pluginName")), true);
    return v;
  }.property("page", "defaultView").cacheable(),
  
  //.......................................... 
  // Public Methods
  //

  /** @public
    Is executed once the plugin has been loaded and processed
    by Sproutcore. This is an automated callback and can be
    used to ensure items that are waiting for it have the
    opportunity to respond.
  */
  didLoad: function() {},

  /** @public
    This method will remove any current plugin that has been
    shown and set this plugin's content as the currently
    visible content in the application.

    Also note, this is the equivalent to calling this object's
    `append` method.

    @see append
  */
  focus: function() {
    this.get("baseView").append();
    return this;
  },

  /** @public
    @see focus
  */
  append: null,

  /** @public
    Applies any XBO patches that are stored with the plugin.
  */
  applyXboPatches: function() {},

  /** @public
    Removes this plugin's content (if shown) in the direction
    provided.
  */
  remove: function(direction) {
    this.get("baseView").remove(direction);
    return this;
  },

  /** @public
    Passes an animation event to the default view
    of the plugin to be handled.
  */
  xtAnimate: function(e) { return this.get("baseView").xtAnimate(e); },

  //.......................................... 
  // Observers
  //

  /** @private */
  _isRegisteredDidChange: function() {
    var ir = this.get("isRegistered");
    if(ir) {
      if(this.didLoad && SC.typeOf(this.didLoad) === SC.T_FUNCTION)
        this.didLoad();
      var v = this.get("baseView"),
          c = this.get("controller");
      v.set("controller", c);
    }
  }.observes("isRegistered"),

  //..........................................
  // Private Properties
  //

  /** @private */
  _xbos: null,

  /** @private */
  name: "SC.Plugin",

  //..........................................
  // Private Methods
  //

  /** @private */
  init: function() {
    this.append = this.focus;
    this.setPath("baseView._plugin", this);
    this.setPath("baseView._index", this.get("pluginIndex"));
    return arguments.callee.base.apply(this, arguments);
  }

}) ;
