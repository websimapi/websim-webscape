import { addTooltip, tooltip } from '../ui/tooltips.js';
import { setupOverlay } from '../ui/overlays.js';
import { toggleMenu } from './menuManager.js';

function initializeIgnoreList() {
  const ignoreButton = document.querySelector('.bottom-icon:nth-child(3)');
  const ignoreList = document.querySelector('.ignore-list');
  const addIgnoreButton = document.querySelector('.ignore-list .list-button:first-child');
  const delIgnoreButton = document.querySelector('.ignore-list .list-button:nth-child(2)');
  const addIgnoreOverlay = document.getElementById('add-ignore-overlay');
  const delIgnoreOverlay = document.getElementById('del-ignore-overlay');
  const addIgnoreInput = addIgnoreOverlay.querySelector('.add-friend-input');
  const delIgnoreInput = delIgnoreOverlay.querySelector('.del-friend-input');
  const ignoreListContainer = document.querySelector('.ignore-list .list-container');

  // Setup tooltips
  addTooltip(addIgnoreButton, 'Add name to ignore list');
  addTooltip(delIgnoreButton, 'Delete name from ignore list');

  // Setup ignore list toggle with menu management
  ignoreButton.addEventListener('click', () => {
    toggleMenu(ignoreButton, '.ignore-list');
  });

  // Setup overlays
  setupOverlay(addIgnoreOverlay, addIgnoreInput);
  setupOverlay(delIgnoreOverlay, delIgnoreInput);

  // --- Local Storage Persistence Functions ---
  function saveIgnoreList() {
    const ignoreEntries = ignoreListContainer.querySelectorAll('.list-entry');
    const ignoreData = Array.from(ignoreEntries).map(entry => {
      return { name: entry.querySelector('.player-name').textContent };
    });
    localStorage.setItem('ignoreList', JSON.stringify(ignoreData));
  }

  function loadIgnoreList() {
    const stored = localStorage.getItem('ignoreList');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (err) {
        return [];
      }
    }
    return [];
  }

  // Populate ignore list from local storage on initialization
  const storedIgnores = loadIgnoreList();
  storedIgnores.forEach(item => {
    const newIgnore = document.createElement('div');
    newIgnore.className = 'list-entry';
    newIgnore.innerHTML = `
      <span class="player-name">${item.name}</span>
      <span class="world-status offline">Offline</span>
    `;
    ignoreListContainer.appendChild(newIgnore);
  });

  // Add Ignore button click handler
  addIgnoreButton.addEventListener('click', () => {
    addIgnoreOverlay.classList.add('shown');
    addIgnoreInput.value = '';
    addIgnoreInput.focus();
  });

  // Del Ignore button click handler
  delIgnoreButton.addEventListener('click', () => {
    delIgnoreOverlay.classList.add('shown');
    delIgnoreInput.value = '';
    delIgnoreInput.focus();
  });

  // Handle overlay submissions
  document.addEventListener('overlay-submit', (e) => {
    const { name, overlay } = e.detail;
    
    if (overlay === addIgnoreOverlay) {
      const newIgnore = document.createElement('div');
      newIgnore.className = 'list-entry';
      newIgnore.innerHTML = `
        <span class="player-name">${name}</span>
        <span class="world-status offline">Offline</span>
      `;
      ignoreListContainer.appendChild(newIgnore);
      saveIgnoreList();
      
      // Trigger real-time update of ignored user status
      if (window.updateIgnoredUsers) {
        window.updateIgnoredUsers();
      }
    } else if (overlay === delIgnoreOverlay) {
      const ignoreEntries = ignoreListContainer.querySelectorAll('.list-entry');
      ignoreEntries.forEach(entry => {
        const playerName = entry.querySelector('.player-name').textContent;
        if (playerName === name) {
          entry.remove();
        }
      });
      saveIgnoreList();
      
      // Trigger real-time update of unignored user status
      if (window.updateIgnoredUsers) {
        window.updateIgnoredUsers();
      }
    }
  });

  // Setup ignore list hover effects
  ignoreListContainer.addEventListener('mouseover', (e) => {
    const playerNameElement = e.target.closest('.player-name');
    if (playerNameElement) {
      const username = playerNameElement.textContent;
      tooltip.style.display = 'block';
      tooltip.textContent = `Remove ${username}`;
      
      const gameScreen = document.getElementById('game-screen');
      const gameRect = gameScreen.getBoundingClientRect();
      tooltip.style.left = `${gameRect.left + 5}px`;
      tooltip.style.top = `${gameRect.top + 5}px`;
    }
  });

  ignoreListContainer.addEventListener('mouseout', (e) => {
    if (e.target.closest('.player-name')) {
      tooltip.style.display = 'none';
    }
  });

  // Handle ignore list clicks - direct remove action
  ignoreListContainer.addEventListener('click', (e) => {
    const playerNameElement = e.target.closest('.player-name');
    if (playerNameElement) {
      playerNameElement.closest('.list-entry').remove();
      saveIgnoreList();
      
      // Trigger real-time update of unignored user status
      if (window.updateIgnoredUsers) {
        window.updateIgnoredUsers();
      }
    }
  });
}

export { initializeIgnoreList };