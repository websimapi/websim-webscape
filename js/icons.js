// Function to create SVG icons
function createIcons() {
  // Top minimap icons
  const questsIcon = document.querySelector('.icon.quests');
  questsIcon.innerHTML = `<svg viewBox="0 0 24 24">
    <path d="M3,3h18v18H3V3z M6,6v12h12V6H6z M8,8h8v2H8V8z M8,11h8v2H8V11z M8,14h5v2H8V14z"/>
  </svg>`;

  const prayerIcon = document.querySelector('.icon.prayer');
  prayerIcon.innerHTML = `<svg viewBox="0 0 24 24">
    <path d="M12,2L4,12h4v8h8v-8h4L12,2z"/>
  </svg>`;

  const magicIcon = document.querySelector('.icon.magic');
  magicIcon.innerHTML = `<svg viewBox="0 0 24 24">
    <path d="M12,2L9,9H2l6,4.5L6,21l6-4.5L18,21l-2-7.5L22,9h-7L12,2z"/>
  </svg>`;

  const runIcon = document.querySelector('.icon.run');
  runIcon.innerHTML = `<svg viewBox="0 0 24 24">
    <path d="M13.5,5.5c1.1,0,2-0.9,2-2s-0.9-2-2-2s-2,0.9-2,2S12.4,5.5,13.5,5.5z M9.8,8.9L7,23h2.1l1.8-8l2.1,2v6h2v-7.5l-2.1-2l0.6-3C14.8,12,16.8,13,19,13v-2c-1.9,0-3.5-1-4.3-2.4l-1-1.6c-0.4-0.6-1-1-1.7-1c-0.3,0-0.5,0.1-0.8,0.1L6,8.3V13h2V9.6L9.8,8.9z"/>
  </svg>`;

  const statsIcon = document.querySelector('.icon.stats');
  statsIcon.innerHTML = `<svg viewBox="0 0 24 24">
    <path d="M3,3v18h18V3H3z M9,17H7v-7h2V17z M13,17h-2V7h2V17z M17,17h-2v-4h2V17z"/>
  </svg>`;

  const inventoryIcon = document.querySelector('.icon.inventory');
  inventoryIcon.innerHTML = `<svg viewBox="0 0 24 24">
    <path d="M3,3h18v18H3V3z M6,6v4h4V6H6z M14,6v4h4V6H14z M6,14v4h4v-4H6z M14,14v4h4v-4H14z"/>
  </svg>`;

  // Bottom icons
  const emoteIcon = document.querySelector('.bottom-icon:nth-child(1)');
  emoteIcon.classList.add('emotes');
  emoteIcon.innerHTML = `<svg viewBox="0 0 24 24">
    <path d="M12,2C6.48,2,2,6.48,2,12s4.48,10,10,10s10-4.48,10-10S17.52,2,12,2z M12,6c1.1,0,2,0.9,2,2s-0.9,2-2,2s-2-0.9-2-2S10.9,6,12,6z M12,18c-2.67,0-8-1.33-8-4v-2h16v2C20,16.67,14.67,18,12,18z"/>
  </svg>`;

  const redEmoteIcon = document.querySelector('.bottom-icon:nth-child(2)');
  redEmoteIcon.classList.add('red-emotes');
  redEmoteIcon.innerHTML = `<svg viewBox="0 0 24 24">
    <path d="M12,2C6.48,2,2,6.48,2,12s4.48,10,10,10s10-4.48,10-10S17.52,2,12,2z M12,6c1.1,0,2,0.9,2,2s-0.9,2-2,2s-2-0.9-2-2S10.9,6,12,6z M12,18c-2.67,0-8-1.33-8-4v-2h16v2C20,16.67,14.67,18,12,18z"/>
  </svg>`;

  const logoutIcon = document.querySelector('.bottom-icon:nth-child(3)');
  logoutIcon.classList.add('logout', 'selected');
  logoutIcon.innerHTML = `<svg viewBox="0 0 24 24">
    <path d="M17,7l-1.41,1.41L18.17,11H8v2h10.17l-2.58,2.58L17,17l5-5L17,7z M4,5h8V3H4C2.9,3,2,3.9,2,5v14c0,1.1,0.9,2,2,2h8v-2H4V5z"/>
  </svg>`;

  const settingsIcon = document.querySelector('.bottom-icon:nth-child(4)');
  settingsIcon.classList.add('settings');
  settingsIcon.innerHTML = `<svg viewBox="0 0 24 24">
    <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/>
  </svg>`;

  const runningIcon = document.querySelector('.bottom-icon:nth-child(5)');
  runningIcon.classList.add('run');
  runningIcon.innerHTML = `<svg viewBox="0 0 24 24">
    <path d="M13.5,5.5c1.1,0,2-0.9,2-2s-0.9-2-2-2s-2,0.9-2,2S12.4,5.5,13.5,5.5z M9.8,8.9L7,23h2.1l1.8-8l2.1,2v6h2v-7.5l-2.1-2l0.6-3C14.8,12,16.8,13,19,13v-2c-1.9,0-3.5-1-4.3-2.4l-1-1.6c-0.4-0.6-1-1-1.7-1c-0.3,0-0.5,0.1-0.8,0.1L6,8.3V13h2V9.6L9.8,8.9z"/>
  </svg>`;

  const combatIcon = document.querySelector('.bottom-icon:nth-child(6)');
  combatIcon.classList.add('combat');
  combatIcon.innerHTML = `<svg viewBox="0 0 24 24">
    <path d="M12,2L4,9v12h16V9L12,2z M15,15h-2v2h-2v-2H9v-2h2v-2h2v2h2V15z"/>
  </svg>`;

  // Leave the 7th bottom icon empty as specified
}

// Initialize icons when the page loads
document.addEventListener('DOMContentLoaded', createIcons);