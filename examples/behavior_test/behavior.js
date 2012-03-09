// ==========================================================================
// Project:   Blossom - Modern, Cross-Platform Application Framework
// Copyright: ©2012 Fohr Motion Picture Studios. All rights reserved.
// License:   Licensed under the GPLv3 license (see BLOSSOM-LICENSE).
// ==========================================================================
/*globals BehaviorTest */

BehaviorTest.Behavior = SC.Behavior.extend({

  trace: true, // enables behavior tracing

  // Required.
  startState: 's2', // the initial state to enter...

  // Required. All named states MUST be unique within the hierarchy.
  states: {

    s: {
      defaultSubstate: 's11',

      // Optional
      // enter: function(original) {},
      // exit: function(original) {},

      // First style, handle the keyDown event with a function.
      keyDown: function(evt, original) {
        switch (evt.getCharString()) {

          case 'e':
            this.transition('s11');
            break;

          case 'i':
            if (this.foo) {
              this.foo = false;
              this.handled();
            }
            break;

          case 'q':
            window.location = '/';
            break;
        }
      },

      s1: {
        defaultSubstate: 's11',

        // Second style, handle the keyDown event with a hash and functions.
        keyDown: {
          'a': function(evt, original) {
            this.transition('s1');
          },

          'b': function(evt, original) {
            this.transition('s11');
          },

          'c': function(evt, original) {
            this.transition('s2');
          },

          'd': function(evt, original) {
            if (!this.foo) {
              this.foo = true;
              this.transition('s');
            }
          },

          'f': function(evt, original) {
            this.transition('s211');
          },

          'i': function(evt, original) {
            this.handled();
          }
        },

        s11: {
          // Third style, handle the keyDown event with a hash and direct 
          // transitions.
          keyDown: {
            'd': function(evt, original) {
                if (this.foo) {
                  this.foo = false;
                  this.transition('s1');
                }
            },

            'g': 's21',
            'h': 's'
          }
        }
      },

      s2: {
        defaultSubstate: 's211',

        // Fourth style, handle the keyDown event with a hash and direct 
        // transitions, functions as strings.
        keyDown: {
          'c': 's1',
          'f': 's11',

          'i': "function(evt, original) {\n            if (!this.foo) {\n              this.foo = true;\n              this.handled();\n            }\n          }"
        },

        s21: {
          defaultSubstate: 's211',

          keyDown: {
            'a': 's21',
            'b': 's211',
            'g': 's1'

          },

          s211: {
            keyDown: {
              'd': 's21',
              'h': 's'
            }
          }
        }
      }
    }
  },

  variables: {
    foo: true
  }

});
