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

function loadMusicSettings() {
  const storedMode = localStorage.getItem('musicMode');
  // Return true (auto mode) if no setting exists or if it's set to 'auto'
  return storedMode === null ? true : storedMode === 'auto';
}

function saveMusicSettings(isAuto) {
  localStorage.setItem('musicMode', isAuto ? 'auto' : 'manual');
}

function fadeAudio(audio, start, end, duration) {
  const steps = 30;
  const stepTime = duration / steps;
  const stepChange = (end - start) / steps;
  
  let currentStep = 0;
  
  audio.volume = start;
  
  const fadeInterval = setInterval(() => {
    currentStep++;
    if (currentStep >= steps) {
      audio.volume = end;
      clearInterval(fadeInterval);
    } else {
      audio.volume = start + (stepChange * currentStep);
    }
  }, stepTime);
}

function playTrack(track, trackElement, trackList) {
  if (track.unlocked) {
    if (currentAudio) {
      // Fade out current track before stopping
      fadeAudio(currentAudio, currentAudio.volume, 0, 2000);
      setTimeout(() => {
        currentAudio.pause();
        currentAudio = null;
        startNewTrack();
      }, 2000);
    } else {
      startNewTrack();
    }

    function startNewTrack() {
      currentAudio = new Audio(track.path);
      currentTrack = track.name;
      
      const trackDisplay = document.querySelector('#music-menu .track');
      trackDisplay.textContent = `Playing: ${currentTrack}`;
      
      // Start with volume at 0 and fade in
      currentAudio.volume = 0;
      currentAudio.play().then(() => {
        fadeAudio(currentAudio, 0, 1, 2000);
      }).catch(e => {
        console.error('Error playing audio:', e);
        trackDisplay.textContent = 'Playing: No track';
      });

      // Setup fade out before track ends
      currentAudio.addEventListener('timeupdate', function() {
        if (this.duration - this.currentTime <= 2.0) {
          if (this.volume > 0) {
            fadeAudio(this, this.volume, 0, 2000);
          }
        }
      });

      // Update all track entries
      trackList.querySelectorAll('.track-entry').forEach(entry => {
        entry.classList.remove('selected');
      });
      trackElement.classList.add('selected');

      // Setup auto-play for next track
      if (autoPlayMode) {
        currentAudio.addEventListener('ended', () => {
          currentTrackIndex = (currentTrackIndex + 1) % tracks.length;
          const nextTrack = tracks[currentTrackIndex];
          const nextTrackElement = trackList.children[currentTrackIndex];
          playTrack(nextTrack, nextTrackElement, trackList);
        });
      }
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

  // Setup user interaction detection
  document.addEventListener('click', () => {
    if (!hasUserInteracted) {
      hasUserInteracted = true;
      if (autoPlayMode && !currentAudio && tracks.length > 0) {
        const firstTrack = tracks[0];
        const firstTrackElement = trackList.children[0];
        playTrack(firstTrack, firstTrackElement, trackList);
      }
    }
  }, { once: true });

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
        currentTrackIndex = index;
        playTrack(track, trackElement, trackList);
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
}

export { initializeMusicMenu };