// Initialize WebSocket connection
const room = new WebsimSocket();

// Global arrays to store message history
let publicMessageHistory = [];
let privateMessageHistory = [];

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

// Expose the showMessageOverlay globally so it can be used elsewhere
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
      
      // Save outgoing private message to history with timestamp (not visually shown)
      const privMsg = {
        direction: 'to',
        recipient: recipient,
        message: message,
        timestamp: Date.now()
      };
      privateMessageHistory.push(privMsg);
      updateChatHistory();
    } else {
      const chatContent = document.querySelector('.chat-content');
      const systemMsg = document.createElement('div');
      systemMsg.className = 'chat-message system';
      systemMsg.innerHTML = `Unable to send message - player ${recipient} is offline.`;
      chatContent.insertBefore(systemMsg, chatContent.firstChild);
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

// Handle public chat messages from the main chat input
const chatInput = document.querySelector('.chat-input');
chatInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter' && chatInput.value.trim()) {
    const message = chatInput.value.trim();
    room.send({
      type: 'chat',
      message: message
    });
    // Save public message with a timestamp (not visually shown)
    const publicMsg = {
      sender: room.party.client.username,
      message: message,
      timestamp: Date.now()
    };
    publicMessageHistory.push(publicMsg);
    updateChatHistory();
    chatInput.value = '';
  }
});

// Handle incoming messages via WebSocket
room.onmessage = (event) => {
  switch (event.data.type) {
    case 'chat':
      if (event.data.clientId !== room.party.client.id) {
        // Save incoming public message along with a timestamp
        const publicMsg = {
          sender: event.data.username,
          message: event.data.message,
          timestamp: Date.now()
        };
        publicMessageHistory.push(publicMsg);
        updateChatHistory();
      }
      break;
      
    case 'private-message':
      if (event.data.recipient === room.party.client.username) {
        const privMsg = {
          direction: 'from',
          sender: event.data.username,
          message: event.data.message,
          timestamp: Date.now()
        };
        privateMessageHistory.push(privMsg);
        updateChatHistory();
      }
      break;
      
    default:
      console.log("Received event:", event.data);
  }
};

// Periodically update online status
setInterval(updateOnlineStatus, 3000);

// Function to update (re-)render the chat history based on the split chat mode setting
function updateChatHistory() {
  const splitPrivate = localStorage.getItem('splitPrivateChat') === 'true';
  const chatContent = document.querySelector('.chat-content');
  chatContent.innerHTML = '';
  
  if (splitPrivate) {
    // Render public messages only in the main chat window
    let sortedPublic = publicMessageHistory.slice().sort((a, b) => a.timestamp - b.timestamp);
    sortedPublic.forEach(msg => {
      const messageDiv = document.createElement('div');
      messageDiv.className = 'chat-message user';
      // Store timestamp in a data attribute (invisible)
      messageDiv.dataset.timestamp = msg.timestamp;
      messageDiv.innerHTML = `<span class="username">${msg.sender}</span><span class="separator">: </span>${msg.message}`;
      
      const usernameSpan = messageDiv.querySelector('.username');
      usernameSpan.addEventListener('click', (e) => { showChatContextMenu(e, msg.sender); });
      usernameSpan.addEventListener('mouseover', (e) => { showUsernameHoverTooltip(e, msg.sender); });
      usernameSpan.addEventListener('mouseout', (e) => { hideUsernameHoverTooltip(); });
      messageDiv.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        showChatContextMenu(e, msg.sender);
      });
      chatContent.insertBefore(messageDiv, chatContent.firstChild);
    });
    // Also update the split private chat container with private messages
    updatePrivateChatSplit();
  } else {
    // Merge public and private messages and render them together in chronological order
    let mergedMessages = publicMessageHistory.concat(privateMessageHistory);
    mergedMessages.sort((a, b) => a.timestamp - b.timestamp);
    mergedMessages.forEach(msg => {
      const messageDiv = document.createElement('div');
      // Store timestamp in a data attribute (not displayed)
      messageDiv.dataset.timestamp = msg.timestamp;
      if (msg.direction) { // indicates a private message
        messageDiv.className = 'chat-message private-message';
        if (msg.direction === 'to') {
          messageDiv.innerHTML = `To ${msg.recipient}: ${msg.message}`;
        } else {
          messageDiv.innerHTML = `From ${msg.sender}: ${msg.message}`;
        }
      } else {
        messageDiv.className = 'chat-message user';
        messageDiv.innerHTML = `<span class="username">${msg.sender}</span><span class="separator">: </span>${msg.message}`;
        const usernameSpan = messageDiv.querySelector('.username');
        usernameSpan.addEventListener('click', (e) => { showChatContextMenu(e, msg.sender); });
        usernameSpan.addEventListener('mouseover', (e) => { showUsernameHoverTooltip(e, msg.sender); });
        usernameSpan.addEventListener('mouseout', (e) => { hideUsernameHoverTooltip(); });
        messageDiv.addEventListener('contextmenu', (e) => {
          e.preventDefault();
          showChatContextMenu(e, msg.sender);
        });
      }
      chatContent.insertBefore(messageDiv, chatContent.firstChild);
    });
  }
}

// Function to update the split private chat container (when split chat mode is enabled)
function updatePrivateChatSplit() {
  const splitContainer = document.getElementById('split-private-chat');
  if (splitContainer) {
    splitContainer.innerHTML = '';
    let sortedPrivate = privateMessageHistory.slice().sort((a, b) => a.timestamp - b.timestamp);
    sortedPrivate.forEach(msg => {
      const msgDiv = document.createElement('div');
      msgDiv.className = 'split-private-message';
      if (msg.direction === 'to') {
        msgDiv.textContent = `To ${msg.recipient}: ${msg.message}`;
      } else {
        msgDiv.textContent = `From ${msg.sender}: ${msg.message}`;
      }
      splitContainer.appendChild(msgDiv);
    });
    // Limit the displayed history to the last 5 messages
    while (splitContainer.childElementCount > 5) {
      splitContainer.removeChild(splitContainer.firstElementChild);
    }
  }
}

// Expose updateChatHistory globally (optional, for external modules)
window.updateChatHistory = updateChatHistory;