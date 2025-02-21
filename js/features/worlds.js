import { toggleMenu } from './menuManager.js';

const worlds = [
  {
    id: 1,
    name: "World-1",
    url: "https://world-1--api.on.websim.ai/?pin_sidebar=false",
    location: "Test world one"
  },
  {
    id: 2, 
    name: "World-3",
    url: "https://world-3--api.on.websim.ai/?pin_sidebar=false",
    location: "Test world two"
  }
];

function initializeWorlds() {
  console.log('[Debug] Initializing worlds menu...');
  
  const worldsButton = document.querySelector('.bottom-icon:first-child');
  console.log('[Debug] Found worlds button:', worldsButton);
  
  const worldsMenu = document.createElement('div');
  worldsMenu.id = 'worlds-menu';
  worldsMenu.className = 'hidden';
  
  try {
    worldsMenu.innerHTML = `
      <div class="worlds-content">
        <div class="worlds-header">
          <h3 class="title">World Selector</h3>
          <p class="subtitle">Click world to switch</p>
        </div>
        <div class="worlds-list">
          ${worlds.map(world => `
            <div class="world-entry" data-url="${world.url}">
              <div class="world-name">${world.name}</div>
              <div class="world-info">
                <span class="world-location">${world.location}</span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
    console.log('[Debug] Worlds menu HTML created successfully');
  } catch (error) {
    console.error('[Debug] Error creating worlds menu HTML:', error);
  }

  try {
    // Add worlds menu to the right panel after minimap section
    const minimapSection = document.getElementById('minimap-section');
    console.log('[Debug] Found minimap section:', minimapSection);
    
    if (minimapSection) {
      minimapSection.insertAdjacentElement('afterend', worldsMenu);
      console.log('[Debug] Worlds menu inserted into DOM');
    } else {
      console.error('[Debug] Could not find minimap section');
    }
  } catch (error) {
    console.error('[Debug] Error inserting worlds menu:', error);
  }

  try {
    // Setup menu toggle with explicit error handling for Firefox
    worldsButton.addEventListener('click', (event) => {
      console.log('[Debug] Worlds button clicked');
      try {
        toggleMenu(worldsButton, '#worlds-menu');
        console.log('[Debug] Toggle menu called successfully');
      } catch (error) {
        console.error('[Debug] Error in toggleMenu:', error);
      }
    });
  } catch (error) {
    console.error('[Debug] Error setting up click handler:', error);
  }

  try {
    // Handle world switching
    const worldsList = worldsMenu.querySelector('.worlds-list');
    console.log('[Debug] Found worlds list:', worldsList);
    
    worldsList.addEventListener('click', (e) => {
      console.log('[Debug] Worlds list clicked');
      try {
        const worldEntry = e.target.closest('.world-entry');
        if (worldEntry) {
          console.log('[Debug] World entry clicked:', worldEntry);
          const url = worldEntry.dataset.url;
          const gameFrame = document.querySelector('#game-screen iframe');
          
          if (gameFrame && url !== gameFrame.src) {
            console.log('[Debug] Switching world to:', url);
            gameFrame.src = url;
            
            // Update selection visuals
            document.querySelectorAll('.world-entry').forEach(entry => {
              entry.classList.remove('selected');
            });
            worldEntry.classList.add('selected');

            // Hide menu after selection
            worldsMenu.classList.add('hidden');
            worldsButton.classList.remove('selected');
            console.log('[Debug] World switch completed');
          }
        }
      } catch (error) {
        console.error('[Debug] Error handling world switch:', error);
      }
    });

    // Highlight current world on initialization
    try {
      const currentUrl = document.querySelector('#game-screen iframe').src;
      console.log('[Debug] Current world URL:', currentUrl);
      const currentWorld = worldsMenu.querySelector(`[data-url="${currentUrl}"]`);
      if (currentWorld) {
        currentWorld.classList.add('selected');
        console.log('[Debug] Current world highlighted');
      }
    } catch (error) {
      console.error('[Debug] Error highlighting current world:', error);
    }
  } catch (error) {
    console.error('[Debug] Error setting up worlds list functionality:', error);
  }
}

export { initializeWorlds };