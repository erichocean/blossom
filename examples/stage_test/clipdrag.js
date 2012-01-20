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

BlossomTest.clipDragExample = function(stage) {

  var DraggableShape = SC.Shape.extend({

    draggingRectOffsetX: 0,
    draggingRectOffsetY: 0,

    mouseDown: function(evt) {
      var stage = this.get('stage'),
          mousePos = stage.get('mousePosition');

      this.draggingRectOffsetX = mousePos.x - this._x;
      this.draggingRectOffsetY = mousePos.y - this._y;
      return YES;
    },

    mouseDragged: function(evt) {
      var stage = this.get('stage'),
          mousePos = stage.get('mousePosition');

      this._x = mousePos.x - this.draggingRectOffsetX;
      this._y = mousePos.y - this.draggingRectOffsetY;
      stage.draw();
    },

    mouseEntered: function(evt) {
      document.body.style.cursor = "pointer";
    },

    mouseExited: function(evt) {
      document.body.style.cursor = "default";
    }
  });

  var box = DraggableShape.create({

    _x: 100, _y: 50,

    draw: function(context) {
      context.beginPath();
      context.rect(this._x, this._y, 200, 100);
      context.fillStyle = "#ddd";
      context.fill();
      context.closePath();
    }
  });

  var circle = DraggableShape.create({

    _x: 300, _y: 50,
    box: box,

    draw: function(context) {
      var box = this.box;
      // draw clipping rectangle
      context.beginPath();
      context.rect(box._x, box._y, 200, 100);
      context.clip();
      // draw circle
      context.beginPath();
      context.arc(this._x, this._y, 50, 0, 2 * Math.PI, false);
      context.fillStyle = "blue";
      context.fill();
      context.closePath();
    }
  });

  stage.add(box);
  stage.add(circle);
} ;
