// ==========================================================================
// Project:   Blossom - Modern, Cross-Platform Application Framework
// Copyright: ©2012 Fohr Motion Picture Studios. All rights reserved.
// License:   Licensed under the GPLv3 license (see BLOSSOM-LICENSE).
// ==========================================================================
/*globals BLOSSOM sc_assert */

sc_require('behaviors/generic_button');

if (BLOSSOM) {

SC.TouchButtonBehavior = SC.GenericButtonBehavior.extend({

  // Required. All named states MUST be unique within the hierarchy.  State 
  // heirarchy must be consistent with parent behavior everywhere;  however, 
  // it is acceptable to omit states and state trees that are unchanged from 
  // the parent.
  states: {

    // Override the generic implementation
    'Enable immediately?': function(original) {
      if (!this.get('isEnabled')) this.transition('Disabled');
      else this.transition('Enabled');
    },

    // Disable this state and its substates as possible transition targets.
    'Activate immediately?': null,

    'Inactive': {
 
      'Enabled': {
        $activate: null,                 // Disables this author event.
        touchStarted: 'Dialogue'
      }
    },

    // Disable this state and its substates as possible transition targets.
    'Active': null,

    'Dialogue': {

      'Choose Cancel': {
        touchEntered: '$choose confirm', // Maps 'touchEntered' to the '$choose confirm' author event.

        touchEnded: '$exit dialogue'     // Maps 'touchEnded' to the '$exit dialogue' author event.
      },

      'Choose Confirm': {
        '$exit dialogue': null,          // Disables this author event.

        touchExited: '$choose cancel',   // Maps 'touchExited' to the '$choose cancel' author event.

        touchEnded: function(evt) {
          this.triggerAction('confirm');
          this.transition('Enabled');
        }
      }
    }

  },

  // Overrides our superclass' defaults.
  variables: {
    defaultChoice: 'confirm'
  }

});

} // BLOSSOM
