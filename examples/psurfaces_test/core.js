/*globals base3 green */

function main() {
  SC.Application.create(); // Assigns itself automatically to SC.app

  var surface = SC.View.create({

    updateDisplay: function() {
      var ctx = this.getPath('layer.context');

      // Draw background.
      ctx.fillStyle = base3;
      ctx.fillRect(0, 0, ctx.width, ctx.height);

      // Draw fps meter.
      ctx.fillStyle = green;
      ctx.font = "16pt Calibri";
      ctx.textBaseline = "middle";
      ctx.textAlign = "center";
      ctx.fillText(SC.Benchmark.fps(), ctx.width/2, ctx.height/2);
    }

  });

  SC.app.set('ui', surface);
}
