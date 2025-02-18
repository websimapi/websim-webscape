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

// Global variable to track for whom we are sending a private message
let currentMessagingTarget = "";

// Function to show chat context menu when clicking on a username
function showChatContextMenu(e, username) {
  // Do not show dropdown for your own username
  if (username === room.party.client.username) return;

  e.preventDefault();
  e.stopPropagation();
  hideAllContextMenus();

  const gameContainer = document.getElementById('client-wrapper');
  const containerBounds = gameContainer.getBoundingClientRect();
  let xPos = e.pageX;
  let yPos = e.pageY;

  // Check if the target user is online
  const targetPeer = Object.values(room.party.peers).find(peer => peer.username === username);
  const onlineText = targetPeer ? 'world-1' : 'offline';

  chatContextMenu.innerHTML = `
    <div class="context-menu-option message">Message ${username} <span class="world-status ${targetPeer ? 'online' : 'offline'}">${onlineText}</span></div>
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

// Function to show tooltip on chat username hover
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

// Function to show the message overlay for private messaging
function showMessageOverlay(username) {
  currentMessagingTarget = username;
  const messageOverlay = document.getElementById('message-user-overlay');
  const targetSpan = document.getElementById('message-target-username');
  if (targetSpan) {
    targetSpan.textContent = username;
  }
  messageOverlay.classList.add('shown');
  const messageInput = document.getElementById('message-user-input');
  messageInput.value = '';
  messageInput.focus();
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

// Event listener for the messaging overlay input (private messaging)
const messageInput = document.getElementById('message-user-input');
messageInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter' && messageInput.value.trim()) {
    const messageText = messageInput.value.trim();
    // Check if the target user is online from the peers list
    const targetPeer = Object.values(room.party.peers).find(peer => peer.username === currentMessagingTarget);
    if (targetPeer) {
      room.send({
        type: 'private-chat',
        targetId: targetPeer.id,
        message: messageText,
        senderUsername: room.party.client.username
      });
      const chatContent = document.querySelector('.chat-content');
      const messageDiv = document.createElement('div');
      messageDiv.className = 'chat-message user';
      messageDiv.innerHTML = `<span class="username">To ${currentMessagingTarget}</span><span class="separator">: </span>${messageText} <em>(private)</em>`;
      chatContent.insertBefore(messageDiv, chatContent.firstChild);
    } else {
      alert(`${currentMessagingTarget} is offline. Message not sent.`);
    }
    messageInput.value = '';
    document.getElementById('message-user-overlay').classList.remove('shown');
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
  } else if (event.data.type === 'private-chat' && event.data.targetId === room.party.client.id) {
    const chatContent = document.querySelector('.chat-content');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'chat-message user';
    messageDiv.innerHTML = `<span class="username">From ${event.data.senderUsername}</span><span class="separator">: </span>${event.data.message} <em>(private)</em>`;
    chatContent.insertBefore(messageDiv, chatContent.firstChild);
  }
};