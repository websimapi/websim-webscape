// Import room from room.js
import { room } from './room.js';

// Global chat state
let privateMsgIdCounter = 0;

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
    username: "", // System message in public chat 
    world: "System",
    timestamp: Date.now() - 1000
  }
];

const privateMessageHistory = [];

// Track online users and their worlds
const userWorlds = new Map();

let onlineUsers = new Set();
let chatMode = 'public'; // Can be 'public' or 'global'

function getCurrentWorld() {
  const currentUrl = document.querySelector('#game-screen iframe').src;
  const worldsMatch = currentUrl.match(/world-(\d+)/);
  return worldsMatch ? `World-${worldsMatch[1]}` : 'World-1';
}

function updateUserWorldDisplay(username, newWorld) {
  userWorlds.set(username, newWorld);
  // If in global chat update displayed messages from the user
  if (chatMode === 'global') {
    const chatContent = document.querySelector('.chat-content');
    const userMessages = chatContent.querySelectorAll('.chat-message.user');
    userMessages.forEach(messageDiv => {
      const messageUsername = messageDiv.querySelector('.username')?.textContent;
      if (messageUsername === username) {
        const worldIndicator = messageDiv.querySelector('.world-indicator');
        if (worldIndicator) {
          worldIndicator.textContent = newWorld;
        }
      }
    });
  }
}

