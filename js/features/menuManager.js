import { DebugLogger, DOMDebug } from '../debug.js';

// Track currently active menu button and panel
let activeButton = null;
let activePanel = null;

// Updated list of menu items with their corresponding panels
const menuItems = {
  'friends-button': '.friends-list',
  'ignore-button': '.ignore-list', 
  'inventory-button': '#inventory',
  'logout-button': '#logout-popup',
  'game-options-button': '#game-options',
  'skills': '#skills-menu',
  'quest': '#quest-journal',
  'music': '#music-menu',
  'spellbook': '#spellbook',
  'worlds': '#worlds-menu'
};

function hideAllPanels() {
  DebugLogger.debug('MENUS', 'Hiding all panels', {
    activeButtonId: activeButton?.id || 'none',
    activePanelId: activePanel?.id || 'none'
  });

  // Hide all panels defined in the menuItems mapping
  Object.entries(menuItems).forEach(([buttonKey, panelSelector]) => {
    const panel = document.querySelector(panelSelector);
    if (panel) {
      panel.classList.add('hidden');
      if (panel.classList.contains('shown')) {
        panel.classList.remove('shown');
      }
      DebugLogger.debug('MENUS', `Hidden panel: ${panelSelector}`, {
        classes: Array.from(panel.classList)
      });
    } else {
      DebugLogger.warn('MENUS', `Panel not found: ${panelSelector}`);
    }
  });

  // Remove selected state from all buttons
  const allButtons = document.querySelectorAll('.bottom-icon, .icon');
  allButtons.forEach(button => {
    button.classList.remove('selected');
    DebugLogger.debug('MENUS', 'Removed selected state from button', {
      buttonId: button.id || 'unnamed-button',
      classes: Array.from(button.classList)
    });
  });
}

function toggleMenu(button, panelSelector) {
  DebugLogger.info('MENUS', 'Toggle menu requested', {
    buttonId: button.id || 'unnamed-button',
    panelSelector,
    currentActiveButton: activeButton?.id || 'none',
    currentActivePanel: activePanel?.id || 'none'
  });

  const panel = DOMDebug.checkElement(panelSelector, 'Menu Panel');
  if (!panel) {
    DebugLogger.error('MENUS', `Panel not found for selector: ${panelSelector}`);
    return;
  }
  
  // If clicking the same button that's already active
  if (button === activeButton) {
    DebugLogger.debug('MENUS', 'Toggling currently active menu');
    
    // Toggle visibility
    if (panel.classList.contains('hidden') || !panel.classList.contains('shown')) {
      DebugLogger.debug('MENUS', 'Showing previously hidden panel');
      hideAllPanels();
      button.classList.add('selected');
      panel.classList.remove('hidden');
      if (panelSelector.startsWith('#') || panelSelector.includes('friends') || 
          panelSelector.includes('ignore') || panelSelector.includes('worlds')) {
        panel.classList.add('shown');
      }
    } else {
      DebugLogger.debug('MENUS', 'Hiding currently shown panel');
      hideAllPanels();
      activeButton = null;
      activePanel = null;
      return;
    }
  } else {
    DebugLogger.debug('MENUS', 'Switching to different menu');
    
    // Hide all other panels first
    hideAllPanels();

    // Show the selected panel and mark button as selected
    button.classList.add('selected');
    panel.classList.remove('hidden');
    if (panelSelector.startsWith('#') || panelSelector.includes('friends') || 
        panelSelector.includes('ignore') || panelSelector.includes('worlds')) {
      panel.classList.add('shown');
    }

    DebugLogger.debug('MENUS', 'New panel shown', {
      buttonClasses: Array.from(button.classList),
      panelClasses: Array.from(panel.classList)
    });
  }

  activeButton = button;
  activePanel = panel;

  DebugLogger.info('MENUS', 'Menu toggle completed', {
    activeButtonId: activeButton?.id || 'unnamed-button',
    activePanelId: activePanel?.id || 'none',
    panelClasses: Array.from(panel.classList)
  });

  // Check final state
  DOMDebug.checkMenuState(panelSelector, 'After Toggle');
}

export { hideAllPanels, toggleMenu };