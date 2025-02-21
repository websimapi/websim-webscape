import { toggleMenu } from './menuManager.js';
import { DebugLogger, DOMDebug, AudioDebug } from '../debug.js';

// Initialize WebSocket connection
const room = new WebsimSocket();
DebugLogger.debug('INIT', 'Music WebSocket initialized');

// Track audio state
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

DebugLogger.debug('INIT', 'Music state variables initialized', {
  currentTrack,
  autoPlayMode,
  targetVolume
});

// Initialize tracks from hardcoded data first
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

DebugLogger.debug('INIT', 'Track list initialized', { trackCount: tracks.length });

// Try to load track metadata from JSON
async function loadTrackMetadata() {
  try {
    DebugLogger.debug('INIT', 'Loading track metadata from songs.json');
    const response = await fetch('/songs.json');
    if (!response.ok) {
      throw new Error('Failed to load song metadata');
    }
    trackData = await response.json();
    
    // Merge metadata with existing tracks
    if (trackData && trackData.tracks) {
      DebugLogger.debug('INIT', 'Merging track metadata', {
        loadedTracks: trackData.tracks.length
      });
      
      trackData.tracks.forEach((metadata) => {
        const existingTrack = tracks.find(t => t.name === metadata.name);
        if (existingTrack) {
          Object.assign(existingTrack, metadata);
          DebugLogger.debug('INIT', `Updated track metadata for: ${metadata.name}`);
        }
      });
    }
  } catch (err) {
    DebugLogger.error('INIT', 'Failed to load song metadata', { error: err });
    console.log('Could not load song metadata, falling back to audio duration detection');
  }
}

loadTrackMetadata();

function loadMusicSettings() {
  const storedMode = localStorage.getItem('musicMode');
  DebugLogger.debug('AUDIO', 'Loading music settings from localStorage', {
    storedMode,
    defaultsToAuto: storedMode === 'auto'
  });
  return storedMode === 'auto';
}

function saveMusicSettings(isAuto) {
  DebugLogger.debug('AUDIO', 'Saving music settings', { isAuto });
  localStorage.setItem('musicMode', isAuto ? 'auto' : 'manual');
}

async function getDuration(audioPath) {
  DebugLogger.debug('AUDIO', 'Getting duration for audio file', { audioPath });
  return new Promise((resolve) => {
    const audio = new Audio(audioPath);
    audio.addEventListener('loadedmetadata', () => {
      DebugLogger.debug('AUDIO', 'Audio metadata loaded', {
        path: audioPath,
        duration: audio.duration
      });
      resolve(audio.duration);
    });
    audio.addEventListener('error', (e) => {
      DebugLogger.error('AUDIO', 'Error loading audio', {
        path: audioPath,
        error: e.target.error
      });
      resolve(0);
    });
  });
}

function fadeOutAudio(audio, fadeDuration = 10) {
  AudioDebug.logAudioEvent('fadeOut', {
    startVolume: audio?.volume,
    fadeDuration,
    currentTrack
  });

  return new Promise((resolve) => {
    if (!audio || audio.volume === 0) {
      DebugLogger.debug('AUDIO', 'Fade out skipped - audio null or volume 0');
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
        AudioDebug.logAudioEvent('fadeStep', {
          currentVolume: newVolume,
          progress: fraction
        });
        requestAnimationFrame(step);
      } else {
        audio.volume = 0;
        audio.pause();
        AudioDebug.logAudioEvent('fadeComplete', {
          finalVolume: audio.volume
        });
        resolve();
      }
    }
    requestAnimationFrame(step);
  });
}

