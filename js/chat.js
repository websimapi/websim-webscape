import { DebugLogger, DOMDebug } from './debug.js';

// Initialize WebSocket connection
const room = new WebsimSocket();
DebugLogger.info('INIT', 'Chat WebSocket initialized');

// Global array to store private message history
const privateMessageHistory = [];

// Track online users
let onlineUsers = new Set();

DebugLogger.debug('INIT', 'Chat state initialized', {
  historyLength: privateMessageHistory.length,
  onlineUsers: Array.from(onlineUsers)
});

// Get the username element
const usernameElement = DOMDebug.checkElement('#current-username', 'Username Display');

// Update username and online users when connection is established
room.party.subscribe((peers) => {
  const currentUser = room.party.client;
  DebugLogger.debug('NETWORK', 'Party update received', {
    currentUser: currentUser?.username,
    peerCount: Object.keys(peers).length,
    peers: Object.values(peers).map(p => p.username)
  });

  if (currentUser && currentUser.username) {
    usernameElement.textContent = currentUser.username;
    DebugLogger.debug('DOM', 'Username updated', { username: currentUser.username });
  }
  
  // Update online users
  const previousUsers = Array.from(onlineUsers);
  onlineUsers.clear();
  for (const clientId in peers) {
    onlineUsers.add(peers[clientId].username);
  }
  
  DebugLogger.debug('NETWORK', 'Online users updated', {
    previous: previousUsers,
    current: Array.from(onlineUsers),
    added: Array.from(onlineUsers).filter(u => !previousUsers.includes(u)),
    removed: previousUsers.filter(u => !onlineUsers.has(u))
  });
  
  updateOnlineStatus();
});

function updateOnlineStatus() {
  DebugLogger.debug('DOM', 'Updating online status indicators');
  
  const friendEntries = document.querySelectorAll('.friends-list .list-entry');
  friendEntries.forEach(entry => {
    const username = entry.querySelector('.player-name').textContent;
    const statusElement = entry.querySelector('.world-status');
    const wasOnline = !statusElement.classList.contains('offline');
    const isOnline = onlineUsers.has(username);
    
    if (isOnline !== wasOnline) {
      DebugLogger.debug('DOM', 'Status change detected', {
        username,
        wasOnline,
        isOnline
      });
    }

    if (isOnline) {
      statusElement.textContent = 'World-1';
      statusElement.classList.remove('offline');
    } else {
      statusElement.textContent = 'Offline';
      statusElement.classList.add('offline');
    }
  });
}

// Message overlay setup
const messageOverlay = document.createElement('div');
messageOverlay.id = 'message-overlay';
messageOverlay.className = 'add-friend-overlay';
messageOverlay.innerHTML = `
  <div class="add-friend-container">
    <div class="add-friend-text">Enter message to send to <span class="message-username"></span></div>
    <input type="text" class="add-friend-input" maxlength="80">
  </div>
`;

const chatWindow = DOMDebug.checkElement('#chat-window', 'Chat Window');
if (chatWindow) {
  chatWindow.appendChild(messageOverlay);
  DebugLogger.debug('DOM', 'Message overlay added to chat window');
}

const messageInput = messageOverlay.querySelector('.add-friend-input');
const messageUsernameSpan = messageOverlay.querySelector('.message-username');

function showMessageOverlay(username) {
  DebugLogger.debug('DOM', 'Showing message overlay', { targetUser: username });
  messageUsernameSpan.textContent = username;
  messageOverlay.classList.add('shown');
  messageInput.value = '';
  messageInput.focus();
}

window.showMessageOverlay = showMessageOverlay;

function setupOverlay(overlay, input) {
  DebugLogger.debug('INIT', 'Setting up chat overlay', {
    overlayId: overlay.id,
    inputType: input.type
  });

  chatWindow.addEventListener('click', (e) => {
    if (!overlay.contains(e.target) && !input.contains(e.target)) {
      DebugLogger.debug('EVENTS', 'Closing overlay from outside click');
      overlay.classList.remove('shown');
    }
  });
}

setupOverlay(messageOverlay, messageInput);

function insertIntoChatContent(msgDiv) {
  const chatContent = document.querySelector('.chat-content');
  if (!chatContent) {
    DebugLogger.error('DOM', 'Chat content container not found');
    return;
  }

  const newTimestamp = parseFloat(msgDiv.getAttribute('data-timestamp'));
  DebugLogger.debug('DOM', 'Inserting message into chat', {
    timestamp: newTimestamp,
    content: msgDiv.textContent,
    type: msgDiv.classList.contains('private-message') ? 'private' : 'public'
  });

  let inserted = false;
  for (let i = 0; i < chatContent.children.length; i++) {
    const child = chatContent.children[i];
    const childTimestamp = parseFloat(child.getAttribute('data-timestamp') || "0");
    if (childTimestamp <= newTimestamp) {
      chatContent.insertBefore(msgDiv, child);
      inserted = true;
      DebugLogger.debug('DOM', 'Message inserted at position', { position: i });
      break;
    }
  }
  if (!inserted) {
    chatContent.appendChild(msgDiv);
    DebugLogger.debug('DOM', 'Message appended at end');
  }
}

