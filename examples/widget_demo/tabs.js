// ==========================================================================
// Project:   Blossom - Modern, Cross-Platform Application Framework
// Copyright: ©2012 Fohr Motion Picture Studios. All rights reserved.
// License:   Licensed under the GPLv3 license (see BLOSSOM-LICENSE).
// ==========================================================================
/*globals global WidgetDemo */

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

SC.AnimationTransaction.begin();
WidgetDemo.tabsSurface = SC.TabSurface.create({
  theme: 'regular',
  items: [{ title: "Red",
            value: "red",
            enabled: true,
            icon: "button_red" },
          { title: "Green",
            value: "green",
            enabled: true,
            icon: 'button_green' },
          { title: "Purple",
            value: "purple",
            enabled: true,
            icon: 'button_purple' },
          { title: "Blue",
            value: "blue",
            enabled: true,
            icon: 'button_blue' }],
  valueBinding: 'WidgetDemo.value',
  itemTitleKey: 'title',
  itemValueKey: 'value',
  itemIconKey: 'icon',
  itemIsEnabledKey: 'enabled'
});
SC.AnimationTransaction.end();
