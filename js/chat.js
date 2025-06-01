// Initialize WebSocket connection
const room = new WebsimSocket();

// Global array to store private message history
const privateMessageHistory = [];

// Track online users
let onlineUsers = new Set();

// Get ignored users list
function getIgnoredUsers() {
  const stored = localStorage.getItem('ignoreList');
  if (stored) {
    try {
      const ignoreList = JSON.parse(stored);
      return new Set(ignoreList.map(item => item.name));
    } catch (err) {
      return new Set();
    }
  }
  return new Set();
}

// Check if a user is ignored
function isUserIgnored(username) {
  const ignoredUsers = getIgnoredUsers();
  return ignoredUsers.has(username);
}

// Track current world
function getCurrentWorld() {
  const currentUrl = document.querySelector('#game-screen iframe').src;
  const worldsMatch = currentUrl.match(/world-(\d+)/);
  return worldsMatch ? `World-${worldsMatch[1]}` : 'World-1';
}

// Get the username element
const usernameElement = document.getElementById('current-username');

// Update username and online users when connection is established
room.party.subscribe((peers) => {
  const currentUser = room.party.client;
  if (currentUser && currentUser.username) {
    usernameElement.textContent = currentUser.username;
  }
  
  // Update online users (excluding ignored users)
  onlineUsers.clear();
  for (const clientId in peers) {
    const username = peers[clientId].username;
    if (!isUserIgnored(username)) {
      onlineUsers.add(username);
    }
  }
  
  // Update online status in friends list
  updateOnlineStatus();
});

