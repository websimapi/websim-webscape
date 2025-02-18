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
    
    // Handle window resizing
    window.addEventListener('resize', () => {
      this.renderer.onResize();
    });
  }
}