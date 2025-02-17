document.addEventListener('DOMContentLoaded', () => {
  const chestIcon = document.querySelector('.icon.chest');
  const inventoryContainer = document.getElementById('inventory');
  const logoutButton = document.querySelector('.bottom-icon:nth-child(4)');
  const logoutPopup = document.getElementById('logout-popup');
  const closeLogoutButtons = document.querySelectorAll('.logout-button');

  // Chest icon toggle
  if (chestIcon && inventoryContainer) {
    chestIcon.addEventListener('click', () => {
      if (chestIcon.classList.contains('selected')) {
        chestIcon.classList.remove('selected');
        inventoryContainer.classList.add('hidden');
      } else {
        chestIcon.classList.add('selected');
        inventoryContainer.classList.remove('hidden');
      }
    });
  }

  // Logout button toggle
  if (logoutButton && logoutPopup) {
    logoutButton.addEventListener('click', () => {
      if (logoutButton.classList.contains('selected')) {
        logoutButton.classList.remove('selected');
        logoutPopup.classList.add('hidden');
      } else {
        logoutButton.classList.add('selected');
        logoutPopup.classList.remove('hidden');
      }
    });

    // Close logout popup when clicking the logout button
    closeLogoutButtons.forEach(button => {
      button.addEventListener('click', () => {
        logoutButton.classList.remove('selected');
        logoutPopup.classList.add('hidden');
      });
    });
  }
});