import { toggleMenu, setDefaultMenu } from './menuManager.js';

function initializeInventory() {
  const chestIcon = document.querySelector('.icon.chest');
  const inventoryContainer = document.getElementById('inventory');

  chestIcon.addEventListener('click', () => {
    toggleMenu(chestIcon, '#inventory');
  });

  // Set inventory as default selected menu on startup
  setDefaultMenu(chestIcon, '#inventory');
}

export { initializeInventory };