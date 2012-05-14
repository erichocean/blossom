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
        active = this.get('isActive'),
        bounds = this.get('bounds'),
        w = bounds.width, h = bounds.height;

    selected = (selected && (selected !== SC.MIXED_STATE));

    sc_assert(this.get('theme') === 'checkbox');

    SC.CreateRoundRectPath(ctx, 1.5, 4.5, 15, 15, 5);

    var lingrad = ctx.createLinearGradient(0,0,0,h);
    lingrad.addColorStop(0, 'rgb(252,188,126)');
    lingrad.addColorStop(1, 'rgb(255,102,0)');

    if ((disabled && !selected) || (disabled && !active && !selected)) {
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = lingrad;
      ctx.fill();

      ctx.strokeStyle = white;
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.font = "10pt Helvetica";
      ctx.textBaseline = "middle";
      ctx.textAlign = "left";
      ctx.shadowBlur = 0;
      ctx.shadowColor = "rgba(0,0,0,0)";
      ctx.fillText(title, 22, h/2 + 2);

    } else if (disabled) {
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = lingrad;
      ctx.fill();

      ctx.strokeStyle = white;
      ctx.lineWidth = 2;
      ctx.stroke();
    
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.font = "10pt Helvetica";
      ctx.textBaseline = "middle";
      ctx.textAlign = "left";
      ctx.shadowBlur = 0;
      ctx.shadowColor = "rgba(0,0,0,0)";
      ctx.fillText(title, 22, h/2 + 2);

    } else if (active) {
      lingrad = ctx.createLinearGradient(0,0,0,h);
      lingrad.addColorStop(0, 'rgb(252,188,126)');
      lingrad.addColorStop(1, 'rgb(255,178,128)');

      ctx.fillStyle = lingrad;
      ctx.fill();
      ctx.strokeStyle = white;
      ctx.lineWidth = 2;
      ctx.stroke();
    
      ctx.fillStyle = white;
      ctx.font = "10pt Helvetica";
      ctx.textBaseline = "middle";
      ctx.textAlign = "left";
      ctx.shadowBlur = 0;
      ctx.shadowColor = "rgba(0,0,0,0)";
      ctx.fillText(title, 22, h/2 + 2);

    } else {
      // console.log('rendering normally');
      ctx.globalAlpha = 1.0;
      ctx.fillStyle = lingrad;
      ctx.fill();

      ctx.strokeStyle = white;
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = white;
      ctx.font = "10pt Helvetica";
      ctx.textBaseline = "middle";
      ctx.textAlign = "left";
      ctx.shadowBlur = 0;
      ctx.shadowColor = 'rgba(0,0,0,0)';
      ctx.fillText(title, 22, h/2 + 2);
    }

    if ((selected && !active) || (!selected && active)) {
      // Draw the check mark.
      ctx.beginPath();
      ctx.moveTo(8.5, 17);
      ctx.lineTo(3.75, 13.5);
      ctx.lineTo(5.5, 12);
      ctx.lineTo(8.5, 14.5);
      ctx.lineTo(12.5, 7);
      ctx.lineTo(14, 9);
      ctx.lineTo(8.5, 17);
      ctx.closePath();
      ctx.fillStyle = (active || disabled)? 'rgba(255,255,255,0.7)' : white;
      ctx.fill();
      ctx.strokeStyle = (active || disabled)? 'rgba(255,255,255,0.7)' : white;
      ctx.lineCap = 'round';
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }
  }

});
