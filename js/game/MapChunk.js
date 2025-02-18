// Class to represent a 64x64 tile chunk of the game world
export class MapChunk {
  constructor(chunkX, chunkY, data) {
    this.chunkX = chunkX;
    this.chunkY = chunkY;
    this.size = 64;
    this.tiles = data.tiles;
    this.objects = data.objects;
  }

  // Get height at specific coordinates within chunk
  getHeight(x, y) {
    const tile = this.tiles.find(t => t.x === x && t.y === y);
    return tile ? tile.height : 0;
  }

  // Get tile type at specific coordinates
  getTileType(x, y) {
    const tile = this.tiles.find(t => t.x === x && t.y === y);
    return tile ? tile.type : 'grass';
  }

  // Get all objects in chunk
  getObjects() {
    return this.objects;
  }

  // Get object at specific coordinates
  getObjectAt(x, y) {
    return this.objects.find(obj => obj.x === x && obj.y === y);
  }
}