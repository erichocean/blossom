# Blossom's Datastore framework

This framework includes all of the model-layer code in Blossom. It is 
designed to run in browsers, on Node, and on all of Blossom's native runtimes.

The Datastore framework requires Blossom's Foundation framework to run.

If you have installed Blossom as an `npm` module (see `npm link`), you can 
include Blossom's Datastore framework in your code like this:

  // in projectfile.js
  var project = SC.Project.create({
    "foundation": require('blossom/foundation'), // required dependency
    "datastore": require('blossom/datastore')
  });
