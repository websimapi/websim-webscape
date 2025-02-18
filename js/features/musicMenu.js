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
  console.log("Loaded music mode from localStorage:", storedMode);
  return storedMode === 'auto';
}

function saveMusicSettings(isAuto) {
  localStorage.setItem('musicMode', isAuto ? 'auto' : 'manual');
  console.log("Saved music mode to localStorage:", isAuto ? 'auto' : 'manual');
}

function playTrack(track, trackElement, trackList) {
  if (!hasUserInteracted) { 
    console.log("User hasn't interacted yet, will not play track:", track.name);
    return;
  }
  console.log("playTrack triggered for track:", track.name);
  if (track.unlocked) {
    if (currentAudio) {
      console.log("Pausing current audio. Previous track:", currentTrack);
      currentAudio.pause();
      currentAudio = null;
    }
    currentAudio = new Audio(track.path);
    currentTrack = track.name;
    
    const trackDisplay = document.querySelector('#music-menu .track');
    trackDisplay.textContent = `Playing: ${currentTrack}`;
    console.log("Attempting to play track:", currentTrack);
    currentAudio.play().then(() => {
      console.log("Track started playing:", currentTrack);
    }).catch(e => {
      console.error("Error playing audio:", e);
      trackDisplay.textContent = 'Playing: No track';
    });
    
    // Reset styling for all track entries
    trackList.querySelectorAll('.track-entry').forEach(entry => {
      entry.classList.remove('selected');
      entry.style.color = ""; // reset any previous inline styling
    });
    trackElement.classList.add('selected');
    trackElement.style.color = "lightgreen"; // use lighter green for select indication
    
    // Setup auto-play for next track if autoPlayMode is enabled
    if (autoPlayMode) {
      currentAudio.addEventListener('ended', () => {
        console.log("Track ended:", currentTrack);
        currentTrackIndex = (currentTrackIndex + 1) % tracks.length;
        const nextTrack = tracks[currentTrackIndex];
        const nextTrackElement = trackList.children[currentTrackIndex];
        console.log("Auto-playing next track:", nextTrack.name);
        playTrack(nextTrack, nextTrackElement, trackList);
      });
    }
  } else {
    console.log("Track is not unlocked:", track.name);
  }
}

function initializeMusicMenu() {
  console.log("Initializing Music Menu");
  const musicButton = document.querySelector('.bottom-icon.music');
  const musicMenu = document.getElementById('music-menu');
  const musicContent = musicMenu.querySelector('.music-content');
  const trackDisplay = musicMenu.querySelector('.track');
  const autoButton = musicMenu.querySelector('.music-auto');
  const manualButton = musicMenu.querySelector('.music-manual');

  // Initialize track list container (create if missing)
  let trackList = musicContent.querySelector('.track-list');
  if (!trackList) {
    trackList = document.createElement('div');
    trackList.className = 'track-list';
    musicContent.appendChild(trackList);
    console.log("Created new track list container");
  } else {
    console.log("Found existing track list container");
  }
  
  // Clear and populate track list
  trackList.innerHTML = "";
  tracks.forEach((track, index) => {
    const trackElement = document.createElement('div');
    trackElement.className = 'track-entry';
    trackElement.textContent = track.name;
    if (track.unlocked) {
      trackElement.classList.add('unlocked');
      trackElement.style.color = "lightgreen"; // update unlocked color to lighter green
    } else {
      trackElement.style.color = "gray";
    }
    trackElement.addEventListener('click', () => {
      hasUserInteracted = true;
      console.log("Track clicked:", track.name);
      if (track.unlocked) {
        currentTrackIndex = index;
        playTrack(track, trackElement, trackList);
      } else {
        console.log("Clicked track is locked:", track.name);
      }
    });
    trackList.appendChild(trackElement);
    console.log("Added track to list:", track.name);
  });
  console.log("Total tracks in list:", trackList.children.length);
  
  // For Firefox compatibility, use 'mouseup' if InstallTrigger exists
  const eventType = (typeof InstallTrigger !== 'undefined') ? 'mouseup' : 'click';
  if (typeof InstallTrigger !== 'undefined') {
    console.log("Firefox detected - using 'mouseup' for auto/manual buttons.");
  }
  console.log("Using event type for auto/manual buttons:", eventType);

  musicButton.addEventListener('click', () => {
    console.log("Music Button clicked.");
    toggleMenu(musicButton, '#music-menu');
    if (hasUserInteracted && autoPlayMode && !currentAudio && tracks.length > 0) {
      const firstTrack = tracks[0];
      const firstTrackElement = trackList.children[0];
      console.log("Auto mode active - auto playing first track:", firstTrack.name);
      playTrack(firstTrack, firstTrackElement, trackList);
    } else {
      console.log("Music menu toggled; auto play conditions not met.");
    }
  });

  autoButton.addEventListener(eventType, () => {
    console.log("Auto Button event triggered.");
    hasUserInteracted = true;
    autoPlayMode = true;
    saveMusicSettings(true);
    autoButton.classList.add('selected');
    manualButton.classList.remove('selected');
    if (!currentAudio && tracks.length > 0) {
      const firstTrack = tracks[0];
      const firstTrackElement = trackList.children[0];
      console.log("Starting auto mode play for track:", firstTrack.name);
      playTrack(firstTrack, firstTrackElement, trackList);
    }
  });

  manualButton.addEventListener(eventType, () => {
    console.log("Manual Button event triggered.");
    hasUserInteracted = true;
    autoPlayMode = false;
    saveMusicSettings(false);
    manualButton.classList.add('selected');
    autoButton.classList.remove('selected');
    if (currentAudio) {
      currentAudio.onended = null;
      console.log("Manual mode: Stopped auto-play functionality.");
    }
  });

  if (autoPlayMode) {
    autoButton.classList.add('selected');
    manualButton.classList.remove('selected');
    console.log("Initial mode set to Auto.");
  } else {
    manualButton.classList.add('selected');
    autoButton.classList.remove('selected');
    console.log("Initial mode set to Manual.");
  }

  // Ensure we mark first user interaction to allow audio play
  document.addEventListener('click', () => {
    if (!hasUserInteracted) {
      console.log("First user interaction detected.");
    }
    hasUserInteracted = true;
  }, { once: true });
}

export { initializeMusicMenu };