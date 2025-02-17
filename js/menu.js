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

  // Function to close all menus
  const closeAllMenus = () => {
    // Store currently selected button states before closing
    const selectedInventory = chestIcon.classList.contains('selected');
    const selectedLogout = logoutButton.classList.contains('selected');
    const selectedFriends = friendsButton.classList.contains('selected');
    const selectedIgnore = ignoreButton.classList.contains('selected');

    // Close inventory
    inventoryContainer.classList.add('hidden');
    // Close logout
    logoutPopup.classList.add('hidden');
    // Close friends list
    friendsList.classList.remove('shown');
    // Close ignore list
    ignoreList.classList.remove('shown');
    // Close add friend overlay
    addFriendOverlay.classList.remove('shown');

    // Restore selected states
    chestIcon.classList.toggle('selected', selectedInventory);
    logoutButton.classList.toggle('selected', selectedLogout);
    friendsButton.classList.toggle('selected', selectedFriends);
    ignoreButton.classList.toggle('selected', selectedIgnore);
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
    // Only close menus that would conflict with the add friend overlay
    inventoryContainer.classList.add('hidden');
    logoutPopup.classList.add('hidden');
    friendsList.classList.remove('shown');
    ignoreList.classList.remove('shown');
    
    addFriendOverlay.classList.add('shown');
    addFriendInput.value = '';
    addFriendInput.focus();
  });

  // Handle add friend input submission
  addFriendInput.addEventListener('keypress', async (e) => {
    if (e.key === 'Enter' && addFriendInput.value.trim()) {
      const friendName = addFriendInput.value.trim();
      
      // Here you would typically validate the username and add it to the friends list
      // For now, we'll just add it to the list container
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

  // Close overlay when clicking outside
  addFriendOverlay.addEventListener('click', (e) => {
    if (e.target === addFriendOverlay) {
      addFriendOverlay.classList.remove('shown');
    }
  });
});