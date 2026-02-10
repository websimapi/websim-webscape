import { toggleMenu } from './menuManager.js';

function renderLogout() {
  const panel = document.createElement('div');
  panel.id = 'logout-popup';
  panel.className = 'hidden';
  panel.innerHTML = `
    <div class="popup-content">
      <p>
        When you have finished playing
        Webscape, always use the
        button below to logout safely.
      </p>
      <button class="logout-button">Click here to logout</button>
    </div>
  `;
  document.getElementById('right-panel').appendChild(panel);
}

function initializeLogout() {
  renderLogout();

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