// ==========================================================================
// Project:   Blossom - Modern, Cross-Platform Application Framework
// Copyright: ©2012 Fohr Motion Picture Studios. All rights reserved.
// License:   Licensed under the GPLv3 license (see BLOSSOM-LICENSE).
// ==========================================================================
/*globals BLOSSOM */

// Blossom's SC.Stage class was heavily inspired by KineticJS.
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

sc_require('panes/pane');
sc_require('blossom/shape_layer');

if (BLOSSOM) {

/** @class

  This class implements a "stage" where interactive shapes can be placed. 
  You can use these shapes to create complicated, interactive widgets.

  @extends SC.Pane
  @since SproutCore 1.9
*/
SC.StagePane = SC.Pane.extend({

  scale: { x: 1, y: 1 },

  idCounter: 0,

  targetShape: null,
  draggableShape: null,

  /* Layer roles:

    buffer - canvas compositing (not visible)
    backstage - path hit-detection (not visible)
    layer - classic canvas drawing with no shapes
    background - static shapes without event handlers
    props - static shapes with event handlers
    extras - moveable shapes without event handlers
    actors - moveable shapes with event handlers
  */
  buffer: null,
  backstage: null,
  layer: null,
  // only the layers below contain shapes
  background: null,
  props: null,
  extras: null,
  actors: null,

  context: function() {
    return this.getPath('layer.context');
  }.property().cacheable(),

  shapes: function() {
    return this.getPath('layer.shapes');
  }.property(),

  width: function() {
    return this._width;
  }.property(),

  height: function() {
    return this._height;
  }.property(),

  draw: function() {
    SC.Benchmark.start("SC.Stage#draw");
    this.get('background').draw();
    this.get('props').draw();
    this.get('extras').draw();
    this.get('actors').draw();
    SC.Benchmark.end("SC.Stage#draw");
  },

  clear: function() {
    this.get('background').clear();
    this.get('props').clear();
    this.get('extras').clear();
    this.get('actors').clear();
  },

  add: function(shape) {
    var layer = this.get(shape.get('type'));

    shape.set('id', this.idCounter++);
    shape.set('stage', this);
    shape.set('layer', layer);

    layer.addShape(shape);
  },

  /**
    Attempts to send the event to the shape(s) under the mouse.

    @param {String} action
    @param {SC.Event} evt
    @param {Object} target
    @returns {Object} object that handled the event
  */
  sendEvent: function(action, evt, target) {
    // console.log(action);
    // console.log(evt);

    target = null;

    this.updateMousePositionWithEvent(evt);
    var pos = this.get('mousePosition');

    // handle mouseDragged and mouseUp specially...
    var stage = this;
    var draggableShape = stage.draggableShape;
    if (action === 'mouseUp' && draggableShape) {
      target = draggableShape.tryToPerform(action, evt) ? this : null ;
      this.draggableShape = null;
      return target;
    }

    // FIXME Handle other types of events!

    if (!pos) return; // not a mouse event...
    var pos_x = pos.x, pos_y = pos.y;
    
    var backstageLayer = this.get('backstage');
    var backstageLayerContext = backstageLayer.get('context');

    backstageLayer.clear();
    
    var eventShapes = this.getPath('props.shapes').concat(this.getPath('actors.shapes'));
    for (var n = eventShapes.length - 1; n >= 0; n--) {
      var shape = eventShapes[n];

      if (shape.get('isVisible')) {
        shape.display(backstageLayerContext);

        if (backstageLayerContext.isPointInPath(pos_x, pos_y)) {
            n = -1; // stop looking, we found the top-most shape
            // console.log('found a shape');
            if (action === 'mouseDown' && shape.tryToPerform(action, evt)) {
              // console.log('should start dragging now...');
              stage.draggableShape = shape;
              target = this;
            } else {
              target = shape.tryToPerform(action, evt) ? this : null ;
            }
        }
      }
    }
    // console.log(target?"have target":"no target");
    return target ;
  },

  // click: function(evt) {
  //   console.log('SC.Stage#click');
  //   return this.sendEvent('click', evt);
  // },

  mouseDragged: function(evt) {
    // console.log('SC.Stage#mouseDragged');
    SC.Benchmark.start("SC.Stage#mouseDragged");
    var draggableShape = this.get('draggableShape');

    this.updateMousePositionWithEvent(evt);
    if (draggableShape) draggableShape.tryToPerform('mouseDragged', evt);
    SC.Benchmark.end("SC.Stage#mouseDragged");
  },

  mouseEntered: function(evt) {
    // console.log('SC.Stage#mouseEntered');
    return this.mouseMoved(evt);
  },

  mouseMoved: function(evt) {
    // console.log('SC.Stage#mouseMoved');
    SC.Benchmark.start("SC.Stage#mouseMoved");
    this.updateMousePositionWithEvent(evt);
    var pos = this.get('mousePosition');

    if (!pos) {
      SC.Benchmark.end("SC.Stage#mouseMoved");
      return; // not a mouse event...
    }
    var pos_x = pos.x, pos_y = pos.y;
    
    var stage = this;
    var targetShape = this.targetShape;

    var backstageLayer = this.get('backstage');
    var backstageLayerContext = backstageLayer.get('context');
    
    backstageLayer.clear();
    
    var eventShapes = this.getPath('props.shapes').concat(this.getPath('actors.shapes'));
    for (var n = eventShapes.length - 1; n >= 0; n--) {
      var shape = eventShapes[n];

      if (shape.get('isVisible')) {
        shape.display(backstageLayerContext);

        if (backstageLayerContext.isPointInPath(pos_x, pos_y)) {
          n = -1; // stop looking, we found the top-most shape

          /*
           * this condition is used to identify a new target shape.
           * A new target shape occurs if a target shape is not defined or
           * if the current shape is different from the current target shape and
           * the current shape is beneath the target
           */
          if (!targetShape || (targetShape !== shape && targetShape.get('zIndex') < shape.get('zIndex'))) {
            if (targetShape) targetShape.tryToPerform('mouseExited', evt);
            stage.targetShape = shape;
            shape.tryToPerform('mouseEntered', evt);
          } else {
            targetShape.tryToPerform('mouseMoved', evt);
          }
        } else if (targetShape === shape) {
          targetShape.tryToPerform('mouseExited', evt);
          stage.targetShape = null;
          n = -1; // stop looking
        }
      }
    }
    SC.Benchmark.end("SC.Stage#mouseMoved");
  },

  mouseExited: function(evt) {
    // console.log('SC.Stage#mouseExited');

    this.updateMousePositionWithEvent(evt);
    var pos = this.get('mousePosition');

    if (!pos) return; // not a mouse event...
    var pos_x = pos.x, pos_y = pos.y;
    
    var stage = this;
    var targetShape = this.targetShape;

    if (targetShape) {
      targetShape.tryToPerform('mouseExited', evt);
      stage.targetShape = null;
    }
  },

  updateMousePositionWithEvent: function(evt) {
    var containerPos = this.computeContainerPosition(),
        mouseX = evt.clientX - containerPos.left + window.pageXOffset,
        mouseY = evt.clientY - containerPos.top + window.pageYOffset;

    this.set('mousePosition', { x: mouseX, y: mouseY });
  },

  computeContainerPosition: function() {
    var el = this.get('container'),
        top = 0, left = 0;

    while (el && el.tagName != "BODY") {
      top += el.offsetTop;
      left += el.offsetLeft;
      el = el.offsetParent;
    }

    return { top: top, left: left };
  },

  createLayersForContainer: function(container, width, height) {
    this._width = width;
    this._height = height;

    // Create a custom SC.Layer subclass with shared properties.
    var K = SC.ShapeLayer.extend({
      container: container,
      owner: this,
      width: width,
      height: height
    });

    // Create the layers for this pane. The order of creation is important!
    var buffer = K.create(),
        backstage = K.create({ isHitTestOnly: true }),
        layer = SC.Layer.create({ // This layer does not host shapes.
          container: container,
          owner: this,
          width: width,
          height: height
        }),
        background = K.create(),
        props = K.create(),
        extras = K.create(),
        actors = K.create();

    // The back two layers should not be shown (and backstage inhibits
    // drawing, too).
    buffer.__sc_element__.style.display = 'none';
    backstage.__sc_element__.style.display = 'none';

    // Remember what we've done!
    this.set('buffer', buffer);
    this.set('backstage', backstage);
    this.set('layer', layer);
    this.set('background', background);
    this.set('props', props);
    this.set('extras', extras);
    this.set('actors', actors);
  }

});

} // BLOSSOM