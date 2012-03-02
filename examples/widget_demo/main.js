// ==========================================================================
// Project:   Blossom - Modern, Cross-Platform Application Framework
// Copyright: ©2012 Fohr Motion Picture Studios. All rights reserved.
// License:   Licensed under the GPLv3 license (see BLOSSOM-LICENSE).
// ==========================================================================
/*global WidgetDemo */

sc_require('tabs');

SC.ENABLE_CSS_TRANSITIONS = false;

function main() {
  SC.Application.create();
  SC.app.set('ui', WidgetDemo.tabsSurface);
}
