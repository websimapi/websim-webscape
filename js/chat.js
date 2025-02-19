// Initialize WebSocket connection
const room = new WebsimSocket();

// Global arrays to store public and private message history with timestamps
const privateMessageHistory = [];
const publicMessageHistory = [];

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

// Handle private message overlay submissions
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
      
      // Save outgoing private message to history with timestamp and re-render chat history
      const msgObj = {
        direction: 'to',
        recipient: recipient,
        message: message,
        timestamp: Date.now()
      };
      privateMessageHistory.push(msgObj);
      renderChatHistory();
    } else {
      const chatContent = document.querySelector('.chat-content');
      const messageDiv = document.createElement('div');
      messageDiv.className = 'chat-message system';
      messageDiv.innerHTML = `Unable to send message - player ${recipient} is offline.`;
      chatContent.insertBefore(messageDiv, chatContent.firstChild);
    }
    
    messageOverlay.classList.remove('shown');
  }
});

// Global array to store chat messages is now split into publicMessageHistory and privateMessageHistory.
// Handle public chat input – push message into history with timestamp and then re-render
const chatInput = document.querySelector('.chat-input');
chatInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter' && chatInput.value.trim()) {
    const message = chatInput.value.trim();
    room.send({
      type: 'chat',
      message: message
    });
    publicMessageHistory.push({
      type: 'public',
      username: room.party.client.username,
      message: message,
      timestamp: Date.now()
    });
    renderChatHistory();
    chatInput.value = '';
  }
});

// Handle incoming messages via WebSocket
room.onmessage = (event) => {
  const data = event.data;
  switch (data.type) {
    case 'chat':
      if (data.clientId !== room.party.client.id) {
        publicMessageHistory.push({
          type: 'public',
          username: data.username,
          message: data.message,
          timestamp: Date.now()
        });
        renderChatHistory();
      }
      break;
    case 'private-message':
      if (data.recipient === room.party.client.username) {
        const msgObj = {
          direction: 'from',
          sender: data.username,
          message: data.message,
          timestamp: Date.now()
        };
        privateMessageHistory.push(msgObj);
        renderChatHistory();
      }
      break;
    default:
      console.log("Received event:", data);
  }
};

// New function to render chat history based on split chat mode and timestamps
function renderChatHistory() {
  const splitPrivate = localStorage.getItem('splitPrivateChat') === 'true';
  const chatContent = document.querySelector('.chat-content');
  // Clear the main chat content container
  chatContent.innerHTML = "";
  
  if (splitPrivate) {
    // Render public messages (sorted newest first) in main chat content
    let sortedPublic = publicMessageHistory.slice().sort((a, b) => b.timestamp - a.timestamp);
    sortedPublic.forEach(msg => {
      const msgDiv = document.createElement('div');
      msgDiv.className = 'chat-message';
      msgDiv.innerHTML = `<span class="username">${msg.username}</span><span class="separator">: </span>${msg.message} <span class="timestamp">${new Date(msg.timestamp).toLocaleTimeString()}</span>`;
      chatContent.appendChild(msgDiv);
    });
    
    // Render private messages in the split chat container
    const splitContainer = document.getElementById('split-private-chat');
    if (splitContainer) {
      splitContainer.innerHTML = "";
      let sortedPrivate = privateMessageHistory.slice().sort((a, b) => b.timestamp - a.timestamp);
      sortedPrivate.forEach(msg => {
        const msgDiv = document.createElement('div');
        msgDiv.className = 'split-private-message';
        if (msg.direction === 'to') {
          msgDiv.innerHTML = `To ${msg.recipient}: ${msg.message} <span class="timestamp">${new Date(msg.timestamp).toLocaleTimeString()}</span>`;
        } else {
          msgDiv.innerHTML = `From ${msg.sender}: ${msg.message} <span class="timestamp">${new Date(msg.timestamp).toLocaleTimeString()}</span>`;
        }
        splitContainer.appendChild(msgDiv);
      });
      // Limit split chat history to last 5 messages
      while (splitContainer.childElementCount > 5) {
        splitContainer.removeChild(splitContainer.firstElementChild);
      }
    }
  } else {
    // When split chat is off, merge public and private messages and sort all by timestamp
    let allMessages = [];
    allMessages = allMessages.concat(publicMessageHistory, privateMessageHistory.map(msg => {
      return { ...msg, type: 'private' };
    }));
    allMessages.sort((a, b) => b.timestamp - a.timestamp);
    allMessages.forEach(msg => {
      const msgDiv = document.createElement('div');
      msgDiv.className = 'chat-message';
      if (msg.type === 'private') {
        if (msg.direction === 'to') {
          msgDiv.innerHTML = `To ${msg.recipient}: ${msg.message} <span class="timestamp">${new Date(msg.timestamp).toLocaleTimeString()}</span>`;
        } else {
          msgDiv.innerHTML = `From ${msg.sender}: ${msg.message} <span class="timestamp">${new Date(msg.timestamp).toLocaleTimeString()}</span>`;
        }
      } else {
        msgDiv.innerHTML = `<span class="username">${msg.username}</span><span class="separator">: </span>${msg.message} <span class="timestamp">${new Date(msg.timestamp).toLocaleTimeString()}</span>`;
      }
      chatContent.appendChild(msgDiv);
    });
    // Clear the split chat container when split chat mode is off
    const splitContainer = document.getElementById('split-private-chat');
    if (splitContainer) {
      splitContainer.innerHTML = "";
    }
  }
}

setInterval(updateOnlineStatus, 3000);

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
  if (username === room.party.client.username) return;
  
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

const usernameSpanElements = document.querySelectorAll('.username');
usernameSpanElements.forEach(span => {
  span.addEventListener('click', (e) => {
    showChatContextMenu(e, room.party.client.username);
  });
  span.addEventListener('mouseover', (e) => {
    showUsernameHoverTooltip(e, room.party.client.username);
  });
  span.addEventListener('mouseout', (e) => {
    hideUsernameHoverTooltip();
  });
});

// Expose renderChatHistory globally so external modules can re-render chat as needed
window.renderChatHistory = renderChatHistory;