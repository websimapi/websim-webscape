import { toggleMenu } from './menuManager.js';

function initializeSpellbookUI() {
  const spellbookButton = document.querySelector('.bottom-icon.spellbook');
  const spellbookPanel = document.getElementById('spellbook');
  if (!spellbookPanel || !spellbookButton) return;

  // When the spellbook button is clicked, toggle the spellbook panel.
  spellbookButton.addEventListener('click', () => {
    toggleMenu(spellbookButton, '#spellbook');
  });

  // Generate 64 spell slots only once.
  if (!spellbookPanel.hasAttribute('data-initialized')) {
    spellbookPanel.innerHTML = ''; // Clear any previous content.
    for (let i = 1; i <= 64; i++) {
      const slot = document.createElement('div');
      slot.className = 'spellbook-slot';
      slot.title = `Spell Slot ${i}`;
      // (Optional: add event listeners or further UI details here)
      spellbookPanel.appendChild(slot);
    }
    spellbookPanel.setAttribute('data-initialized', 'true');
  }
}

export { initializeSpellbookUI };