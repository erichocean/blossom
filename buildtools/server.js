// ==========================================================================
// Project:   Blossom - Modern, Cross-Platform Application Framework
// Copyright: ©2012 Fohr Motion Picture Studios. All rights reserved.
// License:   Licensed under the GPLv3 license (see BLOSSOM-LICENSE).
// ==========================================================================
/*globals global require __dirname BT */

var fs = require('fs'),
    path = require('path'),
    http = require('http');

function gsub(source, pattern, replacement) {
  var match, result;
  if (!((pattern !== null) && (replacement !== null))) {
    return source;
  }
  result = '';
  while (source.length > 0) {
    if ((match = source.match(pattern))) {
      result += source.slice(0, match.index);
      result += replacement;
      source = source.slice(match.index + match[0].length);
    } else {
      result += source;
      source = '';
    }
  }
  return result;
}

function replaceScSuperCalls(str) {
  return gsub(str, /sc_super\(\)/, "arguments.callee.base.apply(this, arguments)");
}

BT.LOG_SERVING = false;

BT.Server = SC.Object.extend({
  
  hostname: '127.0.0.1',
  port: 4020,
  project: null,
  _bt_server: null,

  init: function() {
    arguments.callee.base.apply(this, arguments);
    var project = this.get('project'),
        hostname = this.get('hostname'),
        port = this.get('port');

    this._bt_server = http.createServer(function (req, res) {
      var url = path.normalize(req.url);
      var start = new Date().getTime();

      // if the url is in the project, send it back
      if (url === "/") {
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.end(project.get('indexHTML'));
      } else {
        var ary = url.slice(1).split('/');

        if (ary.length === 1) {
          // send back the HTML for the app, if it's an app
          var appName = ary[0],
              app = project.findApp(appName);

          if (app) {
            res.writeHead(200, {'Content-Type': 'text/html'});
            res.end(app.get('indexHTML'));
          } else {
            res.writeHead(200, {'Content-Type': 'text/plain'});
            res.end("You asked to load '"+appName+"' which is not an app in this project.");
          }

        } else {
          var idx, len, node = project, part;
          for (idx=0, len=ary.length; idx<len; ++idx) {
            part = ary[idx];
            // console.log(part);
            node = node.get(part);
            if (node) {
              if (idx !== (len-1) && node.get('isBuildNode')) continue;
              else if (idx === (len-1) && node.get('isFile')) continue;
              else {
                console.log("failed to get a valid node at "+part);
                node = undefined;
                break;
              }
            }
            else {
              console.log("failed to get a node at "+part);
              break;
            }
          }

          if (node) {
            // Send back the file.
            var sourcePath = node.get('sourcePath');
            fs.readFile(sourcePath, "utf-8", function(error, content) {
              if (error) {
                res.writeHead(500);
                res.end(error.toString());
              } else {
                res.writeHead(200, {'Content-Type': 'application/javascript'});
                var superCalls = new Date().getTime();
                content = replaceScSuperCalls(content);
                var end = new Date().getTime();
                if (BT.LOG_SERVING) console.log(sourcePath, (end-start)+'ms read', '('+(end-superCalls)+'ms process)');
                res.end(content, 'utf-8');
              }
            });
          } else {
            res.writeHead(200, {'Content-Type': 'text/plain'});
            res.end("That file does not exist.");
          }
        }
      }
    }).listen(port, hostname);
    console.log('Server running at http://'+hostname+':'+port+'/');
  }
  
});
