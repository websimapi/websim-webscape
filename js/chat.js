// Change to ES module format
import { showContextMenu, hideContextMenu } from './ui/contextMenu.js';

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

// Create a function to extract username from message element
function getUsernameFromMessage(element) {
  const usernameEl = element.querySelector('.username');
  return usernameEl ? usernameEl.textContent : null;
}

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
    messageDiv.innerHTML = `<span class="username">${room.party.client.username}</span><span class="separator">: </span>${message}`;
    chatContent.insertBefore(messageDiv, chatContent.firstChild);
    
    // Clear input
    chatInput.value = '';
  }
});

// Handle incoming chat messages
room.onmessage = (event) => {
  if (event.data.type === 'chat' && event.data.clientId !== room.party.client.id) {
    const chatContent = document.querySelector('.chat-content');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'chat-message user';
    messageDiv.innerHTML = `<span class="username">${event.data.username}</span><span class="separator">: </span>${event.data.message}`;
    chatContent.insertBefore(messageDiv, chatContent.firstChild);
  }
};

// Add click handler for chat messages
document.querySelector('.chat-content').addEventListener('click', (e) => {
  const messageEl = e.target.closest('.chat-message');
  if (!messageEl) return;

  const username = getUsernameFromMessage(messageEl);
  if (!username || username === room.party.client.username) return;

  // Show context menu with chat-specific options
  showContextMenu(e, username, 
    // Pass null for onMessage since we're using custom options
    null,
    // Pass null for onRemove since we're using custom options
    null,
    // Pass custom options
    [
      {
        text: `Add Friend ${username}`,
        action: () => {
          // Trigger Add Friend overlay
          const addFriendOverlay = document.getElementById('add-friend-overlay');
          const addFriendInput = addFriendOverlay.querySelector('.add-friend-input');
          addFriendOverlay.classList.add('shown');
          addFriendInput.value = username;
          // Simulate Enter key press to submit
          addFriendInput.dispatchEvent(new KeyboardEvent('keypress', { key: 'Enter' }));
        }
      },
      {
        text: `Add Ignore ${username}`,
        action: () => {
          // Trigger Add Ignore overlay
          const addIgnoreOverlay = document.getElementById('add-ignore-overlay');
          const addIgnoreInput = addIgnoreOverlay.querySelector('.add-friend-input');
          addIgnoreOverlay.classList.add('shown');
          addIgnoreInput.value = username;
          // Simulate Enter key press to submit
          addIgnoreInput.dispatchEvent(new KeyboardEvent('keypress', { key: 'Enter' }));
        }
      },
      {
        text: 'Cancel',
        action: hideContextMenu
      }
    ]
  );
});