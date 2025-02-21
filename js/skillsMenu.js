import { toggleMenu } from './menuManager.js';
import { room } from '../room.js';

const skills = [
  { name: 'Duelist', level: 1, maxLevel: 1, icon: '⚔️', xp: 0, nextLevel: 83 },
  { name: 'Spirit', level: 10, maxLevel: 10, icon: '❤️', xp: 1154, nextLevel: 1358, style: 'filter: hue-rotate(190deg) saturate(0.5) brightness(1.5);' },
  { name: 'Mining', level: 1, maxLevel: 1, icon: '⛏️', xp: 0, nextLevel: 83 },
  { name: 'Might', level: 1, maxLevel: 1, icon: '💪', xp: 0, nextLevel: 83 },
  { name: 'Phasewalk', level: 1, maxLevel: 1, icon: '🏃', xp: 0, nextLevel: 83, style: 'filter: grayscale(100%) brightness(0.3); -webkit-text-stroke: 1px black;' },
  { name: 'Smithing', level: 1, maxLevel: 1, icon: '⚒️', xp: 0, nextLevel: 83 },
  { name: 'Aegis', level: 1, maxLevel: 1, icon: '🛡️', xp: 0, nextLevel: 83 },
  { name: 'Herbalist', level: 1, maxLevel: 1, icon: '🌿', xp: 0, nextLevel: 83, style: 'filter: sepia(100%) saturate(300%) brightness(1.2) hue-rotate(20deg);' },
  { name: 'Fishing', level: 1, maxLevel: 1, icon: '🎣', xp: 0, nextLevel: 83 },
  { name: 'Swiftshot', level: 1, maxLevel: 1, icon: '🏹', xp: 0, nextLevel: 83 },
  { name: 'Detective', level: 1, maxLevel: 1, icon: '👥', xp: 0, nextLevel: 83, style: 'filter: grayscale(100%) brightness(0.3); -webkit-text-stroke: 1px black;' },
  { name: 'Umami', level: 1, maxLevel: 1, icon: '🍳', xp: 0, nextLevel: 83 },
  { name: 'Sentience', level: 1, maxLevel: 1, icon: '✨', xp: 0, nextLevel: 83 },
  { name: 'Artisan', level: 1, maxLevel: 1, icon: '💎', xp: 0, nextLevel: 83 },
  { name: 'Pyro', level: 1, maxLevel: 1, icon: '🔥', xp: 0, nextLevel: 83 },
  { name: 'Eldritch', level: 1, maxLevel: 1, icon: '🔮', xp: 0, nextLevel: 83 },
  { name: 'Fletching', level: 1, maxLevel: 1, icon: '🔪', xp: 0, nextLevel: 83 },
  { name: 'Lumberjack', level: 1, maxLevel: 1, icon: '🪓', xp: 0, nextLevel: 83 },
  { name: 'Sacrament', level: 1, maxLevel: 1, icon: '🔯', xp: 0, nextLevel: 83 },
  { name: 'Deathbind', level: 1, maxLevel: 1, icon: '💀', xp: 0, nextLevel: 83 },
  { name: 'Farming', level: 1, maxLevel: 1, icon: '🌱', xp: 0, nextLevel: 83 }
];

function initializeSkillsMenu() {
  const skillsButton = document.querySelector('.icon.skills');
  const skillsMenu = document.getElementById('skills-menu');

  skillsButton.addEventListener('click', () => {
    toggleMenu(skillsButton, '#skills-menu');
  });

  const skillsContainer = skillsMenu.querySelector('.skills-grid');
  skillsContainer.innerHTML = '';
  
  skills.forEach(skill => {
    const skillSlot = document.createElement('div');
    skillSlot.className = 'skill-slot';
    skillSlot.innerHTML = `
      <div class="skill-icon" ${skill.style ? `style="${skill.style}"` : ''}>${skill.icon}</div>
      <div class="skill-level">
        <span class="skill-level-numerator">${skill.level}</span>
        <span class="skill-level-slash">/</span>
        <span class="skill-level-denominator">${skill.maxLevel}</span>
      </div>
    `;
    
    skillSlot.addEventListener('mouseover', () => {
      const statsContainer = skillsMenu.querySelector('.stats-summary');
      if (statsContainer) {
        statsContainer.innerHTML = `
          <div class="stats-item hover-state">${skill.name} XP: ${skill.xp}<br>Next Level: ${skill.nextLevel}</div>
        `;
      }
    });

    skillSlot.addEventListener('mouseout', () => {
      const statsContainer = skillsMenu.querySelector('.stats-summary');
      if (statsContainer) {
        statsContainer.innerHTML = `
          <div class="stats-item">QP: 0</div>
          <div class="stats-item">Combat: 1</div>
          <div class="stats-item">Total: ${skills.reduce((sum, s) => sum + s.level, 0)}</div>
        `;
      }
    });

    skillsContainer.appendChild(skillSlot);
  });

  const totalLevel = skills.reduce((sum, skill) => sum + skill.level, 0);
  const statsContainer = skillsMenu.querySelector('.stats-summary');
  if (statsContainer) {
    statsContainer.innerHTML = `
      <div class="stats-item">QP: 0</div>
      <div class="stats-item">Combat: 1</div>
      <div class="stats-item">Total: ${totalLevel}</div>
    `;
  }
}

export { initializeSkillsMenu };