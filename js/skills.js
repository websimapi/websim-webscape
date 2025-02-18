// Dynamically generate skill slots to ensure a consistent total of 21 slots
document.addEventListener('DOMContentLoaded', () => {
  const skillsContainer = document.getElementById('skills-menu');
  if (skillsContainer) {
    // Clear any existing content to avoid duplicates
    skillsContainer.innerHTML = '';
    // Create exactly 21 skill slots in a robust manner
    for (let i = 1; i <= 21; i++) {
      const slot = document.createElement('div');
      slot.className = 'skill-slot';
      // For debugging purposes, add a title with the slot number
      slot.title = `Skill ${i}`;
      skillsContainer.appendChild(slot);
    }
  }
});