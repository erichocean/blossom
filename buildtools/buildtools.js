// ==========================================================================
// Project:   Blossom - Modern, Cross-Platform Application Framework
// Copyright: ©2012 Fohr Motion Picture Studios. All rights reserved.
// License:   Licensed under the MIT license (see BUILDTOOLS-LICENSE).
// ==========================================================================
/*globals global require __dirname BT */

var http = require('http'),
    fs = require('fs'),
    path = require('path'),
    coffee = require('coffee-script'),
    Graph = require('./utils/graph'); // needed for topological sorting

// Bootstrap the BT namespace with blossom/foundation.
require('./bootstrap');

function acceptBuilder(visitorMethod) {
  return function(visitor, key, depth) {
    var method = visitor[visitorMethod];

    if (typeof depth === "undefined") depth = 0;

    if (method && typeof method === "function") {
      visitor[visitorMethod](this, key, depth);
    }
  };
}

function traverse(kind) {
  // `kind` is unused currently
  return function(node, name, depth) {
    var conditionKey = 'canVisit';

    depth++;

    for (var key in node) {
      if (!node.hasOwnProperty(key)) continue;
      var obj = node[key];
      if (obj && obj.get && typeof obj.get === "function" &&
          obj.get(conditionKey) &&
          key !== 'project' && key !== 'parentNode') {
        // HACK: Make sure nodes know their parent and their name.
        if (!obj.get('nodeName')) obj.set('nodeName', key);
        if (!obj.get('parentNode')) obj.set('parentNode', node);

        obj.accept(this, key, depth);
      }
    }
  };
}

BT.Visitor = BT.Object.extend({
  visitTarget:       traverse("Target"),
  visitProject:      traverse("Project"),
  visitDirectory:    traverse("Directory"),
  visitFile:         traverse("File"),
  visitBuildNode:    traverse("BuildNode"),
  visitApp:          traverse("App"),
  visitLocalization: traverse("Localization"),
  visitFramework:    traverse("Framework"),
  visitProxy:        traverse("Proxy")
});

function spaces(depth) {
  var ret = "", idx, len;
  for (idx = 0, len = depth; idx<len; ++idx) ret += "  ";
  return ret;
}

function log(kind) {
  return function(node, name, depth) {
    var sourceTree = node.get('sourceTree');
    console.log(spaces(depth)+"("+kind+") "+(name ? name : "")+(sourceTree? " ["+sourceTree+"]" : ""));
    arguments.callee.base.apply(this, arguments); // arguments.callee.base.apply(this, arguments);
  };
}

BT.LoggingVisitor = BT.Visitor.extend({
  visitTarget:       log("target"),
  visitProject:      log("project"),
  visitDirectory:    log("directory"),
  visitFile:         log("file"),
  visitBuildNode:    log("build node"),
  visitApp:          log("app"),
  visitLocalization: log("localization"),
  visitFramework:    log("framework"),
  visitProxy:        log("proxy")
});

BT.BuildNode = BT.Object.extend({

  canVisit: true,
  isBuildNode: true,

  nodeName: null,
  parentNode: null,

  accept: acceptBuilder('visitBuildNode')

});

BT.File = BT.BuildNode.extend({

  isFile: true,
  isFileOrDirectory: true,

  sourcePath: null,
  sourceTree: null,

  relativePath: function() {
    var sourcePath = this.get('sourcePath'),
        sourceTree = path.normalize(this.get('sourceTree'));

    return sourcePath.slice(sourceTree.length+1).replace(/\\/g, '/');
  }.property().cacheable(),

  contents: function() {
    var ret = null;
    if (this.get('isJavaScript')) {
      ret = fs.readFileSync(this.get('sourcePath'), "utf-8");
    }
    else if (this.get('isCoffeeScript')) {
      ret = fs.readFileSync(this.get('sourcePath'), "utf-8");
      ret = coffee.compile(ret, { bare: true });
    }
    return ret;
  }.property(),

  scRequireDependencies: function() {
    var ary = [], lines = this.get('contents').split('\n'), that=this;

    var re = new RegExp("sc_require\\((['\"])(.*)\\1\\)");
    lines.forEach(function(line) {
      var statements = line.split(';');
      statements.forEach(function(statement) {
        var result = re.exec(statement);
        if (result) {
          ary.push(result[2]);
        }
      });
    });
    
    return ary;
  }.property().cacheable(),

  targetPath: function() {
    var ary = [], parentNode = this.get('parentNode');
    ary.push(this.get('nodeName'));
    while (parentNode) {
      ary.push(parentNode.get('nodeName'));
      parentNode = parentNode.get('parentNode');
    }
    return ary.reverse().join("/");
  }.property().cacheable(),

  isJavaScript: function() {
    return path.extname(this.get('sourcePath')) === ".js";
  }.property().cacheable(),

  isCoffeeScript: function() {
    return path.extname(this.get('sourcePath')) === ".coffee";
  }.property().cacheable(),

  accept: acceptBuilder('visitFile')

});

