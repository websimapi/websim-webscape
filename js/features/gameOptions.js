import { toggleMenu } from './menuManager.js';
import { setMusicVolume } from './musicMenu.js';

function initializeGameOptions() {
  const gameOptionsButton = document.querySelector('.bottom-icon.game-options-button');
  const gameOptionsPanel = document.getElementById('game-options');

  if (gameOptionsButton && gameOptionsPanel) {
    gameOptionsButton.addEventListener('click', () => {
      toggleMenu(gameOptionsButton, '#game-options');
    });
  }

  // Add event listeners to each button inside the game options panel.
  const buttons = gameOptionsPanel.querySelectorAll('.game-options-buttons button');
  buttons.forEach(button => {
    button.addEventListener('click', () => {
      // Mark the clicked button as selected while unselecting its siblings.
      const parent = button.parentElement;
      parent.querySelectorAll('button').forEach(btn => btn.classList.remove('selected'));
      button.classList.add('selected');
    });
  });

  // Setup Music Volume control buttons within Game Options.
  // The Music Volume section now has an id for easy targeting.
  const musicVolumeSection = gameOptionsPanel.querySelector('#music-volume-section');
  if (musicVolumeSection) {
    const volumeButtons = musicVolumeSection.querySelectorAll('.game-options-buttons button');
    volumeButtons.forEach(button => {
      button.addEventListener('click', () => {
        const text = button.textContent.trim();
        let volume = 0;
        if (text === 'Off') {
          volume = 0;
        } else if (text === '1') {
          volume = 0.25;
        } else if (text === '2') {
          volume = 0.50;
        } else if (text === '3') {
          volume = 0.75;
        } else if (text === '4') {
          volume = 1.0;
        }
        setMusicVolume(volume);
      });
    });
  }
}

export { initializeGameOptions };