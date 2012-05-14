// ==========================================================================
// Project:   Blossom - Modern, Cross-Platform Application Framework
// Copyright: ©2012 Fohr Motion Picture Studios. All rights reserved.
// License:   Licensed under the GPLv3 license (see BLOSSOM-LICENSE).
// ==========================================================================
/*globals global BehaviorTest */

BehaviorTest = global.BehaviorTest = SC.View.extend({

  targetResponderForEvent: function(evt) {
    return this;
  },

  __trace__: true, // enable behavior tracing by default...
  foo: false,
  
  __behaviorKey__: 's2', // the initial behavior to enter...
  
  s: function(evt) {
    switch (evt.type) {
      case 'defaultTransition': {
        return this.transition('s11');
      }
      case 'enter': {
        return;
      }
      case 'exit': {
        return;
      }
      case 'keyDown': {
        switch (evt.getCharString()) {
          case 'e': {
            return this.transition('s11');
          }
          case 'i': {
            if (this.foo) {
              this.foo = false;
              return this.handled();
            }
            break;
          }
          case 'q': {
            window.location = 'http://www.google.com'; // goodbye!
            break;
          }
        }
      }
    }
  }.behavior(),
  
  s1: function(evt) {
    switch (evt.type) {
      case 'defaultTransition': {
        return this.transition('s11');
      }
      case 'enter': {
       return;
      }
      case 'exit': {
        return;
      }
      case 'keyDown': {
        switch (evt.getCharString()) {
          case 'a': {
            return this.transition('s1');
          }
          case 'b': {
            return this.transition('s11');
          }
          case 'c': {
            return this.transition('s2');
          }
          case 'd': {
            if (!this.foo) {
              this.foo = true;
              return this.transition('s');
            }
            break;
          }
          case 'f': {
            return this.transition('s211');
          }
          case 'i': {
            return this.handled();
          }
        }
      }
    }
  }.behavior('s'),
  
  s11: function(evt) {
    switch (evt.type) {
      case 'enter': {
        return;
      }
      case 'exit': {
        return;
      }
      case 'keyDown': {
        switch (evt.getCharString()) {
          case 'd': {
            if (this.foo) {
              this.foo = false;
              return this.transition('s1');
            }
            break;
          }
          case 'g': {
            return this.transition('s21');
          }
          case 'h': {
            return this.transition('s');
          }
        }
      }
    }
  }.behavior('s1'),
  
  s2: function(evt) {
    switch (evt.type) {
      case 'defaultTransition': {
        return this.transition('s211');
      }
      case 'enter': {
        return;
      }
      case 'exit': {
        return;
      }
      case 'keyDown': {
        switch (evt.getCharString()) {
          case 'c': {
            return this.transition('s1');
          }
          case 'f': {
            return this.transition('s11');
          }
          case 'i': {
            if (!this.foo) {
              this.foo = true;
              return this.handled();
            }
            break;
          }
        }
      }
    }
  }.behavior('s'),
  
  s21: function(evt){
    switch (evt.type) {
      case 'defaultTransition': {
        return this.transition('s211');
      }
      case 'enter': {
        return;
      }
      case 'exit': {
        return;
      }
      case 'keyDown': {
        switch (evt.getCharString()) {
          case 'a': {
            return this.transition('s21');
          }
          case 'b': {
            return this.transition('s211');
          }
          case 'g': {
            return this.transition('s1');
          }
        }
      }
    }
  }.behavior('s2'),
  
  s211: function(evt) {
    switch (evt.type) {
      case 'enter': {
        return;
      }
      case 'exit': {
        return;
      }
      case 'keyDown': {
        switch (evt.getCharString()) {
          case 'd': {
            return this.transition('s21');
          }
          case 'h': {
            return this.transition('s');
          }
        }
      }
    }
  }.behavior('s21')

});
