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
    chunk.placeObjects(this.scene);
    
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
        
        tiles.push({
          x,
          y, 
          height,
          type: 'grass'
        });
      }
    }

    // Add some test objects
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