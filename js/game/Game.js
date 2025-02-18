import { GameRenderer } from './GameRenderer.js';
import { MapManager } from './MapManager.js';

export class Game {
  constructor() {
    // Get game container
    this.container = document.getElementById('game-screen');
    
    // Initialize renderer
    this.renderer = new GameRenderer(this.container);
    
    // Initialize map manager
    this.mapManager = new MapManager(this.renderer.getScene());
    
    // Initialize the player dot
    this.initializePlayer();
    
    // Handle window resizing
    window.addEventListener('resize', () => {
      this.renderer.onResize();
    });
  }

  initializePlayer() {
    // Create a small sphere for the player
    const geometry = new THREE.SphereGeometry(0.5, 32, 32);
    const material = new THREE.MeshStandardMaterial({ 
      color: 0xff0000,
      emissive: 0xff0000,
      emissiveIntensity: 0.3,
    });
    this.playerDot = new THREE.Mesh(geometry, material);

    // Position player at a random tile in the first chunk
    // Pick a specific tile near center (32,32) for consistency
    const tileX = 32; // Center of chunk
    const tileY = 32;
    const height = this.mapManager.getChunkAt(0, 0).getHeight(tileX, tileY);

    // Set player position - adding 0.5 to center on tile
    this.playerDot.position.set(tileX + 0.5, tileY + 0.5, height + 0.5);

    // Add player to scene
    this.renderer.getScene().add(this.playerDot);

    // Create a point light attached to player for better visibility
    const pointLight = new THREE.PointLight(0xffffff, 1, 10);
    pointLight.position.set(0, 0, 2);
    this.playerDot.add(pointLight);

    // Initialize WebSocket connection for multiplayer
    const room = new WebsimSocket();
    
    // Update dot color based on player data
    room.party.subscribe((peers) => {
      const currentUser = room.party.client;
      if (currentUser && currentUser.username) {
        // Create unique color from username
        const hash = this.hashString(currentUser.username);
        const hue = hash % 360;
        this.playerDot.material.color.setHSL(hue/360, 1, 0.5);
        this.playerDot.material.emissive.setHSL(hue/360, 1, 0.3);
      }
    });

    // Focus camera on player after a short delay to ensure everything is loaded
    setTimeout(() => {
      this.renderer.focusOnPlayer(this.playerDot);
    }, 100);
  }

  // Simple hash function for consistent colors
  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }
}