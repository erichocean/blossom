// ==========================================================================
// Project:   Blossom - Modern, Cross-Platform Application Framework
// Copyright: ©2012 Fohr Motion Picture Studios. All rights reserved.
// License:   Licensed under the GPLv3 license (see BLOSSOM-LICENSE).
// ==========================================================================
/*globals BlossomTest */

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

SC.spriteImage = SC.Image.create({
  source: "static/sc-theme-repeat-x.png",

  imageDidLoad: function() {
    // console.log('SC.spriteImage#imageDidLoad()');
    SC.run(function() {
      SC.spriteLayer.set('content', this);
      SC.spriteLayer.flushDependentSprites();
    }, this);
  }
});

SC.spriteLayer = SC.ImageLayer.create({

  dependentSprites: [],
  registerDependentSprite: function(sprite) {
    if (this.ready) sprite.spriteLayerDidLoad(this);
    else this.dependentSprites.push(sprite);
  },

  flushDependentSprites: function() {
    this.ready = true;
    var ary = this.dependentSprites, idx, len;
    for (idx=0, len=ary.length; idx<len; ++idx) {
      ary[idx].spriteLayerDidLoad(this);
    }
  }

});

SC.ButtonRenderer = SC.Object.extend({

  enabledLeftLayer: null,
  enabledRightLayer: null,
  enabledCenterLayer: null,

  enabledLeftStartX: 0,
  enabledLeftStartY: 0,
  enabledRightStartX: 0,
  enabledRightStartY: 0,
  enabledPatternStartX: 0,
  enabledPatternStartY: 0,

  endWidth: 0,
  patternWidth: 0,
  buttonHeight: 0,

  spriteLayerDidLoad: function(imageLayer) {
    this.ready = true;

    var endWidth = this.get('endWidth'),
        patternWidth = this.get('patternWidth'),
        buttonHeight = this.get('buttonHeight'),
        enabledLeftStartX = this.get('enabledLeftStartX'),
        enabledLeftStartY = this.get('enabledLeftStartY'),
        enabledRightStartX = this.get('enabledRightStartX'),
        enabledRightStartY = this.get('enabledRightStartY'),
        enabledPatternStartX = this.get('enabledPatternStartX'),
        enabledPatternStartY = this.get('enabledPatternStartY');

    var enabledCenterLayer = SC.Layer.create({ width: patternWidth, height: buttonHeight });
    enabledCenterLayer.get('context').drawLayer(imageLayer,
        enabledPatternStartX, enabledPatternStartY, patternWidth, buttonHeight,
        0, 0, patternWidth, buttonHeight
      );

    var enabledLeftLayer = SC.Layer.create({ width: endWidth, height: buttonHeight });
    enabledLeftLayer.get('context').drawLayer(imageLayer,
        enabledLeftStartX, enabledLeftStartY, endWidth, buttonHeight,
        0, 0, endWidth, buttonHeight
      );

    var enabledRightLayer = SC.Layer.create({ width: endWidth, height: buttonHeight });
    enabledRightLayer.get('context').drawLayer(imageLayer,
        enabledRightStartX, enabledRightStartY, endWidth, buttonHeight,
        0, 0, endWidth, buttonHeight
      );

    this.set('enabledLeftLayer', enabledLeftLayer);
    this.set('enabledRightLayer', enabledRightLayer);
    this.set('enabledCenterLayer', enabledCenterLayer);
  },

  renderState: function(context, selected, disabled, mixed, active, title, x, y, w, h) {
    console.log('title:',title);
    console.log('selected:',selected);
    console.log('disabled:',disabled);
    console.log('mixed:',mixed);
    console.log('active:',active);

    this.renderEnabled(context, title, x, y, w, h);
  },

  renderEnabled: function(context, title, x, y, w, h) {
    if (!this.ready) return;

    var pattern = this.get('enabledCenterLayer').patternForContext(context, 'repeat-x'),
        enabledLeftLayer = this.get('enabledLeftLayer'),
        enabledRightLayer = this.get('enabledRightLayer'),
        endWidth = this.get('endWidth');

    context.save();
    context.translate(x, y);
    context.drawLayer(enabledLeftLayer, 0, 0, endWidth, h);
    context.drawLayer(enabledRightLayer, w-endWidth, 0, endWidth, h);
    context.fillStyle = pattern;
    context.fillRect(endWidth, 0, w-endWidth*2, h);
    context.font = "11pt Calibri";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillStyle = 'white';
    context.fillText(title, w/2, h/2+1);
    context.fillStyle = base01;
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
  buttonHeight: 24,

  enabledPatternStartX: 0, enabledPatternStartY: 764

});

SC.regularButtonRenderer = SC.WhiteButtonRenderer.create({

  enabledLeftStartX: 0, enabledLeftStartY: 789,
  enabledRightStartX: 37, enabledRightStartY: 814

});

SC.rectangleButtonRenderer = SC.WhiteButtonRenderer.create({

  enabledLeftStartX: 0, enabledLeftStartY: 839,
  enabledRightStartX: 37, enabledRightStartY: 864

});

SC.capsuleButtonRenderer = SC.WhiteButtonRenderer.create({

  enabledLeftStartX: 1, enabledLeftStartY: 197,
  enabledRightStartX: 36, enabledRightStartY: 224

});

