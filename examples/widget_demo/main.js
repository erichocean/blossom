// ==========================================================================
// Project:   Blossom - Modern, Cross-Platform Application Framework
// Copyright: ©2012 Fohr Motion Picture Studios. All rights reserved.
// License:   Licensed under the GPLv3 license (see BLOSSOM-LICENSE).
// ==========================================================================
/*global WidgetDemo */

sc_require('buttons');
sc_require('controls');

function main() {
  SC.Application.create();
  SC.app.set('ui', WidgetDemo.buttonsSurface);
  // SC.app.set('ui', WidgetDemo.controlsSurface);
}
