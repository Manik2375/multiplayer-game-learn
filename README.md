# Secure Real Time Multiplayer Game

This is a secure real-time multiplayer game implemented using Socket.io and HTML5 Canvas. Players can move around the game field, collect items to increase their score, and compete with other players in real-time.

## Features

- ✅ Real-time multiplayer gameplay using Socket.io
- ✅ Player movement with WASD or Arrow keys
- ✅ Collectible items that increase player score
- ✅ Player ranking system based on score
- ✅ Secure headers using Helmet.js
- ✅ Collision detection between players and collectibles
- ✅ Player synchronization across all clients
- ✅ Graceful handling of player disconnections

## Security Features

- **MIME Type Protection**: Prevents MIME type sniffing attacks
- **XSS Protection**: Protects against Cross-Site Scripting attacks
- **No Caching**: Prevents client-side caching of sensitive data
- **Hidden Technology**: Server identifies as PHP 7.4.3 for security obscurity

## Game Controls

- **W** or **Up Arrow**: Move up
- **A** or **Left Arrow**: Move left
- **S** or **Down Arrow**: Move down
- **D** or **Right Arrow**: Move right

## How to Run

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the server:
   ```bash
   npm start
   ```

3. Open your browser and navigate to `http://localhost:3000`

4. Use multiple browser tabs/windows to test multiplayer functionality

## Testing

Run the test suite:
```bash
npm test
```

## Game Classes

### Player Class (`Player.mjs`)
- Manages player position, score, and unique ID
- Implements movement logic with `movePlayer(direction, speed)`
- Collision detection with `collision(item)`
- Ranking calculation with `calculateRank(playersArray)`

### Collectible Class (`Collectible.mjs`)
- Manages collectible items with position, value, and unique ID
- Items are randomly generated when collected

## Architecture

- **Frontend**: HTML5 Canvas for rendering, ES6 modules for game logic
- **Backend**: Node.js with Express and Socket.io for real-time communication
- **Security**: Helmet.js for security headers
- **Real-time**: Socket.io for bidirectional communication

Instructions for building your project can be found at https://www.freecodecamp.org/learn/information-security/information-security-projects/secure-real-time-multiplayer-game
