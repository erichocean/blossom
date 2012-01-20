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

function drawCurves(stage) {
  var context = stage.get('context');

  stage.get('layer').clear();

  // draw quad
  //
  var quad = stage.quad;

  // draw connectors
  context.beginPath();
  context.moveTo(quad.start.x, quad.start.y);
  context.lineTo(quad.control.x, quad.control.y);
  context.lineTo(quad.end.x, quad.end.y);
  context.strokeStyle = "#ccc";
  context.lineWidth = 2;
  context.stroke();
  context.closePath();

  // draw curve
  context.beginPath();
  context.moveTo(quad.start.x, quad.start.y);
  context.quadraticCurveTo(quad.control.x, quad.control.y, quad.end.x, quad.end.y);
  context.strokeStyle = "red";
  context.lineWidth = 4;
  context.stroke();

  // draw bezier
  //
  var bezier = stage.bezier;

  // draw connectors
  context.beginPath();
  context.moveTo(bezier.start.x, bezier.start.y);
  context.lineTo(bezier.control1.x, bezier.control1.y);
  context.lineTo(bezier.control2.x, bezier.control2.y);
  context.lineTo(bezier.end.x, bezier.end.y);
  context.strokeStyle = "#ccc";
  context.lineWidth = 2;
  context.stroke();
  context.closePath();

  // draw curve
  context.beginPath();
  context.moveTo(bezier.start.x, bezier.start.y);
  context.bezierCurveTo(bezier.control1.x, bezier.control1.y, bezier.control2.x, bezier.control2.y, bezier.end.x, bezier.end.y);
  context.strokeStyle = "blue";
  context.lineWidth = 4;
  context.stroke();
}

var AnchorShape = SC.Shape.extend({

  lineWidth: 2,
  draggingRectOffsetX: 0,
  draggingRectOffsetY: 0,

  draw: function(context) {
    context.beginPath();
    context.lineWidth = this.lineWidth;
    context.strokeStyle = "#666";
    context.fillStyle = "#ddd";
    context.arc(0, 0, 5, 0, 2 * Math.PI, false);
    context.closePath();
    context.fill();
    context.stroke();
  },

  mouseEntered: function(evt) {
    document.body.style.cursor = "pointer";
    this.set('lineWidth', 4);
    this.get('stage').draw();
  },

  mouseExited: function(evt) {
    document.body.style.cursor = "default";
    this.set('lineWidth', 2);
    this.get('stage').draw();
  },

  mouseDown: function(evt) {
    var stage = this.get('stage'),
        mousePos = stage.get('mousePosition');
    this.draggingRectOffsetX = mousePos.x - this.x;
    this.draggingRectOffsetY = mousePos.y - this.y;
    return YES;
  },

  mouseDragged: function(evt) {
    var stage = this.get('stage'),
        mousePos = stage.get('mousePosition');
    this.x = mousePos.x - this.draggingRectOffsetX;
    this.y = mousePos.y - this.draggingRectOffsetY;
    stage.draw();
    drawCurves(stage);
  }
});


BlossomTest.curvesExample = function(stage) {

  function buildAnchor(stage, x, y) {
    var anchor = AnchorShape.create({ x: x, y: y });
    stage.add(anchor);
    return anchor;
  }

  // add curves to stage so that they can be modified by reference
  stage.quad = {
      start: buildAnchor(stage, 60, 30),
      control: buildAnchor(stage, 240, 110),
      end: buildAnchor(stage, 80, 160)
  };

  stage.bezier = {
      start: buildAnchor(stage, 280, 20),
      control1: buildAnchor(stage, 530, 40),
      control2: buildAnchor(stage, 480, 150),
      end: buildAnchor(stage, 300, 150)
  };

  drawCurves(stage);
} ;