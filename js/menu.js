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
import { DebugLogger, DOMDebug, BrowserDebug } from './debug.js';

document.addEventListener('DOMContentLoaded', () => {
  // Log browser compatibility information
  const browserInfo = BrowserDebug.checkCompatibility();
  DebugLogger.info('INIT', 'Starting application initialization', { browserInfo });

  try {
    // Check critical UI elements
    DOMDebug.checkElement('.bottom-icon:nth-child(4)', 'Default Button');
    DOMDebug.checkElement('#game-screen', 'Game Screen');
    DOMDebug.checkElement('#right-panel', 'Right Panel');

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
        DebugLogger.debug('INIT', `Initializing ${feature.name}`);
        feature.init();
        DebugLogger.info('INIT', `Successfully initialized ${feature.name}`);
      } catch (error) {
        DebugLogger.error('INIT', `Failed to initialize ${feature.name}`, { error });
      }
    });

    // Set default menu selection
    const defaultButton = document.querySelector('.bottom-icon:nth-child(4)');
    if (defaultButton) {
      defaultButton.click();
      DebugLogger.debug('INIT', 'Default button clicked');
    } else {
      DebugLogger.error('INIT', 'Default button not found');
    }

    // Global click handler setup
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.context-menu') && !e.target.closest('.player-name')) {
        hideContextMenu();
        DebugLogger.debug('EVENTS', 'Global click: hiding context menu');
      }
    });

    // Close context menu on scroll
    document.addEventListener('scroll', () => {
      hideContextMenu();
      DebugLogger.debug('EVENTS', 'Scroll event: hiding context menu');
    });

    // Handle context menu in Two mouse mode
    document.addEventListener('contextmenu', (e) => {
      if (window.mouseMode === "Two") {
        e.preventDefault();
        DebugLogger.debug('EVENTS', 'Context menu prevented in Two mouse mode');
      }
    });

    DebugLogger.info('INIT', 'Application initialization completed successfully');

  } catch (error) {
    DebugLogger.error('INIT', 'Critical error during initialization', { error });
  }
});

// Add error handling for dynamic imports
window.addEventListener('error', (event) => {
  DebugLogger.error('INIT', 'Script loading error', {
    message: event.message,
    filename: event.filename,
    lineNumber: event.lineno,
    colNumber: event.colno,
    error: event.error
  });
});