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
import { initializeCompass } from './features/compass.js';
import { initializeWorlds } from './features/worlds.js';
import { debug } from './debug.js';

document.addEventListener('DOMContentLoaded', () => {
  debug.log('INIT', 'Starting menu initialization');
  
  try {
    // Validate critical DOM elements before initialization
    debug.log('DOM', 'Validating critical elements');
    if (!document.querySelector('.bottom-icon:nth-child(4)')) {
      throw new Error('Critical UI elements missing');
    }

    // Initialize all features with debug logging
    const features = [
      { name: 'FriendsList', init: initializeFriendsList },
      { name: 'IgnoreList', init: initializeIgnoreList },
      { name: 'Inventory', init: initializeInventory },
      { name: 'Logout', init: initializeLogout },
      { name: 'GameOptions', init: initializeGameOptions },
      { name: 'QuestJournal', init: initializeQuestJournal },
      { name: 'SkillsMenu', init: initializeSkillsMenu },
      { name: 'MusicMenu', init: initializeMusicMenu },
      { name: 'Spellbook', init: initializeSpellbook },
      { name: 'Compass', init: initializeCompass },
      { name: 'Worlds', init: initializeWorlds }
    ];

    features.forEach(feature => {
      try {
        debug.log('INIT', `Initializing ${feature.name}`);
        feature.init();
        debug.log('INIT', `${feature.name} initialized successfully`);
      } catch (error) {
        debug.error('INIT', `Failed to initialize ${feature.name}`, error);
      }
    });

    // Set default menu selection to logout button
    debug.log('UI', 'Setting default menu selection');
    const defaultButton = document.querySelector('.bottom-icon:nth-child(4)');
    if (defaultButton) {
      defaultButton.click();
    } else {
      debug.error('UI', 'Default button not found');
    }

    // Setup global event handlers
    debug.log('EVENTS', 'Setting up global event handlers');
    
    // Global click handler to close context menu
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.context-menu') && !e.target.closest('.player-name')) {
        debug.log('UI', 'Closing context menu via global click');
        hideContextMenu();
      }
    });

    // Close context menu on scroll
    document.addEventListener('scroll', () => {
      debug.log('UI', 'Closing context menu via scroll');
      hideContextMenu();
    });

    // Handle context menu in Two mouse mode
    document.addEventListener('contextmenu', (e) => {
      if (window.mouseMode === "Two") {
        debug.log('UI', 'Preventing default context menu in Two mouse mode');
        e.preventDefault();
      }
    });

    debug.log('INIT', 'Menu initialization completed successfully');
  } catch (error) {
    debug.error('INIT', 'Critical error during initialization', error);
    console.error('Failed to initialize menu system:', error);
  }
});

// Monitor critical UI elements for changes
if (DEBUG.DOM) {
  debug.monitorElement('right-panel');
  debug.monitorElement('chat-window');
}