// ==========================================================================
// Project:   Blossom - Modern, Cross-Platform Application Framework
// Copyright: ©2012 Fohr Motion Picture Studios. All rights reserved.
// License:   Licensed under the GPLv3 license (see BLOSSOM-LICENSE).
// ==========================================================================
/*globals sc_assert */

sc_require('surfaces/calendar_view');
sc_require('widgets/widget');

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
var black =    "black";

SC.DateWidget = SC.Widget.extend(SC.Control, {

  isTextField: true,

  __trace__: true,
  __traceMouseEvents__: false,

  init: function() {
    arguments.callee.base.apply(this, arguments);
    var isEnabled = this.get('isEnabled');
    this.__behaviorKey__ = isEnabled? 'Enabled' : 'Disabled';

    var that = this;

    this._datePicker = SC.CalendarView.create({

      target: this,

      isPresentInViewportDidChange: function(surface) {
        if (!this.get('isPresentInViewport')) {
          this.target.tryToPerform('popUpMenuDidClose');
        }
      }.observes('isPresentInViewport'),

      mouseDown: function(evt) {
        if (evt.layer) {
          var date = evt.layer.date;
          if (date) {
            that.set('value', date);
            SC.CloseFieldEditor();
            that.tryToPerform('didSelectDate');
          }
        }
      }
    });

    this._valueDidChange();
  },

  isEnabledDidChange: function() {
    this.dispatchAction('isEnabledDidChange');
  }.observes('isEnabled'),

  isFirstResponderDidChange: function() {
    var action = this.get('isInputResponder') ? 'didBecomeFirstResponder' : 'didResignFirstResponder';
    this.dispatchAction(action);
  }.observes('isFirstResponder'),

  'Enabled': function(evt) {
    switch (evt.type) {
      case 'defaultTransition':
        if (this.get('isFirstResponder')) {
          this.transition('Editor');
        } else {
          this.transition('Inactive');
        }
        break;
      case 'enter':
        break;
      case 'exit':
        break;
      case 'isEnabledDidChange':
        if (!this.get('isEnabled')) this.transition('Disabled');
        break;
    }
  }.behavior(),

  'Disabled': function(evt) {
    switch (evt.type) {
      case 'defaultTransition':
        break;
      case 'enter':
        break;
      case 'exit':
        break;
      case 'isEnabledDidChange':
        if (this.get('isEnabled')) this.transition('Enabled');
        break;
    }
  }.behavior(),

  'Inactive': function(evt) {
    switch (evt.type) {
      case 'mouseDown':
        var bounds = this.get('bounds');
        if (evt.hitPoint.x > bounds.width - 36) {
          var datePicker = this._datePicker,
              frame = datePicker.get('frame');
        
          frame.x = evt.clientX - evt.hitPoint.x + bounds.width - 16;
          frame.y = evt.clientY - evt.hitPoint.y - 24;
          frame.width = 320;
          frame.height = 320;

          return this.transition('Pop Up');

        } else {
          return this.transition('Editor');
        }
        break;

      case 'didBecomeFirstResponder':
        return this.transition('Editor');
    }
  }.behavior('Enabled'),

  'Active': function(evt) {
    switch (evt.type) {
      case 'enter':
        if (!this.get('isFirstResponder')) this.becomeFirstResponder();
        return;
      case 'exit':
        if (this.get('isFirstResponder')) this.resignFirstResponder();
        return;
    }
  }.behavior('Enabled'),

  'Editor': function(evt) {
    switch (evt.type) {
      case 'enter':
        // debugger;
        this._searchCache = {};
        SC.app.set('inputSurface', this.get('surface'));
        var that = this;
        setTimeout(function() {
          SC.RunLoop.begin();
          SC.OpenFieldEditorFor(that);
          SC.RunLoop.end();
        }, 0);
        return;
      case 'exit':
        SC.app.set('inputSurface', null);
        SC.CloseFieldEditor();
        this._searchCache = null;
        return;
      case 'mouseDown':
        // evt is not on a layer, so no evt.hitPoint property. Do the fiddling
        // to give it one.
        evt.type = 'mousedown'; // Required.
        this.get('surface').updateEventForLayer(evt, this);

        var bounds = this.get('bounds');

        if (evt.hitPoint.x > bounds.width - 36) {
          var datePicker = this._datePicker,
              frame = datePicker.get('frame');
        
          frame.x = evt.clientX - evt.hitPoint.x + bounds.width - 16;
          frame.y = evt.clientY - evt.hitPoint.y - 24;
          frame.width = 320;
          frame.height = 320;

          return this.transition('Pop Up');
        }
        break;
      case 'fieldEditorDidClose':
        return this.transition('Inactive');
      case 'didResignFirstResponder':
        return this.transition('Inactive');
    }
  }.behavior('Active'),

  'Pop Up': function(evt) {
    var datePicker = this._datePicker,
        date = this.get('value');
    switch (evt.type) {
      case 'enter':
        datePicker.set('monthStartOn', date? SC.DateTime.create({
          year: date.get('year'),
          month: date.get('month'),
          day: 1}) : SC.DateTime.create({day: 1}));
        datePicker.set('selectedDate', date || SC.DateTime.create());
        datePicker.triggerLayoutAndRendering();
        SC.app.addSurface(datePicker);
        SC.app.pushMenuSurface(datePicker);
        return;
      case 'exit':
        SC.app.popMenuSurface();
        SC.app.removeSurface(datePicker);
        return;
      case 'didSelectDate':
      case 'popUpMenuDidClose':
        return this.transition('Inactive');
    }
  }.behavior('Editor'),

  displayProperties: 'value'.w(),

  font: "10pt Helvetica, sans",
  color: base03,
  backgroundColor: base3,
  textBaseline: 'top',
  textAlign: 'left',
  tolerance: 10,
  lineHeight: 18,

  _textPropertiesDidChange: function() {
    var surface = this.get('surface');
    if (surface) surface.triggerLayoutAndRendering();
  }.observes('font', 'color', 'backgroundColor', 'textBaseline',
             'textBaseline', 'tolerance', 'lineHeight'),

  value: null, // should be a String or null

  _value: null,
  _valueDidChange: function() {
    var value = this.get('value');
    if (value !== this._value) {
      this._value = value;
      if (value) {
        var surface = this.get('surface');
        if (surface) surface.triggerLayoutAndRendering();
      }
    }
  }.observes('value'),

  behavior: function(key, val) {
    sc_assert(val === undefined, "This property is read-only.");
    return this;
  }.property().cacheable(),

  // ..........................................................
  // IS ENABLED SUPPORT
  //

  /**
    Set to true when the item is enabled.   Note that changing this value
    will also alter the isVisibleInWindow property for this view and any
    child views.

    Note that if you apply the SC.Control mixin, changing this property will
    also automatically add or remove a 'disabled' CSS class name as well.

    This property is observable and bindable.

    @property {Boolean}
  */
  isEnabled: true,
  isEnabledBindingDefault: SC.Binding.oneWay().bool(),

  /** @private
    Observes the isEnabled property and resigns first responder if set to false.
    This will avoid cases where, for example, a disabled text field retains
    its focus rings.

    @observes isEnabled
  */
  _isEnabledDidChange: function() {
    if (!this.get('isEnabled') && this.get('isFirstResponder')) {
      this.resignFirstResponder();
    }
  }.observes('isEnabled'),

  color: function() {
    return this.get('isEnabled')? black : 'rgba(0,43,54,0.5)';
  }.property('isEnabled'),

  backgroundColor: function() {
    return this.get('isEnabled')? white : base3;
  }.property('isEnabled'),

  borderColor: function() {
    return this.get('isEnabled')? 'rgb(128,128,128)' : 'rgba(0,43,54,0.5)';
  }.property('isEnabled'),

  borderWidth: 1,

  format: '%d/%m/%Y',

  render: function(ctx) {
    var bounds = this.get('bounds'),
        h = bounds.height, w = bounds.width,
        isEnabled = this.get('isEnabled');

    // Always clear the rect in case someone wants transparency.
    ctx.clearRect(0, 0, w, h);

    ctx.fillStyle = this.get('backgroundColor');
    SC.CreateRoundRectPath(ctx, 0.5, 0.5, w-1, h-1, 5);
    ctx.fill();

    // Draw the text.
    ctx.textBaseline = this.get('textBaseline');
    ctx.textAlign = 'left';
    ctx.font = this.get('font');
    ctx.fillStyle = this.get('color');
    var date = this.get('value');
    sc_assert(date || null);
    if (date) {
      sc_assert(date.kindOf(SC.DateTime));
      var val = date.toFormattedString(this.get('format'));
    }
    ctx.fillText(val || '', 4, 4);

    // Draw the box.
    ctx.strokeStyle = this.get('borderColor');
    SC.CreateRoundRectPath(ctx, 0.5, 0.5, w-1, h-1, 5);
    ctx.lineWidth = this.get('borderWidth');
    ctx.stroke();

    // Draw the icon.
    var img = this._sc_image;
    if (!img) {
      var that =  this;
      img = this._sc_image = new Image();
      img.onload = function() {
        console.log('image did load');
        that.triggerRendering();
      };
      img.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAA2hpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMC1jMDYxIDY0LjE0MDk0OSwgMjAxMC8xMi8wNy0xMDo1NzowMSAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0UmVmPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VSZWYjIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDpGQTdGMTE3NDA3MjA2ODExODcxRkFDMzE2RjUyRDc0MiIgeG1wTU06RG9jdW1lbnRJRD0ieG1wLmRpZDpDOUU3RUQ0Njg3REUxMUUxQkM5Mjk0RjRGMDU3OENCMiIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDpDOUU3RUQ0NTg3REUxMUUxQkM5Mjk0RjRGMDU3OENCMiIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ1M1LjEgTWFjaW50b3NoIj4gPHhtcE1NOkRlcml2ZWRGcm9tIHN0UmVmOmluc3RhbmNlSUQ9InhtcC5paWQ6NTE0MDc0NDExQTIwNjgxMThBNkRGMzlGQUM4NDQ2MDUiIHN0UmVmOmRvY3VtZW50SUQ9InhtcC5kaWQ6RkE3RjExNzQwNzIwNjgxMTg3MUZBQzMxNkY1MkQ3NDIiLz4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz4/0AsAAAACV0lEQVR42mL8//8/w0ACJoYBBqMOGHXAqAOId8DZCe8Z7u/wgrILgHg9itzZCQZQtgMQ3yfWWEZ8BdH/o+0gQwWg3P0MfLJTGT49XgNkxwMxSK4QLgdhX4CK9wOxI1TuAaN15QPclgAdgA3/3Vs/7d+Ly4eB7PdA/P/vrkoQdoCyG4B4/38ogMoFQNkBID4UvP93d+/hv4c6o3HZgzUK/qzPDmA0iHdiFNexAYUAkO/478tHBiB2AMkDaXsYG0kOEgVCmutBfKC4Ikgvo5KTDYOkcQ2Qr0B0CPze3lj3Hw38Whjl8P/nVxhb4d/bB1jlQDSQb4Cu//fu9ghsdmF3wKHpBf+pDKBmEhcF/3/+oHp2w2UmC1bFr+5K/Dkwg7ou+P2TeAewPLko8f/4QkwJITkGRlVbBobvHxn+3z4MpsFiwvKoHnj7kIHh3SPUAsc+nXgHMP35xsDw6zOqoBow0RcDs/uFDQwMXMCiIXoaA0OLIQODSQgDg28DqtpVwCJh7wS0rPWTCkXxZqBF0wOBdCPEEepAR20BstMZIRgk/xhYFh1fQLSRLESrvHUAgkEW+9YzMHz7AAkNGJA1gIRElSJEjiaVEciSov0QdjWaRT71EAe9fUCjykhYAWI5KARAUSBjABEDAZCYQQADw8WNuPV/e/+FeAcwMs/FEAP5EGQRyFJQYgRhy3iInAykFGZ4g8P3nPz/GU4u2UNabbgoeQ7DubVJwKzGSFH+B1mubF3MkLu1n+TqGFwVr8hLINtyBdMXDBaxK8huD4w2yUYdMOoAegCAAAMA7YP9/nnrziAAAAAASUVORK5CYII=';
    }
    ctx.drawImage(img, w-33, -4);
  },

  computeSupersurface: function() {
    var surface = this.get('surface');
    sc_assert(surface);
    while (surface.isLeafSurface && surface.get('supersurface')) {
      surface = surface.get('supersurface');
    }
    sc_assert(surface);
    return surface;
  },

  computeFrameInSupersurface: function() {
    // Determine our position relative to our immediate surface.  This is a 
    // little bit involved and involves a few levels of indirection.
    var surface = this.get('surface'),
        surfaceFrame = surface.get('frame'),
        textFrame = this.get('frame'),
        x = textFrame.x, y = textFrame.y,
        superlayer = this.get('superlayer'), frame;

    // `textFrame` must be expressed in the coordinate space of `surfaceFrame`
    // (its currently expressed in terms of its superlayer OR its surface). 
    // Walk up the layer tree until we no longer have a superlayer, taking into 
    // account the frames on the way up.
    var rootLayer = superlayer;
    while (superlayer) {
      rootLayer = superlayer;
      frame = superlayer.get('frame');
      x += frame.x;
      y += frame.y;
      superlayer = superlayer.get('superlayer');
    }

    // FIXME: Also need to take into acccount the accumulated layer transform.

    var rowOffsetForLayerTree = 0;
    if (surface.rowOffsetForLayerTree) rowOffsetForLayerTree = surface.rowOffsetForLayerTree(rootLayer);

    return SC.MakeRect(
        surfaceFrame.x + x,
        surfaceFrame.y + y + rowOffsetForLayerTree,
        textFrame.width,
        textFrame.height
      );
  },

  valueForFieldEditor: function() {
    var date = this.get('value');
    sc_assert(date || null);
    if (date) {
      sc_assert(date.kindOf(SC.DateTime));
      var val = date.toFormattedString(this.get('format'));
    }
    return val || '';
  },

  takeValueFromFieldEditor: function(value) {
    // console.log('takeValueFromFieldEditor', value);
    var ret = null, num, sense;

    // Handle relative date by day
    if(value.indexOf('+') === 0 ||
       value.indexOf('-') === 0) {
      sense = value.substring(0, 1);
      num = value.substring(1, value.length) - 0;

      if(SC.typeOf(num) === SC.T_NUMBER && !isNaN(num)) {
        if(sense === "-") { num = num * -1; }
        ret = SC.DateTime.create().advance({ day: num });
      }
      // Handle day of year
    } else if(value.indexOf('#') === 0) {
      num = value.substring(1, value.length) - 0;

      if(SC.typeOf(num) === SC.T_NUMBER && !isNaN(num)) {
        ret = SC.DateTime.create().adjust({ month: 1, day: 0 }).advance({ day: num });
      }
      // Handle a straight number as specific day
    } else if(value.length && !isNaN(value - 0)) {
      ret = SC.DateTime.create();
      if(value - 0) { ret = ret.adjust({ day: value }); }
      // Handle a regular date
    } else if(value.length) {
      num = Date.parse(value, this.get('format'));
      if(!isNaN(num)) { ret = SC.DateTime.create(num); }
    }

    if (ret && this.__behaviorKey__ === 'Editor') this.set('value', ret);
  },

  styleInputElement: function(input) {
    var style = input.style,
        frame = this.computeFrameInSupersurface();

    input.value = this.valueForFieldEditor();

    style.display = 'block';
    style.border  = this.get('borderWidth') + 'px';
    style.borderStyle = 'solid ';
    style.borderRadius = '5px';
    style.borderColor = 'rgb(252,102,32)'; // this.get('borderColor');
    style.font = this.get('font');
    style.textAlight = 'left';
    style.color = this.get('color');
    style.backgroundColor = this.get('backgroundColor');
    style.backgroundImage = 'url('+'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAA2hpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMC1jMDYxIDY0LjE0MDk0OSwgMjAxMC8xMi8wNy0xMDo1NzowMSAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0UmVmPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VSZWYjIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDpGQTdGMTE3NDA3MjA2ODExODcxRkFDMzE2RjUyRDc0MiIgeG1wTU06RG9jdW1lbnRJRD0ieG1wLmRpZDpDOUU3RUQ0Njg3REUxMUUxQkM5Mjk0RjRGMDU3OENCMiIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDpDOUU3RUQ0NTg3REUxMUUxQkM5Mjk0RjRGMDU3OENCMiIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ1M1LjEgTWFjaW50b3NoIj4gPHhtcE1NOkRlcml2ZWRGcm9tIHN0UmVmOmluc3RhbmNlSUQ9InhtcC5paWQ6NTE0MDc0NDExQTIwNjgxMThBNkRGMzlGQUM4NDQ2MDUiIHN0UmVmOmRvY3VtZW50SUQ9InhtcC5kaWQ6RkE3RjExNzQwNzIwNjgxMTg3MUZBQzMxNkY1MkQ3NDIiLz4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz4/0AsAAAACV0lEQVR42mL8//8/w0ACJoYBBqMOGHXAqAOId8DZCe8Z7u/wgrILgHg9itzZCQZQtgMQ3yfWWEZ8BdH/o+0gQwWg3P0MfLJTGT49XgNkxwMxSK4QLgdhX4CK9wOxI1TuAaN15QPclgAdgA3/3Vs/7d+Ly4eB7PdA/P/vrkoQdoCyG4B4/38ogMoFQNkBID4UvP93d+/hv4c6o3HZgzUK/qzPDmA0iHdiFNexAYUAkO/478tHBiB2AMkDaXsYG0kOEgVCmutBfKC4Ikgvo5KTDYOkcQ2Qr0B0CPze3lj3Hw38Whjl8P/nVxhb4d/bB1jlQDSQb4Cu//fu9ghsdmF3wKHpBf+pDKBmEhcF/3/+oHp2w2UmC1bFr+5K/Dkwg7ou+P2TeAewPLko8f/4QkwJITkGRlVbBobvHxn+3z4MpsFiwvKoHnj7kIHh3SPUAsc+nXgHMP35xsDw6zOqoBow0RcDs/uFDQwMXMCiIXoaA0OLIQODSQgDg28DqtpVwCJh7wS0rPWTCkXxZqBF0wOBdCPEEepAR20BstMZIRgk/xhYFh1fQLSRLESrvHUAgkEW+9YzMHz7AAkNGJA1gIRElSJEjiaVEciSov0QdjWaRT71EAe9fUCjykhYAWI5KARAUSBjABEDAZCYQQADw8WNuPV/e/+FeAcwMs/FEAP5EGQRyFJQYgRhy3iInAykFGZ4g8P3nPz/GU4u2UNabbgoeQ7DubVJwKzGSFH+B1mubF3MkLu1n+TqGFwVr8hLINtyBdMXDBaxK8huD4w2yUYdMOoAegCAAAMA7YP9/nnrziAAAAAASUVORK5CYII='+')';
    style.backgroundPosition = 'right center';
    style.backgroundRepeat = 'no-repeat';
    style.outline = 'none'; // FIXME: This breaks other users of the field editor.
    if (this.get('isEnabled')) {
      style.boxShadow = '0px 0px 3px 1px ' + 'rgb(252,102,32)' + ', 0px 0px 1px 0px ' + 'rgb(128,128,128)' + ' inset';
    } else style.boxShadow = 'none';

    // Without the 'px' ending, these do nothing in WebKit.
    style.paddingTop = '0px';
    style.paddingLeft = '2px';
    style.paddingRight = '20px';
    style.top    = frame.y      + 'px';
    style.left   = frame.x      + 'px';
    style.width  = frame.width  + 'px';
    style.height = frame.height + 'px';
  },

  setSelectionForInputElement: function(input) {
    var value = this.valueForFieldEditor();
    input.setSelectionRange(0, value? value.length : 0);
  }

});
