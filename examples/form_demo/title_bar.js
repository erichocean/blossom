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

FormDemo.titleBar = SC.View.create({

  updateDisplay: function() {
    // console.log('FormDemo.form#updateDisplay()', SC.guidFor(this));
    var psurface = SC.psurfaces[this.__id__],
        canvas = psurface? psurface.__element__ : null,
        ctx = canvas? canvas.getContext('2d') : null,
        w = canvas.width, h = canvas.height;

    ctx.save();

    // Draw background.
    ctx.fillStyle = base2;
    ctx.fillRect(0, 0, w, h);

    // Draw window title.
    ctx.fillStyle = base03;
    ctx.font = "11pt Calibri";
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    ctx.fillText("Incident", w/2, 10);

    ctx.restore();
  },

  mouseDown: function(evt) {
    // console.log('FormDemo.form#mouseDown');
    this._clientX = evt.clientX;
    this._clientY = evt.clientY;
    return true;
  },

  mouseDragged: function(evt) {
    // console.log('FormDemo.form#mouseDragged');
    SC.AnimationTransaction.begin({ duration: 0 });
    var frame = this.getPath('supersurface.frame');
    frame.x = frame.x + evt.clientX - this._clientX;
    frame.y = frame.y + evt.clientY - this._clientY;
    this._clientX = evt.clientX;
    this._clientY = evt.clientY;
    SC.AnimationTransaction.end();
    return true;
  },

  mouseUp: function(evt) {
    // console.log('FormDemo.form#mouseUp');
    SC.AnimationTransaction.begin({ duration: 0 });
    var frame = this.getPath('supersurface.frame');
    frame.x = frame.x + evt.clientX - this._clientX;
    frame.y = frame.y + evt.clientY - this._clientY;
    delete this._clientX;
    delete this._clientY;
    SC.AnimationTransaction.end();
    return true;
  }

});
