document.addEventListener('DOMContentLoaded', () => {
  const chestIcon = document.querySelector('.icon.chest');
  const inventoryContainer = document.getElementById('inventory');
  const logoutButton = document.querySelector('.bottom-icon:nth-child(4)');
  const logoutPopup = document.getElementById('logout-popup');
  const closeLogoutButtons = document.querySelectorAll('.logout-button');
  const friendsButton = document.querySelector('.bottom-icon:nth-child(2)');
  const ignoreButton = document.querySelector('.bottom-icon:nth-child(3)');
  const friendsList = document.querySelector('.friends-list');
  const ignoreList = document.querySelector('.ignore-list');

  // Add new elements
  const addFriendButton = document.querySelector('.friends-list .list-button:first-child');
  const addFriendOverlay = document.querySelector('#add-friend-overlay');
  const addFriendInput = addFriendOverlay.querySelector('.add-friend-input');

  // Add new elements for delete friend functionality
  const delFriendButton = document.querySelector('.friends-list .list-button:nth-child(2)');
  const delFriendOverlay = document.querySelector('#del-friend-overlay');
  const delFriendInput = delFriendOverlay ? delFriendOverlay.querySelector('.del-friend-input') : null;

  // Function to close all menus
  const closeAllMenus = () => {
    // Close inventory
    chestIcon.classList.remove('selected');
    inventoryContainer.classList.add('hidden');
    // Close logout
    logoutButton.classList.remove('selected');
    logoutPopup.classList.add('hidden');
    // Close friends list
    friendsButton.classList.remove('selected');
    friendsList.classList.remove('shown');
    // Close ignore list
    ignoreButton.classList.remove('selected');
    ignoreList.classList.remove('shown');
    // Close both add and del friend overlays
    addFriendOverlay.classList.remove('shown');
    delFriendOverlay.classList.remove('shown');
  };

  // Chest icon toggle
  if (chestIcon && inventoryContainer) {
    chestIcon.addEventListener('click', () => {
      if (chestIcon.classList.contains('selected')) {
        closeAllMenus();
      } else {
        closeAllMenus();
        chestIcon.classList.add('selected');
        inventoryContainer.classList.remove('hidden');
      }
    });
  }

  // Logout button toggle
  if (logoutButton && logoutPopup) {
    logoutButton.addEventListener('click', () => {
      if (logoutButton.classList.contains('selected')) {
        closeAllMenus();
      } else {
        closeAllMenus();
        logoutButton.classList.add('selected');
        logoutPopup.classList.remove('hidden');
      }
    });

    closeLogoutButtons.forEach(button => {
      button.addEventListener('click', () => {
        closeAllMenus();
      });
    });
  }

  // Friends list toggle
  if (friendsButton && friendsList) {
    friendsButton.addEventListener('click', () => {
      if (friendsButton.classList.contains('selected')) {
        closeAllMenus();
      } else {
        closeAllMenus();
        friendsButton.classList.add('selected');
        friendsList.classList.add('shown');
      }
    });
  }

  // Ignore list toggle
  if (ignoreButton && ignoreList) {
    ignoreButton.addEventListener('click', () => {
      if (ignoreButton.classList.contains('selected')) {
        closeAllMenus();
      } else {
        closeAllMenus();
        ignoreButton.classList.add('selected');
        ignoreList.classList.add('shown');
      }
    });
  }

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

  // Handle add friend input submission
  addFriendInput.addEventListener('keypress', async (e) => {
    if (e.key === 'Enter' && addFriendInput.value.trim()) {
      const friendName = addFriendInput.value.trim();
      
      // Add the friend to the list container
      const listContainer = document.querySelector('.friends-list .list-container');
      const newFriend = document.createElement('div');
      newFriend.className = 'list-entry';
      newFriend.innerHTML = `
        <span class="player-name">${friendName}</span>
        <span class="world-status offline">Offline</span>
      `;
      listContainer.appendChild(newFriend);

      // Hide the overlay
      addFriendOverlay.classList.remove('shown');
    }
  });

  // Handle del friend input submission
  delFriendInput.addEventListener('keypress', async (e) => {
    if (e.key === 'Enter' && delFriendInput.value.trim()) {
      const friendName = delFriendInput.value.trim();
      
      // Find and remove the friend from the list
      const listContainer = document.querySelector('.friends-list .list-container');
      const friendEntries = listContainer.querySelectorAll('.list-entry');
      
      friendEntries.forEach(entry => {
        const playerName = entry.querySelector('.player-name').textContent;
        if (playerName === friendName) {
          entry.remove();
        }
      });

      // Hide the overlay
      delFriendOverlay.classList.remove('shown');
    }
  });

  // Close overlays when clicking outside
  addFriendOverlay.addEventListener('click', (e) => {
    if (e.target === addFriendOverlay) {
      addFriendOverlay.classList.remove('shown');
    }
  });

  delFriendOverlay.addEventListener('click', (e) => {
    if (e.target === delFriendOverlay) {
      delFriendOverlay.classList.remove('shown');
    }
  });
});