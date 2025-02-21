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
  'worlds': '#worlds-menu' // Add worlds menu to the list
};

function hideAllPanels() {
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
}

function toggleMenu(button, panelSelector) {
  const panel = document.querySelector(panelSelector);
  
  // If clicking the same button that's already active
  if (button === activeButton) {
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
      activeButton = null;
      activePanel = null;
      return;
    }
  } else {
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
}

export { hideAllPanels, toggleMenu };