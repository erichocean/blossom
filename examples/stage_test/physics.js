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

BlossomTest.physicsExample = function(stage) {

  window.requestAnimFrame = function(callback) {
    return window.requestAnimationFrame ||
      window.webkitRequestAnimationFrame ||
      window.mozRequestAnimationFrame ||
      window.oRequestAnimationFrame ||
      window.msRequestAnimationFrame ||
      function(callback) { window.setTimeout(callback, 1000 / 60); };
  }();

  // Vector math functions
  //
  function dot(a, b) { return ((a.x * b.x) + (a.y * b.y)); }
  function magnitude(a) { return Math.sqrt((a.x * a.x) + (a.y * a.y)); }
  function normalize(a) {
    var mag = magnitude(a);
    if (mag === 0) return { x: 0, y: 0 };
    else return { x: a.x / mag, y: a.y / mag };
  }
  function add(a, b) { return { x: a.x + b.x, y: a.y + b.y }; }
  function angleBetween(a, b) {
    return Math.acos(dot(a, b) / (magnitude(a) * magnitude(b)));
  }
  function rotate(a, angle) {
    var ca = Math.cos(angle),
        sa = Math.sin(angle),
        rx = a.x * ca - a.y * sa,
        ry = a.x * sa + a.y * ca;
    return { x: rx * -1, y: ry * -1 };
  }
  function invert(a) { return { x: a.x * -1, y: a.y * -1 }; }
  // This cross product function has been simplified by setting x and y to 
  // zero because vectors a and b lie in the canvas plane.
  function cross(a, b) {
    return { x: 0, y: 0, z: (a.x * b.y) - (b.x * a.y) };
  }

  function getNormal(curve, ball){
    var stage = curve.get('stage'),
        propsLayer = stage.get('props'),
        context = propsLayer.get('context'),
        testRadius = 20, // pixels
        totalX = 0, totalY = 0;

    // Check various points around the center point to determine the normal 
    // vector.
    for (var n = 0; n < 20; ++n) {
        var angle = n * 2 * Math.PI / 20,
            offsetX = testRadius * Math.cos(angle),
            offsetY = testRadius * Math.sin(angle),
            testX = ball.x + offsetX,
            testY = ball.y + offsetY;

        if (!context.isPointInPath(testX, testY)) {
            totalX += offsetX;
            totalY += offsetY;
        }
    }

    var normal;

    if (totalX === 0 && totalY === 0) normal = { x: 0, y: -1 };
    else normal = { x: totalX, y: totalY };

    return normalize(normal);
  }

  function handleCurveCollision(ball, curve){
    var stage = curve.get('stage'),
        propsLayer = stage.get('props'),
        propsContext = propsLayer.get('context');

    var curveDamper = 0.05; // Induce a 5% energy loss.
    if (propsContext.isPointInPath(ball.x, ball.y)) {
        var normal = getNormal(curve, ball);
        if (normal !== null) {
            var angleToNormal = angleBetween(normal, invert(ball.velocity)),
                crossProduct = cross(normal, ball.velocity),
                polarity = crossProduct.z > 0 ? 1 : -1,
                collisonAngle = polarity * angleToNormal * 2,
                collisionVector = rotate(ball.velocity, collisonAngle);

            ball.velocity.x = collisionVector.x;
            ball.velocity.y = collisionVector.y;
            ball.velocity.x *= (1 - curveDamper);
            ball.velocity.y *= (1 - curveDamper);

            // Bubble ball up to the surface of the curve.
            while (propsContext.isPointInPath(ball.x, ball.y)) {
                ball.x += normal.x;

                if (ball.velocity.y > 0.1) ball.y += normal.y;
                else {
                    // Nudge ball even less to prevent bouncing at rest.
                    ball.y += normal.y / 10;
                }
            }
        }
    }
  }

  function updateBall(timeDiff, stage, ball, dd, curve){
    var canvas = stage.getPath('layer.canvas'),
        startBallX = ball.x,
        startBallY = ball.y;

    // physics variables
    var gravity = 10, // px / second^2
        speedIncrementFromGravityEachFrame = gravity * timeDiff / 1000,
        collisionDamper = 0.2, // 20% energy loss
        floorFriction = 5, // px / second^2
        floorFrictionSpeedReduction = floorFriction * timeDiff / 1000;

    if (dd.isDragging) {
        var mousePos = stage.get('mousePosition');

        if (mousePos !== null) {
            var mouseX = mousePos.x;
            var mouseY = mousePos.y;

            var c = 0.06 * timeDiff;
            ball.velocity = {
                x: c * (mouseX - dd.lastMouseX),
                y: c * (mouseY - dd.lastMouseY)
            };

            dd.lastMouseX = mouseX;
            dd.lastMouseY = mouseY;
            dd.mouseOffsetX = mouseX - dd.offsetX;
            dd.mouseOffsetY = mouseY - dd.offsetY;
            ball.x = mouseX - dd.offsetX;
            ball.y = mouseY - dd.offsetY;
        }
    } else {
        // gravity
        ball.velocity.y += speedIncrementFromGravityEachFrame;
        ball.x += ball.velocity.x;
        ball.y += ball.velocity.y;

        // ceiling condition
        if (ball.y < ball.radius) {
            ball.y = ball.radius;
            ball.velocity.y *= -1;
            ball.velocity.y *= (1 - collisionDamper);
        }

        // floor condition
        if (ball.y > (canvas.height - ball.radius)) {
            ball.y = canvas.height - ball.radius;
            ball.velocity.y *= -1;
            ball.velocity.y *= (1 - collisionDamper);
        }

        // floor friction
        if (ball.y == canvas.height - ball.radius) {
            if (ball.velocity.x > 0.1) {
                ball.velocity.y -= floorFrictionSpeedReduction;
            } else if (ball.velocity.x < -0.1) {
                ball.velocity.x += floorFrictionSpeedReduction;
            } else {
                ball.velocity.x = 0;
            }
        }

        // right wall condition
        if (ball.x > (canvas.width - ball.radius)) {
            ball.x = canvas.width - ball.radius;
            ball.velocity.x *= -1;
            ball.velocity.x *= (1 - collisionDamper);
        }

        // left wall condition
        if (ball.x < ball.radius) {
            ball.x = ball.radius;
            ball.velocity.x *= -1;
            ball.velocity.x *= (1 - collisionDamper);
        }

        // If the ball comes into contact with the curve, then bounce it in 
        // the direction of the curve's surface normal.
        handleCurveCollision(ball, curve);
    }
  }

  var canvas = stage.getPath('layer.canvas'),
      context = stage.get('context'),
      radius = 20;

  // Make the curve a static shape by setting type: SC.PROP. This prevents 
  // the curve from being redrawn each frame.
  var curve = SC.Shape.create({

    type: SC.PROP,

    draw: function(context) {
      var canvas = context.canvas;

      context.beginPath();
      context.moveTo(40, canvas.height);
      context.bezierCurveTo(
          canvas.width * 0.2,
          -1 * canvas.height * 0.5,
          canvas.width * 0.7,
          canvas.height * 1.3,
          canvas.width,
          canvas.height * 0.5
        );

      context.lineTo(canvas.width, canvas.height);
      context.lineTo(40, canvas.height);
      context.closePath();
      context.fillStyle = "#8dbdff";
      context.fill();
    }
  });


  // Globals needed for drag and drop,
  var dd = {
      mouseX: 0,
      mouseY: 0,
      mouseOffsetX: 0,
      mouseOffsetY: 0,
      lastMouseX: 0,
      lastMouseY: 0,
      offsetX: 0,
      offsetY: 0,
      isDragging: false
  };

  var ball = SC.Shape.create({

    x: 190, y: 20,
    radius: radius,
    velocity: { x: 0, y: 0 },

    draw: function(context) {
      context.beginPath();
      context.arc(0, 0, radius, 0, 2 * Math.PI, false);
      context.fillStyle = "blue";
      context.fill();
    },

    mouseDown: function(evt) {
      var mousePos = stage.get('mousePosition'),
          mouseX = mousePos.x,
          mouseY = mousePos.y;

      dd.isDragging = true;
      dd.offsetX = mouseX - ball.x;
      dd.offsetY = mouseY - ball.y;
      ball.velocity = { x: 0, y: 0 };
    },

    // mouseDragged: <= This is being handled by updateBall(), above.

    mouseUp: function(evt) {
      dd.isDragging = false;
      dd.mouseOffsetX = 0;
      dd.mouseOffsetY = 0;
    },

    mouseEntered: function(evt) {
      document.body.style.cursor = "pointer";
    },

    mouseExited: function(evt) {
      document.body.style.cursor = "default";
    }
  });

  stage.add(curve);
  stage.add(ball);

  function animate(lastTime, stage, ball, dd, curve) {
    var date = new Date(),
        time = date.getTime(),
        timeDiff = time - lastTime;

    updateBall(timeDiff, stage, ball, dd, curve);
    stage.draw();

    window.requestAnimFrame(function() {
        animate(time, stage, ball, dd, curve);
    });
  }

  var date = new Date();
  var time = date.getTime();
  animate(time, stage, ball, dd, curve);
} ;