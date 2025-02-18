// Create context menu element
const contextMenu = document.createElement('div');
contextMenu.className = 'context-menu';
document.body.appendChild(contextMenu);

function showContextMenu(e, username, onMessage, onRemove) {
  e.preventDefault();

  // Position and show context menu based on event coordinates
  contextMenu.style.left = `${e.pageX}px`;
  contextMenu.style.top = `${e.pageY}px`;

  // Set menu options HTML
  contextMenu.innerHTML = `
    <div class="context-menu-option message">Message ${username}</div>
    <div class="context-menu-option remove">Remove ${username}</div>
    <div class="context-menu-option cancel">Cancel</div>
  `;
  
  contextMenu.classList.add('shown');

  // For Firefox compatibility, use 'mouseup' instead of 'click'
  const isFirefox = typeof InstallTrigger !== 'undefined';
  const eventType = isFirefox ? 'mouseup' : 'click';

  const messageOption = contextMenu.querySelector('.message');
  const removeOption = contextMenu.querySelector('.remove');
  const cancelOption = contextMenu.querySelector('.cancel');

  messageOption.addEventListener(eventType, (ev) => {
    ev.stopPropagation();
    if (onMessage) onMessage();
    contextMenu.classList.remove('shown');
  }, { once: true });

  removeOption.addEventListener(eventType, (ev) => {
    ev.stopPropagation();
    if (onRemove) onRemove();
    contextMenu.classList.remove('shown');
  }, { once: true });

  cancelOption.addEventListener(eventType, (ev) => {
    ev.stopPropagation();
    contextMenu.classList.remove('shown');
  }, { once: true });
}

function hideContextMenu() {
  contextMenu.classList.remove('shown');
}

export { showContextMenu, hideContextMenu };