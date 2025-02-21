import { initializeFriendsList } from './features/friends.js';
import { initializeIgnoreList } from './features/ignore.js';
import { initializeInventory } from './features/inventory.js';
import { initializeLogout } from './features/logout.js';
import { initializeGameOptions } from './features/gameOptions.js';
import { initializeQuestJournal } from './features/questJournal.js';
import { hideContextMenu } from './ui/contextMenu.js';
import { hideAllPanels } from './features/menuManager.js';
import { initializeSkillsMenu } from './features/skillsMenu.js';
import { initializeMusicMenu, setMusicVolume } from './features/musicMenu.js';
import { initializeSpellbook } from './features/spellbook.js';
import { initializeCompass } from './features/compass.js';
import { initializeWorlds } from './features/worlds.js';

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
  initializeCompass();
  initializeWorlds();

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

  // FIX: In Two mouse mode, prevent the browser's default context menu
  document.addEventListener('contextmenu', (e) => {
    if (window.mouseMode === "Two") {
      e.preventDefault();
    }
  });
});

// Resume (or create) an AudioContext on the first user gesture to satisfy autoplay rules.
document.addEventListener('click', () => {
  if (!window.myAudioContext) {
    window.myAudioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (window.myAudioContext.state === 'suspended') {
    window.myAudioContext.resume();
  }
});