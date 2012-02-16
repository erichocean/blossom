// ==========================================================================
// Project:   Blossom - Modern, Cross-Platform Application Framework
// Copyright: ©2012 Fohr Motion Picture Studios. All rights reserved.
// License:   Licensed under the GPLv3 license (see BLOSSOM-LICENSE).
// ==========================================================================
/*globals TextDemo formatter linebreak */

var base3 =  "#fdf6e3";
var base03 = "#002b36";

// Demo code based on http://www.bramstein.com/projects/typeset/.

var text = "In olden times when wishing still helped one, there lived a king whose daughters were all beautiful; and the youngest was so beautiful that the sun itself, which has seen so much, was astonished whenever it shone in her face. Close by the king's castle lay a great dark forest, and under an old lime-tree in the forest was a well, and when the day was very warm, the king's child went out to the forest and sat down by the fountain; and when she was bored she took a golden ball, and threw it up on high and caught it; and this ball was her favorite plaything.";

function main() {
  SC.Application.create();

  var surface = SC.View.create({

    updateDisplay: function() {
      // console.log('updateDisplay');
      var context = this.getPath('layer.context');

      // Draw background.
      context.fillStyle = base3;
      context.fillRect(0, 0, context.width, context.height);

      function draw(nodes, breaks, lineLengths, drawRatio, center) {
        var i = 0, lines = [], point, j, r, lineStart = 0, y = 40, tmp, maxLength = Math.max.apply(null, lineLengths);

        // Iterate through the line breaks, and split the nodes at the
        // correct point.
        for (i = 1; i < breaks.length; i += 1) {
          point = breaks[i].position;
          r = breaks[i].ratio;

          for (j = lineStart; j < nodes.length; j += 1) {
            // After a line break, we skip any nodes unless they are boxes or forced breaks.
            if (nodes[j].type === 'box' || (nodes[j].type === 'penalty' && nodes[j].penalty === -linebreak.defaults.infinity)) {
              lineStart = j;
              break;
            }
          }
          lines.push({ratio: r, nodes: nodes.slice(lineStart, point + 1), position: point});
          lineStart = point;
        }

        lines.forEach(function (line, lineIndex) {
          var x = 50, lineLength = lineIndex < lineLengths.length ? lineLengths[lineIndex] : lineLengths[lineLengths.length - 1];

          if (center) {
            x += (maxLength - lineLength) / 2;
            
          }

          context.fillStyle = base03;

          line.nodes.forEach(function (node, index) {
            if (node.type === 'box') {
              context.fillText(node.value, x, y);
              x += node.width;
            } else if (node.type === 'glue') {
              x += node.width + line.ratio * (line.ratio < 0 ? node.shrink : node.stretch);
            }
          });

          if (drawRatio) {
            context.textAlign = 'right';
            context.fillText(line.ratio.toFixed(3), context.width-50, y);
            context.textAlign = 'left';
          }

          y += 24;
        });
        return lines;
      }

      function align(type, lineLengths, tolerance, drawRatio, center) {
        var format, nodes, breaks;

        if (context) {
          context.textBaseline = 'top';
          context.font = "18px 'times new roman', 'FreeSerif', serif";

          format = formatter(function (str) {
            return context.measureText(str).width;
          });

          nodes = format[type](text);

          breaks = linebreak(nodes, lineLengths, {tolerance: tolerance});

          if (!breaks.isEmpty()) {
            return draw(nodes, breaks, lineLengths, drawRatio, center);
          } else {
            context.fillText('Paragraph can not be set with the given tolerance.', 0, 0);
          }
        }
        return [];
      }

      align('justify', [350], 3, true);
      // align('#center', 'center', [350], 3);
      // align('#left', 'left', [350], 4);
      // align('#flow', 'justify', [350, 350, 350, 200, 200, 200, 200, 200, 200, 200, 350, 350], 3);
      // align('#triangle', 'justify',  [50, 100, 150, 200, 250, 300, 350, 400, 450, 500, 550], 25, false, true);
    }

  });

  SC.app.set('ui', surface);
}
