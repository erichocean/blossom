// ==========================================================================
// Project:   Blossom - Modern, Cross-Platform Application Framework
// Copyright: ©2012 Fohr Motion Picture Studios. All rights reserved.
// License:   Licensed under the GPLv3 license (see BLOSSOM-LICENSE).
// ==========================================================================
/*globals BLOSSOM sc_assert */

sc_require('surfaces/leaf');
sc_require('text/text_selection');

if (BLOSSOM) {

var base3 =  "#fdf6e3";
var base03 = "#002b36";

SC.TextSurface = SC.LeafSurface.extend({

  isTextSurface: true, // Walk like a duck.

  value: null,

  _sc_value: null,
  _sc_valueDidChange: function() {
    // console.log('SC.TextSurface#_sc_valueDidChange()', SC.guidFor(this));
    var cur = this.get('value'),
        old = this._sc_value,
        txt = this._sc_textarea,
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

  _sc_backgroundColor: 'white',
  _sc_borderColor: base03,
  _sc_borderWidth: 1,

  // ..........................................................
  // PSURFACE SUPPORT
  //

  __tagName__: 'textarea',

  /** @private */
  didAppendElement: function(textarea) {
    // console.log('SC.TextSurface#didAppendElement()', SC.guidFor(this));
    sc_assert(textarea);
    sc_assert(textarea.id === this.__id__);
    sc_assert(textarea.nodeName === this.__tagName__.toUpperCase());
    sc_assert(document.getElementById(textarea.id));

    this._sc_textarea = textarea; // cache it

    // Become the input surface.
    SC.Event.add(textarea, 'focus', this, this._sc_textAreaDidFocus);

    // There are certain ways users can select text that we can't identify via
    // our key/mouse down/up handlers (such as the user choosing Select All
    // from a menu).
    SC.Event.add(textarea, 'select', this, this._sc_textAreaDidSelect);

    // Keep our value in sync.
    SC.Event.add(textarea, 'change', this, this._sc_textAreaDidChange);
    textarea.value = this.get('value');
  },

  keyUp: function(evt) {
    // console.log('SC.TextSurface#keyUp()', SC.guidFor(this));
    evt.allowDefault(); // We want the browser's behavior here.
    this.set('value', this._sc_textarea.value);
  },

  _sc_textAreaDidFocus: function(evt) {
    // console.log('SC.TextSurface#_sc_textAreaDidFocus()', SC.guidFor(this));
    SC.app.set('inputSurface', this);
  },

  _sc_textAreaDidSelect: function(evt) {
    // console.log('SC.TextSurface#_sc_textAreaDidSelect()', SC.guidFor(this));
    this.notifyPropertyChange('selection');
  },

  _sc_textAreaDidChange: function(evt) {
    // console.log('SC.TextSurface#_sc_textAreaDidChange()', SC.guidFor(this));
    this.set('value', this._sc_textarea.value);
  }

});

} // BLOSSOM
