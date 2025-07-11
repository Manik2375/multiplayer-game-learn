class Player {
  constructor({x, y, score, id}) {
    this.x = x;
    this.y = y;
    this.score = score || 0;
    this.id = id;
  }

  movePlayer(dir, speed) {
    switch (dir) {
      case 'up':
        this.y -= speed;
        break;
      case 'down':
        this.y += speed;
        break;
      case 'left':
        this.x -= speed;
        break;
      case 'right':
        this.x += speed;
        break;
    }
  }

  collision(item) {
    // Simple AABB collision detection
    // Assuming both player and item have width/height of 30 and 20 respectively
    const playerSize = 30;
    const itemSize = 20;
    
    return (this.x < item.x + itemSize &&
            this.x + playerSize > item.x &&
            this.y < item.y + itemSize &&
            this.y + playerSize > item.y);
  }

  calculateRank(arr) {
    // Sort players by score in descending order
    const sortedPlayers = arr.sort((a, b) => b.score - a.score);
    
    // Find this player's rank
    const rank = sortedPlayers.findIndex(player => player.id === this.id) + 1;
    const totalPlayers = arr.length;
    
    return `Rank: ${rank}/${totalPlayers}`;
  }
}

export default Player;
