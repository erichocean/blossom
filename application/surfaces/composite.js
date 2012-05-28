// ==========================================================================
// Project:   Blossom - Modern, Cross-Platform Application Framework
// Copyright: ©2012 Fohr Motion Picture Studios. All rights reserved.
// License:   Licensed under the GPLv3 license (see BLOSSOM-LICENSE).
// ==========================================================================
/*globals sc_assert */

sc_require('surfaces/surface');

SC.CompositeSurface = SC.Surface.extend(
  /** @scope SC.CompositeSurface.prototype */ {

  isCompositeSurface: true,

  // ..........................................................
  // PSURFACE SUPPORT (Private)
  //

  updatePsurface: function(psurface, surfaces) {
    // console.log('SC.CompositeSurface#updatePsurface()');

    sc_assert(this === SC.surfaces[this.__id__], "SC.Surface#updatePsurface() can only be called on active surfaces.");

    // Sanity check the Psurface.
    sc_assert(psurface);
    sc_assert(psurface instanceof SC.Psurface);
    sc_assert(psurface.__element__);
    sc_assert(psurface.__element__ === document.getElementById(this.__id__));

    var subsurfaces = this.get('subsurfaces'), cur;
    if (subsurfaces && subsurfaces.get('length') > 0) {
      for (var idx=0, len=subsurfaces.length; idx<len; ++idx) {
        var surface = subsurfaces[idx];

        if (surfaces) surfaces[surface.__id__] = surface;

        if (idx === 0) cur = psurface.push(surface);
        else cur = cur.next(surface);

        if (surface.updatePsurface) surface.updatePsurface(cur, surfaces);
      }
      cur.pop();
    }
  },

  // ..........................................................
  // SURFACE TREE SUPPORT
  //

  _sc_compositeIsPresentInViewportDidChange: function() {
    // console.log("SC.Surface#_sc_compositeIsPresentInViewportDidChange()");
    var subsurfaces = this.get('subsurfaces'),
        isPresentInViewport = this.get('isPresentInViewport');

    for (var idx=0, len=subsurfaces.length; idx<len; ++idx) {
      subsurfaces[idx].set('isPresentInViewport', isPresentInViewport);
    }

    if (isPresentInViewport) this.triggerLayoutAndRendering();
  }.observes('isPresentInViewport'),

  // When the subsurfaces property changes, we need to observe it's members
  // for changes.
  _sc_subsurfaces: null,
  _sc_subsurfacesDidChange: function() {
    // console.log("SC.CompositeSurface#_sc_subsurfacesDidChange()");
    var cur  = this.get('subsurfaces'),
        last = this._sc_subsurfaces,
        func = this._sc_subsurfacesMembersDidChange;

    if (last === cur) return this; // nothing to do

    // teardown old observer
    sc_assert(last? last.isEnumerable : true);
    if (last) last.removeObserver('[]', this, func);

    // save new cached values 
    sc_assert(cur && cur.constructor.prototype === Array.prototype);
    this._sc_subsurfaces = cur;

    // setup new observers
    sc_assert(cur? cur.isEnumerable : true);
    if (cur) cur.addObserver('[]', this, func);

    // process the changes
    this._sc_subsurfacesMembersDidChange();
  }.observes('subsurfaces'),

  _sc_subsurfacesMembersDidChange: function() {
    // console.log("SC.Surface#_sc_subsurfacesMembersDidChange()");
    var subsurfaces = this.get('subsurfaces'),
        isPresentInViewport = this.get('isPresentInViewport');

    for (var idx=0, len=subsurfaces.length; idx<len; ++idx) {
      var subsurface = subsurfaces[idx];
      subsurface.set('supersurface', this);
      subsurface.set('isPresentInViewport', isPresentInViewport);
    }

    // Make sure our own updateLayout() method is run, so we can lay out our
    // subsurfaces.
    if (isPresentInViewport) this.triggerLayout();

    SC.surfacesHashNeedsUpdate = true; // causes the surfaces hash to recache
  },

  init: function() {
    arguments.callee.base.apply(this, arguments);

    // We need to observe subsurfaces for changes; set that up now.
    if (!this.subsurfaces) {
      this.subsurfaces = [];
      this._sc_subsurfacesDidChange();

    // Also handle providing surface classes to instantiate.
    } else {
      var subsurfaces = this.subsurfaces,
          ary = [];

      for (var idx=0, len=subsurfaces.length; idx<len; ++idx) {
        var surface = subsurfaces[idx];
        if (surface.isClass) surface = surface.create();
        sc_assert(surface.kindOf(SC.Surface));
        ary.push(surface);
      }

      this.subsurfaces = ary;
      this._sc_subsurfacesDidChange();
    }
  }

});
