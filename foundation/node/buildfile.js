// ==========================================================================
// Project:   Blossom - Modern, Cross-Platform Application Framework
// Copyright: ©2012 Fohr Motion Picture Studios. All rights reserved.
// License:   Licensed under the GPLv3 license (see BLOSSOM-LICENSE).
// ==========================================================================
/*globals BT require __dirname */

var path = require('path');

module.exports = BT.Framework.create({
  "frameworks": "bootstrap runtime".w(),

  sourceTree: path.join(__dirname, ".."),

  "bootstrap": require('../bootstrap/node/buildfile'),
  "runtime": require('../runtime/node/buildfile')
});
