// Class to represent a 64x64 tile chunk of the game world
export class MapChunk {
  constructor(chunkX, chunkY, data) {
    this.chunkX = chunkX;
    this.chunkY = chunkY;
    this.size = 64;
    this.tiles = data.tiles;
  }

  // Get height at specific coordinates within chunk
  getHeight(x, y) {
    const tile = this.tiles.find(t => t.x === x && t.y === y);
    return tile ? tile.height : 0;
  }

  // Generate Three.js mesh for this chunk
  generateMesh() {
    const geometry = new THREE.PlaneGeometry(
      this.size, 
      this.size, 
      this.size - 1, 
      this.size - 1
    );

    const vertices = geometry.attributes.position.array;
    
    // Set height for each vertex
    for (let i = 0; i < vertices.length; i += 3) {
      const x = Math.floor((i / 3) % this.size);
      const y = Math.floor((i / 3) / this.size);
      vertices[i + 2] = this.getHeight(x, y);
    }

    geometry.computeVertexNormals();

    const material = new THREE.MeshStandardMaterial({ 
      color: 0x3a9d23,
      roughness: 0.8,
      metalness: 0.2
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(
      this.chunkX * this.size,
      this.chunkY * this.size,
      0
    );
    mesh.rotation.x = -Math.PI / 2; // Rotate to horizontal

    return mesh;
  }
}