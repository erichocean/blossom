// ==========================================================================
// Project:   Blossom - Modern, Cross-Platform Application Framework
// Copyright: ©2012 Fohr Motion Picture Studios. All rights reserved.
// License:   Licensed under the GPLv3 license (see BLOSSOM-LICENSE).
// ==========================================================================
/*globals BT require __dirname */

var path = require('path');

module.exports = BT.Framework.create({
  "frameworks": "desktop".w(),

  sourceTree: path.join(__dirname, ".."),

  "desktop": require('../desktop/node/buildfile')
});
