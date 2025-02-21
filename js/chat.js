// Initialize WebSocket connection
const room = new WebsimSocket();

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

  // Get game container bounds to ensure our menu doesn't go outside.
  const gameContainer = document.getElementById('client-wrapper');
  const containerBounds = gameContainer.getBoundingClientRect();

  // Calculate initial position using event coordinates.
  let xPos = e.pageX;
  let yPos = e.pageY;

  // Set menu content.
  chatContextMenu.innerHTML = `
    <div class="context-menu-option add-friend">Add Friend ${username}</div>
    <div class="context-menu-option add-ignore">Add Ignore ${username}</div>
    <div class="context-menu-option cancel">Cancel</div>
  `;
  chatContextMenu.classList.add('shown');

  // Now that the menu is visible via the "shown" class, measure its bounds.
  const menuBounds = chatContextMenu.getBoundingClientRect();

  // Adjust horizontal position if the menu would overflow.
  if (xPos + menuBounds.width > containerBounds.right) {
    xPos = containerBounds.right - menuBounds.width - 10;
  }
  // Adjust vertical position if the menu would overflow.
  if (yPos + menuBounds.height > containerBounds.bottom) {
    yPos = containerBounds.bottom - menuBounds.height - 10;
  }

  // Ensure the menu stays within the left and top boundaries.
  xPos = Math.max(containerBounds.left + 10, xPos);
  yPos = Math.max(containerBounds.top + 10, yPos);

  // Set the final position.
  chatContextMenu.style.left = `${xPos}px`;
  chatContextMenu.style.top = `${yPos}px`;

  // Add click handlers for each menu option.
  const addFriendOption = chatContextMenu.querySelector('.add-friend');
  const addIgnoreOption = chatContextMenu.querySelector('.add-ignore');
  const cancelOption = chatContextMenu.querySelector('.cancel');

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

// Function to show tooltip on chat username hover in the top left of the game container
function showUsernameHoverTooltip(e, username) {
  // For your own name, do not show the dropdown tooltip.
  if (username === room.party.client.username) return;
  
  // Display the first action choice and count of remaining options.
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

// Initialize chat tabs
document.addEventListener('DOMContentLoaded', () => {
  const chatTabs = document.querySelectorAll('.chat-tab');
  const chatContent = document.querySelector('.chat-content');
  
  // Store initial welcome message
  const welcomeMessage = chatContent.querySelector('.chat-message.system').cloneNode(true);
  
  chatTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // Clear selected state from all tabs
      chatTabs.forEach(t => t.classList.remove('selected'));
      // Add selected state to clicked tab
      tab.classList.add('selected');
      
      // Clear chat content except welcome message
      chatContent.innerHTML = '';
      chatContent.appendChild(welcomeMessage.cloneNode(true));
    });
  });
  
  // Select public chat tab by default
  chatTabs[0].classList.add('selected');
});

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
  if (event.data.type === 'chat' && event.data.clientId !== room.party.client.id) {
    const chatContent = document.querySelector('.chat-content');
    const messageDiv = document.createElement('div');
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

    chatContent.insertBefore(messageDiv, chatContent.firstChild);
  }
};