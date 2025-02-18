// Create context menu element
const contextMenu = document.createElement('div');
contextMenu.className = 'context-menu';
document.body.appendChild(contextMenu);

function showContextMenu(e, username, onMessage, onRemove, customOptions = null) {
  e.preventDefault();
  
  // Position and show context menu
  contextMenu.style.left = `${e.pageX}px`;
  contextMenu.style.top = `${e.pageY}px`;
  
  // Set menu options based on whether custom options are provided
  if (customOptions) {
    contextMenu.innerHTML = customOptions.map(option => 
      `<div class="context-menu-option ${option.text.toLowerCase().replace(/\s+/g, '-')}">${option.text}</div>`
    ).join('');
    
    // Add click handlers for custom options
    customOptions.forEach(option => {
      const optionEl = contextMenu.querySelector(`.${option.text.toLowerCase().replace(/\s+/g, '-')}`);
      optionEl.addEventListener('click', () => {
        option.action();
        contextMenu.classList.remove('shown');
      });
    });
  } else {
    // Set default menu options
    contextMenu.innerHTML = `
      <div class="context-menu-option message">Message ${username}</div>
      <div class="context-menu-option remove">Remove ${username}</div>
      <div class="context-menu-option cancel">Cancel</div>
    `;
    
    // Add click handlers for default options
    const messageOption = contextMenu.querySelector('.message');
    const removeOption = contextMenu.querySelector('.remove');
    const cancelOption = contextMenu.querySelector('.cancel');
    
    messageOption.addEventListener('click', () => {
      onMessage && onMessage();
      contextMenu.classList.remove('shown');
    });
    
    removeOption.addEventListener('click', () => {
      onRemove && onRemove();
      contextMenu.classList.remove('shown');
    });
    
    cancelOption.addEventListener('click', () => {
      contextMenu.classList.remove('shown');
    });
  }
  
  contextMenu.classList.add('shown');
}

function hideContextMenu() {
  contextMenu.classList.remove('shown');
}

export { showContextMenu, hideContextMenu };