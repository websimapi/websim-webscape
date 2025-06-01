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
  const gameFrame = document.querySelector('#game-screen iframe');
  if (gameFrame && gameFrame.src) {
    const currentUrl = gameFrame.src;
    const worldsMatch = currentUrl.match(/world-(\d+)/);
    return worldsMatch ? `World-${worldsMatch[1]}` : 'World-1';
  }
  return 'World-1'; // Default if iframe or src is not available
}

// Get the username element
const usernameElement = document.getElementById('current-username');

// Update username and online users when connection is established
room.initialize().then(() => {
  room.subscribePresence((presence) => {
    const currentUser = room.peers[room.clientId];
    if (currentUser && currentUser.username) {
      usernameElement.textContent = currentUser.username;
    }

    // Update online users with world information (excluding ignored users)
    onlineUsers.clear();
    for (const clientId in room.peers) {
      const peer = room.peers[clientId];
      const peerPresence = room.presence[clientId];
      const username = peer.username;
      const worldInfo = peerPresence?.world || 'World-1'; // Default to World-1
      if (!isUserIgnored(username)) {
        onlineUsers.set(username, worldInfo);
      }
    }
    // Update online status in friends list
    updateOnlineStatus();

    // Send initial world info
    if (!room.presence[room.clientId]?.world) {
        const initialWorld = getCurrentWorld();
        room.updatePresence({ world: initialWorld });
        room.send({
            type: 'world-change',
            world: initialWorld,
            username: currentUser.username,
            clientId: room.clientId,
        });
    }
  });
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
  for (const clientId in room.peers) {
    const username = room.peers[clientId].username;
    const peerPresence = room.presence[clientId];
    const worldInfo = peerPresence?.world || 'World-1';
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
messageOverlay.className = 'add-friend-overlay'; // Re-uses styling
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

// Global click handler for the message overlay
function handleDocumentClickForMessageOverlay(event) {
  if (messageOverlay.classList.contains('shown')) {
    const dialogContent = messageOverlay.querySelector('.add-friend-container');
    // If click is outside the dialog content and not on the overlay background itself
    if (dialogContent && !dialogContent.contains(event.target) && event.target !== messageOverlay) {
      // Check if the click was on an element that should NOT close the overlay (e.g., context menu items that might open it)
      const isContextMenuTrigger = event.target.closest('.context-menu-option');
      if (!isContextMenuTrigger) {
          hideMessageOverlay();
      }
    }
  }
}
document.addEventListener('click', handleDocumentClickForMessageOverlay, true); // Use capture to catch clicks early

// Behavior for clicks directly on the overlay background
function setupChatOverlayBehavior(overlay) {
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay && overlay.classList.contains('shown')) {
      hideMessageOverlay();
    }
  });
}

// Initialize the behavior for messageOverlay
setupChatOverlayBehavior(messageOverlay);

// Listen for focus changes to close message overlay if iframe gets focus
window.addEventListener('blur', () => {
    // A brief timeout allows document.activeElement to update
    setTimeout(() => {
        const gameIframe = document.querySelector('#game-screen iframe');
        if (document.activeElement === gameIframe && messageOverlay.classList.contains('shown')) {
            hideMessageOverlay();
        }
    }, 0);
}, true); // Use capture to detect blur early


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
      msgDiv.addEventListener('click', (e) => {
        showChatContextMenu(e, msg.recipient);
      });
      msgDiv.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        showChatContextMenu(e, msg.recipient);
      });
    } else {
      msgDiv.innerHTML = `From ${msg.sender}: ${msg.message}`;
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
    
    room.send({
      type: 'chat',
      message: message,
      world: currentWorld,
      // username and clientId are automatically added by websim
    });
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'chat-message user';
    const timestamp = Date.now();
    messageDiv.setAttribute('data-timestamp', timestamp);
    // room.peers[room.clientId].username can be used here
    messageDiv.innerHTML = `<span class="username">${room.peers[room.clientId]?.username || 'Me'}</span><span class="separator">: </span>${message}`;
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
        recipient: recipient,
        // username and clientId are automatically added by websim
      });
      
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
    
    hideMessageOverlay();
  }
});

const chatContextMenu = document.createElement('div');
chatContextMenu.className = 'context-menu';
document.body.appendChild(chatContextMenu);

