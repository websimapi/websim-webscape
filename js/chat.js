// Initialize WebSocket connection
const room = new WebsimSocket();

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
  
  onlineUsers.clear();
  for (const clientId in peers) {
    onlineUsers.add(peers[clientId].username);
  }
  
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

// Modified chat context menu: if in Two mouse mode and left click occurs, trigger first action (Message) directly.
function showChatContextMenu(e, username) {
  if (username === room.party.client.username) return;

  const mouseMode = localStorage.getItem('mouseMode') || 'two';
  if (mouseMode === 'two' && e.button === 0) {
    e.preventDefault();
    showMessageOverlay(username);
    return;
  }

  e.preventDefault();
  e.stopPropagation();

  hideAllContextMenus();

  const gameContainer = document.getElementById('client-wrapper');
  const containerBounds = gameContainer.getBoundingClientRect();

  let xPos = e.pageX;
  let yPos = e.pageY;

  const chatContextMenu = document.createElement('div');
  chatContextMenu.className = 'context-menu';
  document.body.appendChild(chatContextMenu);

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
  const chatContextMenus = document.querySelectorAll('.context-menu');
  chatContextMenus.forEach(menu => {
    menu.classList.remove('shown');
    menu.style.left = '';
    menu.style.top = '';
  });
}

const chatInput = document.querySelector('.chat-input');
chatInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && chatInput.value.trim()) {
    e.preventDefault();
    const message = chatInput.value.trim();

    room.send({
      type: 'chat',
      message: message
    });

    const chatContent = document.querySelector('.chat-content');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'chat-message user';
    messageDiv.innerHTML = `<span class="username">${room.party.client.username}</span><span class="separator">: </span>${message}`;

    const usernameSpan = messageDiv.querySelector('.username');
    usernameSpan.addEventListener('click', (e) => {
      showChatContextMenu(e, room.party.client.username);
    });
    usernameSpan.addEventListener('mouseover', (e) => {
      showUsernameHoverTooltip(e, room.party.client.username);
    });
    usernameSpan.addEventListener('mouseout', (e) => {
      hideUsernameHoverTooltip();
    });

    chatContent.insertBefore(messageDiv, chatContent.firstChild);

    chatInput.value = '';
  }
});

room.onmessage = (event) => {
  const chatContent = document.querySelector('.chat-content');
  const messageDiv = document.createElement('div');
  
  switch (event.data.type) {
    case 'chat':
      if (event.data.clientId !== room.party.client.id) {
        messageDiv.className = 'chat-message user';
        messageDiv.innerHTML = `<span class="username">${event.data.username}</span><span class="separator">: </span>${event.data.message}`;

        const usernameSpan = messageDiv.querySelector('.username');
        usernameSpan.addEventListener('click', (e) => {
          showChatContextMenu(e, event.data.username);
        });
        usernameSpan.addEventListener('mouseover', (e) => {
          showUsernameHoverTooltip(e, event.data.username);
        });
        usernameSpan.addEventListener('mouseout', (e) => {
          hideUsernameHoverTooltip();
        });
      }
      break;
      
    case 'private-message':
      if (event.data.recipient === room.party.client.username) {
        const splitPrivate = localStorage.getItem('splitPrivateChat') === 'true';
        if (splitPrivate) {
          const splitContainer = document.getElementById('split-private-chat');
          if (splitContainer) {
            const splitMessage = document.createElement('div');
            splitMessage.className = 'split-private-message';
            splitMessage.textContent = `From ${event.data.username}: ${event.data.message}`;
            splitContainer.appendChild(splitMessage);
            if (splitContainer.childElementCount > 5) {
              splitContainer.removeChild(splitContainer.firstElementChild);
            }
            splitContainer.style.display = 'flex';
          }
        } else {
          messageDiv.className = 'chat-message private-message';
          messageDiv.innerHTML = `From ${event.data.username}: ${event.data.message}`;
        }
      }
      break;
  }
  
  if (messageDiv.innerHTML) {
    chatContent.insertBefore(messageDiv, chatContent.firstChild);
  }
};

function showUsernameHoverTooltip(e, username) {
  // For your own name, do not show the dropdown tooltip.
  if (username === room.party.client.username) return;
  
  // Display the first action choice and count of remaining options.
  const chatUsernameTooltip = document.createElement('div');
  chatUsernameTooltip.className = 'action-tooltip';
  chatUsernameTooltip.style.display = 'block';
  chatUsernameTooltip.textContent = `Add Friend / 1 more option`;
  document.body.appendChild(chatUsernameTooltip);
  
  const gameScreen = document.getElementById('game-screen');
  const gameRect = gameScreen.getBoundingClientRect();
  chatUsernameTooltip.style.top = `${gameRect.top + 5}px`;
  chatUsernameTooltip.style.left = `${gameRect.left + 5}px`;
}

function hideUsernameHoverTooltip() {
  const tooltips = document.querySelectorAll('.action-tooltip');
  tooltips.forEach(tooltip => {
    tooltip.style.display = 'none';
  });
}

setInterval(updateOnlineStatus, 3000);