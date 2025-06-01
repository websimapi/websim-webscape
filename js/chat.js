// Initialize WebSocket connection
const room = new WebsimSocket();

// Global array to store private message history
const privateMessageHistory = [];

// Track online users with world information
let onlineUsers = new Map();

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

// Check if a user is online (not ignored)
function isUserOnline(username) {
  return onlineUsers.has(username);
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
  
  // Update online users with world information (excluding ignored users)
  onlineUsers.clear();
  for (const clientId in peers) {
    const username = peers[clientId].username;
    const worldInfo = peers[clientId].world || 'World-1'; // Default to World-1
    if (!isUserIgnored(username)) {
      onlineUsers.set(username, worldInfo);
    }
  }
  
  // Update online status in friends list
  updateOnlineStatus();
});

// Function to update ignored users in real-time
function updateIgnoredUsers() {
  const ignoredUsers = getIgnoredUsers();
  
  // Remove ignored users from onlineUsers
  for (const [username, world] of onlineUsers.entries()) {
    if (ignoredUsers.has(username)) {
      onlineUsers.delete(username);
    }
  }
  
  // Add previously ignored users back if they're online and no longer ignored
  for (const clientId in room.party.peers) {
    const username = room.party.peers[clientId].username;
    const worldInfo = room.party.peers[clientId].world || 'World-1';
    if (!ignoredUsers.has(username) && !onlineUsers.has(username)) {
      onlineUsers.set(username, worldInfo);
    }
  }
  
  updateOnlineStatus();
}

// Export function globally
window.updateIgnoredUsers = updateIgnoredUsers;

// Function to update online status in friends list
function updateOnlineStatus() {
  const friendEntries = document.querySelectorAll('.friends-list .list-entry');
  const currentWorld = getCurrentWorld();

  friendEntries.forEach(entry => {
    const username = entry.querySelector('.player-name').textContent;
    const statusElement = entry.querySelector('.world-status');
    
    if (onlineUsers.has(username)) {
      const userWorld = onlineUsers.get(username);
      statusElement.textContent = userWorld;
      statusElement.classList.remove('offline');
      
      // Update color based on world comparison
      if (userWorld === currentWorld) {
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

// Function to handle Escape key for messageOverlay
function handleMessageOverlayEscape(event) {
  if (event.key === 'Escape' && messageOverlay.classList.contains('shown')) {
    hideMessageOverlay();
  }
}

// Function to hide the overlay and clean up listeners
function hideMessageOverlay() {
  if (messageOverlay.classList.contains('shown')) {
    messageOverlay.classList.remove('shown');
    document.removeEventListener('keydown', handleMessageOverlayEscape);
  }
}

function showMessageOverlay(username) {
  // Don't allow messaging ignored users
  if (isUserIgnored(username)) {
    return;
  }
  
  messageUsernameSpan.textContent = username;
  messageOverlay.classList.add('shown');
  messageInput.value = '';
  messageInput.focus();
  
  // Add Escape key listener when overlay is shown
  document.addEventListener('keydown', handleMessageOverlayEscape);
}

// Export the showMessageOverlay globally so it can be used elsewhere
window.showMessageOverlay = showMessageOverlay;

// Renamed setupOverlay to setupChatOverlayBehavior for clarity.
// This function sets up behaviors for the chat's messageOverlay.
function setupChatOverlayBehavior(overlay, input) {
  const chatWindow = document.getElementById('chat-window');

  // Listener for clicks on chatWindow parts *not* covered by messageOverlay (e.g., chat tabs)
  chatWindow.addEventListener('click', (e) => {
    if (overlay.classList.contains('shown')) {
      // If the click is on chatWindow but not within the overlay element itself
      if (!overlay.contains(e.target)) {
        hideMessageOverlay(); // Use the centralized hide function
      }
    }
  });

  // Listener for clicks directly on the overlay's background
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay && overlay.classList.contains('shown')) {
      hideMessageOverlay(); // Use the centralized hide function
    }
  });
}

// Initialize the behavior for messageOverlay
setupChatOverlayBehavior(messageOverlay, messageInput);

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
      // Add click event listener for outgoing messages
      msgDiv.addEventListener('click', (e) => {
        showChatContextMenu(e, msg.recipient);
      });
      msgDiv.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        showChatContextMenu(e, msg.recipient);
      });
    } else {
      msgDiv.innerHTML = `From ${msg.sender}: ${msg.message}`;
      // Add click event listener for incoming messages
      msgDiv.addEventListener('click', (e) => {
        showChatContextMenu(e, msg.sender);
      });
      msgDiv.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        showChatContextMenu(e, msg.sender);
      });
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
    
    if (isUserOnline(recipient)) {
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
      const timestamp = Date.now();
      messageDiv.setAttribute('data-timestamp', timestamp);
      messageDiv.innerHTML = `Unable to send message - player ${recipient} is offline.`;
      insertIntoChatContent(messageDiv);
    }
    
    hideMessageOverlay(); // Use centralized hide function
  }
});

