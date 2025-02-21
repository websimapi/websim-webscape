import { toggleMenu } from './menuManager.js';
import { room } from '../room.js';

let currentAudio = null;
let currentTrack = 'No track';
let autoPlayMode = false;
let currentTrackIndex = 0;
let hasUserInteracted = false;
let fadeOutListener = null;
let autoPlayTimeout = null;
let musicPlayToken = 0; 
let targetVolume = 1; 
let trackData = null; 

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
  },
  {
    name: "Edge of Time",
    path: "/edge_of_time.ogg",
    unlocked: true
  }
];

async function loadTrackMetadata() {
  try {
    const response = await fetch('/songs.json');
    if (!response.ok) throw new Error('Failed to load song metadata');
    trackData = await response.json();
    
    if (trackData && trackData.tracks) {
      trackData.tracks.forEach((metadata) => {
        const existingTrack = tracks.find(t => t.name === metadata.name);
        if (existingTrack) {
          Object.assign(existingTrack, metadata);
        }
      });
    }
  } catch (err) {
    console.log('Could not load song metadata, falling back to audio duration detection');
  }
}
loadTrackMetadata();

function loadMusicSettings() {
  const storedMode = localStorage.getItem('musicMode');
  return storedMode === null ? true : storedMode === 'auto';
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

function fadeOutAudio(audio, fadeDuration = 10) {
  return new Promise((resolve) => {
    if (!audio || audio.volume === 0) {
      resolve();
      return;
    }
    const startVolume = audio.volume;
    const startTime = performance.now();
    function step() {
      const elapsed = performance.now() - startTime;
      const fraction = elapsed / (fadeDuration * 1000);
      if (fraction < 1) {
        const newVolume = Math.max(0, startVolume * (1 - fraction));
        audio.volume = newVolume;
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

function fadeInAudio(audio, fadeDuration = 10, token) {
  return new Promise((resolve) => {
    if (targetVolume === 0) {
      audio.volume = 0;
      resolve();
      return;
    }
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
      await new Promise(resolve => setTimeout(resolve, 3000)); 
      if (token !== musicPlayToken) return;
      currentAudio = null;
    }
    
    currentAudio = new Audio(track.path);
    currentTrack = track.name;
    currentAudio.volume = 0;
    
    const trackDisplay = document.querySelector('#music-menu .track');
    trackDisplay.textContent = `Playing: ${currentTrack}`;
    
    try {
      let duration;
      if (trackData) {
        const metadata = trackData.tracks.find(t => t.name === track.name);
        duration = metadata ? metadata.duration : await getDuration(track.path);
      } else {
        duration = await getDuration(track.path);
      }
      if (token !== musicPlayToken) return;
      await currentAudio.play();
      await fadeInAudio(currentAudio, 10, token);
      
      if (duration > 10) {
        let fadeOutStart = duration - 10; 
        if (trackData) {
          const metadata = trackData.tracks.find(t => t.name === track.name);
          if (metadata && metadata.fadeOutStart) {
            fadeOutStart = metadata.fadeOutStart;
          }
        }
        
        if (fadeOutListener) {
          currentAudio.removeEventListener('timeupdate', fadeOutListener);
        }
        
        fadeOutListener = () => {
          if (currentAudio.currentTime >= fadeOutStart) {
            const remainingTime = duration - currentAudio.currentTime;
            const fadeRatio = remainingTime / 10;
            currentAudio.volume = Math.max(0, targetVolume * fadeRatio);
          }
        };
        
        currentAudio.addEventListener('timeupdate', fadeOutListener);
        
        currentAudio.addEventListener('ended', () => {
          currentAudio.removeEventListener('timeupdate', fadeOutListener);
          currentAudio.volume = 0; 
          
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