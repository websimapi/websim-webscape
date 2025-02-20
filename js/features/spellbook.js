import { toggleMenu } from './menuManager.js';

function initializeSpellbook() {
  const spellbookButton = document.querySelector('.icon:nth-child(7)');
  const spellbook = document.getElementById('spellbook');

  // Setup spellbook toggle with menu management
  spellbookButton.addEventListener('click', () => {
    toggleMenu(spellbookButton, '#spellbook');
  });

  // Generate 64 spell slots
  const spellbookContent = spellbook.querySelector('.spellbook-grid');
  
  // Create description box
  const descriptionBox = document.createElement('div');
  descriptionBox.className = 'spellbook-description';
  descriptionBox.textContent = 'Hover over a spell to view its description';
  spellbook.querySelector('.spellbook-content').appendChild(descriptionBox);
  
  // Clear any existing content
  spellbookContent.innerHTML = '';
  
  // Create exactly 64 spell slots
  for (let i = 0; i < 64; i++) {
    const slot = document.createElement('div');
    slot.className = 'spell-slot';
    slot.title = `Spell slot ${i + 1}`;
    
    // Add hover handlers for description
    slot.addEventListener('mouseover', () => {
      // This will be replaced with actual spell descriptions when implemented
      descriptionBox.textContent = `Spell slot ${i + 1} - No spell learned yet`;
    });
    
    slot.addEventListener('mouseout', () => {
      descriptionBox.textContent = 'Hover over a spell to view its description';
    });
    
    spellbookContent.appendChild(slot);
  }
}

export { initializeSpellbook };