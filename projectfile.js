// ==========================================================================
// Project:   Blossom - Modern, Cross-Platform Application Framework
// Copyright: ©2012 Fohr Motion Picture Studios. All rights reserved.
// License:   Licensed under the GPLv3 license (see BLOSSOM-LICENSE).
// ==========================================================================
/*globals global require __dirname BT */

require('./buildtools'); // adds the SC and BT namespaces as globals

var path = require('path');

var project = BT.Project.create({
  "static": BT.Directory.create({
    "blossom_test": require('./examples/blossom_test'),
    "quaddemo": require('./examples/quaddemo'),
    "text_demo": require('./examples/text_demo'),
    "stage_test": require('./examples/stage_test'),
    "bullet_test": require('./examples/bullet_test'),
    "box2d_test": require('./examples/box2d_test'),
    "sproutcore": require('./node/buildfile'),

    // no sc_static() support yet, so give our image a nice and easy path
    "sc-theme-repeat-x.png": BT.File.create({
      sourcePath: path.join(__dirname, "application/resources/classic/images/sc-theme-repeat-x.png"),
      mimeType: 'image/png'
    })
  })
});

// project.accept(BT.LoggingVisitor.create());

BT.Server.create({
  project: project
});