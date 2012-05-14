// ==========================================================================
// Project:   Blossom - Modern, Cross-Platform Application Framework
// Copyright: ©2012 Fohr Motion Picture Studios. All rights reserved.
// License:   Licensed under the GPLv3 license (see BLOSSOM-LICENSE).
// ==========================================================================
/*globals sc_assert */

sc_require('surfaces/view');

var base03 =   "#002b36";
var base02 =   "#073642";
var base01 =   "#586e75";
var base00 =   "#657b83";
var base0 =    "#839496";
var base1 =    "#93a1a1";
var base2 =    "#eee8d5";
var base3 =    "#fdf6e3";
var yellow =   "#b58900";
var orange =   "#cb4b16";
var red =      "#dc322f";
var magenta =  "#d33682";
var violet =   "#6c71c4";
var blue =     "#268bd2";
var cyan =     "#2aa198";
var green =    "#859900";
var white =    "white";

/** @class
  `SC.ScrollView` implements a scrollable view. You can use it 
  interchangeably with `SC.View`, the only difference is the scrolling.

  Setting the bounds of the scroll is important.

  @extends SC.CompositeSurface
  @since Blossom 1.0
*/
SC.ScrollView = SC.View.extend({

  __tagName__: 'div',

  __useContentSize__: false,

  isCompositeSurface: true, // Walk like a duck.
  subsurfaces: [],

  /** 
    true if the view should maintain a horizontal scroller.   This property 
    must be set when the view is created.
    
    @property {Boolean}
  */
  hasHorizontalScroller: true,
  
  /** 
    true if the view should maintain a horizontal scroller.   This property 
    must be set when the view is created.
    
    @property {Boolean}
  */
  hasVerticalScroller: true,
  
  // ..........................................................
  // PSURFACE SUPPORT (Private)
  //

  updatePsurface: function(psurface, surfaces) {
    // console.log('SC.ScrollView#updatePsurface()');

    sc_assert(this === SC.surfaces[this.__id__], "SC.Surface#updatePsurface() can only be called on active surfaces.");

    // Sanity check the Psurface.
    sc_assert(psurface);
    sc_assert(psurface instanceof SC.Psurface);
    sc_assert(psurface.__element__);
    sc_assert(psurface.__element__ === document.getElementById(this.__id__));

    var surface = this._sc_scrollingCanvas;
    if (surfaces) surfaces[surface.__id__] = surface;
    psurface.push(surface);
  },

  didCreateElement: function(div) {
    // We don't want SC.View's implementation; don't call it.
    div.style.overflowX = this.get('hasHorizontalScroller')? 'scroll' : 'hidden';
    div.style.overflowY = this.get('hasVerticalScroller')? 'scroll' : 'hidden';

    // FIXME: This should be done dynamically, per scrollview. I'm not doing 
    // it now because the CSS has pseudo-selectors, so I have to generate 
    // stylesheet code specially. (Here and a few other places, actually.)
    //
    // For now, I'll specially customize the CSS to work with Postbooks' UI
    // correctly.
    div.className = 'frame';

    // This should probably only be set on mobile Safari/Google Chrome for 
    // Android.
    //
    // See http://stackoverflow.com/questions/7763458/ios5-webkit-overflow-scrolling-causes-touch-events-stopping-work
    // for a fix I haven't yet implemented, too.
    div.style.webkitOverflowScrolling = 'touch';
  },

  adjustLayout: function() {
    // console.log('SC.ScrollView#adjustLayout()', SC.guidFor(this));
    var benchKey = 'SC.ScrollView#adjustLayout()';
    SC.Benchmark.start(benchKey);

    // Our layers have been been updated.  Calculate the union of the the 
    // AABB of all their frames in our own coordinate system.
    var frame = SC.MakeRect(this.get('frame')),
        extent = SC.MakeRect(frame);

    var layers = this.get('layers'), idx, len, f;
    for (idx=0, len=layers.get('length'); idx<len; ++idx) {
      f = layers[idx].get('frame');
      extent[0]/*x*/ = Math.min(f[0]/*x*/, extent[0]/*x*/);
      extent[1]/*y*/ = Math.min(f[1]/*y*/, extent[1]/*y*/);
      extent[2]/*w*/ = Math.max(f[2]/*w*/, extent[2]/*w*/);
      extent[3]/*h*/ = Math.max(f[3]/*h*/, extent[3]/*h*/);
    }

    // `extent` is now big enough to cover our direct sublayers

    var scrollTranslation = this._sc_scrollTranslation;
    scrollTranslation[0]/*x*/ = -Math.min(extent[0]/*x*/, 0);
    scrollTranslation[1]/*y*/ = -Math.min(extent[1]/*y*/, 0);

    frame[0]/*x*/ = 0;
    frame[1]/*y*/ = 0;
    frame[2]/*w*/ = Math.max(extent[2]/*w*/, frame[2]/*w*/) + scrollTranslation[0]/*x*/;
    frame[3]/*h*/ = Math.max(extent[3]/*h*/, frame[3]/*h*/) + scrollTranslation[1]/*y*/;

    this._sc_scrollingCanvas.set('frame', frame);

    SC.Benchmark.end(benchKey);
  },

  updateLayout: function() {
    arguments.callee.base.apply(this, arguments);

    this.adjustLayout();
  },

  _sc_scrollingCanvas: null,

  init: function() {
    arguments.callee.base.apply(this, arguments);
    var scrollingCanvas;
    scrollingCanvas = this._sc_scrollingCanvas = SC.InternalScrollViewCanvas.create({
      __scrollView__: this
    });

    this._sc_scrollTranslation = SC.MakePoint();
  }

});

/** @private */
SC.InternalScrollViewCanvas = SC.LeafSurface.extend({

  __tagName__: 'canvas',

  __useContentSize__: true, // we need our width and height attributes set

  __scrollView__: null,

  surface: function() {
    // console.log('SC.InternalScrollViewCanvas@surface');
    return this.__scrollView__;
  }.property().cacheable(),

  didCreateElement: function(canvas) {
    // console.log('SC.InternalScrollViewCanvas#didCreateElement()', SC.guidFor(this));
    arguments.callee.base.apply(this, arguments);
    var ctx = canvas.getContext('2d');

    // Enables ctx.width and ctx.height to work.
    ctx.__sc_canvas__ = canvas;

    this.__scrollView__._sc_context = ctx;
    this.__scrollView__.triggerRendering();
  },

  targetResponderForEvent: function(evt) {
    return this.get('surface').targetResponderForEvent(evt);
  }

});
