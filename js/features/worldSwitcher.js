import { toggleMenu } from './menuManager.js';

// Initialize WebSocket connection for world switching
const room = new WebsimSocket();

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

function getCurrentWorld() {
  const iframe = document.querySelector('#game-screen iframe');
  const currentUrl = iframe.src;
  return worlds.find(world => currentUrl.includes(`world-${world.id}`)) || worlds[0];
}

function switchWorld(world) {
  const iframe = document.querySelector('#game-screen iframe');
  if (iframe) {
    iframe.src = world.url;
    saveCurrentWorld(world.id);
    updateWorldList();
  }
}

function saveCurrentWorld(worldId) {
  localStorage.setItem('selectedWorld', worldId);
}

function loadSavedWorld() {
  const savedWorldId = localStorage.getItem('selectedWorld');
  if (savedWorldId) {
    const world = worlds.find(w => w.id === parseInt(savedWorldId));
    if (world) {
      switchWorld(world);
    }
  }
}

function initializeWorldSwitcher() {
  const worldButton = document.querySelector('.bottom-icon.worlds');
  const worldSwitcher = document.getElementById('world-switcher');

  // Setup world switcher toggle
  worldButton.addEventListener('click', () => {
    toggleMenu(worldButton, '#world-switcher');
  });

  // Create world list UI
  const worldList = document.createElement('div');
  worldList.className = 'world-list';
  worldSwitcher.innerHTML = ''; // Clear existing content
  worldSwitcher.appendChild(worldList);

  function updateWorldList() {
    const currentWorld = getCurrentWorld();
    worldList.innerHTML = '';

    worlds.forEach(world => {
      const worldEntry = document.createElement('div');
      worldEntry.className = 'world-entry';
      if (world.id === currentWorld.id) {
        worldEntry.classList.add('selected');
      }
      if (world.status === 'online') {
        worldEntry.classList.add('available');
      }

      worldEntry.innerHTML = `
        <span class="world-name">${world.name}</span>
        <span class="world-players">Players: ${Math.floor(Math.random() * 100)}</span>
      `;

      worldEntry.addEventListener('click', () => {
        if (world.status === 'online') {
          switchWorld(world);
        }
      });

      worldList.appendChild(worldEntry);
    });
  }

  // Initial update of world list
  updateWorldList();

  // Update world list periodically
  setInterval(updateWorldList, 30000);

  // Load saved world preference
  loadSavedWorld();
}

export { initializeWorldSwitcher };