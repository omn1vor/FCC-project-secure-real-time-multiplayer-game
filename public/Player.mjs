class Player {
  
  constructor({x=0, y=0, score=0, id=0, main=false}) {
    this.x = x;
    this.y = y;
    this.score = score;
    this.id = id;
    this.dir = { 'left': false, 'right': false, 'up': false, 'down': false };
    this.size = 30;
    this.main = main;
    console.log(x, y, score, id);
  }

  movePlayer(dir, speed, maxDims = [640, 480]) {
    switch (dir) {
      case 'left':
        this.x -= speed;
        if (this.x < 0) this.x = 0;
        break;
      case 'right':
        this.x += speed;
        if (this.x > maxDims[0] - this.size) this.x = maxDims[0] - this.size;
        break;
      case 'up':
        this.y -= speed;
        if (this.y < 0) this.y = 0;
        break;
      case 'down':
        this.y += speed;
        if (this.y > maxDims[1] - this.size) this.y = maxDims[1] - this.size;
        break;
    }

  }

  collision(item) {
    return (this.x + this.size >= item.x && this.x <= item.x + item.size)
            && (this.y + this.size >= item.y && this.y <= item.y + item.size);
  }

  calculateRank(arr) {        
    let myArr = arr.sort((a, b) => b.score - a.score);
    let myRank = myArr.findIndex(i => i.id == this.id) + 1;
    
    return `Rank: ${myRank}/${arr.length}`;
  }
}

export default Player;
