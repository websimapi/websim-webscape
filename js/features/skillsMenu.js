import { toggleMenu } from './menuManager.js';

function initializeSkillsMenu() {
  const skillsButton = document.querySelector('.icon.stats');
  const skillsContainer = document.getElementById('skills-menu');

  skillsButton.addEventListener('click', () => {
    toggleMenu(skillsButton, '#skills-menu');
  });
}

export { initializeSkillsMenu };