// ==========================================================================
// Project:   Blossom - Modern, Cross-Platform Application Framework
// Copyright: ©2012 Fohr Motion Picture Studios. All rights reserved.
// License:   Licensed under the GPLv3 license (see BLOSSOM-LICENSE).
// ==========================================================================
/*globals BT require */

module.exports = BT.Framework.create({
  "frameworks": "bootstrap runtime internal".w(),

  "bootstrap": require('../bootstrap/node/buildfile'),
  "runtime": require('../runtime/node/buildfile'),
  "internal": require('../foundation/node/buildfile')
});
