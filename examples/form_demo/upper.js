// ==========================================================================
// Project:   Blossom - Modern, Cross-Platform Application Framework
// Copyright: ©2012 Fohr Motion Picture Studios. All rights reserved.
// License:   Licensed under the GPLv3 license (see BLOSSOM-LICENSE).
// ==========================================================================
/*globals global FormDemo */

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

FormDemo.upper = SC.View.create({
  clearBackground: true,

  updateDisplay: function() {
    // console.log('FormDemo.form#updateDisplay()', SC.guidFor(this));
    var psurface = SC.psurfaces[this.__id__],
        canvas = psurface? psurface.__element__ : null,
        ctx = canvas? canvas.getContext('2d') : null,
        w = canvas.width, h = canvas.height;

    var layers = this.get('layers');
    for (var idx=0, len=layers.length; idx<len; ++idx) {
      layers[idx].updateDisplay();
    }

    ctx.save();

    // Draw background.
    if (this.get('clearBackground')) {
      ctx.clearRect(0, 0, w, h);
    } else {
      ctx.fillStyle = base3;
      ctx.fillRect(0, 0, w, h);
    }

    // Draw wells.
    ctx.fillStyle = base2;
    SC.CreateRoundRectPath(ctx, 8, 76, w-98, 110, 7);
    ctx.fill();

    SC.CreateRoundRectPath(ctx, 8, h-94, Math.floor((w-98)/2)-4, 86, 7);
    ctx.fill();

    SC.CreateRoundRectPath(ctx, 12 + Math.ceil((w-98)/2), h-94, w - 102 - Math.ceil((w-98)/2), 86, 7);
    ctx.fill();

    ctx.restore();

    // Draw layers.
    for (idx=0, len=layers.length; idx<len; ++idx) {
      layers[idx].copyIntoContext(ctx);
    }
  }

});

(function(view) {

var saveButton = SC.ButtonWidget.create({
  layout: { width: 70, top: 8, right: 8, height: 24 },
  title: "Save",
  theme: 'capsule',
  isDefault: true,
  action: function() { alert('save'); }
});

var cancelButton = SC.ButtonWidget.create({
  layout: { width: 70, top: 39, right: 8, height: 24 },
  title: "Cancel",
  theme: 'capsule',
  action: function() { alert('cancel'); }
});

var printButton = SC.ButtonWidget.create({
  layout: { width: 70, bottom: 8, right: 8, height: 24 },
  title: "Print",
  theme: 'capsule',
  action: function() { alert('print'); }
});

var incidentNumberLabel = SC.TextLayer.create({
  layout: { top: 8, left: 20, height: 24, width: 72 },
  value: "Incident #:"
});

var incidentNumberField = SC.TextFieldWidget.create({
  layout: { top: 6, left: 90, right: 270, height: 24 },
  value: "15000",
  isEnabled: false
});

var categoryLabel = SC.TextLayer.create({
  layout: { top: 8, right: 190, height: 24, width: 72 },
  value: "Category:"
});

var descriptionLabel = SC.TextLayer.create({
  layout: { top: 42, left: 11, height: 24, width: 72 },
  value: "Description:"
});

var descriptionField = SC.TextFieldWidget.create({
  layout: { top: 40, left: 90, right: 90, height: 24 },
  value: "Review Product For Potential Custom Adaptation"
});

var contactLabel = SC.TextLayer.create({
  layout: { bottom: 94, left: 13, height: 14, width: 72 },
  font: "9pt Calibri, sans",
  value: "Contact:",
  lineHeight: 14
});

var projectLabel = SC.TextLayer.create({
  layout: { bottom: 94, centerX: 2, height: 14, width: 72 },
  font: "9pt Calibri, sans",
  value: "Project:",
  lineHeight: 14
});


view.get('layers').pushObjects([
  saveButton,
  cancelButton,
  printButton,
  incidentNumberLabel,
  incidentNumberField,
  categoryLabel,
  descriptionLabel,
  descriptionField,
  contactLabel,
  projectLabel
]);

})(FormDemo.upper);