BT.Directory = BT.BuildNode.extend({

  isDirectory: true,
  isFileOrDirectory: true,

  accept: acceptBuilder('visitDirectory')

});

BT.Target = BT.BuildNode.extend({

  isTarget: true,

  concatenatedProperties: 'frameworks'.w(),
  frameworks: [],

  // The source tree this target pulls files from.
  sourceTree: null,

  accept: acceptBuilder('visitTarget'),

  files: function() {
    var ret = [], that = this;

    this.accept(BT.Visitor.create({
      // only visit our own framework, not any other (embedded) targets
      visitFramework: function(node, name, depth) {
        if (node === that) arguments.callee.base.apply(this, arguments);
      },
      visitApp: BT.K,
      visitTarget: BT.K,
      visitFile: function(node, name, depth) {
        ret.push(node);
        arguments.callee.base.apply(this, arguments);
      }
    }));

    return ret;
  }.property().cacheable(),

  orderedJavaScriptFiles: function() {
    var ary = this.get('files').filter(function(file) {
      var relativePath = file.get('relativePath');
      if (relativePath.slice(0,4) === "test") return false;
      else if (relativePath.slice(0,4) === "node") return false;
      else if (relativePath.match(/test_suite/)) return false;
      else return file.get('isJavaScript') || file.get('isCoffeeScript');
    });

    // need to sort the ary by require dependencies...
    var g = new Graph();
    var map = {};

    ary.forEach(function(file) {
      var relativePath = file.get('relativePath'),
          dependencies = file.get('scRequireDependencies') || [],
          dependencyPath;

      if (file.get('isJavaScript')) {
        dependencyPath = relativePath.slice(0, -3); // drop the '.js'
      }
      else if (file.get('isCoffeeScript')) {
        dependencyPath = relativePath.slice(0, -7); // drop the '.coffee'
      }
      map[dependencyPath] = file;
      g.addVertex(dependencyPath);
      dependencies.forEach(function(name) {
        g.addEdge(name, dependencyPath);
      });
      g.addEdge("core", dependencyPath);
    });

    var ret = [], sortedVertices = g.topologicalSort(), that=this;
    sortedVertices.forEach(function(vertex) {
      var dep = map[vertex];
      if (dep) ret.push(dep);
      else console.log('could not find '+that.get('nodeName')+' framework dependency: '+vertex);
    });

    // console.log(ret.map(function(f) { return f.get('targetPath'); }));
    return ret;
  }.property().cacheable(),

  orderedFrameworks: function() {
    var project = this.get('project'),
        frameworks = this.get('frameworks'),
        ary = [];

    if (!project) return ary;

    function processFramework(name, parent) {
      // console.log(name);
      var framework = project.findFramework(name, parent),
          dependencies = framework ? framework.get('frameworks') : null;

      if (dependencies) {
        dependencies.forEach(function(dep) {
          processFramework(dep, framework);
        });
        ary.push(framework);
      }
    }

    frameworks.forEach(function(name) {
      processFramework(name);
    });

    // console.log(ary.map(function(f) { return f.get('nodeName'); }));
    return ary;
  }.property(),

  init: function() {
    arguments.callee.base.apply(this, arguments); // arguments.callee.base.apply(this, arguments);
    var sourceTree = this.get('sourceTree'),
        frameworks = this.get('frameworks');

    function processDirectory(dirname, node, deep) {
      var files = fs.readdirSync(dirname);
      files.forEach(function(filename) {
        if (filename === "node") return;
        var relativePath = path.join(dirname, filename);
        var stat = fs.statSync(relativePath);
        if (stat.isFile()) {
          node.set(filename, BT.File.create({
            sourcePath: relativePath,
            sourceTree: sourceTree
          }));
        } else if (stat.isDirectory()) {
          // Skip directories named after embedded frameworks.
          if (frameworks.indexOf(filename) !== -1) return;

          // Skip a directory named 'apps'
          else if (filename === 'apps') return;

          // Skip a directory named 'frameworks'
          else if (filename === 'frameworks') return;
          else {
            var dir = BT.Directory.create();
            node.set(filename, dir);
            processDirectory(relativePath, dir, true);
          }
        } else {
          console.log("the file is something strange");
        }
      });
    }

    if (sourceTree) processDirectory(sourceTree, this);
  }


});

