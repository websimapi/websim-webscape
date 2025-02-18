import { MapChunk } from './MapChunk.js';

export class MapManager {
  constructor() {
    this.chunks = new Map();
    this.chunkSize = 64;
    
    // Load initial test chunk
    this.loadChunk(0, 0);
  }

  async loadChunk(chunkX, chunkY) {
    // Generate test chunk data
    const testData = this.generateTestChunkData();
    
    const chunk = new MapChunk(chunkX, chunkY, testData);
    const key = `${chunkX},${chunkY}`;
    this.chunks.set(key, chunk);
  }

  generateTestChunkData() {
    const tiles = [];
    const objects = [];
    
    // Generate height map using simplex noise
    for (let x = 0; x < 64; x++) {
      for (let y = 0; y < 64; y++) {
        // Simple height calculation for testing
        const height = Math.sin(x/10) * Math.cos(y/10) * 2;
        
        // Determine tile type based on height
        let type = 'grass';
        if (height < -1) {
          type = 'water';
        } else if (height > 1) {
          type = 'mountain';  
        }
        
        tiles.push({
          x,
          y, 
          height,
          type
        });
      }
    }

    // Add some test objects at specific locations
    objects.push(
      { x: 10, y: 10, type: 'tree' },
      { x: 20, y: 15, type: 'rock' },
      { x: 30, y: 25, type: 'tree' },
      { x: 40, y: 35, type: 'rock' }
    );

    return {
      tiles,
      objects
    };
  }

  // Get chunk at world coordinates
  getChunkAt(worldX, worldY) {
    const chunkX = Math.floor(worldX / this.chunkSize);
    const chunkY = Math.floor(worldY / this.chunkSize);
    return this.chunks.get(`${chunkX},${chunkY}`);
  }
}