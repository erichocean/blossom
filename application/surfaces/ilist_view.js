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
  `SC.ListView` implements a scrollable view. You can use it 
  interchangeably with `SC.View`, the only difference is the scrolling.

  Setting the bounds of the scroll is important.

  @extends SC.ScrollView
  @since Blossom 1.0
*/
SC.IListView = SC.View.extend({


  __tagName__: 'div',

  __useContentSize__: false,

  isCompositeSurface: true, // Walk like a duck.
  subsurfaces: function() {
    return [this._sc_scrollingSurface];
  }.property(),

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
    // console.log('SC.IListView#updatePsurface()');

    sc_assert(this === SC.surfaces[this.__id__], "SC.Surface#updatePsurface() can only be called on active surfaces.");

    // Sanity check the Psurface.
    sc_assert(psurface);
    sc_assert(psurface instanceof SC.Psurface);
    sc_assert(psurface.__element__);
    sc_assert(psurface.__element__ === document.getElementById(this.__id__));

    var surface = this._sc_scrollingSurface;
    if (surfaces) surfaces[surface.__id__] = surface;
    var cur = psurface.push(surface);
    surface.updatePsurface(cur, surfaces);
    cur.pop();
  },

  updateLayout: function() {
    // console.log('SC.IListView#updateLayout()');
    arguments.callee.base.apply(this, arguments);

    this.adjustLayout();
  },

  content: null,
  contentBindingDefault: SC.Binding.multiple(),

  _sc_hasScrollListener: false,
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

    // We have to establish this stuff every time we set up our DOM.
    SC.Event.add(div, 'scroll', this, this._sc_didScroll);
    this._sc_hasScrollListener = true;
    this._sc_scrollTopPrev = 0;
    this._sc_didNotRender = true;
    this._sc_scrollDelay = 0;
  },

  _sc_scrollTopPrev: 0,
  _sc_didNotRender: true,
  _sc_scrollDelay: 0,
  _sc_rowIndex: 0,
  _sc_rowLength: 0,

  _sc_didScroll: function(evt) {
    // console.log('did scroll');
    var now = new Date().getTime(),
        delay = this._sc_scrollDelay,
        height = this.get('rowHeight'),
        canvas = this._sc_context.__sc_canvas__,
        didNotDraw = true,
        rect, top, prev,
        div = SC.psurfaces[this.__id__].__element__;

    rect = SC.psurfaces[this._sc_scrollingSurface.__id__].__element__.getBoundingClientRect();
    top = -rect.top;
    prev = this._sc_scrollTopPrev;

    if (this._sc_hasScrollListener) {
      SC.Event.remove(div, 'scroll', this, this._sc_didScroll);
      this._sc_hasScrollListener = false;
    }

    if (Math.abs(top - prev) < rect.height*0.10) {
      if (now - delay > 150) {
        // console.log('drawing');
        didNotDraw = false;
        // var canvasTop = Math.min(Math.floor((top/(height*3)))*(height*3), 300000);
        var scrollframeHeight = this.get('frame').height,
            listHeight = this._sc_scrollingSurface.get('frame').height,
            canvasHeight = this._sc_scrollingSurface._sc_scrollingCanvas.get('frame').height,
            offset = rect.top - div.getBoundingClientRect().top,
            rowHeight = this.get('rowHeight');


        // 1.
        var x = -offset + (scrollframeHeight/2) - (canvasHeight/2);

        // 2.
        var y = x - (x % rowHeight);

        // 3.
        var z = Math.min(y, listHeight - canvasHeight);

        // 4.
        offset = z < 0 ? 0 : z;
        // console.log(x, y, z, offset);

        // sc_assert(offset % rowHeight === 0);
        // sc_assert(offset >= 0 && offset <= listHeight - canvasHeight);

        canvas.style.top = offset + 'px';
        this.triggerRendering();
        this._sc_rowIndex = offset/rowHeight;
      }
    } else {
      delay = new Date().getTime();
    }

    if (didNotDraw || top !== prev) {
      // SC.requestAnimationFrame = true;
      var that = this;
      SC.RequestAnimationFrame(function() {
        SC.RunLoop.begin();
        that._sc_didScroll();
        SC.RunLoop.end();
      });
      this._sc_scrollTopPrev = top;
    } else {
      SC.Event.add(div, 'scroll', this, this._sc_didScroll);
      this._sc_hasScrollListener = true;
    }
  },

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

  renderRow: function(context, width, height, index, object, isSelected, isLast) {
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

  _sc_plistItems: null,

  updateDisplay: function() {
    // console.log('SC.IListView#updateDisplay()', SC.guidFor(this));
    var benchKey = 'SC.IListView#updateDisplay()';
    SC.Benchmark.start(benchKey);

    var ctx = this._sc_context;
    sc_assert(ctx);
    sc_assert(document.getElementById(ctx.__sc_canvas__.id));

    // FIXME: Clear the background if requested. We don't really want to do this.
    // if (this.get('clearBackground')) ctx.clearRect(0, 0, ctx.w, ctx.h);
    // 
    // if (this.willRenderLayers) {
    //   ctx.save();
    //   this.willRenderLayers(ctx);
    //   ctx.restore();
    // }

    var content = this.get('content'),
        selection = this.get('selection'),
        rowIndex = this._sc_rowIndex,
        len = this._sc_rowLength,
        w = ctx.w, h = this.get('rowHeight'),
        plistItems = this._sc_plistItems,
        newPlistItems = {};

    // If we have fewer rows (no scrolling), don't try and render too much.
    len = Math.min(len, (content? content.get('length') : 0) - rowIndex);
    // console.log(idx, len);

    var changedStoreKeys = SC.changedStoreKeys;
    var needsRendering = false;

    // Create this here so we don't have to make so many.
    var processLayer = function(layer) {
      if (layer.__needsRendering__) needsRendering = true;
      else layer.get('sublayers').forEach(processLayer);
    };

    if (content && len > 0) {
 
      for (var idx = 0; idx<len; ++idx) {
        var obj = content.objectAt(idx + rowIndex),
            storeKey = obj.storeKey;

        sc_assert(storeKey);
        var plistItem = plistItems[storeKey];
        if (plistItem) {
          delete plistItems[storeKey]; // We've processed it.
          newPlistItems[storeKey] = plistItem;

          // We need to update this plist item and determine if it should be 
          // re-rendered.  First we check the properties dependent on the 
          // list view itself.
          if (plistItem.index !== idx + rowIndex) {
            plistItem.index = idx + rowIndex;
            needsRendering = true;
          }

          if (plistItem.offset !== idx*h) {
            plistItem.offset = idx*h;
            needsRendering = true;
          }

          var isSelected = selection.contains(obj);
          if (plistItem.isSelected !== isSelected) {
            plistItem.isSelected = isSelected;
            needsRendering = true;
          }

          var isLast = (idx + rowIndex) === len - 1;
          if (plistItem.isLast !== isLast) {
            plistItem.isLast = isSelected;
            needsRendering = true;
          }

          // Next we check the storeKeys for changes *if*
          if (!needsRendering && !plistItem.needsRendering) {
            if (changedStoreKeys[storeKey]) needsRendering = true;

            // Okay, check our dependent keys.
            if (!needsRendering) {
              var dependentKeys = plistItem.dependentKeys;
              if (dependentKeys) {
                for (var dependentKey in dependentKey) {
                  if (!dependentKeys.hasOwnProperty(dependentKey)) continue;
                  if (changedStoreKeys[dependentKey]) {
                    needsRendering = true;
                    break;
                  }
                }
              }
            }
          }

          // Check the layer tree, if it exists
          if (!needsRendering) {
            var layerTree = plistItem.editableLayerTree;
            if (!layerTree) layerTree = plistItem.mouseLayerTree;
            if (!layerTree) layerTree = plistItem.renderLayerTree;

            if (layerTree) {
              if (layerTree.__needsRendering__) needsRendering = true;
              else layerTree.get('sublayers').forEach(processLayer);
            }
          }

          if (needsRendering) plistItem.needsRendering = true;

        // Create a new plistItem
        } else {
          plistItem = newPlistItems[storeKey] = new SC.PListItem(idx + rowIndex, obj, idx*h);
          plistItem.isSelected = selection.contains(obj);
          plistItem.isLast = (idx + rowIndex) === len - 1;
          // item is already marked as needing rendering on init
        }
      }
    }

    // Handle plist items that are no longer with us.
    var isInputSurface = SC.app.get('inputSurface') === this;
    for (var oldStoreKey in plistItems) {
      if (!plistItems.hasOwnProperty(oldStoreKey)) continue;
      plistItem = plistItems[oldStoreKey];

      var editableLayerTree = plistItem.editableLayerTree;
      if (editableLayerTree && isInputSurface) SC.CloseFieldEditor();

      // Release stuff.
      delete plistItem.object;
      delete plistItem.renderLayerTree;
      delete plistItem.mouseLayerTree;
      delete plistItem.editableLayerTree;
    }

    // Keep for next round.
    this._sc_plistItems = newPlistItems;

    var clearBackground = this.get('clearBackground'),
        backgroundColor = this.get('backgroundColor');

    // Draw plist items as needed.
    for (storeKey in newPlistItems) {
      if (!newPlistItems.hasOwnProperty(storeKey)) continue;
      plistItem = newPlistItems[storeKey];
      if (plistItem.needsRendering) {
        plistItem.needsRendering = false;
        ctx.save();
        ctx.translate(0, plistItem.offset);

        // We render the most complicated option.
        layerTree = plistItem.editableLayerTree;
        if (!layerTree) layerTree = plistItem.mouseLayerTree;
        if (!layerTree) layerTree = plistItem.renderLayerTree;

        var renderFunction = plistItem.renderFunction;
        if (!layerTree && !renderFunction) {
          // We need to find or create the correct one.
          if (this.createRenderLayerTree) {
            // console.log('creating render tree');
            layerTree = plistItem.renderLayerTree = this.createRenderLayerTree();

            if (layerTree) {
              // sc_assert(layerTree);
              // sc_assert(layerTree.kindOf(SC.Layer));

              layerTree.__forceWidthHeight__ = true;
              layerTree.set('width', w);
              layerTree.set('height', h);
              layerTree.__needsLayout__ = true;
            }
          } else {
            // FIXME: Seems like this could be done better...
            if (this.renderRow) {
              renderFunction = plistItem.renderFunction = this.renderRow;
            }
          }
        }

        // Render with either the layer tree or the render function.
        if (layerTree) {
          // Set the properties for the layer tree.
          layerTree.set('rowIndex', plistItem.index);
          layerTree.set('content', plistItem.object);
          layerTree.set('isSelected', plistItem.isSelected);
          layerTree.set('isLast', plistItem.isLast);

          if (layerTree.__needsLayout__) {
            // Update the layout.
            var textLayersNeedingLayout = [];
            layerTree.updateLayout(textLayersNeedingLayout);

            // Update any text layouts.
            for (idx=0, len=textLayersNeedingLayout.length; idx<len; ++idx) {
              textLayersNeedingLayout[idx].updateTextLayout(ctx);
            }
          }

          if (clearBackground) ctx.clearRect(0, 0, w, h);
          else {
            // We need to draw the background color, even though it is also 
            // applied with CSS, in order to get correct anti-aliasing.
            ctx.fillStyle = backgroundColor;
            ctx.fillRect(0, 0, w, h);
          }

          layerTree.renderIntoContext(ctx);

        } else if (renderFunction) {
          if (clearBackground) ctx.clearRect(0, 0, w, h);
          else {
            // We need to draw the background color, even though it is also 
            // applied with CSS, in order to get correct anti-aliasing.
            ctx.fillStyle = backgroundColor;
            ctx.fillRect(0, 0, w, h);
          }

          renderFunction(ctx, w, h, plistItem.index, plistItem.object, plistItem.isSelected, plistItem.isLast);
        }

        ctx.restore();
      }
    }

    // if (this.didRenderLayers) {
    //   ctx.save();
    //   this.didRenderLayers(ctx);
    //   ctx.restore();
    // }

    SC.Benchmark.end(benchKey);
  },

  /**
    Finds the layer that is hit by this event, and returns its behavior if it 
    exists.  Otherwise, returns the receiver.
  */
  targetResponderForEvent: function(evt) {
    // console.log('ListDemo.LayerListView#targetResponderForEvent(', evt.type, ')');
    var context = this._sc_hitTestCanvas.getContext('2d'),
        hitLayer = null, zIndex = -1,
        boundingRect, x, y;

    if (evt.pageX === undefined) return this;

    // debugger;
    boundingRect = evt.target.getBoundingClientRect();
    x = evt.clientX - boundingRect.left + window.pageXOffset;
    y = evt.clientY - boundingRect.top + window.pageYOffset;
    // console.log('*****', evt.type, x, y, '*****');

    // FIXME: calculate the correct rowIndex!
    var rowIndex = Math.floor((evt.pageY - boundingRect.top) / this.get('rowHeight')) + this._sc_rowIndex;
    sc_assert(!isNaN(rowIndex));
    // console.log('rowIndex', rowIndex); 

    function spaces(depth) {
      console.log(depth);
      var ret = "", idx, len;
      for (idx = 0, len = depth; idx<len; ++idx) ret += "--";
      return ret;
    }

    function hitTestLayer(layer, point, depth) {
      // debugger;
      // console.log(spaces(depth), "on entry:", point.x, point.y);
      if (layer.get('isHidden')) return;
      context.save();

      // Prevent this layer and any sublayer from drawing paths outside our
      // bounds.
      layer.renderBoundsPath(context);
      context.clip();

      // Make sure the layer's transform is current.
      if (layer._sc_transformFromSuperlayerToLayerIsDirty) {
        layer._sc_computeTransformFromSuperlayerToLayer();
      }

      // Apply the sublayer's transform from our layer (it's superlayer).
      var t = layer._sc_transformFromSuperlayerToLayer;
      context.transform(t[0], t[1], t[2], t[3], t[4], t[5]);
      SC.PointApplyAffineTransformTo(point, t, point);
      var frame = layer.get('frame');
      // console.log(spaces(depth), 'frame:', frame.x, frame.y, frame.width, frame.height);
      // console.log(spaces(depth), 'transformed:', point.x, point.y);

      // First, test our sublayers.
      var sublayers = layer.get('sublayers'), idx = sublayers.length;
      depth++;
      while (idx--) {
        hitTestLayer(sublayers[idx], SC.MakePoint(point), depth);
      }

      // Only test ourself if (a) no hit has been found, or (b) our zIndex is
      // higher than whatever hit has been found so far.
      var layerZ = layer.get('zIndex');
      if (!hitLayer || zIndex < layerZ) {
        if (layer.hitsPointInContext(x, y, context)) {
          evt.hitPoint = SC.MakePoint(x - point[0]/*x*/, y - point[1]/*y*/);
          hitLayer = layer;
          zIndex = layerZ;
        }
      }

      context.restore();
    }

    // Next, begin the hit testing process. When this completes, hitLayer
    // will contain the layer that was hit with the highest zIndex.
    var plistItems = this._sc_plistItems,
        rowHeight = this.get('rowHeight'),
        mouseY = evt.pageY - boundingRect.top,
        layerTree, offset;

    for (var storeKey in plistItems) {
      if (!plistItems.hasOwnProperty(storeKey)) continue;
      var plistItem = plistItems[storeKey];
      offset = plistItem.offset; // this is relative to the canvas
      if (offset < mouseY && mouseY < (offset + rowHeight)) {
        layerTree = plistItem.editableLayerTree;
        if (!layerTree) layerTree = plistItem.mouseLayerTree;
        if (!layerTree) layerTree = plistItem.renderLayerTree;
        if (!layerTree) {
          return this; // row is using a render function
        }
        break;
      }
    }

    if (!layerTree) return this;

    context.save();
    context.translate(0, (rowIndex - this._sc_rowIndex)*this.get('rowHeight'));
    hitTestLayer(layerTree, SC.MakePoint(), 0);
    context.restore();

    // We don't need to test `layer`, because we already know it was hit when
    // this method is called by SC.RootResponder.
    if (!hitLayer) return this;
    else {
      // this.triggerRendering();
      // if (evt.type === 'mousedown') console.log('rowIndex', rowIndex);

      // If we hit a layer, remember it so our view knows.
      evt.layer = hitLayer;

      evt.hitPoint.y = evt.hitPoint.y - offset;

      hitLayer.set('surface', this._sc_scrollingSurface._sc_scrollingCanvas);
      var content = this.get('content');
      hitLayer.set('content', content.objectAt(rowIndex));
      // if (evt.type === 'mousedown') console.log('content.objectAt(rowIndex).get(\'index\')', content.objectAt(rowIndex).get('index'));

      // Try and find the behavior attached to this layer.
      var behavior = hitLayer.get('behavior');
      while (!behavior && hitLayer) {
        hitLayer = hitLayer.get('superlayer');
        if (hitLayer) behavior = hitLayer.get('behavior');
      }
      return behavior || this;
    }
  },

  mouseDown: function(evt) {
    // console.log('SC.ListView#mouseDown()', SC.guidFor(this));
    var top = evt.target.getBoundingClientRect().top;
    this._scrollTop = top;
    this._scrollTarget = evt.target;
    this._rowIndex = Math.floor((evt.pageY - top) / this.get('rowHeight')) + this._sc_rowIndex;
    console.log('this._rowIndex', this._rowIndex);
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

  // performLayoutIfNeeded: function(timestamp) {
  //   console.log('SC.IListView#performLayoutIfNeeded()', SC.guidFor(this));
  //   arguments.callee.base.apply(this, arguments);
  // },
  
  performRenderingIfNeeded: function(timestamp) {
    // console.log('SC.IListView#performRenderingIfNeeded()', SC.guidFor(this));
    this.__needsRendering__ = true; // We do all our work in updateDisplay()
    arguments.callee.base.apply(this, arguments);
  },
  
  adjustLayout: function() {
    // console.log('SC.IListView#adjustLayout()', SC.guidFor(this));
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

    this._sc_scrollingSurface.set('frame', frame);
    this._sc_scrollingSurface.__needsLayout__ = true;

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

  _sc_scrollingSurface: null,

  _sc_compositeIsPresentInViewportDidChange: function() {
    // console.log("SC.IListViewSurface#_sc_compositeIsPresentInViewportDidChange()");
    var isPresentInViewport = this.get('isPresentInViewport');
    this._sc_scrollingSurface.set('isPresentInViewport', isPresentInViewport);
  }.observes('isPresentInViewport'),

  init: function() {
    arguments.callee.base.apply(this, arguments);
    var scrollingSurface;
    scrollingSurface = this._sc_scrollingSurface = SC.InternalListViewSurface.create({
      supersurface: this,
      __scrollView__: this
    });

    this._sc_scrollTranslation = SC.MakePoint();
    this._sc_contentPropertyDidChange();
    this._sc_selectionDidChange();
    this._sc_plistItems = {};
  },

  rowOffsetForLayerTree: function(layerTree) {
    console.log("SC.IListViewSurface#rowOffsetForLayerTree()");
    var plistItems = this._sc_plistItems;
    for (var storeKey in plistItems) {
      if (!plistItems.hasOwnProperty(storeKey)) continue;
      var plistItem = plistItems[storeKey];
      var plistLayerTree = plistItem.editableLayerTree;
      if (!plistLayerTree) plistLayerTree = plistItem.mouseLayerTree;
      if (!plistLayerTree) plistLayerTree = plistItem.renderLayerTree;

      if (plistLayerTree === layerTree) {
        return plistItem.offset + parseInt(this._sc_context.__sc_canvas__.style.top.slice(0,-2), 10);
      }
    }
    debugger;
    console.log('Could not find row offset for layer tree. This is a bug.');
    return 0; // Don't know!
  }

});

/** @private */
SC.InternalListViewSurface = SC.LeafSurface.extend({

  __tagName__: 'div',

  isLeafSurface: false,
  isCompositeSurface: true, // Walk like a duck.
  subsurfaces: function() {
    return [this._sc_scrollingCanvas];
  }.property(),

  rowOffsetForLayerTree: function(layerTree) {
    return this.__scrollView__.rowOffsetForLayerTree(layerTree);
  },

  // ..........................................................
  // SURFACE TREE SUPPORT
  //

  _sc_compositeIsPresentInViewportDidChange: function() {
    // console.log("SC.InternalListViewSurface#_sc_compositeIsPresentInViewportDidChange()");
    var isPresentInViewport = this.get('isPresentInViewport');
    this._sc_scrollingCanvas.set('isPresentInViewport', isPresentInViewport);
  }.observes('isPresentInViewport'),

  __scrollView__: null,

  surface: function() {
    // console.log('SC.InternalListViewSurface@surface');
    return this.__scrollView__;
  }.property().cacheable(),

  didCreateElement: function(div) {
    // console.log('SC.InternalListViewSurface#didCreateElement()', SC.guidFor(this));
    arguments.callee.base.apply(this, arguments);
    div.style.overflow = 'hidden';
  },

  targetResponderForEvent: function(evt) {
    return this.get('surface').targetResponderForEvent(evt);
  },

  // performLayoutIfNeeded: function(timestamp) {
  //   console.log('SC.InternalListViewSurface#performLayoutIfNeeded()', SC.guidFor(this));
  //   arguments.callee.base.apply(this, arguments);
  //   // this._sc_scrollingCanvas.performLayoutIfNeeded(timestamp);
  // },
  
  // ..........................................................
  // PSURFACE SUPPORT (Private)
  //

  updatePsurface: function(psurface, surfaces) {
    // console.log('SC.InternalListViewSurface#updatePsurface()');

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

  updateLayout: function() {
    // console.log('SC.InternalListViewSurface#updateLayout()', SC.guidFor(this));
    arguments.callee.base.apply(this, arguments);

    this.adjustLayout();
  },

  _sc_scrollingCanvas: null,

  init: function() {
    arguments.callee.base.apply(this, arguments);
    var scrollingCanvas;
    scrollingCanvas = this._sc_scrollingCanvas = SC.InternalListViewCanvas.create({
      supersurface: this,
      __scrollSurface__: this
    });
  },

  adjustLayout: function() {
    // console.log('SC.InternalListViewSurface#adjustLayout()', SC.guidFor(this));
    var frame = SC.MakeRect(this.__scrollView__.get('frame')),
        myFrame = SC.MakeRect(this.get('frame')),
        rowHeight = this.__scrollView__.get('rowHeight');

    frame[3] = frame[3] * 2;

    // We need to be even with the rowHeight
    frame[3] = frame[3] + (rowHeight - (frame[3] % rowHeight));

    // Record how many rows we can render.
    this.__scrollView__._sc_rowLength = frame[3] / rowHeight;

    frame.x = myFrame.x;
    frame.y = myFrame.y;
    this._sc_scrollingCanvas.set('frame', frame);
  }

});

/** @private */
SC.InternalListViewCanvas = SC.LeafSurface.extend({

  __tagName__: 'canvas',

  __useContentSize__: true, // we need our width and height attributes set
  __neverAnimate__: true,

  __scrollSurface__: null,

  surface: function() {
    // console.log('SC.InternalListViewCanvas@surface');
    return this.__scrollSurface__;
  }.property().cacheable(),

  didCreateElement: function(canvas) {
    // console.log('SC.InternalListViewCanvas#didCreateElement()', SC.guidFor(this));
    arguments.callee.base.apply(this, arguments);
    var ctx = canvas.getContext('2d');

    // Enables ctx.width and ctx.height to work.
    ctx.__sc_canvas__ = canvas;

    this.__scrollSurface__.__scrollView__._sc_context = ctx;
    this.__scrollSurface__.__scrollView__.triggerRendering();
  },

  rowOffsetForLayerTree: function(layerTree) {
    return this.__scrollSurface__.rowOffsetForLayerTree(layerTree);
  },

  // performLayoutIfNeeded: function(timestamp) {
  //   console.log('SC.InternalListViewCanvas#performLayoutIfNeeded()', SC.guidFor(this));
  //   arguments.callee.base.apply(this, arguments);
  // },
  
  // updateLayout: function() {
  //   console.log('SC.InternalListViewCanvas#updateLayout()', SC.guidFor(this));
  // },

  targetResponderForEvent: function(evt) {
    return this.get('surface').targetResponderForEvent(evt);
  }

});

// Constructor
SC.PListItem = function(index, object, offset) {
  // Set all properties for speed with hidden classes.
  this.index = index;
  this.object = object;
  this.storeKey = object.storeKey;
  this.offset = offset;
  this.isSelected = false;
  this.isLast = false;
  this.needsRendering = true;
  this.dependentStoreKeys = null;

  // A PListItem can only have one render function or layer tree, not both.
  this.renderFunction = null;    // Shared with other PListItems
  this.renderLayerTree = null;        // Shared with other PListItems

  // A PListItem can only have mouse or editable, not both.
  this.mouseLayerTree = null;    // Exclusive to this PListItem
  this.editableLayerTree = null; // Exclusive to this PListItem

  return this;
};
