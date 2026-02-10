// Main entry point - refactored from index.html inline script

// Import and initialize all features
import { initializeNavigation } from './ui/navigation.js'; // Ensure navigation is initialized first
import { initializeFriendsList } from './features/friends.js';
import { initializeIgnoreList } from './features/ignore.js';
import { initializeInventory } from './features/inventory.js';
import { initializeLogout } from './features/logout.js';
import { initializeGameOptions } from './features/gameOptions.js';
import { initializeQuestJournal } from './features/questJournal.js';
import { initializeSkillsMenu } from './features/skillsMenu.js';
import { initializeMusicMenu } from './features/musicMenu.js';
import { initializeSpellbook } from './features/spellbook.js';
import { initializeCompass } from './features/compass.js';
import { initializeWorlds } from './features/worlds.js';
import { hideContextMenu } from './ui/contextMenu.js';
import { hideAllPanels } from './features/menuManager.js';
// Chat is self-initializing when imported, but we import it here to ensure it loads
import './chat.js';

// Initialize all features when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Initialize navigation first so buttons exist
  initializeNavigation();
  
  // Initialize all features
  initializeFriendsList();
  initializeIgnoreList();
  initializeInventory();
  initializeLogout();
  initializeGameOptions();
  initializeQuestJournal();
  initializeSkillsMenu();
  initializeMusicMenu();
  initializeSpellbook();
  initializeCompass();
  initializeWorlds();

  // Re-append navigation to ensure it stays at the bottom after other features inject their panels
  const rightPanel = document.getElementById('right-panel');
  const bottomIcons = document.getElementById('bottom-icons');
  if (rightPanel && bottomIcons) {
    rightPanel.appendChild(bottomIcons);
  }

  // Set default menu selection to logout button (Log Out is the 4th icon)
  const defaultButton = document.querySelector('.bottom-icon:nth-child(4)');
  if (defaultButton) defaultButton.click();

  // Global click handler to close context menu only
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.context-menu') && !e.target.closest('.player-name')) {
      hideContextMenu();
    }
  });

  // Close context menu on scroll
  document.addEventListener('scroll', hideContextMenu);

  // FIX: In Two mouse mode, prevent the browser's default context menu
  document.addEventListener('contextmenu', (e) => {
    if (window.mouseMode === "Two") {
      e.preventDefault();
    }
  });
});