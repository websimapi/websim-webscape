import { toggleMenu } from './menuManager.js';

function initializeMusicPlayer() {
  const musicButton = document.querySelector('.bottom-icon:nth-child(7)');
  const musicPlayer = document.getElementById('music-player');

  musicButton.addEventListener('click', () => {
    toggleMenu(musicButton, '#music-player');
  });

  // Sample original music tracks list
  const musicList = [
    { category: 'TRACKS:', tracks: [
      { name: "Village Theme", status: "playing" },
      { name: "Mystic Forest", status: "unlocked" },
      { name: "Mountain Peak", status: "unlocked" },
      { name: "Desert Winds", status: "locked" },
      { name: "Ocean Depths", status: "locked" },
      { name: "Castle Gates", status: "locked" },
      { name: "Ancient Ruins", status: "locked" },
      { name: "Cave Echoes", status: "locked" },
      { name: "Hidden Valley", status: "locked" },
      { name: "Dragon's Lair", status: "locked" }
    ]}
  ];

  const playerContent = musicPlayer.querySelector('.music-player-content');
  
  // Clear any existing content
  playerContent.innerHTML = '';
  
  musicList.forEach(section => {
    const categoryHeader = document.createElement('div');
    categoryHeader.className = 'music-category';
    categoryHeader.textContent = section.category;
    playerContent.appendChild(categoryHeader);

    section.tracks.forEach(track => {
      const trackEntry = document.createElement('div');
      trackEntry.className = 'music-entry';
      // Add appropriate color class based on status
      if (track.status === 'playing') {
        trackEntry.classList.add('playing');
      } else if (track.status === 'locked') {
        trackEntry.classList.add('locked');
      }
      trackEntry.textContent = track.name;
      
      // Add click handler for unlocked/playing tracks
      if (track.status !== 'locked') {
        trackEntry.addEventListener('click', () => {
          // Remove playing class from all tracks
          document.querySelectorAll('.music-entry.playing').forEach(entry => {
            entry.classList.remove('playing');
          });
          // Add playing class to clicked track if it's not locked
          if (track.status !== 'locked') {
            trackEntry.classList.add('playing');
          }
        });
      }
      
      playerContent.appendChild(trackEntry);
    });
  });
}

export { initializeMusicPlayer };