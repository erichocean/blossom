// ==========================================================================
// Project:   Blossom - Modern, Cross-Platform Application Framework
// Copyright: ©2012 Fohr Motion Picture Studios. All rights reserved.
// License:   Licensed under the GPLv3 license (see BLOSSOM-LICENSE).
// ==========================================================================
/*global FormDemo */

sc_require('form');
sc_require('title_bar');
sc_require('upper');
sc_require('lower');

SC.ENABLE_CSS_TRANSITIONS = false;

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

function main() {
  SC.Application.create();
  SC.app.set('ui', SC.View.create());

  var form = FormDemo.form;
  form.set('frame', SC.MakeRect(50, 50, 800, 600));
  form.set('backgroundColor', base3);
  form.set('cornerRadius', 10);

  var titleBar = FormDemo.titleBar;
  titleBar.set('frame', SC.MakeRect(0, 0, 800, 20));

  var upper = FormDemo.upper;
  upper.set('frame', SC.MakeRect(0, 20, 800, 300));

  var lower = FormDemo.lower;
  lower.set('frame', SC.MakeRect(0, 320, 800, 280));

  form.get('subsurfaces').pushObjects([titleBar, upper, lower]);

  SC.app.addSurface(FormDemo.form);
}
