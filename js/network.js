// Centralized WebSocket connection to prevent multiple socket instances
// This ensures we have a single source of truth for the connection state
const room = new WebsimSocket();
export { room };