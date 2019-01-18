var config = require('./config.js').config;

var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

io.on('connection', function(socket) {
  console.log(`${socket.id} connected`);

  // send initial info
  socket.emit('event', config.event);
  socket.emit('hacking time', {
    start: config.hacking_start_time,
    end: config.hacking_end_time
  });

  socket.on('disconnect', function() {
    console.log(`${socket.id} disconnected`);
  });
  socket.on('request event', function() {
    socket.emit('event', config.event);
    console.log(`event sent to ${socket.id}`);
  });
  socket.on('request hacking time', function() {
    socket.emit('hacking time', {
      start: config.hacking_start_time,
      end: config.hacking_end_time
    });
    console.log(`hacking time sent to ${socket.id}`);
  });
  
})

http.listen(3001, function() {
  console.log('listening on *:3001');
});

function change_page() {
  console.log('changing page');
  io.emit('change page', '');
}

setInterval(() => change_page(), 20000);
