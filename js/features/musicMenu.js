import { toggleMenu } from './menuManager.js';

// Initialize WebSocket connection
const room = new WebsimSocket();

// Create a shared AudioContext to help Firefox (and others) satisfy user-gesture requirements
let audioContext;
function resumeAudioContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioContext.state === 'suspended') {
    audioContext.resume().then(() => {
      console.log('AudioContext resumed');
    }).catch(err => {
      console.error('AudioContext resume error:', err);
    });
  }
}

// Track audio state
let currentAudio = null;
let isPlaying = false;
let currentTrack = 'No track';
let autoPlayMode = false;
let currentTrackIndex = 0;
let hasUserInteracted = false;

// List of available tracks – Ambient Venture is added and unlocked (green)
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
  // Only attempt to play if we have had a user gesture.
  if (!hasUserInteracted) return;

  // Ensure that the AudioContext is resumed so that playback is allowed.
  resumeAudioContext();

  if (track.unlocked) {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio = null;
    }

    // Create a new HTMLAudioElement – Firefox will now allow playback after our user gesture.
    currentAudio = new Audio(track.path);
    currentTrack = track.name;
    
    const trackDisplay = document.querySelector('#music-menu .track');
    trackDisplay.textContent = `Playing: ${currentTrack}`;
    
    currentAudio.play().catch(e => {
      console.error('Error playing audio:', e);
      trackDisplay.textContent = 'Playing: No track';
    });

    // Update every track entry to remove any previous selection.
    trackList.querySelectorAll('.track-entry').forEach(entry => {
      entry.classList.remove('selected');
    });
    // Mark the clicked track entry as selected to keep its text green.
    trackElement.classList.add('selected');

    // Setup auto-play to cycle through tracks if the mode is set to Auto.
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

  // Create and append the track list container if it doesn't exist.
  let trackList = musicContent.querySelector('.track-list');
  if (!trackList) {
    trackList = document.createElement('div');
    trackList.className = 'track-list';
    musicContent.appendChild(trackList);
  }

  // Load and set saved music mode from localStorage.
  autoPlayMode = loadMusicSettings();
  if (autoPlayMode) {
    autoButton.classList.add('selected');
    manualButton.classList.remove('selected');
  } else {
    manualButton.classList.add('selected');
    autoButton.classList.remove('selected');
  }

  // Populate the track list with available tracks.
  tracks.forEach((track, index) => {
    const trackElement = document.createElement('div');
    trackElement.className = 'track-entry';
    trackElement.textContent = track.name;
    
    if (track.unlocked) {
      trackElement.classList.add('unlocked');
    }

    // Add a click event; ensure a user gesture is recorded and resume the AudioContext.
    trackElement.addEventListener('click', () => {
      hasUserInteracted = true;
      resumeAudioContext();
      if (track.unlocked) {
        currentTrackIndex = index;
        playTrack(track, trackElement, trackList);
      }
    });

    trackList.appendChild(trackElement);
  });

  // Handle music menu toggle – also record user interaction and resume audio.
  musicButton.addEventListener('click', (e) => {
    hasUserInteracted = true;
    resumeAudioContext();
    toggleMenu(musicButton, '#music-menu');
    
    // If in Auto mode and no track is playing, start playing the first track.
    if (autoPlayMode && !currentAudio && tracks.length > 0) {
      const firstTrack = tracks[0];
      const firstTrackElement = trackList.children[0];
      playTrack(firstTrack, firstTrackElement, trackList);
    }
  });

  // Auto-mode button functionality.
  autoButton.addEventListener('click', () => {
    hasUserInteracted = true;
    resumeAudioContext();
    autoPlayMode = true;
    saveMusicSettings(true);
    autoButton.classList.add('selected');
    manualButton.classList.remove('selected');
    
    // If no track is playing, start playing the first track.
    if (!currentAudio && tracks.length > 0) {
      const firstTrack = tracks[0];
      const firstTrackElement = trackList.children[0];
      playTrack(firstTrack, firstTrackElement, trackList);
    }
  });

  // Manual-mode button functionality.
  manualButton.addEventListener('click', () => {
    hasUserInteracted = true;
    resumeAudioContext();
    autoPlayMode = false;
    saveMusicSettings(false);
    manualButton.classList.add('selected');
    autoButton.classList.remove('selected');
    
    // Disable auto-play functionality if audio is currently playing.
    if (currentAudio) {
      currentAudio.onended = null;
    }
  });

  // Attach a mousedown event on the document so that Firefox registers a user gesture early.
  document.addEventListener('mousedown', () => {
    if (!hasUserInteracted) {
      hasUserInteracted = true;
      resumeAudioContext();
    }
  }, { once: true });
}

export { initializeMusicMenu };