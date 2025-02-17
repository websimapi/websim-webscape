// Generate inventory slots dynamically
const inventory = document.getElementById('inventory');
const TOTAL_SLOTS = 28; // Define constant for total slots

// Clear any existing slots
inventory.innerHTML = '';

// Generate all slots programmatically
for (let i = 0; i < TOTAL_SLOTS; i++) {
  const slot = document.createElement('div');
  slot.className = 'inventory-slot';
  slot.dataset.slotNumber = i + 1; // Add slot number as data attribute
  inventory.appendChild(slot);
}