(function() {
  // Wait until window.room is available before initializing heartbeat logic.
  function setupHeartbeat() {
    if (!window.room) {
      setTimeout(setupHeartbeat, 100);
      return;
    }
    
    // Patch room to support multiple onmessage handlers if not already patched.
    if (!window.room._handshakePatched) {
      window.room._messageHandlers = [];

      // If there's an existing onmessage handler, store it.
      if (typeof window.room.onmessage === 'function') {
        window.room._messageHandlers.push(window.room.onmessage);
      }
      
      // Override the onmessage property to aggregate all handlers.
      Object.defineProperty(window.room, 'onmessage', {
        configurable: true,
        enumerable: true,
        get: function() {
          return this._currentHandler;
        },
        set: function(newHandler) {
          if (typeof newHandler === 'function') {
            this._messageHandlers.push(newHandler);
          }
          // The aggregated handler calls every registered handler in order.
          this._currentHandler = function(event) {
            for (var i = 0; i < this._messageHandlers.length; i++) {
              this._messageHandlers[i].call(this, event);
            }
          }.bind(this);
        }
      });
      
      // Initialize onmessage so that future messages are dispatched via the aggregator.
      window.room.onmessage = function(event) {
        for (var i = 0; i < window.room._messageHandlers.length; i++) {
          window.room._messageHandlers[i](event);
        }
      };

      window.room._handshakePatched = true;
    }

    // Initialize heartbeat records and alive status storage.
    window.heartbeatRecords = window.heartbeatRecords || {};
    window.aliveStatus = window.aliveStatus || {};

    // Function to process an incoming alive message.
    function handleAlive(event) {
      var data = event.data;
      if (!data || !data.username) return;
      var username = data.username;
      window.heartbeatRecords[username] = window.heartbeatRecords[username] || { lastAlive: 0, missed: 0, online: true };
      window.heartbeatRecords[username].lastAlive = Date.now();
      window.heartbeatRecords[username].missed = 0;
      window.heartbeatRecords[username].online = true;
      window.aliveStatus[username] = true;
    }

    // Our heartbeat handler that intercepts "alive" events.
    function heartbeatHandler(event) {
      if (event.data && event.data.type === 'alive') {
        handleAlive(event);
        // Return early so that other modules don't need to process alive events.
        return;
      }
    }

    // Add the heartbeat handler to the aggregated message handlers if not already added.
    if (window.room._messageHandlers.indexOf(heartbeatHandler) === -1) {
      window.room._messageHandlers.push(heartbeatHandler);
    }

    // Begin the heartbeat process: every 3 seconds, send a heartbeat and check peer statuses.
    var heartbeatInterval = 3000; // 3 seconds
    setInterval(function() {
      // Send out our alive message.
      if (window.room && window.room.send && window.room.party && window.room.party.client) {
        window.room.send({
          type: 'alive',
          username: window.room.party.client.username,
          timestamp: Date.now()
        });
      }
      // Verify all stored heartbeat records to decide online/offline status.
      var now = Date.now();
      for (var username in window.heartbeatRecords) {
        if (window.heartbeatRecords.hasOwnProperty(username)) {
          var record = window.heartbeatRecords[username];
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
      }
    }, heartbeatInterval);
  }

  setupHeartbeat();
})();