// ==========================================================================
// Project:   Blossom - Modern, Cross-Platform Application Framework
// Copyright: ©2012 Fohr Motion Picture Studios. All rights reserved.
// License:   Licensed under the GPLv3 license (see BLOSSOM-LICENSE).
// ==========================================================================
/*globals ViewDemo */

sc_require('sprite_layer');

var base03 =   "#002b36";
var base02 =   "#073642";
var base01 =   "#586e75";
var base00 =   "#657b83";
var base0 =    "#839496";
var base1 =    "#93a1a1";
var base2 =    "#eee8d5";
var base3 =    "#fdf6e3";
var yellow =   "#b58900";
var orange =   "#cb4b16";
var red =      "#dc322f";
var magenta =  "#d33682";
var violet =   "#6c71c4";
var blue =     "#268bd2";
var cyan =     "#2aa198";
var green =    "#859900";

if (!Function.prototype.bind) {  
  Function.prototype.bind = function (oThis) {  
    if (typeof this !== "function") {  
      // closest thing possible to the ECMAScript 5 internal IsCallable function  
      throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");  
    }  
  
    var aArgs = Array.prototype.slice.call(arguments, 1),   
        fToBind = this,   
        fNOP = function () {},  
        fBound = function () {  
          return fToBind.apply(this instanceof fNOP  
                                 ? this  
                                 : oThis || window,  
                               aArgs.concat(Array.prototype.slice.call(arguments)));  
        };  
  
    fNOP.prototype = this.prototype;  
    fBound.prototype = new fNOP();  
  
    return fBound;  
  };  
}

SC.ButtonRenderer = SC.Object.extend({

  endWidth: 0,
  patternWidth: 0,
  buttonHeight: 0,

  spriteLayerDidLoad: function(spriteLayer) {
    this.ready = true;

    var endWidth = this.get('endWidth'),
        patternWidth = this.get('patternWidth'),
        buttonHeight = this.get('buttonHeight');

    'enabled disabled depressed depressedSelected selected disabledSelected mixed'.w().forEach(function(type) {
      var hash = this.get(type);
      if (!hash) return;

      var patternLayer = SC.Layer.create({ width: patternWidth, height: buttonHeight });
      patternLayer.get('context').drawLayer(spriteLayer,
          hash.pattern.x, hash.pattern.y, patternWidth, buttonHeight,
          0, 0, patternWidth, buttonHeight
        );
      hash.pattern.layer = patternLayer;

      var leftLayer = SC.Layer.create({ width: endWidth, height: buttonHeight });
      leftLayer.get('context').drawLayer(spriteLayer,
          hash.left.x, hash.left.y, endWidth, buttonHeight,
          0, 0, endWidth, buttonHeight
        );
      hash.left.layer = leftLayer;

      var rightLayer = SC.Layer.create({ width: endWidth, height: buttonHeight });
      rightLayer.get('context').drawLayer(spriteLayer,
          hash.right.x, hash.right.y, endWidth, buttonHeight,
          0, 0, endWidth, buttonHeight
        );
      hash.right.layer = rightLayer;
    }.bind(this));
  },

  render: function(context, selected, disabled, mixed, active, title, x, y, w, h) {
    // console.log('title:',title);
    // console.log('selected:',selected);
    // console.log('disabled:',disabled);
    // console.log('mixed:',mixed);
    // console.log('active:',active);

    if (!this.ready) return;

    var hash;
    if (disabled) {
      if (selected) hash = this.get('disabledSelected');
      else hash = this.get('disabled');
    }
    else if (selected) hash = this.get('selected');
    else hash = this.get('enabled');
    if (!hash) {
      context.save();
      context.translate(x, y);
      context.font = "10pt Calibri";
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillStyle = base1;
      context.fillText("(not available)", w/2, h/2);
      context.restore();
      return;
    }

    var pattern = hash.pattern.layer.patternForContext(context, 'repeat-x'),
        endWidth = this.get('endWidth');

    context.save();
    context.translate(x, y);
    context.drawLayer(hash.left.layer, 0, 0, endWidth, h);
    context.drawLayer(hash.right.layer, w-endWidth, 0, endWidth, h);
    context.fillStyle = pattern;
    context.fillRect(endWidth, 0, w-endWidth*2, h);
    var dhash, dpattern;
    if (active) {
      dhash = selected ? this.get('depressedSelected') : this.get('depressed');
      if (dhash) {
        dpattern = dhash.pattern.layer.patternForContext(context, 'repeat-x');
        context.globalAlpha = 0.3;
        context.drawLayer(dhash.left.layer, 0, 0, endWidth, h);
        context.drawLayer(dhash.right.layer, w-endWidth, 0, endWidth, h);
        context.fillStyle = dpattern;
        context.fillRect(endWidth, 0, w-endWidth*2, h);
        context.globalAlpha = 1.0; // reset
      }
    }
    context.font = "11pt Calibri";
    context.textAlign = "center";
    context.textBaseline = "middle";
    if (hash.font.shadow) {
      context.fillStyle = 'white';
      context.fillText(title, w/2, h/2+1);
    }
    context.fillStyle = active && dhash? dhash.font.color : hash.font.color;
    context.fillText(title, w/2, h/2);
    context.restore();
  },

  init: function() {
    arguments.callee.base.apply(this, arguments);
    SC.spriteLayer.registerDependentSprite(this);
  }

});

