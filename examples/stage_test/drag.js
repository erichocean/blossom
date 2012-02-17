// ==========================================================================
// Project:   Blossom - Modern, Cross-Platform Application Framework
// Copyright: ©2012 Fohr Motion Picture Studios. All rights reserved.
// License:   Licensed under the GPLv3 license (see BLOSSOM-LICENSE).
// ==========================================================================
/*global BlossomTest */

// This sample is adapted to Blossom from a similar sample in KineticJS.
/**
 * KineticJS JavaScript Library v3.6.0
 * http://www.kineticjs.com/
 * Copyright 2012, Eric Rowell
 * Licensed under the MIT or GPL Version 2 licenses.
 * Date: Jan 18 2012
 *
 * Copyright (C) 2012 by Eric Rowell
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

BlossomTest.dragExample = function(stage) {
  var colors = "red orange yellow green blue purple".w();

  var DraggableBox = SC.Shape.extend({

    offset: 0,

    draw: function(ctx) {
      var offset = this.get('offset'),
          x = offset * 30 + 150,
          y = offset * 18 + 40;

      ctx.beginPath();
      ctx.rect(x, y, 100, 50);
      ctx.lineWidth = 4;
      ctx.strokeStyle = "black";
      ctx.fillStyle = this.get('color');
      ctx.fill();
      ctx.stroke();
      ctx.closePath();
    },

    draggingRectOffsetX: 0,
    draggingRectOffsetY: 0,

    mouseDown: function(evt) {
      var stage = this.get('stage'),
          mousePos = stage.get('mousePosition');

      this.moveToTop();
      this.draggingRectOffsetX = mousePos.x - this.get('x');
      this.draggingRectOffsetY = mousePos.y - this.get('y');
      return true;
    },

    mouseDragged: function(evt) {
      var stage = this.get('stage'),
          mousePos = stage.get('mousePosition');

      this.set('x', mousePos.x - this.draggingRectOffsetX);
      this.set('y', mousePos.y - this.draggingRectOffsetY);
      stage.draw();
    },

    mouseEntered: function(evt) {
      document.body.style.cursor = "pointer";
    },

    mouseExited: function(evt) {
      document.body.style.cursor = "default";
    }
  });

  for (var n = 0; n < 6; n++) {
    var box = DraggableBox.create({ offset: n, color: colors[n] });
    stage.add(box);
  }

  var context = stage.get('context');
  context.save();
  context.font = "16pt Calibri";
  context.textBaseline = "top";
  context.fillText("Click on a shape to drag.", 10, 5);
  context.restore();
} ;      