// ==========================================================================
// Project:   Blossom - Modern, Cross-Platform Application Framework
// Copyright: ©2012 Fohr Motion Picture Studios. All rights reserved.
// License:   Licensed under the GPLv3 license (see BLOSSOM-LICENSE).
// ==========================================================================
/*globals sc_assert */

sc_require('surfaces/layout');
sc_require('surfaces/ilist_view');
sc_require('layers/label');

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
var black =    "black";

SC.TableView = SC.LayoutSurface.extend({

  columns: [],

  // Proxies for SC.IListView

  hasHorizontalScroller: false,
  hasVerticalScroller: true,

  content: null,
  contentBindingDefault: SC.Binding.multiple(),

  selection: null,
  rowHeight: 30,

  init: function() {
    arguments.callee.base.apply(this, arguments);
    var columns = this.get('columns');

    var header = SC.View.create({
      layout: { top: 0, left: 0, right: 0, height: 24 }
    });

    var accumulatedWidth = 0,
        layers = header.get('layers');

    columns.forEach(function(column) {
      sc_assert(column.kindOf(SC.TableColumn));

      var widget = SC.TableHeaderWidget.create({
        layout: { top: 0, left: accumulatedWidth, width: column.get('width'), bottom: 0 },
        column: column
      });

      layers.pushObject(widget);
      accumulatedWidth += column.get('width');
    }, this);

    this.get('subsurfaces').pushObject(header);

    var table = SC.TableIListView.create({
      columns: columns,

      contentBinding: SC.Binding.from('content', this).noDelay(),
      selectionBinding: SC.Binding.from('selection', this).noDelay(),

      hasHorizontalScrollerBinding: SC.Binding.from('hasHorizontalScroller', this).noDelay(),
      hasVerticalScrollerBinding: SC.Binding.from('hasVerticalScroller', this).noDelay(),

      rowHeightBinding: SC.Binding.from('rowHeight', this).noDelay(),

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
      }
    });
    table.set('backgroundColor', 'grey');

    this.get('subsurfaces').pushObject(table);
  }

});

SC.TableIListView = SC.IListView.extend({
  layout: { bottom: 0, left: 0, right: 0, top: 24 },

  columns: null,

  // createRenderLayerTree: function() {
  //   // console.log('creating render tree');
  //   // return SC.Layer.create({
  //   //   render: function(ctx) {
  //   //     var benchKey = 'render';
  //   //     SC.Benchmark.start(benchKey);
  //   //     var bounds = this.get('bounds'),
  //   //         content = this.get('content'),
  //   //         title = content.get('name');
  //   // 
  //   //     ctx.fillStyle = 'grey';
  //   //     ctx.fillRect(0,0,bounds.w,bounds.h);
  //   // 
  //   //     // Draw the text.
  //   //     ctx.textBaseline = 'middle';
  //   //     ctx.font = '12pt Helvetica';
  //   //     ctx.fillStyle = 'white';
  //   //     ctx.fillText(title, 4, 3);
  //   //     SC.Benchmark.end(benchKey);
  //   //   }
  //   // });
  //   var benchKey = 'SC.TableIListView#createRenderLayerTree()';
  //   SC.Benchmark.start(benchKey);
  //   var root = SC.Layer.create(),
  //       layers = root.get('sublayers');
  // 
  // 
  //   var columns = this.get('columns'),
  //       accumulatedWidth = 0;
  // 
  //   columns.forEach(function(column) {
  //     sc_assert(column.kindOf(SC.TableColumn));
  // 
  //     var label = SC.TableViewCell.create({
  //       layout: { top: 1, left: accumulatedWidth, width: column.get('width')-1, bottom: 0 },
  // 
  //       valueBinding: SC.Binding.from('*content.'+column.get('key')).noDelay()
  //     });
  // 
  //     layers.pushObject(label);
  //     accumulatedWidth += column.get('width');
  //   }, this);
  // 
  //   SC.Benchmark.end(benchKey);
  //   return root;
  // }

});

