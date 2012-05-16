// ==========================================================================
// Project:   Blossom - Modern, Cross-Platform Application Framework
// Copyright: ©2012 Fohr Motion Picture Studios. All rights reserved.
// License:   Licensed under the GPLv3 license (see BLOSSOM-LICENSE).
// ==========================================================================
/*globals sc_assert */

sc_require('system/responder');
sc_require('layers/layer');

SC.Widget = SC.Layer.extend(SC.Responder, SC.DelegateSupport, {

  isWidget: true, // Walk like a duck.

  behavior: function(key, val) {
    sc_assert(val === undefined, "This property is read-only.");
    return this;
  }.property().cacheable(),

  // ..........................................................
  // IS ENABLED SUPPORT
  //

  /**
    Set to `true` when the item is enabled.

    This property is observable and bindable.

    @property {Boolean}
  */
  isEnabled: true,
  isEnabledBindingDefault: SC.Binding.oneWay().bool(),

  /** @private
    Observes the `isEnabled` property and resigns first responder if set to 
    `false`.  This will avoid cases where, for example, a disabled text field 
    retains its focus rings.

    @observes isEnabled
  */
  _sc_isEnabledDidChange: function() {
    if (!this.get('isEnabled') && this.get('isFirstResponder')) {
      this.resignFirstResponder();
    }
  }.observes('isEnabled'),

  nextInputResponder: function() {
    var layers = this.getPath('surface.layers'),
        nextInputResponder = null,
        foundSelf = false;

    if (!layers) return null;
    
    layers.forEach(function processLayer(layer) {
      if (nextInputResponder) return;
      else if (foundSelf && layer.get('acceptsFirstResponder')) {
        nextInputResponder = layer;
      } else {
        layer.get('sublayers').forEach(processLayer, this);
      }
  
      if (!nextInputResponder && layer === this) foundSelf = true;
    }, this);

    return nextInputResponder;
  }.property(),

  previousInputResponder: function() {
    var layers = this.getPath('surface.layers'),
        previousInputResponder = null,
        foundSelf = false;

    if (!layers) return null;

    layers.slice().reverse().forEach(function processLayer(layer) {
      if (previousInputResponder) return;
      else if (foundSelf && layer.get('acceptsFirstResponder')) {
        previousInputResponder = layer;
      } else {
        layer.get('sublayers').slice().reverse().forEach(processLayer, this);
      }
  
      if (!previousInputResponder && layer === this) foundSelf = true;
    }, this);

     return previousInputResponder;
  }.property()
  

});
