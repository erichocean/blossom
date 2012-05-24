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
    ctx.textAlign = 'center';
    ctx.font = '11pt Helvetica, Arial';
    ctx.fillStyle = 'black';

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
    var layers = this.get('layers');
    for (var vidx=0; vidx<6; ++vidx) {
      for (var hidx=0; hidx<7; ++hidx) {
        layers.pushObject(SC.CalendarDayLayer.create({
          layout: { width: 40, height: 40, top: 70 + vidx*40, left: 20 + hidx*40 }
        }));
      }
    }
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
    var day = this.get('day');

    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.font = '11pt Helvetica, Arial';
    ctx.fillStyle = 'black';
    ctx.fillText(day, 20, 20);
  }
});
