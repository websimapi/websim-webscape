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

  // Handle overlay submissions for adding and deleting friends
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

  // Handle friend list clicks
  friendsListContainer.addEventListener('click', (e) => {
    const playerNameElement = e.target.closest('.player-name');
    if (playerNameElement) {
      const username = playerNameElement.textContent;
      showContextMenu(e, username, 
        () => {
          window.showPrivateMessageOverlay(username);
        },
        () => {
          playerNameElement.closest('.list-entry').remove();
        }
      );
    }
  });

  // Update friend list statuses based on online state
  function updateFriendsStatus() {
    const entries = friendsListContainer.querySelectorAll('.list-entry');
    entries.forEach(entry => {
      const nameElem = entry.querySelector('.player-name');
      const statusElem = entry.querySelector('.world-status');
      const friendName = nameElem.textContent;
      let isOnline = false;
      for (const peerId in window.room.party.peers) {
        if (window.room.party.peers[peerId].username === friendName) {
          isOnline = true;
          break;
        }
      }
      if (isOnline) {
        statusElem.textContent = 'world-1';
        statusElem.classList.remove('offline');
        statusElem.classList.add('online');
      } else {
        statusElem.textContent = 'Offline';
        statusElem.classList.remove('online');
        statusElem.classList.add('offline');
      }
    });
  }
  window.room.party.subscribe((peers) => {
    updateFriendsStatus();
  });
  // Initial update
  updateFriendsStatus();
}

export { initializeFriendsList };