function insertIntoSplitChat(msgDiv) {
  const splitContainer = document.getElementById('split-private-chat');
  if (splitContainer) {
    DebugLogger.debug('DOM', 'Inserting message into split chat', {
      content: msgDiv.textContent
    });
    
    splitContainer.appendChild(msgDiv);
    
    while (splitContainer.childElementCount > 5) {
      DebugLogger.debug('DOM', 'Removing oldest split chat message');
      splitContainer.removeChild(splitContainer.firstElementChild);
    }
  } else {
    DebugLogger.error('DOM', 'Split chat container not found');
  }
}

function renderAllPrivateMessages() {
  const splitPrivate = localStorage.getItem('splitPrivateChat') === 'true';
  DebugLogger.info('DOM', 'Re-rendering all private messages', {
    splitMode: splitPrivate,
    messageCount: privateMessageHistory.length
  });

  const chatContent = document.querySelector('.chat-content');
  if (!chatContent) {
    DebugLogger.error('DOM', 'Chat content container not found');
    return;
  }

  // Remove existing private messages
  const existingPrivate = chatContent.querySelectorAll('.chat-message.private-message');
  DebugLogger.debug('DOM', 'Removing existing private messages', {
    count: existingPrivate.length
  });
  existingPrivate.forEach(elem => elem.remove());

  const splitContainer = document.getElementById('split-private-chat');
  if (splitContainer) {
    splitContainer.innerHTML = '';
    DebugLogger.debug('DOM', 'Cleared split chat container');
  }

  // Re-insert all private messages
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

  DebugLogger.debug('DOM', 'Private messages re-rendering complete');
}

window.renderPrivateMessages = renderAllPrivateMessages;

