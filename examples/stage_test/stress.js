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

BlossomTest.stressExample = function(stage) {

  window.requestAnimFrame = function(callback) {
    return window.requestAnimationFrame ||
      window.webkitRequestAnimationFrame ||
      window.mozRequestAnimationFrame ||
      window.oRequestAnimationFrame ||
      window.msRequestAnimationFrame ||
      function(callback) { window.setTimeout(callback, 1000 / 60); };
  }();

  function animate(lastTime, stage) {
    var date = new Date(),
        time = date.getTime(),
        timeDiff = time - lastTime,
        angularSpeed = 1, // revolutions per second
        angularDiff = angularSpeed * 2 * Math.PI * timeDiff / 1000,
        shapes = stage.getPath('actors.shapes');

    console.log(1000 / timeDiff); // log fps

    // rotate rectangles
    for (var idx=0, len=shapes.length; idx<len; ++idx) {
        var shape = shapes[idx],
            rotation = shape.get('rotation'),
            adjustment = shape._rotationAdjustment;

        shape.set('rotation', rotation + angularDiff*adjustment);
    }

    stage.draw();
    window.requestAnimFrame(function() { animate(time, stage); });
  }

  var colors = "red orange yellow green blue cyan purple".w(),
      colorIndex = 0, colorLength = colors.length;

  var RandomBox = SC.Shape.extend({

    _color: 'red',
    _randWidth: 0, randHeight: 0,
    _relX: 0, _relY: 0,

    draw: function(context) {
      var relX = this._relX, relY = this._relY,
          randWidth = this._randWidth, randHeight = this._randHeight,
          color = this._color;

      context.beginPath();
      context.rect(relX, relY, randWidth, randHeight);
      context.fillStyle = color;
      context.fill();
      context.lineWidth = 4;
      context.stroke();
    },

    init: function() {
      arguments.callee.base.apply(this, arguments);;

      var color = colors[colorIndex++],
          randWidth = Math.random() * 100 + 20,
          randHeight = Math.random() * 100 + 20,
          randX = Math.random() * stage.get('width'),
          randY = Math.random() * stage.get('height'),
          relX = -1 * randWidth / 2,
          relY = -1 * randHeight / 2;

      if (colorIndex >= colorLength) colorIndex = 0;

      this._color = color;
      this._randWidth = randWidth;
      this._randHeight = randHeight;
      this._relX = relX;
      this._relY = relY;
      this.set('x', randX);
      this.set('y', randY);
      this._rotationAdjustment = Math.random()*0.6*(Math.random() > 0.5?1:-1);
    }
  });

  for (var n = 0; n < 300; n++) {
      var box = RandomBox.create();
      stage.add(box);
  }

  animate(new Date().getTime(), stage);
} ;
