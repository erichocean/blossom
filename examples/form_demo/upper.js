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
  clearBackground: true
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
  layout: { width: 70, top: 42, right: 8, height: 24 },
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
  layout: { top: 8, left: 18, height: 24, width: 72 },
  value: "Incident #:"
});

var incidentNumberField = SC.TextFieldWidget.create({
  layout: { top: 8, left: 90, right: 270, height: 24 },
  value: "15000",
  isEnabled: false
});

var categoryLabel = SC.TextLayer.create({
  layout: { top: 8, right: 190, height: 24, width: 72 },
  value: "Category:"
});

view.get('layers').pushObjects([
  saveButton,
  cancelButton,
  printButton,
  incidentNumberLabel,
  incidentNumberField,
  categoryLabel
]);

})(FormDemo.upper);