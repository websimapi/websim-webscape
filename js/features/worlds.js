import { toggleMenu } from './menuManager.js';

const worlds = [
  {
    id: 1,
    name: "World-1",
    url: "https://world-1--api.on.websim.ai/?pin_sidebar=false",
    population: "Loading...",
    location: "US East"
  },
  {
    id: 2, 
    name: "World-2",
    url: "https://world-2--api.on.websim.ai/?pin_sidebar=false",
    population: "Loading...",
    location: "US West"
  }
];

// Updated to fix menu visibility handling
function initializeWorlds() {
  const worldsButton = document.querySelector('.bottom-icon:first-child');
  const worldsMenu = document.getElementById('worlds-menu');
  
  // Setup menu toggle
  worldsButton.addEventListener('click', () => {
    toggleMenu(worldsButton, '#worlds-menu');
  });

  // Populate world list
  const worldsList = worldsMenu.querySelector('.worlds-list');
  worldsList.innerHTML = worlds.map(world => `
    <div class="world-entry" data-url="${world.url}">
      <div class="world-name">${world.name}</div>
      <div class="world-info">
        <span class="world-population">${world.population}</span>
        <span class="world-location">${world.location}</span>
      </div>
    </div>
  `).join('');

  // Handle world switching
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

  // Highlight current world on initialization
  const currentUrl = document.querySelector('#game-screen iframe').src;
  const currentWorld = worldsList.querySelector(`[data-url="${currentUrl}"]`);
  if (currentWorld) {
    currentWorld.classList.add('selected');
  }
}

export { initializeWorlds };