// ==========================================================================
// Project:   Blossom - Modern, Cross-Platform Application Framework
// Copyright: ©2012 Fohr Motion Picture Studios. All rights reserved.
// License:   Licensed under the GPLv3 license (see BLOSSOM-LICENSE).
// ==========================================================================
/*globals sc_assert */

sc_require('widgets/widget');

SC.DateWidget = SC.Widget.extend({

  render: function(ctx) {
    ctx.fillStyle = 'blue';
    ctx.fillRect(0,0,ctx.width,ctx.height);
  }

});