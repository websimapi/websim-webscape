import { room } from '../network.js';
import { isUserIgnored, updateIgnoredUsers } from '../managers/playerManager.js';

// --- Overlay Management ---

const messageOverlay = document.createElement('div');
messageOverlay.id = 'message-overlay';
messageOverlay.className = 'add-friend-overlay';
messageOverlay.innerHTML = `
  <div class="add-friend-container">
    <div class="add-friend-text">Enter message to send to <span class="message-username"></span></div>
    <input type="text" class="add-friend-input" maxlength="80">
  </div>
`;

// Append overlay if it doesn't exist
if (!document.getElementById('message-overlay')) {
  document.querySelector('#chat-window').appendChild(messageOverlay);
}

const messageInput = messageOverlay.querySelector('.add-friend-input');
const messageUsernameSpan = messageOverlay.querySelector('.message-username');

function setupChatOverlay() {
  const chatWindow = document.getElementById('chat-window');
  chatWindow.addEventListener('click', (e) => {
    if (!messageOverlay.contains(e.target) && !messageInput.contains(e.target)) {
      messageOverlay.classList.remove('shown');
    }
  });
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
}

// Make global
window.showMessageOverlay = showMessageOverlay;

// --- Message Insertion ---

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
function renderAllPrivateMessages(privateMessageHistory) {
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
      msgDiv.addEventListener('click', (e) => showChatContextMenu(e, msg.recipient));
      msgDiv.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        showChatContextMenu(e, msg.recipient);
      });
    } else {
      msgDiv.innerHTML = `From ${msg.sender}: ${msg.message}`;
      msgDiv.addEventListener('click', (e) => showChatContextMenu(e, msg.sender));
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

// --- Context Menu ---

const chatContextMenu = document.createElement('div');
chatContextMenu.className = 'context-menu';
document.body.appendChild(chatContextMenu);

function hideAllContextMenus() {
  chatContextMenu.classList.remove('shown');
  chatContextMenu.style.left = '';
  chatContextMenu.style.top = '';
}

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
      
      const ignoreEntries = ignoreContainer.querySelectorAll('.list-entry');
      const ignoreData = Array.from(ignoreEntries).map(entry => {
        return { name: entry.querySelector('.player-name').textContent };
      });
      localStorage.setItem('ignoreList', JSON.stringify(ignoreData));
      
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

document.addEventListener('click', (e) => {
  if (!e.target.closest('.context-menu') && !e.target.closest('.player-name')) {
    hideAllContextMenus();
  }
});

export { 
  insertIntoChatContent, 
  insertIntoSplitChat, 
  renderAllPrivateMessages, 
  showMessageOverlay, 
  showChatContextMenu,
  setupChatOverlay,
  messageInput,
  messageUsernameSpan,
  messageOverlay
};