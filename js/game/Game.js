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

    // Flag to prevent overlapping moves
    this.moving = false;

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

    // Define an offset so the dot sits clearly above the terrain
    this.playerOffset = 0.7;

    // Place the player at a specific tile near the center for consistency (tile 32,32)
    const tileX = 32;
    const tileY = 32;
    const terrainChunk = this.mapManager.getChunkAt(0, 0);
    const height = terrainChunk ? terrainChunk.getHeight(tileX, tileY) : 0;
    // Center the dot on the grid square using tile center coordinates (tile + 0.5)
    this.playerDot.position.set(tileX + 0.5, height + this.playerOffset, tileY + 0.5);

    // Add the player dot to the scene
    this.renderer.getScene().add(this.playerDot);

    // Create a point light attached to the player's dot for visibility
    const pointLight = new THREE.PointLight(0xffffff, 1, 10);
    pointLight.position.set(0, 0, 2);
    this.playerDot.add(pointLight);

    // Initialize WebSocket connection for multiplayer updates
    const room = new WebsimSocket();

    // Update the dot's color based on the user's unique username
    room.party.subscribe(() => {
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
    // Access the Three.js renderer's DOM element
    const canvas = this.renderer.renderer.domElement;
    canvas.addEventListener('click', (event) => {
      // Prevent new moves if already moving
      if (this.moving) return;

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
        // Snap the clicked position to the grid by flooring the x and z coordinates
        const targetGridX = Math.floor(point.x);
        const targetGridZ = Math.floor(point.z);
        // If already in the same grid cell, do nothing
        const currentGridX = Math.floor(this.playerDot.position.x - 0.5);
        const currentGridZ = Math.floor(this.playerDot.position.z - 0.5);
        if (currentGridX === targetGridX && currentGridZ === targetGridZ) return;

        // Start smooth movement toward the target grid cell
        this.moving = true;
        this.animateMovement(targetGridX, targetGridZ);
      }
    });
  }

  animateMovement(targetX, targetZ) {
    // Determine current grid coordinates using the dot's centered position
    const currentX = Math.floor(this.playerDot.position.x - 0.5);
    const currentZ = Math.floor(this.playerDot.position.z - 0.5);

    // If the dot is already at the target grid cell, movement is complete
    if (currentX === targetX && currentZ === targetZ) {
      this.moving = false;
      this.renderer.focusOnPlayer(this.playerDot);
      return;
    }

    // Determine next grid step (move one cell horizontally first, then vertically)
    let nextX = currentX;
    let nextZ = currentZ;
    if (currentX !== targetX) {
      nextX = currentX + Math.sign(targetX - currentX);
    } else if (currentZ !== targetZ) {
      nextZ = currentZ + Math.sign(targetZ - currentZ);
    }

    // Calculate the centered destination for the next grid cell
    const targetPosX = nextX + 0.5;
    const targetPosZ = nextZ + 0.5;
    const terrainHeight = this.mapManager.getHeightAt(nextX, nextZ);
    const targetPosY = terrainHeight + this.playerOffset;

    const startPos = this.playerDot.position.clone();
    const endPos = new THREE.Vector3(targetPosX, targetPosY, targetPosZ);
    const duration = 300; // duration in milliseconds for one grid cell move
    const startTime = performance.now();

    const animateStep = () => {
      const now = performance.now();
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / duration);
      // Linearly interpolate between current and target positions
      this.playerDot.position.lerpVectors(startPos, endPos, t);
      if (t < 1) {
        requestAnimationFrame(animateStep);
      } else {
        // After completing the step, re-focus the camera and move to the next cell if needed
        this.renderer.focusOnPlayer(this.playerDot);
        this.animateMovement(targetX, targetZ);
      }
    };
    animateStep();
  }
}