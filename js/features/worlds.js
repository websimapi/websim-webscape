import { toggleMenu } from './menuManager.js';

const worlds = [
  {
    id: 1,
    name: "World-1",
    url: "https://world-1--api.on.websim.ai/?pin_sidebar=false",
    location: "US East"
  },
  {
    id: 2, 
    name: "World-2",
    url: "https://world-2--api.on.websim.ai/?pin_sidebar=false",
    location: "US West"
  }
];

function initializeWorlds() {
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

  // Setup menu toggle
  worldsButton.addEventListener('click', () => {
    toggleMenu(worldsButton, '#worlds-menu');
  });

  // Handle world switching
  const worldsList = worldsMenu.querySelector('.worlds-list');
  worldsList.addEventListener('click', (e) => {
    const worldEntry = e.target.closest('.world-entry');
    if (worldEntry) {
      const url = worldEntry.dataset.url;
      const gameFrame = document.querySelector('#game-screen iframe');
      if (gameFrame && url !== gameFrame.src) {
        gameFrame.src = url;
        
        // Update selection visuals
        document.querySelectorAll('.world-entry').forEach(entry => {
          entry.classList.remove('selected');
        });
        worldEntry.classList.add('selected');

        // Hide menu after selection
        worldsMenu.classList.add('hidden');
        worldsButton.classList.remove('selected');
      }
    }
  });

  // Highlight current world
  const currentUrl = document.querySelector('#game-screen iframe').src;
  const currentWorld = worldsMenu.querySelector(`[data-url="${currentUrl}"]`);
  if (currentWorld) {
    currentWorld.classList.add('selected');
  }
}

export { initializeWorlds };