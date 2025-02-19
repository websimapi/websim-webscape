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

  // Global event listener for all game options buttons to update the selected state.
  const buttons = gameOptionsPanel.querySelectorAll('.game-options-buttons button');
  buttons.forEach(button => {
    button.addEventListener('click', () => {
      const parent = button.parentElement;
      parent.querySelectorAll('button').forEach(btn => btn.classList.remove('selected'));
      button.classList.add('selected');
    });
  });

  // Setup Music Volume control buttons within Game Options with persistence and maroon indicator.
  const musicVolumeSection = gameOptionsPanel.querySelector('#music-volume-section');
  if (musicVolumeSection) {
    const volumeMapping = {
      "Off": 0,
      "1": 0.25,
      "2": 0.50,
      "3": 0.75,
      "4": 1.0
    };
    const volumeButtons = musicVolumeSection.querySelectorAll('.game-options-buttons button');
    let storedVolume = localStorage.getItem('musicVolume');
    let initialVolume = storedVolume !== null ? parseFloat(storedVolume) : 1.0;
    setMusicVolume(initialVolume);
    volumeButtons.forEach(button => {
      const text = button.textContent.trim();
      if (volumeMapping[text] === initialVolume) {
        button.classList.add('selected');
      } else {
        button.classList.remove('selected');
      }
      button.addEventListener('click', () => {
        const btnText = button.textContent.trim();
        const newVolume = volumeMapping[btnText];
        setMusicVolume(newVolume);
        localStorage.setItem('musicVolume', newVolume);
        volumeButtons.forEach(btn => btn.classList.remove('selected'));
        button.classList.add('selected');
      });
    });
  }

  // Setup Split Private-chat control
  const splitChatSection = document.getElementById('split-private-chat-section');
  if (splitChatSection) {
    const splitButtons = splitChatSection.querySelectorAll('.game-options-buttons button');
    let storedSplit = localStorage.getItem('splitPrivateChat');
    let splitEnabled = storedSplit === 'true';
    splitButtons.forEach(button => {
      if (button.textContent.trim() === (splitEnabled ? "On" : "Off")) {
        button.classList.add('selected');
      } else {
        button.classList.remove('selected');
      }
      button.addEventListener('click', () => {
        const value = (button.textContent.trim() === "On");
        localStorage.setItem('splitPrivateChat', value);
        splitEnabled = value;
        splitButtons.forEach(btn => {
          if (btn.textContent.trim() === (value ? "On" : "Off")) {
            btn.classList.add('selected');
          } else {
            btn.classList.remove('selected');
          }
        });
      });
    });
  }
  
  // Setup Mouse Button Mode control
  // The Mouse Buttons section is identified by its header text "Mouse Buttons"
  const gameOptionsColumns = gameOptionsPanel.querySelectorAll('.game-options-column');
  gameOptionsColumns.forEach(column => {
    if (column.textContent.includes('Mouse Buttons')) {
      const mouseButtonsContainer = column.querySelector('.game-options-buttons');
      const mouseButtons = mouseButtonsContainer.querySelectorAll('button');
      // Load stored mouse mode from localStorage, default to 'two'
      let storedMouseMode = localStorage.getItem('mouseMode') || 'two';
      mouseButtons.forEach(button => {
        const btnText = button.textContent.trim().toLowerCase();
        if (btnText === storedMouseMode) {
          button.classList.add('selected');
        } else {
          button.classList.remove('selected');
        }
        button.addEventListener('click', () => {
          const selectedMode = button.textContent.trim().toLowerCase();
          localStorage.setItem('mouseMode', selectedMode);
          mouseButtons.forEach(btn => {
            if (btn.textContent.trim().toLowerCase() === selectedMode) {
              btn.classList.add('selected');
            } else {
              btn.classList.remove('selected');
            }
          });
        });
      });
    }
  });
}

export { initializeGameOptions };