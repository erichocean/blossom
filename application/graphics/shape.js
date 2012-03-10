// ==========================================================================
// Project:   Blossom - Modern, Cross-Platform Application Framework
// Copyright: ©2012 Fohr Motion Picture Studios. All rights reserved.
// License:   Licensed under the GPLv3 license (see BLOSSOM-LICENSE).
// ==========================================================================

// Blossom's SC.Shape class was heavily inspired by KineticJS.
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

sc_require('graphics/stage');
sc_require('graphics/shape_layer');

SC.ACTOR = 'actors';
SC.PROP = 'props';
SC.BACKGROUND = 'background';
SC.EXTRA = 'extras';

SC.Shape = SC.Object.extend({

  type: SC.ACTOR,
  
  x: 0,
  y: 0,
  rotation: 0, // radians
  scale: { x: 1, y: 1 },

  // store state for next clear
  lastX: 0,
  lastY: 0,
  lastRotation: 0, // radians
  lastScale: { x: 1, y: 1 },
  
  isVisible: true,
  zIndex: -1, // Set by the layer once added to the stage.

  drag: { x: false, y: false },
  isDraggable: function() {
    var drag = this.drag;
    return drag.x || drag.y;
  }.property(),

  stage: null, // Set by the stage once added to the stage.
  layer: null, // Set by the stage once added to the stage.

  // Override this method to actually draw your shape. You do not need to 
  // call arguments.callee.base.apply(this, arguments);.
  draw: function(context) {},

  display: function(context) {
    if (this.get('isVisible')) {
      var stage = this.get('stage');

      // layer transform
      context.save();
      if (stage.scale.x != 1 || stage.scale.y != 1) {
        context.scale(stage.scale.x, stage.scale.y);
      }

      // shape transform
      context.save();
      if (this.x !== 0 || this.y !== 0) {
        context.translate(this.x, this.y);
      }
      if (this.rotation !== 0) {
        context.rotate(this.rotation);
      }
      if (this.scale.x != 1 || this.scale.y != 1) {
        context.scale(this.scale.x, this.scale.y);
      }

      this.draw(context);

      context.restore();
      context.restore();
    }
  },

  move: function(x, y) {
    this.x += x;
    this.y += y;
  },

  rotate: function(theta) {
    this.rotation += theta;
  },

  show: function() {
    this.set('isVisible', true);
  },

  hide: function() {
    this.set('isVisible', false);
  },

  moveToTop: function() {
    var layer = this.get('layer');
    if (layer) layer.moveShapeToTop(this);
  },

  typeDidChange: function() {
    var layer = this.get('layer'),
        stage = this.get('stage');

    if (layer) layer.removeShape(this);
    if (stage) stage.add(this);
  }.observes('type'),

  mouseDown: function(evt) {
    var isDraggable = this.get('isDraggable'),
        stage = this.get('stage'),
        pos = stage.get('mousePosition');
    
    if (isDraggable && pos) {
        stage.set('shapeDragging', this);
        var offset = {};
        offset.x = pos.x - this.x;
        offset.y = pos.y - this.y;
        this.offset = offset;
        
        if (this.dragStarted) this.dragStarted(evt);
    }
  },

  init: function() {
    arguments.callee.base.apply(this, arguments);

    // These properties need their own, per-instance hashes.
    this.scale = { x: 1, y: 1 };
    this.lastScale = { x: 1, y: 1 };
    this.drag = { x: false, y: false };
  }

});
