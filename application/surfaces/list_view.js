// ==========================================================================
// Project:   Blossom - Modern, Cross-Platform Application Framework
// Copyright: ©2012 Fohr Motion Picture Studios. All rights reserved.
// License:   Licensed under the GPLv3 license (see BLOSSOM-LICENSE).
// ==========================================================================
/*globals sc_assert */

sc_require('surfaces/scroll_view');

/** @class
  `SC.ListView` implements a scrollable view. You can use it 
  interchangeably with `SC.View`, the only difference is the scrolling.

  Setting the bounds of the scroll is important.

  @extends SC.ScrollView
  @since Blossom 1.0
*/
SC.ListView = SC.ScrollView.extend({

  content: null,
  contentBindingDefault: SC.Binding.multiple(),

  // ..........................................................
  // SELECTION SUPPORT
  // 

  selection: null,

  _sc_selection: null,
  _sc_selectionDidChange: function() {
    var old = this._sc_selection,
        cur  = this.get('selection'),
        func = this.triggerRendering;
        
    if (old === cur) return; // nothing to do

    if (old) old.removeObserver('[]', this, func);
    this._sc_selection = cur;
    if (cur) cur.addObserver('[]', this, func);

    this.triggerRendering();
  }.observes('selection'),

  rowHeight: 30,

  renderRow: function(context, width, height, index, object, isSelected) {
    context.fillStyle = isSelected? '#99CCFF' : 'white';
    context.fillRect(0, 0, width, height);
    
    context.strokeStyle = 'grey';
    context.lineWidth = 1;

    context.beginPath();
    context.moveTo(0, height - 0.5);
    context.lineTo(width, height - 0.5);
    context.stroke();

    context.font = "12pt Helvetica";
    context.fillStyle = 'black';
    context.textAlign = 'center';
    context.textBaseline = 'middle';

    context.fillText(String(index), width/2, height/2);
  },

  hasHorizontalScroller: false,
  clearBackground: true,

  updateDisplay: function() {
    // console.log('SC.ListView#updateDisplay()', SC.guidFor(this));
    var benchKey = 'SC.ListView#updateDisplay()';
    SC.Benchmark.start(benchKey);

    var ctx = this._sc_context;
    sc_assert(ctx);
    sc_assert(document.getElementById(ctx.__sc_canvas__.id));

    // Clear the background if requested.
    if (this.get('clearBackground')) ctx.clearRect(0, 0, ctx.w, ctx.h);

    if (this.willRenderLayers) {
      ctx.save();
      this.willRenderLayers(ctx);
      ctx.restore();
    }

    var content = this.get('content'),
        selection = this.get('selection'),
        idx, len, w = ctx.w, h = this.get('rowHeight');
    sc_assert(selection  && selection.contains, "ListView must have a selection and it must respond to `contains()`");

    if (content && (len = content.get('length')) > 0) {
      for (idx=0; idx<len; ++idx) {
        var obj = content.objectAt(idx);
        ctx.save();
        ctx.translate(0, idx*h);
        if (this.renderRow) {
          this.renderRow(ctx, w, h, idx, obj, selection.contains(obj),
            idx===0? true : false,
            idx===(len-1)? true : false);
        }
        ctx.restore();
      }
    }

    if (this.didRenderLayers) {
      ctx.save();
      this.didRenderLayers(ctx);
      ctx.restore();
    }

    SC.Benchmark.end(benchKey);
  },

  mouseDown: function(evt) {
    // console.log('SC.ListView#mouseDown()', SC.guidFor(this));
    var top = evt.target.getBoundingClientRect().top;
    this._scrollTop = top;
    this._scrollTarget = evt.target;
    this._rowIndex = Math.floor((evt.pageY - top) / this.get('rowHeight'));
    evt.allowDefault();
    return true;
  },

  // FIXME: This behavior is only needed on touch devices!
  mouseUp: function(evt) {
    var idx = this._rowIndex,
        content = this._sc_content,
        selection = this._sc_selection,
        scrollTarget = this._scrollTarget;

    this._scrollTarget = null;

    if (Math.abs(this._scrollTop - scrollTarget.getBoundingClientRect().top) > 15) {
      return; // We're scrolling...
    }

    if (content && selection) {
      var obj = content.objectAt(idx);
      if (obj && !selection.contains(obj)) {
        var sel = SC.SelectionSet.create();
        sel.addObject(obj);
        this.set('selection', sel.freeze());

        var action = this.get('action');
        if (action && typeof action === 'function') {
          action.call(this, obj, idx);
        }
        // TODO: Support the usual target/action paradigm.
      }
    }
  },

  adjustLayout: function() {
    // console.log('SC.ListView#adjustLayout()', SC.guidFor(this));
    var benchKey = 'SC.ListView#adjustLayout()';
    SC.Benchmark.start(benchKey);

    var frame = SC.MakeRect(this.get('frame')),
        content = this.get('content'),
        rowHeight = this.get('rowHeight');

    var rows = content? content.get('length') : 0;

    frame[0]/*x*/ = 0;
    frame[1]/*y*/ = 0;
    frame[2]/*w*/ = frame[2]/*w*/ ; // - 15; // account for scroller
    frame[3]/*h*/ = Math.max(rows*rowHeight, frame[3]/*h*/);

    // We never have to offset in this manner.
    var scrollTranslation = this._sc_scrollTranslation;
    scrollTranslation[0]/*x*/ = 0;
    scrollTranslation[1]/*y*/ = 0;

    this._sc_scrollingCanvas.set('frame', frame);

    SC.Benchmark.end(benchKey);
  },

  _sc_content: null,
  _sc_contentPropertyDidChange: function() {
    // console.log('SC.ListView#_sc_contentPropertyDidChange()', SC.guidFor(this));
    var func = this._sc_contentLengthDidChange,
        old = this._sc_content,
        cur = this.get('content');

    if (old === cur) return;

    if (old) {
      this._sc_removeContentRangeObserver();
      old.removeObserver('length', this, func);
    }

    this._sc_content = cur;

    if (cur) {
      cur.addObserver('length', this, func);
      this._sc_updateContentRangeObserver();
    }

    this._sc_contentLengthDidChange();
  }.observes('content'),

  _sc_contentLengthDidChange: function() {
    // console.log('SC.ListView#_sc_contentLengthDidChange()', SC.guidFor(this));
    this._sc_updateContentRangeObserver();
    this.triggerLayoutAndRendering();
  },

  _sc_contentRangeObserver: null,
  _sc_updateContentRangeObserver: function() {
    // console.log('SC.ListView#_sc_updateContentRangeObserver()', SC.guidFor(this));
    var observer = this._sc_contentRangeObserver,
        content  = this.get('content');

    if (!content) return ; // nothing to do

    var nowShowing = SC.IndexSet.create(0, content.get('length'));

    if (observer) {
      content.updateRangeObserver(observer, nowShowing);
    } else {
      var func = this._sc_contentRangeDidChange;
      observer = content.addRangeObserver(nowShowing, this, func, null, true);
      this._sc_contentRangeObserver = observer;
    }
  },

  _sc_contentRangeDidChange: function() {
    // console.log('SC.ListView#_sc_contentRangeDidChange()', SC.guidFor(this));
    this.triggerRendering();
  },

  _sc_removeContentRangeObserver: function() {
    // console.log('SC.ListView#_sc_removeContentRangeObserver()', SC.guidFor(this));
    var content  = this.get('content'),
        observer = this._sc_contentRangeObserver ;

    if (observer) {
      if (content) content.removeRangeObserver(observer);
      this._sc_contentRangeObserver = null ;
    }
  },

  init: function() {
    arguments.callee.base.apply(this, arguments);
    this._sc_contentPropertyDidChange();
    this._sc_selectionDidChange();
  }

});
