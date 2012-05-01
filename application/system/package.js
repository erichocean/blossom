
sc_require('tasks/task');

// for development
SC.DEBUG_PACKAGES = false;

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
SC.PACKAGE_MODE_NORMAL      = 0x10;
// The default package flag is set here but can be
// overridden later or by an extended SC.Package class.
SC.PACKAGE_MODE = SC.PACKAGE_MODE_NORMAL;
// To make a combination of other settings do something
// like the following to create the proper bitmask:
// SC.PACKAGE_MODE = SC.PACKAGE_MODE_MODELS | SC.PACKAGE_MODE_OTHER;

/**
  @class

  By default, packages are logically separated containers of code
  built-out by the build tools that can be included in the
  running application in various forms (core, lazy or demand).

  There need only be one package manager for any running
  application as multiples would simply look at the same
  package information. 

  There are global mode settings that can be set to override
  defaults at the application level. Packages can be set
  to evaluate only portions of the source code from the package.
  The buildtools separate content by convention not by inspection.
  Files located in the `models` directory will be included as
  models, `controllers` as controllers and `views` as views. All
  other files (exempting `core.js` that is a specially prioritized
  file) will be included (and ordered) as `other`. The application
  can instruct packages to load combinations of these separated
  layers or all of the (SC.PACKAGE_MODE_NORMAL the default setting).
  It is up to the developer to ensure the files can be programatically
  ordered by their sc_require statements and that files are organized
  in the correct directory structures. If type `other` is selected it
  will be evaluated _before any other types_. This option is
  currently non-configurable.

  @see #SC#PACKAGE_MODE
  @see #SC#PACKAGE_MODE_MODELS
  @see #SC#PACKAGE_MODE_VIEWS
  @see #SC#PACKAGE_MODE_CONTROLLERS'
  @see #SC#PACKAGE_MODE_OTHER
  @see #SC#PACKAGE_MODE_NORMAL

  @see #SC#DEBUG_PACKAGES

  See build-tools documentation for more details @see#BT#Package

  @author W. Cole Davis
  @author Original author(s) of SC.Module
*/
SC.Package = SC.Object.extend(
  /** @lends SC.Package.prototype */ {

  /** @private */
  log: SC.DEBUG_PACKAGES,

  /**
    Attempt to load a package. If it has been loaded but not evaluated will be
    evaluated. If already loaded and evaluated but a new callback is supplied it
    will be executed immediately (along with any other queued callbacks). Callbacks
    will always be supplied with the first parameter as the name of the package
    that was loaded and that is invoking it.

    @param {String} packageName The name of the package to load.
    @param {Object} [target] The context from which to call the callback method.
    @param {Function} [method] The function to execute as the callback.
    @param {...} [args] Any additional arguments will be supplied to the
      callback as paramters.
  */
  loadPackage: function(packageName, target, method) {
    var package = SC.PACKAGE_MANIFEST[packageName];
    var args = SC.A(arguments).slice(3);
    var log = this.log;

    if (method === undefined && target instanceof Function) {
      method = target;
      target = null;
    }

    if (!package) {
      throw "SC.Package: could not find package '%@'".fmt(packageName);
    }

    if (package.isReady) {
      if (log) SC.Logger.info("loadPackage() package '%@' already loaded and ready".fmt(packageName));

      this.registerCallbackForPackage(packageName, target, method, args);
      this._sc_invokeCallbacksForPackage(packageName);
      return true;
    } else if (package.isLoaded && !package.isWaitingForRunloop) {

      if (log) SC.Logger.info("loadPackage() package '%@' was loaded and ".fmt(packageName) +
        "was not waiting for runloop");

      if (!this._sc_dependenciesMetForPackage(packageName)) {

        if (log) SC.Logger.info("loadPackage() package dependencies were not met for " +
          "package '%@'".fmt(packageName));

        this.registerCallbackForPackage(packageName, target, method, args);
        this._sc_loadDependenciesForPackage(packageName);
        return false;
      }

      if (package.source) {
        if (log) SC.Logger.info("loadPackage() package '%@' source is available and will ".fmt(packageName) +
          "be executed now");

        this._sc_evaluatePackageSource(packageName);
        this.registerCallbackForPackage(packageName, target, method, args);

        this.invokeLast(function() {
          package.isReady = true;
          this._sc_packageDidBecomeReady(packageName);
        });

        return false;
      }
    } else if (package.isWaitingForRunLoop) {
      this.registerCallbackForPackage(packageName, target, method, args);
      return true;
    } else {

      this.registerCallbackForPackage(packageName, target, method, args);

      if (!package.isLoading) {
        if (log) SC.Logger.info("loadPackage() package '%@' loading dependencies and ".fmt(packageName) +
          "source");

        this._sc_loadDependenciesForPackage(packageName);
        this.loadJavaScriptForPackage(packageName);
        package.isLoading = true;
      }

      return false;
    }
  },

  /**
    Load all available packages.
    
    @method
  */
  loadAll: function() {
    var packageName;
    var package;
    for (packageName in SC.PACKAGE_MANIFEST) {
      package = SC.PACKAGE_MANIFEST[packageName];
      if (!package.isLoading && !package.isLoaded && !package.isReady) {
        this.loadPackage(packageName);
      }
    }
  },

  /**
    Register a callback method to be called once the package has successfully
    loaded and been evaluated. Additional arguments will be applied as
    arguments to the callback when it is executed.

    @param {String} packageName The name of the package for which to
      register the callback.
    @param {Object} [target] The context for which to run the callback method.
    @param {Function} [method] The callback function to execute.
    @param {...} [args] Any other arguments will be used as parameters to the callback.  
  */
  registerCallbackForPackage: function(packageName, target, method, args) {
    var package = SC.PACKAGE_MANIFEST[packageName];
    var cb;

    if (!args) args = [];

    args.unshift(packageName);

    if (target) {
      if (target instanceof Function) {
        method = target;
        target = null;
      }
    } else { return; }

    if (typeof method === 'string') {
      method = target[method];
    }

    cb = function() {
      var needsRunLoop = !!SC.RunLoop.currentRunloop;
      if (needsRunLoop) {
        SC.run(function() {
          method.apply(target, args);
        });
      } else {
        method.apply(target, args);
      }
    }

    if (!package.callbacks) {
      package.callbacks = [];
    }
    package.callbacks.push(cb);
  },

  /**
    Attempt to retrieve the source JavaScript for a
    package from the webserver. This method can be
    overridden in extensions of SC.Package to
    retrieve the source by some other means. 

    @param {String} packageName The name of the requested
      package to retrieve.
    @returns {SC.Package} receiver
  */
  loadJavaScriptForPackage: function(packageName) {
    var package = SC.PACKAGE_MANIFEST[packageName];
    var log = this.log; 
    var el;
    var url = this._sc_urlForPackage(packageName);
    var self = this;

    if (package.isLoaded) {
      if (log) SC.Logger.warn("loadJavaScript() package '%@' already loaded".fmt(packageName));
      return;
    }

    // set the isLoading flag to true
    package.isLoading = true;

    // create the script element that will generate the
    // request for the source
    el = document.createElement('script');
    el.setAttribute('type', 'text/javascript');
    el.setAttribute('src', url);
    
    // needs to be tested with various versions of IE to determine
    // if this will work
    el.onload = function() {
      SC.run(function() {

        // we don't know who is handling this thus
        // the scoping back to self
        self._sc_packageDidLoad(packageName);
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
  _sc_urlForPackage: function(packageName) {
    var package = SC.PACKAGE_MANIFEST[packageName];
    var mask = SC.PACKAGE_MODE;
    var url = [];

    url.push(package.rootNode);
    url.push('packages');
    url.push(package.basename);
    url = '/' + url.join('/');    
    return url;
  },

  /**
    Determines if all of the dependencies for a package have
    been loaded and executed.

    @param {String} packageName The name of the package whose
      dependencies are being evaluated.
    @returns {Boolean} YES|NO depending on whether all of the
      dependencies have been met.
  */
  _sc_dependenciesMetForPackage: function(packageName) {
    var package = SC.PACKAGE_MANIFEST[packageName];
    var dependencies = package.dependencies || [];
    var dependency;
    var name;
    var idx = 0;
    for (; idx < dependencies.length; ++idx) {
      name = dependencies[idx];
      dependency = SC.PACKAGE_MANIFEST[name];
      
      if (!dependency) {
        throw "SC.Package: could not find dependency '%@' for package ".fmt(name) +
          "'%@'".fmt(packageName);
      }
       
      if (!dependency.isReady) return false;
    }
    return true;
  },
  
  /**
    Find and load any dependencies for a given package.

    @param {String} packageName The target package.
  */
  _sc_loadDependenciesForPackage: function(packageName) {
    var package = SC.PACKAGE_MANIFEST[packageName];
    var log = this.log;
    var dependencies = package.dependencies || [];
    var dependency;
    var name;
    var dependents;
    var idx = 0;

    if (log) SC.Logger.info("_sc_loadDependenciesForPackage() loading dependencies " +
      "for package '%@'".fmt(packageName));

    for (; idx < dependencies.length; ++idx) {
      name = dependencies[idx];
      dependency = SC.PACKAGE_MANIFEST[name];

      if (!dependency) {
        throw "SC.Package: could not find dependency '%@' for package ".fmt(name) +
          "'%@'".fmt(packageName);
      } else {

        if (dependency.isLoading) {
          dependents = dependency.dependents;
          if (!dependents) dependency.dependents = dependents = [];
          dependents.push(packageName);
        } else if (dependency.isReady) {
          continue;
        } else {
          dependents = dependency.dependents;
          if (!dependents) dependency.dependents = dependents = [];
          dependents.push(packageName);

          if (log) SC.Logger.info("_sc_loadDependenciesForPackage() package '%@' ".fmt(packageName) +
            "requires loading '%@'".fmt(name));

          this.loadPackage(name);
        }
      }
    }
  },

  /**
    Called once a package's source is loaded and ready.

    @param {String} packageName The name of the package that
      was loaded.
  */
  _sc_packageDidLoad: function(packageName) {
    var package = SC.PACKAGE_MANIFEST[packageName];
    var log = this.log;

    if (log) SC.Logger.info("_sc_packageDidLoad() package '%@' loaded".fmt(packageName));

    delete package.isLoading;
    package.isLoaded = true;

    if (!this._sc_dependenciesMetForPackage(packageName)) {
      if (log) SC.Logger.info("_sc_packageDidLoad() package '%@' still waiting on ".fmt(packageName) +
        "some dependencies to load");
    } else if (package.source) {
      this._sc_evaluatePackageSource(packageName);
      package.isWaitingForRunLoop = true;
      this.invokeLast(function() {
        package.isReady = true;
        this._sc_packageDidBecomeReady(packageName);
      });
    } else {
      throw "SC.Package: package '%@' was loaded without any source".fmt(packageName);
    }
  },

  /**
    Attempts to notify any waiting dependent packages that this
    dependency is now available. If the dependent is now ready it is
    executed.
    
    @param {String} packageName The name of the package that became ready.
  */
  _sc_packageDidBecomeReady: function(packageName) {
    var package = SC.PACKAGE_MANIFEST[packageName];

    var dependents = package.dependents || [];
    var idx = 0;
    var dependent;
    var name;
    var log = this.log;

    if (log) SC.Logger.info("_sc_packageDidBecomeReady() invoking callbacks and " +
      "evaluating dependents for package '%@'".fmt(packageName));

    package.isWaitingForRunLoop = false;
    this._sc_invokeCallbacksForPackage(packageName);

    for (; idx < dependents.length; ++idx) {
      name = dependents[idx];
      dependent = SC.PACKAGE_MANIFEST[name];
      if (dependent.isLoaded && this._sc_dependenciesMetForPackage(name)) {
        if (log) SC.Logger.info("_sc_packageDidBecomeReady() package '%@' dependent ".fmt(packageName) +
          "'%@' is ready to be executed now".fmt(name));
        this._sc_evaluatePackageSource(name); 
        dependent.isWaitingForRunLoop = true;
        this.invokeLast(function() {
          dependent.isReady = true;
          this._sc_packageDidBecomeReady(name);
        });
      }
    }
  },

  /**
    Retrieves any available callbacks for the named package
    and executes them in the order they were entered in the
    queue. Callbacks are freed once they have been executed.

    @param {String} packageName The name of the package whose
      callbacks need to be executed.
  */
  _sc_invokeCallbacksForPackage: function(packageName) {
    var package = SC.PACKAGE_MANIFEST[packageName];
    var callbacks = package.callbacks || [];
    var idx = 0;
    var callback;
    for (; idx < callbacks.length; ++idx) {
      callback = callbacks[idx];
      callback();
    }
  },

  /**
    Evaluates the source or portion of the loaded source for
    a given package.

    @param {String} packageName The name of the package from which
      to evaluate source code.
  */
  _sc_evaluatePackageSource: function(packageName) {
    var package = SC.PACKAGE_MANIFEST[packageName];
    var flags = SC.PACKAGE_MODE;
    var log = this.log;
    var source;
    var code;
    var parts = [];
    var part;
    var idx = 0;

    if (package.isEvaluated) {
      return;
    }

    if (log) SC.Logger.info("_sc_evaluatePackageSource() attempting to " +
      "execute source for package '%@'".fmt(packageName));

    // if there is no source we can't do much either
    if (!package.source) {
      throw "SC.Package: cannot execute non-existant source for package '%@'".fmt(packageName);
    }

    source = package.source;

    // the ordering of inclusion is important here
    if (flags & SC.PACKAGE_MODE_NORMAL) {
      parts = "other models controllers views".w();
    } else {
      if (flags & SC.PACKAGE_MODE_OTHER) {
        parts.push('other');
      }
      if (flags & SC.PACKAGE_MODE_MODELS) {
        parts.push('models');
      }
      if (flags & SC.PACKAGE_MODE_CONTROLLERS) {
        parts.push('controllers');
      }
      if (flags & SC.PACKAGE_MODE_VIEWS) {
        parts.push('views');
      }
    }

    code = '';
    for (; idx < parts.length; ++idx) {
      part = parts[idx];
      if (source[part]) {

        if (code && code.length > 0) code += ';';

        code += source[part];

        // free the used element of the source from
        // the package source object
        delete package.source[part];
      }
    }

    // if we accumulated any code go ahead and execute it
    if (code && code.length > 0) {
      
      try {

        // need to execute in the global scope and
        // make up for msie shortcomings
        (window.execScript || function(data) {
          window['eval'].call(window, data);
        })(code);

        package.isEvaluated = true;

      } catch(err) {
        throw "SC.Package: failed to evaluate source for package '%@' ".fmt(packageName) +
          "due to the following error: " + err.message;
      }

    } else {

      if (log) SC.Logger.warn("_sc_evaluatePackageSource() " +
        "no package source found for given package mode for package '%@'".fmt(packageName));

    }

    package.isReady = true;
  },

  /** @private */
  init: function() {
    arguments.callee.base.apply(this, arguments);

    var self = this;

    // update the task definition to use the correct
    // package manager
    SC.Package.LazyPackageTask.prototype.run = function() {
      self.loadPackage(this.lazyPackageName);
    }

    SC.ready(function() {
      var packages = SC.PACKAGE_MANIFEST;
      var package;
      var task;
      
      for (packageName in packages) {
        package = packages[packageName];
      
        if (package.type === 'lazy') {
          task = SC.Package.LazyPackageTask.create({ lazyPackageName: packageName });
          SC.backgroundTaskQueue.push(task);
        }
      }
    });
  } // init


});


SC.Package.LazyPackageTask = SC.Task.extend({
  lazyPackageName: null,
});
