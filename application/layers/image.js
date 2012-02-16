// ==========================================================================
// Project:   Blossom - Modern, Cross-Platform Application Framework
// Copyright: ©2012 Fohr Motion Picture Studios. All rights reserved.
// License:   Licensed under the GPLv3 license (see BLOSSOM-LICENSE).
// ==========================================================================
/*globals BLOSSOM */

sc_require('layers/layer');

SC.ImageLayer = SC.Layer.extend({

  content: null, // should be an SC.Image object

  _sc_contentDidChange: function() {
    var content = this.get('content');
    if (content !== this._sc_content) {
      this._sc_content = content;
      if (content) {
        var el = content.__sc_element__;
        this.__sc_element__ = el;
        this.set('width', el.width);
        this.set('height', el.height);
      } else {
        this.set('width', 0);
        this.set('height', 0);
      }
    }
  }.observes('content'),

  initElement: function() {
    this._sc_contentDidChange();
  }

});

