import Player from './Player.mjs';
import Collectible from './Collectible.mjs';

const socket = io();
const canvas = document.getElementById('game-window');
const context = canvas.getContext('2d');

let currentPlayer = null;
let players = {};
let collectibles = {};
const PLAYER_SIZE = 30;
const COLLECTIBLE_SIZE = 20;
const MOVE_SPEED = 3;

const PLAYER_COLOR = '#4CAF50';
const OTHER_PLAYER_COLOR = '#2196F3';
const COLLECTIBLE_COLOR = '#FF9800';

let isConnected = false;

socket.on('init', (data) => {
  currentPlayer = new Player(data.players[data.id]);
  players = {};
  
  for (let id in data.players) {
    players[id] = new Player(data.players[id]);
  }
  
  collectibles = {};
  for (let id in data.collectibles) {
    const c = data.collectibles[id];
    collectibles[id] = new Collectible(c);
  }
  
  draw();
});

socket.on('connect', () => {
  console.log('Connected to server');
  isConnected = true;
  draw();
});

socket.on('disconnect', () => {
  console.log('Disconnected from server');
  isConnected = false;
  stopMovement();
  draw();
});

socket.on('connect_error', (error) => {
  console.error('Connection error:', error);
  isConnected = false;
  stopMovement();
  draw();
});

socket.on('new-player', (playerData) => {
  players[playerData.id] = new Player(playerData);
});

socket.on('player-update', (data) => {
  if (players[data.id]) {
    players[data.id].x = data.x;
    players[data.id].y = data.y;
    players[data.id].score = data.score;
    
    if (data.id === currentPlayer.id) {
      currentPlayer.x = data.x;
      currentPlayer.y = data.y;
      currentPlayer.score = data.score;
    }
  }
  draw();
});

socket.on('collectible-collected', (data) => {
  delete collectibles[data.collectibleId];
  
  const newCollectible = new Collectible(data.newCollectible);
  collectibles[data.newCollectible.id] = newCollectible;
  
  if (players[data.playerId]) {
    players[data.playerId].score = data.playerScore;
    
    if (data.playerId === currentPlayer.id) {
      currentPlayer.score = data.playerScore;
    }
  }
  
  draw();
});

socket.on('player-disconnect', (playerId) => {
  delete players[playerId];
  draw();
});

const keys = {};
let lastMoveTime = 0;
const MOVE_INTERVAL = 30;
let movementInterval = null;

document.addEventListener('keydown', (e) => {
  const key = e.key.toLowerCase();
  if (!keys[key]) {
    keys[key] = true;
    startMovement();
  }
  e.preventDefault();
});

document.addEventListener('keyup', (e) => {
  keys[e.key.toLowerCase()] = false;
  
  const hasMovementKey = keys['w'] || keys['s'] || keys['a'] || keys['d'] || 
                        keys['arrowup'] || keys['arrowdown'] || keys['arrowleft'] || keys['arrowright'];
  
  if (!hasMovementKey) {
    stopMovement();
  }
});

function startMovement() {
  if (movementInterval) return;
  
  movementInterval = setInterval(() => {
    handleMovement();
  }, MOVE_INTERVAL);
}

function stopMovement() {
  if (movementInterval) {
    clearInterval(movementInterval);
    movementInterval = null;
  }
}

function handleMovement() {
  if (!currentPlayer || !isConnected) return;
  
  const now = Date.now();
  if (now - lastMoveTime < MOVE_INTERVAL) return;
  
  let direction = null;
  
  if (keys['w'] || keys['arrowup']) {
    direction = 'up';
  } else if (keys['s'] || keys['arrowdown']) {
    direction = 'down';
  } else if (keys['a'] || keys['arrowleft']) {
    direction = 'left';
  } else if (keys['d'] || keys['arrowright']) {
    direction = 'right';
  }
  
  if (direction) {
    const oldX = currentPlayer.x;
    const oldY = currentPlayer.y;
    
    currentPlayer.movePlayer(direction, MOVE_SPEED);
    
    currentPlayer.x = Math.max(0, Math.min(canvas.width - PLAYER_SIZE, currentPlayer.x));
    currentPlayer.y = Math.max(0, Math.min(canvas.height - PLAYER_SIZE, currentPlayer.y));
    
    if (players[currentPlayer.id]) {
      players[currentPlayer.id].x = currentPlayer.x;
      players[currentPlayer.id].y = currentPlayer.y;
    }
    
    draw();
    
    socket.emit('move-player', { direction, speed: MOVE_SPEED });
    lastMoveTime = now;
  } else {
    stopMovement();
  }
}

