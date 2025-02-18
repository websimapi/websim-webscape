import { GameRenderer } from './GameRenderer.js';
import { MapManager } from './MapManager.js';

export class Game {
  constructor() {
    // Get game container
    this.container = document.getElementById('game-screen');
    
    // Initialize renderer (GameRenderer instance)
    this.renderer = new GameRenderer(this.container);
    
    // Initialize map manager with the scene from our renderer
    this.mapManager = new MapManager(this.renderer.getScene());
    
    // Initialize the player's dot on the terrain
    this.initializePlayer();
    
    // Setup click-to-move functionality on the terrain
    this.setupMovementListeners();

    // Handle window resizing
    window.addEventListener('resize', () => {
      this.renderer.onResize();
    });
  }

  initializePlayer() {
    // Create a small sphere representing the player's character
    const geometry = new THREE.SphereGeometry(0.5, 32, 32);
    const material = new THREE.MeshStandardMaterial({ 
      color: 0xff0000,
      emissive: 0xff0000,
      emissiveIntensity: 0.3,
    });
    this.playerDot = new THREE.Mesh(geometry, material);

    // Place the player at a specific tile near the center for consistency (tile 32,32)
    const tileX = 32;
    const tileY = 32;
    const terrainChunk = this.mapManager.getChunkAt(0, 0);
    const height = terrainChunk ? terrainChunk.getHeight(tileX, tileY) : 0;
    const offset = 0.5; // Position the dot just above the terrain

    this.playerDot.position.set(tileX + 0.5, height + offset, tileY + 0.5);

    // Add the player dot to the scene
    this.renderer.getScene().add(this.playerDot);

    // Create a point light attached to the player's dot for visibility
    const pointLight = new THREE.PointLight(0xffffff, 1, 10);
    pointLight.position.set(0, 0, 2);
    this.playerDot.add(pointLight);

    // Initialize WebSocket connection for multiplayer updates
    const room = new WebsimSocket();
    
    // Update the dot's color based on the user's unique username
    room.party.subscribe((peers) => {
      const currentUser = room.party.client;
      if (currentUser && currentUser.username) {
        const hash = this.hashString(currentUser.username);
        const hue = hash % 360;
        this.playerDot.material.color.setHSL(hue / 360, 1, 0.5);
        this.playerDot.material.emissive.setHSL(hue / 360, 1, 0.3);
      }
    });

    // Focus the camera on the player after a short delay to ensure proper render setup
    setTimeout(() => {
      this.renderer.focusOnPlayer(this.playerDot);
    }, 100);
  }

  // Simple hash function to generate a number from a string (used for color generation)
  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  setupMovementListeners() {
    // IMPORTANT: Use the actual THREE.WebGLRenderer's DOM element.
    // In our GameRenderer, the WebGLRenderer instance is stored as this.renderer.renderer.
    const canvas = this.renderer.renderer.domElement;
    canvas.addEventListener('click', (event) => {
      const rect = canvas.getBoundingClientRect();
      const mouse = new THREE.Vector2();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      
      const raycaster = new THREE.Raycaster();
      const camera = this.renderer.camera;
      raycaster.setFromCamera(mouse, camera);
      
      // Retrieve the terrain mesh by name ("terrain")
      const terrain = this.renderer.getScene().getObjectByName("terrain");
      if (!terrain) return;
      
      const intersects = raycaster.intersectObject(terrain, true);
      if (intersects.length > 0) {
        const point = intersects[0].point;
        // Snap the clicked position to a grid tile by flooring x and z coordinates
        const gridX = Math.floor(point.x);
        const gridZ = Math.floor(point.z);
        const newHeight = this.mapManager.getHeightAt(gridX, gridZ);
        const offset = 0.5;
        // Update the player's dot position so it sits just above the terrain grid
        this.playerDot.position.set(gridX + 0.5, newHeight + offset, gridZ + 0.5);
        // Re-focus the camera on the updated player dot position
        this.renderer.focusOnPlayer(this.playerDot);
      }
    });
  }
}