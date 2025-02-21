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
  console.log('[Debug] Hiding all panels');
  try {
    // Hide all panels defined in the menuItems mapping
    Object.values(menuItems).forEach(panelSelector => {
      const panel = document.querySelector(panelSelector);
      if (panel) {
        panel.classList.add('hidden');
        if (panel.classList.contains('shown')) {
          panel.classList.remove('shown');
        }
      }
    });

    // Remove selected state from all buttons
    const allButtons = document.querySelectorAll('.bottom-icon, .icon');
    allButtons.forEach(button => {
      button.classList.remove('selected');
    });

    // Reset active states
    activeButton = null;
    activePanel = null;
    console.log('[Debug] All panels hidden successfully');
  } catch (error) {
    console.error('[Debug] Error in hideAllPanels:', error);
  }
}

function toggleMenu(button, panelSelector) {
  console.log('[Debug] Toggle menu called with:', { button, panelSelector });
  try {
    // Basic input validation
    if (!button || !panelSelector) {
      console.error('[Debug] Invalid arguments:', { button, panelSelector });
      return;
    }

    const panel = document.querySelector(panelSelector);
    if (!panel) {
      console.error('[Debug] Panel not found:', panelSelector);
      return;
    }
    
    // If clicking the same button that's already active
    if (button === activeButton) {
      console.log('[Debug] Toggling currently active button');
      // Toggle visibility
      if (panel.classList.contains('hidden') || !panel.classList.contains('shown')) {
        hideAllPanels();
        button.classList.add('selected');
        panel.classList.remove('hidden');
        if (panelSelector.startsWith('#') || panelSelector.includes('friends') || 
            panelSelector.includes('ignore') || panelSelector.includes('worlds')) {
          panel.classList.add('shown');
        }
      } else {
        hideAllPanels();
        return;
      }
    } else {
      console.log('[Debug] Switching to new panel');
      // Hide all other panels first
      hideAllPanels();

      // Show the selected panel and mark button as selected
      button.classList.add('selected');
      panel.classList.remove('hidden');
      if (panelSelector.startsWith('#') || panelSelector.includes('friends') || 
          panelSelector.includes('ignore') || panelSelector.includes('worlds')) {
        panel.classList.add('shown');
      }
    }

    activeButton = button;
    activePanel = panel;
    console.log('[Debug] Menu toggle completed successfully');

  } catch (error) {
    console.error('[Debug] Error in toggleMenu:', error);
  }

  // Prevent event bubbling
  if (event) {
    try {
      event.stopPropagation();
    } catch (error) {
      console.error('[Debug] Error stopping event propagation:', error);
    }
  }
}

// Add global click handler to close menus when clicking outside
document.addEventListener('click', (event) => {
  console.log('[Debug] Global click handler triggered');
  try {
    if (!event.target.closest('.bottom-icon') && 
        !event.target.closest('.icon') && 
        !event.target.closest('.friends-list') && 
        !event.target.closest('.ignore-list') && 
        !event.target.closest('#quest-journal') && 
        !event.target.closest('#game-options') && 
        !event.target.closest('#music-menu') && 
        !event.target.closest('#skills-menu') && 
        !event.target.closest('#spellbook') && 
        !event.target.closest('#worlds-menu')) {
      hideAllPanels();
    }
  } catch (error) {
    console.error('[Debug] Error in global click handler:', error);
  }
}, true);

export { hideAllPanels, toggleMenu };