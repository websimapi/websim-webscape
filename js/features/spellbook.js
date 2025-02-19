import { toggleMenu } from './menuManager.js';

function initializeSpellbook() {
  const spellbookButton = document.querySelector('.icon.inventory');
  const spellbook = document.getElementById('spellbook');

  // Setup spellbook toggle with menu management
  spellbookButton.addEventListener('click', () => {
    toggleMenu(spellbookButton, '#spellbook');
  });

  // Generate 64 spell slots
  const spellbookContent = spellbook.querySelector('.spellbook-grid');
  
  // Clear any existing content
  spellbookContent.innerHTML = '';
  
  // Create exactly 64 spell slots
  for (let i = 0; i < 64; i++) {
    const slot = document.createElement('div');
    slot.className = 'spell-slot';
    slot.title = `Spell slot ${i + 1}`;
    spellbookContent.appendChild(slot);
  }
}

export { initializeSpellbook };