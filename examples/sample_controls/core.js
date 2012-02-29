// ==========================================================================
// Project:   Blossom - Modern, Cross-Platform Application Framework
// Copyright: ©2012 Fohr Motion Picture Studios. All rights reserved.
// License:   Licensed under the GPLv3 license (see BLOSSOM-LICENSE).
// ==========================================================================
/*globals global SampleControls */

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
var white =    "white";

SampleControls = global.SampleControls = SC.Object.create({

});

var MyLayer = SC.Layer.extend({

  cornerRadius: 15,

  render: function(ctx) {
    // console.log('MyLayer.render()', SC.guidFor(this));
    var benchKey = 'MyLayer#render()';
    SC.Benchmark.start(benchKey);

    // console.log('ctx.width', ctx.width, 'ctx.height', ctx.height);

    ctx.beginPath();
    this.renderHitTestPath(ctx);
    ctx.fillStyle = this.get('color');
    ctx.fill();

    // Draw some text.
    ctx.fillStyle = base3;
    ctx.font = "16pt Calibri";
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    ctx.shadowBlur = 0;
    ctx.shadowColor = "rgba(0,0,0,0)";
    ctx.fillText("Hello from Blossom.", ctx.width/4, ctx.height/4);
    ctx.fillText("The future of SproutCore.", (ctx.width/4)*3, (ctx.height/4)*3);

    SC.Benchmark.end(benchKey);
  }

});

function main() {
  SC.Application.create();

  var surface = SC.View.create();

  surface.get('layers').pushObject(MyLayer.create({
    layout: { centerX: -40, centerY: -40, width: 500, height: 240 },
    color: magenta
  }));

  surface.get('layers').pushObject(MyLayer.create({
    layout: { centerX: -20, centerY: -20, width: 500, height: 240 },
    color: violet
  }));

  surface.get('layers').pushObject(MyLayer.create({
    layout: { centerX: 0, centerY: 0, width: 500, height: 240 },
    color: blue
  }));

  var Pane = SC.View.extend({
    updateDisplay: function() {
      // console.log('pane#updateDisplay()', SC.guidFor(this));
      var psurface = SC.psurfaces[this.__id__],
          canvas = psurface? psurface.__element__ : null,
          ctx = canvas? canvas.getContext('2d') : null,
          w = canvas.width, h = canvas.height;

      ctx.save();

      // console.log('w', w, 'h', h);

      // Clear background.
      ctx.clearRect(0, 0, w, h);

      // Draw fps meter.
      ctx.fillStyle = green;
      ctx.font = "16pt Calibri";
      ctx.textBaseline = "middle";
      ctx.textAlign = "center";
      ctx.fillText("(click me)", w/2, 50);
      ctx.fillText(SC.Benchmark.fps(), w/2, h/2);

      ctx.restore();
    },

    click: function(evt) {
      // console.log('pane#click');
      var color = "rgb(%@,%@,%@)".fmt(Math.floor(Math.random()*255), Math.floor(Math.random()*255), Math.floor(Math.random()*255));
      this.set('backgroundColor', color);
      color = "rgb(%@,%@,%@)".fmt(Math.floor(Math.random()*255), Math.floor(Math.random()*255), Math.floor(Math.random()*255));
      this.set('borderColor', color);
      this.set('borderWidth', Math.floor(Math.random()*16));
      this.set('cornerRadius', Math.floor(Math.random()*31));
      return true;
    }
  });

  var pane = Pane.create(),
      pane2 = Pane.create(),
      split2 = SC.SplitSurface.create({
        // layoutDirection: SC.LAYOUT_VERTICAL,
        topLeftSurface: pane,
        bottomRightSurface: pane2
      });
  
  pane.set('backgroundColor', "white");
  pane.set('borderColor', "black");
  pane.set('borderWidth', 1);
  pane.set('cornerRadius', 5);

  var split = SC.SplitSurface.create({
    topLeftSurface: surface,
    bottomRightSurface: split2
  });

  SC.app.set('ui', split);
}