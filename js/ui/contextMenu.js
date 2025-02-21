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

  // Position and show context menu based on event coordinates.
  contextMenu.style.left = `${e.pageX}px`;
  contextMenu.style.top = `${e.pageY}px`;

  // Set menu options HTML.
  contextMenu.innerHTML = `
    <div class="context-menu-option message">Message ${username}</div>
    <div class="context-menu-option remove">Remove ${username}</div>
    <div class="context-menu-option cancel">Cancel</div>
  `;

  contextMenu.classList.add('shown');

  const messageOption = contextMenu.querySelector('.message');
  const removeOption = contextMenu.querySelector('.remove');
  const cancelOption = contextMenu.querySelector('.cancel');

  // Firefox needs mousedown instead of click for proper right-click menu handling
  const eventType = 'mousedown';

  messageOption.addEventListener(eventType, (ev) => {
    ev.preventDefault();
    ev.stopPropagation();
    hideContextMenu();
    if (onMessage) onMessage();
  }, { once: true });

  removeOption.addEventListener(eventType, (ev) => {
    ev.preventDefault(); 
    ev.stopPropagation();
    hideContextMenu();
    if (onRemove) onRemove();
  }, { once: true });

  cancelOption.addEventListener(eventType, (ev) => {
    ev.preventDefault();
    ev.stopPropagation();
    hideContextMenu();
  }, { once: true });

  // Close menu when clicking outside
  document.addEventListener('mousedown', (ev) => {
    if (!contextMenu.contains(ev.target)) {
      hideContextMenu();
    }
  }, { once: true });
}

function hideContextMenu() {
  contextMenu.classList.remove('shown');
}

export { showContextMenu, hideContextMenu };