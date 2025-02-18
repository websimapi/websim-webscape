import { toggleMenu } from './menuManager.js';

// Initialize WebSocket connection
const room = new WebsimSocket();

// Track audio state
let currentAudio = null;
let isPlaying = false;
let currentTrack = 'No track';
let autoPlayMode = false;
let currentTrackIndex = 0;
let hasUserInteracted = false;

const tracks = [
  {
    name: 'Ambient Venture',
    path: '/ambient_venture.ogg',
    unlocked: true
  }
];

// Audio fade functions
function fadeIn(audioElement, duration = 2000) {
  audioElement.volume = 0;
  
  const interval = 50; // Update every 50ms
  const steps = duration / interval;
  const increment = 1 / steps;
  
  let currentStep = 0;
  
  const fadeInterval = setInterval(() => {
    currentStep++;
    const newVolume = Math.min(1, increment * currentStep);
    audioElement.volume = newVolume;
    
    if (currentStep >= steps) {
      clearInterval(fadeInterval);
    }
  }, interval);
}

function fadeOut(audioElement, duration = 2000) {
  return new Promise(resolve => {
    const startVolume = audioElement.volume;
    const interval = 50; // Update every 50ms
    const steps = duration / interval;
    const decrement = startVolume / steps;
    
    let currentStep = 0;
    
    const fadeInterval = setInterval(() => {
      currentStep++;
      const newVolume = Math.max(0, startVolume - (decrement * currentStep));
      audioElement.volume = newVolume;
      
      if (currentStep >= steps) {
        clearInterval(fadeInterval);
        resolve();
      }
    }, interval);
  });
}

function loadMusicSettings() {
  const storedMode = localStorage.getItem('musicMode');
  // Return true (auto mode) if no setting exists or if it's set to 'auto'
  return storedMode === null ? true : storedMode === 'auto';
}

function saveMusicSettings(isAuto) {
  localStorage.setItem('musicMode', isAuto ? 'auto' : 'manual');
}

async function playTrack(track, trackElement, trackList) {
  if (track.unlocked) {
    if (currentAudio) {
      // Fade out current track before switching
      await fadeOut(currentAudio);
      currentAudio.pause();
      currentAudio = null;
    }

    currentAudio = new Audio(track.path);
    currentTrack = track.name;
    
    const trackDisplay = document.querySelector('#music-menu .track');
    trackDisplay.textContent = `Playing: ${currentTrack}`;
    
    try {
      await currentAudio.play();
      fadeIn(currentAudio);
    } catch (e) {
      console.error('Error playing audio:', e);
      trackDisplay.textContent = 'Playing: No track';
      return;
    }

    // Update all track entries
    trackList.querySelectorAll('.track-entry').forEach(entry => {
      entry.classList.remove('selected');
    });
    trackElement.classList.add('selected');

    // Setup auto-play for next track
    if (autoPlayMode) {
      currentAudio.addEventListener('ended', async () => {
        // Start fade out 2 seconds before track ends
        const fadeOutStart = currentAudio.duration - 2;
        const checkInterval = setInterval(() => {
          if (currentAudio.currentTime >= fadeOutStart) {
            clearInterval(checkInterval);
            fadeOut(currentAudio, 2000);
          }
        }, 100);

        currentAudio.addEventListener('ended', () => {
          currentTrackIndex = (currentTrackIndex + 1) % tracks.length;
          const nextTrack = tracks[currentTrackIndex];
          const nextTrackElement = trackList.children[currentTrackIndex];
          playTrack(nextTrack, nextTrackElement, trackList);
        }, { once: true });
      });
    }
  }
}

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

  // Load saved music mode
  autoPlayMode = loadMusicSettings();
  if (autoPlayMode) {
    autoButton.classList.add('selected');
    manualButton.classList.remove('selected');
  } else {
    manualButton.classList.add('selected');
    autoButton.classList.remove('selected');
  }

  // Populate tracks
  tracks.forEach((track, index) => {
    const trackElement = document.createElement('div');
    trackElement.className = 'track-entry';
    trackElement.textContent = track.name;
    
    if (track.unlocked) {
      trackElement.classList.add('unlocked');
    }

    trackElement.addEventListener('click', () => {
      if (track.unlocked) {
        hasUserInteracted = true;
        currentTrackIndex = index;
        playTrack(track, trackElement, trackList);
      }
    });

    trackList.appendChild(trackElement);
  });

  // Handle music menu toggle
  musicButton.addEventListener('click', () => {
    toggleMenu(musicButton, '#music-menu');
    
    // Auto-play first track if in auto mode and no track is playing
    if (autoPlayMode && !currentAudio && tracks.length > 0 && hasUserInteracted) {
      const firstTrack = tracks[0];
      const firstTrackElement = trackList.children[0];
      playTrack(firstTrack, firstTrackElement, trackList);
    }
  });

  // Auto/Manual button functionality
  autoButton.addEventListener('click', () => {
    autoPlayMode = true;
    saveMusicSettings(true);
    autoButton.classList.add('selected');
    manualButton.classList.remove('selected');
    
    // Start playing if nothing is currently playing and user has interacted
    if (!currentAudio && tracks.length > 0 && hasUserInteracted) {
      const firstTrack = tracks[0];
      const firstTrackElement = trackList.children[0];
      playTrack(firstTrack, firstTrackElement, trackList);
    }
  });

  manualButton.addEventListener('click', () => {
    autoPlayMode = false;
    saveMusicSettings(false);
    manualButton.classList.add('selected');
    autoButton.classList.remove('selected');
    
    // Stop auto-play functionality
    if (currentAudio) {
      currentAudio.onended = null;
    }
  });

  // Set initial mode from local storage
  if (autoPlayMode) {
    autoButton.click();
  } else {
    manualButton.click();
  }

  // Add fade out before page unload
  window.addEventListener('beforeunload', () => {
    if (currentAudio) {
      fadeOut(currentAudio, 1000);
    }
  });
}

export { initializeMusicMenu };