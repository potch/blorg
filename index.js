var marked = require('marked');
var http = require('http');
var url = require('url');
var fs = require('fs');

handlers = [];

function handle(path, fn) {
  handlers.push([new RegExp('^' + path.replace('/', '\\/') + '$'), fn, path]);
}

function serve(path) {
  return function(req, res) {
    fs.readFile(path, function(err, data) {
      if (err) {
        res.writeHead(404);
        res.end('oops');
      } else {
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.end(data);
      }
    });
  };
}

handle('/', serve('index.html'));
handle('/marked.js', serve('node_modules/marked/lib/marked.js'));

handle('/render', function(req, res) {
  var parsed = url.parse(req.url);
  res.writeHead(200, {'Content-Type': 'text/html'});
  var msg = parsed.query;
  if (msg) {
    msg = decodeURIComponent(msg);
    res.end(marked(msg));
  } else {
    res.end('');
  }
});

handle('/save/([a-zA-Z0-9-]+\.md)', function(req, res, name) {
  var parsed = url.parse(req.url);
  var msg = parsed.query;
  msg = decodeURIComponent(msg);
  if (msg.length) {
    fs.writeFile('posts/' + name[1], msg, function(err, data) {
      res.writeHead(200, {'Content-Type': 'text/plain'});
      res.end();
    });
  } else {
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end('nothing to save!');
  }
});

handle('/posts', function(req, res) {
  fs.readdir('posts/', function(err, files) {
    res.writeHead(200, {'Content-Type': 'application/json'});
    res.end(JSON.stringify(files));
  });
});

handle('/post/([a-zA-Z0-9-]+\.md)', function(req, res, name) {
  fs.readFile('posts/' + name[1], function(err, data) {
    if (err) {
      res.writeHead(404);
      res.end('oops');
      console.log(name[1] + ' not found');
    } else {
      res.writeHead(200, {'Content-Type': 'text/plain'});
      res.end(data);
    }
  });
});

http.createServer(function (req, res) {
  var parsed = url.parse(req.url);
  for (var i=0; i<handlers.length; i++) {
    var match = parsed.pathname.match(handlers[i][0]);
    if (match) {
      handlers[i][1](req, res, match);
      return;
    }
  }
  res.writeHead(404);
  res.end('oops');
}).listen(3754, '127.0.0.1');

console.log('127.0.0.1:3754');
