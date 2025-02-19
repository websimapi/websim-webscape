import { toggleMenu } from './menuManager.js';

// Initialize WebSocket connection
const room = new WebsimSocket();

// Track audio state and fade control variables
let currentAudio = null;
let currentTrack = 'No track';
let autoPlayMode = false;
let currentTrackIndex = 0;
let hasUserInteracted = false;
let autoPlayTimeout = null;
let musicPlayToken = 0; // Incremented every time a new track is requested

// Global variables for managing fade animation frames.
let currentFadeInAnimator = null;
let currentFadeOutAnimator = null;

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

// Load (and later save) the music mode preference.
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

// Helper: Smoothly fade out the given audio to 0 volume over fadeDuration seconds using requestAnimationFrame.
function fadeOutAudio(audio, fadeDuration = 10) {
  return new Promise((resolve) => {
    const startTime = performance.now();
    const initialVolume = audio.volume;
    function step(now) {
      const elapsed = now - startTime;
      const fraction = elapsed / (fadeDuration * 1000);
      const clampedFraction = Math.min(fraction, 1);
      audio.volume = Math.max(initialVolume * (1 - clampedFraction), 0);
      if (fraction < 1) {
        currentFadeOutAnimator = requestAnimationFrame(step);
      } else {
        audio.volume = 0;
        audio.pause();
        currentFadeOutAnimator = null;
        resolve();
      }
    }
    currentFadeOutAnimator = requestAnimationFrame(step);
  });
}

// Helper: Smoothly fade in the given audio from volume 0 to 1 over fadeDuration seconds using requestAnimationFrame.
function fadeInAudio(audio, fadeDuration = 10) {
  return new Promise((resolve) => {
    const startTime = performance.now();
    function step(now) {
      const elapsed = now - startTime;
      const fraction = elapsed / (fadeDuration * 1000);
      const clampedFraction = Math.min(fraction, 1);
      if (fraction < 1) {
        audio.volume = Math.min(clampedFraction, 1);
        currentFadeInAnimator = requestAnimationFrame(step);
      } else {
        audio.volume = 1;
        currentFadeInAnimator = null;
        resolve();
      }
    }
    currentFadeInAnimator = requestAnimationFrame(step);
  });
}

async function playTrack(track, trackElement, trackList) {
  if (!hasUserInteracted) return;
  
  // Increment token to cancel any previous pending transitions.
  musicPlayToken++;
  const token = musicPlayToken;
  
  // Clear any scheduled auto-play timeout.
  if (autoPlayTimeout) {
    clearTimeout(autoPlayTimeout);
    autoPlayTimeout = null;
  }
  
  // Cancel any ongoing fade in animation if necessary.
  if (currentFadeInAnimator) {
    cancelAnimationFrame(currentFadeInAnimator);
    currentFadeInAnimator = null;
  }
  
  if (currentAudio) {
    await fadeOutAudio(currentAudio, 10); // Smooth fade out over 10 seconds
    await new Promise(resolve => setTimeout(resolve, 3000)); // 3 second delay before starting next track
    if (token !== musicPlayToken) return; // Abort if a new track was requested meanwhile
    currentAudio = null;
  }
  
  // Start the selected track.
  currentAudio = new Audio(track.path);
  currentTrack = track.name;
  currentAudio.volume = 0;
  
  // Update UI to display the currently playing track.
  const trackDisplay = document.querySelector('#music-menu .track');
  trackDisplay.textContent = `Playing: ${currentTrack}`;
  
  try {
    const duration = await getDuration(track.path);
    if (token !== musicPlayToken) return; // Abort if another track was selected meanwhile
    await currentAudio.play();
    await fadeInAudio(currentAudio, 10); // Smooth fade in over 10 seconds
    
    // Setup smooth fade out during the last 10 seconds of the track.
    if (duration > 10) {
      if (currentAudio._fadeOutListener) {
        currentAudio.removeEventListener('timeupdate', currentAudio._fadeOutListener);
      }
      const fadeOutListener = () => {
        const remaining = currentAudio.duration - currentAudio.currentTime;
        if (remaining <= 10) {
          // Ensure volume does not go below 0 using Math.max
          currentAudio.volume = Math.max(remaining / 10, 0);
        }
      };
      currentAudio._fadeOutListener = fadeOutListener;
      currentAudio.addEventListener('timeupdate', fadeOutListener);
      currentAudio.addEventListener('ended', () => {
        currentAudio.removeEventListener('timeupdate', fadeOutListener);
      });
    }
  } catch (e) {
    console.error('Error playing audio:', e);
    const trackDisplay = document.querySelector('#music-menu .track');
    trackDisplay.textContent = 'Playing: No track';
    return;
  }
  
  // Update the UI: unselect all track entries then select the clicked one.
  trackList.querySelectorAll('.track-entry').forEach(entry => {
    entry.classList.remove('selected');
    if (entry.classList.contains('unlocked')) {
      entry.style.color = '#00ff00';
    }
  });
  trackElement.classList.add('selected');
  trackElement.style.color = '#00ff00';
  
  // In AUTO mode, schedule a random track after the song ends.
  if (autoPlayMode) {
    currentAudio.addEventListener('ended', () => {
      if (token !== musicPlayToken) return;
      autoPlayTimeout = setTimeout(() => {
        const randomIndex = Math.floor(Math.random() * tracks.length);
        currentTrackIndex = randomIndex;
        const nextTrack = tracks[randomIndex];
        const nextTrackElement = trackList.children[randomIndex];
        playTrack(nextTrack, nextTrackElement, trackList);
      }, 3000); // 3 second delay before the next track starts automatically.
    });
  }
}

