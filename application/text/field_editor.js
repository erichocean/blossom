// ==========================================================================
// Project:   Blossom - Modern, Cross-Platform Application Framework
// Copyright: ©2012 Fohr Motion Picture Studios. All rights reserved.
// License:   Licensed under the GPLv3 license (see BLOSSOM-LICENSE).
// ==========================================================================
/*globals sc_assert */

sc_require('surfaces/leaf');

SC.FieldEditor = SC.Responder.extend({

  isFieldEditor: true, // Walk like a duck.

  isPassword: false,

  isEnabled: true,

  textLayer: null,

  value: null,

  _sc_value: null,
  _sc_valueDidChange: function() {
    // console.log('SC.FieldEditor#_sc_valueDidChange()', this.isPassword? 'password' : 'text');
    var cur = this.get('value'),
        old = this._sc_value,
        txt = this._sc_input,
        val = txt.value;

    // cur === old === val on init(), so nothing to do.
    if (cur === old) return;

    // This happens when our 'value' was updated by our text area. Avoid 
    // a loop by not setting 'value' on the text area again.
    if (cur === val) {
      this._sc_value = cur;

    // This happens when our 'value' has been updated by anyone but our 
    // text area.  Let our text area know we've changed.
    } else {
      this._sc_value = cur;
      txt.value = cur;
    }
  }.observes('value'),

  selection: function(key, value) {
    var textarea = this._sc_textarea;

    if (value !== undefined) {
      sc_assert(value instanceof SC.TextSelection);
      sc_assert(value.isValid);

      if (!textarea.value) {
        textarea.setSelectionRange(0, 0);
      } else {
        textarea.setSelectionRange(value.start, value.end);
      }
    } else {
      return new SC.TextSelection(textarea.selectionStart, textarea.selectionEnd);
    }
  }.property('value'),

  init: function() {
    arguments.callee.base.apply(this, arguments);
    var input,
        isEnabled = this.get('isEnabled'),
        isPassword = this.get('isPassword');

    input = this._sc_input = document.createElement('input');
    input.type = isPassword? 'password' : 'text';
    if (isEnabled) input.id = isPassword? 'password-editor' : 'field-editor';
    else input.id = isPassword? 'disabled-password-editor' : 'disabled-field-editor';
    var style = input.style;
    style.zIndex = 'auto';
    style.display = 'none';
    style.position = 'absolute';
    if (!isEnabled) style.outline = 'none';
    document.body.appendChild(input);

    // Become the input surface.
    SC.Event.add(input, 'focus', this, this._sc_inputDidFocus);
    SC.Event.add(input, 'blur', this, this._sc_inputDidBlur);

    // There are certain ways users can select text that we can't identify via
    // our key/mouse down/up handlers (such as the user choosing Select All
    // from a menu).
    SC.Event.add(input, 'select', this, this._sc_inputDidSelect);

    // Keep our value in sync.
    SC.Event.add(input, 'change', this, this._sc_inputDidChange);
    input.value = this.get('value');
  },

  keyDown: function(evt) {
    // console.log('SC.FieldEditor#keyDown()', this.isPassword? 'password' : 'text');

    // Allow all keyboard behavior when we're enabled.
    if (this.get('isEnabled')) {
      evt.allowDefault();

    // Allow copy command (ctrl-c, command-c) even when disabled.
    } else if (evt.keyCode === 67 && (evt.metaKey || evt.ctrlKey)) {
      evt.allowDefault();

     // Otherwise, we don't allow keypresses when we're disabled.
    } else {
      evt.preventDefault();
    }
  },

  keyUp: function(evt) {
    // console.log('SC.FieldEditor#keyUp()', this.isPassword? 'password' : 'text');
    if (this.get('isEnabled')) {
      evt.allowDefault(); // We want the browser's behavior here.
      this.set('value', this._sc_input.value);
    } else evt.preventDefault();
  },

  _sc_inputDidFocus: function(evt) {
    // console.log('SC.FieldEditor#_sc_inputDidFocus()', this.isPassword? 'password' : 'text');
    SC.app.set('fieldEditor', this);
  },

  _sc_inputDidBlur: function(evt) {
    // console.log('SC.FieldEditor#_sc_inputDidBlur()', this.isPassword? 'password' : 'text');
    SC.EndEditingTextLayer();
    SC.app.set('fieldEditor', null);
  },

  _sc_inputDidSelect: function(evt) {
    // console.log('SC.FieldEditor#_sc_inputDidSelect()', this.isPassword? 'password' : 'text');
    this.notifyPropertyChange('selection');
  },

  _sc_inputDidChange: function(evt) {
    // console.log('SC.FieldEditor#_sc_inputDidChange()', this.isPassword? 'password' : 'text');
    SC.EndEditingTextLayer();
  }

});

