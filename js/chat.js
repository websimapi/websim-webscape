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

function showChatContextMenu(e, username) {
  e.preventDefault();
  
  // Position and show context menu
  const contextMenu = document.createElement('div');
  contextMenu.className = 'context-menu shown';
  contextMenu.style.left = `${e.pageX}px`;
  contextMenu.style.top = `${e.pageY}px`;
  
  // Set menu options
  contextMenu.innerHTML = `
    <div class="context-menu-option add-friend">Add Friend ${username}</div>
    <div class="context-menu-option add-ignore">Add Ignore ${username}</div>
    <div class="context-menu-option cancel">Cancel</div>
  `;
  
  document.body.appendChild(contextMenu);
  
  // Add click handlers for menu options
  contextMenu.querySelector('.add-friend').addEventListener('click', () => {
    // Add friend logic here
    const newFriend = document.createElement('div');
    newFriend.className = 'list-entry';
    newFriend.innerHTML = `
      <span class="player-name">${username}</span>
      <span class="world-status offline">Offline</span>
    `;
    document.querySelector('.friends-list .list-container').appendChild(newFriend);
    contextMenu.remove();
  });
  
  contextMenu.querySelector('.add-ignore').addEventListener('click', () => {
    // Add ignore logic here
    const newIgnore = document.createElement('div');
    newIgnore.className = 'list-entry';
    newIgnore.innerHTML = `
      <span class="player-name">${username}</span>
      <span class="world-status offline">Offline</span>
    `;
    document.querySelector('.ignore-list .list-container').appendChild(newIgnore);
    contextMenu.remove();
  });
  
  contextMenu.querySelector('.cancel').addEventListener('click', () => {
    contextMenu.remove();
  });

  // Close menu when clicking outside
  document.addEventListener('click', function closeMenu(e) {
    if (!e.target.closest('.context-menu')) {
      contextMenu.remove();
      document.removeEventListener('click', closeMenu);
    }
  });
}

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
    
    // Add click handler to username
    messageDiv.querySelector('.username').addEventListener('click', (e) => {
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
    
    // Add click handler to username
    messageDiv.querySelector('.username').addEventListener('click', (e) => {
      showChatContextMenu(e, event.data.username);
    });
    
    chatContent.insertBefore(messageDiv, chatContent.firstChild);
  }
};