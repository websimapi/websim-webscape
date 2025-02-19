import { toggleMenu } from './menuManager.js';

function initializeSpellbookMenu() {
  const spellbookButton = document.querySelector('.icon.spellbook');
  const spellbookMenu = document.getElementById('spellbook-menu');
  const spellbookContent = spellbookMenu.querySelector('.spellbook-content');
  const spellGrid = document.createElement('div');
  spellGrid.className = 'spellbook-grid';

  // Create 64 spell slots (8x8 grid)
  for (let i = 0; i < 64; i++) {
    const spellSlot = document.createElement('div');
    spellSlot.className = 'spell-slot empty';
    spellSlot.title = `Spell slot ${i + 1}`;
    spellGrid.appendChild(spellSlot);
  }

  spellbookContent.appendChild(spellGrid);

  // Toggle menu visibility
  spellbookButton.addEventListener('click', () => {
    toggleMenu(spellbookButton, '#spellbook-menu');
  });
}

export { initializeSpellbookMenu };