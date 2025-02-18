// This file centralizes our WebsimSocket connection and implements heartbeat (alive ping)
// functionality, plus a fallback auto-disconnect when the user leaves the page.

const HEARTBEAT_INTERVAL = 5000; // milliseconds
const HEARTBEAT_TIMEOUT = 25000; // milliseconds (5 missed pings)

const room = new WebsimSocket();

// Dictionary to track each peer's last received ping timestamp.
// Key: clientId, Value: { lastPing: timestamp }
const peerHeartbeats = {};

// Array of message handlers registered by other modules.
const messageHandlers = [];

// Exported function to allow modules to register additional message handlers.
function addMessageHandler(handler) {
  messageHandlers.push(handler);
}

// Save any original onmessage handler (if set earlier) so we can preserve existing behavior.
const originalOnMessage = room.onmessage;

// Override room.onmessage to incorporate heartbeat processing.
room.onmessage = (event) => {
  if (event.data && event.data.type === 'ping') {
    // Record the timestamp for the sender's heartbeat ping.
    const senderId = event.data.clientId;
    peerHeartbeats[senderId] = { lastPing: Date.now() };
    // Do not propagate ping messages further.
    return;
  }
  // Call any previously set onmessage handler.
  if (originalOnMessage) {
    originalOnMessage(event);
  }
  // Dispatch the message to all registered handlers.
  for (const handler of messageHandlers) {
    handler(event);
  }
};

// Function to send our own heartbeat ping.
function sendHeartbeat() {
  room.send({ type: 'ping', timestamp: Date.now() });
}

// (Optional) Function to check the heartbeat state of peers.
// This example does not force removal from room.party.peers,
// but our getters will filter out peers with stale heartbeats.
function checkPeerHeartbeats() {
  // Currently, we rely on getActivePeers() to filter out stale entries.
  // Additional logic (for example, emitting events when a peer is timed-out)
  // could be added here if needed.
}

// Returns an object of active peers whose last ping is within the timeout.
function getActivePeers() {
  const active = {};
  const peers = room.party.peers;
  for (const clientId in peers) {
    const hb = peerHeartbeats[clientId];
    if (hb && (Date.now() - hb.lastPing) < HEARTBEAT_TIMEOUT) {
      active[clientId] = peers[clientId];
    }
  }
  return active;
}

// Returns a Set of active usernames based on the active peers.
function getActiveUsernames() {
  const activePeers = getActivePeers();
  const usernames = new Set();
  for (const clientId in activePeers) {
    if (activePeers[clientId].username) {
      usernames.add(activePeers[clientId].username);
    }
  }
  return usernames;
}

// Start sending heartbeat pings at regular intervals.
setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);
setInterval(checkPeerHeartbeats, HEARTBEAT_INTERVAL);

// Fallback: auto disconnect the user when the page is about to unload.
window.addEventListener('beforeunload', () => {
  room.send({ type: 'disconnect', timestamp: Date.now() });
  if (typeof room.close === 'function') {
    room.close();
  }
});

export { room, addMessageHandler, getActivePeers, getActiveUsernames };