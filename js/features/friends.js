import { addTooltip, tooltip } from '../ui/tooltips.js';
import { showContextMenu, hideContextMenu } from '../ui/contextMenu.js';
import { setupOverlay } from '../ui/overlays.js';
import { toggleMenu } from './menuManager.js';

// Initialize WebSocket connection
const room = new WebsimSocket();

// Track world selection states
let selectedWorld = null;

// Get current user's selected world
function getCurrentWorld() {
  const iframe = document.querySelector('#game-screen iframe');
  return iframe ? iframe.src : null;
}

// Listen for world changes
function listenForWorldChanges() {
  const worldEntries = document.querySelectorAll('.world-entry');
  worldEntries.forEach(entry => {
    entry.addEventListener('click', () => {
      const url = entry.dataset.url;
      selectedWorld = url;
      // Broadcast world change to all peers
      room.send({
        type: 'world_change',
        world: url
      });
    });
  });
}

// Track users' worlds
const userWorlds = new Map();

function initializeFriendsList() {
  const friendsButton = document.querySelector('.bottom-icon:nth-child(2)');
  const friendsList = document.querySelector('.friends-list');
  const addFriendButton = document.querySelector('.friends-list .list-button:first-child');
  const delFriendButton = document.querySelector('.friends-list .list-button:nth-child(2)');
  const addFriendOverlay = document.getElementById('add-friend-overlay');
  const delFriendOverlay = document.getElementById('del-friend-overlay');
  const addFriendInput = addFriendOverlay.querySelector('.add-friend-input');
  const delFriendInput = delFriendOverlay.querySelector('.del-friend-input');
  const friendsListContainer = document.querySelector('.friends-list .list-container');

  // Set initial world and broadcast it
  selectedWorld = getCurrentWorld();
  if (selectedWorld) {
    room.send({
      type: 'world_change',
      world: selectedWorld
    });
  }

  // Setup tooltips
  addTooltip(addFriendButton, 'Add friend');
  addTooltip(delFriendButton, 'Delete friend');

  // Setup friends list toggle with menu management
  friendsButton.addEventListener('click', () => {
    toggleMenu(friendsButton, '.friends-list');
  });

  // Setup overlays
  setupOverlay(addFriendOverlay, addFriendInput);
  setupOverlay(delFriendOverlay, delFriendInput);

  // --- Local Storage Persistence Functions ---
  function saveFriendsList() {
    const friendEntries = friendsListContainer.querySelectorAll('.list-entry');
    const friendsData = Array.from(friendEntries).map(entry => {
      return { name: entry.querySelector('.player-name').textContent };
    });
    localStorage.setItem('friendsList', JSON.stringify(friendsData));
  }

  function loadFriendsList() {
    const stored = localStorage.getItem('friendsList');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (err) {
        return [];
      }
    }
    return [];
  }

  // Function to update friend's world status
  function updateFriendWorldStatus(username, world) {
    const friendEntries = friendsListContainer.querySelectorAll('.list-entry');
    friendEntries.forEach(entry => {
      const playerName = entry.querySelector('.player-name').textContent;
      if (playerName === username) {
        const statusElement = entry.querySelector('.world-status');
        if (world) {
          statusElement.textContent = world.includes('world-1') ? 'World-1' : 'World-3';
          statusElement.classList.remove('offline');
        } else {
          statusElement.textContent = 'Offline';
          statusElement.classList.add('offline');
        }
      }
    });
  }

  // Handle user world changes
  room.onmessage = (event) => {
    if (event.data.type === 'world_change') {
      const { clientId, username, world } = event.data;
      userWorlds.set(username, world);
      updateFriendWorldStatus(username, world);
    }
  };

  // Subscribe to peer updates
  room.party.subscribe((peers) => {
    // Handle disconnections
    for (const username of userWorlds.keys()) {
      if (!Object.values(peers).find(peer => peer.username === username)) {
        userWorlds.delete(username);
        updateFriendWorldStatus(username, null);
      }
    }

    // Request world status from new peers
    for (const clientId in peers) {
      const username = peers[clientId].username;
      if (!userWorlds.has(username) && username !== room.party.client.username) {
        room.send({
          type: 'request_world',
          targetUsername: username
        });
      }
    }
  });

  // Populate friends list from local storage on initialization
  const storedFriends = loadFriendsList();
  storedFriends.forEach(friend => {
    const newFriend = document.createElement('div');
    newFriend.className = 'list-entry';
    newFriend.innerHTML = `
      <span class="player-name">${friend.name}</span>
      <span class="world-status offline">Offline</span>
    `;
    friendsListContainer.appendChild(newFriend);
  });

  // Add Friend button click handler
  addFriendButton.addEventListener('click', () => {
    addFriendOverlay.classList.add('shown');
    addFriendInput.value = '';
    addFriendInput.focus();
  });

  // Del Friend button click handler
  delFriendButton.addEventListener('click', () => {
    delFriendOverlay.classList.add('shown');
    delFriendInput.value = '';
    delFriendInput.focus();
  });

  // Handle overlay submissions
  document.addEventListener('overlay-submit', (e) => {
    const { name, overlay } = e.detail;
    
    if (overlay === addFriendOverlay) {
      const newFriend = document.createElement('div');
      newFriend.className = 'list-entry';
      newFriend.innerHTML = `
        <span class="player-name">${name}</span>
        <span class="world-status offline">Offline</span>
      `;
      friendsListContainer.appendChild(newFriend);
      saveFriendsList();
      
      // Request world status for newly added friend
      if (userWorlds.has(name)) {
        updateFriendWorldStatus(name, userWorlds.get(name));
      }
    } else if (overlay === delFriendOverlay) {
      const friendEntries = friendsListContainer.querySelectorAll('.list-entry');
      friendEntries.forEach(entry => {
        const playerName = entry.querySelector('.player-name').textContent;
        if (playerName === name) {
          entry.remove();
        }
      });
      saveFriendsList();
    }
  });

  // Setup friend list hover effects
  friendsListContainer.addEventListener('mouseover', (e) => {
    const playerNameElement = e.target.closest('.player-name');
    if (playerNameElement) {
      const username = playerNameElement.textContent;
      tooltip.style.display = 'block';
      tooltip.textContent = `Message ${username} / 1 more option`;
      
      const gameScreen = document.getElementById('game-screen');
      const gameRect = gameScreen.getBoundingClientRect();
      tooltip.style.left = `${gameRect.left + 5}px`;
      tooltip.style.top = `${gameRect.top + 5}px`;
    }
  });

  friendsListContainer.addEventListener('mouseout', (e) => {
    if (e.target.closest('.player-name')) {
      tooltip.style.display = 'none';
    }
  });

  // Handle friend list clicks and context menu
  friendsListContainer.addEventListener('click', (e) => {
    const playerNameElement = e.target.closest('.player-name');
    if (playerNameElement) {
      const username = playerNameElement.textContent;
      showContextMenu(e, username, 
        () => {
          if (typeof showMessageOverlay === 'function') {
            showMessageOverlay(username);
          } else {
            console.warn('Messaging function is not available.');
          }
        },
        () => {
          playerNameElement.closest('.list-entry').remove();
          saveFriendsList();
        }
      );
    }
  });

  // Start listening for world changes
  listenForWorldChanges();

  // Handle response to world status requests
  room.onmessage = (event) => {
    switch (event.data.type) {
      case 'world_change':
        const { username, world } = event.data;
        userWorlds.set(username, world);
        updateFriendWorldStatus(username, world);
        break;
      case 'request_world':
        if (event.data.targetUsername === room.party.client.username) {
          room.send({
            type: 'world_change',
            world: selectedWorld
          });
        }
        break;
    }
  };
}

export { initializeFriendsList };