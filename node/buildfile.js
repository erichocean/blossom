// ==========================================================================
// Project:   Blossom - Modern, Cross-Platform Application Framework
// Copyright: ©2012 Fohr Motion Picture Studios. All rights reserved.
// License:   Licensed under the GPLv3 license (see BLOSSOM-LICENSE).
// ==========================================================================
/*globals BT require */

module.exports = BT.Framework.create({
  "frameworks": "foundation application datastore".w(),

  "foundation": require('../foundation/node/buildfile'),
  "application": require('../application/node/buildfile'),
  "datastore": require('../datastore/node/buildfile')
});
