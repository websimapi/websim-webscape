import { toggleMenu } from './menuManager.js';
import { clearPublicChat } from '../chat.js';
import { globalChatHistory } from '../chat.js';

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
  const currentUrl = document.querySelector('#game-screen iframe').src;
  const world = worlds.find(w => w.url === currentUrl);
  return world ? world.name : 'World-1'; // Default to World-1 if not found
}

// Update friend list world status colors
function updateFriendWorldColors() {
  const currentWorld = getCurrentWorld();
  const friendEntries = document.querySelectorAll('.friends-list .list-entry');
  
  friendEntries.forEach(entry => {
    const statusElement = entry.querySelector('.world-status');
    if (!statusElement.classList.contains('offline')) {
      if (statusElement.textContent === currentWorld) {
        statusElement.style.color = '#00ff00'; // Green for same world
      } else {
        statusElement.style.color = '#ffff00'; // Yellow for different world
      }
    }
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
      const worldName = worldEntry.dataset.world;
      const gameFrame = document.querySelector('#game-screen iframe');
      if (gameFrame && url !== gameFrame.src) {
        // Clear public chat messages before switching worlds
        clearPublicChat();
        
        gameFrame.src = url;
        
        // Broadcast world change to other users
        room.send({
          type: 'world-change',
          world: worldName,
          username: room.party.client.username
        });

        // Update our own messages in global chat history
        globalChatHistory.forEach(msg => {
          if (msg.username === room.party.client.username) {
            msg.world = worldName;
          }
        });

        // If in global chat mode, re-render to show updated world indicators
        if (chatMode === 'global') {
          renderChatHistory();
        }
        
        // Update friend list world colors
        updateFriendWorldColors();
        
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

  // Send initial world info when connecting
  room.party.subscribe(() => {
    room.send({
      type: 'world-change',
      world: getCurrentWorld(),
      username: room.party.client.username
    });
  });

  // Update friend list colors when receiving world change events
  room.onmessage = (event) => {
    if (event.data.type === 'world-change') {
      // First update the world name in friends list for the user who changed worlds
      const friendEntries = document.querySelectorAll('.friends-list .list-entry');
      friendEntries.forEach(entry => {
        const username = entry.querySelector('.player-name').textContent;
        const statusElement = entry.querySelector('.world-status');
        if (username === event.data.username) {
          if (statusElement && !statusElement.classList.contains('offline')) {
            statusElement.textContent = event.data.world;
          }
        }
      });
      
      // Then update all friend list colors based on new world information
      updateFriendWorldColors();
    }
  };
}

export { initializeWorlds, getCurrentWorld };