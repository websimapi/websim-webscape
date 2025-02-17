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
});