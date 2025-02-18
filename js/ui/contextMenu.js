// Create context menu element
const contextMenu = document.createElement('div');
contextMenu.className = 'context-menu';
document.body.appendChild(contextMenu);

function showContextMenu(e, username, config) {
  e.preventDefault();
  
  // Position and show context menu
  contextMenu.style.left = `${e.pageX}px`;
  contextMenu.style.top = `${e.pageY}px`;
  
  // Clear previous menu options
  contextMenu.innerHTML = '';
  
  // Add menu options
  if (config.options) {
    config.options.forEach(option => {
      const optionDiv = document.createElement('div');
      optionDiv.className = 'context-menu-option';
      if (option.text === 'Cancel') {
        optionDiv.classList.add('cancel');
      }
      optionDiv.textContent = option.text;
      optionDiv.addEventListener('click', () => {
        option.handler();
        hideContextMenu();
      });
      contextMenu.appendChild(optionDiv);
    });
  }
  
  contextMenu.classList.add('shown');
}

function hideContextMenu() {
  contextMenu.classList.remove('shown');
}

export { showContextMenu, hideContextMenu };