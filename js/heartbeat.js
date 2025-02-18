(function() {
  if (!window.room) {
    console.error("Room is not initialized. Heartbeat cannot run.");
    return;
  }

  // Initialize heartbeatRecords and aliveStatus if not already defined
  window.heartbeatRecords = window.heartbeatRecords || {};
  window.aliveStatus = window.aliveStatus || {};

  // Function to handle incoming alive messages
  function handleAlive(event) {
    const data = event.data;
    if (!data || !data.username) return;
    const username = data.username;
    window.heartbeatRecords[username] = window.heartbeatRecords[username] || { lastAlive: 0, missed: 0, online: true };
    window.heartbeatRecords[username].lastAlive = Date.now();
    window.heartbeatRecords[username].missed = 0;
    window.heartbeatRecords[username].online = true;
    window.aliveStatus[username] = true;
  }

  // Patch room.onmessage to intercept "alive" messages without interfering with other events
  const originalOnMessage = window.room.onmessage;
  window.room.onmessage = function(event) {
    if (event.data && event.data.type === 'alive') {
      handleAlive(event);
      // Do not propagate alive messages further as they are only used for heartbeat tracking.
      return;
    }
    if (originalOnMessage) {
      originalOnMessage(event);
    }
  };

  // Start sending heartbeat messages and checking peer statuses
  function startHeartbeat() {
    const heartbeatInterval = 3000; // 3 seconds
    setInterval(() => {
      // Send alive message from self with current username and timestamp
      if (window.room && window.room.send && window.room.party && window.room.party.client) {
        window.room.send({
          type: 'alive',
          username: window.room.party.client.username,
          timestamp: Date.now()
        });
      }
      // Check all heartbeat records for missed signals
      const now = Date.now();
      for (const username in window.heartbeatRecords) {
        const record = window.heartbeatRecords[username];
        // If more than one heartbeat interval has passed without an update
        if (now - record.lastAlive > heartbeatInterval) {
          record.missed++;
          if (record.missed >= 3) {
            record.online = false;
            window.aliveStatus[username] = false;
          }
        } else {
          record.missed = 0;
          record.online = true;
          window.aliveStatus[username] = true;
        }
      }
    }, heartbeatInterval);
  }

  startHeartbeat();
})();