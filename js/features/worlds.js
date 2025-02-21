import { toggleMenu } from './menuManager.js';

console.log('Initializing worlds module...'); // Debug initialization

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

console.log('Defined worlds:', worlds); // Debug worlds data

function initializeWorlds() {
  console.log('Starting worlds initialization...'); // Debug initialization start

  try {
    // Get the worlds button
    const worldsButton = document.querySelector('.bottom-icon:first-child');
    if (!worldsButton) {
      console.error('Failed to find worlds button element');
      return;
    }
    console.log('Found worlds button:', worldsButton); // Debug button found

    // Create worlds menu
    const worldsMenu = document.createElement('div');
    worldsMenu.id = 'worlds-menu';
    worldsMenu.className = 'hidden';

    // Create menu HTML
    const menuHTML = `
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

    worldsMenu.innerHTML = menuHTML;
    console.log('Created worlds menu element:', worldsMenu); // Debug menu creation

    // Find minimap section for insertion
    const minimapSection = document.getElementById('minimap-section');
    if (!minimapSection) {
      console.error('Failed to find minimap section for menu insertion');
      return;
    }

    // Insert menu after minimap
    try {
      minimapSection.insertAdjacentElement('afterend', worldsMenu);
      console.log('Successfully inserted worlds menu into DOM'); // Debug menu insertion
    } catch (error) {
      console.error('Error inserting worlds menu:', error);
    }

    // Setup menu toggle with error handling
    worldsButton.addEventListener('click', (e) => {
      console.log('World button clicked'); // Debug button click
      try {
        toggleMenu(worldsButton, '#worlds-menu');
      } catch (error) {
        console.error('Error in toggle menu:', error);
      }
    });

    // Setup world switching with error handling
    const worldsList = worldsMenu.querySelector('.worlds-list');
    if (!worldsList) {
      console.error('Failed to find worlds list element');
      return;
    }

    worldsList.addEventListener('click', (e) => {
      console.log('Worlds list clicked'); // Debug list click
      
      const worldEntry = e.target.closest('.world-entry');
      if (!worldEntry) {
        console.log('Click was not on a world entry');
        return;
      }

      const url = worldEntry.dataset.url;
      console.log('Selected world URL:', url); // Debug selected URL

      const gameFrame = document.querySelector('#game-screen iframe');
      if (!gameFrame) {
        console.error('Failed to find game iframe');
        return;
      }

      if (url !== gameFrame.src) {
        console.log('Switching world to:', url); // Debug world switch
        
        try {
          gameFrame.src = url;
          
          // Update selection visuals
          document.querySelectorAll('.world-entry').forEach(entry => {
            entry.classList.remove('selected');
          });
          worldEntry.classList.add('selected');

          // Hide menu after selection
          worldsMenu.classList.add('hidden');
          worldsButton.classList.remove('selected');
          
          console.log('World switch completed successfully'); // Debug switch complete
        } catch (error) {
          console.error('Error during world switch:', error);
        }
      } else {
        console.log('Already on selected world'); // Debug same world selected
      }
    });

    // Highlight current world
    try {
      const gameFrame = document.querySelector('#game-screen iframe');
      if (gameFrame) {
        const currentUrl = gameFrame.src;
        console.log('Current game frame URL:', currentUrl); // Debug current URL
        
        const currentWorld = worldsMenu.querySelector(`[data-url="${currentUrl}"]`);
        if (currentWorld) {
          currentWorld.classList.add('selected');
          console.log('Highlighted current world'); // Debug highlight
        } else {
          console.log('Current world entry not found in menu');
        }
      } else {
        console.error('Game frame not found for current world highlight');
      }
    } catch (error) {
      console.error('Error highlighting current world:', error);
    }

    console.log('Worlds initialization completed successfully'); // Debug initialization complete
    
  } catch (error) {
    console.error('Critical error in worlds initialization:', error);
  }
}

export { initializeWorlds };