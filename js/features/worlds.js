import { toggleMenu } from './menuManager.js';

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
  // Use the connected worlds button (with class "worlds")
  const worldsButton = document.querySelector('.bottom-icon.worlds');
  const worldsMenu = document.createElement('div');
  worldsMenu.id = 'worlds-menu';
  worldsMenu.className = 'hidden';
  worldsMenu.innerHTML = `
    <div class="worlds-content">
      <div class="worlds-header">
        <h3 class="title">World Selector</h3>
      </div>
      <div class="worlds-list">
        ${worlds.map(world => `
          <div class="world-entry" data-url="${world.url}">
            <span class="world-name">${world.name}</span>
            <span class="world-location">${world.location}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;
  
  // Insert the worlds menu into the right panel, before the bottom icons.
  const rightPanel = document.getElementById('right-panel');
  const bottomIcons = document.getElementById('bottom-icons');
  rightPanel.insertBefore(worldsMenu, bottomIcons);

  // Setup menu toggle using the shared toggleMenu function.
  worldsButton.addEventListener('click', () => {
    toggleMenu(worldsButton, '#worlds-menu');
  });

  // Handle world switching.
  const worldsList = worldsMenu.querySelector('.worlds-list');
  worldsList.addEventListener('click', (e) => {
    const worldEntry = e.target.closest('.world-entry');
    if (worldEntry) {
      const url = worldEntry.dataset.url;
      const gameFrame = document.querySelector('#game-screen iframe');
      if (gameFrame && url !== gameFrame.src) {
        gameFrame.src = url;
        
        // Update selection visuals.
        worldsList.querySelectorAll('.world-entry').forEach(entry => {
          entry.classList.remove('selected');
        });
        worldEntry.classList.add('selected');

        // Hide menu after selection.
        worldsMenu.classList.add('hidden');
        worldsButton.classList.remove('selected');
      }
    }
  });

  // Highlight current world
  const gameFrame = document.querySelector('#game-screen iframe');
  const currentUrl = gameFrame ? gameFrame.src : "";
  const currentWorld = worldsMenu.querySelector(`[data-url="${currentUrl}"]`);
  if (currentWorld) {
    currentWorld.classList.add('selected');
  }
}

export { initializeWorlds };