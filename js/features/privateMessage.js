function showPrivateMessageOverlay(targetUsername) {
  const overlay = document.getElementById('private-message-overlay');
  const input = overlay.querySelector('.private-message-input');
  const promptSpan = overlay.querySelector('#pm-target-username');
  
  // Set the prompt text with the target username
  promptSpan.textContent = targetUsername;
  
  // Show the overlay
  overlay.classList.remove('hidden');
  overlay.classList.add('shown');
  input.value = '';
  input.focus();
  
  // Handler to close overlay when clicking outside the input
  function onOverlayClick(e) {
    if (e.target === overlay) {
      hideOverlay();
    }
  }
  
  overlay.addEventListener('click', onOverlayClick);
  
  // Handler for keypress on input to send message on Enter
  function onInputKeyPress(e) {
    if (e.key === 'Enter' && input.value.trim()) {
      const message = input.value.trim();
      let isOnline = false;
      for (const peerId in window.room.party.peers) {
        if (window.room.party.peers[peerId].username === targetUsername) {
          isOnline = true;
          break;
        }
      }
      if (isOnline) {
        window.room.send({
          type: 'private-message',
          target: targetUsername,
          message: message,
        });
      } else {
        const chatContent = document.querySelector('.chat-content');
        const sysMsg = document.createElement('div');
        sysMsg.className = 'chat-message system';
        sysMsg.textContent = `${targetUsername} is offline.`;
        chatContent.insertBefore(sysMsg, chatContent.firstChild);
      }
      hideOverlay();
      input.removeEventListener('keypress', onInputKeyPress);
      overlay.removeEventListener('click', onOverlayClick);
    }
  }
  
  input.addEventListener('keypress', onInputKeyPress);
  
  function hideOverlay() {
    overlay.classList.remove('shown');
    overlay.classList.add('hidden');
  }
}

window.showPrivateMessageOverlay = showPrivateMessageOverlay;
export { showPrivateMessageOverlay };