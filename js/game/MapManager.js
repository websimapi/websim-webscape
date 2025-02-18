import { MapChunk } from './MapChunk.js';

export class MapManager {
  constructor(scene) {
    this.scene = scene;
    this.chunks = new Map();
    this.chunkSize = 64;
    
    // Load initial test chunk
    this.loadChunk(0, 0);
  }

  async loadChunk(chunkX, chunkY) {
    // Generate test chunk data
    const testData = this.generateTestChunkData();
    
    const chunk = new MapChunk(chunkX, chunkY, testData);
    const mesh = chunk.generateMesh();
    
    this.scene.add(mesh);
    
    const key = `${chunkX},${chunkY}`;
    this.chunks.set(key, chunk);
  }

  generateTestChunkData() {
    const tiles = [];
    
    // Generate height map using simplex noise
    for (let x = 0; x < 64; x++) {
      for (let y = 0; y < 64; y++) {
        // Simple height calculation for testing
        const height = Math.sin(x/10) * Math.cos(y/10) * 2;
        
        tiles.push({
          x,
          y, 
          height,
          type: 'grass'
        });
      }
    }

    return {
      tiles,
      objects: [] 
    };
  }

  // Get chunk at world coordinates
  getChunkAt(worldX, worldY) {
    const chunkX = Math.floor(worldX / this.chunkSize);
    const chunkY = Math.floor(worldY / this.chunkSize);
    return this.chunks.get(`${chunkX},${chunkY}`);
  }

  // Get height at specific world coordinates
  getHeightAt(worldX, worldY) {
    const chunk = this.getChunkAt(worldX, worldY);
    if (chunk) {
      const localX = worldX % this.chunkSize;
      const localY = worldY % this.chunkSize;
      return chunk.getHeight(localX, localY);
    }
    return 0;
  }
}