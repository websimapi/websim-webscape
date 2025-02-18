import { toggleMenu } from './menuManager.js';

function initializeMusicMenu() {
  const musicButton = document.querySelector('.bottom-icon.music');
  const musicMenu = document.getElementById('music-menu');
  if (musicButton && musicMenu) {
    musicButton.addEventListener('click', () => {
      toggleMenu(musicButton, '#music-menu');
    });
  }
}

export { initializeMusicMenu };