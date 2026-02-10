import { toggleMenu } from './menuManager.js';

function renderInventory() {
  const panel = document.createElement('div');
  panel.id = 'inventory';
  panel.className = 'hidden';
  document.getElementById('right-panel').appendChild(panel);
}

function initializeInventory() {
  renderInventory();

  const chestIcon = document.querySelector('.icon.chest');
  const inventoryContainer = document.getElementById('inventory');

  chestIcon.addEventListener('click', () => {
    toggleMenu(chestIcon, '#inventory');
  });

  // Generate inventory slots
  if (inventoryContainer) {
    // Clear any existing content to avoid duplicates
    inventoryContainer.innerHTML = '';
    // Create exactly 28 inventory slots in a robust manner
    for (let i = 1; i <= 28; i++) {
      const slot = document.createElement('div');
      slot.className = 'inventory-slot';
      // For debugging purposes, add a title with the slot number
      slot.title = `Slot ${i}`;
      inventoryContainer.appendChild(slot);
    }
  }
}

export { initializeInventory };