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

  // Add new elements for ignore list functionality
  const addIgnoreButton = document.querySelector('.ignore-list .list-button:first-child');
  const delIgnoreButton = document.querySelector('.ignore-list .list-button:nth-child(2)');
  const addIgnoreOverlay = document.querySelector('#add-ignore-overlay');
  const delIgnoreOverlay = document.querySelector('#del-ignore-overlay');
  const addIgnoreInput = addIgnoreOverlay.querySelector('.add-friend-input');
  const delIgnoreInput = delIgnoreOverlay.querySelector('.del-friend-input');

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
    // Close both add and del ignore overlays
    addIgnoreOverlay.classList.remove('shown');
    delIgnoreOverlay.classList.remove('shown');
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

  // Add Ignore button click handler
  addIgnoreButton.addEventListener('click', () => {
    addIgnoreOverlay.classList.add('shown');
    addIgnoreInput.value = '';
    addIgnoreInput.focus();
  });

  // Del Ignore button click handler
  delIgnoreButton.addEventListener('click', () => {
    delIgnoreOverlay.classList.add('shown');
    delIgnoreInput.value = '';
    delIgnoreInput.focus();
  });

  // Handle add ignore input submission
  addIgnoreInput.addEventListener('keypress', async (e) => {
    if (e.key === 'Enter' && addIgnoreInput.value.trim()) {
      const ignoreName = addIgnoreInput.value.trim();
      
      // Add the name to the ignore list container
      const listContainer = document.querySelector('.ignore-list .list-container');
      const newIgnore = document.createElement('div');
      newIgnore.className = 'list-entry';
      newIgnore.innerHTML = `
        <span class="player-name">${ignoreName}</span>
        <span class="world-status offline">Offline</span>
      `;
      listContainer.appendChild(newIgnore);

      // Hide the overlay
      addIgnoreOverlay.classList.remove('shown');
    }
  });

  // Handle del ignore input submission
  delIgnoreInput.addEventListener('keypress', async (e) => {
    if (e.key === 'Enter' && delIgnoreInput.value.trim()) {
      const ignoreName = delIgnoreInput.value.trim();
      
      // Find and remove the name from the ignore list
      const listContainer = document.querySelector('.ignore-list .list-container');
      const ignoreEntries = listContainer.querySelectorAll('.list-entry');
      
      ignoreEntries.forEach(entry => {
        const playerName = entry.querySelector('.player-name').textContent;
        if (playerName === ignoreName) {
          entry.remove();
        }
      });

      // Hide the overlay
      delIgnoreOverlay.classList.remove('shown');
    }
  });

  // Create tooltip element
  const tooltip = document.createElement('div');
  tooltip.className = 'action-tooltip';
  tooltip.style.display = 'none';
  document.body.appendChild(tooltip);

  // Add tooltip functionality to buttons and player names
  function addTooltip(element, actionText, menuCount = 0) {
    element.addEventListener('mouseover', (e) => {
      tooltip.style.display = 'block';
      tooltip.textContent = menuCount ? `${actionText} / ${menuCount} more options` : actionText;
      
      // Position tooltip in top-left of game screen
      const gameScreen = document.getElementById('game-screen');
      const gameRect = gameScreen.getBoundingClientRect();
      tooltip.style.left = `${gameRect.left + 5}px`;
      tooltip.style.top = `${gameRect.top + 5}px`;
    });

    element.addEventListener('mouseout', () => {
      tooltip.style.display = 'none';
    });
  }

  // Add tooltips to list buttons
  addTooltip(addFriendButton, 'Add friend');
  addTooltip(delFriendButton, 'Delete friend');
  addTooltip(addIgnoreButton, 'Add name to ignore list');
  addTooltip(delIgnoreButton, 'Delete name from ignore list');

  // Add tooltips to player names (with menu count and first action)
  const friendsListContainer = document.querySelector('.friends-list .list-container');
  friendsListContainer.addEventListener('mouseover', (e) => {
    const playerNameElement = e.target.closest('.player-name');
    if (playerNameElement) {
      const username = playerNameElement.textContent;
      addTooltip(playerNameElement, `Message ${username}`, 2); // 2 additional options: Remove and Cancel
    }
  });

  // Add context menu element to the document
  const contextMenu = document.createElement('div');
  contextMenu.className = 'context-menu';
  document.body.appendChild(contextMenu);

  // Handle clicks on player names in friends list
  friendsListContainer.addEventListener('click', (e) => {
    const playerNameElement = e.target.closest('.player-name');
    if (playerNameElement) {
      e.preventDefault();
      
      const username = playerNameElement.textContent;
      
      // Position and show context menu
      contextMenu.style.left = `${e.pageX}px`;
      contextMenu.style.top = `${e.pageY}px`;
      
      // Set menu options
      contextMenu.innerHTML = `
        <div class="context-menu-option message">Message ${username}</div>
        <div class="context-menu-option remove">Remove ${username}</div>
        <div class="context-menu-option cancel">Cancel</div>
      `;
      
      contextMenu.classList.add('shown');
      
      // Add click handlers for menu options
      const messageOption = contextMenu.querySelector('.message');
      const removeOption = contextMenu.querySelector('.remove');
      const cancelOption = contextMenu.querySelector('.cancel');
      
      messageOption.addEventListener('click', () => {
        // TODO: Implement private messaging
        contextMenu.classList.remove('shown');
      });
      
      removeOption.addEventListener('click', () => {
        // Remove friend from list
        playerNameElement.closest('.list-entry').remove();
        contextMenu.classList.remove('shown');
      });
      
      cancelOption.addEventListener('click', () => {
        contextMenu.classList.remove('shown');
      });
    }
  });

  // Close context menu when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.context-menu') && !e.target.closest('.player-name')) {
      contextMenu.classList.remove('shown');
    }
  });

  // Also close context menu when scrolling
  document.addEventListener('scroll', () => {
    contextMenu.classList.remove('shown');
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

  // Add click handlers to close overlays when clicking outside
  addIgnoreOverlay.addEventListener('click', (e) => {
    if (e.target === addIgnoreOverlay) {
      addIgnoreOverlay.classList.remove('shown');
    }
  });

  delIgnoreOverlay.addEventListener('click', (e) => {
    if (e.target === delIgnoreOverlay) {
      delIgnoreOverlay.classList.remove('shown');
    }
  });
});