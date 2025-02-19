function initializeEldritchBook() {
  const bookPanel = document.getElementById('eldritch-book');
  if (!bookPanel) return;
  // Clear any existing content
  bookPanel.innerHTML = '';

  // Create the grid container that will hold 64 slots (8 per row).
  const gridContainer = document.createElement('div');
  gridContainer.className = 'book-grid';
  for (let i = 1; i <= 64; i++) {
    const slot = document.createElement('div');
    slot.className = 'book-slot';
    // For debugging purposes, show the slot number as a tooltip.
    slot.title = `Slot ${i}`;
    gridContainer.appendChild(slot);
  }

  // Create the bottom container that will occupy the bottom 20% of the panel.
  const bottomContainer = document.createElement('div');
  bottomContainer.className = 'book-bottom';
  // (Optional) Add any desired text or leave blank.
  bottomContainer.textContent = "";

  // Append the grid and bottom container into the main panel.
  bookPanel.appendChild(gridContainer);
  bookPanel.appendChild(bottomContainer);
}

export { initializeEldritchBook };