// Initialize WebSocket connection
const room = new WebsimSocket();

// Add chat mode tracking 
let chatMode = 'public'; // Can be 'public' or 'global'

// Track chat history separately for global and public
const globalChatHistory = [];
const publicChatHistory = [];

// Track private message history
const privateMessageHistory = [];

// Track online users and their worlds
const userWorlds = new Map(); // Maps usernames to their current world

// Track online users
let onlineUsers = new Set();

// Function to get the current world
function getCurrentWorld() {
  const currentUrl = document.querySelector('#game-screen iframe').src;
  const worldsMatch = currentUrl.match(/world-(\d+)/);
  return worldsMatch ? `World-${worldsMatch[1]}` : 'World-1';
}

// Update all displayed global chat messages for a user when they change worlds
function updateUserWorldDisplay(username, newWorld) {
  // Update the stored world for this user
  userWorlds.set(username, newWorld);

  // Only update display if we're in global chat mode
  if (chatMode === 'global') {
    const chatContent = document.querySelector('.chat-content');
    const userMessages = chatContent.querySelectorAll('.chat-message.user');
    
    userMessages.forEach(messageDiv => {
      const messageUsername = messageDiv.querySelector('.username').textContent;
      if (messageUsername === username) {
        const worldIndicator = messageDiv.querySelector('.world-indicator');
        if (worldIndicator) {
          worldIndicator.textContent = newWorld;
        }
      }
    });
  }
}

// Get the username element
const usernameElement = document.getElementById('current-username');

// Update username and online users when connection is established
room.party.subscribe((peers) => {
  const currentUser = room.party.client;
  if (currentUser && currentUser.username) {
    usernameElement.textContent = currentUser.username;
    // Set initial world for current user
    userWorlds.set(currentUser.username, getCurrentWorld());
  }
  
  // Update online users
  onlineUsers.clear();
  for (const clientId in peers) {
    onlineUsers.add(peers[clientId].username);
  }
  
  // Update online status in friends list
  updateOnlineStatus();
});

// Update room.onmessage handler to handle world changes
const originalOnMessage = room.onmessage;
room.onmessage = (event) => {
  if (event.data.type === 'chat' && event.data.clientId !== room.party.client.id) {
    // Store the sender's world when receiving a message
    userWorlds.set(event.data.username, event.data.world);
    
    handleChatMessage(
      event.data.message,
      event.data.username,
      event.data.world,
      Date.now()
    );
  } else if (event.data.type === 'world-change') {
    // Update the user's world in our tracking
    updateUserWorldDisplay(event.data.username, event.data.world);
    
    // Force re-render of chat to update world indicators for this user's messages
    renderChatHistory();
  }
  // Call original handler for other message types
  if (originalOnMessage) {
    originalOnMessage(event);
  }
};

// Modify handleChatMessage to store world info with messages
function handleChatMessage(message, username, world, timestamp) {
  // Store or update the user's world
  userWorlds.set(username, world);

  const msgObj = {
    message,
    username,
    world,
    timestamp
  };

  // Store in appropriate history
  if (chatMode === 'global') {
    globalChatHistory.push(msgObj);
    // Limit history size
    if (globalChatHistory.length > 100) {
      globalChatHistory.shift();
    }
  } else {
    // Only add to public history if it's from current world
    if (world === getCurrentWorld()) {
      publicChatHistory.push(msgObj);
      if (publicChatHistory.length > 100) {
        publicChatHistory.shift();
      }
    }
  }

  renderChatHistory();
}

// Update message rendering to always use the latest known world for a user
function renderChatHistory() {
  const chatContent = document.querySelector('.chat-content');
  chatContent.innerHTML = ''; // Clear current messages
  
  const history = chatMode === 'global' ? globalChatHistory : publicChatHistory;
  // Sort messages in ascending order by timestamp (oldest first)
  const sortedHistory = [...history].sort((a, b) => b.timestamp - a.timestamp);

  sortedHistory.forEach(msg => {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'chat-message user';
    messageDiv.setAttribute('data-timestamp', msg.timestamp);
    
    // Get the user's current world (may be different from when message was sent)
    const currentUserWorld = userWorlds.get(msg.username) || msg.world;
    
    if (chatMode === 'global') {
      // Place world indicator before username for global chat
      messageDiv.innerHTML = `
        <span class="world-indicator">${currentUserWorld}</span>
        <span class="username">${msg.username}</span>
        <span class="separator">: </span>
        ${msg.message}
      `;
    } else {
      messageDiv.innerHTML = `
        <span class="username">${msg.username}</span>
        <span class="separator">: </span>
        ${msg.message}
      `;
    }

    // Add username interaction handlers
    const usernameSpan = messageDiv.querySelector('.username');
    if (usernameSpan && msg.username !== room.party.client.username) {
      usernameSpan.addEventListener('click', (e) => showChatContextMenu(e, msg.username));
      usernameSpan.addEventListener('mouseover', (e) => showUsernameHoverTooltip(e, msg.username));
      usernameSpan.addEventListener('mouseout', hideUsernameHoverTooltip);
      usernameSpan.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        showChatContextMenu(e, msg.username);
      });
    }
    
    chatContent.appendChild(messageDiv);
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

// Function to clear public chat
export function clearPublicChat() {
  publicChatHistory.length = 0; // Clear public chat history
  if (chatMode === 'public') {
    renderChatHistory(); // Only re-render if in public mode
  }
}

// Function to switch chat modes (public/global)
export function switchChatMode(mode) {
  chatMode = mode;
  const tabs = document.querySelectorAll('.chat-tab');
  tabs.forEach(tab => {
    tab.classList.remove('selected');
    if ((mode === 'public' && tab.textContent === 'Public chat') ||
        (mode === 'global' && tab.textContent === 'Global chat')) {
      tab.classList.add('selected');
    }
  });
  renderChatHistory();
}

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
        statusElement.textContent = userWorlds.get(username) || 'World-1'; // Default world
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

// Update chat input handler
const chatInput = document.querySelector('.chat-input');
chatInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter' && chatInput.value.trim()) {
    const message = chatInput.value.trim();
    const currentWorld = getCurrentWorld();
    const timestamp = Date.now();
    
    // Send message with current world info
    room.send({
      type: 'chat',
      message: message,
      world: currentWorld,
      chatMode: chatMode
    });
    
    // Handle message locally
    handleChatMessage(message, room.party.client.username, currentWorld, timestamp);
    
    chatInput.value = '';
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

setInterval(updateOnlineStatus, 3000);