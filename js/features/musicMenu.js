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
    audio.addEventListener('error', () => {
      resolve(0);
    });
  });
}

async function playTrack(track, trackElement, trackList) {
  if (!hasUserInteracted) return;

  if (track.unlocked) {
    if (currentAudio) {
      if (!currentAudio.paused) {
        // Fade out the current track over 10 seconds before switching
        const fadeOutDurationExit = 10; // seconds
        const fadeOutInterval = 50; // ms
        const steps = (fadeOutDurationExit * 1000) / fadeOutInterval;
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
        
        // Wait until fade-out completes before starting new track
        await new Promise(resolve => setTimeout(resolve, fadeOutDurationExit * 1000));
      } else {
        currentAudio.pause();
        currentAudio = null;
      }
    }

    currentAudio = new Audio(track.path);
    currentTrack = track.name;
    currentAudio.volume = 0;
    
    const trackDisplay = document.querySelector('#music-menu .track');
    trackDisplay.textContent = `Playing: ${currentTrack}`;
    
    try {
      const duration = await getDuration(track.path);
      await currentAudio.play();
      
      // Fade in over the first 10 seconds for a smoother transition
      const fadeInDuration = 10; // seconds
      const fadeInInterval = 50; // ms
      const fadeInSteps = (fadeInDuration * 1000) / fadeInInterval;
      const fadeInStep = 1 / fadeInSteps;
      
      const fadeInTimer = setInterval(() => {
        if (currentAudio.volume < 1 - fadeInStep) {
          currentAudio.volume += fadeInStep;
        } else {
          currentAudio.volume = 1;
          clearInterval(fadeInTimer);
        }
      }, fadeInInterval);
      
      // Setup smooth fade out over the last 10 seconds of the track
      const fadeOutDuration = 10; // seconds
      if (duration > fadeOutDuration) {
        // Clear any previous fade-out timers if they exist
        if (currentAudio.fadeOutTimeout) {
          clearTimeout(currentAudio.fadeOutTimeout);
        }
        if (currentAudio.fadeOutInterval) {
          clearInterval(currentAudio.fadeOutInterval);
        }
        const timeToFadeOutStart = (duration - fadeOutDuration - currentAudio.currentTime) * 1000;
        currentAudio.fadeOutTimeout = setTimeout(() => {
          const fadeIntervalMs = 100; // update every 100ms for smaller volume adjustments
          const fadeSteps = (fadeOutDuration * 1000) / fadeIntervalMs;
          const volumeStep = currentAudio.volume / fadeSteps;
          currentAudio.fadeOutInterval = setInterval(() => {
            if (currentAudio.volume > volumeStep) {
              currentAudio.volume = Math.max(currentAudio.volume - volumeStep, 0);
            } else {
              currentAudio.volume = 0;
              clearInterval(currentAudio.fadeOutInterval);
            }
          }, fadeIntervalMs);
        }, timeToFadeOutStart);
      }
    } catch (e) {
      console.error('Error playing audio:', e);
      trackDisplay.textContent = 'Playing: No track';
      return;
    }

    // Mark selected track in the list
    trackList.querySelectorAll('.track-entry').forEach(entry => {
      entry.classList.remove('selected');
    });
    trackElement.classList.add('selected');

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

  const trackList = document.createElement('div');
  trackList.className = 'track-list';
  musicContent.appendChild(trackList);

  autoPlayMode = loadMusicSettings();
  if (autoPlayMode) {
    autoButton.classList.add('selected');
    manualButton.classList.remove('selected');
  } else {
    manualButton.classList.add('selected');
    autoButton.classList.remove('selected');
  }

  tracks.forEach((track, index) => {
    const trackElement = document.createElement('div');
    trackElement.className = 'track-entry';
    trackElement.textContent = track.name;
    
    if (track.unlocked) {
      trackElement.classList.add('unlocked');
    }
    
    // Remove underline from song names
    trackElement.style.textDecoration = 'none';
    
    trackElement.addEventListener('click', () => {
      hasUserInteracted = true;
      if (track.unlocked) {
        currentTrackIndex = index;
        playTrack(track, trackElement, trackList);
      }
    });

    trackList.appendChild(trackElement);
  });

  musicButton.addEventListener('click', () => {
    toggleMenu(musicButton, '#music-menu');
    
    if (hasUserInteracted && autoPlayMode && !currentAudio && tracks.length > 0) {
      const firstTrack = tracks[0];
      const firstTrackElement = trackList.children[0];
      playTrack(firstTrack, firstTrackElement, trackList);
    }
  });

  autoButton.addEventListener('click', () => {
    hasUserInteracted = true;
    autoPlayMode = true;
    saveMusicSettings(true);
    autoButton.classList.add('selected');
    manualButton.classList.remove('selected');
    
    if (!currentAudio && tracks.length > 0) {
      const firstTrack = tracks[0];
      const firstTrackElement = trackList.children[0];
      playTrack(firstTrack, firstTrackElement, trackList);
    }
  });

  manualButton.addEventListener('click', () => {
    hasUserInteracted = true;
    autoPlayMode = false;
    saveMusicSettings(false);
    manualButton.classList.add('selected');
    autoButton.classList.remove('selected');
    
    if (currentAudio && currentAudio.onended) {
      currentAudio.onended = null;
    }
  });

  if (autoPlayMode) {
    autoButton.classList.add('selected');
    manualButton.classList.remove('selected');
  } else {
    manualButton.classList.add('selected');
    autoButton.classList.remove('selected');
  }

  // Ensure no audio auto-start until a user gesture is registered
  document.addEventListener('click', () => {
    hasUserInteracted = true;
  }, { once: true });
}

export { initializeMusicMenu };