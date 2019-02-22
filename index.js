const config = require('./config.js').config

const app = require('express')()
const http = require('http').Server(app)
const io = require('socket.io')(http)

const bodyParser = require('body-parser')
app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())

const sqlite3 = require('sqlite3').verbose()
const db = new sqlite3.Database('./campushack.sqlite3')

app.get('/api/announcements', function(req, res) {
  db.all('select * from Announcements', function(err, rows) {
    console.log(rows)
    res.send(rows)
  })
})

const basicAuth = require('express-basic-auth');
app.use(basicAuth({
  users: config.admins,
  challenge: true,
  realm: 'admin'
}));

app.get('/secure', function(req, res) {
  res.send('hi')
})

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
