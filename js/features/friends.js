import { addTooltip, tooltip } from '../ui/tooltips.js';
import { showContextMenu, hideContextMenu } from '../ui/contextMenu.js';
import { setupOverlay } from '../ui/overlays.js';
import { toggleMenu } from './menuManager.js';

// Initialize WebSocket connection
const room = new WebsimSocket();

// Track user world selections
let userWorlds = new Map();

// Create a record in the collection to store user's world selection
async function selectWorld(worldId) {
  try {
    await room.collection('world_selection').create({
      world_id: worldId
    });
  } catch (err) {
    console.error('Error saving world selection:', err);
  }
}

// Query world selections from the collection
async function getWorldSelections() {
  try {
    const selections = await room.collection('world_selection').getList();
    if (!selections) return new Map();
    
    // Group by username, taking most recent selection for each user
    const latestSelections = new Map();
    for (const selection of selections) {
      if (selection && selection.username) {
        latestSelections.set(selection.username, selection.world_id);
      }
    }
    return latestSelections;
  } catch (err) {
    console.error('Error getting world selections:', err);
    return new Map();
  }
}

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

  // Subscribe to world selection changes
  room.collection('world_selection').subscribe(async (selections) => {
    userWorlds.clear();
    // Update userWorlds map with latest selections
    if (selections) {
      for (const selection of selections) {
        if (selection && selection.username) {
          userWorlds.set(selection.username, selection.world_id);
        }
      }
    }
    // Update friend status displays
    updateFriendStatuses();
  });

  // Function to update friend statuses based on world selections
  function updateFriendStatuses() {
    const friendEntries = friendsListContainer.querySelectorAll('.list-entry');
    const onlinePeers = new Set(Object.values(room.party.peers).map(p => p.username));
    
    friendEntries.forEach(entry => {
      const username = entry.querySelector('.player-name').textContent;
      const statusElement = entry.querySelector('.world-status');
      if (!statusElement) return;
      
      if (onlinePeers.has(username)) {
        const worldId = userWorlds.get(username);
        if (worldId) {
          statusElement.textContent = `World-${worldId}`;
          statusElement.classList.remove('offline');
        } else {
          statusElement.textContent = 'World-1';  // Default world if no selection found 
          statusElement.classList.remove('offline');
        }
      } else {
        statusElement.textContent = 'Offline';
        statusElement.classList.add('offline');
      }
    });
  }

  // Listen for world changes in the UI
  window.addEventListener('message', async (event) => {
    if (event.data && event.data.type === 'world-selected' && event.data.worldId) {
      await selectWorld(event.data.worldId);
    }
  });

  // Populate friends list from local storage on initialization
  const storedFriends = loadFriendsList();
  storedFriends.forEach(friend => {
    if (friend && friend.name) {
      const newFriend = document.createElement('div');
      newFriend.className = 'list-entry';
      newFriend.innerHTML = `
        <span class="player-name">${friend.name}</span>
        <span class="world-status offline">Offline</span>
      `;
      friendsListContainer.appendChild(newFriend);
    }
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
    
    if (overlay === addFriendOverlay && name) {
      const newFriend = document.createElement('div');
      newFriend.className = 'list-entry';
      newFriend.innerHTML = `
        <span class="player-name">${name}</span>
        <span class="world-status offline">Offline</span>
      `;
      friendsListContainer.appendChild(newFriend);
      saveFriendsList();
      updateFriendStatuses();
    } else if (overlay === delFriendOverlay && name) {
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

  // Handle friend list clicks
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

  // Initial status update
  updateFriendStatuses();
  
  // Regular status updates
  setInterval(updateFriendStatuses, 3000);
}

export { initializeFriendsList };