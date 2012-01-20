// ==========================================================================
// Project:   SproutCore Plugin Architecture
// Copyright: ©2012 xTuple. All rights reserved.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================

/* @namespace

  Plugins are loaded on-demand. For more information on Plugins, see the 
  'Creating Loadable Plugins' tutorial and documentation.

  @extends XT.Object
*/
SC.mixin(SC,
  /** @scope SC */ {
    
  NAMESPACE: "Plugin",
  VERSION: "0.1.0",

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
