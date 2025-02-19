// Track currently active menu button and panel
let activeButton = null;
let activePanel = null;

// Updated list of menu items with their corresponding panels, including the new Music panel.
const menuItems = {
  'friends-button': '.friends-list',
  'ignore-button': '.ignore-list', 
  'inventory-button': '#inventory',
  'logout-button': '#logout-popup',
  'game-options-button': '#game-options',
  'skills': '#skills-menu',
  'quest': '#quest-journal',
  'music': '#music-menu'
};

function hideAllPanels() {
  // Hide all panels defined in the menuItems mapping.
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
    // Keep current selection but ensure only this button remains selected
    hideAllPanels();
    button.classList.add('selected');
    panel.classList.remove('hidden');
    if (
      panelSelector.includes('friends') ||
      panelSelector.includes('ignore') ||
      panelSelector.includes('game-options') ||
      panelSelector.includes('quest') ||
      panelSelector.includes('skills') ||
      panelSelector.includes('music')
    ) {
      panel.classList.add('shown');
    }
    activeButton = button;
    activePanel = panel;
    return;
  }

  // Hide all other panels first
  hideAllPanels();

  // Show the selected panel and mark button as selected
  button.classList.add('selected');
  panel.classList.remove('hidden');
  if (
    panelSelector.includes('friends') ||
    panelSelector.includes('ignore') ||
    panelSelector.includes('game-options') ||
    panelSelector.includes('quest') ||
    panelSelector.includes('skills') ||
    panelSelector.includes('music')
  ) {
    panel.classList.add('shown');
  }

  activeButton = button;
  activePanel = panel;
}

export { hideAllPanels, toggleMenu };