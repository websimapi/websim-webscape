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