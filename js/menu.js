import { initializeFriendsList } from './features/friends.js';
import { initializeIgnoreList } from './features/ignore.js';
import { initializeInventory } from './features/inventory.js';
import { initializeLogout } from './features/logout.js';
import { hideContextMenu } from './ui/contextMenu.js';
import { hideAllPanels } from './features/menuManager.js';
import { initializeGameOptions } from './features/gameOptions.js';

document.addEventListener('DOMContentLoaded', () => {
  // Initialize all features
  initializeFriendsList();
  initializeIgnoreList();
  initializeInventory();
  initializeLogout();
  initializeGameOptions();

  // Set default menu selection to menu 4
  const defaultButton = document.querySelector('.bottom-icon:nth-child(4)');
  defaultButton.click();

  // Global click handler to close context menu only
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.context-menu') && !e.target.closest('.player-name')) {
      hideContextMenu();
    }

    // Don't hide panels on outside clicks anymore, keep current selection
  });

  // Close context menu on scroll
  document.addEventListener('scroll', hideContextMenu);
});