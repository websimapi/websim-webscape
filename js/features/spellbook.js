document.addEventListener('DOMContentLoaded', () => {
  // Create Spellbook panel if it doesn't exist yet
  let spellbookPanel = document.getElementById('spellbook');
  if (!spellbookPanel) {
    spellbookPanel = document.createElement('div');
    spellbookPanel.id = 'spellbook';
    spellbookPanel.className = 'hidden';
    // Append the spellbook panel to the right-panel container
    const rightPanel = document.getElementById('right-panel');
    rightPanel.appendChild(spellbookPanel);
  }

  // Function to populate the spellbook with 64 slots (8 columns x 8 rows)
  function populateSpellbook() {
    if (spellbookPanel.childElementCount === 0) {
      for (let i = 1; i <= 64; i++) {
        const slot = document.createElement('div');
        slot.className = 'spellbook-slot';
        // For debugging, show the slot number on title
        slot.title = `Slot ${i}`;
        spellbookPanel.appendChild(slot);
      }
    }
  }

  // Function to toggle the visibility of the spellbook panel
  function toggleSpellbook() {
    if (spellbookPanel.classList.contains('hidden')) {
      populateSpellbook();
      spellbookPanel.classList.remove('hidden');
      spellbookIcon.classList.add('selected');
    } else {
      spellbookPanel.classList.add('hidden');
      spellbookIcon.classList.remove('selected');
    }
  }

  // Create and append a new bottom icon for the Spellbook (the new 7th button)
  const bottomIconsContainer = document.getElementById('bottom-icons');
  if (bottomIconsContainer) {
    const spellbookIcon = document.createElement('div');
    spellbookIcon.className = 'bottom-icon spellbook';
    // Eldritch Spellbook icon SVG – a detailed rendition using inline SVG
    spellbookIcon.innerHTML = `
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style="display: block; margin: auto;">
        <rect x="2" y="3" width="16" height="18" rx="2" ry="2" fill="#4b0082" stroke="#fff" stroke-width="1"/>
        <path d="M2,3 L10,11 L2,19" fill="none" stroke="#dda0dd" stroke-width="1"/>
        <polygon points="10,5 14,9 10,13" fill="#dda0dd"/>
      </svg>
    `;
    // Append the new spellbook icon as the last bottom-icon (making it the 7th button)
    bottomIconsContainer.appendChild(spellbookIcon);
    spellbookIcon.addEventListener('click', toggleSpellbook);
  }
});