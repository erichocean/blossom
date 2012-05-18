// ==========================================================================
// Project:   Blossom - Modern, Cross-Platform Application Framework
// Copyright: ©2012 Fohr Motion Picture Studios. All rights reserved.
// License:   Licensed under the GPLv3 license (see BLOSSOM-LICENSE).
// ==========================================================================
/*globals BehaviorTest */

function main() {
  var ui = BehaviorTest.create();
  SC.app.set('ui', ui);
  
  // Synthesize some events.  See the console log for results.
  'a b d e i f i i f a b d d e g h h c g c c'.w().forEach(function(letter) {
    var charCode ;
    
    switch (letter) {
      case 'a': charCode = 97 ; break ;
      case 'b': charCode = 98 ; break ;
      case 'c': charCode = 99 ; break ;
      case 'd': charCode = 100 ; break ;
      case 'e': charCode = 101 ; break ;
      case 'f': charCode = 102 ; break ;
      case 'g': charCode = 103 ; break ;
      case 'h': charCode = 104 ; break ;
      case 'i': charCode = 105 ; break ;
    }

    var evt = SC.Event.create({
      type: 'keydown',
      target: document,
      keyCode: letter,
      charCode: charCode,
      preventDefault: function() { this.cancelled = true; },
      stopPropagation: function() { this.bubble = false; },
      allowDefault: function() { this.hasCustomEventHandling = true; },
      timeStamp: Date.now(),
      bubble: true,
      cancelled: false,
      normalized: true
    });

    SC.Event.trigger(document, 'keydown', evt);
  });
}
