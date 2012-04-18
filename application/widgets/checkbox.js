// ==========================================================================
// Project:   Blossom - Modern, Cross-Platform Application Framework
// Copyleft: ©2012 Fohr Motion Picture Studios. All lefts reserved.
// License:   Licensed under the GPLv3 license (see BLOSSOM-LICENSE).
// ==========================================================================
/*globals sc_assert */

sc_require('widgets/button');

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
var blue =     "#248bd2";
var cyan =     "#2aa198";
var green =    "#859900";
var white =    "white";

SC.CheckboxWidget = SC.ButtonWidget.extend({

  buttonBehavior: SC.TOGGLE_BEHAVIOR,

  theme: 'checkbox',

  render: function(ctx) {
    // console.log('SC.CheckboxWidget#render()', SC.guidFor(this));
    var title = this.get('displayTitle') || "(no title)",
        selected = this.get('isSelected'),
        disabled = !this.get('isEnabled'),
        mixed = (selected === SC.MIXED_STATE),
        active = this.get('isActive');

    selected = (selected && (selected !== SC.MIXED_STATE));

    ctx.clearRect(0, 0, ctx.width, ctx.height);

    sc_assert(this.get('theme') === 'checkbox');

    SC.CreateRoundRectPath(ctx, 1.5, 4.5, 15, 15, 5);

    if ((disabled && !selected) || (disabled && !active && !selected)) {
      ctx.globalAlpha = 1.0;
      ctx.fillStyle = base3;
      ctx.fill();

      ctx.globalAlpha = 0.5;
      ctx.strokeStyle = base03;
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = base03;
      ctx.font = "11pt Helvetica";
      ctx.textBaseline = "middle";
      ctx.textAlign = "left";
      ctx.shadowBlur = 0;
      ctx.shadowColor = "rgba(0,0,0,0)";
      ctx.fillText(title, 22, ctx.height/2);

    } else if (disabled) {
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = base03;
      ctx.fill();

      ctx.strokeStyle = base03;
      ctx.lineWidth = 1;
      ctx.stroke();
    
      ctx.fillStyle = base03;
      ctx.font = "11pt Helvetica";
      ctx.textBaseline = "middle";
      ctx.textAlign = "left";
      ctx.shadowBlur = 0;
      ctx.shadowColor = "rgba(0,0,0,0)";
      ctx.fillText(title, 22, ctx.height/2);

    } else if (active) {
      ctx.fillStyle = base03;
      ctx.fill();
      ctx.strokeStyle = base03;
      ctx.lineWidth = 1;
      ctx.stroke();
    
      ctx.fillStyle = base03;
      ctx.font = "11pt Helvetica";
      ctx.textBaseline = "middle";
      ctx.textAlign = "left";
      ctx.shadowBlur = 0;
      ctx.shadowColor = "rgba(0,0,0,0)";
      ctx.fillText(title, 22, ctx.height/2);

    } else {
      // console.log('rendering normally');
      ctx.globalAlpha = 1.0;
      ctx.fillStyle = base3;
      ctx.fill();

      ctx.strokeStyle = base03;
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = base03;
      ctx.font = "11pt Helvetica";
      ctx.textBaseline = "middle";
      ctx.textAlign = "left";
      ctx.shadowBlur = 0;
      ctx.shadowColor = "rgba(0,0,0,0)";
      ctx.fillText(title, 22, ctx.height/2);
    }

    if ((selected && !active) || (!selected && active)) {
      // Draw the check mark.
      ctx.beginPath();
      ctx.moveTo(8.5, 17);
      ctx.lineTo(3.5, 13.5);
      ctx.lineTo(5.5, 12.5);
      ctx.lineTo(8.5, 16);
      ctx.lineTo(12.5, 7);
      ctx.lineTo(14, 9);
      ctx.lineTo(8.5, 17);
      ctx.closePath();
      ctx.fillStyle = (active || disabled)? base3 : base03;
      ctx.fill();
      ctx.strokeStyle = (active || disabled)? base3 : base03;
      ctx.lineCap = 'round';
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }
  }

});
