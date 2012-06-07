// ==========================================================================
// Project:   Blossom - Modern, Cross-Platform Application Framework
// Copyright: ©2012 Fohr Motion Picture Studios. All rights reserved.
// License:   Licensed under the GPLv3 license (see BLOSSOM-LICENSE).
// ==========================================================================
/*globals sc_assert */

sc_require('surfaces/view');

SC.CalendarView = SC.View.extend({

  weekdayStrings: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  
  monthStartOn: SC.DateTime.create({day: 1}),
  selectedDate: null,
  
  displayProperties: ['monthStartOn', 'selectedDate'],

  clearBackground: true,

  months: 'January February March April May June July August September October November December'.w(),

  willRenderLayers: function(ctx) {
    // console.log('SC.CalendarView#willRenderLayers()');
    var monthStartOn = this.get('monthStartOn'),
        startDay = monthStartOn.get('dayOfWeek'),
        currDate = monthStartOn.advance({day: -startDay}),
        selDate = this.get('selectedDate'),
        todaysDate = SC.DateTime.create(),
        weekdayStrings = this.get('weekdayStrings'),
        layers = this.get('layers');

    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.font = '13pt Helvetica, Arial';
    ctx.fillStyle = 'black';

    ctx.font = '11pt Helvetica, Arial';

    ctx.textAlign = 'center';
    for (var idx=0; idx<7; ++idx) {
      ctx.fillText(weekdayStrings[idx], 40 + 40*idx, 50);
    }
    
    for (idx=0; idx<42; ++idx) {
      var layer = layers.objectAt(idx);
      sc_assert(layer);
      layer.set('day', currDate.get('day'));
      layer.set('date', currDate);

      if (currDate.get('month') < monthStartOn.get('month') || currDate.get('month') > monthStartOn.get('month')) {
        layer.set('isOutOfRange', true);
      } else {
        layer.set('isOutOfRange', false);
      }

      if (currDate.get('day') === todaysDate.get('day') && currDate.get('month') === todaysDate.get('month') && currDate.get('year') === todaysDate.get('year')) {
        layer.set('isToday', true);
      } else {
        layer.set('isToday', false);
      }
        
      if (selDate && currDate.get('day') === selDate.get('day') && currDate.get('month') === selDate.get('month') && currDate.get('year') === selDate.get('year')) {
        layer.set('isSelected', true);
      } else {
        layer.set('isSelected', false);
      }

      currDate = currDate.advance({ day: 1 });
    }
  },

  init: function() {
    arguments.callee.base.apply(this, arguments);
    var layers = this.get('layers'),
        that = this;

    // Add the day squares first.
    for (var vidx=0; vidx<6; ++vidx) {
      for (var hidx=0; hidx<7; ++hidx) {
        layers.pushObject(SC.CalendarDayLayer.create({
          layout: { width: 40, height: 40, top: 70 + vidx*40, left: 20 + hidx*40 }
        }));
      }
    }

    // Then add the back/forward buttons.
    layers.pushObject(SC.ButtonWidget.create({
      layout: { top: 10, left: 10, width: 30, height: 24 },

      title: "\u2190",

      action: function() {
        var monthStartOn = that.get('monthStartOn');
        that.set('monthStartOn', monthStartOn.advance({ month: -1 }));
      }
    }));

    layers.pushObject(SC.ButtonWidget.create({
      layout: { top: 10, right: 10, width: 30, height: 24 },

      title: "\u2192",

      action: function() {
        var monthStartOn = that.get('monthStartOn');
        that.set('monthStartOn', monthStartOn.advance({ month: 1 }));
      }
    }));

    var monthController = SC.ObjectController.create({
      contentBinding: SC.Binding.from('monthStartOn', that)
    });

    // Then add the month pop-up.
    var selectWidget = SC.SelectWidget.create({
      layout: { top: 11, centerX: -30, width: 140, height: 22 },
      theme: 'capsule',
      items: [{ title: "January".loc(),
                value: 1,
                enabled: true },
              { title: "February".loc(),
                value: 2,
                enabled: true },
              { title: "March".loc(),
                value: 3,
                enabled: true },
              { title: "April".loc(),
                value: 4,
                enabled: true },
              { title: "May".loc(),
                value: 5,
                enabled: true },
              { title: "June".loc(),
                value: 6,
                enabled: true },
              { title: "July".loc(),
                value: 7,
                enabled: true },
              { title: "August".loc(),
                value: 8,
                enabled: true },
              { title: "September".loc(),
                value: 9,
                enabled: true },
              { title: "October".loc(),
                value: 10,
                enabled: true },
              { title: "November".loc(),
                value: 11,
                enabled: true },
              { title: "December".loc(),
                value: 12,
                enabled: true }],
      valueBinding: SC.Binding.from('month', monthController),
      itemTitleKey: 'title',
      itemValueKey: 'value',
      itemIconKey: 'icon',
      itemIsEnabledKey: 'enabled'
    });

    // HACK: Dates are read only, so we need a workaround to update the 
    // month.
    selectWidget._sc_menuView.action = function() {
      var value = this.get('value'), // `this` is the select widget
          monthStartOn = that.get('monthStartOn');

      that.set('monthStartOn', monthStartOn.adjust({ month: value }));
    };

    layers.pushObject(selectWidget);

    var yearController = SC.ObjectController.create({
      contentBinding: SC.Binding.from('monthStartOn', that)
    });

    layers.pushObject(SC.TextFieldWidget.create({
      layout: { top: 11, centerX: +70, width: 54, height: 22 },
      valueBinding: SC.Binding.from('year', yearController),
      isEnabled: false
    }));
  }

});

SC.CalendarDayLayer = SC.Layer.extend({

  displayProperties: 'day isSelected isToday isOutOfRange'.w(),

  date: null,
  day: 0,

  isSelected: false,
  isToday: false,
  isOutOfRange: false,

  render: function(ctx) {
    var day = this.get('day'),
        isSelected = this.get('isSelected'),
        isToday = this.get('isToday'),
        isOutOfRange = this.get('isOutOfRange'),
        bounds = this.get('bounds'),
        w = bounds.width, h = bounds.height;

    if (isToday) {
      ctx.fillStyle = 'blue';
      ctx.fillRect(0,0,w,h);
    } else if (isSelected) {
      ctx.fillStyle = 'white';
      ctx.fillRect(0,0,w,h);
    } else if (isOutOfRange) {
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = 'grey';
      ctx.fillRect(0,0,w,h);
    }

    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.font = '11pt Helvetica, Arial';
    ctx.fillStyle = isToday? 'white' : 'black';
    ctx.fillText(day, 20, 20);

    if (isOutOfRange) {
      ctx.globalAlpha = 1.0;
    }

  }
});