// Create a reusable chat context menu element.
const chatContextMenu = document.createElement('div');
chatContextMenu.className = 'context-menu';
document.body.appendChild(chatContextMenu);

function showChatContextMenu(e, username) {
  if (username === room.party.client.username) return;
  
  const gameContainer = document.getElementById('client-wrapper');
  const containerBounds = gameContainer.getBoundingClientRect();
  let xPos = e.pageX;
  let yPos = e.pageY;
  
  // Check if user is on friends list
  const friendEntries = document.querySelectorAll('.friends-list .list-entry');
  const isOnFriendsList = Array.from(friendEntries).some(entry => 
    entry.querySelector('.player-name').textContent === username
  );
  
  if (isOnFriendsList) {
    chatContextMenu.innerHTML = `
      <div class="context-menu-option message">Message ${username}</div>
      <div class="context-menu-option remove-friend">Remove Friend ${username}</div>
      <div class="context-menu-option cancel">Cancel</div>
    `;
  } else {
    chatContextMenu.innerHTML = `
      <div class="context-menu-option add-friend">Add Friend ${username}</div>
      <div class="context-menu-option add-ignore">Add Ignore ${username}</div>
      <div class="context-menu-option cancel">Cancel</div>
    `;
  }
  
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
  const removeFriendOption = chatContextMenu.querySelector('.remove-friend');
  const addIgnoreOption = chatContextMenu.querySelector('.add-ignore');
  const cancelOption = chatContextMenu.querySelector('.cancel');
  
  if (messageOption) {
    messageOption.addEventListener('click', (event) => {
      event.stopPropagation();
      showMessageOverlay(username);
      hideAllContextMenus();
    });
  }
  
  if (addFriendOption) {
    addFriendOption.addEventListener('click', (event) => {
      event.stopPropagation();
      const friendsContainer = document.querySelector('.friends-list .list-container');
      const newFriend = document.createElement('div');
      newFriend.className = 'list-entry';
      newFriend.innerHTML = `
        <span class="player-name">${username}</span>
        <span class="world-status offline">Offline</span>
      `;
      friendsContainer.appendChild(newFriend);
      
      // Save to localStorage
      const friendEntries = friendsContainer.querySelectorAll('.list-entry');
      const friendsData = Array.from(friendEntries).map(entry => {
        return { name: entry.querySelector('.player-name').textContent };
      });
      localStorage.setItem('friendsList', JSON.stringify(friendsData));
      
      hideAllContextMenus();
    });
  }
  
  if (removeFriendOption) {
    removeFriendOption.addEventListener('click', (event) => {
      event.stopPropagation();
      const friendEntries = document.querySelectorAll('.friends-list .list-entry');
      friendEntries.forEach(entry => {
        const playerName = entry.querySelector('.player-name').textContent;
        if (playerName === username) {
          entry.remove();
        }
      });
      
      // Save to localStorage
      const friendsContainer = document.querySelector('.friends-list .list-container');
      const remainingEntries = friendsContainer.querySelectorAll('.list-entry');
      const friendsData = Array.from(remainingEntries).map(entry => {
        return { name: entry.querySelector('.player-name').textContent };
      });
      localStorage.setItem('friendsList', JSON.stringify(friendsData));
      
      hideAllContextMenus();
    });
  }
  
  if (addIgnoreOption) {
    addIgnoreOption.addEventListener('click', (event) => {
      event.stopPropagation();
      const ignoreContainer = document.querySelector('.ignore-list .list-container');
      const newIgnore = document.createElement('div');
      newIgnore.className = 'list-entry';
      newIgnore.innerHTML = `
        <span class="player-name">${username}</span>
        <span class="world-status offline">Offline</span>
      `;
      ignoreContainer.appendChild(newIgnore);
      
      // Save to localStorage
      const ignoreEntries = ignoreContainer.querySelectorAll('.list-entry');
      const ignoreData = Array.from(ignoreEntries).map(entry => {
        return { name: entry.querySelector('.player-name').textContent };
      });
      localStorage.setItem('ignoreList', JSON.stringify(ignoreData));
      
      // Update ignored users status
      if (window.updateIgnoredUsers) {
        window.updateIgnoredUsers();
      }
      
      hideAllContextMenus();
    });
  }
  
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

room.onmessage = (event) => {
  const chatContent = document.querySelector('.chat-content');
  switch (event.data.type) {
    case 'world-change': {
      // Update user's world information in onlineUsers if not ignored
      if (!isUserIgnored(event.data.username)) {
        onlineUsers.set(event.data.username, event.data.world);
        updateOnlineStatus();
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
        
        // Add click event listener for context menu
        msgDiv.addEventListener('click', (e) => {
          showChatContextMenu(e, msgObj.sender);
        });
        msgDiv.addEventListener('contextmenu', (e) => {
          e.preventDefault();
          showChatContextMenu(e, msgObj.sender);
        });
        
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

document.addEventListener('click', (e) => {
  if (!e.target.closest('.context-menu') && !e.target.closest('.player-name')) {
    hideAllContextMenus();
  }
});