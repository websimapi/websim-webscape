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
  return storedMode === 'auto';
}

function saveMusicSettings(isAuto) {
  localStorage.setItem('musicMode', isAuto ? 'auto' : 'manual');
}

async function getDuration(audioPath) {
  return new Promise((resolve) => {
    const audio = new Audio(audioPath);
    audio.addEventListener('loadedmetadata', () => {
      resolve(audio.duration);
    });
    // Set error handler in case the audio fails to load
    audio.addEventListener('error', () => {
      resolve(0); // Return 0 duration on error
    });
  });
}

async function playTrack(track, trackElement, trackList) {
  if (!hasUserInteracted) return;

  if (track.unlocked) {
    if (currentAudio) {
      // Fade out current track if it's playing
      if (!currentAudio.paused) {
        const fadeOutDuration = 10;
        const fadeOutInterval = 50; // 50ms intervals for smooth transition
        const steps = (fadeOutDuration * 1000) / fadeOutInterval;
        const volumeStep = currentAudio.volume / steps;
        
        const fadeOutTimer = setInterval(() => {
          if (currentAudio.volume > volumeStep) {
            currentAudio.volume -= volumeStep;
          } else {
            currentAudio.volume = 0;
            clearInterval(fadeOutTimer);
            currentAudio.pause();
            currentAudio = null;
          }
        }, fadeOutInterval);
        
        // Wait for fade out to complete before starting new track
        await new Promise(resolve => setTimeout(resolve, fadeOutDuration * 1000));
      } else {
        currentAudio.pause();
        currentAudio = null;
      }
    }

    // Create and setup new audio
    currentAudio = new Audio(track.path);
    currentTrack = track.name;
    
    // Start with volume at 0 for fade in
    currentAudio.volume = 0;
    
    const trackDisplay = document.querySelector('#music-menu .track');
    trackDisplay.textContent = `Playing: ${currentTrack}`;
    
    try {
      // Get the duration before playing
      const duration = await getDuration(track.path);
      
      await currentAudio.play();
      
      // Fade in over 10 seconds
      const fadeInDuration = 10;
      const fadeInInterval = 50; // 50ms intervals for smooth transition
      const steps = (fadeInDuration * 1000) / fadeInInterval;
      const volumeStep = 1 / steps;
      
      const fadeInTimer = setInterval(() => {
        if (currentAudio.volume < 1 - volumeStep) {
          currentAudio.volume += volumeStep;
        } else {
          currentAudio.volume = 1;
          clearInterval(fadeInTimer);
        }
      }, fadeInInterval);
      
      // Setup fade out using timeupdate event for the last 10 seconds of the track
      if (duration > 10) {
        const fadeOutFunction = () => {
          const remaining = currentAudio.duration - currentAudio.currentTime;
          if (remaining <= 10) {
            // Linearly reduce volume based on the remaining time (last 10 seconds)
            currentAudio.volume = Math.max(remaining / 10, 0);
          }
        };
        currentAudio.addEventListener('timeupdate', fadeOutFunction);
        // Remove the listener when the track ends
        currentAudio.addEventListener('ended', () => {
          currentAudio.removeEventListener('timeupdate', fadeOutFunction);
        });
      }
    } catch (e) {
      console.error('Error playing audio:', e);
      trackDisplay.textContent = 'Playing: No track';
      return;
    }

    // Update all track entries so that the selected one appears in green (via CSS)
    trackList.querySelectorAll('.track-entry').forEach(entry => {
      entry.classList.remove('selected');
    });
    trackElement.classList.add('selected');

    // Setup auto-play for the next track if auto mode is enabled
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

function initializeMusicMenu() {
  const musicButton = document.querySelector('.bottom-icon.music');
  const musicMenu = document.getElementById('music-menu');
  const musicContent = musicMenu.querySelector('.music-content');
  const trackDisplay = musicMenu.querySelector('.track');
  const autoButton = musicMenu.querySelector('.music-auto');
  const manualButton = musicMenu.querySelector('.music-manual');

  // Initialize track list UI container
  const trackList = document.createElement('div');
  trackList.className = 'track-list';
  musicContent.appendChild(trackList);

  // Load saved music mode from local storage
  autoPlayMode = loadMusicSettings();
  if (autoPlayMode) {
    autoButton.classList.add('selected');
    manualButton.classList.remove('selected');
  } else {
    manualButton.classList.add('selected');
    autoButton.classList.remove('selected');
  }

  // Populate track list with available songs
  tracks.forEach((track, index) => {
    const trackElement = document.createElement('div');
    trackElement.className = 'track-entry';
    trackElement.textContent = track.name;
    
    if (track.unlocked) {
      trackElement.classList.add('unlocked');
    }

    trackElement.addEventListener('click', () => {
      hasUserInteracted = true; // Ensure user interaction before playing audio
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
    
    // Auto-play first track if in auto mode, user has interacted, and no track is currently playing
    if (hasUserInteracted && autoPlayMode && !currentAudio && tracks.length > 0) {
      const firstTrack = tracks[0];
      const firstTrackElement = trackList.children[0];
      playTrack(firstTrack, firstTrackElement, trackList);
    }
  });

  // Auto/Manual button functionality with persistence
  autoButton.addEventListener('click', () => {
    hasUserInteracted = true; // User has now interacted
    autoPlayMode = true;
    saveMusicSettings(true);
    autoButton.classList.add('selected');
    manualButton.classList.remove('selected');
    
    // Start playing if nothing is currently playing
    if (!currentAudio && tracks.length > 0) {
      const firstTrack = tracks[0];
      const firstTrackElement = trackList.children[0];
      playTrack(firstTrack, firstTrackElement, trackList);
    }
  });

  manualButton.addEventListener('click', () => {
    hasUserInteracted = true; // User interaction flag
    autoPlayMode = false;
    saveMusicSettings(false);
    manualButton.classList.add('selected');
    autoButton.classList.remove('selected');
    
    // Stop auto-play functionality by clearing the ended event handler
    if (currentAudio) {
      currentAudio.onended = null;
    }
  });

  // Set initial button states from stored settings
  if (autoPlayMode) {
    autoButton.classList.add('selected');
    manualButton.classList.remove('selected');
  } else {
    manualButton.classList.add('selected');
    autoButton.classList.remove('selected');
  }

  // Ensure no audio auto-start until the first user click on the page
  document.addEventListener('click', () => {
    hasUserInteracted = true;
  }, { once: true });
}

export { initializeMusicMenu };