import { toggleMenu } from './menuManager.js';

// Initialize WebSocket connection
const room = new WebsimSocket();

// Track audio state
let currentAudio = null;
let isPlaying = false;
let currentTrack = 'No track';

const tracks = [
  {
    name: 'Ambient Venture',
    path: '/ambient_venture.ogg',
    unlocked: true
  }
];

function initializeMusicMenu() {
  const musicButton = document.querySelector('.bottom-icon.music');
  const musicMenu = document.getElementById('music-menu');
  const musicContent = musicMenu.querySelector('.music-content');
  const trackDisplay = musicMenu.querySelector('.track');
  const autoButton = musicMenu.querySelector('.music-auto');
  const manualButton = musicMenu.querySelector('.music-manual');

  // Initialize track list
  const trackList = document.createElement('div');
  trackList.className = 'track-list';
  musicContent.appendChild(trackList);

  // Populate tracks
  tracks.forEach(track => {
    const trackElement = document.createElement('div');
    trackElement.className = 'track-entry';
    trackElement.textContent = track.name;
    
    if (track.unlocked) {
      trackElement.classList.add('unlocked');
    }

    trackElement.addEventListener('click', () => {
      if (track.unlocked) {
        if (currentAudio) {
          currentAudio.pause();
          currentAudio = null;
        }

        currentAudio = new Audio(track.path);
        currentTrack = track.name;
        trackDisplay.textContent = `Playing: ${currentTrack}`;
        
        currentAudio.play().catch(e => {
          console.error('Error playing audio:', e);
          trackDisplay.textContent = 'Playing: No track';
        });

        // Update all track entries
        trackList.querySelectorAll('.track-entry').forEach(entry => {
          entry.classList.remove('selected');
        });
        trackElement.classList.add('selected');
      }
    });

    trackList.appendChild(trackElement);
  });

  // Handle music menu toggle
  musicButton.addEventListener('click', () => {
    toggleMenu(musicButton, '#music-menu');
  });

  // Auto/Manual button functionality
  autoButton.addEventListener('click', () => {
    autoButton.classList.add('selected');
    manualButton.classList.remove('selected');
  });

  manualButton.addEventListener('click', () => {
    manualButton.classList.add('selected');
    autoButton.classList.remove('selected');
  });

  // Set manual as default
  manualButton.click();
}

export { initializeMusicMenu };