function fadeInAudio(audio, fadeDuration = 10, token) {
  AudioDebug.logAudioEvent('fadeIn', {
    targetVolume,
    fadeDuration,
    token,
    currentToken: musicPlayToken
  });

  return new Promise((resolve) => {
    if (targetVolume === 0) {
      DebugLogger.debug('AUDIO', 'Fade in skipped - target volume is 0');
      audio.volume = 0;
      resolve();
      return;
    }
    
    const startTime = performance.now();
    
    function step() {
      if (token !== musicPlayToken) {
        DebugLogger.debug('AUDIO', 'Fade in cancelled - token mismatch', {
          expected: token,
          current: musicPlayToken
        });
        resolve();
        return;
      }
      
      const elapsed = performance.now() - startTime;
      const fraction = elapsed / (fadeDuration * 1000);
      if (fraction < 1) {
        const eased = 1 - Math.pow(1 - fraction, 2);
        audio.volume = Math.min(eased * targetVolume, targetVolume);
        AudioDebug.logAudioEvent('fadeStep', {
          currentVolume: audio.volume,
          progress: fraction
        });
        requestAnimationFrame(step);
      } else {
        audio.volume = targetVolume;
        AudioDebug.logAudioEvent('fadeComplete', {
          finalVolume: audio.volume
        });
        resolve();
      }
    }
    requestAnimationFrame(step);
  });
}

function setMusicVolume(newVolume) {
  DebugLogger.debug('AUDIO', 'Setting music volume', {
    oldVolume: targetVolume,
    newVolume,
    currentAudioVolume: currentAudio?.volume
  });
  
  targetVolume = newVolume;
  if (currentAudio) {
    currentAudio.volume = newVolume;
  }
}

async function playTrack(track, trackElement, trackList) {
  DebugLogger.info('AUDIO', 'Track play requested', {
    track: track.name,
    hasUserInteracted,
    currentTrack
  });

  if (!hasUserInteracted) {
    DebugLogger.warn('AUDIO', 'Play attempted before user interaction');
    return;
  }
  
  musicPlayToken++;
  const token = musicPlayToken;
  
  if (autoPlayTimeout) {
    DebugLogger.debug('AUDIO', 'Clearing previous autoplay timeout');
    clearTimeout(autoPlayTimeout);
    autoPlayTimeout = null;
  }
  
  if (track.unlocked) {
    if (currentAudio) {
      DebugLogger.debug('AUDIO', 'Fading out current track', {
        currentTrack,
        currentVolume: currentAudio.volume
      });
      
      await fadeOutAudio(currentAudio, 10);
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      if (token !== musicPlayToken) {
        DebugLogger.debug('AUDIO', 'Playback cancelled - token mismatch');
        return;
      }
      currentAudio = null;
    }
    
    DebugLogger.debug('AUDIO', 'Starting new track', {
      track: track.name,
      path: track.path
    });
    
    currentAudio = new Audio(track.path);
    currentTrack = track.name;
    currentAudio.volume = 0;
    
    const trackDisplay = DOMDebug.checkElement('#music-menu .track', 'Track Display');
    if (trackDisplay) {
      trackDisplay.textContent = `Playing: ${currentTrack}`;
    }
    
    try {
      let duration;
      if (trackData) {
        const metadata = trackData.tracks.find(t => t.name === track.name);
        duration = metadata ? metadata.duration : await getDuration(track.path);
        DebugLogger.debug('AUDIO', 'Track duration retrieved', {
          source: metadata ? 'metadata' : 'audio',
          duration
        });
      } else {
        duration = await getDuration(track.path);
      }

      if (token !== musicPlayToken) {
        DebugLogger.debug('AUDIO', 'Playback cancelled after duration check');
        return;
      }

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
        
        DebugLogger.debug('AUDIO', 'Setting up fade out listener', {
          duration,
          fadeOutStart
        });
        
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
          DebugLogger.debug('AUDIO', 'Track ended', {
            track: track.name,
            autoPlayMode
          });
          
          currentAudio.removeEventListener('timeupdate', fadeOutListener);
          currentAudio.volume = 0;
          
          if (autoPlayMode && token === musicPlayToken) {
            const randomIndex = Math.floor(Math.random() * tracks.length);
            DebugLogger.debug('AUDIO', 'Setting up autoplay', {
              nextTrackIndex: randomIndex,
              nextTrack: tracks[randomIndex].name
            });
            
            autoPlayTimeout = setTimeout(() => {
              currentTrackIndex = randomIndex;
              const nextTrack = tracks[randomIndex];
              const nextTrackElement = trackList.children[randomIndex];
              playTrack(nextTrack, nextTrackElement, trackList);
            }, 3000);
          }
        });
      }
      
    } catch (e) {
      DebugLogger.error('AUDIO', 'Error playing audio', {
        track: track.name,
        error: e
      });
      const trackDisplay = document.querySelector('#music-menu .track');
      if (trackDisplay) {
        trackDisplay.textContent = 'Playing: No track';
      }
      return;
    }
    
    // Update UI selection state
    trackList.querySelectorAll('.track-entry').forEach(entry => {
      entry.classList.remove('selected');
      if (entry.classList.contains('unlocked')) {
        entry.style.color = '#00ff00';
      }
    });
    trackElement.classList.add('selected');
    trackElement.style.color = '#00ff00';
    
    DebugLogger.debug('AUDIO', 'Track play completed', {
      track: track.name,
      volume: currentAudio.volume
    });
  }
}