SC.TableViewCell = SC.Layer.extend({

  displayProperties: 'value'.w(),

  // FIXME: Add more text properties.
  font: "10pt Helvetica, sans",
  color: base03,
  backgroundColor: base3,
  textBaseline: 'top',
  textAlign: 'left',
  tolerance: 10,
  lineHeight: 18,

  isEnabled: true,

  color: function() {
    return this.get('isEnabled')? black : 'rgba(0,43,54,0.5)';
  }.property('isEnabled'),

  backgroundColor: function() {
    return this.get('isEnabled')? white : base3;
  }.property('isEnabled'),

  borderColor: function() {
    return this.get('isEnabled')? 'rgb(128,128,128)' : 'rgba(0,43,54,0.5)';
  }.property('isEnabled'),

  borderWidth: 1,

  render: function(ctx) {
    var benchKey = 'render';
    SC.Benchmark.start(benchKey);
    var bounds = this.get('bounds'),
        h = bounds.height, w = bounds.width,
        isEnabled = this.get('isEnabled');

    ctx.fillStyle = this.get('backgroundColor');
    ctx.fillRect(0,0,w,h);

    // Draw the text.
    ctx.textBaseline = this.get('textBaseline');
    ctx.font = this.get('font');
    ctx.fillStyle = this.get('color');
    var val = this.get('value');
    if (!val && this.get('content')) this.get('content').get(this._contentKey);
    // if (val && val.elide) val = val.elide(ctx, w - 23);
    ctx.fillText(val, 4, 3);

    // Draw the box.
    // ctx.strokeStyle = this.get('borderColor');
    // SC.CreateRoundRectPath(ctx, 0.5, 0.5, w-1, h-1, 5);
    // ctx.lineWidth = this.get('borderWidth');
    // ctx.strokeRect();
    SC.Benchmark.end(benchKey);
  }
});

SC.TableHeaderWidget = SC.Widget.extend({
  column: null,

  render: function(ctx) {
    var title = this.getPath('column.title'),
        bounds = this.get('bounds'),
        w = bounds.width, h = bounds.height;

    ctx.fillStyle = 'black';
    ctx.font = "11pt Helvetica";
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    ctx.shadowBlur = 0;
    ctx.shadowColor = "rgba(0,0,0,0)";
    ctx.fillText(title || "(no title)", w/2, h/2);
  }
});

// Copied from endash/system/table_column.js

SC.SORT_ASCENDING  = 'ascending';
SC.SORT_DESCENDING = 'descending';

/** @class

  An abstract object that manages the state of the columns behind an
  `SC.TableView`.
  
  @extends SC.Object
  @since Blossom 1.0
*/

SC.TableColumn = SC.Object.extend({
/** @scope SC.TableColumn.prototype */
  
  /**
    The internal name of the column. `SC.TableRowView` objects expect their
    `content` to be an object with keys corresponding to the column's keys.
    
    @property
    @type String
  */
  key: null,
  
  /**
    Renders the row index instead of the column's key. Default to false.
    
    @property
    @type Boolean
  */
  useRowIndex: false,
  
  /**
    The display name of the column. Will appear in the table header for this
    column.
    
    @property
    @type String
  */
  title: null,
  
  /**
    Width of the column.
    
    @property
    @type Number
  */
  width: 100,
  
  /**
    How narrow the column will allow itself to be.
    
    @property
    @type Number
  */
  minWidth: 16,
  
  /**
    How wide the column will allow itself to be.
    
    @property
    @type Number
  */
  maxWidth: 700,
  
  formatter: null,

  isEditable: false,

  editor: null,
  
  isVisible: true,
  
  isResizable: true,
  
  /**
    Whether the column gets wider or narrower based on the size of the
    table. Only one column in a TableView is allowed to be flexible.
    
    @property
    @type Boolean
  */
  isFlexible: false,
  
  /**
    Whether the column can be drag-reordered.
    
    @property
    @type Boolean
  */
  isReorderable: true,
  
  /**
    Whether the column can be sorted.
    
    @property
    @type Boolean
  */
  isSortable: true,
  
  /**
    Example view for cells pertaining to this column instance

    @property
    @type SC.View
  */
  
  // exampleView: Endash.TableCellView,
  
  /**
    Reference to the URL for this column's icon. If `null`, there is no
    icon associated with the column.
    @property
  */
  icon: null,
  
  tableHeader: null,

  /**
    The sort state of this particular column. Can be one of
    SC.SORT_ASCENDING, SC.SORT_DESCENDING, or `null`. For instance, if
    SC.SORT_ASCENDING, means that the table is being sorted on this column
    in the ascending direction. If `null`, means that the table is sorted
    on another column.
    
    @property
  */
  sortState: null,
  
  /**
    The content property of the controlling SC.TableView. This is needed
    because the SC.TableHeader views use this class to find out how to
    render table content (when necessary).
  */
  tableContent: null,

  toggleSortState: function() {
    var sortState = this.get('sortState');
    this.set('sortState', (sortState !== "ASC" ? "ASC" : "DESC"));
  }
  
});
