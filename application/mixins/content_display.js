// ==========================================================================
// Project:   SproutCore - JavaScript Application Framework
// Copyright: ©2006-2011 Strobe Inc. and contributors.
//            Portions ©2008-2010 Apple Inc. All rights reserved.
//            Code within if (BLOSSOM) {} sections is ©2012 Fohr Motion 
//            Picture Studios. All rights reserved.
// License:   Most code licensed under MIT license (see SPROUTCORE-LICENSE).
//            Code within if (BLOSSOM) {} sections is under GPLv3 license
//            (see BLOSSOM-LICENSE).
// ==========================================================================
/*globals BLOSSOM */

/**
  @namespace

  The SC.ContentDisplay mixin makes it easy to automatically update your view
  display whenever relevant properties on a content object change.  To use
  this mixin, include it in your view and then add the names of the 
  properties on the content object you want to trigger a displayDidChange() 
  method on your view. Your updateDisplay() method will then be called at the 
  end of the run loop.
  
  h2. Example
  
  {{{
    MyApp.MyViewClass = SC.View.extend(SC.ContentDisplay, { 
      contentDisplayProperties: 'title isEnabled hasChildren'.w(),
      ...
    });
  }}}
  
  @since SproutCore 1.0
*/
SC.ContentDisplay = {
  
  /** @private */
  concatenatedProperties: 'contentDisplayProperties',

  /** @private */
  displayProperties: ['content'],
  
  /** 
    Add an array with the names of any property on the content object that
    should trigger an update of the display for your view.  Changes to the
    content object will only invoke your display method once per runloop.
    
    @property {Array}
  */
  contentDisplayProperties: [],

  /** @private
    Setup observers on the content object when initializing the mixin.
  */
  initMixin: function() {
    this._sc_displayContentDidChange();
  },

  /**
   * Remove observer on existing content object, if present
   * @private
   */
  destroyMixin: function () {
    if (!this._sc_displayContent) return;
    this._sc_displayStopObservingContent(this._sc_displayContent);
    this._sc_displayContent = null;
  },

  /** @private */
  _sc_displayBeginObservingContent: function(content) {
    var f = this._sc_displayContentPropertyDidChange;

    if (SC.isArray(content)) {
      content.invoke('addObserver', '*', this, f);
    }
    else if (content.addObserver) {
      content.addObserver('*', this, f);
    }
  },

  /** @private */
  _sc_displayStopObservingContent: function(content) {
    var f = this._sc_displayContentPropertyDidChange;

    if (SC.isArray(content)) {
      content.invoke('removeObserver', '*', this, f);
    }
    else if (content.removeObserver) {
      content.removeObserver('*', this, f);
    }
  },

  /** @private */
  _sc_displayContentDidChange: function(target, key, value) {
    // handle changes to the content...
    if ((value = this.get('content')) === this._sc_displayContent) return;

    // stop listening to old content.
    var content = this._sc_displayContent;
    if (content) this._sc_displayStopObservingContent(content);

    // start listening for changes on the new content object.
    content = this._sc_displayContent = value;
    if (content) this._sc_displayBeginObservingContent(content);

    if (BLOSSOM) {
      this.triggerRendering();
    }
    if (! BLOSSOM) {
      this.displayDidChange();
    }
  }.observes('content', 'contentDisplayProperties'),

  /** @private Invoked when properties on the content object change. */
  _sc_displayContentPropertyDidChange: function(target, key, value, propertyRevision) {
    if (key === '*') {
      if (BLOSSOM) {
        this.triggerRendering();
      }
      if (! BLOSSOM) {
        this.displayDidChange();
      }
    } else {
      // only update if a displayProperty actually changed...s
      var ary = this.get('contentDisplayProperties') ;
      if (ary && ary.indexOf(key)>=0) {
        if (BLOSSOM) {
          this.triggerRendering();
        }
        if (! BLOSSOM) {
          this.displayDidChange();
        }
      }
    }
  }

};
