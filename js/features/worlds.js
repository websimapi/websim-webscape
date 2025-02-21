import { toggleMenu } from './menuManager.js';
import { DebugLogger, DOMDebug } from '../debug.js';

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
  DebugLogger.info('INIT', 'Starting worlds menu initialization');

  // Check for worlds button
  const worldsButton = DOMDebug.checkElement('.bottom-icon:first-child', 'Worlds Button');
  if (!worldsButton) {
    DebugLogger.error('INIT', 'Could not find worlds button');
    return;
  }

  // Create worlds menu
  const worldsMenu = document.createElement('div');
  worldsMenu.id = 'worlds-menu';
  worldsMenu.className = 'hidden';
  
  // Log worlds data being used
  DebugLogger.debug('INIT', 'Creating worlds menu with data:', { worlds });

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

  // Check for minimap section
  const minimapSection = DOMDebug.checkElement('#minimap-section', 'Minimap Section');
  if (!minimapSection) {
    DebugLogger.error('INIT', 'Could not find minimap section');
    return;
  }

  // Add worlds menu after minimap
  minimapSection.insertAdjacentElement('afterend', worldsMenu);
  DebugLogger.debug('DOM', 'Worlds menu added to DOM');

  // Setup menu toggle with debug logging
  worldsButton.addEventListener('click', () => {
    DebugLogger.debug('EVENTS', 'Worlds button clicked');
    toggleMenu(worldsButton, '#worlds-menu');
    
    // Check menu state after toggle
    DOMDebug.checkMenuState('#worlds-menu', 'After Toggle');
  });

  // Add event logging to world switching
  const worldsList = worldsMenu.querySelector('.worlds-list');
  worldsList.addEventListener('click', (e) => {
    const worldEntry = e.target.closest('.world-entry');
    if (worldEntry) {
      const url = worldEntry.dataset.url;
      DebugLogger.info('EVENTS', 'World switch attempted', { 
        targetUrl: url,
        targetWorld: worlds.find(w => w.url === url)?.name
      });

      const gameFrame = document.querySelector('#game-screen iframe');
      if (gameFrame) {
        if (url !== gameFrame.src) {
          DebugLogger.debug('EVENTS', 'Switching world frame source', {
            from: gameFrame.src,
            to: url
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
          
          DebugLogger.info('EVENTS', 'World switch completed');
        } else {
          DebugLogger.debug('EVENTS', 'World switch cancelled - already on selected world');
        }
      } else {
        DebugLogger.error('EVENTS', 'Game frame not found for world switch');
      }
    }
  });

  // Highlight current world on initialization
  const currentUrl = document.querySelector('#game-screen iframe')?.src;
  if (currentUrl) {
    const currentWorld = worldsMenu.querySelector(`[data-url="${currentUrl}"]`);
    if (currentWorld) {
      currentWorld.classList.add('selected');
      DebugLogger.debug('INIT', 'Current world highlighted', { currentUrl });
    } else {
      DebugLogger.warn('INIT', 'Could not find matching world entry for current URL', { currentUrl });
    }
  } else {
    DebugLogger.warn('INIT', 'Could not determine current world URL');
  }

  DebugLogger.info('INIT', 'Worlds menu initialization completed');
}

export { initializeWorlds };