// Updated context menu module: always use 'click' events, ensuring compatibility across browsers.
const contextMenu = document.createElement('div');
contextMenu.className = 'context-menu';
document.body.appendChild(contextMenu);

function showContextMenu(e, username, onMessage, onRemove) {
  e.preventDefault();

  // Position the context menu at the event coordinates.
  contextMenu.style.left = `${e.pageX}px`;
  contextMenu.style.top = `${e.pageY}px`;

  // Populate the menu with options.
  contextMenu.innerHTML = `
    <div class="context-menu-option message">Message ${username}</div>
    <div class="context-menu-option remove">Remove ${username}</div>
    <div class="context-menu-option cancel">Cancel</div>
  `;
  
  contextMenu.classList.add('shown');

  // Always use 'click' events for consistent handling.
  const messageOption = contextMenu.querySelector('.message');
  const removeOption = contextMenu.querySelector('.remove');
  const cancelOption = contextMenu.querySelector('.cancel');

  messageOption.addEventListener('click', (ev) => {
    ev.stopPropagation();
    if (onMessage) onMessage();
    contextMenu.classList.remove('shown');
  }, { once: true });

  removeOption.addEventListener('click', (ev) => {
    ev.stopPropagation();
    if (onRemove) onRemove();
    contextMenu.classList.remove('shown');
  }, { once: true });

  cancelOption.addEventListener('click', (ev) => {
    ev.stopPropagation();
    contextMenu.classList.remove('shown');
  }, { once: true });
}

function hideContextMenu() {
  contextMenu.classList.remove('shown');
}

export { showContextMenu, hideContextMenu };