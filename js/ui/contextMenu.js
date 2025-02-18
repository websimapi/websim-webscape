// Create context menu element
const contextMenu = document.createElement('div');
contextMenu.className = 'context-menu';
document.body.appendChild(contextMenu);

function showContextMenu(e, username, onMessage, onRemove) {
  e.preventDefault();
  
  // Position and show context menu
  contextMenu.style.left = `${e.pageX}px`;
  contextMenu.style.top = `${e.pageY}px`;
  
  // Set menu options
  contextMenu.innerHTML = `
    <div class="context-menu-option message">Message ${username}</div>
    <div class="context-menu-option remove">Remove ${username}</div>
    <div class="context-menu-option cancel">Cancel</div>
  `;
  
  contextMenu.classList.add('shown');
  
  // Add click handlers for menu options with stopPropagation for Firefox compatibility
  const messageOption = contextMenu.querySelector('.message');
  const removeOption = contextMenu.querySelector('.remove');
  const cancelOption = contextMenu.querySelector('.cancel');
  
  messageOption.addEventListener('click', (ev) => {
    ev.stopPropagation();
    onMessage && onMessage();
    contextMenu.classList.remove('shown');
  });
  
  removeOption.addEventListener('click', (ev) => {
    ev.stopPropagation();
    onRemove && onRemove();
    contextMenu.classList.remove('shown');
  });
  
  cancelOption.addEventListener('click', (ev) => {
    ev.stopPropagation();
    contextMenu.classList.remove('shown');
  });
}

function hideContextMenu() {
  contextMenu.classList.remove('shown');
}

export { showContextMenu, hideContextMenu };