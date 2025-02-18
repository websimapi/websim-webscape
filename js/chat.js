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

// Import context menu functionality
import { showContextMenu, hideContextMenu } from './ui/contextMenu.js';

// Handle chat input
const chatInput = document.querySelector('.chat-input');
chatInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter' && chatInput.value.trim()) {
    const message = chatInput.value.trim();
    
    // Send chat message
    room.send({
      type: 'chat',
      message: message
    });

    // Add message to chat window
    const chatContent = document.querySelector('.chat-content');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'chat-message user';
    messageDiv.innerHTML = `<span class="username">${room.party.client.username}</span><span class="separator">: </span><span class="message-text">${message}</span>`;
    
    // Add click handler for username and message
    addMessageClickHandlers(messageDiv);
    
    chatContent.insertBefore(messageDiv, chatContent.firstChild);
    
    // Clear input
    chatInput.value = '';
  }
});

// Function to add click handlers to usernames and messages
function addMessageClickHandlers(messageDiv) {
  const usernameSpan = messageDiv.querySelector('.username');
  const messageText = messageDiv.querySelector('.message-text');
  
  [usernameSpan, messageText].forEach(element => {
    element.addEventListener('click', (e) => {
      e.preventDefault();
      const username = messageDiv.querySelector('.username').textContent;
      
      showContextMenu(e, username, {
        options: [
          {
            text: `Add Friend ${username}`,
            handler: async () => {
              const newFriend = document.createElement('div');
              newFriend.className = 'list-entry';
              newFriend.innerHTML = `
                <span class="player-name">${username}</span>
                <span class="world-status offline">Offline</span>
              `;
              document.querySelector('.friends-list .list-container').appendChild(newFriend);
            }
          },
          {
            text: `Add Ignore ${username}`,
            handler: async () => {
              const newIgnore = document.createElement('div');
              newIgnore.className = 'list-entry';
              newIgnore.innerHTML = `
                <span class="player-name">${username}</span>
                <span class="world-status offline">Offline</span>
              `;
              document.querySelector('.ignore-list .list-container').appendChild(newIgnore);
            }
          },
          {
            text: 'Cancel',
            handler: () => {
              hideContextMenu();
            }
          }
        ]
      });
    });
  });
}

// Handle incoming chat messages
room.onmessage = (event) => {
  if (event.data.type === 'chat' && event.data.clientId !== room.party.client.id) {
    const chatContent = document.querySelector('.chat-content');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'chat-message user';
    messageDiv.innerHTML = `<span class="username">${event.data.username}</span><span class="separator">: </span><span class="message-text">${event.data.message}</span>`;
    
    // Add click handler for username and message
    addMessageClickHandlers(messageDiv);
    
    chatContent.insertBefore(messageDiv, chatContent.firstChild);
  }
};