// Dynamically generate inventory slots to ensure a consistent total of 28 slots
document.addEventListener('DOMContentLoaded', () => {
  const inventoryContainer = document.getElementById('inventory');
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
});