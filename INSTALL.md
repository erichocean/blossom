You need to install Node 0.6.5 or higher:

    http://nodejs.org/

This automatically includes `npm`, the Node Package Manager.

Next you'll need to get a copy of Blossom itself. The easiest way is to use 
`git` and clone the Blossom repository on GitHub:

    cd /directory/where/you/want/your/blossom/install/
    git clone https://github.com/fohr/blossom.git

Next, install the following Node packages:

    cd blossom
    npm install

To view Blossom's current testing app, do:

    node projectfile.js

and then open up [http://localhost:4020/blossom_test](http://localhost:4020/blossom_test).

To run the foundation framework tests, do:

    node testrunner.js tests/foundation

To run the datastore framework tests, do:

    node testrunner.js tests/datastore

In either case, you should see output that looks something like this:

    · ✓ OK » 1 honored (0.002s)

To run a specific test, just do:

    node testrunner.js tests/path/to/test.js

The infrastructure for testing the application framework and apps you build 
with Blossom is coming soon.

Questions? Ask on the #blossom channel at irc.freenode.net.