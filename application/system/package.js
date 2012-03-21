
sc_require('tasks/task');

// for development
SC.DEBUG_PACKAGES = true;

//...............................................
// Package mode is set globally and allows (mostly for
// development but may serve other purposes) for
// only specific portions of code to be evaluated.
// For instance, if during developement there is a need
// to test only the model layer one would not want to
// include any views or (possibly) control layer objects
// or else it would require loading the entire sproutcore
// framework to run it. Any combination of these settings
// could be used.
SC.PACKAGE_MODE_MODELS      = 0x01; 
SC.PACKAGE_MODE_VIEWS       = 0x02;
SC.PACKAGE_MODE_CONTROLLERS = 0x04;
// Other is simply mixins/ext/runtime code not otherwise
// categorized that *should* not be dependent on layers
// not otherwise specified to include. Ultimately that
// is the perogative of the developer.
SC.PACKAGE_MODE_OTHER       = 0x08;
// The normal mode includes all of the possible flags
SC.PACKAGE_MODE_NORMAL      = 0x16;
// The default package flag is set here but can be
// overridden later or by an extended SC.Package class.
SC.PACKAGE_MODE = SC.PACKAGE_MODE_NORMAL;

/**
  @class

  By default, packages are logically separated containers of code
  built-out by the build tools that can be included in the
  running application in various forms (core, lazy or demand).

  TODO: complete documentation
*/
SC.Package = SC.Object.extend(
  /** @scope SC.Package.prototype */ {

  /** @private */
  log: SC.DEBUG_PACKAGES,

  /**
    Determines if a package's source has been loaded.

    @param {String|Object} packageName The name of the package
      or the package hash.
    @returns {Boolean} YES|NO if the package's source has been loaded.
  */
  isLoaded: function(packageName) {
    var packages = SC.PACKAGE_MANIFEST;
    var package;
    if(SC.typeOf(packageName) === SC.T_HASH) {
      package = packageName;
    } else { package = packages[packageName]; }
    if(!package) throw "SC.Package.isLoaded() could not find '%@'".fmt(packageName);
    return !! package.isLoaded;
  },

  /**
    Attempt to load a requested package.

    TODO: needs complete documentation.
  */
  loadPackage: function(packageName, target, method) {
    var packages = SC.PACKAGE_MANIFEST;
    var package = packages[packageName];
    var log = this.log; 

    // if there isn't a package we really can't do much
    // so get that out of the way
    if(!package) {
      SC.Logger.warn("SC.Package.loadPackage() could not find package '%@'".fmt(packageName));
      return false;
    }

    // if the package is loaded already it has a different
    // track to take than one that needs to be loaded
    if(this.isLoaded(package)) {
      SC.Logger.warn("SC.Package.loadPackage() package already loaded '%@'".fmt(packageName));

      // see if the package is ready to be executed
      if(package.isReady) {
        if(log) SC.Logger.info("SC.Package.loadPackage() package already loaded " +
          "and ready '%@'".fmt(packageName));

        // ok send it to be executed (if it has already been executed
        // will be dealt with there)
        this._evaluateJavaScript(packageName);
        return true; // since it was loaded and ready
      } else {
        if(log) SC.Logger.info("SC.Package.loadPackage() package loaded but was not " +
          "ready yet '%@'".fmt(packageName));

        // if it hasn't already been flagged in the waiting queue
        // go ahead and add it
        this._addPackageToWaiting(packageName);
        return false; // since it was loaded but not ready
      }
    } // isLoaded

    // for packages that are not loaded we need to register any
    // callback that was passed in and then go get the source
    // the rest is handled after it is received

    //...REGISTER CALLBACK HERE

    // go ahead and fire off the request for the source
    // from the handler 
    this._loadJavaScript(packageName);
    return false; // since it is being loaded but isn't ready
  },

  /**
    Find and load any dependencies for a given package.

    @param {String} packageName The target package.
  */
  _loadDependenciesForPackage: function(packageName) {
    var packages = SC.PACKAGE_MANIFEST;
    var package = packages[packageName];
    var log = this.log;
    var idx = 0;
    var dependencies;
    var dependency;
    var dependents;

    // if there isn't a package we really can't do much
    // so get that out of the way
    if(!package) {
      if(log) SC.Logger.warn("SC.Package._loadDependenciesForPackage() " +
        "could not find package '%@'".fmt(packageName));
      return;
    }

    dependencies = package.dependencies;
    
    // if there aren't any dependencies...do, nothing?
    if(!dependencies || dependencies.length <= 0) return; 

    // loop through them and tell 'em to load
    for(; idx < dependencies.length; ++idx) {
      dependency = dependencies[idx];
      dependency = packages[dependency];

      // if we can't find this dependency as a known package
      // we're really in trouble
      if(!dependency) {
        throw "SC.Package._loadDependenciesForPackage() could not find a " +
          "requried dependency for package '%@'; needed '%@'".fmt(packageName, dependencies[idx]);
      }

      dependents = dependency.dependents || [];
      dependents.push(packageName);
      dependency.dependents = dependents;

      if(log) SC.Logger.info("SC.Package._loadDependenciesForPackage() loading " +
        "dependency '%@' for '%@'".fmt(dependencies[idx], packageName));

      // we don't care whether it has been loaded or anything else
      // if its in the list just throw it at the loader
      this._loadPackage(dependencies[idx]); 
    }
  },

  /**
    Attempt to retrieve the source JavaScript for a
    package from the webserver. This method can be
    overridden in extendenions of SC.Package to
    retrieve the source by some other means. 

    @param {String} packageName The name of the requested
      package to retrieve.
    @returns {SC.Package} receiver
  */
  _loadJavaScript: function(packageName) {
    var packages = SC.PACKAGE_MANIFEST;
    var package = packages[packageName];
    var log = this.log; 
    var el;
    var url = this._urlForPackage(packageName);
    var self = this;

    // if there isn't a package we really can't do much
    // so get that out of the way
    if(!package) {
      if(log) SC.Logger.warn("SC.Package._loadJavaScript() could not find package '%@'".fmt(packageName));
      return this;
    } else if(package.isLoaded) {
      if(log) SC.Logger.warn("SC.Package._loadedJavaScript() package '%@' already loaded".fmt(packageName));
      return this;
    }

    // set the isLoading flag to true
    package.isLoading = true;

    // create the script element that will generate the
    // request for the source
    el = document.createElement('script');
    el.setAttribute('type', 'text/javascript');
    el.setAttrubute('src', url);
    
    // TODO: need ie hack
    el.onload = function() {
      SC.run(function() {

        // we don't know who is handling this thus
        // the scoping back to self
        self._packageDidLoad(packageName);
      });
    }

    // go ahead and add the node to the dom so
    // the request will be made...
    document.body.appendChild(el);
    return this;
  },

  /**
    Creates the url for the script to request when loading
    the JavaScript source of packages.

    @param {String} packageName The name of the package being
      requested.
    @returns {String} The constructed url or null if it could
      not be built or determined.
  */
  _urlForPackage: function(packageName) {
    var packages = SC.PACKAGE_MANIFEST;
    var package = packages[packageName];
    var mask = SC.PACKAGE_MODE;
    var url = [];
    var log = this.log;

    // if there isn't a package we really can't do much
    // so get that out of the way
    if(!package) {
      if(log) SC.Logger.warn("SC.Package._urlForPackage() could not find package '%@'".fmt(packageName));
      return null;
    }

    // push the root node as this is a unique qualifier
    // in the path to the package source
    url.push(package.rootNode);

    // push the string 'packages' as this is a required
    // element in the package path
    url.push('packages');

    // push the package name (unique to the root node)
    url.push(packageName);

    // it should be noted that the entire package contents is
    // always loaded with the source but only portions of
    // it may be evaluated

    // now concatenate and go
    url = '/' + url.join('/');
    return url;
  },

  /**
    Evaluates the source or portion of the loaded source for
    a given package.

    @param {String} packageName The name of the package from which
      to evaluate source code.
  */
  _evaluateJavaScriptForPackage: function(packageName) {
    var packages = SC.PACKAGE_MANIFEST;
    var package = packages[packageName];
    var flags = SC.PACKAGE_MODE;
    var log = this.log;
    var source;
    var code;
    var parts = [];
    var part;
    var idx = 0;

    // if there isn't a package we really can't do much
    // so get that out of the way
    if(!package) {
      if(log) SC.Logger.warn("SC.Package._evaluateJavaScriptForPackage() could not find package '%@'".fmt(packageName));
      return;
    }

    // if the package has already been executed...
    if(package.isExecuted) {
      throw "SC.Package._evaluateJavaScriptForPackage() package '%@' already executed!".fmt(packageName);
    }

    // if there is no source we can't do much either
    if(!package.source) {
      throw "SC.Package._evaluateJavaScriptForPackage() no source on requested package '%@'".fmt(packageName);
    }

    source = package.source;

    if(flags & SC.PACKAGE_MODE_NORMAL) {
      parts = "other models controllers views".w();
    } else {
      if(flags & SC.PACKAGE_MODE_OTHER) {
        parts.push('other');
      }
      if(flags & SC.PACKAGE_MODE_MODELS) {
        parts.push('models');
      }
      if(flags & SC.PACKAGE_MODE_CONTROLLERS) {
        parts.push('controllers');
      }
      if(flags & SC.PACKAGE_MODE_VIEWS) {
        parts.push('views');
      }
    }

    code = '';
    for(; idx < parts.length; ++idx) {
      part = parts[idx];
      if(source[part]) {
        code += source[part];

        // free the used element of the source from
        // the package source object
        delete package.source[part];
      }
    }

    // if we accumulated any code go ahead and execute it
    if(code && code.length > 0) {
      
      // need to execute in the global scope and
      // make up for msie shortcomings
      (window.execScript || function(data) {
        window['eval'].call(window, data);
      })(code);

    } else {

      // we didn't execute anything so don't allow the
      // package to pretend that it did
      package.isExecuted = false;

      if(log) SC.Logger.warn("SC.Package._evaluateJavaScriptForPackage() " +
        "no package source found for given package mode for package '%@'".fmt(packageName));
    }
  },

  /**
    Called once a package's source is loaded and ready.

    @param {String} packageName The name of the package that
      was loaded.
  */
  _packageDidLoad: function(packageName) {
    var packages = SC.PACKAGE_MANIFEST;
    var package = packages[packageName];
    var log = this.log;

    // if there isn't a package we really can't do much
    // so get that out of the way
    if(!package) {
      SC.Logger.warn("SC.Package._packageDidLoad() unknown package loaded '%@' ".fmt(packageName));
      return;
    }

    // set the isLoaded flag to true
    package.isLoaded = true;

    // remove the isLoading flag
    delete package['isLoading'];

    // if all the dependencies were met for a package go ahead
    // and evaluate the source otherwise just make sure it is
    // in the waiting queue and then load its dependencies
    if(this._dependenciesMetForPackage(packageName)) {
      if(log) SC.Logger.info("SC.Package._packageDidLoad() package loaded and " +
        "dependencies met for '%@'".fmt(packageName));
      this._evaluateJavaScriptForPackage(packageName);
    } else {
      if(log) SC.Logger.info("SC.Package._packageDidLoad() package loaded but " +
        "its dependencies were not met '%@'".fmt(packageName));
      this._addPackageToWaiting(packageName);
      this._loadDependenciesForPackage(packageName);
    }
  },

  /**
    Determines if all of the dependencies for a package have
    been loaded and executed.

    @param {String} packageName The name of the package whose
      dependencies are being evaluated.
    @returns {Boolean} YES|NO depending on whether all of the
      dependencies have been met.
  */
  _dependenciesMetForPackage: function(packageName) {
    var packages = SC.PACKAGE_MANIFEST;
    var package = packages[packageName];
    var log = this.log;
    var idx = 0;
    var dependencies;
    var dependency;
    var isReady = true;
    var done = [];

    // if there isn't a package we really can't do much
    // so get that out of the way
    if(!package) {
      if(log) SC.Logger.warn("SC.Package._dependenciesMetForPackage() could " +
        " not find package '%@'".fmt(packageName));
      return false;
    }

    dependencies = package.dependencies;

    // if there are no dependencies, not need to worry about
    // testing just return true aint nothing to do
    if(!dependencies || dependencies.length <= 0) return true; 
    
    // alright iterate through the dependencies left
    // and check 'em out
    for(; idx < dependencies.length; ++idx) {
      dependency = dependencies[idx];
      dependency = packages[dependency];

      // if we can't find this dependency as a known package
      // we're really in trouble
      if(!dependency) {
        throw "SC.Package._dependenciesMetForPackage() could not find a " +
          "requried dependency for package '%@'; needed '%@'".fmt(packageName, dependencies[idx]);
      }

      // if it has not been executed, the dependencies
      // aren't loaded
      if(!dependency.isExecuted) isReady = false;

      // save the index to the array of found dependencies
      // so we can remove them from the dependencies array
      // and not look for them again in the future
      done.push(idx);
    }

    if(isReady) {

      // if we are ready, free up the dependencies array
      delete package['dependencies'];
    } else if(done.length > 0) {

      // if we aren't ready but some dependencies are
      // go ahead and remove them from the array
      for(idx = 0; idx < done.length; ++idx)
        delete dependencies[idx];

      // while this should never happen...
      if(dependencies.length <= 0) {
        throw "SC.Package._dependenciesMetForPackage() dependencies not met " +
          "but no dependencies left for '%@'?".fmt(packageName);
      }
    }

    // return our findings
    return isReady;
  },

});

SC.ready(function() {
  var packages = SC.PACKAGE_MANIFEST;
  var package;
  var task;

  for(packageName in packages) {
    package = packages[packageName];

    if(package.type === 'lazy') {
      task = SC.Package.LazyPackageTask.create({ lazyPackageName: packageName });
      SC.backgroundTaskQueue.push(task);
    }
  }
});

SC.Package.LazyPackageTask = SC.Task.extend({
  lazyPackageName: null,
  run: function() {
    SC.Package.loadPackage(this.lazyPackageName);
  }
});