SC.BeginEditingTextLayer = function(textLayer, password) {
  sc_assert(textLayer);
  sc_assert(textLayer.kindOf(SC.TextLayer));

  var editor;
  if (textLayer.get('isEnabled')) editor = password? SC.passwordEditor : SC.fieldEditor;
  else editor = password? SC.disabledPasswordEditor : SC.disabledFieldEditor;
  sc_assert(editor);

  var input = editor._sc_input;
  sc_assert(input);
  sc_assert(document.getElementById(input.id));
  var value = textLayer.get('value');
  input.value = value;
  var style = input.style;
  style.display = 'block';

  SC.activeEditor = editor;
  editor.textLayer = textLayer;

  // Need to position and style the input correctly, and then append ourself 
  // to the nearest surface that takes children.
  var surface = textLayer.get('surface');
  sc_assert(surface);
  while (surface.isLeafSurface) surface = surface.get('supersurface');
  sc_assert(surface);

  style.border  = textLayer.get('borderWidth');
  style.borderStyle = 'solid ';
  style.borderColor = textLayer.get('borderColor');
  style.font = textLayer.get('font');
  style.color = textLayer.get('color');
  style.backgroundColor = textLayer.get('backgroundColor');

  // Determine our position relative to our immediate surface.  This is a 
  // little bit involved and involves a few levels of indirection.
  var surfaceFrame = textLayer.get('surface').get('frame'),
      textFrame = textLayer.get('frame'),
      x = textFrame.x, y = textFrame.y,
      superlayer = textLayer.get('superlayer'), frame;

  // `textFrame` must be expressed in the coordinate space of `surfaceFrame`
  // (its currently expressed in terms of its superlayer OR its surface). 
  // Walk up the layer tree until we no longer have a superlayer, taking into 
  // account the frames on the way up.
  while (superlayer) {
    frame = superlayer.get('frame');
    x += frame.x;
    y += frame.y;
    superlayer = superlayer.get('superlayer');
  }

  style.paddingLeft = 2;
  style.paddingRight = 2;
  style.top     = surfaceFrame.y + y - 1;
  style.left    = surfaceFrame.x + x;
  style.width   = textFrame.width;
  style.height  = textFrame.height;

  // FIXME: Also need to take into acccount the accumuplated layer transform.

  var psurface = SC.psurfaces[surface.__id__];
  sc_assert(psurface);

  var element = psurface.__element__;
  sc_assert(element);
  sc_assert(document.getElementById(element.id));
  element.appendChild(input);
  setTimeout(function() {
    SC.RunLoop.begin();
    input.setSelectionRange(0, value.length);
    SC.RunLoop.end();
  }, 0);
};

SC.EndEditingTextLayer = function() {
  var editor = SC.activeEditor;
  if (!editor) return;

  var textLayer = editor.textLayer;
  sc_assert(textLayer);

  var input = editor._sc_input;
  sc_assert(input);
  sc_assert(document.getElementById(input.id));
  textLayer.set('value', input.value);
  input.style.display = 'none';

  SC.activeEditor = null;
  editor.textLayer = null;
  document.body.appendChild(input);
};

SC.ready(function() {
  SC.fieldEditor = SC.FieldEditor.create();
  SC.disabledFieldEditor = SC.FieldEditor.create({ isEnabled: false });
  SC.passwordEditor = SC.FieldEditor.create({ isPassword: true });
  SC.disablePasswordEditor = SC.FieldEditor.create({ isEnabled: false, isPassword: true });
});
