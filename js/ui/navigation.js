// Create the navigation bar (bottom icons)
function initializeNavigation() {
  const rightPanel = document.getElementById('right-panel');
  const bottomIcons = document.createElement('div');
  bottomIcons.id = 'bottom-icons';
  
  bottomIcons.innerHTML = `
    <div class="bottom-icon">
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style="display: block; margin: auto;">
        <!-- Main globe circle -->
        <circle cx="12" cy="12" r="10" fill="#2a52be" stroke="#000" stroke-width="1"/>
        <!-- Latitude lines -->
        <path d="M2 12 C2 12 22 12 22 12" stroke="#fff" stroke-width="0.5" fill="none"/>
        <path d="M4 7 C4 7 20 17 20 17" stroke="#fff" stroke-width="0.5" fill="none"/>
        <path d="M4 17 C4 17 20 7 20 7" stroke="#fff" stroke-width="0.5" fill="none"/>
        <!-- Longitude lines -->
        <path d="M12 2 C12 2 12 22 12 22" stroke="#fff" stroke-width="0.5" fill="none"/>
        <path d="M7 4 C7 4 17 20 17 20" stroke="#fff" stroke-width="0.5" fill="none"/>
        <path d="M17 4 C17 4 7 20 7 20" stroke="#fff" stroke-width="0.5" fill="none"/>
        <!-- Connection nodes -->
        <circle cx="8" cy="8" r="1.5" fill="#00ff00"/>
        <circle cx="16" cy="8" r="1.5" fill="#00ff00"/>
        <circle cx="12" cy="16" r="1.5" fill="#00ff00"/>
        <!-- Connection lines -->
        <line x1="8" y1="8" x2="16" y2="8" stroke="#00ff00" stroke-width="1"/>
        <line x1="8" y1="8" x2="12" y2="16" stroke="#00ff00" stroke-width="1"/>
        <line x1="16" y1="8" x2="12" y2="16" stroke="#00ff00" stroke-width="1"/>
      </svg>
    </div>
    <div class="bottom-icon">
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style="display: block; margin: auto;">
        <circle cx="12" cy="12" r="10" fill="#ffff00" stroke="#000" stroke-width="1"/>
        <circle cx="8" cy="9" r="2" fill="#000" />
        <circle cx="16" cy="9" r="2" fill="#000" />
        <path d="M7 14 Q12 18 17 14" fill="none" stroke="#000" stroke-width="2"/>
      </svg>
    </div>
    <div class="bottom-icon">
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style="display: block; margin: auto;">
        <circle cx="12" cy="12" r="10" fill="#ff0000" stroke="#000" stroke-width="1"/>
        <circle cx="8" cy="9" r="2" fill="#000" />
        <circle cx="16" cy="9" r="2" fill="#000" />
        <path d="M7 16 Q12 12 17 16" fill="none" stroke="#000" stroke-width="2"/>
      </svg>
    </div>
    <div class="bottom-icon">Log<br>Out</div>
    <div class="bottom-icon game-options-button">
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M22.7 19.3l-6.1-6.1c1-1.5 1-3.5 0-4.9l-3-3c-1.5-1.5-3.9-1.5-5.4 0l-2.5 2.5c-1.1 1.1-1.3 2.8-.5 4.1l-2.2 2.2c-.4.4-.4 1 0 1.4l3.5 3.5c.4.4 1 .4 1.4 0l2.2-2.2c1.3.8 3 .6 4.1-.5l2.5 2.5c1.5 1.5 3.9 1.5 5.4 0l3-3c1.4-1.4 1.4-3.4 0-4.8zM3.1 14.4l-1.1-1.1 2.2-2.2 1.1 1.1L3.1 14.4zM17.2 8.3l-2.2-2.2 1.1-1.1 2.2 2.2-1.1 1.1z" fill="#fff"/>
      </svg>
    </div>
    <div class="bottom-icon person">
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style="display: block; margin: auto;">
        <circle cx="12" cy="8" r="4" fill="#fff"/>
        <path d="M6 21v-2a6 6 0 0 1 12 0v2" fill="#fff"/>
        <circle cx="18" cy="18" r="4" fill="#00ff00"/>
        <path d="M18 16v4M16 18h4" stroke="#fff" stroke-width="1.5"/>
      </svg>
    </div>
    <div class="bottom-icon music">
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style="display: block; margin: auto;">
        <rect x="2" y="4" width="20" height="16" rx="2" ry="2" fill="#8b4513" />
        <rect x="3" y="10" width="18" height="8" fill="#fff" stroke="#000" stroke-width="0.5" />
        <line x1="6.6" y1="10" x2="6.6" y2="18" stroke="#000" stroke-width="0.5"/>
        <line x1="10.2" y1="10" x2="10.2" y2="18" stroke="#000" stroke-width="0.5"/>
        <line x1="13.8" y1="10" x2="13.8" y2="18" stroke="#000" stroke-width="0.5"/>
        <line x1="17.4" y1="10" x2="17.4" y2="18" stroke="#000" stroke-width="0.5"/>
        <rect x="5.6" y="11" width="2" height="4" fill="#000" />
        <rect x="9.2" y="11" width="2" height="4" fill="#000" />
        <rect x="16.4" y="11" width="2" height="4" fill="#000" />
      </svg>
    </div>
  `;
  
  rightPanel.appendChild(bottomIcons);
}

export { initializeNavigation };