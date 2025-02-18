import { addTooltip, tooltip } from '../ui/tooltips.js';
import { showContextMenu, hideContextMenu } from '../ui/contextMenu.js';
import { setupOverlay } from '../ui/overlays.js';
import { toggleMenu } from './menuManager.js';

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
      const newFriend = createFriendEntry(name);
      friendsListContainer.appendChild(newFriend);
    } else if (overlay === delFriendOverlay) {
      const friendEntries = friendsListContainer.querySelectorAll('.list-entry');
      friendEntries.forEach(entry => {
        const playerName = entry.querySelector('.player-name').textContent;
        if (playerName === name) {
          entry.remove();
        }
      });
    }
  });

  // Function to create a friend entry with proper event handlers
  function createFriendEntry(username) {
    const entry = document.createElement('div');
    entry.className = 'list-entry';
    
    // Get WebsimSocket instance from chat.js
    const room = window.room || new WebsimSocket();
    const isOnline = room.party.peers && Object.values(room.party.peers).some(peer => peer.username === username);
    
    entry.innerHTML = `
      <span class="player-name">${username}</span>
      <span class="world-status ${isOnline ? '' : 'offline'}">${isOnline ? 'World-1' : 'Offline'}</span>
    `;

    // Add click handler for the player name
    const playerName = entry.querySelector('.player-name');
    playerName.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      hideContextMenu();

      const friendContextMenu = document.createElement('div');
      friendContextMenu.className = 'context-menu shown';
      friendContextMenu.innerHTML = `
        <div class="context-menu-option message">Message ${username}</div>
        <div class="context-menu-option remove">Remove ${username}</div>
        <div class="context-menu-option cancel">Cancel</div>
      `;

      // Position the context menu
      const rect = playerName.getBoundingClientRect();
      friendContextMenu.style.left = `${rect.left}px`;
      friendContextMenu.style.top = `${rect.bottom}px`;
      document.body.appendChild(friendContextMenu);

      // Add click handlers for menu options
      friendContextMenu.querySelector('.message').addEventListener('click', () => {
        const messageOverlay = document.getElementById('message-overlay');
        const messageInput = messageOverlay.querySelector('.message-input');
        const messageUsernameSpan = messageOverlay.querySelector('.message-username');
        
        messageUsernameSpan.textContent = username;
        messageOverlay.classList.add('shown');
        messageInput.value = '';
        messageInput.focus();
        document.querySelector('.chat-input-area').style.visibility = 'hidden';
        
        friendContextMenu.remove();
      });

      friendContextMenu.querySelector('.remove').addEventListener('click', () => {
        entry.remove();
        friendContextMenu.remove();
      });

      friendContextMenu.querySelector('.cancel').addEventListener('click', () => {
        friendContextMenu.remove();
      });

      // Close menu when clicking outside
      document.addEventListener('click', function closeMenu(e) {
        if (!friendContextMenu.contains(e.target)) {
          friendContextMenu.remove();
          document.removeEventListener('click', closeMenu);
        }
      });
    });

    // Add hover effect
    playerName.addEventListener('mouseover', () => {
      tooltip.textContent = `Message ${username} / 1 more option`;
      tooltip.style.display = 'block';
      
      const gameScreen = document.getElementById('game-screen');
      const gameRect = gameScreen.getBoundingClientRect();
      tooltip.style.left = `${gameRect.left + 5}px`;
      tooltip.style.top = `${gameRect.top + 5}px`;
    });

    playerName.addEventListener('mouseout', () => {
      tooltip.style.display = 'none';
    });

    return entry;
  }

  // Handle friend list clicks for existing entries
  friendsListContainer.addEventListener('click', (e) => {
    const playerNameElement = e.target.closest('.player-name');
    if (playerNameElement) {
      const event = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: window
      });
      playerNameElement.dispatchEvent(event);
    }
  });
}

export { initializeFriendsList };