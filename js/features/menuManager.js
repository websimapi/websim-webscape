// Track currently active menu button and panel
let activeButton = null;
let activePanel = null;

// List of menu items with their corresponding panels
const menuItems = {
  'friends-button': '.friends-list',
  'ignore-button': '.ignore-list',
  'inventory-button': '#inventory',
  'logout-button': '#logout-popup'
};

function hideAllPanels() {
  // Hide all panels
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

  activeButton = null;
  activePanel = null;
}

function toggleMenu(button, panelSelector) {
  const panel = document.querySelector(panelSelector);
  
  // If clicking the same button that's already active
  if (button === activeButton) {
    button.classList.remove('selected');
    panel.classList.add('hidden');
    if (panel.classList.contains('shown')) {
      panel.classList.remove('shown');
    }
    activeButton = null;
    activePanel = null;
    return;
  }

  // Hide all other panels first
  hideAllPanels();

  // Show the selected panel
  button.classList.add('selected');
  panel.classList.remove('hidden');
  if (panelSelector.includes('friends') || panelSelector.includes('ignore')) {
    panel.classList.add('shown');
  }

  activeButton = button;
  activePanel = panel;
}

function setDefaultMenu(button, panelSelector) {
  const panel = document.querySelector(panelSelector);
  
  // Set initial state
  button.classList.add('selected');
  panel.classList.remove('hidden');
  
  activeButton = button;
  activePanel = panel;
}

export { hideAllPanels, toggleMenu, setDefaultMenu };