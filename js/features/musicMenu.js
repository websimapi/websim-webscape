import { toggleMenu } from './menuManager.js';

// Initialize WebSocket connection
const room = new WebsimSocket();

// Track audio state
let currentAudio = null;
let currentTrack = 'No track';
let autoPlayMode = false;
let currentTrackIndex = 0;
let hasUserInteracted = false;
let autoPlayTimeout = null;
let musicPlayToken = 0;
let targetVolume = 1; // Default target volume (100%)

// Audio context and gain node
let audioContext = null;
let gainNode = null;
let audioSource = null;

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
  },
  {
    name: "Pig Pipe",
    path: "/pig_pipe.ogg", 
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

function initializeAudioContext() {
  if (!audioContext) {
    audioContext = new AudioContext();
    gainNode = audioContext.createGain();
    gainNode.connect(audioContext.destination);
  }
}

function fadeToVolume(targetVal, duration) {
  if (!gainNode || !audioContext) return;
  
  const now = audioContext.currentTime;
  gainNode.gain.cancelScheduledValues(now);
  gainNode.gain.setValueAtTime(gainNode.gain.value, now);
  gainNode.gain.linearRampToValueAtTime(targetVal * targetVolume, now + duration);
}

async function playTrack(track, trackElement, trackList) {
  if (!hasUserInteracted) return;
  
  // Increment token to cancel any previous transitions
  musicPlayToken++;
  const token = musicPlayToken;
  
  // Clear any scheduled auto-play timeout
  if (autoPlayTimeout) {
    clearTimeout(autoPlayTimeout);
    autoPlayTimeout = null;
  }
  
  if (track.unlocked) {
    // Initialize audio context if needed
    initializeAudioContext();
    
    // If a song is already playing, fade it out and wait
    if (currentAudio) {
      fadeToVolume(0, 2);
      await new Promise(resolve => setTimeout(resolve, 2000));
      if (token !== musicPlayToken) return;
      
      // Clean up old audio
      if (audioSource) {
        audioSource.disconnect();
      }
      currentAudio.pause();
      currentAudio = null;
    }
    
    // Start the new track
    currentAudio = new Audio(track.path);
    currentTrack = track.name;
    
    // Wait for audio to be ready
    await new Promise(resolve => {
      currentAudio.addEventListener('canplay', resolve, { once: true });
    });
    
    // Connect to Web Audio API
    audioSource = audioContext.createMediaElementSource(currentAudio);
    audioSource.connect(gainNode);
    
    // Start with volume at 0
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    
    // Update UI
    const trackDisplay = document.querySelector('#music-menu .track');
    trackDisplay.textContent = `Playing: ${currentTrack}`;
    
    try {
      const duration = await getDuration(track.path);
      if (token !== musicPlayToken) return;
      
      await currentAudio.play();
      fadeToVolume(1, 2); // 2-second fade in
      
      // Setup fade out
      const timeUntilFadeStart = duration - 10;
      if (timeUntilFadeStart > 0) {
        setTimeout(() => {
          if (currentAudio && !currentAudio.paused) {
            fadeToVolume(0, 10); // 10-second fade out
          }
        }, timeUntilFadeStart * 1000);
      }
      
      // Handle track end
      currentAudio.addEventListener('ended', () => {
        if (autoPlayMode && token === musicPlayToken) {
          autoPlayTimeout = setTimeout(() => {
            const randomIndex = Math.floor(Math.random() * tracks.length);
            currentTrackIndex = randomIndex;
            const nextTrack = tracks[randomIndex];
            const nextTrackElement = trackList.children[randomIndex];
            playTrack(nextTrack, nextTrackElement, trackList);
          }, 3000);
        }
      });
      
    } catch (e) {
      console.error('Error playing audio:', e);
      const trackDisplay = document.querySelector('#music-menu .track');
      trackDisplay.textContent = 'Playing: No track';
      return;
    }
    
    // Update UI selection
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

// Allow external modules to set music volume
function setMusicVolume(newVolume) {
  targetVolume = newVolume;
  if (gainNode) {
    fadeToVolume(gainNode.gain.value / targetVolume, 0.1);
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