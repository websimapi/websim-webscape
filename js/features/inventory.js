import { toggleMenu } from './menuManager.js';

function initializeInventory() {
  // Update selector to target the inventory icon
  const inventoryIcon = document.querySelector('.icon.inventory');
  const inventoryContainer = document.getElementById('inventory');

  if (inventoryIcon && inventoryContainer) {
    inventoryIcon.addEventListener('click', () => {
      toggleMenu(inventoryIcon, '#inventory');
    });
  }
}

export { initializeInventory };