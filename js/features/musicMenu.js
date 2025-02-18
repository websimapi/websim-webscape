import { toggleMenu } from './menuManager.js';

// Initialize WebSocket connection
const room = new WebsimSocket();

// Track audio state
let currentAudio = null;
let isPlaying = false;
let currentTrack = 'No track';
let autoPlayMode = false;
let currentTrackIndex = 0;

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

function playTrack(track, trackElement, trackList) {
  if (track.unlocked) {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio = null;
    }

    currentAudio = new Audio(track.path);
    currentTrack = track.name;
    
    const trackDisplay = document.querySelector('#music-menu .track');
    trackDisplay.textContent = `Playing: ${currentTrack}`;
    
    // Detect Firefox and log debug info
    const isFirefox = typeof InstallTrigger !== 'undefined';
    if (isFirefox) {
      console.log("[MusicMenu] Firefox detected in playTrack. Attempting to play track:", track.name, "Audio element:", currentAudio);
    }
    
    currentAudio.play()
      .then(() => {
        console.log("[MusicMenu] Playback started for track:", track.name);
      })
      .catch(e => {
        console.error('[MusicMenu] Error playing audio for track:', track.name, e);
        trackDisplay.textContent = 'Playing: No track';
      });

    // Update all track entries: remove any previously selected style
    trackList.querySelectorAll('.track-entry').forEach(entry => {
      entry.classList.remove('selected');
    });
    trackElement.classList.add('selected');

    // Setup auto-play for next track if in auto mode
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
  // Detect Firefox and output debug info
  const isFirefox = typeof InstallTrigger !== 'undefined';
  if (isFirefox) {
    console.log("[MusicMenu] Firefox detected. Initializing music menu with Firefox support.");
  }

  const musicButton = document.querySelector('.bottom-icon.music');
  const musicMenu = document.getElementById('music-menu');
  const musicContent = musicMenu.querySelector('.music-content');
  const trackDisplay = musicMenu.querySelector('.track');
  const autoButton = musicMenu.querySelector('.music-auto');
  const manualButton = musicMenu.querySelector('.music-manual');

  // Initialize track list element and log debug info
  const trackList = document.createElement('div');
  trackList.className = 'track-list';
  musicContent.appendChild(trackList);
  console.log("[MusicMenu] Track list element created and appended.");

  // Load saved music mode from localStorage
  autoPlayMode = loadMusicSettings();
  if (autoPlayMode) {
    autoButton.classList.add('selected');
    manualButton.classList.remove('selected');
  } else {
    manualButton.classList.add('selected');
    autoButton.classList.remove('selected');
  }

  // Populate tracks into the track list with debug logging
  tracks.forEach((track, index) => {
    console.log("[MusicMenu] Loading track:", track.name, "at index", index);
    const trackElement = document.createElement('div');
    trackElement.className = 'track-entry';
    trackElement.textContent = track.name;
    
    if (track.unlocked) {
      trackElement.classList.add('unlocked');
    }

    trackElement.addEventListener('click', () => {
      if (track.unlocked) {
        currentTrackIndex = index;
        playTrack(track, trackElement, trackList);
      }
    });

    trackList.appendChild(trackElement);
  });

  // Handle music menu toggle button
  musicButton.addEventListener('click', () => {
    toggleMenu(musicButton, '#music-menu');
    
    // If in auto mode and no track is playing, auto-play the first track
    if (autoPlayMode && !currentAudio && tracks.length > 0) {
      const firstTrack = tracks[0];
      const firstTrackElement = trackList.children[0];
      playTrack(firstTrack, firstTrackElement, trackList);
    }
  });

  // Auto/Manual button functionality with localStorage updates
  autoButton.addEventListener('click', () => {
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
    autoPlayMode = false;
    saveMusicSettings(false);
    manualButton.classList.add('selected');
    autoButton.classList.remove('selected');
    
    // Stop auto-play functionality if a track is currently playing
    if (currentAudio) {
      currentAudio.onended = null;
    }
  });

  // Set initial mode based on the stored settings
  if (autoPlayMode) {
    autoButton.click();
  } else {
    manualButton.click();
  }
}

export { initializeMusicMenu };