SC.WhiteButtonRenderer = SC.ButtonRenderer.extend({

  endWidth: 11,
  patternWidth: 8,
  buttonHeight: 24

});

SC.regularButtonRenderer = SC.WhiteButtonRenderer.create({

  enabled: {
    left: { x: 0, y: 789 },
    right: { x: 37, y: 814 },
    pattern: { x: 0, y: 764 },
    font: { color: base01, shadow: true }
  },

  disabled: {
    left: { x: 0, y: 1038 },
    right: { x: 37, y: 1064 },
    pattern: { x: 0, y: 1014 },
    font: { color: base0, shadow: true }
  },

  selected: {
    left: { x: 0, y: 1164 },
    right: { x: 37, y: 1190 },
    pattern: { x: 0, y: 1140 },
    font: { color: 'white', shadow: false }
  },

  disabledSelected: {
    left: { x: 0, y: 1416 },
    right: { x: 37, y: 1442 },
    pattern: { x: 0, y: 1392 },
    font: { color: 'rgba(255,255,255,0.85)', shadow: false }
  },

  depressed: {
    left: { x: 0, y: 913 },
    right: { x: 37, y: 939 },
    pattern: { x: 0, y: 889 },
    font: { color: base02, shadow: true }
  },

  depressedSelected: {
    left: { x: 0, y: 913 },
    right: { x: 37, y: 939 },
    pattern: { x: 0, y: 889 },
    font: { color: 'rgba(255,255,255,0.85)', shadow: true }
  }

});

SC.rectangleButtonRenderer = SC.WhiteButtonRenderer.create({

  enabled: {
    left: { x: 0, y: 839 },
    right: { x: 37, y: 864 },
    pattern: { x: 0, y: 764 },
    font: { color: base01, shadow: true }
  },

  disabled: {
    left: { x: 0, y: 1089 },
    right: { x: 37, y: 1114 },
    pattern: { x: 0, y: 1014 },
    font: { color: base0, shadow: true }
  },

  selected: {
    left: { x: 0, y: 1215 },
    right: { x: 37, y: 1240 },
    pattern: { x: 0, y: 1140 },
    font: { color: 'white', shadow: false }
  },

  disabledSelected: {
    left: { x: 0, y: 1467 },
    right: { x: 37, y: 1492 },
    pattern: { x: 0, y: 1392 },
    font: { color: 'rgba(255,255,255,0.85)', shadow: false }
  },

  depressed: {
    left: { x: 0, y: 964 },
    right: { x: 37, y: 989 },
    pattern: { x: 0, y: 889 },
    font: { color: base02, shadow: true }
  },

  depressedSelected: {
    left: { x: 0, y: 964 },
    right: { x: 37, y: 989 },
    pattern: { x: 0, y: 889 },
    font: { color: 'rgba(255,255,255,0.85)', shadow: true }
  }

});

SC.capsuleButtonRenderer = SC.WhiteButtonRenderer.create({

  enabled: {
    left: { x: 1, y: 197 },
    right: { x: 36, y: 224 },
    pattern: { x: 0, y: 764 },
    font: { color: base01, shadow: true }
  },

  disabled: {
    left: { x: 1, y: 517 },
    right: { x: 36, y: 544 },
    pattern: { x: 0, y: 1014 },
    font: { color: base0, shadow: true }
  },

  selected: {
    left: { x: 1, y: 277 },
    right: { x: 36, y: 304 },
    pattern: { x: 0, y: 1140 },
    font: { color: 'white', shadow: false }
  },

  // disabledSelected: { // same as disabled
  //   left: { x: 1, y: 517 },
  //   right: { x: 36, y: 544 },
  //   pattern: { x: 0, y: 1014 },
  //   font: { color: base0, shadow: true }
  // },

  depressed: {
    left: { x: 1, y: 357 },
    right: { x: 36, y: 384 },
    pattern: { x: 0, y: 889 },
    font: { color: base02, shadow: true }
  },

  depressedSelected: {
    left: { x: 1, y: 357 },
    right: { x: 36, y: 384 },
    pattern: { x: 0, y: 889 },
    font: { color: 'rgba(255,255,255,0.85)', shadow: true }
  }

});

SC.checkboxButtonRenderer = SC.capsuleButtonRenderer;
SC.radioButtonRenderer = SC.capsuleButtonRenderer;

