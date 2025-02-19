import { toggleMenu } from './menuManager.js';

// Initialize WebSocket connection
const room = new WebsimSocket();

// Track audio state
let currentAudio = null;
let currentTrack = 'No track';
let autoPlayMode = false;
let currentTrackIndex = 0;
let hasUserInteracted = false;
let fadeOutListener = null;

const tracks = [
  {
    name: 'Ambient Venture',
    path: '/ambient_venture.ogg',
    unlocked: true
  },
  {
    name: 'Shadow Warden',
    path: '/shadow_warden.ogg',
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

// Helper: Smoothly fade out the given audio to 0 volume over fadeDuration seconds.
function fadeOutAudio(audio, fadeDuration = 10) {
  return new Promise((resolve) => {
    const fadeOutInterval = 100; // interval in ms for smoother fade out
    const steps = (fadeDuration * 1000) / fadeOutInterval;
    const volumeStep = audio.volume / steps;
    const fadeOutTimer = setInterval(() => {
      if (audio.volume > volumeStep) {
        audio.volume = Math.max(audio.volume - volumeStep, 0);
      } else {
        audio.volume = 0;
        clearInterval(fadeOutTimer);
        audio.pause();
        resolve();
      }
    }, fadeOutInterval);
  });
}

// Helper: Smoothly fade in the given audio from volume 0 to 1 over fadeDuration seconds.
function fadeInAudio(audio, fadeDuration = 10) {
  return new Promise((resolve) => {
    const fadeInInterval = 50; // interval in ms for fade in
    const steps = (fadeDuration * 1000) / fadeInInterval;
    const volumeStep = 1 / steps;
    const fadeInTimer = setInterval(() => {
      if (audio.volume < 1 - volumeStep) {
        audio.volume += volumeStep;
      } else {
        audio.volume = 1;
        clearInterval(fadeInTimer);
        resolve();
      }
    }, fadeInInterval);
  });
}

async function playTrack(track, trackElement, trackList) {
  if (!hasUserInteracted) return;

  if (track.unlocked) {
    // If a song is already playing, fade it out smoothly and wait a short delay
    if (currentAudio) {
      await fadeOutAudio(currentAudio, 10); // Fade out current song over 10 seconds
      // Add an additional 3 second delay between tracks as desired
      await new Promise(resolve => setTimeout(resolve, 3000));
      currentAudio = null;
    }

    // Start the selected track
    currentAudio = new Audio(track.path);
    currentTrack = track.name;
    currentAudio.volume = 0;

    // Update the UI to display the currently playing track
    const trackDisplay = document.querySelector('#music-menu .track');
    trackDisplay.textContent = `Playing: ${currentTrack}`;

    try {
      const duration = await getDuration(track.path);
      await currentAudio.play();
      // Fade in the song over 10 seconds
      await fadeInAudio(currentAudio, 10);

      // For the natural end of the song, setup a smoother fade-out during its last 10 seconds:
      if (duration > 10) {
        // Remove any previous fadeOutListener before setting a new one
        if (fadeOutListener) {
          currentAudio.removeEventListener('timeupdate', fadeOutListener);
        }
        fadeOutListener = () => {
          const remaining = currentAudio.duration - currentAudio.currentTime;
          if (remaining <= 10) {
            // Apply quadratic easing: as the remaining time decreases, volume drops more smoothly
            currentAudio.volume = Math.pow(remaining / 10, 2);
          }
        };
        currentAudio.addEventListener('timeupdate', fadeOutListener);
        currentAudio.addEventListener('ended', () => {
          currentAudio.removeEventListener('timeupdate', fadeOutListener);
        });
      }
    } catch (e) {
      console.error('Error playing audio:', e);
      trackDisplay.textContent = 'Playing: No track';
      return;
    }

    // Update the UI: ensure that all track entries are not selected and their text shows unlocked color (green)
    trackList.querySelectorAll('.track-entry').forEach(entry => {
      entry.classList.remove('selected');
      if (entry.classList.contains('unlocked')) {
        entry.style.color = '#00ff00';
      }
    });
    // Mark the clicked track as selected and enforce green text color
    trackElement.classList.add('selected');
    trackElement.style.color = '#00ff00';

    // If auto-play mode is enabled, set the current track to advance automatically when this track ends.
    if (autoPlayMode) {
      currentAudio.addEventListener('ended', () => {
        currentTrackIndex = (currentTrackIndex + 1) % tracks.length;
        const nextTrack = tracks[currentTrackIndex];
        const nextTrackElement = trackList.children[currentTrackIndex];
        // A 3 second delay before the next track starts automatically
        setTimeout(() => {
          playTrack(nextTrack, nextTrackElement, trackList);
        }, 3000);
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
      // Set unlocked songs to display in green
      trackElement.style.color = '#00ff00';
    }

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
    
    if (currentAudio) {
      currentAudio.onended = null;
    }
  });

  // Ensure that the very first user interaction anywhere on the page is recorded
  document.addEventListener('click', () => {
    hasUserInteracted = true;
  }, { once: true });
}

export { initializeMusicMenu };