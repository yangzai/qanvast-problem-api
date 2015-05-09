'use strict';

var express = require('express');
var app = express();
var bodyParser = require('body-parser');

var request = require('request');
var qs = require('querystring');
var RSVP = require('rsvp');

var workerHost = process.argv[2] || 'localhost';
var workerPort = process.argv[3] || 8000;

app.use(require('express-promise')());
app.use(bodyParser.json());

app.get('/hello-world', function (req, res) {
  
  if (req.query.name) {
    var workerUrl = 'http://' + workerHost +
        ':' + workerPort +
        '?' + qs.stringify({name: req.query.name});
    
    //METHOD 1: Using async callback
//    request.get(workerUrl, function (err, response, body) {
//      if (err) {
//        console.error(err);  
//        return res.status(500).send('Internal Error.');
//      }
//      res.send(body);
//    });
    
    //METHOD 2: Create wrapper for request.get() to handle callback using deffered promise
    var requestGet = function (url) {
      var deferred = RSVP.defer();
      
      request.get(url, function (err, response, body) {
        if (err) {
          deferred.reject(err);
        } else {
          deferred.resolve(body);
          console.log(body);
        }
      });
      
      return deferred.promise;
    };
    
    requestGet(workerUrl)
    .then(res.send)
    .catch(function (err) {
      console.error(err);
      res.status(500).send('Internal Error.');
    });
    
    //METHOD 3: Using the already available promise-based chaining in the 'request' library
//    request.get(workerUrl).pipe(res);
  } else {
    res.status(400).send("Missing query parameter 'name'.");
  }
  
});

var server = app.listen(8080, function () {

  var host = server.address().address;
  var port = server.address().port;

  console.log('API listening at http://%s:%s', host, port);

});