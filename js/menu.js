import { initializeFriendsList } from './features/friends.js';
import { initializeIgnoreList } from './features/ignore.js';
import { initializeInventory } from './features/inventory.js';
import { initializeLogout } from './features/logout.js';
import { initializeGameOptions } from './features/gameOptions.js';
import { initializeQuestJournal } from './features/questJournal.js';
import { hideContextMenu } from './ui/contextMenu.js';
import { hideAllPanels } from './features/menuManager.js';
import { initializeSkillsMenu } from './features/skillsMenu.js';
import { initializeMusicMenu } from './features/musicMenu.js';
import { initializeSpellbook } from './features/spellbook.js';

document.addEventListener('DOMContentLoaded', () => {
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

  // Set default menu selection to logout button
  const defaultButton = document.querySelector('.bottom-icon:nth-child(4)');
  defaultButton.click();

  // Global click handler to close context menu only
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.context-menu') && !e.target.closest('.player-name')) {
      hideContextMenu();
    }
  });

  // Close context menu on scroll
  document.addEventListener('scroll', hideContextMenu);

  // FIX: In Two mouse mode, prevent the browser’s default context menu
  document.addEventListener('contextmenu', (e) => {
    if (window.mouseMode === "Two") {
      e.preventDefault();
    }
  });
});