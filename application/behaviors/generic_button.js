// ==========================================================================
// Project:   Blossom - Modern, Cross-Platform Application Framework
// Copyright: ©2012 Fohr Motion Picture Studios. All rights reserved.
// License:   Licensed under the GPLv3 license (see BLOSSOM-LICENSE).
// ==========================================================================
/*globals sc_assert */

sc_require('behaviors/behavior') ;

SC.GenericButtonBehavior = SC.Behavior.extend({

  // Required
  startState: 'Enable immediately?',

  // Optional, used to configure a layer's initial properties.
  defaultState: 'Enabled',

  // Required. All named states MUST be unique within the hierarchy.
  states: {

    // This is an internal, transient state. It MUST transition to another 
    // state, and it will NEVER be visible externally as a state.
    'Enable immediately?': function() {
      if (!this.get('isEnabled')) this.transition('Disabled');
      else this.transition('Activate immediately?');
    },

    // This is also a transient state (same rules as above apply).
    'Activate immediately?': function() {
      // No special behavior here (hook for subclasses)
      this.transition('Enabled');
    },

    'Inactive': {

      'Enabled': {
        $disable: 'Disabled',
        $activate: 'Ready'
      },

      'Disabled': {
        $enable: 'Activate immediately?'
      }

    },

    'Active': {
      '$enter dialogue': 'Dialogue',

      'Ready': {
        $disable: 'Disabled',
        $deactivate: 'Enabled'
      },

      'Invoked': {
        $activate: 'Ready'
      }
    },

    'Dialogue': {
      defaultSubstate: 'Choose Default',

      $disable: function() {
        this.triggerAction('cancel');
        this.transition('Disabled');
      },

      'Choose Default': function() {
        switch (this.get('defaultChoice')) {
          case 'cancel':
            this.transition('Choose Cancel');
            break;
          case 'confirm':
            this.transition('Choose Confirm');
            break;
          default:
            console.log("SC.ButtonBehavior: Invalid 'defaultChoice':", this.get('defaultChoice'), "Disabling behavior.");
            this.triggerAction('cancel');
            this.transition('Disabled');
        }
      },

      'Choose Cancel': {
        '$choose confirm': 'Choose Confirm',
        '$exit dialogue': function() {
          this.triggerAction('cancel');
          this.transition('Enabled');
        }
      },

      'Choose Confirm': {
        '$choose cancel': 'Choose Cancel',
        '$exit dialogue': function() {
          this.triggerAction('confirm');
          this.transition('Executed');
        }
      }
    }

  },

  variables: {
    defaultChoice: 'cancel',
    enable: true
  },

  actions: ['cancel', 'confirm']

});
