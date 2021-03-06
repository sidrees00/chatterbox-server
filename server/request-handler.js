/*************************************************************

You should implement your request handler function in this file.

requestHandler is already getting passed to http.createServer()
in basic-server.js, but it won't work as is.

You'll have to figure out a way to export this function from
this file and include it in basic-server.js so that it actually works.

*Hint* Check out the node module documentation at http://nodejs.org/api/modules.html.

**************************************************************/
var url = require('url');
var querystring = require('querystring');
var getId = () => Math.floor(Math.random() * 1000000000);
var storeMessages = {results: [{
  username: 'System',
  text: 'Welcome to the lobby!',
  roomname: 'lobby',
  createdAt: Date.now(),
  objectId: getId()
}]};


var requestHandler = function(request, response) {
  // Request and Response come from node's http module.
  //
  // They include information about both the incoming request, such as
  // headers and URL, and about the outgoing response, such as its status
  // and content.
  //
  // Documentation for both request and response can be found in the HTTP section at
  // http://nodejs.org/documentation/api/

  // Do some basic logging.
  //
  // Adding more logging to your server can be an easy way to get passive
  // debugging help, but you should always be careful about leaving stray
  // console.logs in your code.
  console.log('Serving request type ' + request.method + ' for url ' + request.url);

  // The outgoing status.
  // var statusCode = 200;  //**standard response for successful HTTP requests


  // These headers will allow Cross-Origin Resource Sharing (CORS).
  // This code allows this server to talk to websites that
  // are on different domains, for instance, your chat client.
  //
  // Your chat client is running from a url like file://your/chat/client/index.html,
  // which is considered a different domain.
  //
  // Another way to get around this restriction is to serve you chat
  // client from this domain by setting up static file serving.
  var defaultCorsHeaders = {
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'access-control-allow-headers': 'content-type, accept',
    'access-control-max-age': 10 // Seconds.
  };

  // See the note below about CORS headers.
  var headers = defaultCorsHeaders;

  // Tell the client we are sending them plain text.
  //
  // You will need to change this if you are sending something
  // other than plain text, like JSON or HTML.
  headers['Content-Type'] = 'text/plain';

  // .writeHead() writes to the request line and headers of the response,
  // which includes the status and all headers.
  // response.writeHead(statusCode, headers);


  // Make sure to always call response.end() - Node may not send
  // anything back to the client until you do. The string you pass to
  // response.end() will be the body of the response - i.e. what shows
  // up in the browser.
  //
  // Calling .end "flushes" the response's internal buffer, forcing
  // node to actually send all the data over to the client.
  request.url = url.parse(request.url);
  request.url.query = querystring.parse(request.url.query);

  if (request.url.pathname.indexOf('/classes/messages') === 0) {
    if (request.method === 'GET' || request.method === 'OPTIONS') {
      headers['Content-Type'] = 'application/json';
      response.writeHead(200, headers);
      if (!Object.keys(request.url.query).length) {
        var returnObj = {
          results: storeMessages.results.slice()
        };
        returnObj.results = returnObj.results.sort((a, b) => b.createdAt - a.createdAt);
        return response.end(JSON.stringify(returnObj));
      } else if (request.url.query.order) {
        var returnObj = {
          results: storeMessages.results.slice()
        };
        var sortBy = request.url.query.order;
        var reverse = sortBy.charAt(0) === '-' ? true : false;
        if (reverse) {
          sortBy = sortBy.slice(1);
        }
        var sortFunc = function(a, b) {
          if (reverse) {
            return b[sortBy] - a[sortBy];
          }
          return a[sortBy] - b[sortBy];
        };
        returnObj.results = returnObj.results.sort(sortFunc);
        return response.end(JSON.stringify(returnObj));
      } else { // query string exists, order not specified
        return response.end(JSON.stringify(storeMessages));//**end sends response to the client
      }
    }
    if (request.method === 'POST') {
      var body = [];
      request.on('error', function(err) {
        console.error(err);
        response.writeHead(500, headers);
        response.end('Could not parse request body');
      });
      
      request.on('data', function(chunk) {
        body.push(chunk);
      });

      request.on('end', function() {
        var messageData = JSON.parse(body);
        messageData.createdAt = Date.now();
        messageData.objectId = getId();
        if (!messageData.roomname) {
          messageData.roomname = 'lobby';
        }
        storeMessages.results.push(messageData);
        headers['Content-Type'] = 'application/json';
        response.writeHead(201, headers);
        response.end(JSON.stringify(storeMessages));
      });
    }
  } else {
    response.writeHead(404, headers);
    response.end('Hello, World!'); //**sends this back to the browser
  }
};

module.exports.requestHandler = requestHandler;