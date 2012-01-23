# Blossom's Application framework

This framework includes all of the application code in Blossom, for both 
mouse-driven platforms and mobile/touch platforms. It is designed to run in 
browsers and on all of Blossom's native runtimes. (It is not currently 
designed to run in Node.)

The Application framework requires Blossom's Foundation framework to run. You 
can optionally use Blossom's Datastore framework for your app's model layer 
(recommended).

If you have installed Blossom as an `npm` module (see `npm link`), you can 
include Blossom's Application framework in your code like this:

    // in projectfile.js, somewhere in your SC.Project definition
    var project = SC.Project.create({
      "foundation": require('blossom/foundation'), // required dependency
      "application": require('blossom/application')
    });
