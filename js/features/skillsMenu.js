import { toggleMenu } from './menuManager.js';

// Initialize WebSocket connection
const room = new WebsimSocket();

// Initialize skills data with 21 skills in the specified order and add XP info
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
  { name: 'Cooking', level: 1, maxLevel: 1, icon: '🍳', xp: 0, nextLevel: 83 },
  { name: 'Prayer', level: 1, maxLevel: 1, icon: '✨', xp: 0, nextLevel: 83 },
  { name: 'Artisan', level: 1, maxLevel: 1, icon: '✂️', xp: 0, nextLevel: 83 },
  { name: 'Firemaking', level: 1, maxLevel: 1, icon: '🔥', xp: 0, nextLevel: 83 },
  { name: 'Eldritch', level: 1, maxLevel: 1, icon: '🔮', xp: 0, nextLevel: 83 },
  { name: 'Fletching', level: 1, maxLevel: 1, icon: '🔪', xp: 0, nextLevel: 83 },
  { name: 'Woodcutting', level: 1, maxLevel: 1, icon: '🪓', xp: 0, nextLevel: 83 },
  { name: 'Runecrafting', level: 1, maxLevel: 1, icon: '🔯', xp: 0, nextLevel: 83 },
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
  
  // Clear any existing content
  skillsContainer.innerHTML = '';
  
  // Create skill slots with hover functionality
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
    
    // When hovering over a skill, show its XP details with a carriage return between lines.
    skillSlot.addEventListener('mouseover', () => {
      const statsContainer = skillsMenu.querySelector('.stats-summary');
      if (statsContainer) {
        statsContainer.innerHTML = `
          <div class="stats-item hover-state">${skill.name} XP: ${skill.xp}<br>Next Level: ${skill.nextLevel}</div>
        `;
      }
    });

    // Restore the default stats view on mouseout so non-hover state remains unaffected.
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

  // Calculate total level for default view.
  const totalLevel = skills.reduce((sum, skill) => sum + skill.level, 0);

  // Update the default stats summary.
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