function setupOverlay(overlay, input) {
  // Close overlay when clicking outside
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      overlay.classList.remove('shown');
    }
  });

  // Handle input submission
  if (input) {
    input.addEventListener('keypress', async (e) => {
      if (e.key === 'Enter' && input.value.trim()) {
        const name = input.value.trim();
        const event = new CustomEvent('overlay-submit', { 
          detail: { name, overlay }
        });
        document.dispatchEvent(event);
        overlay.classList.remove('shown');
      }
    });
  }
}

export { setupOverlay };