// ==========================================================================
// Project:   Blossom - Modern, Cross-Platform Application Framework
// Copyright: ©2012 Fohr Motion Picture Studios. All rights reserved.
// License:   Licensed under the GPLv3 license (see BLOSSOM-LICENSE).
// ==========================================================================
/*globals BLOSSOM sc_assert */

sc_require('surfaces/leaf');

if (BLOSSOM) {

SC.FieldEditor = SC.LeafSurface.extend({

  isFieldEditor: true

});

} // BLOSSOM