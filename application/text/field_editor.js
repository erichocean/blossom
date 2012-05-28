// ==========================================================================
// Project:   Blossom - Modern, Cross-Platform Application Framework
// Copyright: ©2012 Fohr Motion Picture Studios. All rights reserved.
// License:   Licensed under the GPLv3 license (see BLOSSOM-LICENSE).
// ==========================================================================
/*globals sc_assert */

sc_require('system/responder');
sc_require('surfaces/leaf');

SC.FieldEditor = SC.Object.extend(SC.Responder, {

  isFieldEditor: true, // Walk like a duck.

  isPassword: false,

  isEnabled: true,

  widget: null,

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

    // This happens when our 'value' was updated by our input element. Avoid 
    // a loop by not setting 'value' on the input element again.
    if (cur === val) {
      this._sc_value = cur;

    // This happens when our 'value' has been updated by anyone but our 
    // input element.  Let our input element know we've changed.
    } else {
      this._sc_value = cur;
      txt.value = cur;
    }
  }.observes('value'),

  selection: function(key, value) {
    var input = this._sc_input;

    if (value !== undefined) {
      sc_assert(value instanceof SC.TextSelection);
      sc_assert(value.isValid);

      if (!input.value) {
        input.setSelectionRange(0, 0);
      } else {
        input.setSelectionRange(value.start, value.end);
      }
    } else {
      return new SC.TextSelection(input.selectionStart, input.selectionEnd);
    }
  }.property('value'),

  surface: function() {
    return this;
  }.property(),

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
    // console.log('SC.FieldEditor#keyDown()', this.isPassword? 'password' : 'text', evt);

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

    // Handle control-a/command-a specially, for some some reason 
    // evt.allowDefault() is not getting the job done...
    if (evt.keyCode === 65 && (evt.metaKey || evt.ctrlKey)) {
      // Select all text.
      var that = this;
      setTimeout(function() {
        SC.RunLoop.begin();
        var input = that._sc_input,
            value = input.value;

        input.setSelectionRange(0, value? value.length : 0);
        SC.RunLoop.end();
      }, 0);
    }

    var widget = this.widget;
    if (widget) widget.tryToPerform('keyDown', evt);

    if (evt.which === 9) {
      evt.preventDefault();
      console.log('evt.shiftKey', evt.shiftKey);
      var nextInputResponder = evt.shiftKey? widget.get('previousInputResponder') : widget.get('nextInputResponder');
      if (nextInputResponder && nextInputResponder.isTextField) {
        SC.OpenFieldEditorFor(nextInputResponder);
      } else {
        SC.CloseFieldEditor();
      }
    } else if (evt.keyCode === 13) {
      SC.CloseFieldEditor();
    }
  },

  keyUp: function(evt) {
    // console.log('SC.FieldEditor#keyUp()', this.isPassword? 'password' : 'text');
    if (this.get('isEnabled')) {
      evt.allowDefault(); // We want the browser's behavior here.
      this.set('value', this._sc_input.value);
    } else evt.preventDefault();

    var widget = this.widget;
    if (widget) widget.tryToPerform('keyUp', evt);
  },

  mouseDown: function(evt) {
    // console.log('SC.FieldEditor#mouseDown()');
    var widget = this.widget;
    if (widget) widget.tryToPerform('mouseDown', evt);
    evt.allowDefault();
  },

  mouseMoved: function(evt) {
    var widget = this.widget;
    if (widget) widget.tryToPerform('mouseMoved', evt);
  },

  mouseUp: function(evt) {
    var widget = this.widget;
    if (widget) widget.tryToPerform('mouseUp', evt);
    evt.allowDefault();
  },

  _sc_inputDidFocus: function(evt) {
    // console.log('SC.FieldEditor#_sc_inputDidFocus()', this.isPassword? 'password' : 'text');
    SC.app.set('fieldEditor', this);
  },

  _sc_inputDidBlur: function(evt) {
    // console.log('SC.FieldEditor#_sc_inputDidBlur()', this.isPassword? 'password' : 'text', evt);
    SC.CloseFieldEditor();
    SC.app.set('fieldEditor', null);
  },

  _sc_inputDidSelect: function(evt) {
    // console.log('SC.FieldEditor#_sc_inputDidSelect()', this.isPassword? 'password' : 'text');
    this.notifyPropertyChange('selection');
  },

  _sc_inputDidChange: function(evt) {
    // console.log('SC.FieldEditor#_sc_inputDidChange()', this.isPassword? 'password' : 'text');
    SC.CloseFieldEditor();
  }

});

