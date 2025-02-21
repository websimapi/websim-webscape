import { toggleMenu } from './menuManager.js';

const worlds = [
  {
    id: 1,
    name: "World-1",
    url: "https://world-1--api.on.websim.ai/?pin_sidebar=false",
    status: "online"
  },
  {
    id: 2,
    name: "World-2",
    url: "https://world-2--api.on.websim.ai/?pin_sidebar=false",
    status: "online"
  }
];

function initializeWorldSelector() {
  const worldButton = document.querySelector('.bottom-icon.worlds');
  const worldSelector = document.getElementById('world-selector');

  worldButton.addEventListener('click', () => {
    toggleMenu(worldButton, '#world-selector');
  });

  // Get the current world from local storage or default to World-1
  const currentWorld = localStorage.getItem('selectedWorld') || worlds[0].url;
  
  // Create world list
  const worldListContainer = worldSelector.querySelector('.world-list');
  worlds.forEach(world => {
    const worldEntry = document.createElement('div');
    worldEntry.className = 'world-entry';
    worldEntry.innerHTML = `
      <span class="world-name">${world.name}</span>
      <span class="world-status">${world.status}</span>
    `;

    // Highlight current world
    if (world.url === currentWorld) {
      worldEntry.classList.add('selected');
    }

    // Add click handler to switch worlds
    worldEntry.addEventListener('click', () => {
      const gameFrame = document.querySelector('#game-screen iframe');
      if (gameFrame) {
        gameFrame.src = world.url;
        localStorage.setItem('selectedWorld', world.url);
        
        // Update selection styling
        worldListContainer.querySelectorAll('.world-entry').forEach(entry => {
          entry.classList.remove('selected');
        });
        worldEntry.classList.add('selected');
      }
    });

    worldListContainer.appendChild(worldEntry);
  });
}

export { initializeWorldSelector };