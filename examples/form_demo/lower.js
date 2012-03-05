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

SC.AnimationTransaction.begin();

FormDemo.TmpView = SC.View.extend({

  name: '(unnamed)',

  willRenderLayers: function(ctx) {
    // console.log('FormDemo.TmpView#willRenderLayers()', SC.guidFor(this));
    var w = ctx.width, h = ctx.height;

    // Clear background.
    ctx.fillStyle = base3;
    ctx.fillRect(0, 0, w, h);

    // Draw view name.
    ctx.fillStyle = base03;
    ctx.font = "11pt Calibri";
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    ctx.fillText(this.get('name'), w/2, h/2);
  }

});

FormDemo.notesTab = SC.LayoutSurface.create();
FormDemo.notesField = SC.TextSurface.create({
  layout: { top: 20, left: 10, right: 10, bottom: 10 },
  value: "Some notes."
});

FormDemo.notesTab.set('backgroundColor', base3);
FormDemo.notesTab.get('subsurfaces').pushObject(FormDemo.notesField);

FormDemo.lower = SC.TabSurface.create({
  theme: 'regular',
  items: [
    { title: "Notes",
      value: "notes",
      enabled: true },
    { title: "Characteristics",
      value: "characteristics",
      enabled: true },
    { title: "Relationships",
      value: "relationships",
      enabled: true },
    { title: "To-Do List Items",
      value: "todoListItems",
      enabled: true },
    { title: "History",
      value: "history",
      enabled: true },
    { title: "Comments",
      value: "comments",
      enabled: true },
    { title: "Documents",
      value: "documents",
      enabled: true },
    { title: "Alarms",
      value: "alarms",
      enabled: true }
  ],

  value: 'notes',
  itemTitleKey: 'title',
  itemValueKey: 'value',
  itemIconKey: 'icon',
  itemIsEnabledKey: 'enabled',

  notes:           FormDemo.notesTab,
  characteristics: FormDemo.TmpView.create({ name: 'Characteristics Tab'}),
  relationships:   FormDemo.TmpView.create({ name: 'Relationships Tab'}),
  todoListItems:   FormDemo.TmpView.create({ name: 'To-Do List Items Tab'}),
  history:         FormDemo.TmpView.create({ name: 'History Tab'}),
  comments:        FormDemo.TmpView.create({ name: 'Comments Tab'}),
  documents:       FormDemo.TmpView.create({ name: 'Documents Tab'}),
  alarms:          FormDemo.TmpView.create({ name: 'Alarms Tab'})

});

SC.AnimationTransaction.end();
