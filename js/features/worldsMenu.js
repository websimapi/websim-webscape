import { toggleMenu } from './menuManager.js';

// Initialize WebSocket connection
const room = new WebsimSocket();

// Track world state
let currentWorld = 'world-1';
const worlds = [
  {
    id: 'world-1',
    name: 'World 1',
    url: 'https://world-1--api.on.websim.ai/?pin_sidebar=false',
    available: true
  },
  {
    id: 'world-2', 
    name: 'World 2',
    url: 'https://world-2--api.on.websim.ai/?pin_sidebar=false',
    available: true
  }
];

function initializeWorldsMenu() {
  const worldsButton = document.querySelector('.bottom-icon.worlds');
  const worldsMenu = document.getElementById('worlds-menu');
  const worldsContent = worldsMenu.querySelector('.worlds-content');
  
  // Initialize from localStorage if exists
  const savedWorld = localStorage.getItem('selectedWorld');
  if (savedWorld) {
    currentWorld = savedWorld;
    updateGameWorld(currentWorld);
  }
  
  // Clear any existing content
  worldsContent.innerHTML = `
    <div class="worlds-header">
      <h3 class="title">World Switcher</h3>
      <p class="current-world">Current: World 1</p>
    </div>
    <div class="worlds-list"></div>
  `;
  
  const worldsList = worldsContent.querySelector('.worlds-list');
  const worldDisplay = worldsContent.querySelector('.current-world');
  
  // Create world entries
  worlds.forEach(world => {
    const worldElement = document.createElement('div');
    worldElement.className = 'world-entry';
    if (!world.available) {
      worldElement.classList.add('unavailable');
    }
    if (world.id === currentWorld) {
      worldElement.classList.add('selected');
    }
    worldElement.textContent = world.name;
    
    worldElement.addEventListener('click', () => {
      if (!world.available) return;
      
      // Update selection UI
      worldsList.querySelectorAll('.world-entry').forEach(entry => {
        entry.classList.remove('selected');
      });
      worldElement.classList.add('selected');
      
      // Update current world display
      worldDisplay.textContent = `Current: ${world.name}`;
      
      // Save selection and update iframe
      currentWorld = world.id;
      localStorage.setItem('selectedWorld', currentWorld);
      updateGameWorld(currentWorld);
    });
    
    worldsList.appendChild(worldElement);
  });

  worldsButton.addEventListener('click', () => {
    toggleMenu(worldsButton, '#worlds-menu');
  });
}

function updateGameWorld(worldId) {
  const world = worlds.find(w => w.id === worldId);
  if (world && world.available) {
    const iframe = document.querySelector('#game-screen iframe');
    iframe.src = world.url;
  }
}

export { initializeWorldsMenu };