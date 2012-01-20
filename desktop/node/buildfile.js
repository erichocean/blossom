// ==========================================================================
// Project:   Blossom - Modern, Cross-Platform Application Framework
// Copyright: ©2012 Fohr Motion Picture Studios. All rights reserved.
// License:   Licensed under the GPLv3 license (see BLOSSOM-LICENSE).
// ==========================================================================
/*globals BT require */

module.exports = BT.Framework.create({
  "frameworks": "desktop statechart plugin debug".w(),

  "desktop": require('../desktop/node/buildfile'),
  "statechart": require('../statechart/node/buildfile'),
  "plugin": require('../plugin/node/buildfile'),
  "debug": require('../debug/node/buildfile')
});
