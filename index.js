var config = require('./config.js').config;

var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

const bodyParser = require('body-parser')
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

io.on('connection', function(socket) {
  console.log(`${socket.id} connected`);
  socket.on('disconnect', function() {
    console.log(`${socket.id} disconnected`);
  });

  // send initial info
  socket.emit('event', config.event);
  socket.emit('hacking time', {
    start: config.hacking_start_time,
    end: config.hacking_end_time
  });

  // client
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

// admin
app.post('/admin/event', function(req, res) {
  console.log(`requested to set event to: ${req.body.event}`);
  io.emit('event', req.body.event);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.send('ok');
});

let port = process.env.PORT;
if (port == null || port === "") {
  port = 3001;
}
http.listen(port, function() {
  console.log('listening on *:3001');
});

function change_page() {
  console.log('changing page');
  io.emit('change page', '');
}

setInterval(() => change_page(), 20000);
