// Initialize WebSocket connection
const room = new WebsimSocket();

// Add chat mode tracking 
let chatMode = 'public'; // Can be 'public' or 'global'

// Track chat history separately for global and public
const globalChatHistory = [
  {
    message: "Welcome to Webscape!",
    username: "Welcome to Webscape!",
    world: "System",
    timestamp: Date.now() - 1000
  }
];

const publicChatHistory = [
  {
    message: "Welcome to Webscape!",
    username: "", // Empty username for system messages in public chat 
    world: "System",
    timestamp: Date.now() - 1000
  }
];

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

// NEW: Function to update the online status for friends list entries
function updateOnlineStatus() {
  const friendEntries = document.querySelectorAll('.friends-list .list-entry');
  friendEntries.forEach(entry => {
    const friendName = entry.querySelector('.player-name').textContent;
    const statusElement = entry.querySelector('.world-status');
    if (onlineUsers.has(friendName)) {
      // Get the friend’s current world from our stored mapping (or default to "Online")
      let world = userWorlds.get(friendName) || "Online";
      statusElement.textContent = world;
      // Use green if friend is in the same world, otherwise yellow
      if (world === getCurrentWorld()) {
        statusElement.style.color = "#00ff00";
      } else {
        statusElement.style.color = "#ffff00";
      }
    } else {
      statusElement.textContent = "Offline";
      statusElement.style.color = "#ff0000";
    }
  });
}

// Update the displayed world indicator for chat messages when a user switches worlds
function updateUserWorldDisplay(username, newWorld) {
  userWorlds.set(username, newWorld);
  const chatContent = document.querySelector('.chat-content');
  const userMessages = chatContent ? chatContent.querySelectorAll('.chat-message.user') : [];
    
  userMessages.forEach(messageDiv => {
    const messageUsername = messageDiv.querySelector('.username')
      ? messageDiv.querySelector('.username').textContent
      : '';
    if (messageUsername === username) {
      const worldIndicator = messageDiv.querySelector('.world-indicator');
      if (worldIndicator) {
        worldIndicator.textContent = newWorld;
      }
    }
  });
}

// Room party subscription to update online users and friend statuses
room.party.subscribe((peers) => {
  const currentUser = room.party.client;
  if (currentUser && currentUser.username) {
    const usernameElement = document.getElementById('current-username');
    if (usernameElement) {
      usernameElement.textContent = currentUser.username;
    }
    // Set initial world for current user
    userWorlds.set(currentUser.username, getCurrentWorld());
  }
  
  // Update online users from the peers list
  onlineUsers.clear();
  for (const clientId in peers) {
    onlineUsers.add(peers[clientId].username);
  }
  
  // Update the friends list online status in real time
  updateOnlineStatus();
});

// Update room.onmessage handler to handle world-change and private message events
const originalOnMessage = room.onmessage;
room.onmessage = (event) => {
  const data = event.data;
  
  if (data.type === 'chat' && data.clientId !== room.party.client.id) {
    // Store the sender's world from the message
    userWorlds.set(data.username, data.world);
    handleChatMessage(
      data.message,
      data.username,
      data.world,
      Date.now()
    );
  } else if (data.type === 'world-change') {
    // When a user switches worlds, update their world display
    updateUserWorldDisplay(data.username, data.world);
  } else if (data.type === 'private-message') {
    // Process incoming private messages
    handlePrivateMessage(data);
  }
  
  if (originalOnMessage) {
    originalOnMessage(event);
  }
};

// Modify handleChatMessage to store world info with messages
function handleChatMessage(message, username, world, timestamp) {
  userWorlds.set(username, world);
  const msgObj = { message, username, world, timestamp };

  if (chatMode === 'global') {
    globalChatHistory.push(msgObj);
    if (globalChatHistory.length > 100) {
      globalChatHistory.shift();
    }
  } else {
    if (world === getCurrentWorld()) {
      publicChatHistory.push(msgObj);
      if (publicChatHistory.length > 100) {
        publicChatHistory.shift();
      }
    }
  }
  renderChatHistory();
}

// Update renderChatHistory to display messages in the correct order and format
function renderChatHistory() {
  const chatContent = document.querySelector('.chat-content');
  if (!chatContent) return;
  
  chatContent.innerHTML = ''; // Clear current messages
  const history = chatMode === 'global' ? globalChatHistory : publicChatHistory;
  const sortedHistory = [...history].sort((a, b) => b.timestamp - a.timestamp);
  
  sortedHistory.forEach(msg => {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'chat-message user';
    messageDiv.setAttribute('data-timestamp', msg.timestamp);
    
    if (msg.world === 'System') {
      messageDiv.className = 'chat-message system';
      if (chatMode === 'global') {
        messageDiv.innerHTML = `
          <span class="world-indicator" style="color: maroon;">System</span>
          <span class="message">${msg.username}</span>
        `;
      } else {
        messageDiv.innerHTML = msg.message;
      }
    } else {
      if (chatMode === 'global') {
        messageDiv.innerHTML = `
          <span class="world-indicator" style="color: ${msg.world === getCurrentWorld() ? '#00ff00' : '#ffff00'};">
            ${userWorlds.get(msg.username) || msg.world}
          </span>
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
    }
    
    chatContent.appendChild(messageDiv);
  });
}

// Create message overlay for private messaging
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

/* Helper functions for inserting messages in sorted order */
function insertIntoChatContent(msgDiv) {
  const chatContent = document.querySelector('.chat-content');
  const newTimestamp = parseFloat(msgDiv.getAttribute('data-timestamp'));
  let inserted = false;
  
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
    while (splitContainer.childElementCount > 5) {
      splitContainer.removeChild(splitContainer.firstElementChild);
    }
  }
}

// Re-render all private messages based on current split-chat mode.
function renderAllPrivateMessages() {
  const splitPrivate = localStorage.getItem('splitPrivateChat') === 'true';
  const chatContent = document.querySelector('.chat-content');
  const existingPrivate = chatContent.querySelectorAll('.chat-message.private-message');
  existingPrivate.forEach(elem => elem.remove());
  
  const splitContainer = document.getElementById('split-private-chat');
  if (splitContainer) {
    splitContainer.innerHTML = '';
  }
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

// UPDATED: Modify handlePrivateMessage to persist incoming messages
function handlePrivateMessage(data) {
  let msgObj;
  if (data.recipient === room.party.client.username) {
    msgObj = {
      direction: 'from',
      sender: data.username,
      message: data.message,
      timestamp: Date.now(),
      recipient: data.recipient
    };
  } else {
    msgObj = {
      direction: 'to',
      recipient: data.recipient,
      message: data.message,
      timestamp: Date.now()
    };
  }
  privateMessageHistory.push(msgObj);
  renderAllPrivateMessages();
}

// Chat input handler for sending outgoing public messages
const chatInput = document.querySelector('.chat-input');
chatInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter' && chatInput.value.trim()) {
    const message = chatInput.value.trim();
    const currentWorld = getCurrentWorld();
    const timestamp = Date.now();
    
    room.send({
      type: 'chat',
      message: message,
      world: currentWorld,
      chatMode: chatMode
    });
    
    handleChatMessage(message, room.party.client.username, currentWorld, timestamp);
    chatInput.value = '';
  }
});

// Create a reusable context menu for chat interactions
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

// NEW: Function to switch chat modes (e.g., public to global)
function switchChatMode(mode) {
  chatMode = mode;
  renderChatHistory();
}

setInterval(updateOnlineStatus, 3000);

export { switchChatMode };