// Dynamically generate stats slots to ensure a consistent total of 21 slots
document.addEventListener('DOMContentLoaded', () => {
  const statsContainer = document.getElementById('stats-menu');
  if (statsContainer) {
    // Clear any existing content to avoid duplicates
    statsContainer.innerHTML = '';
    // Create exactly 21 stats slots in a robust manner
    for (let i = 1; i <= 21; i++) {
      const slot = document.createElement('div');
      slot.className = 'stats-slot';
      // For debugging purposes, add a title with the slot number
      slot.title = `Skill ${i}`;
      statsContainer.appendChild(slot);
    }
  }
});