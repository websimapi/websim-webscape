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
      const newFriend = document.createElement('div');
      newFriend.className = 'list-entry';
      newFriend.innerHTML = `
        <span class="player-name">${name}</span>
        <span class="world-status offline">Offline</span>
      `;
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
          // TODO: Implement messaging
        },
        () => {
          playerNameElement.closest('.list-entry').remove();
        }
      );
    }
  });
}

export { initializeFriendsList };