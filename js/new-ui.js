// Dynamically generate new UI slots
document.addEventListener('DOMContentLoaded', () => {
  const newUiContainer = document.getElementById('new-ui');
  if (newUiContainer) {
    // Clear any existing content to avoid duplicates
    newUiContainer.innerHTML = '';
    // Create exactly 21 slots in a robust manner
    for (let i = 1; i <= 21; i++) {
      const slot = document.createElement('div');
      slot.className = 'new-ui-slot';
      // For debugging purposes, add a title with the slot number
      slot.title = `Slot ${i}`;
      newUiContainer.appendChild(slot);
    }
  }
});