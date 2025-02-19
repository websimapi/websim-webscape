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

// Create message overlay using the same markup as the Add Friend overlay
const messageOverlay = document.createElement('div');
messageOverlay.id = 'message-overlay';
messageOverlay.className = 'add-friend-overlay';
messageOverlay.innerHTML = `
  <div class="add-friend-container">
    <div class="add-friend-text">Enter message to send to <span class="message-username"></span></div>
    <input type="text" class="add-friend-input" maxlength="80">
  </div>
`;
document.querySelector('#chat-window').appendChild(messageOverlay);

const messageInput = messageOverlay.querySelector('.add-friend-input');
const messageUsernameSpan = messageOverlay.querySelector('.message-username');

function showMessageOverlay(username) {
  messageUsernameSpan.textContent = username;
  messageOverlay.classList.add('shown');
  messageInput.value = '';
  messageInput.focus();
}

// Export the showMessageOverlay globally so it can be used elsewhere
window.showMessageOverlay = showMessageOverlay;

function setupOverlay(overlay, input) {
  const chatWindow = document.getElementById('chat-window');
  chatWindow.addEventListener('click', (e) => {
    if (!overlay.contains(e.target) && !input.contains(e.target)) {
      overlay.classList.remove('shown');
    }
  });
}

setupOverlay(messageOverlay, messageInput);

messageInput.addEventListener('keypress', async (e) => {
  if (e.key === 'Enter' && messageInput.value.trim()) {
    const message = messageInput.value.trim();
    const recipient = messageUsernameSpan.textContent;
    
    if (onlineUsers.has(recipient)) {
      room.send({
        type: 'private-message',
        message: message,
        recipient: recipient
      });
      
      // Add message to chat (for sent private messages, we leave them in chat)
      const chatContent = document.querySelector('.chat-content');
      const messageDiv = document.createElement('div');
      messageDiv.className = 'chat-message private-message';
      messageDiv.innerHTML = `To ${recipient}: ${message}`;
      chatContent.insertBefore(messageDiv, chatContent.firstChild);
    } else {
      // Add error message to chat
      const chatContent = document.querySelector('.chat-content');
      const messageDiv = document.createElement('div');
      messageDiv.className = 'chat-message system';
      messageDiv.innerHTML = `Unable to send message - player ${recipient} is offline.`;
      chatContent.insertBefore(messageDiv, chatContent.firstChild);
    }
    
    messageOverlay.classList.remove('shown');
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

function showChatContextMenu(e, username) {
  // Do not show dropdown for your own username.
  if (username === room.party.client.username) return;
  
  // In Two-mouse mode, any mouse click immediately triggers messaging.
  if (window.mouseMode === "Two") {
    showMessageOverlay(username);
    return;
  }
  
  // Get game container bounds to ensure our menu doesn’t go outside.
  const gameContainer = document.getElementById('client-wrapper');
  const containerBounds = gameContainer.getBoundingClientRect();

  // Calculate initial position using event coordinates.
  let xPos = e.pageX;
  let yPos = e.pageY;

  // Set menu content.
  chatContextMenu.innerHTML = `
    <div class="context-menu-option message">Message ${username}</div>
    <div class="context-menu-option add-friend">Add Friend ${username}</div>
    <div class="context-menu-option add-ignore">Add Ignore ${username}</div>
    <div class="context-menu-option cancel">Cancel</div>
  `;
  chatContextMenu.classList.add('shown');

  // Now that the menu is visible, measure its bounds.
  const menuBounds = chatContextMenu.getBoundingClientRect();

  // Adjust position to prevent overflow.
  if (xPos + menuBounds.width > containerBounds.right) {
    xPos = containerBounds.right - menuBounds.width - 10;
  }
  if (yPos + menuBounds.height > containerBounds.bottom) {
    yPos = containerBounds.bottom - menuBounds.height - 10;
  }
  xPos = Math.max(containerBounds.left + 10, xPos);
  yPos = Math.max(containerBounds.top + 10, yPos);

  // Set the final position.
  chatContextMenu.style.left = `${xPos}px`;
  chatContextMenu.style.top = `${yPos}px`;

  const messageOption = chatContextMenu.querySelector('.message');
  const addFriendOption = chatContextMenu.querySelector('.add-friend');
  const addIgnoreOption = chatContextMenu.querySelector('.add-ignore');
  const cancelOption = chatContextMenu.querySelector('.cancel');

  messageOption.addEventListener('click', (event) => {
    event.stopPropagation();
    showMessageOverlay(username);
    hideAllContextMenus();
  });

  addFriendOption.addEventListener('click', (event) => {
    event.stopPropagation();
    const newFriend = document.createElement('div');
    newFriend.className = 'list-entry';
    newFriend.innerHTML = `
      <span class="player-name">${username}</span>
      <span class="world-status offline">Offline</span>
    `;
    document.querySelector('.friends-list .list-container').appendChild(newFriend);
    hideAllContextMenus();
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

function showUsernameHoverTooltip(e, username) {
  if (username === room.party.client.username) return;
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
    // (For your own username we do not add a contextmenu listener)
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
        const username = event.data.username;
        messageDiv.className = 'chat-message user';
        messageDiv.innerHTML = `<span class="username">${username}</span><span class="separator">: </span>${event.data.message}`;
        const usernameSpan = messageDiv.querySelector('.username');
        usernameSpan.addEventListener('click', (e) => {
          showChatContextMenu(e, username);
        });
        usernameSpan.addEventListener('mouseover', (e) => {
          showUsernameHoverTooltip(e, username);
        });
        usernameSpan.addEventListener('mouseout', (e) => {
          hideUsernameHoverTooltip();
        });
        // NEW: In Two Mouse Mode, right-click should immediately initiate messaging.
        usernameSpan.addEventListener('contextmenu', (e) => {
          if (window.mouseMode === "Two") {
            e.preventDefault();
            showMessageOverlay(username);
          }
        });
      }
      break;
      
    case 'private-message':
      if (event.data.recipient === room.party.client.username) {
        const splitPrivate = localStorage.getItem('splitPrivateChat') === 'true';
        if (splitPrivate) {
          const splitContainer = document.getElementById('split-private-chat');
          if (splitContainer) {
            const splitMessage = document.createElement('div');
            splitMessage.className = 'split-private-message';
            splitMessage.textContent = `From ${event.data.username}: ${event.data.message}`;
            splitContainer.appendChild(splitMessage);
            if (splitContainer.childElementCount > 5) {
              splitContainer.removeChild(splitContainer.firstElementChild);
            }
            splitContainer.style.display = 'flex';
          }
        } else {
          messageDiv.className = 'chat-message private-message';
          messageDiv.innerHTML = `From ${event.data.username}: ${event.data.message}`;
        }
      }
      break;
  }
  
  if (messageDiv.innerHTML) {
    chatContent.insertBefore(messageDiv, chatContent.firstChild);
  }
};

setInterval(updateOnlineStatus, 3000);