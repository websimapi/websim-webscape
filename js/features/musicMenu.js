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
let musicPlayToken = 0; 
let targetVolume = 1;

const tracks = [
  { name: 'Ambient Venture', path: '/ambient_venture.ogg', unlocked: true },
  { name: 'Shadow Warden', path: '/shadow_warden.ogg', unlocked: true },
  { name: 'No Thing', path: '/no_thing.ogg', unlocked: true },
  { name: "Aurora's Lullaby", path: "/lurora's_lullaby.ogg", unlocked: true },
  { name: "Pig Pipe", path: "/pig_pipe.ogg", unlocked: true }
];

async function getDuration(track) {
  return new Promise((resolve) => {
    const audio = new Audio(track.path);
    audio.addEventListener('loadedmetadata', () => resolve(audio.duration));
    audio.addEventListener('error', () => resolve(0));
  });
}

tracks.forEach(async (track) => {
  track.duration = await getDuration(track);
});

function fadeOutAudio(audio, fadeDuration = 10) {
  return new Promise(resolve => {
    if (!audio || audio.volume === 0) return resolve();
    const startVolume = audio.volume;
    const startTime = performance.now();
    function step() {
      const elapsed = performance.now() - startTime;
      const fraction = elapsed / (fadeDuration * 1000);
      if (fraction < 1) {
        audio.volume = Math.max(targetVolume * (1 - fraction), 0);
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
  return new Promise(resolve => {
    const startTime = performance.now();
    function step() {
      if (token !== musicPlayToken) return resolve();
      const elapsed = performance.now() - startTime;
      const fraction = elapsed / (fadeDuration * 1000);
      if (fraction < 1) {
        audio.volume = Math.min(targetVolume * fraction, targetVolume);
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
  
  if (autoPlayTimeout) clearTimeout(autoPlayTimeout);

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
      await currentAudio.play();
      await fadeInAudio(currentAudio, 10, token);

      if (track.duration > 10) {
        const fadeOutTime = track.duration - 10;
        
        if (fadeOutListener) currentAudio.removeEventListener('timeupdate', fadeOutListener);
        
        fadeOutListener = () => {
          if (currentAudio.currentTime >= fadeOutTime) {
            const remainingTime = track.duration - currentAudio.currentTime;
            currentAudio.volume = Math.max(0, targetVolume * (remainingTime / 10));
          }
        };

        currentAudio.addEventListener('timeupdate', fadeOutListener);

        currentAudio.addEventListener('ended', async () => {
          currentAudio.removeEventListener('timeupdate', fadeOutListener);
          currentAudio.volume = 0;
          
          if (autoPlayMode && token === musicPlayToken) {
            autoPlayTimeout = setTimeout(() => {
              const randomIndex = Math.floor(Math.random() * tracks.length);
              currentTrackIndex = randomIndex;
              playTrack(tracks[randomIndex], trackList.children[randomIndex], trackList);
            }, 3000);
          }
        });
      }
    } catch (e) {
      console.error('Error playing audio:', e);
      trackDisplay.textContent = 'Playing: No track';
      return;
    }

    trackList.querySelectorAll('.track-entry').forEach(entry => {
      entry.classList.remove('selected');
      if (entry.classList.contains('unlocked')) entry.style.color = '#00ff00';
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

  autoPlayMode = localStorage.getItem('musicMode') === 'auto';
  autoButton.classList.toggle('selected', autoPlayMode);
  manualButton.classList.toggle('selected', !autoPlayMode);

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
      if (autoPlayTimeout) clearTimeout(autoPlayTimeout);
      autoPlayMode = false;
      localStorage.setItem('musicMode', 'manual');
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
    if (hasUserInteracted && autoPlayMode && (!currentAudio || currentAudio.paused)) {
      const randomIndex = Math.floor(Math.random() * tracks.length);
      currentTrackIndex = randomIndex;
      playTrack(tracks[randomIndex], trackList.children[randomIndex], trackList);
    }
  });

  autoButton.addEventListener('click', () => {
    hasUserInteracted = true;
    autoPlayMode = true;
    localStorage.setItem('musicMode', 'auto');
    autoButton.classList.add('selected');
    manualButton.classList.remove('selected');
    
    if (!currentAudio) {
      const randomIndex = Math.floor(Math.random() * tracks.length);
      currentTrackIndex = randomIndex;
      playTrack(tracks[randomIndex], trackList.children[randomIndex], trackList);
    }
  });

  manualButton.addEventListener('click', () => {
    hasUserInteracted = true;
    autoPlayMode = false;
    localStorage.setItem('musicMode', 'manual');
    manualButton.classList.add('selected');
    autoButton.classList.remove('selected');
    if (autoPlayTimeout) clearTimeout(autoPlayTimeout);
    if (currentAudio) currentAudio.onended = null;
  });

  setInterval(() => {
    if (autoPlayMode && (!currentAudio || currentAudio.paused) && tracks.length > 0) {
      const randomIndex = Math.floor(Math.random() * tracks.length);
      currentTrackIndex = randomIndex;
      playTrack(tracks[randomIndex], trackList.children[randomIndex], trackList);
    }
  }, 30000);

  document.addEventListener('click', () => hasUserInteracted = true, { once: true });
}

export { initializeMusicMenu, setMusicVolume };