SC.OpenFieldEditorFor = function(widget) {
  console.log('SC.OpenFieldEditorFor');
  sc_assert(widget);
  sc_assert(widget.isWidget);

  if (SC.activeEditor && SC.activeEditor.widget === widget) return;

  var editor = widget.get('isEnabled')
      ? SC.fieldEditor
      : SC.disabledFieldEditor;

  SC._sc_openEditorForWidget(editor, widget);
};

SC.OpenPasswordEditorFor = function(widget) {
  console.log('SC.OpenPasswordEditorFor');
  sc_assert(widget);
  sc_assert(widget.isWidget);

  if (SC.activeEditor && SC.activeEditor.widget === widget) return;

  var editor = widget.get('isEnabled')
      ? SC.passwordEditor
      : SC.disabledPasswordEditor;

  SC._sc_openEditorForWidget(editor, widget);
};

/** @private */
SC._sc_openEditorForWidget = function(editor, widget) {
  sc_assert(editor);
  sc_assert(editor.isFieldEditor);
  sc_assert(widget);
  sc_assert(widget.isWidget);

  if (SC.activeEditor) SC.CloseFieldEditor();

  editor.widget = widget;
  SC.activeEditor = editor;

  var input = editor._sc_input;
  sc_assert(input);
  sc_assert(document.getElementById(input.id));

  widget.tryToPerform('styleInputElement', input);

  var surface = widget.computeSupersurface();
  sc_assert(surface);
  var psurface = SC.psurfaces[surface.__id__];
  sc_assert(psurface);
  var element = psurface.__element__;
  sc_assert(element);
  sc_assert(document.getElementById(element.id));

  element.appendChild(input);

  // Need to use setTimeout(), it must be the next event cycle.
  setTimeout(function() {
    SC.RunLoop.begin();
    widget.tryToPerform('setSelectionForInputElement', input);
    SC.RunLoop.end();
  }, 0);
};

SC.CloseFieldEditor = function() {
  console.log('SC.CloseFieldEditor');
  var editor = SC.activeEditor;
  if (!editor) return;

  var widget = editor.widget;
  sc_assert(widget);

  var input = editor._sc_input;
  sc_assert(input);
  sc_assert(document.getElementById(input.id));

  SC.activeEditor = null;
  editor.widget = null;
  SC.app.set('fieldEditor', null);

  var value = input.value,
      old;

  input.style.display = 'none';
  document.body.appendChild(input);

  if (widget.get('isEnabled')) {
    if (widget.valueForFieldEditor) {
      old = widget.valueForFieldEditor();
    } else {
      old = widget.get('value');
    }

    if (old !== value) {
      if (widget.takeValueFromFieldEditor) widget.takeValueFromFieldEditor(value);
      else {
        widget.set('value', value);
      }
    }
  }

  widget.tryToPerform('fieldEditorDidClose');
};

SC.ready(function() {
  SC.fieldEditor = SC.FieldEditor.create();
  SC.disabledFieldEditor = SC.FieldEditor.create({ isEnabled: false });
  SC.passwordEditor = SC.FieldEditor.create({ isPassword: true });
  SC.disablePasswordEditor = SC.FieldEditor.create({ isEnabled: false, isPassword: true });
});
