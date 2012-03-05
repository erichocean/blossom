// ==========================================================================
// Project:   Blossom - Modern, Cross-Platform Application Framework
// Copyright: ©2012 Fohr Motion Picture Studios. All rights reserved.
// License:   Licensed under the GPLv3 license (see BLOSSOM-LICENSE).
// ==========================================================================
/*global ViewDemo */

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

var MyLayer = SC.Layer.extend({

  cornerRadius: 15,

  dragPoint: null,

  render: function(ctx) {
    // console.log('MyLayer.render()', SC.guidFor(this));
    var benchKey = 'MyLayer#render()';
    SC.Benchmark.start(benchKey);

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
    var dragPoint = this.dragPoint;
    if (dragPoint) {
      ctx.fillText("<%@, %@>".fmt(dragPoint.x.toFixed(), dragPoint.y.toFixed()),ctx.width/2, ctx.height/2);
    }
    ctx.fillText("The future of SproutCore.", (ctx.width/4)*3, (ctx.height/4)*3);

    SC.Benchmark.end(benchKey);
  }

});

function main() {
  var blueLayer;
  var surface = SC.View.create({

    mouseMoved: function(evt) {
      if (evt.layer) document.body.style.cursor = "pointer";
      else document.body.style.cursor = "default";
    },

    mouseDown: function(evt) {
      if (evt.layer) {
        if (evt.layer !== blueLayer) alert('Clicked on the '+evt.layer.get('color')+' layer.');
        else {
          SC.app.dragDidStart(this, evt);
          blueLayer.dragPoint = evt.hitPoint;
          blueLayer.triggerRendering();
        }
        return true;
      }
    },

    mouseDragged: function(evt) {
      blueLayer.dragPoint = evt.hitPoint;
      blueLayer.triggerRendering();
    },

    mouseUp: function(evt) {
      blueLayer.dragPoint = null;
      blueLayer.triggerRendering();
    }

  });

  surface.get('layers').pushObject(MyLayer.create({
    layout: { centerX: -40, centerY: -40, width: 600, height: 480 },
    color: magenta,
    tag: 1
  }));

  surface.get('layers').pushObject(MyLayer.create({
    layout: { centerX: -20, centerY: -20, width: 600, height: 480 },
    color: violet,
    tag: 2
  }));

  blueLayer = MyLayer.create({
    layout: { centerX: 0, centerY: 0, width: 600, height: 480 },
    color: blue,
    tag: 3
  });
  surface.get('layers').pushObject(blueLayer);

  SC.Application.create();
  SC.app.set('ui', surface);
}
