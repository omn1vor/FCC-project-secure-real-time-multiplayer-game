require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const expect = require('chai');
const socket = require('socket.io');
const helmet = require("helmet");
const cors = require('cors');

const fccTestingRoutes = require('./routes/fcctesting.js');
const runner = require('./test-runner.js');

const app = express();

app.use(cors({origin: '*'})); //For FCC testing purposes only

app.use(helmet.noSniff());
app.use(helmet.xssFilter());
app.use(helmet.noCache());
app.use(helmet.hidePoweredBy({ setTo: 'PHP 7.4.3' }));

app.use('/public', express.static(process.cwd() + '/public'));
app.use('/assets', express.static(process.cwd() + '/assets'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));



// Index page (static HTML)
app.route('/')
  .get(function (req, res) {
    res.sendFile(process.cwd() + '/views/index.html');
  }); 

//For FCC testing purposes
fccTestingRoutes(app);
    
// 404 Not Found Middleware
app.use(function(req, res, next) {
  res.status(404)
    .type('text')
    .send('Not Found');
});

const portNum = process.env.PORT || 3000;

// Set up server and tests
const server = app.listen(portNum, () => {
  console.log(`Listening on port ${portNum}`);
  if (process.env.NODE_ENV==='test') {
    console.log('Running Tests...');
    setTimeout(function () {
      try {
        runner.run();
      } catch (error) {
        console.log('Tests are not valid:');
        console.error(error);
      }
    }, 1500);
  }
});

let players = [];
const prize = { x: 0, y: 0, value: 0 };
const io = socket.listen(server);

io.on('connection', async (socket) => {
  
  console.log('a user connected', socket.id);

  socket.emit('prize location', prize);
  
  socket.on('prize location', prizeData => {
    prize.x = prizeData.x;
    prize.y = prizeData.y;
    prize.value = prizeData.value;
  });

  socket.on('disconnect', (reason) => {
    console.log('user disconnected: ', reason);    
    players = players.filter(pl => pl.id != socket.id);
    io.emit('player disconnected', socket.id);
  });

  socket.on('chat message', text => {
    io.emit('chat message', text);
  });

  socket.on('player connected', (player) => {
    player.main = false;
    players.push(player);
    io.emit('player positions', players);
  });
  
  socket.on('player moved', (id, dir, x, y) => {
    p = players.find(i => i.id == id);
    if (p) {
      p.dir = dir;
      p.x = x;
      p.y = y;
      // console.log(id, dir, x, y);
      // console.log(players);
      socket.broadcast.emit('player positions', players);
    }
  }); 

  socket.on('player stopped', (id, dir, x, y) => {
    p = players.find(i => i.id == id);
    if (p) {
      p.dir = dir;
      p.x = x;
      p.y = y;

      socket.broadcast.emit('player positions', players);
    }
  });

  socket.on('update score', scoreData => {
    p = players.find(i => i.id == scoreData.id);
    if (p) {
      p.score = scoreData.score;
      socket.broadcast.emit('update score', scoreData);
    }
  });

});

module.exports = app; // For testing
