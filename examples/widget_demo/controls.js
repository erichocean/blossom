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

WidgetDemo.setUpControls = function() {

  WidgetDemo.controlsSurface = SC.View.create({
    _sc_backgroundColor: 'grey'
  });

  // These two arrays are in sync.
  var anchors   = [70,  190,   310,      430],
      controlBehaviors = 'TOGGLE TOGGLE_ON TOGGLE_OFF'.w();

  var rootLayer = SC.Layer.create({
    layout: { centerX: 0, centerY: 0, width: 850, height: 550 },

    render: function(ctx) {
      var bounds = this.get('bounds'),
          w = bounds.width, h = bounds.height;

      ctx.fillStyle = 'grey';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = base0;
      ctx.lineWidth = 2; // overlap of 1 on the inside
      ctx.strokeRect(0, 0, w, h);

      ctx.fillStyle = base00;
      ctx.font = "14pt Calibri";
      ctx.textBaseline = "top";
      ctx.fillText("Controls", 15, 10);

      ctx.fillStyle = green;
      ctx.font = "10pt Calibri";
      ctx.fillText("Rendered with Blossom\u2122", 15, 33);

      ctx.font = "10pt Calibri";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = base1;
      'Enabled Disabled Selected Selected&Disabled'.w().forEach(function(title, idx) {
        ctx.fillText(title.split('&').join(' & '), 280+idx*150, 46);
      });

      ctx.textAlign = "right";
      controlBehaviors.forEach(function(behavior, idx) {
        ctx.fillText('SC.'+behavior+'_BEHAVIOR:', 184, 83+idx*120);
      });


      ctx.font = "48pt FontAwesome";
      ctx.fillStyle = 'black';
      ctx.fillText("\uf000", 60, 90);
    }
  });

  var layers = [];

  controlBehaviors.forEach(function(behavior, idx) {
    var anchor = anchors[idx],
        buttonBehavior = SC[behavior+'_BEHAVIOR'];

    var button = SC.CheckboxWidget.create({
      layout: { top: anchor, left: 210, width: 140, height: 24 },
      title: "Checkbox Label",
      buttonBehavior: buttonBehavior,
      action: function() {
        SC.app.set('ui', WidgetDemo.controlsSurface);
      }
    });
    layers.push(button);

    var buttonD = SC.CheckboxWidget.create({
      layout: { top: anchor, left: 360, width: 140, height: 24 },
      title: "Checkbox Label",
      isEnabled: false,
      buttonBehavior: buttonBehavior
    });
    layers.push(buttonD);

    var buttonS = SC.CheckboxWidget.create({
      layout: { top: anchor, left: 510, width: 140, height: 24 },
      title: "Checkbox Label",
      isSelected: true,
      buttonBehavior: buttonBehavior
    });
    layers.push(buttonS);

    var buttonDS = SC.CheckboxWidget.create({
      layout: { top: anchor, left: 660, width: 140, height: 24 },
      title: "Checkbox Label",
      isEnabled: false,
      isSelected: true,
      buttonBehavior: buttonBehavior
    });
    layers.push(buttonDS);

    if (idx === 0) {
      var radio = SC.RadioWidget.create({
        layout: { top: anchor+30, left: 210, width: 140, height: 48 },
        items: [{ title: "Red",
                  value: "red",
                  enabled: true,
                  icon: "button_red" },
                { title: "Green",
                  value: "green",
                  enabled: true,
                  icon: 'button_green' }],
        value: null,
        itemTitleKey: 'title',
        itemValueKey: 'value',
        itemIconKey: 'icon',
        itemIsEnabledKey: 'enabled',
        buttonBehavior: buttonBehavior
      });
      layers.push(radio);

      var radioD = SC.RadioWidget.create({
        layout: { top: anchor+30, left: 360, width: 140, height: 48 },
        items: [{ title: "Red",
                  value: "red",
                  enabled: true,
                  icon: "button_red" },
                { title: "Green",
                  value: "green",
                  enabled: true,
                  icon: 'button_green' }],
        value: null,
        itemTitleKey: 'title',
        itemValueKey: 'value',
        itemIconKey: 'icon',
        itemIsEnabledKey: 'enabled',
        isEnabled: false,
        buttonBehavior: buttonBehavior
      });
      layers.push(radioD);

      var radioS = SC.RadioWidget.create({
        layout: { top: anchor+30, left: 510, width: 140, height: 48 },
        items: [{ title: "Red",
                  value: "red",
                  enabled: true,
                  icon: "button_red" },
                { title: "Green",
                  value: "green",
                  enabled: true,
                  icon: 'button_green' }],
        value: 'red',
        itemTitleKey: 'title',
        itemValueKey: 'value',
        itemIconKey: 'icon',
        itemIsEnabledKey: 'enabled',
        isSelected: true,
        buttonBehavior: buttonBehavior
      });
      layers.push(radioS);

      var radioDS = SC.RadioWidget.create({
        layout: { top: anchor+30, left: 660, width: 140, height: 48 },
        items: [{ title: "Red",
                  value: "red",
                  enabled: true,
                  icon: "button_red" },
                { title: "Green",
                  value: "green",
                  enabled: true,
                  icon: 'button_green' }],
        value: 'red',
        itemTitleKey: 'title',
        itemValueKey: 'value',
        itemIconKey: 'icon',
        itemIsEnabledKey: 'enabled',
        isEnabled: false,
        buttonBehavior: buttonBehavior
      });
      layers.push(radioDS);
    }

  });

  rootLayer.get('sublayers').pushObjects(layers);

  var dateWidget = SC.DateWidget.create({
    layout: { top: 370, left: 210, width: 200, height: 24 },
    value: SC.DateTime.create()
  });

  rootLayer.get('sublayers').pushObject(dateWidget);

  var segmentedWidget = SC.SegmentedWidget.create({
    layout: { top: 430, left: 210, width: 500, height: 24 },
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

  var segmentedWidget2 = SC.SegmentedWidget.create({
    layout: { top: 430+30, left: 210, width: 500, height: 24 },
    theme: 'capsule',
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
    value: 'red',
    itemTitleKey: 'title',
    itemValueKey: 'value',
    itemIconKey: 'icon',
    itemIsEnabledKey: 'enabled'
  });

  var segmentedWidget3 = SC.SegmentedWidget.create({
    layout: { top: 430+60, left: 210, width: 500, height: 24 },
    theme: 'square',
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
    value: 'red',
    itemTitleKey: 'title',
    itemValueKey: 'value',
    itemIconKey: 'icon',
    itemIsEnabledKey: 'enabled'
  });

  rootLayer.get('sublayers').pushObjects([segmentedWidget, segmentedWidget2, segmentedWidget3]);

  var selectWidget2 = SC.SelectWidget.create({
    layout: { top: 430+30, left: 510, width: 140, height: 24 },
    theme: 'capsule',
    items: [{ title: "Red",
              value: "red",
              enabled: true,
              icon: "button_red" },
            "", // Spacer
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
    value: 'red',
    itemTitleKey: 'title',
    itemValueKey: 'value',
    itemIconKey: 'icon',
    itemIsEnabledKey: 'enabled'
  });

  var selectWidget3 = SC.SelectWidget.create({
    layout: { top: 430+60, left: 510, width: 140, height: 24 },
    theme: 'square',
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
    value: 'red',
    itemTitleKey: 'title',
    itemValueKey: 'value',
    itemIconKey: 'icon',
    itemIsEnabledKey: 'enabled'
  });

  rootLayer.get('sublayers').pushObjects([selectWidget2, selectWidget3]);

  WidgetDemo.controlsSurface.get('layers').pushObject(rootLayer);

};
