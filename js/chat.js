// Initialize WebSocket connection
const room = new WebsimSocket();
window.room = room; // Expose room globally for other modules

// Get the username element
const usernameElement = document.getElementById('current-username');

// Update username when connection is established
room.party.subscribe((peers) => {
  const currentUser = room.party.client;
  if (currentUser && currentUser.username) {
    usernameElement.textContent = currentUser.username;
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

// Function to show chat context menu when clicking on a username
function showChatContextMenu(e, username) {
  // Do not show dropdown for your own username
  if (username === room.party.client.username) return;

  e.preventDefault();
  e.stopPropagation();

  // Hide any existing context menus first.
  hideAllContextMenus();

  // Get game container bounds to ensure our menu doesn’t go outside.
  const gameContainer = document.getElementById('client-wrapper');
  const containerBounds = gameContainer.getBoundingClientRect();

  // Calculate initial position using event coordinates.
  let xPos = e.pageX;
  let yPos = e.pageY;

  // Set menu content with added Message option.
  chatContextMenu.innerHTML = `
    <div class="context-menu-option message">Message ${username}</div>
    <div class="context-menu-option add-friend">Add Friend ${username}</div>
    <div class="context-menu-option add-ignore">Add Ignore ${username}</div>
    <div class="context-menu-option cancel">Cancel</div>
  `;
  chatContextMenu.classList.add('shown');

  // Now that the menu is visible, measure its bounds.
  const menuBounds = chatContextMenu.getBoundingClientRect();

  // Adjust horizontal position if the menu would overflow.
  if (xPos + menuBounds.width > containerBounds.right) {
    xPos = containerBounds.right - menuBounds.width - 10;
  }
  // Adjust vertical position if the menu would overflow.
  if (yPos + menuBounds.height > containerBounds.bottom) {
    yPos = containerBounds.bottom - menuBounds.height - 10;
  }
  xPos = Math.max(containerBounds.left + 10, xPos);
  yPos = Math.max(containerBounds.top + 10, yPos);

  // Set final position.
  chatContextMenu.style.left = `${xPos}px`;
  chatContextMenu.style.top = `${yPos}px`;

  // Add click handlers for menu options.
  const messageOption = chatContextMenu.querySelector('.message');
  const addFriendOption = chatContextMenu.querySelector('.add-friend');
  const addIgnoreOption = chatContextMenu.querySelector('.add-ignore');
  const cancelOption = chatContextMenu.querySelector('.cancel');

  messageOption.addEventListener('click', (event) => {
    event.stopPropagation();
    window.showPrivateMessageOverlay(username);
    chatContextMenu.classList.remove('shown');
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
    chatContextMenu.classList.remove('shown');
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
    chatContextMenu.classList.remove('shown');
  });

  cancelOption.addEventListener('click', (event) => {
    event.stopPropagation();
    chatContextMenu.classList.remove('shown');
  });
}

function hideAllContextMenus() {
  chatContextMenu.classList.remove('shown');
  chatContextMenu.style.left = '';
  chatContextMenu.style.top = '';
}

// Function to show tooltip on chat username hover in the top left of the game container
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

const chatInput = document.querySelector('.chat-input');
chatInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter' && chatInput.value.trim()) {
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
  const data = event.data;
  if (data.type === 'chat' && data.clientId !== room.party.client.id) {
    const chatContent = document.querySelector('.chat-content');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'chat-message user';
    messageDiv.innerHTML = `<span class="username">${data.username}</span><span class="separator">: </span>${data.message}`;
    const usernameSpan = messageDiv.querySelector('.username');
    usernameSpan.addEventListener('click', (e) => {
      showChatContextMenu(e, data.username);
    });
    usernameSpan.addEventListener('mouseover', (e) => {
      showUsernameHoverTooltip(e, data.username);
    });
    usernameSpan.addEventListener('mouseout', (e) => {
      hideUsernameHoverTooltip();
    });
    chatContent.insertBefore(messageDiv, chatContent.firstChild);
  } else if (data.type === 'private-message' && data.target === room.party.client.username) {
    const chatContent = document.querySelector('.chat-content');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'chat-message user';
    messageDiv.innerHTML = `<span class="username">${data.username}</span><span class="separator">: </span>${data.message} (private)`;
    chatContent.insertBefore(messageDiv, chatContent.firstChild);
  }
};