function initializeMusicMenu() {
  DebugLogger.info('INIT', 'Initializing music menu');
  
  const musicButton = DOMDebug.checkElement('.bottom-icon.music', 'Music Button');
  const musicMenu = DOMDebug.checkElement('#music-menu', 'Music Menu');
  if (!musicButton || !musicMenu) {
    DebugLogger.error('INIT', 'Failed to find required music menu elements');
    return;
  }
  
  const musicContent = musicMenu.querySelector('.music-content');
  const autoButton = musicMenu.querySelector('.music-auto');
  const manualButton = musicMenu.querySelector('.music-manual');
  
  const trackList = document.createElement('div');
  trackList.className = 'track-list';
  musicContent.appendChild(trackList);
  
  autoPlayMode = loadMusicSettings();
  DebugLogger.debug('INIT', 'Music settings loaded', { autoPlayMode });
  
  if (autoPlayMode) {
    autoButton.classList.add('selected');
    manualButton.classList.remove('selected');
  } else {
    manualButton.classList.add('selected');
    autoButton.classList.remove('selected');
  }
  
  // Initialize track list
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
      DebugLogger.debug('EVENTS', 'Track clicked', {
        track: track.name,
        index
      });
      
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
  
  // Setup menu button handler
  musicButton.addEventListener('click', () => {
    DebugLogger.debug('EVENTS', 'Music button clicked');
    toggleMenu(musicButton, '#music-menu');
    
    if (hasUserInteracted && autoPlayMode && (!currentAudio || currentAudio.paused) && tracks.length > 0) {
      const randomIndex = Math.floor(Math.random() * tracks.length);
      DebugLogger.debug('AUDIO', 'Auto-starting random track', {
        index: randomIndex,
        track: tracks[randomIndex].name
      });
      
      currentTrackIndex = randomIndex;
      const randomTrack = tracks[randomIndex];
      const randomTrackElement = trackList.children[randomIndex];
      playTrack(randomTrack, randomTrackElement, trackList);
    }
  });
  
  // Setup auto/manual mode buttons
  autoButton.addEventListener('click', () => {
    hasUserInteracted = true;
    autoPlayMode = true;
    DebugLogger.debug('EVENTS', 'Auto mode enabled');
    
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
    DebugLogger.debug('EVENTS', 'Manual mode enabled');
    
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
  
  // Setup periodic check for autoplay
  setInterval(() => {
    if (autoPlayMode && (!currentAudio || currentAudio.paused) && tracks.length > 0) {
      const randomIndex = Math.floor(Math.random() * tracks.length);
      DebugLogger.debug('AUDIO', 'Auto-playing next track', {
        index: randomIndex,
        track: tracks[randomIndex].name
      });
      
      currentTrackIndex = randomIndex;
      const trackElt = trackList.children[randomIndex];
      playTrack(tracks[randomIndex], trackElt, trackList);
    }
  }, 30000);
  
  // Setup user interaction detection
  document.addEventListener('click', () => {
    hasUserInteracted = true;
    DebugLogger.debug('EVENTS', 'User interaction detected');
  }, { once: true });
  
  DebugLogger.info('INIT', 'Music menu initialization completed');
}

export { initializeMusicMenu, setMusicVolume };