function initializeMusicMenu() {
  const musicButton = document.querySelector('.bottom-icon.music');
  const musicMenu = document.getElementById('music-menu');
  const musicContent = musicMenu.querySelector('.music-content');
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
      // Unlocked songs appear in green.
      trackElement.style.color = '#00ff00';
    }
    
    trackElement.addEventListener('click', () => {
      hasUserInteracted = true;
      if (autoPlayTimeout) {
        clearTimeout(autoPlayTimeout);
        autoPlayTimeout = null;
      }
      // When a user manually clicks a track, switch to MAN mode.
      autoPlayMode = false;
      saveMusicSettings(false);
      manualButton.classList.add('selected');
      autoButton.classList.remove('selected');
      
      if (track.unlocked) {
        currentTrackIndex = index;
        playTrack(track, trackElement, trackList);
      }
    });
    
    trackList.appendChild(trackElement);
  });
  
  musicButton.addEventListener('click', () => {
    toggleMenu(musicButton, '#music-menu');
    if (hasUserInteracted && autoPlayMode && (!currentAudio || currentAudio.paused) && tracks.length > 0) {
      const randomIndex = Math.floor(Math.random() * tracks.length);
      currentTrackIndex = randomIndex;
      const randomTrack = tracks[randomIndex];
      const randomTrackElement = trackList.children[randomIndex];
      playTrack(randomTrack, randomTrackElement, trackList);
    }
  });
  
  autoButton.addEventListener('click', () => {
    hasUserInteracted = true;
    autoPlayMode = true;
    saveMusicSettings(true);
    autoButton.classList.add('selected');
    manualButton.classList.remove('selected');
    if (!currentAudio && tracks.length > 0) {
      const randomIndex = Math.floor(Math.random() * tracks.length);
      currentTrackIndex = randomIndex;
      const randomTrack = tracks[randomIndex];
      const randomTrackElement = trackList.children[randomIndex];
      playTrack(randomTrack, randomTrackElement, trackList);
    }
  });
  
  manualButton.addEventListener('click', () => {
    hasUserInteracted = true;
    autoPlayMode = false;
    saveMusicSettings(false);
    manualButton.classList.add('selected');
    autoButton.classList.remove('selected');
    if (autoPlayTimeout) {
      clearTimeout(autoPlayTimeout);
      autoPlayTimeout = null;
    }
    if (currentAudio) {
      currentAudio.onended = null;
    }
  });
  
  // Periodically check if a song is not playing (in AUTO mode) and start one if needed.
  setInterval(() => {
    if (autoPlayMode && (!currentAudio || currentAudio.paused) && tracks.length > 0) {
      const randomIndex = Math.floor(Math.random() * tracks.length);
      currentTrackIndex = randomIndex;
      const trackElt = trackList.children[randomIndex];
      playTrack(tracks[randomIndex], trackElt, trackList);
    }
  }, 30000); // 30 seconds interval
  
  // The very first user interaction anywhere on the page will enable audio.
  document.addEventListener('click', () => {
    hasUserInteracted = true;
  }, { once: true });
}

export { initializeMusicMenu };