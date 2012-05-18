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

var MyLayer = SC.Layer.extend({

  cornerRadius: 15,

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
    ctx.fillText("The future of SproutCore.", (ctx.width/4)*3, (ctx.height/4)*3);

    SC.Benchmark.end(benchKey);
  }

});

function main() {
  var layout = SC.LayoutSurface.create();

  var view = SC.View.create({
    layout: { bottom: 10, right: 10, width: 0.5, height: 0.5 }
  });

  view.get('layers').pushObject(MyLayer.create({
    layout: { centerX: -40, centerY: -40, width: 600, height: 480 },
    color: magenta
  }));

  view.get('layers').pushObject(MyLayer.create({
    layout: { centerX: -20, centerY: -20, width: 600, height: 480 },
    color: violet
  }));

  view.get('layers').pushObject(MyLayer.create({
    layout: { centerX: 0, centerY: 0, width: 600, height: 480 },
    color: blue
  }));

  var view2 = SC.View.create({
    layout: { top: 10, right: 10, width: 0.4, height: 0.4 }
  });
  view2.set('backgroundColor', base3);

  layout.get('subsurfaces').pushObjects([view, view2]);

  SC.app.set('ui', layout);
  // debugger;

  var pane = SC.View.create({

    willRenderLayers: function(ctx) {
      // console.log('pane#willRenderLayers()', SC.guidFor(this));
      var w = ctx.width, h = ctx.height;

      // Clear background.
      ctx.clearRect(0, 0, w, h);

      // Draw fps meter.
      ctx.fillStyle = green;
      ctx.font = "16pt Calibri";
      ctx.textBaseline = "middle";
      ctx.textAlign = "center";
      ctx.fillText("(drag me)", w/2, 50);
      ctx.fillText(SC.Benchmark.fps(), w/2, h/2);

      var timingFunction = this.get('timingFunction');
      if (timingFunction) {
        ctx.fillText(timingFunction, w/2, h-50);
      }
    },

    mouseDown: function(evt) {
      // console.log('pane#mouseDown');
      this._clientX = evt.clientX;
      this._clientY = evt.clientY;
      this.set('opacity', 0.5);
      var transform = this.get('transform'),
          frame = this.get('frame');
      transform = SC.Transform3DRotateX(transform, Math.random()*(Math.PI/3));
      transform = SC.Transform3DRotateY(transform, Math.random()*(Math.PI/3));
      transform = SC.Transform3DScale(transform, (Math.random()*2)+0.5, (Math.random()*2)+0.5);
      // transform = SC.Transform3DTranslate(transform, (Math.random()*frame.x/10), (Math.random()*frame.y/10));
      this.set('transform', transform);
      return true;
    },

    mouseDragged: function(evt) {
      // console.log('pane#mouseDragged');
      SC.AnimationTransaction.begin({ duration: 0 });
      var frame = this.get('frame');
      frame.x = frame.x + evt.clientX - this._clientX;
      frame.y = frame.y + evt.clientY - this._clientY;
      this._clientX = evt.clientX;
      this._clientY = evt.clientY;
      SC.AnimationTransaction.end();
      return true;
    },

    mouseUp: function(evt) {
      // console.log('pane#mouseUp');
      SC.AnimationTransaction.begin({ duration: 0 });
      this.doingMouseUp = true;
      var frame = this.get('frame');
      frame.x = frame.x + evt.clientX - this._clientX;
      frame.y = frame.y + evt.clientY - this._clientY;
      this.set('frame', frame);
      this.doingMouseUp = false;
      delete this._clientX;
      delete this._clientY;
      SC.AnimationTransaction.end();
      this.set('opacity', 1.0);
      var color = "rgb(%@,%@,%@)".fmt(Math.floor(Math.random()*255), Math.floor(Math.random()*255), Math.floor(Math.random()*255));
      this.set('backgroundColor', color);
      color = "rgb(%@,%@,%@)".fmt(Math.floor(Math.random()*255), Math.floor(Math.random()*255), Math.floor(Math.random()*255));
      this.set('borderColor', color);
      this.set('borderWidth', Math.floor(Math.random()*16));
      this.set('cornerRadius', Math.floor(Math.random()*31));

      var sz = SC.app.computeViewportSize();
      frame.x = Math.random()*(sz.width-frame.width);
      frame.y = Math.random()*(sz.height-frame.height);

      var transform = this.get('transform');
      SC.SetIdentityTransform3D(transform);
      transform = SC.Transform3DRotateZ(transform, Math.random()*(Math.PI/3)*(Math.random() > 0.5? 1 : -1));
      this.set('transform', transform);

      this.shiftKey = evt.shiftKey;
      return true;
    },

    transitionForKey: function(key) {
      if (this.doingMouseUp && key === 'frame') {
        var keys = Object.keys(SC.TimingFunction), name;
        keys = keys.filter(function(key) { return key !== 'get'; });
        name = keys[Math.floor(Math.random()*keys.length)];
        this.set('timingFunction', name);
        return SC.TransitionAnimation.create({
          duration: this.shiftKey? 2000 : 400,
          timingFunction: SC.TimingFunction.get(name)
        });
      }
    }
  });
  
  var frame = SC.MakeRect(50, 50, 400, 200);
  pane.set('frame', frame);
  pane.set('backgroundColor', "white");
  pane.set('borderColor', "black");
  pane.set('borderWidth', 1);
  pane.set('cornerRadius', 5);
  pane.set('zIndex', 1);
  
  SC.app.get('surfaces').add(pane);
}
