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
  // EXCEPT for those in the Mouse Buttons section – they will be handled separately.
  const buttons = gameOptionsPanel.querySelectorAll('.game-options-buttons button');
  buttons.forEach(button => {
    const header = button.closest('.game-options-column')?.querySelector('.game-options-header');
    if (header && header.textContent.includes('Mouse Buttons')) {
      // Skip global handler for mouse mode buttons.
      return;
    }
    button.addEventListener('click', () => {
      const parent = button.parentElement;
      parent.querySelectorAll('button').forEach(btn => btn.classList.remove('selected'));
      button.classList.add('selected');
    });
  });

  // Setup Music Volume control buttons within Game Options with persistence.
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

  // Setup Split Private-chat control with persistence.
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
        
        // Get references to both chat containers
        const splitContainer = document.getElementById('split-private-chat');
        const mainChat = document.querySelector('.chat-content');
        
        if (splitContainer) {
          if (value) {
            // Moving to split chat: create clones for split view
            splitContainer.classList.remove('hidden');
            const privateMessages = mainChat.querySelectorAll('.private-message');
            privateMessages.forEach(msg => {
              const clonedMsg = msg.cloneNode(true);
              splitContainer.appendChild(clonedMsg);
              // Keep only last 5 messages in split chat
              while (splitContainer.childElementCount > 5) {
                splitContainer.removeChild(splitContainer.firstChild);
              }
              msg.remove();
            });
          } else {
            // Moving from split chat to main chat
            splitContainer.classList.add('hidden');
            const splitMessages = Array.from(splitContainer.children);
            const mainChatMessages = Array.from(mainChat.children);
            
            // Combine all messages and sort by timestamp
            const allMessages = [...mainChatMessages, ...splitMessages.map(msg => msg.cloneNode(true))];
            const sortedMessages = allMessages.sort((a, b) => {
              return parseFloat(b.getAttribute('data-timestamp')) - parseFloat(a.getAttribute('data-timestamp'));
            });
            
            // Clear and repopulate main chat with sorted messages
            mainChat.innerHTML = '';
            sortedMessages.forEach(msg => {
              mainChat.appendChild(msg.cloneNode(true));
            });
            
            // Clear split chat
            splitContainer.innerHTML = '';
          }
        }
      });
    });
  }

  // --- NEW: Setup Mouse Button Mode selection ---
  // This is for the "Mouse Buttons" section – the first column in the two‑column layout.
  const mouseModeColumn = gameOptionsPanel.querySelector('.game-options-two-column .game-options-column:first-child');
  if (mouseModeColumn) {
    const mouseModeButtonsContainer = mouseModeColumn.querySelector('.game-options-buttons');
    if (mouseModeButtonsContainer) {
      const mouseButtons = mouseModeButtonsContainer.querySelectorAll('button');
      let storedMouseMode = localStorage.getItem('mouseMode');
      if (!storedMouseMode) {
        storedMouseMode = "Two"; // Default to Two mouse mode.
        localStorage.setItem('mouseMode', storedMouseMode);
      }
      window.mouseMode = storedMouseMode;
      mouseButtons.forEach(button => {
        if (button.textContent.trim() === storedMouseMode) {
          button.classList.add('selected');
        } else {
          button.classList.remove('selected');
        }
        button.addEventListener('click', () => {
          const mode = button.textContent.trim();
          localStorage.setItem('mouseMode', mode);
          window.mouseMode = mode;
          mouseButtons.forEach(btn => btn.classList.remove('selected'));
          button.classList.add('selected');
        });
      });
    }
  }
}

export { initializeGameOptions };