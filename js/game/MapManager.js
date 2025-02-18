import { MapChunk } from './MapChunk.js';

export class MapManager {
  constructor(scene) {
    this.scene = scene;
    this.chunks = new Map();
    this.chunkSize = 64;
    
    // Load initial chunks in a 3x3 grid
    for (let x = -1; x <= 1; x++) {
      for (let y = -1; y <= 1; y++) {
        this.loadChunk(x, y);
      }
    }
  }

  async loadChunk(chunkX, chunkY) {
    const testData = this.generateTerrainData(chunkX, chunkY);
    const chunk = new MapChunk(chunkX, chunkY, testData);
    const mesh = chunk.generateMesh();
    
    this.scene.add(mesh);
    
    const key = `${chunkX},${chunkY}`;
    this.chunks.set(key, chunk);
  }

  generateTerrainData(chunkX, chunkY) {
    const tiles = [];
    
    // Use multiple noise frequencies for more interesting terrain
    for (let x = 0; x < 64; x++) {
      for (let y = 0; y < 64; y++) {
        // World coordinates
        const worldX = chunkX * 64 + x;
        const worldY = chunkY * 64 + y;
        
        // Generate height using multiple frequencies of noise
        const height = 
          Math.sin(worldX/20) * Math.cos(worldY/20) * 4 + // Large hills
          Math.sin(worldX/8) * Math.cos(worldY/8) * 2 +   // Medium features
          Math.sin(worldX/4) * Math.cos(worldY/4) * 1;    // Small details
        
        // Add variation based on distance from chunk center
        const centerDist = Math.sqrt(
          Math.pow((x-32), 2) + 
          Math.pow((y-32), 2)
        );
        
        // Slope terrain down at edges for smoother chunk transitions
        const edgeFalloff = Math.max(0, 1 - (centerDist / 64));
        
        tiles.push({
          x,
          y, 
          height: height * edgeFalloff,
          type: 'grass'
        });
      }
    }

    return {
      tiles
    };
  }

  // Get chunk at world coordinates
  getChunkAt(worldX, worldY) {
    const chunkX = Math.floor(worldX / this.chunkSize);
    const chunkY = Math.floor(worldY / this.chunkSize);
    return this.chunks.get(`${chunkX},${chunkY}`);
  }
}