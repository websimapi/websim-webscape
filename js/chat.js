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

// Track private message history with better structure
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
  const data = event.data;
  
  if (data.type === 'private-message') {
    // Handle incoming private message
    handlePrivateMessage(data);
  } else if (data.type === 'world-change') {
    // Handle world change events
    updateUserWorldDisplay(data.username, data.world);
  } else if (data.type === 'chat' && data.clientId !== room.party.client.id) {
    // Store the sender's world when receiving a message
    userWorlds.set(data.username, data.world);
    
    handleChatMessage(
      data.message,
      data.username,
      data.world,
      Date.now()
    );
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

  // When rendering chat, preserve any private messages that are currently displayed
  const chatContent = document.querySelector('.chat-content');
  const existingPrivateMessages = Array.from(chatContent.querySelectorAll('.private-message')).map(msg => {
    return {
      html: msg.innerHTML,
      timestamp: msg.getAttribute('data-timestamp')
    };
  });

  renderChatHistory();

  // If split chat is off, restore private messages to main chat
  const splitPrivate = localStorage.getItem('splitPrivateChat') === 'true';
  if (!splitPrivate) {
    existingPrivateMessages.forEach(msg => {
      const privateMsg = document.createElement('div');
      privateMsg.className = 'chat-message private-message';
      privateMsg.setAttribute('data-timestamp', msg.timestamp);
      privateMsg.innerHTML = msg.html;
      
      // Insert maintaining timestamp order
      let inserted = false;
      const messages = chatContent.children;
      for (let i = 0; i < messages.length; i++) {
        const existingTimestamp = parseFloat(messages[i].getAttribute('data-timestamp') || '0');
        if (existingTimestamp <= parseFloat(msg.timestamp)) {
          chatContent.insertBefore(privateMsg, messages[i]);
          inserted = true;
          break;
        }
      }
      if (!inserted) {
        chatContent.appendChild(privateMsg);
      }
    });
  }
}