function draw() {
  context.clearRect(0, 0, canvas.width, canvas.height);
  
  context.strokeStyle = '#333';
  context.lineWidth = 1;
  for (let x = 0; x <= canvas.width; x += 40) {
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, canvas.height);
    context.stroke();
  }
  for (let y = 0; y <= canvas.height; y += 40) {
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(canvas.width, y);
    context.stroke();
  }
  
  for (let id in players) {
    const player = players[id];
    const isCurrentPlayer = currentPlayer && id === currentPlayer.id;
    
    context.fillStyle = isCurrentPlayer ? PLAYER_COLOR : OTHER_PLAYER_COLOR;
    context.fillRect(player.x, player.y, PLAYER_SIZE, PLAYER_SIZE);
    
    context.strokeStyle = isCurrentPlayer ? '#2E7D32' : '#1565C0';
    context.lineWidth = 2;
    context.strokeRect(player.x, player.y, PLAYER_SIZE, PLAYER_SIZE);
    
    context.fillStyle = 'white';
    context.font = 'bold 10px Arial';
    context.textAlign = 'center';
    context.fillText(`P${id.substring(0, 3)}`, player.x + PLAYER_SIZE/2, player.y - 8);
    context.fillText(`${player.score}`, player.x + PLAYER_SIZE/2, player.y + PLAYER_SIZE + 15);
  }
  
  for (let id in collectibles) {
    const collectible = collectibles[id];
    
    context.fillStyle = COLLECTIBLE_COLOR;
    context.fillRect(collectible.x, collectible.y, COLLECTIBLE_SIZE, COLLECTIBLE_SIZE);
    
    context.strokeStyle = '#E65100';
    context.lineWidth = 2;
    context.strokeRect(collectible.x, collectible.y, COLLECTIBLE_SIZE, COLLECTIBLE_SIZE);
    
    context.fillStyle = 'white';
    context.font = 'bold 12px Arial';
    context.textAlign = 'center';
    context.fillText(collectible.value.toString(), collectible.x + COLLECTIBLE_SIZE/2, collectible.y + COLLECTIBLE_SIZE/2 + 4);
  }
  
  context.textAlign = 'left';
  
  if (currentPlayer) {
    const playersArray = Object.values(players);
    const rank = currentPlayer.calculateRank(playersArray);
    
    context.fillStyle = 'rgba(0, 0, 0, 0.7)';
    context.fillRect(5, 5, 200, 80);
    
    context.fillStyle = '#4CAF50';
    context.font = 'bold 16px Arial';
    context.fillText(rank, 15, 25);
    context.fillText(`Score: ${currentPlayer.score}`, 15, 45);
    
    context.fillStyle = 'white';
    context.font = '12px Arial';
    context.fillText(`Players online: ${Object.keys(players).length}`, 15, 65);
  }
  
  context.fillStyle = isConnected ? '#4CAF50' : '#F44336';
  context.font = 'bold 12px Arial';
  context.textAlign = 'right';
  context.fillText(isConnected ? '● Connected' : '● Disconnected', canvas.width - 15, 20);
  
  context.fillStyle = 'rgba(0, 0, 0, 0.7)';
  context.fillRect(5, canvas.height - 55, 350, 50);
  
  context.fillStyle = 'white';
  context.font = '12px Arial';
  context.textAlign = 'left';
  context.fillText('Controls: WASD or Arrow Keys to move', 15, canvas.height - 35);
  context.fillText('Goal: Collect orange squares to increase your score!', 15, canvas.height - 20);
}
