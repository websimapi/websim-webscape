// Create context menu element
const contextMenu = document.createElement('div');
contextMenu.className = 'context-menu';
document.body.appendChild(contextMenu);

function showContextMenu(e, username, onMessage, onRemove) {
  e.preventDefault();
  
  contextMenu.style.left = `${e.pageX}px`;
  contextMenu.style.top = `${e.pageY}px`;

  contextMenu.innerHTML = `
    <div class="context-menu-option message">Message ${username}</div>
    <div class="context-menu-option remove">Remove ${username}</div>
    <div class="context-menu-option cancel">Cancel</div>
  `;
  
  contextMenu.classList.add('shown');

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

function handleMouseContextMenu(e, username, onMessage, onRemove) {
  const mouseMode = localStorage.getItem('mouseMode') || 'two';
  if (mouseMode === 'two') {
    if (e.button === 0) {
      // In Two mouse mode, left click immediately triggers the first action (Message)
      e.preventDefault();
      if (onMessage) onMessage();
    } else if (e.button === 2) {
      // Right click shows the full sub menu
      e.preventDefault();
      showContextMenu(e, username, onMessage, onRemove);
    }
  } else {
    // In One mouse mode, regardless of which button is pressed, always open the drop down
    e.preventDefault();
    showContextMenu(e, username, onMessage, onRemove);
  }
}

export { showContextMenu, hideContextMenu, handleMouseContextMenu };