BT.Project = BT.BuildNode.extend({

  isProject: true,

  accept: acceptBuilder('visitProject'),

  apps: function() {
    var ret = [];

    var visitor = BT.Visitor.create({
      visitApp: function(node, name, depth) {
        ret.push(node);
        arguments.callee.base.apply(this, arguments);
      }
    });

    this.accept(visitor);

    return ret;
  }.property(),

  /**
    Returns the app if `str` refers to an app is this project; null otherwise.
  */
  findApp: function(str) {
    var ret = null, expected = "found-it";

    var visitor = BT.Visitor.create({
      visitApp: function(node, name, depth) {
        if (name === str) {
          ret = node;
          throw expected;
        } else {
          arguments.callee.base.apply(this, arguments);
        }
      }
    });

    try {
      this.accept(visitor);
    } catch (e) {
      if (e !== expected) throw e;
    }

    return ret;
  },

  /**
    Returns the framework if `str` refers to a framework is this project; 
    null otherwise. Start the search from `root` when present.
  */
  findFramework: function(str, root) {
    var ret = null, expected = "found-it";

    if (!root) root = this;

    var visitor = BT.Visitor.create({
      visitFramework: function(node, name, depth) {
        if (name === str) {
          ret = node;
          throw expected;
        } else {
          arguments.callee.base.apply(this, arguments);
        }
      }
    });

    try {
      root.accept(visitor);
    } catch (e) {
      if (e !== expected) throw e;
    }

    return ret;
  },

  /**
    Returns the app if `str` refers to an app is this project; null otherwise.
  */
  findProxy: function(str) {
    var ret = null, expected = "found-it";

    var visitor = BT.Visitor.create({
      visitProxy: function(node, name, depth) {
        // console.log("finding proxy", name);
        if (name === str) {
          ret = node;
          throw expected;
        } else {
          arguments.callee.base.apply(this, arguments);
        }
      }
    });

    try {
      this.accept(visitor);
    } catch (e) {
      if (e !== expected) throw e;
    }

    // console.log(ret);
    return ret;
  },

  indexHTML: function() {
    var ret = "", project = this.get('project'),
        isBuilding = this.get('isBuilding');

    ret += '<html>\n';
    ret += '  <head>\n';
    ret += '    <title>Blossom Project</title>\n';
    ret += '    <style>\n';
    ret += '      .sc-pane { position: absolute; margin: 0; }\n';
    ret += '    </style>\n';

    ret += '  </head>\n';
    ret += '  <body style="background: #fdf6e3; margin: 40; overflow: hidden;">\n';

    ret += '    <h2>Welcome to Blossom.</h2>\n';
    ret += "    <p>Here's a list of apps in this project:\n";
    ret += '      <ul>\n';
    this.get('apps').forEach(function outputAppListItem(app) {
      ret += '        <li><a href="' + app.get('nodeName')+(isBuilding? '/index.html' : '') + '">'+app.get('nodeName')+'</a></li>\n';
    });
    ret += '      </ul>\n';
    ret += '     </p>\n';

    ret += '  </body>\n';
    ret += '</html>';
    
    return ret;
  }.property(),

  init: function() {
    arguments.callee.base.apply(this, arguments);

    var project = this;

    // HACK: Make sure every node knows what project it's part of.
    function setProject() {
      return function(node, name, depth) {
        node.set('project', project);
        arguments.callee.base.apply(this, arguments);
      };
    }

    project.accept(BT.Visitor.create({
      visitTarget:       setProject(),
      visitDirectory:    setProject(),
      visitFile:         setProject(),
      visitBuildNode:    setProject(),
      visitApp:          setProject(),
      visitLocalization: setProject(),
      visitFramework:    setProject()
    }));

    this.projectPath = path.dirname(module.parent.filename);
  },

  serve: function(host, port) {
    host = host === undefined? 'localhost': host;
    port = port === undefined? 4020 : port;

    BT.Server.create({
      project: this,
      host: host,
      port: port
    });
  },

  build: function() {
    var that = this, visitor,
        assert = require('assert');

    this.set('isBuilding', true);

    visitor = BT.Visitor.create({
      visitApp: function(node, name, depth) {
        console.log(name, '...');
        that.buildApp(name);
        arguments.callee.base.apply(this, arguments);
      }
    });

    this.accept(visitor);

    var buildPath = path.join(this.get('projectPath'), 'build');
    console.log("Building apps in ", buildPath);
    if (!path.existsSync(buildPath)) {
      try {
        fs.mkdirSync(buildPath);
      } catch (e) {
        console.log('failed to create build directory at '+buildPath);
        console.log(e);
        console.log('aborting build');
        return;
      }
    }
    assert(path.existsSync(buildPath));

    console.log('Writing index.html ...');
    fs.writeFileSync(path.join(buildPath, 'index.html'), this.get('indexHTML'), 'utf-8');

    this.set('isBuilding', false);
    console.log('Done.');
  },

  buildApp: function(name) {
    var fs = require('fs'),
        assert = require('assert');

    var app = this.findApp(name),
        indexHTML = app? app.get('productionIndexHTML') : null,
        javascriptFiles = app? app.get('javascriptSourceFiles'): null, // an array
        buildPath = path.join(__dirname, '../build'), appPath;

    if (!app) {
      console.log("Build error: "+name+" could not be found.");
      return;
    }

    if (!path.existsSync(buildPath)) {
      try {
        fs.mkdirSync(buildPath);
      } catch (e) {
        console.log('failed to create build directory at '+buildPath);
        console.log(e);
        console.log('aborting build');
        return;
      }
    }
    assert(path.existsSync(buildPath));

    appPath = path.join(buildPath, app.get('nodeName'));
    if (!path.existsSync(appPath)) {
      try {
        fs.mkdirSync(appPath);
      } catch (e2) {
        console.log('failed to create app directory at '+appPath);
        console.log(e2);
        console.log('aborting build');
        return;
      }
    }
    assert(path.existsSync(appPath));

    fs.writeFileSync(path.join(appPath, 'index.html'), indexHTML, 'utf-8');

    var javascript = [];
    javascriptFiles.forEach(function(p) {
      if (path.existsSync(p)) {
        javascript.push(fs.readFileSync(p, 'utf-8'));
      }
    });
    javascript = javascript.join(';\n');

    // var jsp = require("uglify-js").parser;
    // var pro = require("uglify-js").uglify;
    // var ast = jsp.parse(javascript); // parse code and get the initial AST
    // 
    // ast = pro.ast_mangle(ast); // get a new AST with mangled names

    // These isn't working yet.
    // ast = pro.ast_squeeze(ast); // get an AST with compression optimizations

    // javascript = pro.gen_code(ast); // compressed code here

    fs.writeFileSync(path.join(appPath, 'application.js'), javascript, 'utf-8');
  }

});

