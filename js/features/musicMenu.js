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
let musicPlayToken = 0; // Incremented every time a new track is requested
let targetVolume = 1; // Default target volume (100%)

// Music tracks list including "No Thing" as requested.
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

// Fade out the given audio to 0 volume smoothly over fadeDuration seconds.
function fadeOutAudio(audio, fadeDuration = 10) {
  return new Promise((resolve) => {
    const startVolume = audio.volume;
    const startTime = performance.now();
    function step() {
      const elapsed = performance.now() - startTime;
      const fraction = elapsed / (fadeDuration * 1000);
      if (fraction < 1) {
        audio.volume = Math.max(startVolume * (1 - fraction), 0);
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

// Fade in the audio from volume 0 to the targetVolume over fadeDuration seconds.
function fadeInAudio(audio, fadeDuration = 10, token) {
  return new Promise((resolve) => {
    const startTime = performance.now();
    function step() {
      if (token !== musicPlayToken) {
        resolve();
        return;
      }
      const elapsed = performance.now() - startTime;
      const fraction = elapsed / (fadeDuration * 1000);
      if (fraction < 1) {
        const eased = 1 - Math.pow(1 - fraction, 2);
        audio.volume = Math.min(eased, targetVolume);
        requestAnimationFrame(step);
      } else {
        audio.volume = targetVolume;
        resolve();
      }
    }
    requestAnimationFrame(step);
  });
}

// Allow external modules (like game options) to set the music volume.
function setMusicVolume(newVolume) {
  targetVolume = newVolume;
  if (currentAudio) {
    currentAudio.volume = newVolume;
  }
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
  
  if (track.unlocked) {
    // If a song is already playing, fade it out and wait before starting a new one.
    if (currentAudio) {
      await fadeOutAudio(currentAudio, 10);
      await new Promise(resolve => setTimeout(resolve, 3000)); // 3 second delay between tracks
      if (token !== musicPlayToken) return;
      currentAudio = null;
    }
    
    // Start the selected track.
    currentAudio = new Audio(track.path);
    currentTrack = track.name;
    currentAudio.volume = 0;
    
    // Update UI to display the currently playing track.
    const trackDisplay = document.querySelector('#music-menu .track');
    if (trackDisplay) {
      trackDisplay.textContent = `Playing: ${currentTrack}`;
    }
    
    try {
      const duration = await getDuration(track.path);
      if (token !== musicPlayToken) return;
      await currentAudio.play();
      await fadeInAudio(currentAudio, 10, token);
      
      // In AUTO mode, schedule an auto fade out that mirrors manual fade out.
      if (autoPlayMode) {
        const fadeDuration = 10; // seconds for fade out
        const fadeOutDelay = Math.max(0, (duration - fadeDuration) * 1000);
        autoPlayTimeout = setTimeout(async () => {
          if (token !== musicPlayToken) return;
          if (currentAudio) {
            await fadeOutAudio(currentAudio, fadeDuration);
            await new Promise(resolve => setTimeout(resolve, 3000));
            if (token !== musicPlayToken) return;
            const randomIndex = Math.floor(Math.random() * tracks.length);
            currentTrackIndex = randomIndex;
            const nextTrack = tracks[randomIndex];
            const nextTrackElement = trackList.children[randomIndex];
            playTrack(nextTrack, nextTrackElement, trackList);
          }
        }, fadeOutDelay);
      }
    } catch (e) {
      console.error('Error playing audio:', e);
      const trackDisplay = document.querySelector('#music-menu .track');
      if (trackDisplay) {
        trackDisplay.textContent = 'Playing: No track';
      }
      return;
    }
    
    // Update UI: unselect all track entries, then select the clicked one.
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
      if (autoPlayMode && autoPlayTimeout) {
        clearTimeout(autoPlayTimeout);
        autoPlayTimeout = null;
      }
      // Switch to Manual mode when a track is clicked.
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
    if (autoPlayMode && autoPlayTimeout) {
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