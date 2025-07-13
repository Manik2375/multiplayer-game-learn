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
    const playerSize = 30;
    const itemSize = 20;
    
    return (this.x < item.x + itemSize &&
            this.x + playerSize > item.x &&
            this.y < item.y + itemSize &&
            this.y + playerSize > item.y);
  }

  calculateRank(arr) {
    const sortedPlayers = arr.sort((a, b) => b.score - a.score);
    
    const rank = sortedPlayers.findIndex(player => player.id === this.id) + 1;
    const totalPlayers = arr.length;
    
    return `Rank: ${rank}/${totalPlayers}`;
  }
}

export default Player;
