document.addEventListener('DOMContentLoaded', () => {
  const chestIcon = document.querySelector('.icon.chest');
  const inventoryContainer = document.getElementById('inventory');
  const logoutButton = document.querySelector('.bottom-icon:nth-child(4)');
  const logoutPopup = document.getElementById('logout-popup');
  const closeLogoutButtons = document.querySelectorAll('.logout-button');

  // Function to close all menus
  const closeAllMenus = () => {
    // Close inventory
    chestIcon.classList.remove('selected');
    inventoryContainer.classList.add('hidden');
    // Close logout
    logoutButton.classList.remove('selected');
    logoutPopup.classList.add('hidden');
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

    // Close logout popup when clicking the logout button in popup
    closeLogoutButtons.forEach(button => {
      button.addEventListener('click', () => {
        closeAllMenus();
      });
    });
  }
});