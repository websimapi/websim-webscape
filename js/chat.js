import { room } from './network.js';
import { 
  initializePlayerManager, 
  isUserIgnored, 
  isUserOnline, 
  updateOnlineStatus, 
  onlineUsers,
  getCurrentWorld
} from './managers/playerManager.js';
import { 
  insertIntoChatContent, 
  insertIntoSplitChat, 
  renderAllPrivateMessages, 
  showMessageOverlay, 
  showChatContextMenu,
  setupChatOverlay,
  messageInput,
  messageUsernameSpan,
  messageOverlay
} from './ui/chatUI.js';

// // removed function getIgnoredUsers() {}
// // removed function isUserIgnored() {}
// // removed function isUserOnline() {}
// // removed function updateIgnoredUsers() {}
// // removed function updateOnlineStatus() {}
// // removed function showMessageOverlay() {}
// // removed function setupOverlay() {}
// // removed function insertIntoChatContent() {}
// // removed function insertIntoSplitChat() {}
// // removed function renderAllPrivateMessages() {}
// // removed function showChatContextMenu() {}
// // removed function hideAllContextMenus() {}
// // removed const room = new WebsimSocket();

// Global array to store private message history
const privateMessageHistory = [];

initializePlayerManager();
setupChatOverlay();

// Attach global for GameOptions
window.renderPrivateMessages = () => renderAllPrivateMessages(privateMessageHistory);

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
      
      // Add event listeners for context menu
      msgDiv.addEventListener('click', (e) => showChatContextMenu(e, recipient));
      msgDiv.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        showChatContextMenu(e, recipient);
      });

      const splitPrivate = localStorage.getItem('splitPrivateChat') === 'true';
      if (splitPrivate) {
        insertIntoSplitChat(msgDiv);
      } else {
        insertIntoChatContent(msgDiv);
      }
    } else {
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

room.onmessage = (event) => {
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