// Initialize WebSocket connection
const room = new WebsimSocket();

// Global array to store private message history
const privateMessageHistory = [];

// Use Map instead of Set for better performance with large sets
const onlineUsers = new Map();

document.addEventListener('DOMContentLoaded', () => {
  // Cache DOM queries
  const messageOverlay = document.getElementById('message-overlay');
  const messageInput = messageOverlay?.querySelector('.add-friend-input');
  const messageUsernameSpan = messageOverlay?.querySelector('.message-username');
  const chatContent = document.querySelector('.chat-content');
  const splitContainer = document.getElementById('split-private-chat');
  const usernameElement = document.getElementById('current-username');

  if (!messageOverlay || !messageInput || !messageUsernameSpan || !chatContent || !splitContainer || !usernameElement) {
    console.error('Required chat elements not found');
    return;
  }

  // Debounce function for performance-critical operations
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // Throttle function for frequent events
  function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    }
  }

  // Debounced version of updateOnlineStatus
  const debouncedUpdateOnlineStatus = debounce(() => {
    const friendEntries = document.querySelectorAll('.friends-list .list-entry');
    const fragment = document.createDocumentFragment();
  
    friendEntries.forEach(entry => {
      const username = entry.querySelector('.player-name').textContent;
      const statusElement = entry.querySelector('.world-status');
      if (onlineUsers.has(username)) {
        const world = onlineUsers.get(username);
        if (!statusElement.textContent || statusElement.textContent === 'Offline') {
          statusElement.textContent = world || 'World-1';
        }
        statusElement.classList.remove('offline');
      } else {
        statusElement.textContent = 'Offline';
        statusElement.classList.add('offline');
      }
    });
  }, 100);

  // Throttled message insertion
  const throttledInsertMessage = throttle((msgDiv) => {
    if (!chatContent.contains(msgDiv)) {
      insertIntoChatContent(msgDiv);
    }
  }, 50);

  // Update username and online users when connection is established
  room.party.subscribe((peers) => {
    const currentUser = room.party.client;
    if (currentUser && currentUser.username) {
      usernameElement.textContent = currentUser.username;
    }
  
    // Update online users
    onlineUsers.clear();
    for (const clientId in peers) {
      onlineUsers.set(peers[clientId].username, peers[clientId].world);
    }
  
    // Update online status in friends list
    debouncedUpdateOnlineStatus();
  });

  // Create message overlay using the same markup as the Add Friend overlay
  messageOverlay.id = 'message-overlay';
  messageOverlay.className = 'add-friend-overlay';
  messageOverlay.innerHTML = `
    <div class="add-friend-container">
      <div class="add-friend-text">Enter message to send to <span class="message-username"></span></div>
      <input type="text" class="add-friend-input" maxlength="80">
    </div>
  `;
  document.querySelector('#chat-window').appendChild(messageOverlay);

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
    splitContainer.appendChild(msgDiv);
    // Limit history to last 5 messages
    while (splitContainer.childElementCount > 5) {
      splitContainer.removeChild(splitContainer.firstElementChild);
    }
  }

  // Re-render all private messages based on current split-chat mode.
  // When split chat is off, private messages are merged into main chat; when on, they go into the split chat container.
  function renderAllPrivateMessages() {
    const splitPrivate = localStorage.getItem('splitPrivateChat') === 'true';
    chatContent.innerHTML = '';
    // Remove any existing private messages from main chat
    splitContainer.innerHTML = '';
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
      room.send({
        type: 'chat',
        message: message
      });
      const messageDiv = document.createElement('div');
      messageDiv.className = 'chat-message user';
      const timestamp = Date.now();
      messageDiv.setAttribute('data-timestamp', timestamp);
      messageDiv.innerHTML = `<span class="username">${room.party.client.username}</span><span class="separator">: </span>${message}`;
      throttledInsertMessage(messageDiv);
      chatInput.value = '';
    }
  });

  /* --- Chat input for Private messages via overlay --- */
  function sendPrivateMessage(message, recipient) {
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
  }

  messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && messageInput.value.trim()) {
      const message = messageInput.value.trim();
      e.preventDefault(); // Prevent default to improve performance
      sendPrivateMessage(message, messageUsernameSpan.textContent);
      messageOverlay.classList.remove('shown');
    }
  }, { passive: true });

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
    switch (event.data.type) {
      case 'world-change': {
        // Update friend list entries for the user who changed worlds
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
        break;
      }
      case 'chat': {
        // For public chat messages from others
        if (event.data.clientId !== room.party.client.id) {
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
          throttledInsertMessage(messageDiv);
        }
        break;
      }
      case 'private-message': {
        // For incoming private messages
        if (event.data.recipient === room.party.client.username) {
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

  // Use requestAnimationFrame for visual updates
  function updateUI() {
    requestAnimationFrame(() => {
      debouncedUpdateOnlineStatus();
    });
  }

  // Optimize event handlers
  document.addEventListener('scroll', hideAllContextMenus, { passive: true });

  // Reduce interval frequency
  setInterval(updateUI, 3000);
});