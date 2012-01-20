// ==========================================================================
// Project:   Blossom - Modern, Cross-Platform Application Framework
// Copyright: ©2012 Fohr Motion Picture Studios. All rights reserved.
// License:   Licensed under the GPLv3 license (see BLOSSOM-LICENSE).
// ==========================================================================
/*globals global require __dirname BT */

require('./buildtools'); // adds the SC and BT namespaces as globals

var project = BT.Project.create({
  "static": BT.Directory.create({
    "blossom_test": require('./examples/blossom_test'),
    "stage_test": require('./examples/stage_test'),
    "bullet_test": require('./examples/bullet_test'),
    "box2d_test": require('./examples/box2d_test'),
    "sproutcore": require('./node/buildfile')
  })
});

// project.accept(BT.LoggingVisitor.create());

BT.Server.create({
  project: project
});