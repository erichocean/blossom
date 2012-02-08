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
/*globals SPROUTCORE */

sc_require('views/view');

if (SPROUTCORE) {

/**
  @class

  A ThumbView works in concert with SC.SplitView to adjust the divider
  position from an arbitrary subview of the SplitView. Simply make an
  instance of ThumbView a child somewhere in the childViews (or
  descendants) of the split view and add the path to the ThumbView to the
  SplitView's thumbViews array.

  SplitView will automatically set the splitView property of the views in
  its thumbViews array.

  @extends SC.View
  @author Erich Ocean
  @test in split
*/
SC.ThumbView = SC.View.extend(
/** @scope SC.ThumbView.prototype */ {

  classNames: ['sc-thumb-view'],

  /**
    The current split view this view is embedded in (may be null).
    @property {SC.SplitView}
  */
  splitView: function() {
    var view = this ;
    while (view && !view.isSplitView) view = view.get('parentView') ;
    return view ;
  }.property(),

  /**
    Enable this thumb view to control its parent split view.
  */
  isEnabled: YES,
  isEnabledBindingDefault: SC.Binding.bool(),

  /** @private */
  prepareContext: function(context, firstTime) {
    var splitView = this.get('splitView') ;
    if (splitView) this.set('cursor', splitView.get('thumbViewCursor')) ;
    return arguments.callee.base.apply(this, arguments);
  },

  mouseDown: function(evt) {
    if (!this.get('isEnabled')) return NO ;

    var splitView = this.get('splitView');
    return (splitView) ? splitView.mouseDownInThumbView(evt, this) : arguments.callee.base.apply(this, arguments);
  },

  touchStart: function(evt) {
    return this.mouseDown(evt);
  }

});

} // SPROUTCORE
