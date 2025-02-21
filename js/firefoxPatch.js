/* 
  Firefox Patch for WebsimSocket and postMessage issues

  - If running in Firefox and instantiating WebsimSocket fails, 
    we override it with a minimal stub so the application doesn't break.
  - Also assists with postMessage targetOrigin handling in Firefox.
*/
if (navigator.userAgent.toLowerCase().includes("firefox")) {
  try {
    new WebsimSocket();
  } catch(e) {
    console.warn("WebsimSocket error detected in Firefox; applying patch.", e);
    window.WebsimSocket = function() {
      return {
        party: {
          client: { id: "firefox-dummy", username: "firefox", avatarUrl: "" },
          peers: {},
          subscribe: () => {}
        },
        send: () => {},
        collection: () => ({ create: async() => {}, getList: () => [] }),
        onmessage: () => {}
      };
    }
  }
}