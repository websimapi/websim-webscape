// Change to ES module format
import { toggleMenu } from './features/menuManager.js';

function initializeInventory() {
  const chestIcon = document.querySelector('.icon.chest');
  const inventoryContainer = document.getElementById('inventory');

  chestIcon.addEventListener('click', () => {
    toggleMenu(chestIcon, '#inventory');
  });
}

export { initializeInventory };