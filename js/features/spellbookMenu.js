import { toggleMenu } from './menuManager.js';
import { addTooltip } from '../ui/tooltips.js';

function initializeSpellbookMenu() {
  const spellbookButton = document.querySelector('.icon.spellbook');
  const spellbookMenu = document.getElementById('spellbook-menu');
  
  if (!spellbookButton || !spellbookMenu) return;

  // Setup spellbook toggle
  spellbookButton.addEventListener('click', () => {
    toggleMenu(spellbookButton, '#spellbook-menu');
  });

  const spellbookGrid = spellbookMenu.querySelector('.spellbook-grid');

  // Generate 64 spell slots (8x8 grid)
  for (let i = 0; i < 64; i++) {
    const spellSlot = document.createElement('div');
    spellSlot.className = 'spell-slot locked';
    
    // Add some visual variety - every 3rd slot has charges
    if (i % 3 === 0) {
      spellSlot.classList.add('has-charges');
    }
    
    // Add hover tooltip with spell info
    addTooltip(spellSlot, `Spell ${i + 1}\nLevel Required: ${Math.floor(Math.random() * 99) + 1}`);
    
    spellbookGrid.appendChild(spellSlot);
  }
}

export { initializeSpellbookMenu };