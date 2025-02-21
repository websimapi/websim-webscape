// Create context menu element
const contextMenu = document.createElement('div');
contextMenu.className = 'context-menu';
document.body.appendChild(contextMenu);

function showContextMenu(e, username, onMessage, onRemove) {
  // In Two-mouse mode, left click immediately performs the primary action (Message)
  // but for right-click (contextmenu events) we want to open the dropdown menu.
  if (window.mouseMode === "Two" && e.type !== "contextmenu") {
    if (typeof onMessage === 'function') {
      onMessage();
      return;
    }
  }

  e.preventDefault();
  e.stopPropagation(); // Prevent event bubbling

  // Position context menu - handle both mouse and touch events
  const x = e.pageX || e.clientX;
  const y = e.pageY || e.clientY;

  // Set menu options HTML
  contextMenu.innerHTML = `
    <div class="context-menu-option message">Message ${username}</div>
    <div class="context-menu-option remove">Remove ${username}</div>
    <div class="context-menu-option cancel">Cancel</div>
  `;

  // Position menu and show it
  contextMenu.style.left = `${x}px`;
  contextMenu.style.top = `${y}px`;
  contextMenu.classList.add('shown');

  // Handle option clicks with delegation
  function handleOptionClick(event) {
    event.preventDefault();
    event.stopPropagation();
    
    const option = event.target.closest('.context-menu-option');
    if (!option) return;

    if (option.classList.contains('message') && onMessage) {
      onMessage();
    } else if (option.classList.contains('remove') && onRemove) {
      onRemove();
    }
    
    hideContextMenu();
    contextMenu.removeEventListener('click', handleOptionClick);
  }

  contextMenu.addEventListener('click', handleOptionClick);

  // Auto-hide menu on scroll or click outside
  function hideOnOutsideClick(e) {
    if (!contextMenu.contains(e.target)) {
      hideContextMenu();
      document.removeEventListener('click', hideOnOutsideClick);
    }
  }

  setTimeout(() => {
    document.addEventListener('click', hideOnOutsideClick);
  }, 0);

  document.addEventListener('scroll', hideContextMenu, { once: true });
}

function hideContextMenu() {
  contextMenu.classList.remove('shown');
  contextMenu.style.left = '';
  contextMenu.style.top = '';
}

export { showContextMenu, hideContextMenu };