function renderChatHistory() {
  const chatContent = document.querySelector('.chat-content');
  chatContent.innerHTML = ''; // Clear current messages
  
  const history = chatMode === 'global' ? globalChatHistory : publicChatHistory;
  // Sort messages in descending order by timestamp (newest first)
  const sortedHistory = [...history].sort((a, b) => b.timestamp - a.timestamp);
  
  sortedHistory.forEach(msg => {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'chat-message';
    messageDiv.setAttribute('data-timestamp', msg.timestamp);
    
    if (msg.world === 'System') {
      messageDiv.className = 'chat-message system';
      if (chatMode === 'global') {
        messageDiv.innerHTML = `
          <span class="world-indicator" style="color: maroon;">System</span>
          <span class="message">Welcome to Webscape!</span>
        `;
      } else {
        messageDiv.innerHTML = 'Welcome to Webscape!';
      }
    } else {
      if (chatMode === 'global') {
        messageDiv.innerHTML = `
          <span class="world-indicator">${userWorlds.get(msg.username) || msg.world}</span>
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
    }
    
    chatContent.appendChild(messageDiv);
  });
}

function insertIntoChatContent(msgDiv) {
  const chatContent = document.querySelector('.chat-content');
  const newTimestamp = parseFloat(msgDiv.getAttribute('data-timestamp'));
  let inserted = false;
  // chat-content uses flex-direction: column-reverse so DOM order (newest first) is maintained
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

function renderAllPrivateMessages() {
  const splitPrivate = localStorage.getItem('splitPrivateChat') === 'true';
  const chatContent = document.querySelector('.chat-content');
  const splitContainer = document.getElementById('split-private-chat');

  // Remove existing private messages
  chatContent.querySelectorAll('.chat-message.private-message').forEach(elem => elem.remove());
  if (splitContainer) {
    splitContainer.innerHTML = '';
  }

  // Sort private messages by timestamp then by id so none override each other
  const sortedMessages = [...privateMessageHistory].sort((a, b) => {
    if (b.timestamp !== a.timestamp) return b.timestamp - a.timestamp;
    return b.id - a.id;
  });

  sortedMessages.forEach(msg => {
    const msgDiv = document.createElement('div');
    msgDiv.className = 'chat-message private-message';
    msgDiv.setAttribute('data-timestamp', msg.timestamp);
    
    if (msg.direction === 'from') {
      msgDiv.innerHTML = `From ${msg.sender}: ${msg.message}`;
    } else {
      msgDiv.innerHTML = `To ${msg.recipient}: ${msg.message}`;
    }
  
    if (splitPrivate && splitContainer) {
      const clone = msgDiv.cloneNode(true);
      splitContainer.appendChild(clone);
      while (splitContainer.childElementCount > 5) {
        splitContainer.removeChild(splitContainer.firstChild);
      }
    } else {
      insertIntoChatContent(msgDiv);
    }
  });
}

// Get the username element
const usernameElement = document.getElementById('current-username');

room.party.subscribe((peers) => {
  const currentUser = room.party.client;
  if (currentUser && currentUser.username) {
    usernameElement.textContent = currentUser.username;
    userWorlds.set(currentUser.username, getCurrentWorld());
  }
  
  onlineUsers.clear();
  for (const clientId in peers) {
    onlineUsers.add(peers[clientId].username);
  }
  
  updateOnlineStatus();
});

// Update room onmessage – note that other modules (such as worlds.js) now use addEventListener so we do not get duplicated private-message handling.
const originalOnMessage = room.onmessage;
room.onmessage = (event) => {
  const data = event.data;
  
  if (data.type === 'private-message') {
    if (data.recipient === room.party.client.username) {
      const msgObj = {
        id: privateMsgIdCounter++,
        direction: 'from',
        sender: data.username,
        message: data.message,
        timestamp: Date.now(),
      };
      privateMessageHistory.push(msgObj);
      renderAllPrivateMessages();
    }
  } else if (data.type === 'world-change') {
    updateUserWorldDisplay(data.username, data.world);
  } else if (data.type === 'chat' && data.clientId !== room.party.client.id) {
    userWorlds.set(data.username, data.world);
    handleChatMessage(
      data.message,
      data.username,
      data.world,
      Date.now()
    );
  }
  
  if (originalOnMessage) {
    originalOnMessage(event);
  }
};

// Create message overlay (uses the same markup as Add Friend overlay)
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

  if (input) {
    input.addEventListener('keypress', async (e) => {
      if (e.key === 'Enter' && input.value.trim()) {
        const name = input.value.trim();
        const event = new CustomEvent('overlay-submit', { 
          detail: { name, overlay }
        });
        document.dispatchEvent(event);
        overlay.classList.remove('shown');
      }
    });
  }
}
setupOverlay(messageOverlay, messageInput);

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
      
      const msgObj = {
        id: privateMsgIdCounter++,
        direction: 'to',
        recipient: recipient,
        message: message,
        timestamp: Date.now()
      };
      privateMessageHistory.push(msgObj);
      renderAllPrivateMessages();
      
      messageOverlay.classList.remove('shown');
      messageInput.value = '';
    } else {
      const chatContent = document.querySelector('.chat-content');
      const messageDiv = document.createElement('div');
      messageDiv.className = 'chat-message system';
      messageDiv.setAttribute('data-timestamp', Date.now());
      messageDiv.innerHTML = `Unable to send message – player ${recipient} is offline.`;
      insertIntoChatContent(messageDiv);
      
      messageOverlay.classList.remove('shown');
      messageInput.value = '';
    }
  }
});

export function clearPublicChat() {
  const welcomeMessage = publicChatHistory.find(msg => 
    msg.message === "Welcome to Webscape!" && msg.world === "System"
  );
  publicChatHistory.length = 0;
  if (welcomeMessage) {
    publicChatHistory.push(welcomeMessage);
  }
  if (chatMode === 'public') {
    renderChatHistory();
  }
}

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

function updateOnlineStatus() {
  const friendEntries = document.querySelectorAll('.friends-list .list-entry');
  const currentWorld = getCurrentWorld();

  friendEntries.forEach(entry => {
    const username = entry.querySelector('.player-name').textContent;
    const statusElement = entry.querySelector('.world-status');
    
    if (onlineUsers.has(username)) {
      if (!statusElement.textContent || statusElement.textContent === 'Offline') {
        statusElement.textContent = userWorlds.get(username) || 'World-1';
      }
      statusElement.classList.remove('offline');
      if (statusElement.textContent === currentWorld) {
        statusElement.style.color = '#00ff00';
      } else {
        statusElement.style.color = '#ffff00';
      }
    } else {
      statusElement.textContent = 'Offline';
      statusElement.classList.add('offline');
      statusElement.style.color = '#ff0000';
    }
  });
}

function handleChatMessage(message, username, world, timestamp) {
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

export { showMessageOverlay, setupOverlay, renderChatHistory, renderAllPrivateMessages };

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