// Initialize WebSocket connection
const room = new WebsimSocket();

// Get the username element
const usernameElement = document.getElementById('current-username');

// Update username when connection is established
room.party.subscribe((peers) => {
  const currentUser = room.party.client;
  if (currentUser && currentUser.username) {
    usernameElement.textContent = currentUser.username;
  }
});

// Create a reusable context menu element
const chatContextMenu = document.createElement('div');
chatContextMenu.className = 'context-menu';
document.body.appendChild(chatContextMenu);

function showChatContextMenu(e, username) {
  e.preventDefault();
  e.stopPropagation();
  
  // Hide any existing context menus
  hideAllContextMenus();
  
  // Position and show context menu
  chatContextMenu.style.left = `${e.pageX}px`;
  chatContextMenu.style.top = `${e.pageY}px`;
  
  // Set menu options
  chatContextMenu.innerHTML = `
    <div class="context-menu-option add-friend">Add Friend ${username}</div>
    <div class="context-menu-option add-ignore">Add Ignore ${username}</div>
    <div class="context-menu-option cancel">Cancel</div>
  `;
  
  chatContextMenu.classList.add('shown');
  
  // Add click handlers for menu options
  chatContextMenu.querySelector('.add-friend').addEventListener('click', () => {
    const newFriend = document.createElement('div');
    newFriend.className = 'list-entry';
    newFriend.innerHTML = `
      <span class="player-name">${username}</span>
      <span class="world-status offline">Offline</span>
    `;
    document.querySelector('.friends-list .list-container').appendChild(newFriend);
    hideAllContextMenus();
  });
  
  chatContextMenu.querySelector('.add-ignore').addEventListener('click', () => {
    const newIgnore = document.createElement('div');
    newIgnore.className = 'list-entry';
    newIgnore.innerHTML = `
      <span class="player-name">${username}</span>
      <span class="world-status offline">Offline</span>
    `;
    document.querySelector('.ignore-list .list-container').appendChild(newIgnore);
    hideAllContextMenus();
  });
  
  chatContextMenu.querySelector('.cancel').addEventListener('click', () => {
    hideAllContextMenus();
  });
}

function hideAllContextMenus() {
  chatContextMenu.classList.remove('shown');
}

// Handle click outside to close context menu
document.addEventListener('click', (e) => {
  if (!e.target.closest('.context-menu') && !e.target.closest('.username')) {
    hideAllContextMenus();
  }
});

// Handle chat input
const chatInput = document.querySelector('.chat-input');
chatInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter' && chatInput.value.trim()) {
    const message = chatInput.value.trim();
    
    // Send chat message
    room.send({
      type: 'chat',
      message: message
    });

    // Add message to chat window
    const chatContent = document.querySelector('.chat-content');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'chat-message user';
    messageDiv.innerHTML = `<span class="username">${room.party.client.username}</span><span class="separator">: </span>${message}`;
    
    // Add click handler to username and message
    const usernameSpan = messageDiv.querySelector('.username');
    usernameSpan.addEventListener('click', (e) => {
      showChatContextMenu(e, room.party.client.username);
    });
    
    chatContent.insertBefore(messageDiv, chatContent.firstChild);
    
    // Clear input
    chatInput.value = '';
  }
});

// Handle incoming chat messages
room.onmessage = (event) => {
  if (event.data.type === 'chat' && event.data.clientId !== room.party.client.id) {
    const chatContent = document.querySelector('.chat-content');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'chat-message user';
    messageDiv.innerHTML = `<span class="username">${event.data.username}</span><span class="separator">: </span>${event.data.message}`;
    
    // Add click handler to username and message
    const usernameSpan = messageDiv.querySelector('.username');
    usernameSpan.addEventListener('click', (e) => {
      showChatContextMenu(e, event.data.username);
    });
    
    chatContent.insertBefore(messageDiv, chatContent.firstChild);
  }
};