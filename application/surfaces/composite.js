// ==========================================================================
// Project:   Blossom - Modern, Cross-Platform Application Framework
// Copyright: ©2012 Fohr Motion Picture Studios. All rights reserved.
// License:   Licensed under the GPLv3 license (see BLOSSOM-LICENSE).
// ==========================================================================
/*globals BLOSSOM sc_assert */

sc_require('surfaces/surface');

if (BLOSSOM) {

SC.CompositeSurface = SC.Surface.extend(
  /** @scope SC.CompositeSurface.prototype */ {

  isCompositeSurface: true,

  // ..........................................................
  // LAYOUT & RENDERING SUPPORT
  //

  performLayoutAndRenderingIfNeeded: function(timestamp) {
    // console.log('SC.CompositeSurface#performLayoutAndRenderingIfNeeded()');
    var needsLayout = this.__needsLayout__,
        needsDisplay = this.__needsRendering__,
        isVisible = this.get('isVisible'),
        subsurfaces = this.get('subsurfaces');

    var benchKey = 'SC.CompositeSurface#performLayoutAndRenderingIfNeeded()',
        layoutKey = 'SC.CompositeSurface#performLayoutAndRenderingIfNeeded(): needsLayout',
        displayKey = 'SC.CompositeSurface#performLayoutAndRenderingIfNeeded(): needsDisplay';

    SC.Benchmark.start(benchKey);

    if (needsLayout && isVisible) {
      SC.Benchmark.start(layoutKey);
      if (this.get('isPresentInViewport')) {
        if (this.updateLayout) this.updateLayout();
        this.__needsLayout__ = false;
      } // else leave it set to true, we'll update it when it again becomes 
        // visible in the viewport
      SC.Benchmark.end(layoutKey);
    }

    if (needsDisplay && isVisible) {
      SC.Benchmark.start(displayKey);
      if (this.get('isPresentInViewport')) {
        if (this.updateDisplay) this.updateDisplay();
        this.__needsRendering__ = false;
      } // else leave it set to true, we'll update it when it again becomes 
        // visible in the viewport
      SC.Benchmark.end(displayKey);
    }

    SC.Benchmark.end(benchKey);

    for (var idx=0, len=subsurfaces.length; idx<len; ++idx) {
      subsurfaces[idx].performLayoutAndRenderingIfNeeded(timestamp);
    }
  },

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
    var subsurfaces = this.get('subsurfaces');

    for (var idx=0, len=subsurfaces.length; idx<len; ++idx) {
      subsurfaces[idx].set('supersurface', this);
    }

    SC.surfacesHashNeedsUpdate = true; // causes the surfaces hash to recache
  },

  init: function() {
    arguments.callee.base.apply(this, arguments);
    this.set('subsurfaces', []);
  }

});

} // BLOSSOM
