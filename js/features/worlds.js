import { toggleMenu } from './menuManager.js';
import { createDebugger } from '../debug.js';

// Initialize debugger for worlds feature
const debug = createDebugger('worlds');

// Enable debugging for worlds feature 
enableDebug('worlds');

const worlds = [
  {
    id: 1,
    name: "World-1",
    url: "https://world-1--api.on.websim.ai/?pin_sidebar=false",
    location: "Test world one"
  },
  {
    id: 2, 
    name: "World-3",
    url: "https://world-3--api.on.websim.ai/?pin_sidebar=false",
    location: "Test world two"
  }
];

function initializeWorlds() {
  debug.enter('initializeWorlds');

  const worldsButton = document.querySelector('.bottom-icon:first-child');
  const worldsMenu = document.createElement('div');
  worldsMenu.id = 'worlds-menu';
  worldsMenu.className = 'hidden';
  worldsMenu.innerHTML = `
    <div class="worlds-content">
      <div class="worlds-header">
        <h3 class="title">World Selector</h3>
        <p class="subtitle">Click world to switch</p>
      </div>
      <div class="worlds-list">
        ${worlds.map(world => `
          <div class="world-entry" data-url="${world.url}">
            <div class="world-name">${world.name}</div>
            <div class="world-info">
              <span class="world-location">${world.location}</span>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  // Add worlds menu to the right panel after minimap section
  const minimapSection = document.getElementById('minimap-section');
  minimapSection.insertAdjacentElement('afterend', worldsMenu);

  debug.info('World selector menu created and inserted into DOM');

  // Setup menu toggle
  worldsButton.addEventListener('click', () => {
    debug.event('worldsButton clicked');
    toggleMenu(worldsButton, '#worlds-menu');
  });

  // Handle world switching
  const worldsList = worldsMenu.querySelector('.worlds-list');
  worldsList.addEventListener('click', (e) => {
    const worldEntry = e.target.closest('.world-entry');
    if (worldEntry) {
      const url = worldEntry.dataset.url;
      const gameFrame = document.querySelector('#game-screen iframe');
      
      debug.info('World switch requested', {
        from: gameFrame.src,
        to: url,
        worldEntry: worldEntry.textContent.trim()
      });

      if (gameFrame && url !== gameFrame.src) {
        debug.event('Switching world', {
          fromUrl: gameFrame.src,
          toUrl: url
        });

        gameFrame.src = url;
        
        // Update selection visuals
        document.querySelectorAll('.world-entry').forEach(entry => {
          entry.classList.remove('selected');
        });
        worldEntry.classList.add('selected');

        // Hide menu after selection
        worldsMenu.classList.add('hidden');
        worldsButton.classList.remove('selected');

        debug.info('World switch completed');
      } else {
        debug.info('World switch skipped - already on selected world');
      }
    }
  });

  // Highlight current world
  const currentUrl = document.querySelector('#game-screen iframe').src;
  const currentWorld = worldsMenu.querySelector(`[data-url="${currentUrl}"]`);
  if (currentWorld) {
    currentWorld.classList.add('selected');
    debug.info('Current world highlighted', {
      url: currentUrl,
      world: currentWorld.textContent.trim()
    });
  }

  debug.exit('initializeWorlds');
}

export { initializeWorlds };