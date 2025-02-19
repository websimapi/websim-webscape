import { toggleMenu } from './menuManager.js';

function initializeSpellbook() {
  const spellbookButton = document.querySelector('.icon.inventory');
  const spellbookMenu = document.getElementById('spellbook-menu');
  
  if (!spellbookButton || !spellbookMenu) {
    console.error('Spellbook elements not found');
    return;
  }

  // Create spellbook grid
  const spellbookGrid = spellbookMenu.querySelector('.spellbook-grid');
  if (!spellbookGrid) {
    console.error('Spellbook grid not found');
    return;
  }

  // Clear any existing content
  spellbookGrid.innerHTML = '';

  // Create 64 empty spell slots (8x8 grid)
  for (let i = 0; i < 64; i++) {
    const spellSlot = document.createElement('div');
    spellSlot.className = 'spell-slot';
    spellbookGrid.appendChild(spellSlot);

    // Add hover effect to show spell info
    spellSlot.addEventListener('mouseover', () => {
      const spellInfo = spellbookMenu.querySelector('.spell-info');
      if (spellInfo) {
        spellInfo.textContent = 'Empty spell slot';
      }
    });

    spellSlot.addEventListener('mouseout', () => {
      const spellInfo = spellbookMenu.querySelector('.spell-info');
      if (spellInfo) {
        spellInfo.textContent = '';
      }
    });
  }

  // Toggle spellbook visibility
  spellbookButton.addEventListener('click', () => {
    toggleMenu(spellbookButton, '#spellbook-menu');
  });
}

export { initializeSpellbook };