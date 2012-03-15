// ==========================================================================
// Project:   Blossom - Modern, Cross-Platform Application Framework
// Copyright: ©2012 Fohr Motion Picture Studios. All rights reserved.
// License:   Licensed under the GPLv3 license (see BLOSSOM-LICENSE).
// ==========================================================================
/*globals sc_assert */

sc_require('behaviors/generic_button');

SC.MouseButtonBehavior = SC.GenericButtonBehavior.extend({

  // Required. All named states MUST be unique within the hierarchy.  State 
  // heirarchy must be consistent with parent behavior everywhere;  however, 
  // it is acceptable to omit states and state trees that are unchanged from 
  // the parent.
  states: {

    // Override the generic implementation
    'Activate immediately?': function(original) {
      var mouse = SC.app.__lastMouseCoordinates__,
          frame = this.__layer__.get('frameInViewport');

      if (SC.IsPointInRect(mouse, frame)) {
        this.transition('Ready');
      } else {
        this.transition('Enabled');
      }
    },

    'Inactive': {

       'Enabled': {
        mouseEntered: '$activate'        // Maps 'mouseEntered' to the '$activate' author event.
      }
    },

    'Active': {
      mouseDown: '$enter dialogue',      // Maps 'mouseDown' to the '$enter dialogue' author event.

      'Ready': {
        mouseExited: '$deactivate'       // Maps 'mouseExited' to the '$deactivate' author event.
      },

      'Invoked': {
        enter: function() {
          this.triggerTimeout(300);      // In milliseconds. Timeout cleared automatically.
        },

        timeout: '$activate',            // Maps 'timeout' to the '$activate' author event.
        mouseMoved: '$activate'          // Maps 'mouseMoved' to the '$activate' author event.
      }
    },

    'Dialogue': {

      'Choose Cancel': {
        mouseEntered: '$choose confirm', // Maps 'mouseEntered' to the '$choose confirm' author event.
        mouseUp: '$exit dialogue'        // Maps 'mouseUp' to the '$exit dialogue' author event.
      },

      'Choose Confirm': {
        mouseExited: '$choose cancel',   // Maps 'mouseExited' to the '$choose cancel' author event.
        mouseUp: '$exit dialogue'        // Maps 'mouseUp' to the '$exit dialogue' author event.
      }
    }

  },

  // Overrides our superclass' defaults.
  variables: {
    defaultChoice: 'confirm'
  }

});
