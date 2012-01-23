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

    // in your projectfile.js
    require('blossom/buildtools'); // needed to bring in the BT global

    var project = BT.Project.create({
      "foundation": require('blossom/foundation'), // required dependency
      "application": require('blossom/application')
    });
