import { toggleMenu } from './menuManager.js';

function initializeNewUi() {
  const newUiButton = document.querySelector('.bottom-icon:nth-child(1)');
  const newUiContainer = document.getElementById('new-ui');

  newUiButton.addEventListener('click', () => {
    toggleMenu(newUiButton, '#new-ui');
  });
}

export { initializeNewUi };