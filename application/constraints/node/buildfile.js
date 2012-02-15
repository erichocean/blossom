// ==========================================================================
// Project:   Cassowary Constraint Solving Toolkit for Blossom
// Copyright: ©1998-2000 Greg J. Badros
//            Portions ©2012 Alex Rusell (slightlyoff@chromium.org)
//            Code within if (BLOSSOM) {} sections is ©2012 Fohr Motion 
//            Picture Studios. All rights reserved.
// License:   Most code licensed under LGPLv2 license (see CASSOWARY-LICENSE).
//            Code within if (BLOSSOM) {} sections is under GPLv3 license
//            (see BLOSSOM-LICENSE).
// ==========================================================================
/*globals BT require __dirname */

var path = require('path');

module.exports = BT.Framework.create({

  sourceTree: path.join(__dirname, "..")

});
