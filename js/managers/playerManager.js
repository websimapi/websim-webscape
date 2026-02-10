import { room } from '../network.js';

// Track online users with world information
const onlineUsers = new Map();

function getIgnoredUsers() {
  const stored = localStorage.getItem('ignoreList');
  if (stored) {
    try {
      const ignoreList = JSON.parse(stored);
      return new Set(ignoreList.map(item => item.name));
    } catch (err) {
      return new Set();
    }
  }
  return new Set();
}

function isUserIgnored(username) {
  const ignoredUsers = getIgnoredUsers();
  return ignoredUsers.has(username);
}

function isUserOnline(username) {
  return onlineUsers.has(username);
}

function getCurrentWorld() {
  const gameScreen = document.querySelector('#game-screen iframe');
  if (!gameScreen) return 'World-1';
  const currentUrl = gameScreen.src;
  const worldsMatch = currentUrl.match(/world-?(\d+)/);
  return worldsMatch ? `World-${worldsMatch[1]}` : 'World-1';
}

function updateOnlineStatus() {
  const friendEntries = document.querySelectorAll('.friends-list .list-entry');
  const currentWorld = getCurrentWorld();

  friendEntries.forEach(entry => {
    const username = entry.querySelector('.player-name').textContent;
    const statusElement = entry.querySelector('.world-status');
    
    if (onlineUsers.has(username)) {
      const userWorld = onlineUsers.get(username);
      statusElement.textContent = userWorld;
      statusElement.classList.remove('offline');
      
      // Update color based on world comparison
      if (userWorld === currentWorld) {
        statusElement.style.color = '#00ff00'; // Green for same world
      } else {
        statusElement.style.color = '#ffff00'; // Yellow for different world
      }
    } else {
      statusElement.textContent = 'Offline';
      statusElement.classList.add('offline');
      statusElement.style.color = '#ff0000'; // Red for offline
    }
  });
}

function updateIgnoredUsers() {
  const ignoredUsers = getIgnoredUsers();
  
  // Remove ignored users from onlineUsers
  for (const [username, world] of onlineUsers.entries()) {
    if (ignoredUsers.has(username)) {
      onlineUsers.delete(username);
    }
  }
  
  // Add previously ignored users back if they're online and no longer ignored
  for (const clientId in room.party.peers) {
    const username = room.party.peers[clientId].username;
    const worldInfo = room.party.peers[clientId].world || 'World-1';
    if (!ignoredUsers.has(username) && !onlineUsers.has(username)) {
      onlineUsers.set(username, worldInfo);
    }
  }
  
  updateOnlineStatus();
}

function initializePlayerManager() {
  const usernameElement = document.getElementById('current-username');

  // Update username and online users when connection is established
  room.party.subscribe((peers) => {
    const currentUser = room.party.client;
    if (currentUser && currentUser.username && usernameElement) {
      usernameElement.textContent = currentUser.username;
    }
    
    // Update online users with world information (excluding ignored users)
    onlineUsers.clear();
    for (const clientId in peers) {
      const username = peers[clientId].username;
      const worldInfo = peers[clientId].world || 'World-1'; // Default to World-1
      if (!isUserIgnored(username)) {
        onlineUsers.set(username, worldInfo);
      }
    }
    
    // Update online status in friends list
    updateOnlineStatus();
  });
  
  // Expose global for legacy calls
  window.updateIgnoredUsers = updateIgnoredUsers;
}

export { 
  initializePlayerManager, 
  getIgnoredUsers, 
  isUserIgnored, 
  isUserOnline, 
  updateIgnoredUsers, 
  onlineUsers, 
  getCurrentWorld,
  updateOnlineStatus
};