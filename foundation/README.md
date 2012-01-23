# Blossom's Foundation framework

This framework includes all of the non-Application, non-Datastore code in 
Blossom. It is designed to run in browsers, on Node, and on all of Blossom's 
native runtimes.

Blossom's Datastore and Application frameworks both require Blossom's 
Foundation framework to run.

If you have installed Blossom as an `npm` module (see `npm link`), you can 
include Blossom's Foundation framework in your code like this:

```javascript
// in your projectfile.js
require('blossom/buildtools'); // needed to bring in the BT global

var project = BT.Project.create({
  "foundation": require('blossom/foundation')
});
```