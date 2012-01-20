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

BlossomTest.colorExample = function(stage) {

  var PointerShape = SC.Shape.extend({

    mouseEntered: function(evt) {
      document.body.style.cursor = "pointer";
    },

    mouseExited: function(evt) {
      document.body.style.cursor = "default";
    }
  });

  var triangle = PointerShape.create({

    color: "#00D2FF",

    draw: function(context) {
      context.beginPath();
      context.lineWidth = 4;
      context.strokeStyle = "black";
      context.fillStyle = this.color;
      context.moveTo(120, 50);
      context.lineTo(250, 80);
      context.lineTo(150, 170);
      context.closePath();
      context.fill();
      context.stroke();
    },

    click: function(evt) {
      this.color = this.color == "yellow" ? "#00D2FF" : "yellow";
      stage.draw();
    }
  });


  var circle = PointerShape.create({

    color: "red",

    draw: function(context) {
      var canvas = context.canvas;
      context.beginPath();
      context.arc(380, canvas.height / 2, 70, 0, Math.PI * 2, true);
      context.fillStyle = this.color;
      context.fill();
      context.lineWidth = 4;
      context.stroke();
    },

    click: function(evt) {
      this.color = this.color == "red" ? "#00d00f" : "red";
      stage.draw();
    }
  });

  stage.add(triangle);
  stage.add(circle);
};
