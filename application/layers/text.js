// ==========================================================================
// Project:   Blossom - Modern, Cross-Platform Application Framework
// Copyright: ©2012 Fohr Motion Picture Studios. All rights reserved.
// License:   Licensed under the GPLv3 license (see BLOSSOM-LICENSE).
// ==========================================================================
/*globals sc_assert BLOSSOM formatter linebreak */

sc_require('layers/layer');
sc_require('text/linebreak');
sc_require('text/formatter');

if (BLOSSOM) {

var base3 =  "#fdf6e3";
var base03 = "#002b36";

SC.TextLayer = SC.Layer.extend({

  isTextLayer: true,

  displayProperties: 'value'.w(),

  // FIXME: Add more text properties.
  font: "11pt Calibri, sans",
  color: base03,
  backgroundColor: base3,
  textBaseline: 'top',
  textAlign: 'left',
  tolerance: 10,
  lineHeight: 18,

  _sc_textPropertiesDidChange: function() {
    this.__needsTextLayout__ = true;
    var surface = this.get('surface');
    if (surface) surface.triggerLayoutAndRendering();
  }.observes('font', 'color', 'backgroundColor', 'textBaseline',
             'textBaseline', 'tolerance', 'lineHeight'),

  value: null, // should be a String or null

  _sc_value: null,
  _sc_valueDidChange: function() {
    var value = this.get('value');
    if (value !== this._sc_value) {
      this._sc_value = value;
      if (value) {
        this.__needsTextLayout__ = true;
        var surface = this.get('surface');
        if (surface) surface.triggerLayoutAndRendering();
      }
    }
  }.observes('value'),

  updateTextLayout: function() {
    // console.log('SC.TextLayer#updateTextLayout()');
    var context = this.get('context'),
        text = String(this.get('value') || ''),
        line, that = this;

    this.__needsTextLayout__ = false;
    sc_assert(context);

    function setparagraph(nodes, breaks, lineLengths, center) {
      var i = 0, lines = [],
          point, j, r,
          lineStart = 0,
          maxLength = Math.max.apply(null, lineLengths);

      // Iterate through the line breaks, and split the nodes at the correct 
      // point.
      for (i = 1; i < breaks.length; i += 1) {
        point = breaks[i].position;
        r = breaks[i].ratio;

        for (j = lineStart; j < nodes.length; j += 1) {
          // After a line break, we skip any nodes unless they are boxes or 
          // forced breaks.
          if (nodes[j].type === 'box' || (nodes[j].type === 'penalty' && nodes[j].penalty === -linebreak.defaults.infinity)) {
            lineStart = j;
            break;
          }
        }
        lines.push({
          ratio: r,
          nodes: nodes.slice(lineStart, point + 1),
          position: point
        });
        lineStart = point;
      }
      return lines;
    }

    function align(type, lineLengths, tolerance, center) {
      var format, nodes, breaks, lines, height;

      context.textBaseline = that.get('textBaseline');
      context.font = that.get('font');

      format = formatter(function(str) {
        return context.measureText(str).width;
      });

      nodes = format[type](text);
      breaks = linebreak(nodes, lineLengths, { tolerance: tolerance });

      if (!breaks.isEmpty()) {
        lines = that._sc_lines = setparagraph(nodes, breaks, lineLengths, center);

        // Subtle, we don't want to trigger layout, which would reposition 
        // our layer.
        height = Math.max(that.get('layout').minHeight || 0, lines.length*that.get('lineHeight'));
        that.__sc_element__.height = that._sc_bounds[3]/*height*/ = height;
        that.triggerRendering();
      } else {
        console.log('Paragraph can not be set with the given tolerance.', tolerance);
        that._sc_lines = [];
      }
    }

    align(this.get('textAlign'), [this.get('bounds')[2]/*width*/], this.get('tolerance'));
  },

  render: function(context) {
    // console.log('SC.TextLayer#render()');
    var lines = this._sc_lines,
        lineLengths = [this.get('bounds')[2]/*width*/],
        maxLength = Math.max.apply(null, lineLengths),
        lineHeight = this.get('lineHeight'),
        center = false, y = 0;

    sc_assert(!this.__needsTextLayout__);
    sc_assert(lines);

    context.fillStyle = this.get('backgroundColor');
    context.fillRect(0, 0, context.width, context.height);

    context.textBaseline = this.get('textBaseline');
    context.font = this.get('font');
    context.fillStyle = this.get('color');

    lines.forEach(function (line, lineIndex) {
      var x = 0, lineLength = lineIndex < lineLengths.length ? lineLengths[lineIndex] : lineLengths[lineLengths.length - 1];

      if (center) {
        x += (maxLength - lineLength) / 2;
      }

      line.nodes.forEach(function (node, index) {
        if (node.type === 'box') {
          context.fillText(node.value, x, y);
          x += node.width;
        } else if (node.type === 'glue') {
          x += node.width + line.ratio * (line.ratio < 0 ? node.shrink : node.stretch);
        }
      });

      y += lineHeight;
    });
  },

  init: function() {
    arguments.callee.base.apply(this, arguments);
    this._sc_valueDidChange();
  }

});

} // BLOSSOM