function handlePrivateMessage(data) {
  // Create message object for history
  const msgObj = {
    direction: data.recipient === room.party.client.username ? 'from' : 'to',
    sender: data.username,
    recipient: data.recipient,
    message: data.message,
    timestamp: Date.now()
  };
  
  // Add to history without clearing existing messages
  privateMessageHistory.push(msgObj);

  // Create DOM element
  const msgDiv = document.createElement('div');
  msgDiv.className = 'chat-message private-message';
  msgDiv.setAttribute('data-timestamp', msgObj.timestamp);

  // Format message based on direction
  if (msgObj.direction === 'from') {
    msgDiv.innerHTML = `From ${msgObj.sender}: ${msgObj.message}`;
  } else {
    msgDiv.innerHTML = `To ${msgObj.recipient}: ${msgObj.message}`;
  }

  // Insert into appropriate container based on split chat setting
  const splitPrivate = localStorage.getItem('splitPrivateChat') === 'true';
  const splitContainer = document.getElementById('split-private-chat');
  const chatContent = document.querySelector('.chat-content');

  if (splitPrivate && splitContainer) {
    // Add to split chat
    const clone = msgDiv.cloneNode(true);
    splitContainer.appendChild(clone);
    // Keep only last 5 messages in split view
    while (splitContainer.childElementCount > 5) {
      splitContainer.removeChild(splitContainer.firstChild);
    }
  } else {
    // Insert into main chat maintaining timestamp order
    let inserted = false;
    const messages = chatContent.children;
    for (let i = 0; i < messages.length; i++) {
      const existingTimestamp = parseFloat(messages[i].getAttribute('data-timestamp') || '0');
      if (existingTimestamp <= msgObj.timestamp) {
        chatContent.insertBefore(msgDiv, messages[i]);
        inserted = true;
        break;
      }
    }
    if (!inserted) {
      chatContent.appendChild(msgDiv);
    }
  }
}

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
    
    // Add data-system attribute for styling if it's a system message
    if (msg.world === 'System') {
      messageDiv.setAttribute('data-system', 'true');
    }
    
    // Get the user's current world (may be different from when message was sent)
    const currentUserWorld = userWorlds.get(msg.username) || msg.world;
    
    // Special handling for system messages
    if (msg.world === 'System') {
      messageDiv.className = 'chat-message system';
      if (chatMode === 'global') {
        messageDiv.innerHTML = `
          <span class="world-indicator">System</span>
          <span class="message">${msg.username}</span>
        `;
      } else {
        // In public chat, just show the message directly
        messageDiv.innerHTML = msg.message;
      }
    } else {
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
  const splitContainer = document.getElementById('split-private-chat');

  // Remove existing private messages
  const existingPrivate = chatContent.querySelectorAll('.chat-message.private-message');
  existingPrivate.forEach(elem => elem.remove());
  
  if (splitContainer) {
    splitContainer.innerHTML = '';
  }

  // Re-insert all private messages based on timestamp order
  const sortedMessages = [...privateMessageHistory].sort((a, b) => b.timestamp - a.timestamp);

  sortedMessages.forEach(msg => {
    const msgDiv = document.createElement('div');
    msgDiv.className = 'chat-message private-message';
    msgDiv.setAttribute('data-timestamp', msg.timestamp);

    // Format message based on direction
    if (msg.direction === 'from') {
      msgDiv.innerHTML = `From ${msg.sender}: ${msg.message}`;
    } else {
      msgDiv.innerHTML = `To ${msg.recipient}: ${msg.message}`;
    }

    // Handle split chat mode
    if (splitPrivate) {
      if (splitContainer) {
        const clone = msgDiv.cloneNode(true);
        splitContainer.appendChild(clone);
        // Keep only last 5 messages in split view
        while (splitContainer.childElementCount > 5) {
          splitContainer.removeChild(splitContainer.firstChild);
        }
      }
    } else {
      let inserted = false;
      const messages = chatContent.children;
      for (let i = 0; i < messages.length; i++) {
        const timestamp = parseFloat(messages[i].getAttribute('data-timestamp') || '0');
        if (timestamp <= parseFloat(msgDiv.getAttribute('data-timestamp'))) {
          chatContent.insertBefore(msgDiv, messages[i]);
          inserted = true;
          break;
        }
      }
      if (!inserted) {
        chatContent.appendChild(msgDiv);
      }
    }
  });
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
      
      // Add to private message history
      const msgObj = {
        direction: 'to',
        sender: room.party.client.username,
        recipient: recipient,
        message: message,
        timestamp: Date.now()
      };
      privateMessageHistory.push(msgObj);
      
      // Render all private messages to maintain history
      renderAllPrivateMessages();
      
      messageOverlay.classList.remove('shown');
      messageInput.value = '';
    } else {
      const chatContent = document.querySelector('.chat-content');
      const messageDiv = document.createElement('div');
      messageDiv.className = 'chat-message system';
      messageDiv.setAttribute('data-timestamp', Date.now());
      messageDiv.innerHTML = `Unable to send message - player ${recipient} is offline.`;
      
      let inserted = false;
      const messages = chatContent.children;
      for (let i = 0; i < messages.length; i++) {
        const timestamp = parseFloat(messages[i].getAttribute('data-timestamp') || '0');
        if (timestamp <= parseFloat(messageDiv.getAttribute('data-timestamp'))) {
          chatContent.insertBefore(messageDiv, messages[i]);
          inserted = true;
          break;
        }
      }
      if (!inserted) {
        chatContent.appendChild(messageDiv);
      }
      
      messageOverlay.classList.remove('shown');
      messageInput.value = '';
    }
  }
});

// Function to clear public chat
export function clearPublicChat() {
  // Keep only the Welcome message
  const welcomeMessage = publicChatHistory.find(msg => 
    msg.message === "Welcome to Webscape!" && msg.world === "System"
  );
  publicChatHistory.length = 0; // Clear the array
  if (welcomeMessage) {
    publicChatHistory.push(welcomeMessage); // Add back the welcome message
  }
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

setInterval(updateOnlineStatus, 3000);