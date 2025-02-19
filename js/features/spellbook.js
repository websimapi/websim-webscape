import { toggleMenu } from './menuManager.js';

function initializeSpellbook() {
  const spellbookButton = document.querySelector('.icon.inventory');
  const spellbookMenu = document.getElementById('spellbook-menu');
  const spellbookContent = spellbookMenu.querySelector('.spellbook-content');
  const spellbookGrid = spellbookContent.querySelector('.spellbook-grid');
  const spellInfo = spellbookContent.querySelector('.spell-info');

  // Create 64 empty spell slots
  for (let i = 0; i < 64; i++) {
    const spellSlot = document.createElement('div');
    spellSlot.className = 'spell-slot';
    spellbookGrid.appendChild(spellSlot);

    // Add hover effect to show spell info
    spellSlot.addEventListener('mouseover', () => {
      spellInfo.textContent = 'Empty spell slot';
    });

    spellSlot.addEventListener('mouseout', () => {
      spellInfo.textContent = '';
    });
  }

  // Toggle spellbook visibility
  spellbookButton.addEventListener('click', () => {
    toggleMenu(spellbookButton, '#spellbook-menu');
  });
}

export { initializeSpellbook };