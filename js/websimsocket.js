// Minimal stub of WebsimSocket to ensure menus and other modules work in Firefox.
// (In production you would replace this with the actual WebsimSocket library.)
class WebsimSocket {
  constructor(){
    this.party = {
      client: {
        id: 'local',
        username: 'LocalUser',
        avatarUrl: 'https://images.websim.ai/avatar/LocalUser'
      },
      peers: {},
      subscribe: (callback) => {
        // Dummy subscription – in real usage this would update peer info.
      }
    };
    this.onmessage = () => {};
  }
  send(data) {
    console.log("WebsimSocket send:", data);
  }
  collection(name) {
    return {
      create: async (data) => {
        console.log(`Creating record in ${name}:`, data);
        return data;
      },
      getList: () => [],
      filter: (criteria) => ({
        getList: () => []
      }),
      subscribe: (callback) => {
        // Dummy subscribe for collections.
      }
    };
  }
}
window.WebsimSocket = WebsimSocket;