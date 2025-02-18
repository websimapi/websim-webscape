import { toggleMenu } from './menuManager.js';

let room;
try {
  if (typeof WebsimSocket !== 'function') {
    throw new Error('WebsimSocket is not available or not a function');
  }
  room = new WebsimSocket();
  console.log("MusicMenu: WebsimSocket instance created successfully:", room);
} catch (err) {
  console.error("MusicMenu: Error creating WebsimSocket instance:", err);
}

let currentAudio = null;
let currentTrack = 'No track';
let autoPlayMode = loadMusicSettings();
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
  console.log("MusicMenu: Loaded music mode from localStorage:", storedMode);
  return storedMode === 'auto';
}

function saveMusicSettings(isAuto) {
  localStorage.setItem('musicMode', isAuto ? 'auto' : 'manual');
  console.log("MusicMenu: Saved music mode to localStorage:", isAuto ? 'auto' : 'manual');
}

function playTrack(track, trackElement, trackList) {
  if (!hasUserInteracted) { 
    console.log("MusicMenu: User hasn't interacted yet, will not play track:", track.name);
    return;
  }
  console.log("MusicMenu: playTrack triggered for track:", track.name);
  if (track.unlocked) {
    if (currentAudio) {
      console.log("MusicMenu: Pausing current audio. Previous track:", currentTrack);
      currentAudio.pause();
      currentAudio = null;
    }
    currentAudio = new Audio(track.path);
    currentTrack = track.name;
    
    const trackDisplay = document.querySelector('#music-menu .track');
    trackDisplay.textContent = `Playing: ${currentTrack}`;
    console.log("MusicMenu: Attempting to play track:", currentTrack);
    currentAudio.play().then(() => {
      console.log("MusicMenu: Track started playing:", currentTrack);
    }).catch(e => {
      console.error("MusicMenu: Error playing audio:", e);
      trackDisplay.textContent = 'Playing: No track';
    });
    
    // Reset styling for all track entries
    trackList.querySelectorAll('.track-entry').forEach(entry => {
      entry.classList.remove('selected');
      entry.style.color = ""; // reset any previous inline styling
    });
    trackElement.classList.add('selected');
    trackElement.style.color = "#00ff00"; // using online green color
    
    // Setup auto-play for next track if autoPlayMode is enabled
    if (autoPlayMode) {
      currentAudio.addEventListener('ended', () => {
        console.log("MusicMenu: Track ended:", currentTrack);
        currentTrackIndex = (currentTrackIndex + 1) % tracks.length;
        const nextTrack = tracks[currentTrackIndex];
        const nextTrackElement = trackList.children[currentTrackIndex];
        console.log("MusicMenu: Auto-playing next track:", nextTrack.name);
        playTrack(nextTrack, nextTrackElement, trackList);
      });
    }
  } else {
    console.log("MusicMenu: Track is not unlocked:", track.name);
  }
}

function initializeMusicMenu() {
  console.log("MusicMenu: Initializing Music Menu");
  const musicButton = document.querySelector('.bottom-icon.music');
  const musicMenu = document.getElementById('music-menu');
  if (!musicMenu) {
    console.error("MusicMenu: Music menu element not found!");
    return;
  }
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
    console.log("MusicMenu: Created new track list container");
  } else {
    console.log("MusicMenu: Found existing track list container");
  }
  
  // Clear and populate track list
  trackList.innerHTML = "";
  tracks.forEach((track, index) => {
    const trackElement = document.createElement('div');
    trackElement.className = 'track-entry';
    trackElement.textContent = track.name;
    if (track.unlocked) {
      trackElement.classList.add('unlocked');
      trackElement.style.color = "#00ff00"; // using online green color
    } else {
      trackElement.style.color = "gray";
    }
    trackElement.addEventListener('click', () => {
      hasUserInteracted = true;
      console.log("MusicMenu: Track clicked:", track.name, "Index:", index, "Unlocked:", track.unlocked);
      if (track.unlocked) {
        currentTrackIndex = index;
        playTrack(track, trackElement, trackList);
      } else {
        console.log("MusicMenu: Clicked track is locked:", track.name);
      }
    });
    trackList.appendChild(trackElement);
    console.log("MusicMenu: Added track to list:", track.name);
  });
  console.log("MusicMenu: Total tracks in list:", trackList.children.length);
  
  // For Firefox compatibility, use 'mouseup' if InstallTrigger exists
  const eventType = (typeof InstallTrigger !== 'undefined') ? 'mouseup' : 'click';
  console.log("MusicMenu: Using event type for auto/manual buttons:", eventType);

  musicButton.addEventListener('click', () => {
    console.log("MusicMenu: Music Button clicked.");
    toggleMenu(musicButton, '#music-menu');
    if (hasUserInteracted && autoPlayMode && !currentAudio && tracks.length > 0) {
      const firstTrack = tracks[0];
      const firstTrackElement = trackList.children[0];
      console.log("MusicMenu: Auto mode active - auto playing first track:", firstTrack.name);
      playTrack(firstTrack, firstTrackElement, trackList);
    } else {
      console.log("MusicMenu: Music menu toggled; auto play conditions not met.");
    }
  });

  autoButton.addEventListener(eventType, () => {
    console.log("MusicMenu: Auto Button event triggered.");
    hasUserInteracted = true;
    autoPlayMode = true;
    saveMusicSettings(true);
    autoButton.classList.add('selected');
    manualButton.classList.remove('selected');
    if (!currentAudio && tracks.length > 0) {
      const firstTrack = tracks[0];
      const firstTrackElement = trackList.children[0];
      console.log("MusicMenu: Starting auto mode play for track:", firstTrack.name);
      playTrack(firstTrack, firstTrackElement, trackList);
    }
  });

  manualButton.addEventListener(eventType, () => {
    console.log("MusicMenu: Manual Button event triggered.");
    hasUserInteracted = true;
    autoPlayMode = false;
    saveMusicSettings(false);
    manualButton.classList.add('selected');
    autoButton.classList.remove('selected');
    if (currentAudio) {
      currentAudio.onended = null;
      console.log("MusicMenu: Manual mode: Stopped auto-play functionality.");
    }
  });

  if (autoPlayMode) {
    autoButton.classList.add('selected');
    manualButton.classList.remove('selected');
    console.log("MusicMenu: Initial mode set to Auto.");
  } else {
    manualButton.classList.add('selected');
    autoButton.classList.remove('selected');
    console.log("MusicMenu: Initial mode set to Manual.");
  }

  // Ensure we mark first user interaction to allow audio play
  document.addEventListener('click', () => {
    if (!hasUserInteracted) {
      console.log("MusicMenu: First user interaction detected.");
    }
    hasUserInteracted = true;
  }, { once: true });
}

export { initializeMusicMenu };