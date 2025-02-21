import { toggleMenu } from './menuManager.js';

// Initialize WebSocket connection
const room = new WebsimSocket();

const worlds = [
  {
    id: 1,
    name: "World-1",
    url: "https://world-1--api.on.websim.ai/?pin_sidebar=false",
    location: "Test world one"
  },
  {
    id: 3, 
    name: "World-3",
    url: "https://world-3--api.on.websim.ai/?pin_sidebar=false",
    location: "Test world two"
  }
];

async function selectWorld(worldId) {
  await room.collection('world_selection').create({
    world_id: worldId
  });
}

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
          <div class="world-entry" data-url="${world.url}" data-world-id="${world.id}">
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
  worldsList.addEventListener('click', async (e) => {
    const worldEntry = e.target.closest('.world-entry');
    if (worldEntry) {
      const url = worldEntry.dataset.url;
      const worldId = parseInt(worldEntry.dataset.worldId);
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

        // Save world selection
        await selectWorld(worldId);

        // Notify friends list of world change
        window.dispatchEvent(new CustomEvent('message', {
          detail: {
            type: 'world-selected',
            worldId: worldId
          }
        }));
      }
    }
  });

  // Highlight current world based on URL
  const currentUrl = document.querySelector('#game-screen iframe').src;
  const currentWorld = worldsMenu.querySelector(`[data-url="${currentUrl}"]`);
  if (currentWorld) {
    currentWorld.classList.add('selected');
    // Set initial world selection
    const worldId = parseInt(currentWorld.dataset.worldId);
    selectWorld(worldId);
  }
}

export { initializeWorlds };