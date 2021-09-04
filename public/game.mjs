import Player from './Player.mjs';
import Collectible from './Collectible.mjs';

const socket = io();
const canvas = document.getElementById('game-window');
const context = canvas.getContext('2d');
context.font = '24px serif';

const chat = document.getElementById('chat');
const input = document.getElementById('input');
const ufo = new Image();
ufo.src = 'https://image.flaticon.com/icons/png/512/3306/3306604.png';
const enemyUfo = new Image();
enemyUfo.src = 'https://image.flaticon.com/icons/png/512/3306/3306671.png';
const crystal = new Image();
crystal.src = 'https://image.flaticon.com/icons/png/512/1583/1583581.png';

const keyMap = new Map([
  [65, 'left'],
  [68, 'right'],
  [87, 'up'],
  [83, 'down'],
  [37, 'left'],
  [39, 'right'],
  [38, 'up'],
  [40, 'down']
]);

const prizeValue = 1;
const prize = new Collectible({x: 0, y: 0, value: prizeValue, id: 0});
const gameSpeed = 5; // pixels per animation tick
const maxDims = [canvas.width, canvas.height];
let players = [];



function draw() {
  context.clearRect(0, 0, maxDims[0], maxDims[1]);
  
  players.forEach((pl, index) => {    
    Object.keys(pl.dir).forEach(dir => {      
      if (pl.dir[dir]) {
        pl.movePlayer(dir, gameSpeed, maxDims);
      }
    });

    let img = pl.main ? ufo : enemyUfo;    
    context.drawImage(img, pl.x, pl.y, pl.size, pl.size);    

    if (pl.main) {
      if (pl.collision(prize)) {
        pl.score += prize.value;
        initializePrize();
        socket.emit('update score', { id: pl.id, score: pl.score });
      }      
      context.fillText(pl.calculateRank(players), 10, 20);
    }
      
    // context.fillText(pl.score, 10, 40 + 20*index);
  });

  context.drawImage(crystal, prize.x, prize.y, prize.size, prize.size);
  window.requestAnimationFrame(draw);
}

function initializePrize() {
  prize.x = Math.floor(Math.random() * canvas.width);
  prize.y = Math.floor(Math.random() * canvas.height);
  socket.emit('prize location', prize);
}

document.addEventListener('keydown', e => {  
  if (document.activeElement == input) return;

  if (keyMap.has(e.keyCode)) {
    //e.preventDefault();
    let player = players.find(i => i.id == socket.id);
    if (!player) return;
    player.dir[keyMap.get(e.keyCode)] = true;
    socket.emit('player moved', player.id, player.dir, player.x, player.y);
  } else {
    alert(e.keyCode);
  }

});

document.addEventListener('keyup', e => {  
  if (document.activeElement == input) return;

  if (keyMap.has(e.keyCode)) {
    //e.preventDefault();
    let player = players.find(i => i.id == socket.id);
    if (!player) return;
    player.dir[keyMap.get(e.keyCode)] = false;
    socket.emit('player stopped', player.id, player.dir, player.x, player.y);
  }
});

form.addEventListener('submit', (e) => {
  e.preventDefault();
  if (input.value) {
    socket.emit('chat message', input.value);
    input.value = '';
  }
});

socket.on("chat message", (text) => {
  let item = document.createElement('li');
  item.textContent = text;
  chat.appendChild(item);
  window.scrollTo(0, document.body.scrollHeight);
});

socket.on('connect', () => {
  
  socket.on('prize location', (prizeData) => {
    if (prizeData.x == 0 && prizeData.y == 0) {
      initializePrize();
    } else {
      prize.x = prizeData.x;
      prize.y = prizeData.y;
    }    
  });

  socket.on('player positions', playersData => {        
    console.log(playersData);
    playersData.forEach(pl => {
      let player = players.find(i => i.id == pl.id);
      if (!player) {        
        players.push(new Player(pl));        
      } else {
        player.x = pl.x;
        player.y = pl.y;
        player.dir = pl.dir;
        player.score = pl.score;        
      }
    });    
  });

  socket.on('player disconnected', id => {
    players = players.filter(pl => pl.id != id);    
  });

  let player = new Player({x: Math.floor(Math.random() * maxDims[0]) , y: Math.floor(Math.random() * maxDims[1]), id: socket.id, main: true});
  players.push(player);
  socket.emit('player connected', player);
  draw();

  socket.on('update score', scoreData => {
    p = players.find(i => i.id == scoreData.id);
    if (p) {
      p.score = scoreData.score;      
    }
  });

});

