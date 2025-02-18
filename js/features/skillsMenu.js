import { toggleMenu } from './menuManager.js';

function initializeSkillsMenu() {
  const statsButton = document.querySelector('.icon.stats');
  const skillsMenu = document.getElementById('skills-menu');

  statsButton.addEventListener('click', () => {
    toggleMenu(statsButton, '#skills-menu');
  });
}

export { initializeSkillsMenu };