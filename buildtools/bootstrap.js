// ==========================================================================
// Project:   Blossom - Modern, Cross-Platform Application Framework
// Copyright: ©2012 Fohr Motion Picture Studios. All rights reserved.
// License:   Licensed under the MIT license (see BUILDTOOLS-LICENSE).
// ==========================================================================
/*globals global require __dirname */

var fs = require('fs'),
    path = require('path'),
    Graph = require('./utils/graph'); // needed for topological sorting

// First we grab the files in foundation.
var sourceFiles = [],
    sourceTree = path.join(__dirname, "../foundation"); 

function processDirectory(dirname) {
  var files = fs.readdirSync(dirname);
  files.forEach(function(filename) {
    if (filename === "node") return;
    var sourcePath = path.join(dirname, filename);
    var stat = fs.statSync(sourcePath);
    if (stat.isFile()) {
      sourceFiles.push(sourcePath);
    } else if (stat.isDirectory()) {
      processDirectory(sourcePath);
    } else {
      console.log("the file is something strange");
    }
  });
}

processDirectory(sourceTree);

// Next, we figure out the right order to require those files.
var javascriptFiles = sourceFiles.filter(function(sourcePath) {
  // console.log(sourcePath, sourcePath.slice(0, -3), sourcePath.slice(0, -3) === '.js');
  if (sourcePath.slice(0,4) === "test") return false;
  else if (sourcePath.slice(0,4) === "node") return false;
  else if (sourcePath.slice(0,4) === "protocols") return false;
  else if (sourcePath.match(/test_suite/)) return false;
  else return sourcePath.slice(-3) === '.js';
});

var g = new Graph();
var map = {};

function scRequireDependencies(sourcePath) {
  var contents = fs.readFileSync(sourcePath, "utf-8"),
      ary = [], lines = contents.split('\n'), that=this;

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
}

var corePath = path.join(sourceTree, 'core');
javascriptFiles.forEach(function(sourcePath) {
  var dependencies = scRequireDependencies(sourcePath) || [],
      dependencyPath;

  dependencyPath = sourcePath.slice(0, -3); // drop the '.js'
  map[dependencyPath] = sourcePath;
  g.addVertex(dependencyPath);
  dependencies.forEach(function(name) {
    g.addEdge(path.join(sourceTree, name), dependencyPath);
  });
  g.addEdge(corePath, dependencyPath);
});

var orderedFiles = [], sortedVertices = g.topologicalSort(), that=this;
sortedVertices.forEach(function(vertex) {
  var dep = map[vertex];
  if (dep) orderedFiles.push(dep);
  else console.log('could not find blossom/foundation framework dependency: '+vertex);
});

// Now we need to set up global for compatibility with Blossom
global.window = global;
global.sc_require = function do_nothing(){};
global.sc_resource = function sc_resource(){};
global.YES = true ;
global.NO = false ;
global.SC = {};
global.SproutCore = SC;
global.SC.isNode = true;
global.XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
global.sc_assert = function(assertion, msg) {
  if (!assertion) {
    debugger;
    throw msg || "sc_assert()";
  }
};

// And we're ready to require the files in the correct order.
orderedFiles.forEach(function(path) { require(path); });

// Finally, we undo the SC namespace and create the BT namespace.
global.BT = { foundationSourcePath: sourceTree };
for (var key in SC) {
  if (!SC.hasOwnProperty(key)) continue;
  else global.BT[key] = SC[key];
}
delete global.SC;
