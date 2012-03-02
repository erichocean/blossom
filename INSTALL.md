You need to install Node 0.6.5 or higher:

    http://nodejs.org/

This automatically includes `npm`, the Node Package Manager.

Next you'll need to get a copy of Blossom itself. The easiest way is to use 
`git` and clone the Blossom repository on GitHub:

    cd /directory/where/you/want/your/blossom/install/
    git clone https://github.com/fohr/blossom.git

Next, install any required Node packages:

    cd blossom
    npm install

Then start up Blossom's development server:

    node projectfile.js

Go to [http://localhost:4020/](http://localhost:4020/). You'll see 
a list of demo apps you can run. Click on the one you want to try.

To run the foundation framework tests, do:

    node testrunner.js tests/foundation

To run the datastore framework tests, do:

    node testrunner.js tests/datastore

In either case, you should see output that looks something like this:

    · ✓ OK » 1 honored (0.002s)

To run a specific test, just do:

    node testrunner.js tests/path/to/test.js

Some tests currently fail because they have not been updated for our 
Vows-based test runner. Patches welcome!

Note: The infrastructure for testing the application framework and apps you build 
with Blossom is coming soon.

Questions? Ask on the #blossom channel at irc.freenode.net.