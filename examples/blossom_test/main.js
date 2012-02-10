// ==========================================================================
// Project:   Blossom - Modern, Cross-Platform Application Framework
// Copyright: ©2012 Fohr Motion Picture Studios. All rights reserved.
// License:   Licensed under the GPLv3 license (see BLOSSOM-LICENSE).
// ==========================================================================
/*global BlossomTest */

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

window.requestAnimFrame = function(callback) {
  return window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.oRequestAnimationFrame ||
    window.msRequestAnimationFrame ||
    function(callback) { window.setTimeout(callback, 1000 / 60); };
}();

function roundRect(ctx, x, y, width, height, radius) {
  if (typeof radius === "undefined") {
    radius = 5;
  }
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

var buttonWidth = 100;

function drawButton(ctx, pressed) {
  ctx.save();
  ctx.translate(20, 165);
  var gradient = ctx.createLinearGradient(0,0,0,24); // vertical
  gradient.addColorStop(0, base3);
  gradient.addColorStop(0.5, base2);
  gradient.addColorStop(1, base3);
  ctx.fillStyle = gradient;
  // ctx.fillRect(0, 0, 140, 24);
  roundRect(ctx, 0,0,buttonWidth,24);
  ctx.fill();
  ctx.strokeStyle = pressed? base2 : white;
  ctx.lineWidth = 1;
  // ctx.strokeRect(0.5, 0.5, 139, 23);
  roundRect(ctx, 0.5, 0.5, buttonWidth-1, 23);
  ctx.stroke();
  ctx.strokeStyle = pressed? white : base2;
  // ctx.beginPath();
  // ctx.moveTo(0.5, 24.5);
  // ctx.lineTo(139.5, 24.5);
  // ctx.stroke();
  // ctx.strokeRect(-0.5, -0.5, 141, 25);
  roundRect(ctx, -0.5, -0.5, buttonWidth+1, 25);
  if (!pressed) ctx.stroke();
  ctx.font ="12pt Calibri";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = white;
  var text = "OK";
  if (!pressed) ctx.fillText(text, buttonWidth/2, 13);
  ctx.fillStyle = pressed? base01 : green;
  ctx.fillText(text, buttonWidth/2, 12);
  ctx.restore();
}

function main() {
  var surface = SC.ViewSurface.create({

    contentView: SC.View.extend({
      // layout: { centerX: 0, width: 0.5, centerY: 0, height: 0.5 },
      layout: { top: 10, right: 10, bottom: 10, left: 10 },
      cornerRadius: 25,
    
      render: function(ctx) {
        var benchKey = 'MyView#render()';
        SC.Benchmark.start(benchKey);

        console.log('MyView.render()', SC.guidFor(this));
        ctx.beginPath();
        this.get('layer').renderHitTestPath(ctx);
        ctx.fillStyle = green;
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
      },

      childViews: 'foo button'.w(),

      foo: SC.View.extend({
        layout: { centerX: 0, width: 0.3, centerY: 0, height: 0.3 },
        cornerRadius: 25,

        mouseDown:    function(evt) { alert("You clicked the blue subview."); },
        mouseEntered: function(evt) { document.body.style.cursor = 'pointer'; },
        mouseExited:  function(evt) { document.body.style.cursor = 'default'; },

        render: function(ctx, layer) {
          var benchKey = 'foo#render()';
          SC.Benchmark.start(benchKey);

          console.log('foo.render()', SC.guidFor(this));
          var w = ctx.width, h = ctx.height;

          ctx.beginPath();
          this.get('layer').renderHitTestPath(ctx);
          ctx.fillStyle = blue;
          ctx.fill();

          // Draw some text.
          ctx.fillStyle = base3;
          ctx.font = "14pt Calibri";
          ctx.textBaseline = "middle";
          ctx.textAlign = "center";
          ctx.shadowBlur = 0;
          ctx.shadowColor = "rgba(0,0,0,0)";
          ctx.fillText("I'm a subview.", ctx.width/2, ctx.height/4);
          ctx.fillText("Click Me.", ctx.width/2, (ctx.height/4)*3);

          SC.Benchmark.end(benchKey);
        }
      }),

      button: BlossomTest.ButtonView.extend({
        layout: { top: 50, right: 50, width: 140, height: 24 },
        title: "Regular Button",
        theme: 'regular',
        buttonBehavior: SC.PUSH_BEHAVIOR
      })
    })
  });

  SC.Application.create();
  SC.app.set('ui', surface);

  // var surface2 = SC.Surface.create({
  //   layout: { top: 0, right: 0, bottom: 0, left: 0 },
  //   // layout: { centerX: 0, centerY: 0, width: 1000, height: 800 },
  //   render: function(ctx) {
  //     // Draw background.
  //     ctx.fillStyle = base03;
  //     ctx.fillRect(0, 0, ctx.width, ctx.height);
  //     // ctx.strokeStyle = base00;
  //     // ctx.lineWidth = 2; // overlap of 1 on the inside
  //     // ctx.strokeRect(0, 0, ctx.width, ctx.height);
  // 
  //     var w = ctx.width, h = ctx.height;
  // 
  //     // Draw lines overlay.
  //     ctx.beginPath();
  //     var hline = h/2;
  //     if (h%2 === 0) hline += 0.5;
  //     ctx.moveTo(0, hline);
  //     ctx.lineTo(w, hline);
  //     var vline = w/2;
  //     if (w%2 === 0) vline += 0.5;
  //     ctx.moveTo(vline, 0);
  //     ctx.lineTo(vline, h);
  //     ctx.strokeStyle = green;
  //     ctx.lineWidth = 0.5;
  //     ctx.stroke();
  //     ctx.beginPath();
  //     ctx.arc(w/2, h/2, 3, 0, 2*Math.PI, false);
  //     ctx.fillStyle = green;
  //     ctx.fill();
  //     ctx.beginPath();
  //     ctx.arc(w/2, h/2, 15, 0, 2*Math.PI, false);
  //     ctx.lineWidth = 0.5;
  //     ctx.stroke();
  //   }
  // });

  // setTimeout(function() {
  //   SC.app.set('ui', surface2);
  // }, 3500);
  // setTimeout(function() {
  //   SC.app.set('ui', surface);
  // }, 5000);
  // setTimeout(function() {
  //   SC.app.set('ui', null);
  // }, 7000);
  // setTimeout(function() {
  //   window.location.reload();
  // }, 8000);
}

// function main() {
//   var w = 853, h = 553;
//   var pane = SC.Pane.create({
//     layout: { top: 10, left: 10, width: w, height: h }
//   });
// 
//   pane.attach();
// 
//   var layer = SC.Layer.create({
//     // layout: { top: 40, left: 50, width: 200, height: 200 },
//     layout: { centerX: 0, width: 0.5, centerY: 0, height: 0.5 },
//     cornerRadius: 25
//   });
// 
//   // Simulate proper layer setup for now.
//   pane.layer.sublayers.push(layer);
//   layer.superlayer = pane.layer;
//   layer.view = SC.View.create({
//     pane: pane,
//     mouseDown:    function(evt) { alert('clicked view'); },
//     mouseEntered: function(evt) { document.body.style.cursor = "pointer"; },
//     mouseExited:  function(evt) { document.body.style.cursor = "default"; }
//   });
// 
//   layer._sc_layoutFunction(layer._sc_layoutValues, 850, 550, layer._sc_anchorPoint[0], layer._sc_anchorPoint[1],layer._sc_position, layer._sc_bounds);
// 
//   function draw() {
//     var ctx = pane.getPath('layer.context');
// 
//     ctx.clearRect(0,0,w,h);
// 
//     // Draw background.
//     ctx.fillStyle = base3;
//     ctx.fillRect(0, 0, ctx.width, ctx.height);
//     ctx.strokeStyle = base0;
//     ctx.lineWidth = 2; // overlap of 1 on the inside
//     ctx.strokeRect(0, 0, ctx.width, ctx.height);
// 
//     // Draw something so we can see where to click.
//     layer._sc_transformFromSuperlayerToLayerIsDirty = true;
//     layer._sc_computeTransformFromSuperlayerToLayer();
//     ctx.save();
//     var t = layer._sc_transformFromSuperlayerToLayer;
//     ctx.setTransform(t[0], t[1], t[2], t[3], t[4], t[5]);
//     ctx.beginPath();
//     layer.renderHitTestPath(ctx);
//     ctx.fillStyle = green;
//     ctx.shadowOffsetX = 0;
//     ctx.shadowOffsetY = 15;
//     ctx.shadowBlur = 25;
//     ctx.shadowColor = "rgba(0,0,0,0.3)";
//     ctx.fill();
// 
//     // Draw some text.
//     var bounds = layer.get('bounds');
//     ctx.fillStyle = base3;
//     ctx.font = "16pt Calibri";
//     ctx.textBaseline = "middle";
//     ctx.textAlign = "center";
//     ctx.shadowBlur = 0;
//     ctx.shadowColor = "rgba(0,0,0,0)";
//     ctx.fillText("Hello from Blossom.", bounds.width/2, bounds.height/2-20);
//     ctx.restore();
// 
//     // Draw lines overlay.
//     ctx.beginPath();
//     ctx.moveTo(0, h/2);
//     ctx.lineTo(w, h/2);
//     ctx.moveTo(w/2, 0);
//     ctx.lineTo(w/2, h);
//     ctx.strokeStyle = orange;
//     ctx.lineWidth = 0.5;
//     ctx.stroke();
//     ctx.beginPath();
//     ctx.arc(w/2, h/2, 3, 0, 2*Math.PI, false);
//     ctx.fillStyle = orange;
//     ctx.fill();
//     ctx.beginPath();
//     ctx.arc(w/2, h/2, 15, 0, 2*Math.PI, false);
//     ctx.lineWidth = 0.5;
//     ctx.stroke();
//   }
// 
//   var rotation = 0;
//   function animate(lastTime) {
//     var date = new Date(),
//         time = date.getTime(),
//         timeDiff = time - lastTime,
//         angularSpeed = 0.1, // revolutions per second
//         angularDiff = angularSpeed * 2 * Math.PI * timeDiff / 1000;
// 
//     // console.log(1000 / timeDiff); // log fps
// 
//     // rotate layer
//     rotation += angularDiff;
//     // rotation (should be happenning around the anchorPoint!)
//     layer.get('transform').m11 =  Math.cos(rotation);
//     layer.get('transform').m12 =  Math.sin(rotation);
//     layer.get('transform').m21 = -Math.sin(rotation);
//     layer.get('transform').m22 =  Math.cos(rotation);
// 
// 
//     draw();
//     window.requestAnimFrame(function() { animate(time); });
//   }
// 
//   animate(new Date().getTime()); // start our drawing loop
// }

// function main() {
//   var pane = SC.Pane.create({
//     layout: { top: 10, left: 10, width: 850, height: 550 }
//   });
// 
//   pane.attach();
//   var ctx = pane.getPath('layer.context');
// 
//   ctx.fillStyle = base3;
//   ctx.fillRect(0, 0, ctx.width, ctx.height);
//   ctx.strokeStyle = base0;
//   ctx.lineWidth = 2; // overlap of 1 on the inside
//   ctx.strokeRect(0, 0, ctx.width, ctx.height);
// 
//   ctx.fillStyle = base00;
//   ctx.font = "14pt Calibri";
//   ctx.textBaseline = "top";
//   ctx.fillText("SC.ButtonView Sampler", 15, 10);
// 
//   ctx.fillStyle = green;
//   ctx.font = "10pt Calibri";
//   ctx.fillText("Rendered with Blossom\u2122", 40, 33);
// 
//   ctx.font = "10pt Calibri";
//   ctx.textAlign = "center";
//   ctx.textBaseline = "middle";
//   ctx.fillStyle = base1;
//   'Enabled Disabled Selected Selected&Disabled'.w().forEach(function(title, idx) {
//     ctx.fillText(title.split('&').join(' & '), 270+idx*150, 46);
//   });
// 
//   ctx.textAlign = "right";
//   var anchors = [70, 190, 310, 430];
//   'PUSH TOGGLE TOGGLE_ON TOGGLE_OFF'.w().forEach(function(behavior, idx) {
//     ctx.fillText('SC.'+behavior+'_BEHAVIOR:', 180, 103+idx*120);
// 
//     var anchor = anchors[idx];
//     var buttonBehavior = SC[behavior+'_BEHAVIOR'];
//     var button = BlossomTest.ButtonPane.create({
//       layout: { top: anchor, left: 210, width: 140, height: 24 },
//       title: "Regular Button",
//       theme: 'regular',
//       action: function() {
//         alert("Hi from Blossom");
//       },
//       buttonBehavior: buttonBehavior
//     });
//     button.attach();
// 
//     var buttonD = BlossomTest.ButtonPane.create({
//       layout: { top: anchor, left: 360, width: 140, height: 24 },
//       title: "Regular Button",
//       theme: 'regular',
//       isEnabled: false,
//       buttonBehavior: buttonBehavior
//     });
//     buttonD.attach();
// 
//     var buttonS = BlossomTest.ButtonPane.create({
//       layout: { top: anchor, left: 510, width: 140, height: 24 },
//       title: "Regular Button",
//       theme: 'regular',
//       isSelected: true,
//       buttonBehavior: buttonBehavior
//     });
//     buttonS.attach();
// 
//     var buttonDS = BlossomTest.ButtonPane.create({
//       layout: { top: anchor, left: 660, width: 140, height: 24 },
//       title: "Regular Button",
//       theme: 'regular',
//       isEnabled: false,
//       isSelected: true,
//       buttonBehavior: buttonBehavior
//     });
//     buttonDS.attach();
// 
//     var button2 = BlossomTest.ButtonPane.create({
//       layout: { top: anchor+30, left: 210, width: 140, height: 24 },
//       title: "Square Button",
//       theme: 'square',
//       buttonBehavior: buttonBehavior
//     });
//     button2.attach();
// 
//     var button2D = BlossomTest.ButtonPane.create({
//       layout: { top: anchor+30, left: 360, width: 140, height: 24 },
//       title: "Square Button",
//       theme: 'square',
//       isEnabled: false,
//       buttonBehavior: buttonBehavior
//     });
//     button2D.attach();
// 
//     var button2S = BlossomTest.ButtonPane.create({
//       layout: { top: anchor+30, left: 510, width: 140, height: 24 },
//       title: "Square Button",
//       theme: 'square',
//       isSelected: true,
//       buttonBehavior: buttonBehavior
//     });
//     button2S.attach();
// 
//     var button2DS = BlossomTest.ButtonPane.create({
//       layout: { top: anchor+30, left: 660, width: 140, height: 24 },
//       title: "Square Button",
//       theme: 'square',
//       isEnabled: false,
//       isSelected: true,
//       buttonBehavior: buttonBehavior
//     });
//     button2DS.attach();
// 
//     var button3 = BlossomTest.ButtonPane.create({
//       layout: { top: anchor+60, left: 210, width: 140, height: 24 },
//       title: "Capsule Button",
//       theme: 'capsule',
//       buttonBehavior: buttonBehavior
//     });
//     button3.attach();
// 
//     var button3D = BlossomTest.ButtonPane.create({
//       layout: { top: anchor+60, left: 360, width: 140, height: 24 },
//       title: "Capsule Button",
//       theme: 'capsule',
//       isEnabled: false,
//       buttonBehavior: buttonBehavior
//     });
//     button3D.attach();
// 
//     var button3S = BlossomTest.ButtonPane.create({
//       layout: { top: anchor+60, left: 510, width: 140, height: 24 },
//       title: "Capsule Button",
//       theme: 'capsule',
//       isSelected: true,
//       buttonBehavior: buttonBehavior
//     });
//     button3S.attach();
// 
//     var button3DS = BlossomTest.ButtonPane.create({
//       layout: { top: anchor+60, left: 660, width: 140, height: 24 },
//       title: "Capsule Button",
//       theme: 'capsule',
//       isEnabled: false,
//       isSelected: true,
//       buttonBehavior: buttonBehavior
//     });
//     button3DS.attach();
//   });
// }

// function main() {
//   var rect = SC.MakeRect(1,2,3,4);
//   console.log(rect.x, rect.y, rect.width, rect.height);
//   rect.x = 10;
//   rect.y = 20;
//   rect.width = 30;
//   rect.height = 40;
//   console.log(rect.x, rect.y, rect.w, rect.h);     // alternate access to width and height
//   console.log(rect[0], rect[1], rect[2], rect[3]); // should be identical to previous line
//   
//   var point = SC.MakePoint(5,6);
//   console.log(point.width, point.height);
//   point.x = 50;
//   point.y = 60;
//   console.log(point.x, point.y);
//   console.log(point[0], point[1]); // should be identical to previous line
// 
//   var size = SC.MakeSize(7,8);
//   console.log(size.width, size.height);
//   size.width = 70;
//   size.height = 80;
//   console.log(size.w, size.h);   // alternate access to width and height
//   console.log(size[0], size[1]); // should be identical to previous line
// }

// function main() {
//   var pane = SC.Pane.create({
//     layout: { top: 10, left: 10, width: 800, height: 600 },
//     containerId: 'container',
// 
//     transitions: {
//       "opacity": SC.PropertyAnimation.create({
//         duration: '300ms',
//         timingFunction: 'linear'
//       }),
//       "top": SC.PropertyAnimation.create({
//         duration: '300ms',
//         timingFunction: 'ease-in-out'
//       }),
//       "left": SC.PropertyAnimation.create({
//         duration: '300ms',
//         timingFunction: 'ease-in-out'
//       })
//     },
// 
//     _firstTime: true,
//     mouseDown: function(evt) {
//       if (this._firstTime) {
//         this.set('left', '400px');
//         this.set('top', '200px');
//         this.set('opacity', 0.25);
//         this._firstTime = false;
//       } else {
//         this.set('left', '10px');
//         this.set('top', '10px');
//         this.set('opacity', 1.0);
//         this._firstTime = true;
//       }
//     }
//   });
// 
//   pane.attach(); // Must currently attach *before* drawing.
// 
//   var view = SC.View.create({
//     layout: { top: 0, left: 0, width: 200, height: 150 },
//     render: function(context) {
//       // draw the background
//       context.fillStyle = 'red';
//       context.fillRect(0, 0, context.width, context.height);
// 
//       // draw an inset, white outline
//       context.strokeStyle = 'white';
//       context.lineWidth = 1;
//       context.strokeRect(1.5, 1.5, context.width-3, context.height-3);
// 
//       // draw some text
//       context.fillStyle = 'white';
//       context.font = "16pt Calibri";
//       context.textAlign = "center";
//       context.textBaseline = "middle";
//       context.fillText("SC.Layer", context.width/2, context.height/2);
//     }
//   });
// 
//   var context = view.getPath('layer.context');
//   view.render(context);
//   
//   var ctx = pane.getPath('layer.context');
// 
//   ctx.fillStyle = 'white';
//   ctx.fillRect(0, 0, ctx.width, ctx.height);
//   ctx.strokeStyle = base0;
//   ctx.lineWidth = 2; // overlap of 1 on the inside
//   ctx.strokeRect(0, 0, ctx.width, ctx.height);
//   ctx.fillStyle = base00;
//   ctx.font = "16pt Calibri";
//   ctx.textBaseline = "top";
//   ctx.fillText("SC.Pane", 10, 5);
//   ctx.drawLayer(view.get('layer'), 10, 100); // can't use drawImage because it takes DOM elements!
// 
//   // SC.spriteLayer.registerDependentSprite({
//   //   spriteLayerDidLoad: function() {
//   //     SC.capsuleButtonRenderer.renderEnabled(ctx, "Rounded Button", 220, 100, 140, 24);
//   //     ctx.fillRect(220, 130, 140, 24);
//   // 
//   //     SC.rectangleButtonRenderer.renderEnabled(ctx, "Rectangle Button", 220, 164, 140, 24);
//   //     ctx.fillRect(220, 194, 140, 24);
//   //   }
//   // });
// }
