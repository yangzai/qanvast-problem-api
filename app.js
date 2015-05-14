'use strict';

var express = require('express');
var app = express();

var uuid = require('uuid');
var queue = require('jackrabbit')(process.env.CLOUDAMQP_URL || 'amqp://localhost');

var responseHash = {};

//app.use(require('express-promise')());

queue.on('connected', function() {
  //As consumer
  queue.create('hello.callback', function () {
    queue.handle('hello.callback', function (job, ack) {
      responseHash[job.id].send(job.message);
      delete responseHash[job.id];
      ack();
    });
  });
  
  //As producer
  queue.create('hello.job', function () {
    app.get('/hello-world', function (req, res) { //create endpt after queue is ready
      if (req.query.name) {
        var id = uuid.v4();
        responseHash[id] = res;
        queue.publish('hello.job', { id: id, name: req.query.name });
      } else {
        res.status(400).send("Missing query parameter 'name'.");
      }
    });
  });

});


var server = app.listen(process.env.PORT || 8080, function () {

  var host = server.address().address;
  var port = server.address().port;

  console.log('API listening at http://%s:%s', host, port);

});