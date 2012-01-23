// ==========================================================================
// Project:   Blossom - Modern, Cross-Platform Application Framework
// Copyright: ©2012 Fohr Motion Picture Studios. All rights reserved.
// License:   Licensed under the MIT license (see BUILDTOOLS-LICENSE).
// ==========================================================================
/*globals global require __dirname */

function Graph() {
  this.vertices = {};
}

Graph.prototype.addVertex = function(v) {
    if (this.vertices[v] === undefined) this.vertices[v] = [] ;
};

Graph.prototype.addEdge = function(from, to) {
  var vertices = this.vertices;
  if (vertices[from] === undefined) vertices[from] = [];
  if (vertices[to] === undefined)   vertices[to]   = [];
  vertices[from].push(to);
};

// depthFirstSearch() and topologicalSort() algorithms are taken straight out 
// of Introduction to Algorithms 2nd Ed. by Cormen et al., MIT Press.
Graph.prototype.depthFirstSearch = function() {
  var graph = this,
      color = {},
      time = 0,
      discovered = {},
      predecessor = {},
      finished = {},
      vertex,
      vertices = graph.vertices;

  function visit(vertex) {
    color[vertex] = "gray";
    time = time + 1;
    discovered[vertex] = time;
    
    vertices[vertex].forEach(function(v) {
      if (color[v] === "white") {
        predecessor[v] = vertex;
        visit(v);
      }
    });
    color[vertex] = "black";
    finished[vertex] = time = time + 1;
  }

  for (vertex in vertices) {
    if (!vertices.hasOwnProperty(vertex)) continue;
    color[vertex] = "white";
  }

  for (vertex in vertices) {
    if (!vertices.hasOwnProperty(vertex)) continue;
    if (color[vertex] === "white") visit(vertex);
  }

  return {
    discovered: discovered,
    predecessor: predecessor,
    finished: finished
  };
};

Graph.prototype.topologicalSort = function() {
  var ary = [], results = this.depthFirstSearch();
  
  var key, finished = results.finished;
  for (key in finished) {
    if (!finished.hasOwnProperty(key)) continue;
    ary[finished[key]] = key;
  }

  return ary.reverse().filter(function (value) { return !!value; });
};

Graph.prototype.toDot = function(name) {
  var ret = "";
  ret += "digraph ";
  ret += name || '"no name given"';
  ret += " {\n";

  var graph = this;
  var vertex, vertices = graph.vertices;
  for (vertex in vertices) {
    if (!vertices.hasOwnProperty(vertex)) continue;
    var ary = vertices[vertex], idx, len;
    if (ary.length > 0) {
      for (idx=0, len=ary.length; idx<len; ++idx) {
        // Write out an edge
        ret += '  "' + vertex + '" -> "' + ary[idx] + '" ;\n';
      }
    } else {
      // Write out a node
      ret += '  "' + vertex + '" ;\n';
    }
  }
  ret += "}";
  return ret;
};

function main() {
  var g = new Graph();

  // a directed acyclical graph
  g.addEdge("A", "B");
  g.addEdge("A", "C");
  g.addEdge("A", "F");
  g.addEdge("B", "E");
  g.addEdge("C", "D");
  g.addEdge("E", "F");
  g.addEdge("E", "G");
  g.addEdge("E", "H");
  g.addEdge("F", "G");
  g.addEdge("D", "H");
  g.addEdge("H", "G");

  console.log("Adjacency list:");
  console.log(g.vertices);

  console.log("\nTopological sort:");
  console.log(g.topologicalSort().join(', '));

  console.log("\nDot output:");
  console.log(g.toDot());
}

module.exports = Graph;

if (require.main === module) main();