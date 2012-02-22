/*globals  _ green */

var N = 100;

var Box = SC.Object.extend({

  top: 0,
  left: 0,
  content: 0,
  count: 0,

  surface: null,

  tick: function() {
    var count = this.get('count') + 1;
    this.beginPropertyChanges();
    this.set('count', count);
    this.set('top', Math.sin(count / 10) * 10);
    this.set('left', Math.cos(count / 10) * 10);
    this.set('color', count % 255);
    this.set('content', count % 100);
    this.endPropertyChanges();
    this.get('surface').triggerRendering();
  }

});

var boxes;

var blossomInit = function(surface) {
    boxes = _.map(_.range(N), function(i) {
        var box = Box.create();
        box.set('number', i);
        box.set('surface', surface);
        return box;
    });
};

var blossomAnimate = function() {
  SC.RunLoop.begin();

  for (var i = 0, l = boxes.length; i < l; i++) {
    boxes[i].tick();
  }

  SC.RunLoop.end();
  setTimeout(blossomAnimate, 0);
};

var PI2 = 2*Math.PI;

function main() {
  SC.Application.create(); // Assigns itself automatically to SC.app

  var surface = SC.View.create({

    updateDisplay: function() {
      var ctx = this.getPath('layer.context');

      ctx.save();

      // Draw background.
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, ctx.width, ctx.height);

      // Draw fps meter.
      ctx.fillStyle = green;
      ctx.font = "16pt Calibri";
      ctx.textBaseline = "middle";
      ctx.textAlign = "center";
      ctx.fillText(SC.Benchmark.fps(), ctx.width/2, ctx.height/2);

      ctx.font = "9pt Calibri";

      ctx.translate(100,100);

      for (var idx=0, len=boxes.length; idx<len; ++idx) {
        var box = boxes[idx],
            top = box.get('top'),
            left = box.get('left'),
            color = 'rgb(0,0,' + box.get('color') + ')',
            content = box.get('content');

        // Have to do our own layout:
        var x = idx % 20,
            y;

        if (idx < 20) y = 0;
        else if (idx < 40) y = 1;
        else if (idx < 60) y = 2;
        else if (idx < 80) y = 3;
        else y = 4;

        // console.log(x,y);
        ctx.save();
        ctx.translate(x*25, y*25); // grid
        ctx.translate(top, left);
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(5,5,10,0,PI2);
        ctx.fill();
        ctx.fillStyle = 'white';
        ctx.fillText(content, 5, 5);
        ctx.restore();
      }

      ctx.restore();
    }

  });

  SC.app.set('ui', surface);

  blossomInit(surface);
  blossomAnimate();
}
