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
let autoPlayTimeout = null;
let musicPlayToken = 0; // Incremented every time a new track is requested
let targetVolume = 1; // Default target volume (100%)

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
  },
  {
    name: 'No Thing',
    path: '/no_thing.ogg',
    unlocked: true
  },
  {
    name: "Aurora's Lullaby",
    path: "/lurora's_lullaby.ogg",
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

// Improved fade out with smoother transition
function fadeOutAudio(audio, fadeDuration = 10) {
  return new Promise((resolve) => {
    const startVolume = audio.volume;
    const startTime = performance.now();
    
    // Use quadratic easing for smoother fade out
    function easeOutQuad(t) {
      return t * (2 - t);
    }
    
    function step() {
      const elapsed = performance.now() - startTime;
      const fraction = elapsed / (fadeDuration * 1000);
      
      if (fraction < 1) {
        // Apply quadratic easing to the volume reduction
        const eased = easeOutQuad(1 - fraction);
        audio.volume = Math.max(startVolume * eased, 0);
        requestAnimationFrame(step);
      } else {
        audio.volume = 0;
        audio.pause();
        resolve();
      }
    }
    requestAnimationFrame(step);
  });
}

// Improved fade in with better timing
function fadeInAudio(audio, fadeDuration = 10, token) {
  return new Promise((resolve) => {
    const startTime = performance.now();
    
    // Use quadratic easing for smoother fade in
    function easeInQuad(t) {
      return t * t;
    }
    
    function step() {
      if (token !== musicPlayToken) {
        resolve();
        return;
      }
      const elapsed = performance.now() - startTime;
      const fraction = elapsed / (fadeDuration * 1000);
      
      if (fraction < 1) {
        const eased = easeInQuad(fraction);
        audio.volume = Math.min(eased * targetVolume, targetVolume);
        requestAnimationFrame(step);
      } else {
        audio.volume = targetVolume;
        resolve();
      }
    }
    requestAnimationFrame(step);
  });
}

function setMusicVolume(newVolume) {
  targetVolume = newVolume;
  if (currentAudio) {
    currentAudio.volume = newVolume;
  }
}

async function playTrack(track, trackElement, trackList) {
  if (!hasUserInteracted) return;
  
  musicPlayToken++;
  const token = musicPlayToken;
  
  if (autoPlayTimeout) {
    clearTimeout(autoPlayTimeout);
    autoPlayTimeout = null;
  }
  
  if (track.unlocked) {
    if (currentAudio) {
      await fadeOutAudio(currentAudio, 10);
      if (token !== musicPlayToken) return;
      currentAudio = null;
    }
    
    currentAudio = new Audio(track.path);
    currentTrack = track.name;
    currentAudio.volume = 0;
    
    const trackDisplay = document.querySelector('#music-menu .track');
    trackDisplay.textContent = `Playing: ${currentTrack}`;
    
    try {
      const duration = await getDuration(track.path);
      if (token !== musicPlayToken) return;
      await currentAudio.play();
      await fadeInAudio(currentAudio, 10, token);
      
      // Improved fade out timing for both auto and manual modes
      if (duration > 15) { // Start fade earlier
        if (fadeOutListener) {
          currentAudio.removeEventListener('timeupdate', fadeOutListener);
        }
        fadeOutListener = () => {
          const remaining = currentAudio.duration - currentAudio.currentTime;
          if (remaining <= 15) { // Longer fade period
            // Smoother volume reduction curve
            const fadeRatio = remaining / 15;
            const smoothVolume = Math.pow(fadeRatio, 2) * targetVolume; // Quadratic fade
            currentAudio.volume = smoothVolume;
          }
        };
        currentAudio.addEventListener('timeupdate', fadeOutListener);
        
        // Setup for auto mode transition
        if (autoPlayMode) {
          currentAudio.addEventListener('ended', () => {
            if (token !== musicPlayToken) return;
            // Reduced delay and immediate setup of next track
            autoPlayTimeout = setTimeout(() => {
              const randomIndex = Math.floor(Math.random() * tracks.length);
              currentTrackIndex = randomIndex;
              const nextTrack = tracks[randomIndex];
              const nextTrackElement = trackList.children[randomIndex];
              playTrack(nextTrack, nextTrackElement, trackList);
            }, 500); // Reduced delay between tracks
          });
        }
      }
      
      // Clear the ended listener if not in auto mode
      if (!autoPlayMode) {
        currentAudio.onended = null;
      }
    } catch (e) {
      console.error('Error playing audio:', e);
      const trackDisplay = document.querySelector('#music-menu .track');
      trackDisplay.textContent = 'Playing: No track';
      return;
    }
    
    trackList.querySelectorAll('.track-entry').forEach(entry => {
      entry.classList.remove('selected');
      if (entry.classList.contains('unlocked')) {
        entry.style.color = '#00ff00';
      }
    });
    trackElement.classList.add('selected');
    trackElement.style.color = '#00ff00';
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
      trackElement.style.color = '#00ff00';
    }
    
    trackElement.addEventListener('click', () => {
      hasUserInteracted = true;
      if (autoPlayTimeout) {
        clearTimeout(autoPlayTimeout);
        autoPlayTimeout = null;
      }
      // Switch to MAN (manual) mode when a track is clicked.
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
  
  setInterval(() => {
    if (autoPlayMode && (!currentAudio || currentAudio.paused) && tracks.length > 0) {
      const randomIndex = Math.floor(Math.random() * tracks.length);
      currentTrackIndex = randomIndex;
      const trackElt = trackList.children[randomIndex];
      playTrack(tracks[randomIndex], trackElt, trackList);
    }
  }, 30000);
  
  document.addEventListener('click', () => {
    hasUserInteracted = true;
  }, { once: true });
}

export { initializeMusicMenu, setMusicVolume };