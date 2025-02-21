let featuresLoaded = {
  friends: false,
  ignore: false,
  inventory: false,
  logout: false,
  gameOptions: false,
  questJournal: false,
  skillsMenu: false,
  musicMenu: false,
  spellbook: false,
  compass: false,
  worlds: false
};

function initializeFeature(feature, initFn) {
  featuresLoaded[feature] = true;
  if (typeof initFn === 'function') {
    initFn();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const script = document.createElement('script');
  script.src = './features/friends.js';
  script.onload = () => {
    initializeFeature('friends', window.initializeFriendsList);
  };
  document.head.appendChild(script);

  const script2 = document.createElement('script');
  script2.src = './features/ignore.js';
  script2.onload = () => {
    initializeFeature('ignore', window.initializeIgnoreList);
  };
  document.head.appendChild(script2);

  const script3 = document.createElement('script');
  script3.src = './features/inventory.js';
  script3.onload = () => {
    initializeFeature('inventory', window.initializeInventory);
  };
  document.head.appendChild(script3);

  const script4 = document.createElement('script');
  script4.src = './features/logout.js';
  script4.onload = () => {
    initializeFeature('logout', window.initializeLogout);
  };
  document.head.appendChild(script4);

  const script5 = document.createElement('script');
  script5.src = './features/gameOptions.js';
  script5.onload = () => {
    initializeFeature('gameOptions', window.initializeGameOptions);
  };
  document.head.appendChild(script5);

  const script6 = document.createElement('script');
  script6.src = './features/questJournal.js';
  script6.onload = () => {
    initializeFeature('questJournal', window.initializeQuestJournal);
  };
  document.head.appendChild(script6);

  const script7 = document.createElement('script');
  script7.src = './features/skillsMenu.js';
  script7.onload = () => {
    initializeFeature('skillsMenu', window.initializeSkillsMenu);
  };
  document.head.appendChild(script7);

  const script8 = document.createElement('script');
  script8.src = './features/musicMenu.js';
  script8.onload = () => {
    initializeFeature('musicMenu', window.initializeMusicMenu);
  };
  document.head.appendChild(script8);

  const script9 = document.createElement('script');
  script9.src = './features/spellbook.js';
  script9.onload = () => {
    initializeFeature('spellbook', window.initializeSpellbook);
  };
  document.head.appendChild(script9);

  const script10 = document.createElement('script');
  script10.src = './features/compass.js';
  script10.onload = () => {
    initializeFeature('compass', window.initializeCompass);
  };
  document.head.appendChild(script10);

  const script11 = document.createElement('script');
  script11.src = './features/worlds.js';
  script11.onload = () => {
    initializeFeature('worlds', window.initializeWorlds);
  };
  document.head.appendChild(script11);

  const checkFeatures = setInterval(() => {
    if (Object.values(featuresLoaded).every(loaded => loaded)) {
      clearInterval(checkFeatures);
      
      if (typeof window.initializeFriendsList === 'function') window.initializeFriendsList();
      if (typeof window.initializeIgnoreList === 'function') window.initializeIgnoreList();
      if (typeof window.initializeInventory === 'function') window.initializeInventory();
      if (typeof window.initializeLogout === 'function') window.initializeLogout();
      if (typeof window.initializeGameOptions === 'function') window.initializeGameOptions();
      if (typeof window.initializeQuestJournal === 'function') window.initializeQuestJournal();
      if (typeof window.initializeSkillsMenu === 'function') window.initializeSkillsMenu();
      if (typeof window.initializeMusicMenu === 'function') window.initializeMusicMenu();
      if (typeof window.initializeSpellbook === 'function') window.initializeSpellbook();
      if (typeof window.initializeCompass === 'function') window.initializeCompass();
      if (typeof window.initializeWorlds === 'function') window.initializeWorlds();

      const defaultButton = document.querySelector('.bottom-icon:nth-child(4)');
      defaultButton.click();
    }
  }, 100);

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.context-menu') && !e.target.closest('.player-name')) {
      window.hideContextMenu();
    }
  });

  document.addEventListener('scroll', window.hideContextMenu);

  document.addEventListener('contextmenu', (e) => {
    if (window.mouseMode === "Two") {
      e.preventDefault(); 
    }
  });
});
