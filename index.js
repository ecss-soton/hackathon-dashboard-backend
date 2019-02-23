const config = require('./config.js').config

const app = require('express')()
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

const http = require('http').Server(app)
const io = require('socket.io')(http)

const bodyParser = require('body-parser')
app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())

const sqlite3 = require('sqlite3').verbose()
const db = new sqlite3.Database(__dirname + '/campushack.sqlite3')

app.get('/api/announcements', function(req, res) {
  res.header('Access-Control-Allow-Origin', '*');
  getAnnouncements(function(rows) {
    res.send(rows)
  })
})

app.get('/api/repos', function(req, res) {
  res.header('Access-Control-Allow-Origin', '*');
  getRepos(function(rows) {
    res.send(rows)
  })
})

const basicAuth = require('express-basic-auth');
app.use(basicAuth({
  users: config.admins,
  challenge: true,
  realm: 'admin'
}));

const cookieParser = require('cookie-parser')
app.use(cookieParser())

const csrf = require('csurf')
const csrfProtection = csrf({
  cookie: true,
})

const request = require('request');

app.get('/admin', function(req, res) {
  res.sendFile(__dirname + '/views/admin.html')
})

app.get('/admin/announcements', csrfProtection, function(req, res) {
  getAnnouncements(function(announcements) {
    res.render('admin-announcements', {
      csrfToken: req.csrfToken(),
      announcements: announcements,
    })
  })
})

app.post('/admin/announcements', csrfProtection, function(req, res) {
  if ('submit' in req.body) {
    db.run('insert into Announcements (Title, Content) values (?, ?)', req.body.title, req.body.content, function(err) {
      if (!err) {
        db.get('select * from Announcements where id = ?', this.lastID, function(err, row) {
          if (!err) {
            row['action'] = 'add'
            io.emit('announcements', row)
            if (config.integrations.slack.enabled && config.integrations.slack.announcements_webhook) {
              let text = `*${req.body.title}*`
              if (req.body.content) {
                text += `\n${req.body.content}`
              }
              request.post({
                url: config.integrations.slack.announcements_webhook,
                json: {
                  text: text,
                },
              })
            }
          }
        })
      }
    })
    res.redirect('/admin/announcements')
  } else if ('delete' in req.body) {
    db.run('delete from Announcements where id = ?', req.body.id, function(err) {
      if (!err) {
        io.emit('announcements', {
          action: 'delete',
          id: req.body.id,
        })
      }
    })
    res.redirect('/admin/announcements')
  }
})

app.get('/admin/repos', csrfProtection, function(req, res) {
  getRepos(function(repos) {
    res.render('admin-repos', {
      csrfToken: req.csrfToken(),
      repos: repos,
    })
  })
})

app.post('/admin/repos', csrfProtection, function(req, res) {
  if ('submit' in req.body) {
    db.run('insert into Repos (RepoUrl, TeamName) values (?, ?)', req.body.url, req.body.team, function(err) {
      if (!err) {
        io.emit('repos', {
          Action: 'add',
          RepoUrl: req.body.url,
          TeamName: req.body.team,
        })
      }
    })
    res.redirect('/admin/repos')
  } else if ('delete' in req.body) {
    db.run('delete from Repos where RepoUrl = ?', req.body.url, function(err) {
      if (!err) {
        io.emit('repos', {
          action: 'delete',
          url: req.body.url,
        })
      }
    })
    res.redirect('/admin/repos')
  }
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

let port = process.env.PORT || 3001
http.listen(port, function() {
  console.log('listening on *:3001');
});

function change_page() {
  console.log('changing page');
  io.emit('change page', '');
}

setInterval(() => change_page(), 20000);

function getAnnouncements(callback) {
  db.all('select * from Announcements order by Id desc', function(err, rows) {
    callback(rows)
  })
}

function getRepos(callback) {
  db.all('select * from Repos', function(err, rows) {
    callback(rows)
  })
}
