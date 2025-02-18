import { toggleMenu } from './menuManager.js';

// Initialize WebSocket connection
const room = new WebsimSocket();

// Track audio state
let currentAudio = null;
let isPlaying = false;
let currentTrack = 'No track';
let autoPlayMode = false;
let currentTrackIndex = 0;
let hasUserInteracted = false;

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

  if (track.unlocked) {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio = null;
    }

    currentAudio = new Audio(track.path);
    currentTrack = track.name;
    
    const trackDisplay = document.querySelector('#music-menu .track');
    trackDisplay.textContent = `Playing: ${currentTrack}`;
    
    currentAudio.play().catch(e => {
      console.error('Error playing audio:', e);
      trackDisplay.textContent = 'Playing: No track';
    });

    // Update all track entries
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
  const musicButton = document.querySelector('.bottom-icon.music');
  const musicMenu = document.getElementById('music-menu');
  const musicContent = musicMenu.querySelector('.music-content');
  const trackDisplay = musicMenu.querySelector('.track');
  const autoButton = musicMenu.querySelector('.music-auto');
  const manualButton = musicMenu.querySelector('.music-manual');

  // Create and append the track list container
  const trackList = document.createElement('div');
  trackList.className = 'track-list';
  musicContent.appendChild(trackList);

  // Load and set saved music mode
  autoPlayMode = loadMusicSettings();
  if (autoPlayMode) {
    autoButton.classList.add('selected');
    manualButton.classList.remove('selected');
  } else {
    manualButton.classList.add('selected');
    autoButton.classList.remove('selected');
  }

  // Populate track list with available tracks
  tracks.forEach((track, index) => {
    const trackElement = document.createElement('div');
    trackElement.className = 'track-entry';
    trackElement.textContent = track.name;
    
    if (track.unlocked) {
      trackElement.classList.add('unlocked');
    }

    // When a track is clicked, mark user interaction and play the track
    trackElement.addEventListener('click', () => {
      hasUserInteracted = true;
      if (track.unlocked) {
        currentTrackIndex = index;
        playTrack(track, trackElement, trackList);
      }
    });

    trackList.appendChild(trackElement);
  });

  // Handle music menu toggle – also set the interaction flag on click
  musicButton.addEventListener('click', (e) => {
    hasUserInteracted = true;
    toggleMenu(musicButton, '#music-menu');
    
    // If in auto mode and no track is playing, start the first track
    if (autoPlayMode && !currentAudio && tracks.length > 0) {
      const firstTrack = tracks[0];
      const firstTrackElement = trackList.children[0];
      playTrack(firstTrack, firstTrackElement, trackList);
    }
  });

  // Auto-mode button functionality
  autoButton.addEventListener('click', () => {
    hasUserInteracted = true;
    autoPlayMode = true;
    saveMusicSettings(true);
    autoButton.classList.add('selected');
    manualButton.classList.remove('selected');
    
    // If no track is playing, start playing the first track
    if (!currentAudio && tracks.length > 0) {
      const firstTrack = tracks[0];
      const firstTrackElement = trackList.children[0];
      playTrack(firstTrack, firstTrackElement, trackList);
    }
  });

  // Manual-mode button functionality
  manualButton.addEventListener('click', () => {
    hasUserInteracted = true;
    autoPlayMode = false;
    saveMusicSettings(false);
    manualButton.classList.add('selected');
    autoButton.classList.remove('selected');
    
    // Disable auto-play functionality if audio is playing
    if (currentAudio) {
      currentAudio.onended = null;
    }
  });

  // Use a mousedown event (instead of click) at the document level so that Firefox registers a user gesture early
  document.addEventListener('mousedown', () => {
    hasUserInteracted = true;
  }, { once: true });
}

export { initializeMusicMenu };