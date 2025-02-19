import { toggleMenu } from './menuManager.js';

function initializeSpellbook() {
  const spellbookButton = document.querySelector('.bottom-icon.spellbook');
  const spellbookMenu = document.getElementById('spellbook-menu');
  const spellSlotsContainer = spellbookMenu.querySelector('.spell-slots');

  function generateSpellSlots() {
    spellSlotsContainer.innerHTML = '';
    for (let i = 1; i <= 64; i++) {
      const slot = document.createElement('div');
      slot.className = 'spell-slot';
      slot.title = `Spell Slot ${i}`;
      spellSlotsContainer.appendChild(slot);
    }
  }
  generateSpellSlots();

  spellbookButton.addEventListener('click', () => {
    toggleMenu(spellbookButton, '#spellbook-menu');
  });
}

export { initializeSpellbook };