// ==========================================================================
// Project:   SproutCore Plugin Architecture
// Copyright: ©2012 xTuple. All rights reserved.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================
/*globals BLOSSOM */

sc_require('views/view');
sc_require("ext/common");

if (! BLOSSOM) {

/** @class

  This the the defacto-standard base view for plugins. It is
  assumed that this will be the base-type (or extended from)
  for SC.PluginPages and views to work properly.
  
  @extends SC.View
  @inherits SC.Animatable
*/
SC.PluginView = SC.View.extend( //SC.Animatable,
  /** @scope SC.PluginView.prototype */ {

  //..........................................
  // Public Properties
  //

  layout: { top: 0, left: 0, right: 0, bottom: 0 },

  /** @property
    Adjusts the plugin's content below the top menu of the application.
  */
  topPadding: SC.DEFAULT_TOP_PADDING,

  /** @property
    Adjusts the plugin's content above the bottom bar/menu of the
    application.
  */
  bottomPadding: SC.DEFAULT_BOTTOM_PADDING,

  /** @property */
  isShowing: NO,

  //..........................................
  // Public Methods
  //

  /** @public
    Appends the view to the application making sure
    to animate it properly. Executes an asynchronous task.
  */
  append: function() {
    this._sc_notifyWillAppend();

    // this allows us to bind to the size of the current base pane
    // and its adjustments (window resize) and disconnect this
    // binding when the view is removed
    this._sc_basePaneFrameBinding = SC._baseFrameBinding(this);

    // tell the view to go ahead and make adjustments if
    // necessary now that it has changed
    this._sc_frameNeedsAdjust();

    // for development only so event will fire if issued from
    // the console!
    var self = this;
    SC.run(function() { self.invokeLater(self._sc_append, 10); });

    // real command!
    // this.invokeLater(this._sc_append, 10);
    return this;
  },

  /** @public
    Removes the view from the application making sure
    to animate it properly. Executes an asynchronous task.
  */
  remove: function(direction) {
    var bind = this._sc_basePaneFrameBinding;
    if(bind) bind.disconnect();

    var self = this;

    // for development only so event will fire if issued from
    // the console!
    SC.run(function() { self.invokeLater(self._sc_remove, 10, direction || SC.RIGHT_TO_LEFT); });

    // real command!
    // this.invokeLater(this._sc_remove, 10, direction || SC.RIGHT_TO_LEFT);
    return this;
  },

  /** @public
    @todo This needs serious attention as it is a little tricky but very important!
  */
  xtAnimate: function(e) {
    var anis = this.get("_sc_childAnimationEvents") || {};
    if(anis[e]) anis[e].xtAnimate(e);
    else this.warn("Could not find target childView for event %@".fmt(e));
    return true;
  },

  //..........................................
  // Private Properties
  //

  /** @private */
  _index: null,

  /** @private */
  _plugin: null, 

  /** @private */
  _basePaneFrame: null,

  /** @private */
  // transitions: {
  //   left:   { duration: 0.25, timing: SC.Animatable.TRANSITION_EASE_IN_OUT },
  //   right:  { duration: 0.25, timing: SC.Animatable.TRANSITION_EASE_IN_OUT }
  // },

  /** @private */
  name: "Plugin.View",

  //..........................................
  // Observers
  //

  /** @private */
  _isShowingDidChange: function() {

  }.observes("isShowing"),

  /** @private */
  _sc_frameNeedsAdjust: function() {
    this._sc_adjustWidthToBaseFrame();
    this._sc_adjustHeightToBaseFrame();
  }.observes("*_basePaneFrame.height", "*_basePaneFrame.width"),

  //..........................................
  // Private Methods
  //

  /** @private */
  transitionDidEnd: function() {

    // when the transition ends from being removed, invoke this
    // asynchronous cleanup method
    if(!this.isShowing) this.invokeLater(this._sc_cleanup, 10);
    
    // we know that we are done now with being appended, let everyone
    // now we're in the DOM now
    else this.invokeLater(this._sc_notifyDidAppend, 100);
  },
  
  /** @private */
  _sc_remove: function(direction) {
    var frame = this.getPath("parentView.frame"),
        leftAdjust = this._sc_leftAdjustmentForRemove(direction, frame);
    this.set("isShowing", NO);
    this.adjust("left", leftAdjust); 
  },

  /** @private */
  _sc_append: function() {
    SC.MAIN_PANE.appendChild(this);
    var curr = SC.PluginController.get("_currentPlugin"),
        idx = this.get("_index"),
        paddingTop = this.get("topPadding"),
        paddingBottom = this.get("bottomPadding"),
        frame = this.getPath("parentView.frame"),
        height = (frame.height-(paddingTop+paddingBottom)),
        width = frame.width,
        top = (~~((frame.height/2)-(height/2))),
        leftAdjust, cidx, dir, side;
    if(curr) {
      cidx = curr.get("pluginIndex");
      dir = cidx < idx ? SC.RIGHT_TO_LEFT : SC.LEFT_TO_RIGHT;
    } else { dir = SC.RIGHT_TO_LEFT; }
    leftAdjust = this._sc_leftAdjustmentForAppend(dir, frame);
    this.disableAnimation();
    this.set("layout", { height: height, width: width, top: top, left: leftAdjust });
    this.updateLayout();
    this.set("isShowing", true);
    this.enableAnimation();
    if(curr) curr.remove(dir);
    this.adjust("left", 0);
    SC.PluginController.pluginDidGetFocus(this._plugin);
  },

  /** @private */
  _sc_cleanup: function() {
    this._sc_notifyDidRemove();
    SC.MAIN_PANE.removeChild(this);
  },

  /** @private */
  _sc_leftAdjustmentForRemove: function(direction, frame) {
    if(direction === SC.LEFT_TO_RIGHT) {
      return (frame.width+100);
    } else { return 0-(frame.width+100); }
  },

  /** @private */
  _sc_leftAdjustmentForAppend: function(direction, frame) {
    if(direction === SC.LEFT_TO_RIGHT) {
      return 0-(frame.width+100);
    } else { return (frame.width+100); }
  },

  /** @private */
  init: function() {
    arguments.callee.base.apply(this, arguments);
    this._sc_childAnimationEvents = {};
    this._sc_collectAnimationEvents(this._sc_childAnimationEvents);
  }

});

} // ! BLOSSOM