function showChatContextMenu(e, username) {
  if (username === room.peers[room.clientId]?.username) return;
  
  const gameContainer = document.getElementById('client-wrapper');
  const containerBounds = gameContainer.getBoundingClientRect();
  let xPos = e.pageX;
  let yPos = e.pageY;
  
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
  
  const eventType = 'click'; // Standard click event

  if (messageOption) {
    messageOption.addEventListener(eventType, (event) => {
      event.stopPropagation();
      showMessageOverlay(username);
      hideAllContextMenus();
    }, { once: true });
  }
  
  if (addFriendOption) {
    addFriendOption.addEventListener(eventType, (event) => {
      event.stopPropagation();
      const friendsContainer = document.querySelector('.friends-list .list-container');
      const newFriend = document.createElement('div');
      newFriend.className = 'list-entry';
      newFriend.innerHTML = `
        <span class="player-name">${username}</span>
        <span class="world-status offline">Offline</span>
      `;
      friendsContainer.appendChild(newFriend);
      
      const friendEntries = friendsContainer.querySelectorAll('.list-entry');
      const friendsData = Array.from(friendEntries).map(entry => {
        return { name: entry.querySelector('.player-name').textContent };
      });
      localStorage.setItem('friendsList', JSON.stringify(friendsData));
      updateOnlineStatus(); // Update status for newly added friend
      hideAllContextMenus();
    }, { once: true });
  }
  
  if (removeFriendOption) {
    removeFriendOption.addEventListener(eventType, (event) => {
      event.stopPropagation();
      const friendEntries = document.querySelectorAll('.friends-list .list-entry');
      friendEntries.forEach(entry => {
        const playerName = entry.querySelector('.player-name').textContent;
        if (playerName === username) {
          entry.remove();
        }
      });
      
      const friendsContainer = document.querySelector('.friends-list .list-container');
      const remainingEntries = friendsContainer.querySelectorAll('.list-entry');
      const friendsData = Array.from(remainingEntries).map(entry => {
        return { name: entry.querySelector('.player-name').textContent };
      });
      localStorage.setItem('friendsList', JSON.stringify(friendsData));
      updateOnlineStatus(); // Refresh statuses after removal
      hideAllContextMenus();
    }, { once: true });
  }
  
  if (addIgnoreOption) {
    addIgnoreOption.addEventListener(eventType, (event) => {
      event.stopPropagation();
      const ignoreContainer = document.querySelector('.ignore-list .list-container');
      const newIgnore = document.createElement('div');
      newIgnore.className = 'list-entry';
      newIgnore.innerHTML = `
        <span class="player-name">${username}</span>
        <span class="world-status offline">Offline</span> 
      `;
      ignoreContainer.appendChild(newIgnore);
      
      const ignoreEntries = ignoreContainer.querySelectorAll('.list-entry');
      const ignoreData = Array.from(ignoreEntries).map(entry => {
        return { name: entry.querySelector('.player-name').textContent };
      });
      localStorage.setItem('ignoreList', JSON.stringify(ignoreData));
      
      if (window.updateIgnoredUsers) {
        window.updateIgnoredUsers();
      }
      
      hideAllContextMenus();
    }, { once: true });
  }
  
  cancelOption.addEventListener(eventType, (event) => {
    event.stopPropagation();
    hideAllContextMenus();
  }, { once: true });
}

function hideAllContextMenus() {
  chatContextMenu.classList.remove('shown');
  chatContextMenu.style.left = '';
  chatContextMenu.style.top = '';
  
  // Also hide the friends/ignore list context menu if it exists and is separate
  const genericContextMenu = document.querySelector('body > .context-menu:not(#\\#)'); // Target the one created by contextMenu.js
  if (genericContextMenu && genericContextMenu !== chatContextMenu) {
      genericContextMenu.classList.remove('shown');
  }
}

room.onmessage = (event) => {
  const chatContent = document.querySelector('.chat-content');
  switch (event.data.type) {
    case 'world-change': {
      if (!isUserIgnored(event.data.username)) {
        onlineUsers.set(event.data.username, event.data.world);
        updateOnlineStatus();
      }
      break;
    }
    case 'chat': {
      if (event.data.clientId !== room.clientId && !isUserIgnored(event.data.username)) {
        if (event.data.world === getCurrentWorld()) {
          const username = event.data.username;
          const messageDiv = document.createElement('div');
          messageDiv.className = 'chat-message user';
          const timestamp = Date.now();
          messageDiv.setAttribute('data-timestamp', timestamp);
          messageDiv.innerHTML = `<span class="username">${username}</span><span class="separator">: </span>${event.data.message}`;
          
          const usernameSpan = messageDiv.querySelector('.username');
          if (usernameSpan) {
            usernameSpan.addEventListener('click', (e) => {
              showChatContextMenu(e, username);
            });
            usernameSpan.addEventListener('contextmenu', (e) => {
              e.preventDefault();
              showChatContextMenu(e, username);
            });
          }
          insertIntoChatContent(messageDiv);
        }
      }
      break;
    }
    case 'private-message': {
      if (event.data.recipient === room.peers[room.clientId]?.username && !isUserIgnored(event.data.username)) {
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
      // console.log("Received unhandled event:", event.data);
  }
};

setInterval(updateOnlineStatus, 5000); // Update status periodically

// Global click listener to hide context menus
document.addEventListener('click', (e) => {
    // Check if the click is outside any context menu and not on a username that would trigger one
    if (!e.target.closest('.context-menu') && 
        !e.target.closest('.player-name') && // For friends/ignore lists
        !(e.target.classList.contains('username') && e.target.closest('.chat-message'))) { // For chat messages
      hideAllContextMenus();
    }
}, true); // Use capture phase