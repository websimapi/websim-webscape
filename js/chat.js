// Initialize WebSocket connection
const room = new WebsimSocket();

// Track online users
let onlineUsers = new Set();

// Get the username element
const usernameElement = document.getElementById('current-username');

// Update username and online users when connection is established
room.party.subscribe((peers) => {
  const currentUser = room.party.client;
  if (currentUser && currentUser.username) {
    usernameElement.textContent = currentUser.username;
  }
  
  // Update online users
  onlineUsers.clear();
  for (const clientId in peers) {
    onlineUsers.add(peers[clientId].username);
  }
  
  // Update online status in friends list
  updateOnlineStatus();
});

// Function to update online status in friends list
function updateOnlineStatus() {
  const friendEntries = document.querySelectorAll('.friends-list .list-entry');
  friendEntries.forEach(entry => {
    const username = entry.querySelector('.player-name').textContent;
    const statusElement = entry.querySelector('.world-status');
    if (onlineUsers.has(username)) {
      statusElement.textContent = 'World-1';
      statusElement.classList.remove('offline');
    } else {
      statusElement.textContent = 'Offline';
      statusElement.classList.add('offline');
    }
  });
}

// Create message overlay
const messageOverlay = document.createElement('div');
messageOverlay.id = 'message-overlay';
messageOverlay.className = 'message-overlay';
messageOverlay.innerHTML = `
  <div class="message-container">
    <div class="message-text">Enter message to send to <span class="message-username"></span></div>
    <input type="text" class="message-input" maxlength="80">
  </div>
`;

// Update to place the overlay in the correct container
const chatContent = document.querySelector('.chat-content');
chatContent.insertAdjacentElement('afterend', messageOverlay);

const messageInput = messageOverlay.querySelector('.message-input');
const messageUsernameSpan = messageOverlay.querySelector('.message-username');

// Function to show message overlay
function showMessageOverlay(username) {
  messageUsernameSpan.textContent = username;
  messageOverlay.classList.add('shown');
  messageInput.value = '';
  messageInput.focus();
  
  // Hide the regular chat input area when overlay is shown
  document.querySelector('.chat-input-area').style.visibility = 'hidden';
}

// Update setupOverlay to restore chat input visibility when hiding overlay
function setupOverlay(overlay, input) {
  // Click outside overlay handler
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      overlay.classList.remove('shown');
      document.querySelector('.chat-input-area').style.visibility = 'visible';
    }
  });

  // Handle input submission
  input.addEventListener('keypress', async (e) => {
    if (e.key === 'Enter' && input.value.trim()) {
      const message = input.value.trim();
      const recipient = messageUsernameSpan.textContent;
      
      if (onlineUsers.has(recipient)) {
        room.send({
          type: 'private-message',
          message: message,
          recipient: recipient
        });
        
        const chatContent = document.querySelector('.chat-content');
        const messageDiv = document.createElement('div');
        messageDiv.className = 'chat-message private-message';
        messageDiv.innerHTML = `To ${recipient}: ${message}`;
        chatContent.insertBefore(messageDiv, chatContent.firstChild);
      } else {
        const chatContent = document.querySelector('.chat-content');
        const messageDiv = document.createElement('div');
        messageDiv.className = 'chat-message system';
        messageDiv.innerHTML = `Unable to send message - player ${recipient} is offline.`;
        chatContent.insertBefore(messageDiv, chatContent.firstChild);
      }
      
      overlay.classList.remove('shown');
      document.querySelector('.chat-input-area').style.visibility = 'visible';
    }
  });
}

setupOverlay(messageOverlay, messageInput);

// Update click handlers to restore chat input visibility
document.addEventListener('click', (e) => {
  if (!messageOverlay.contains(e.target) && !messageInput.contains(e.target)) {
    messageOverlay.classList.remove('shown');
    document.querySelector('.chat-input-area').style.visibility = 'visible';
  }
});

// Create a reusable chat context menu element.
const chatContextMenu = document.createElement('div');
chatContextMenu.className = 'context-menu';
document.body.appendChild(chatContextMenu);

// Create a tooltip for hovering over usernames in chat
const chatUsernameTooltip = document.createElement('div');
chatUsernameTooltip.className = 'action-tooltip';
chatUsernameTooltip.style.display = 'none';
document.body.appendChild(chatUsernameTooltip);

