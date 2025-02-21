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
  const worldsButton = document.querySelector('.bottom-icon:first-child');
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
            <div class="world-name">${world.name}</div>
            <div class="world-location">${world.location}</div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
  
  const rightPanel = document.getElementById('right-panel');
  const bottomIcons = document.getElementById('bottom-icons');
  rightPanel.insertBefore(worldsMenu, bottomIcons);

  worldsButton.addEventListener('click', () => {
    toggleMenu(worldsButton, '#worlds-menu');
  });

  const worldsList = worldsMenu.querySelector('.worlds-list');
  worldsList.addEventListener('click', (e) => {
    const target = e.target instanceof Element ? e.target : null;
    const worldEntry = target ? target.closest('.world-entry') : null;
    if (worldEntry) {
      const url = worldEntry.dataset.url;
      const gameFrame = document.querySelector('#game-screen iframe');
      if (gameFrame && url !== gameFrame.src) {
        gameFrame.src = url;
        
        document.querySelectorAll('.world-entry').forEach(entry => {
          entry.classList.remove('selected');
        });
        worldEntry.classList.add('selected');

        worldsMenu.classList.add('hidden');
        worldsButton.classList.remove('selected');
      }
    }
  });

  const gameFrame = document.querySelector('#game-screen iframe');
  if (gameFrame) {
    const currentUrl = gameFrame.src;
    const currentWorld = worldsMenu.querySelector(`[data-url="${currentUrl}"]`);
    if (currentWorld) {
      currentWorld.classList.add('selected');
    }
  }
}

export { initializeWorlds };