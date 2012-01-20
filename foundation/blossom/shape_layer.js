// ==========================================================================
// Project:   Blossom - Modern, Cross-Platform Application Framework
// Copyright: ©2012 Fohr Motion Picture Studios. All rights reserved.
// License:   Licensed under the GPLv3 license (see BLOSSOM-LICENSE).
// ==========================================================================
/*globals BLOSSOM */

// Blossom's SC.ShapeLayer class was heavily inspired by KineticJS.
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

sc_require('blossom/layer');

if (BLOSSOM) {

SC.ShapeLayer = SC.Layer.extend({

  shapes: [],

  draw: function() {
    var context = this.get('context'),
        shapes = this.get('shapes');

    this.clear();

    for (var idx=0, len=shapes.length; idx<len; ++idx) {
        shapes[idx].display(context);
    }
  },

  addShape: function(shape) {
    var context = this.get('context'),
        shapes = this.get('shapes');

    shapes.push(shape);
    shape.set('zIndex', shapes.length - 1);
    shape.display(context);
  },

  moveShapeToTop: function(shape) {
    var index = shape.get('zIndex'),
        shapes = this.get('shapes');

    shapes.splice(index, 1);
    shapes.push(shape);
    this.updateIndices();
    this.draw();
  },

  removeShape: function(shape) {
    var index = shape.get('zIndex'),
        shapes = this.get('shapes');

    shapes.splice(index, 1);
    this.updateIndices();
    this.draw();
  },

  updateIndices: function() {
    var shapes = this.get('shapes');

    for (var idx=0, len=shapes.length; idx<len; ++idx) {
        shapes[idx].set('zIndex', idx);
    }
  },

  init: function() {
    sc_super();
    this.shapes = []; // Give ourself a fresh shapes array.
  }

});

} // BLOSSOM