// Chat input handlers
const chatInput = document.querySelector('.chat-input');
chatInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter' && chatInput.value.trim()) {
    const message = chatInput.value.trim();
    DebugLogger.debug('EVENTS', 'Public message submitted', {
      message,
      sender: room.party.client.username
    });

    room.send({
      type: 'chat',
      message: message
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

// Private message input handler
messageInput.addEventListener('keypress', async (e) => {
  if (e.key === 'Enter' && messageInput.value.trim()) {
    const message = messageInput.value.trim();
    const recipient = messageUsernameSpan.textContent;
    
    DebugLogger.debug('EVENTS', 'Private message attempt', {
      recipient,
      message,
      recipientOnline: onlineUsers.has(recipient)
    });

    if (onlineUsers.has(recipient)) {
      room.send({
        type: 'private-message',
        message: message,
        recipient: recipient
      });
      
      const msgObj = {
        direction: 'to',
        recipient: recipient,
        message: message,
        timestamp: Date.now()
      };
      
      privateMessageHistory.push(msgObj);
      DebugLogger.debug('EVENTS', 'Private message sent', msgObj);

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
      DebugLogger.warn('EVENTS', 'Private message failed - recipient offline', {
        recipient
      });

      const chatContent = document.querySelector('.chat-content');
      const messageDiv = document.createElement('div');
      messageDiv.className = 'chat-message system';
      const timestamp = Date.now();
      messageDiv.setAttribute('data-timestamp', timestamp);
      messageDiv.innerHTML = `Unable to send message - player ${recipient} is offline.`;
      insertIntoChatContent(messageDiv);
    }
    
    messageOverlay.classList.remove('shown');
  }
});

// Context menu setup
const chatContextMenu = document.createElement('div');
chatContextMenu.className = 'context-menu';
document.body.appendChild(chatContextMenu);

// Username tooltip setup
const chatUsernameTooltip = document.createElement('div');
chatUsernameTooltip.className = 'action-tooltip';
chatUsernameTooltip.style.display = 'none';
document.body.appendChild(chatUsernameTooltip);

function showChatContextMenu(e, username) {
  if (username === room.party.client.username) {
    DebugLogger.debug('EVENTS', 'Context menu suppressed for self');
    return;
  }
  
  DebugLogger.debug('DOM', 'Showing chat context menu', {
    username,
    x: e.pageX,
    y: e.pageY
  });

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
  
  // Position menu within bounds
  const menuBounds = chatContextMenu.getBoundingClientRect();
  if (xPos + menuBounds.width > containerBounds.right) {
    xPos = containerBounds.right - menuBounds.width - 10;
  }
  if (yPos + menuBounds.height > containerBounds.bottom) {
    yPos = containerBounds.bottom - menuBounds.height - 10;
  }
  xPos = Math.max(containerBounds.left + 10, xPos);
  yPos = Math.max(containerBounds.top + 10, yPos);
  
  DebugLogger.debug('DOM', 'Context menu positioned', {
    final: { x: xPos, y: yPos },
    bounds: {
      container: containerBounds,
      menu: menuBounds
    }
  });

  chatContextMenu.style.left = `${xPos}px`;
  chatContextMenu.style.top = `${yPos}px`;
  
  setupContextMenuHandlers(username);
}

function setupContextMenuHandlers(username) {
  const messageOption = chatContextMenu.querySelector('.message');
  const addFriendOption = chatContextMenu.querySelector('.add-friend');
  const addIgnoreOption = chatContextMenu.querySelector('.add-ignore');
  const cancelOption = chatContextMenu.querySelector('.cancel');
  
  messageOption.addEventListener('click', (event) => {
    event.stopPropagation();
    DebugLogger.debug('EVENTS', 'Context menu: Message selected', { username });
    showMessageOverlay(username);
    hideAllContextMenus();
  });
  
  addFriendOption.addEventListener('click', (event) => {
    event.stopPropagation();
    DebugLogger.debug('EVENTS', 'Context menu: Add friend selected', { username });
    
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
    DebugLogger.debug('EVENTS', 'Context menu: Add ignore selected', { username });
    
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
    DebugLogger.debug('EVENTS', 'Context menu: Cancel selected');
    hideAllContextMenus();
  });
}

function hideAllContextMenus() {
  DebugLogger.debug('DOM', 'Hiding all context menus');
  chatContextMenu.classList.remove('shown');
  chatContextMenu.style.left = '';
  chatContextMenu.style.top = '';
}

function showUsernameHoverTooltip(e, username) {
  if (username === room.party.client.username) return;
  
  DebugLogger.debug('DOM', 'Showing username tooltip', { username });
  chatUsernameTooltip.textContent = `Add Friend / 1 more option`;
  chatUsernameTooltip.style.display = 'block';
  
  const gameScreen = document.getElementById('game-screen');
  const gameRect = gameScreen.getBoundingClientRect();
  chatUsernameTooltip.style.top = `${gameRect.top + 5}px`;
  chatUsernameTooltip.style.left = `${gameRect.left + 5}px`;
}

function hideUsernameHoverTooltip() {
  DebugLogger.debug('DOM', 'Hiding username tooltip');
  chatUsernameTooltip.style.display = 'none';
}

// WebSocket message handler
room.onmessage = (event) => {
  DebugLogger.debug('NETWORK', 'WebSocket message received', {
    type: event.data.type,
    sender: event.data.username
  });

  const chatContent = document.querySelector('.chat-content');
  switch (event.data.type) {
    case 'chat': {
      if (event.data.clientId !== room.party.client.id) {
        const username = event.data.username;
        DebugLogger.debug('EVENTS', 'Public message received', {
          from: username,
          message: event.data.message
        });

        const messageDiv = document.createElement('div');
        messageDiv.className = 'chat-message user';
        const timestamp = Date.now();
        messageDiv.setAttribute('data-timestamp', timestamp);
        messageDiv.innerHTML = `<span class="username">${username}</span><span class="separator">: </span>${event.data.message}`;
        
        setupMessageInteractions(messageDiv, username);
        insertIntoChatContent(messageDiv);
      }
      break;
    }
    case 'private-message': {
      if (event.data.recipient === room.party.client.username) {
        DebugLogger.debug('EVENTS', 'Private message received', {
          from: event.data.username,
          message: event.data.message
        });

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
      DebugLogger.warn('NETWORK', 'Unhandled message type', {
        type: event.data.type,
        data: event.data
      });
  }
};

function setupMessageInteractions(messageDiv, username) {
  const usernameSpan = messageDiv.querySelector('.username');
  
  usernameSpan.addEventListener('click', (e) => {
    DebugLogger.debug('EVENTS', 'Username clicked', { username });
    showChatContextMenu(e, username);
  });
  
  usernameSpan.addEventListener('mouseover', (e) => {
    DebugLogger.debug('EVENTS', 'Username hover start', { username });
    showUsernameHoverTooltip(e, username);
  });
  
  usernameSpan.addEventListener('mouseout', (e) => {
    DebugLogger.debug('EVENTS', 'Username hover end', { username });
    hideUsernameHoverTooltip();
  });
  
  usernameSpan.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    DebugLogger.debug('EVENTS', 'Username right-click', { username });
    showChatContextMenu(e, username);
  });
}

// Initialize status update interval
setInterval(updateOnlineStatus, 3000);

DebugLogger.info('INIT', 'Chat system initialization complete');