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

let featuresLoaded = {
  friends: false,
  ignore: false,
  inventory: false,
  logout: false,
  gameOptions: false,
  questJournal: false,
  skillsMenu: false,
  musicMenu: false,
  spellbook: false,
  compass: false,
  worlds: false
};

function initializeFeature(feature, initFn) {
  featuresLoaded[feature] = true;
  if (typeof initFn === 'function') {
    initFn();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // Initialize all features
  initializeFeature('friends', initializeFriendsList);
  initializeFeature('ignore', initializeIgnoreList);
  initializeFeature('inventory', initializeInventory);
  initializeFeature('logout', initializeLogout);
  initializeFeature('gameOptions', initializeGameOptions);
  initializeFeature('questJournal', initializeQuestJournal);
  initializeFeature('skillsMenu', initializeSkillsMenu);
  initializeFeature('musicMenu', initializeMusicMenu);
  initializeFeature('spellbook', initializeSpellbook);
  initializeFeature('compass', initializeCompass);
  initializeFeature('worlds', initializeWorlds);

  // Set default menu
  const defaultButton = document.querySelector('.bottom-icon:nth-child(4)');
  defaultButton.click();

  // Add global click handlers
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.context-menu') && !e.target.closest('.player-name')) {
      if (window.hideContextMenu) {
        window.hideContextMenu();
      }
    }
  });

  document.addEventListener('scroll', () => {
    if (window.hideContextMenu) {
      window.hideContextMenu();
    }
  });

  document.addEventListener('contextmenu', (e) => {
    if (window.mouseMode === "Two") {
      e.preventDefault(); 
    }
  });
});