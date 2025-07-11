require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const expect = require('chai');
const socket = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');

const fccTestingRoutes = require('./routes/fcctesting.js');
const runner = require('./test-runner.js');

const app = express();

// Security headers using Helmet v3.21.3
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for this project
  xssFilter: true, // Enable XSS protection
  noSniff: true, // Prevent MIME type sniffing
  frameguard: { action: 'deny' }, // Prevent clickjacking
  hsts: false, // Disable HSTS for testing
  noCache: true, // Prevent caching
  hidePoweredBy: { setTo: 'PHP 7.4.3' } // Hide that it's powered by Express
}));

// Additional no-cache headers
app.use((req, res, next) => {
  res.setHeader('Surrogate-Control', 'no-store');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

app.use('/public', express.static(process.cwd() + '/public'));
app.use('/assets', express.static(process.cwd() + '/assets'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//For FCC testing purposes and enables user to connect from outside the hosting platform
app.use(cors({origin: '*'})); 

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

// Set up Socket.io
const io = socket(server);

// Game state
const players = {};
let collectibles = {};
let collectibleId = 0;

// Canvas dimensions
const CANVAS_WIDTH = 640;
const CANVAS_HEIGHT = 480;
const PLAYER_SIZE = 30;
const COLLECTIBLE_SIZE = 20;

// Generate random collectible
function generateCollectible() {
  collectibleId++;
  const id = collectibleId;
  const x = Math.floor(Math.random() * (CANVAS_WIDTH - COLLECTIBLE_SIZE));
  const y = Math.floor(Math.random() * (CANVAS_HEIGHT - COLLECTIBLE_SIZE));
  const value = Math.floor(Math.random() * 3) + 1; // Random value 1-3
  
  return {
    id: id,
    x: x,
    y: y,
    value: value
  };
}

// Initialize collectibles
collectibles[1] = generateCollectible();

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('New player connected:', socket.id);
  
  // Create new player
  const newPlayer = {
    id: socket.id,
    x: Math.floor(Math.random() * (CANVAS_WIDTH - PLAYER_SIZE)),
    y: Math.floor(Math.random() * (CANVAS_HEIGHT - PLAYER_SIZE)),
    score: 0
  };
  
  players[socket.id] = newPlayer;
  
  // Send current game state to new player
  socket.emit('init', {
    id: socket.id,
    players: players,
    collectibles: collectibles
  });
  
  // Broadcast new player to others
  socket.broadcast.emit('new-player', newPlayer);
  
  // Handle player movement
  socket.on('move-player', (data) => {
    if (players[socket.id]) {
      const player = players[socket.id];
      const { direction, speed } = data;
      
      // Update player position
      switch (direction) {
        case 'up':
          player.y = Math.max(0, player.y - speed);
          break;
        case 'down':
          player.y = Math.min(CANVAS_HEIGHT - PLAYER_SIZE, player.y + speed);
          break;
        case 'left':
          player.x = Math.max(0, player.x - speed);
          break;
        case 'right':
          player.x = Math.min(CANVAS_WIDTH - PLAYER_SIZE, player.x + speed);
          break;
      }
      
      // Check for collectible collision
      for (let collectibleId in collectibles) {
        const collectible = collectibles[collectibleId];
        
        // Simple collision detection
        if (player.x < collectible.x + COLLECTIBLE_SIZE &&
            player.x + PLAYER_SIZE > collectible.x &&
            player.y < collectible.y + COLLECTIBLE_SIZE &&
            player.y + PLAYER_SIZE > collectible.y) {
          
          // Player collected item
          player.score += collectible.value;
          delete collectibles[collectibleId];
          
          // Generate new collectible
          const newCollectible = generateCollectible();
          collectibles[newCollectible.id] = newCollectible;
          
          // Broadcast collectible update
          io.emit('collectible-collected', {
            playerId: socket.id,
            collectibleId: collectibleId,
            newCollectible: newCollectible,
            playerScore: player.score
          });
        }
      }
      
      // Broadcast player position update
      io.emit('player-update', {
        id: socket.id,
        x: player.x,
        y: player.y,
        score: player.score
      });
    }
  });
  
  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('Player disconnected:', socket.id);
    delete players[socket.id];
    socket.broadcast.emit('player-disconnect', socket.id);
  });
});

module.exports = app; // For testing
