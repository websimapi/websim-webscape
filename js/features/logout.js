import { toggleMenu } from './menuManager.js';

function initializeLogout() {
  const logoutButton = document.querySelector('.bottom-icon:nth-child(4)');
  const logoutPopup = document.getElementById('logout-popup');
  const closeLogoutButtons = document.querySelectorAll('.logout-button');

  logoutButton.addEventListener('click', () => {
    toggleMenu(logoutButton, '#logout-popup');
  });

  closeLogoutButtons.forEach(button => {
    button.addEventListener('click', () => {
      logoutButton.classList.remove('selected');
      logoutPopup.classList.add('hidden');
    });
  });
}

export { initializeLogout };