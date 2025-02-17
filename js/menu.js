import { initializeFriendsList } from './features/friends.js';
import { initializeIgnoreList } from './features/ignore.js';
import { initializeInventory } from './features/inventory.js';
import { initializeLogout } from './features/logout.js';
import { hideContextMenu } from './ui/contextMenu.js';

document.addEventListener('DOMContentLoaded', () => {
  // Initialize all features
  initializeFriendsList();
  initializeIgnoreList();
  initializeInventory();
  initializeLogout();

  // Global click handler to close context menu
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.context-menu') && !e.target.closest('.player-name')) {
      hideContextMenu();
    }
  });

  // Close context menu on scroll
  document.addEventListener('scroll', hideContextMenu);
});