
sc_require('tasks/task');

SC.DEBUG_PACKAGES = false;

SC.PACKAGE_MODE_MODELS      = 0x01; 
SC.PACKAGE_MODE_VIEWS       = 0x02;
SC.PACKAGE_MODE_CONTROLLERS = 0x04;
SC.PACKAGE_MODE_OTHER       = 0x08;
SC.PACKAGE_MODE_NORMAL      = 0x10;
SC.PACKAGE_MODE = SC.PACKAGE_MODE_NORMAL;

SC.Package = SC.Object.extend(
  /** @lends SC.Package.prototype */ {

  loadPackage: function(packageName) {

  },

  loadAll: function(packageName) {

  },

  _sc_dependenciesMetForPackage: function(packageName) {

  },
  
  _sc_loadDependenciesForPackage: function(packageName) {

  },

  



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
