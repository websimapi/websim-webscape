import { toggleMenu } from './menuManager.js';

function initializeStatsMenu() {
  const statsButton = document.querySelector('.icon.stats');
  const statsMenu = document.getElementById('stats-menu');

  statsButton.addEventListener('click', () => {
    toggleMenu(statsButton, '#stats-menu');
  });
}

export { initializeStatsMenu };