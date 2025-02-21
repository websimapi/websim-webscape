import { toggleMenu } from './menuManager.js';
import { clearPublicChat } from '../chat.js';

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
        
        // Update friend list world colors immediately
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
    // Store initial world for current user
    const initialWorld = getCurrentWorld();
    const userWorlds = new Map();
    userWorlds.set(room.party.client.username, initialWorld);
    
    room.send({
      type: 'world-change',
      world: initialWorld,
      username: room.party.client.username
    });
  });

  // Update friend list colors and handle private messages when receiving world change events
  room.onmessage = (event) => {
    const data = event.data;
    
    if (data.type === 'world-change') {
      // First update the world name in friends list for the user who changed worlds
      const friendEntries = document.querySelectorAll('.friends-list .list-entry');
      friendEntries.forEach(entry => {
        const username = entry.querySelector('.player-name').textContent;
        const statusElement = entry.querySelector('.world-status');
        if (username === data.username) {
          if (statusElement && !statusElement.classList.contains('offline')) {
            statusElement.textContent = data.world;
          }
        }
      });
      
      // Then update all friend list colors based on new world information
      updateFriendWorldColors();
      
    } else if (data.type === 'private-message') {
      // Handle private messages separately to avoid interference with world changes
      handlePrivateMessage(data);
    }
  };
}

// Add handlePrivateMessage function to process private messages
function handlePrivateMessage(data) {
  // Create private message element
  const msgDiv = document.createElement('div');
  msgDiv.className = 'chat-message private-message';
  msgDiv.setAttribute('data-timestamp', Date.now());

  // Format message based on whether it's incoming or outgoing
  if (data.recipient === room.party.client.username) {
    msgDiv.innerHTML = `From ${data.username}: ${data.message}`;
  } else {
    msgDiv.innerHTML = `To ${data.recipient}: ${data.message}`;
  }

  // Insert into appropriate container based on split chat setting
  const splitPrivate = localStorage.getItem('splitPrivateChat') === 'true';
  const splitContainer = document.getElementById('split-private-chat');
  const chatContent = document.querySelector('.chat-content');

  if (splitPrivate && splitContainer) {
    splitContainer.appendChild(msgDiv.cloneNode(true));
    // Keep only last 5 messages in split view
    while (splitContainer.childElementCount > 5) {
      splitContainer.removeChild(splitContainer.firstElementChild);
    }
  } else {
    // Insert into main chat maintaining timestamp order
    let inserted = false;
    const messages = chatContent.children;
    for (let i = 0; i < messages.length; i++) {
      const timestamp = parseFloat(messages[i].getAttribute('data-timestamp') || '0');
      if (timestamp <= parseFloat(msgDiv.getAttribute('data-timestamp'))) {
        chatContent.insertBefore(msgDiv, messages[i]);
        inserted = true;
        break;
      }
    }
    if (!inserted) {
      chatContent.appendChild(msgDiv);
    }
  }
}

export { initializeWorlds, getCurrentWorld };