BT.App = BT.Target.extend({

  isApp: true,

  // Configuration options.
  title: 'Blossom',

  FAST_LAYOUT_FUNCTION: false,
  BENCHMARK_LAYOUT_FUNCTION: true,
  ENFORCE_BLOSSOM_2DCONTEXT_API: true,
  DEBUG_PSURFACES: false,

  accept: acceptBuilder('visitApp'),

  files: function() {
    var ret = [], that = this;

    this.accept(BT.Visitor.create({
      // only visit our own app, not any other (embedded) targets
      visitFramework: BT.K,
      visitApp: function(node, name, depth) {
        if (node === that) arguments.callee.base.apply(this, arguments);
      },
      visitTarget: BT.K,
      visitFile: function(node, name, depth) {
        ret.push(node);
        arguments.callee.base.apply(this, arguments);
      }
    }));

    return ret;
  }.property().cacheable(),

  indexHTML: function() {
    var ret = "", project = this.get('project');

    ret += '<html>\n';
    ret += '  <head>\n';
    ret += '    <title>%@</title>\n'.fmt(this.get('title'));

    ret += '    <script>\n';
    ret += '      var FAST_LAYOUT_FUNCTION = %@;\n'.fmt(this.FAST_LAYOUT_FUNCTION);
    ret += '      var BENCHMARK_LAYOUT_FUNCTION = %@;\n'.fmt(this.BENCHMARK_LAYOUT_FUNCTION);
    ret += '      var ENFORCE_BLOSSOM_2DCONTEXT_API = %@;\n'.fmt(this.ENFORCE_BLOSSOM_2DCONTEXT_API);
    ret += '      var DEBUG_PSURFACES = %@;\n'.fmt(this.DEBUG_PSURFACES);
    ret += '    </script>\n';

    function outputScriptTag(file) {
      ret += '    <script src="' + file.get('targetPath') + '"></script>\n';
    }

    this.get('orderedFrameworks').forEach(function(framework) {
      var files = framework.get('orderedJavaScriptFiles');
      files.forEach(outputScriptTag);
    });

    var files = this.get('orderedJavaScriptFiles');
    files.forEach(outputScriptTag);

    ret += '    <style>\n';
    ret += '      * { -moz-box-sizing: border-box; -webkit-box-sizing: border-box; box-sizing: border-box; }\n';
    ret += '      div, canvas { border-style: solid; border-width: 0; }\n';
    ret += '      #ui { border-style: none }\n';
    ret += '    </style>\n';
    ret += '  </head>\n';
    
    ret += '  <body style="background: black; margin: 0; overflow: hidden;">\n';
    ret += '  </body>\n';
    ret += '</html>';

    return ret;
  }.property(),

  javascriptSourceFiles: function() {
    var ary = [], project = this.get('project');

    this.get('orderedFrameworks').forEach(function(framework) {
      var files = framework.get('orderedJavaScriptFiles');
      files.forEach(function(file) { ary.push(file.get('sourcePath')); });
    });

    var files = this.get('orderedJavaScriptFiles');
    files.forEach(function(file) { ary.push(file.get('sourcePath')); });

    return ary;
  }.property(),

  productionIndexHTML: function() {
    var ret = "", project = this.get('project');

    ret += '<html>\n';
    ret += '  <head>\n';
    ret += '    <title>%@</title>\n'.fmt(this.get('title'));

    ret += '    <script>\n';
    ret += '      var FAST_LAYOUT_FUNCTION = %@;\n'.fmt(this.FAST_LAYOUT_FUNCTION);
    ret += '      var BENCHMARK_LAYOUT_FUNCTION = %@;\n'.fmt(this.BENCHMARK_LAYOUT_FUNCTION);
    ret += '      var ENFORCE_BLOSSOM_2DCONTEXT_API = %@;\n'.fmt(this.ENFORCE_BLOSSOM_2DCONTEXT_API);
    ret += '      var DEBUG_PSURFACES = %@;\n'.fmt(this.DEBUG_PSURFACES);
    ret += '    </script>\n';

    ret += '    <script src="application.js"></script>\n';

    ret += '    <style>\n';
    ret += '      * { -moz-box-sizing: border-box; -webkit-box-sizing: border-box; box-sizing: border-box; }\n';
    ret += '      div, canvas { border-style: solid; border-width: 0; }\n';
    ret += '      #ui { border-style: none }\n';
    ret += '    </style>\n';
    ret += '  </head>\n';
    
    ret += '  <body style="background: black; margin: 0; overflow: hidden;">\n';
    ret += '  </body>\n';
    ret += '</html>';

    return ret;
  }.property()

});

