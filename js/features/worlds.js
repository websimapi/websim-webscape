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
    id: 2, 
    name: "World-3",
    url: "https://world-3--api.on.websim.ai/?pin_sidebar=false",
    location: "Test world three"
  }
];

function getCurrentWorld() {
  const gameFrame = document.querySelector('#game-screen iframe');
  if (gameFrame && gameFrame.src) {
    const currentUrl = gameFrame.src;
    const world = worlds.find(w => w.url === currentUrl);
    return world ? world.name : 'World-1'; // Default to World-1 if not found
  }
  return 'World-1'; // Default if iframe or src is not available
}

function clearPublicChat() {
  const chatContent = document.querySelector('.chat-content');
  // Remove only public chat messages, keeping private messages and system messages
  const publicMessages = chatContent.querySelectorAll('.chat-message.user:not(.private-message)');
  publicMessages.forEach(msg => msg.remove());
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
          <div class="world-entry" data-url="${world.url}" data-world="${world.name}">
            <div class="world-name">${world.name}</div>
            <div class="world-info">
              <span class="world-location">${world.location}</span>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  const minimapSection = document.getElementById('minimap-section');
  minimapSection.insertAdjacentElement('afterend', worldsMenu);

  worldsButton.addEventListener('click', () => {
    toggleMenu(worldsButton, '#worlds-menu');
  });

  const worldsList = worldsMenu.querySelector('.worlds-list');
  worldsList.addEventListener('click', (e) => {
    const worldEntry = e.target.closest('.world-entry');
    if (worldEntry) {
      const url = worldEntry.dataset.url;
      const worldName = worldEntry.dataset.world;
      const gameFrame = document.querySelector('#game-screen iframe');
      if (gameFrame && url !== gameFrame.src) {
        clearPublicChat();
        gameFrame.src = url;
        
        room.updatePresence({
          world: worldName
        });
        
        room.send({
          type: 'world-change',
          world: worldName,
          // username and clientId are automatically added by websim
        });
        
        document.querySelectorAll('.world-entry').forEach(entry => {
          entry.classList.remove('selected');
        });
        worldEntry.classList.add('selected');

        worldsMenu.classList.add('hidden');
        worldsButton.classList.remove('selected');

        // Trigger an update of friend list statuses
        if (window.updateIgnoredUsers) window.updateIgnoredUsers(); // This will also call updateOnlineStatus
      }
    }
  });

  // Highlight current world on load
  const gameFrame = document.querySelector('#game-screen iframe');
  if (gameFrame) {
      const currentUrl = gameFrame.src;
      const currentWorldEntry = worldsMenu.querySelector(`.world-entry[data-url="${currentUrl}"]`);
      if (currentWorldEntry) {
        currentWorldEntry.classList.add('selected');
      } else { // If current URL not in list, select first one as default
          const firstWorldEntry = worldsMenu.querySelector('.world-entry');
          if (firstWorldEntry) firstWorldEntry.classList.add('selected');
      }
  }


  // Send initial world info after room initialization
  room.initialize().then(() => {
    const initialWorld = getCurrentWorld();
    // Ensure presence is updated if it's not already set
    if (!room.presence[room.clientId]?.world || room.presence[room.clientId].world !== initialWorld) {
        room.updatePresence({ world: initialWorld });
    }
    // Send world change event
    // username and clientId are automatically added by websim
    room.send({
        type: 'world-change',
        world: initialWorld,
    });
  });
}

export { initializeWorlds, getCurrentWorld };