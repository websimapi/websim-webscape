// Initialize WebSocket connection
const room = new WebsimSocket();

function showPrivateMessageOverlay(username) {
  const messageOverlay = document.getElementById('private-message-overlay');
  const messageInput = messageOverlay.querySelector('.private-message-input');
  const messageText = messageOverlay.querySelector('.private-message-text');
  
  messageText.textContent = `Enter message to send to ${username}`;
  messageOverlay.classList.add('shown');
  messageInput.value = '';
  messageInput.focus();

  const handleMessage = async (e) => {
    if (e.key === 'Enter' && messageInput.value.trim()) {
      const message = messageInput.value.trim();
      
      // Send private message event
      room.send({
        type: 'private-message',
        targetUsername: username,
        message: message
      });

      // Add message to chat
      const chatContent = document.querySelector('.chat-content');
      const messageDiv = document.createElement('div');
      messageDiv.className = 'chat-message private-out';
      messageDiv.innerHTML = `To ${username}: ${message}`;
      chatContent.insertBefore(messageDiv, chatContent.firstChild);

      // Clear and hide overlay
      messageInput.value = '';
      messageOverlay.classList.remove('shown');
      messageInput.removeEventListener('keypress', handleMessage);
    }
  };

  messageInput.addEventListener('keypress', handleMessage);

  // Close overlay when clicking outside
  messageOverlay.addEventListener('click', (e) => {
    if (e.target === messageOverlay) {
      messageOverlay.classList.remove('shown');
      messageInput.removeEventListener('keypress', handleMessage);
    }
  });
}

export { showPrivateMessageOverlay };