BT.Localization = BT.Target.extend({

  isLocalization: true,

  accept: acceptBuilder('visitLocalization')

});

BT.Framework = BT.Target.extend({

  isFramework: true,

  accept: acceptBuilder('visitFramework')

});

BT.Proxy = BT.BuildNode.extend({

  isProxy: true,

  accept: acceptBuilder('visitProxy'),

  proxyHost: '127.0.0.1',

  proxyPort: 8080,

  proxyPrefix: '/',

  handle: function(request, response, prefix, serverPort) {
    var body = '', that = this;

    // request.addListener('data', function(chunk) {
    request.on('data', function(chunk) {
      body += chunk;
    }).on('end', function() {
      var proxyClient, proxyRequest,
          url = request.url;

      url = url.replace(prefix, that.get('proxyPrefix'));

      proxyClient = http.request({
        port: that.get('proxyPort'), 
        host: that.get('proxyHost'),
        path: url,
        method: 'POST'
      }, function(proxyResponse) {
        response.writeHead(proxyResponse.statusCode, proxyResponse.headers);
        proxyResponse.on('data', function(chunk) {
          response.write(chunk, 'binary');
        }).on('end', function() {
          response.end();
        });
      });

      proxyClient.on('error', function(err) {
        console.error('ERROR: "' + err.message + '" for proxy request on ' + that.get('proxyHost') + ':' + that.get('proxyPort'));
        response.writeHead(404);
        response.end();
      });

      request.headers.host = that.get('proxyPort');
      request.headers['content-length'] = body.length;
      request.headers['X-Forwarded-Host'] = request.headers.host + ':' + serverPort;
      if (that.get('proxyPort') != 80) request.headers.host += ':' + that.get('proxyPort');

      if (body.length > 0) { proxyClient.write(body, 'binary'); }

      proxyClient.end();
    });
  }

});

require('./server');
