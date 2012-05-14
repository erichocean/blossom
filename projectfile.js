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
    "form_demo": require('./examples/form_demo'),
    "widget_demo": require('./examples/widget_demo'),
    "view_demo": require('./examples/view_demo'),
    "splitsurface_demo": require('./examples/splitsurface_demo'),
    "surface_test": require('./examples/surface_test'),
    "scroll_demo": require('./examples/scroll_demo'),
    "constraints_demo": require('./examples/constraints_demo'),
    "bindings_demo": require('./examples/bindings_demo'),
    "psurfaces_test": require('./examples/psurfaces_test'),
    "text_demo": require('./examples/text_demo'),
    "list_demo": require('./examples/list_demo'),
    // "stage_test": require('./examples/stage_test'),
    "behavior_test": require('./examples/behavior_test'),
    // "bullet_test": require('./examples/bullet_test'),
    // "box2d_test": require('./examples/box2d_test'),

    // A one-off app target that results in just the code for blossom.
    "blossom-latest": BT.App.create({
      frameworks: 'sproutcore'.w(),
      sourceTree: path.join(__dirname, "examples/blossom-latest")
    }),

    "sproutcore": require('./node/buildfile'),

    // no sc_static() support yet, so give our image a nice and easy path
    "sc-theme-repeat-x.png": BT.File.create({
      sourcePath: path.join(__dirname, "application/resources/classic/images/sc-theme-repeat-x.png"),
      mimeType: 'image/png'
    })
  })
});

// project.accept(BT.LoggingVisitor.create());

project.serve();
// project.build();
