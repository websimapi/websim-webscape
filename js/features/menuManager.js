// Track currently active menu button and panel
let activeButton = null;
let activePanel = null;

// List of menu items with their corresponding panels, updated to include game options.
const menuItems = {
  'friends-button': '.friends-list',
  'ignore-button': '.ignore-list',
  'inventory-button': '#inventory',
  'logout-button': '#logout-popup',
  'game-options-button': '#game-options'
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

  // Clear active tracking
  activeButton = null;
  activePanel = null;
}

function toggleMenu(button, panelSelector) {
  const panel = document.querySelector(panelSelector);
  
  // If clicking the same button that's already active, just hide everything
  if (button === activeButton) {
    hideAllPanels();
    return;
  }

  // Hide all other panels first
  hideAllPanels();

  // Show the selected panel and mark button as selected
  button.classList.add('selected');
  panel.classList.remove('hidden');
  if (panelSelector.includes('friends') || panelSelector.includes('ignore') || panelSelector.includes('game-options')) {
    panel.classList.add('shown');
  }

  // Update active tracking
  activeButton = button;
  activePanel = panel;
}

// Add click handler to hide menus when clicking outside
document.addEventListener('click', (e) => {
  // If clicking outside any menu button or panel
  if (!e.target.closest('.bottom-icon') && 
      !e.target.closest('.icon') && 
      !e.target.closest('.friends-list') &&
      !e.target.closest('.ignore-list') &&
      !e.target.closest('#game-options') &&
      !e.target.closest('#logout-popup') &&
      !e.target.closest('#inventory')) {
    hideAllPanels();
  }
});

export { hideAllPanels, toggleMenu };