// Function to update online status in friends list
function updateOnlineStatus() {
  const friendEntries = document.querySelectorAll('.friends-list .list-entry');
  const currentWorld = getCurrentWorld();

  friendEntries.forEach(entry => {
    const username = entry.querySelector('.player-name').textContent;
    const statusElement = entry.querySelector('.world-status');
    
    if (onlineUsers.has(username)) {
      // Only update world name if it's not already set or if status was previously offline
      if (!statusElement.textContent || statusElement.textContent === 'Offline') {
        statusElement.textContent = 'World-1'; // Default world
      }
      statusElement.classList.remove('offline');
      
      // Update color based on world comparison
      if (statusElement.textContent === currentWorld) {
        statusElement.style.color = '#00ff00'; // Green for same world
      } else {
        statusElement.style.color = '#ffff00'; // Yellow for different world
      }
    } else {
      statusElement.textContent = 'Offline';
      statusElement.classList.add('offline');
      statusElement.style.color = '#ff0000'; // Red for offline
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
  // Don't allow messaging ignored users
  if (isUserIgnored(username)) {
    return;
  }
  
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

/* --- Helper functions for sorted message insertion --- */
function insertIntoChatContent(msgDiv) {
  const chatContent = document.querySelector('.chat-content');
  const newTimestamp = parseFloat(msgDiv.getAttribute('data-timestamp'));
  let inserted = false;
  // The chat container uses flex-direction: column-reverse so the DOM order should be descending (newest first)
  for (let i = 0; i < chatContent.children.length; i++) {
    const child = chatContent.children[i];
    const childTimestamp = parseFloat(child.getAttribute('data-timestamp') || "0");
    if (childTimestamp <= newTimestamp) {
      chatContent.insertBefore(msgDiv, child);
      inserted = true;
      break;
    }
  }
  if (!inserted) {
    chatContent.appendChild(msgDiv);
  }
}

function insertIntoSplitChat(msgDiv) {
  const splitContainer = document.getElementById('split-private-chat');
  if (splitContainer) {
    splitContainer.appendChild(msgDiv);
    // Limit history to last 5 messages
    while (splitContainer.childElementCount > 5) {
      splitContainer.removeChild(splitContainer.firstElementChild);
    }
  }
}

// Re-render all private messages based on current split-chat mode.
// When split chat is off, private messages are merged into main chat; when on, they go into the split chat container.
function renderAllPrivateMessages() {
  const splitPrivate = localStorage.getItem('splitPrivateChat') === 'true';
  const chatContent = document.querySelector('.chat-content');
  // Remove any existing private messages from main chat
  const existingPrivate = chatContent.querySelectorAll('.chat-message.private-message');
  existingPrivate.forEach(elem => elem.remove());
  const splitContainer = document.getElementById('split-private-chat');
  if (splitContainer) {
    splitContainer.innerHTML = '';
  }
  // Re-insert all private messages from history in the order they were received
  privateMessageHistory.forEach(msg => {
    const msgDiv = document.createElement('div');
    msgDiv.className = 'chat-message private-message';
    msgDiv.setAttribute('data-timestamp', msg.timestamp);
    if (msg.direction === 'to') {
      msgDiv.innerHTML = `To ${msg.recipient}: ${msg.message}`;
    } else {
      msgDiv.innerHTML = `From ${msg.sender}: ${msg.message}`;
    }
    if (splitPrivate) {
      insertIntoSplitChat(msgDiv);
    } else {
      insertIntoChatContent(msgDiv);
    }
  });
}
window.renderPrivateMessages = renderAllPrivateMessages;

/* --- Chat input for Public messages --- */
const chatInput = document.querySelector('.chat-input');
chatInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter' && chatInput.value.trim()) {
    const message = chatInput.value.trim();
    const currentWorld = getCurrentWorld();
    
    // Send message with current world info
    room.send({
      type: 'chat',
      message: message,
      world: currentWorld
    });
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'chat-message user';
    const timestamp = Date.now();
    messageDiv.setAttribute('data-timestamp', timestamp);
    messageDiv.innerHTML = `<span class="username">${room.party.client.username}</span><span class="separator">: </span>${message}`;
    insertIntoChatContent(messageDiv);
    chatInput.value = '';
  }
});

/* --- Chat input for Private messages via overlay --- */
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
      
      // Save outgoing private message to history and insert into chat/split container
      const msgObj = {
        direction: 'to',
        recipient: recipient,
        message: message,
        timestamp: Date.now()
      };
      privateMessageHistory.push(msgObj);
      const msgDiv = document.createElement('div');
      msgDiv.className = 'chat-message private-message';
      msgDiv.setAttribute('data-timestamp', msgObj.timestamp);
      msgDiv.innerHTML = `To ${recipient}: ${message}`;
      const splitPrivate = localStorage.getItem('splitPrivateChat') === 'true';
      if (splitPrivate) {
        insertIntoSplitChat(msgDiv);
      } else {
        insertIntoChatContent(msgDiv);
      }
    } else {
      const chatContent = document.querySelector('.chat-content');
      const messageDiv = document.createElement('div');
      messageDiv.className = 'chat-message system';
      const timestamp = Date.now(); // Fix: set timestamp for proper insertion order
      messageDiv.setAttribute('data-timestamp', timestamp);
      messageDiv.innerHTML = `Unable to send message - player ${recipient} is offline.`;
      insertIntoChatContent(messageDiv);
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

const chatUsernameElements = document.querySelectorAll('.chat-message .username');
// (Event listeners for username hover and context menu in public messages are added when messages are created)

room.onmessage = (event) => {
  const chatContent = document.querySelector('.chat-content');
  switch (event.data.type) {
    case 'world-change': {
      // Update friend list entries for the user who changed worlds (only if not ignored)
      if (!isUserIgnored(event.data.username)) {
        const friendEntries = document.querySelectorAll('.friends-list .list-entry');
        friendEntries.forEach(entry => {
          const username = entry.querySelector('.player-name').textContent;
          const statusElement = entry.querySelector('.world-status');
          if (username === event.data.username) {
            if (onlineUsers.has(username)) {
              statusElement.textContent = event.data.world;
              statusElement.classList.remove('offline');
            }
          }
        });
      }
      break;
    }
    case 'chat': {
      // For public chat messages from others (ignore blocked users)
      if (event.data.clientId !== room.party.client.id && !isUserIgnored(event.data.username)) {
        // Only display message if it's from the same world
        if (event.data.world === getCurrentWorld()) {
          const username = event.data.username;
          const messageDiv = document.createElement('div');
          messageDiv.className = 'chat-message user';
          const timestamp = Date.now();
          messageDiv.setAttribute('data-timestamp', timestamp);
          messageDiv.innerHTML = `<span class="username">${username}</span><span class="separator">: </span>${event.data.message}`;
          
          // Add event listeners for username interactions
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
          usernameSpan.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            showChatContextMenu(e, username);
          });
          insertIntoChatContent(messageDiv);
        }
      }
      break;
    }
    case 'private-message': {
      // For incoming private messages - block if sender is ignored
      if (event.data.recipient === room.party.client.username && !isUserIgnored(event.data.username)) {
        const msgObj = {
          direction: 'from',
          sender: event.data.username,
          message: event.data.message,
          timestamp: Date.now()
        };
        privateMessageHistory.push(msgObj);
        const msgDiv = document.createElement('div');
        msgDiv.className = 'chat-message private-message';
        msgDiv.setAttribute('data-timestamp', msgObj.timestamp);
        msgDiv.innerHTML = `From ${msgObj.sender}: ${msgObj.message}`;
        const splitPrivate = localStorage.getItem('splitPrivateChat') === 'true';
        if (splitPrivate) {
          insertIntoSplitChat(msgDiv);
        } else {
          insertIntoChatContent(msgDiv);
        }
      }
      break;
    }
    default:
      console.log("Received event:", event.data);
  }
};

setInterval(updateOnlineStatus, 3000);