// Function to show chat context menu when clicking on a username
function showChatContextMenu(e, username) {
  if (username === room.party.client.username) return;

  e.preventDefault();
  e.stopPropagation();

  hideAllContextMenus();

  const gameContainer = document.getElementById('client-wrapper');
  const containerBounds = gameContainer.getBoundingClientRect();

  let xPos = e.pageX;
  let yPos = e.pageY;

  chatContextMenu.innerHTML = `
    <div class="context-menu-option message">Message ${username}</div>
    <div class="context-menu-option add-friend">Add Friend ${username}</div>
    <div class="context-menu-option add-ignore">Add Ignore ${username}</div>
    <div class="context-menu-option cancel">Cancel</div>
  `;
  chatContextMenu.classList.add('shown');

  const menuBounds = chatContextMenu.getBoundingClientRect();

  if (xPos + menuBounds.width > containerBounds.right) {
    xPos = containerBounds.right - menuBounds.width - 10;
  }
  if (yPos + menuBounds.height > containerBounds.bottom) {
    yPos = containerBounds.bottom - menuBounds.height - 10;
  }

  xPos = Math.max(containerBounds.left + 10, xPos);
  yPos = Math.max(containerBounds.top + 10, yPos);

  chatContextMenu.style.left = `${xPos}px`;
  chatContextMenu.style.top = `${yPos}px`;

  const messageOption = chatContextMenu.querySelector('.message');
  messageOption.addEventListener('click', (event) => {
    event.stopPropagation();
    hideAllContextMenus();
    showMessageOverlay(username);
  });

  const addFriendOption = chatContextMenu.querySelector('.add-friend');
  const addIgnoreOption = chatContextMenu.querySelector('.add-ignore');
  const cancelOption = chatContextMenu.querySelector('.cancel');

  addFriendOption.addEventListener('click', (event) => {
    event.stopPropagation();
    const newFriend = document.createElement('div');
    newFriend.className = 'list-entry';
    newFriend.innerHTML = `
      <span class="player-name">${username}</span>
      <span class="world-status ${onlineUsers.has(username) ? '' : 'offline'}">${onlineUsers.has(username) ? 'World-1' : 'Offline'}</span>
    `;
    document.querySelector('.friends-list .list-container').appendChild(newFriend);
    hideAllContextMenus();
    updateOnlineStatus(); 
  });

  addIgnoreOption.addEventListener('click', (event) => {
    event.stopPropagation();
    const newIgnore = document.createElement('div');
    newIgnore.className = 'list-entry';
    newIgnore.innerHTML = `
      <span class="player-name">${username}</span>
      <span class="world-status offline">Offline</span>
    `;
    document.querySelector('.ignore-list .list-container').appendChild(newIgnore);
    hideAllContextMenus();
  });

  cancelOption.addEventListener('click', (event) => {
    event.stopPropagation();
    hideAllContextMenus();
  });
}

function hideAllContextMenus() {
  chatContextMenu.classList.remove('shown');
  chatContextMenu.style.left = '';
  chatContextMenu.style.top = '';
}

// Function to show tooltip on chat username hover in the top left of the game container
function showUsernameHoverTooltip(e, username) {
  // For your own name, do not show the dropdown tooltip.
  if (username === room.party.client.username) return;
  
  // Display the first action choice and count of remaining options.
  chatUsernameTooltip.textContent = `Add Friend / 1 more option`;
  chatUsernameTooltip.style.display = 'block';
  const gameScreen = document.getElementById('game-screen');
  const gameRect = gameScreen.getBoundingClientRect();
  chatUsernameTooltip.style.top = `${gameRect.top + 5}px`;
  chatUsernameTooltip.style.left = `${gameRect.left + 5}px`;
}

function hideUsernameHoverTooltip() {
  chatUsernameTooltip.style.display = 'none';
}

const chatInput = document.querySelector('.chat-input');
chatInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter' && chatInput.value.trim()) {
    const message = chatInput.value.trim();

    room.send({
      type: 'chat',
      message: message
    });

    const chatContent = document.querySelector('.chat-content');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'chat-message user';
    messageDiv.innerHTML = `<span class="username">${room.party.client.username}</span><span class="separator">: </span>${message}`;

    const usernameSpan = messageDiv.querySelector('.username');
    usernameSpan.addEventListener('click', (e) => {
      showChatContextMenu(e, room.party.client.username);
    });
    usernameSpan.addEventListener('mouseover', (e) => {
      showUsernameHoverTooltip(e, room.party.client.username);
    });
    usernameSpan.addEventListener('mouseout', (e) => {
      hideUsernameHoverTooltip();
    });

    chatContent.insertBefore(messageDiv, chatContent.firstChild);

    chatInput.value = '';
  }
});

room.onmessage = (event) => {
  const chatContent = document.querySelector('.chat-content');
  const messageDiv = document.createElement('div');
  
  switch (event.data.type) {
    case 'chat':
      if (event.data.clientId !== room.party.client.id) {
        messageDiv.className = 'chat-message user';
        messageDiv.innerHTML = `<span class="username">${event.data.username}</span><span class="separator">: </span>${event.data.message}`;

        const usernameSpan = messageDiv.querySelector('.username');
        usernameSpan.addEventListener('click', (e) => {
          showChatContextMenu(e, event.data.username);
        });
        usernameSpan.addEventListener('mouseover', (e) => {
          showUsernameHoverTooltip(e, event.data.username);
        });
        usernameSpan.addEventListener('mouseout', (e) => {
          hideUsernameHoverTooltip();
        });
      }
      break;
      
    case 'private-message':
      if (event.data.recipient === room.party.client.username) {
        messageDiv.className = 'chat-message private-message';
        messageDiv.innerHTML = `From ${event.data.username}: ${event.data.message}`;
      }
      break;
  }
  
  if (messageDiv.innerHTML) {
    chatContent.insertBefore(messageDiv, chatContent.firstChild);
  }
};