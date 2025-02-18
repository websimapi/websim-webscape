import { toggleMenu } from './menuManager.js';

// Initialize WebSocket connection
const room = new WebsimSocket();

// Initialize skills data with 21 skills in the specified order and add XP info
const skills = [
  { name: 'Attack', level: 1, maxLevel: 1, icon: '⚔️', xp: 0, nextLevel: 83 },
  { name: 'Hitpoints', level: 10, maxLevel: 10, icon: '❤️', xp: 1154, nextLevel: 1358 },
  { name: 'Mining', level: 1, maxLevel: 1, icon: '⛏️', xp: 0, nextLevel: 83 },
  { name: 'Strength', level: 1, maxLevel: 1, icon: '💪', xp: 0, nextLevel: 83 },
  { name: 'Agility', level: 1, maxLevel: 1, icon: '🏃', xp: 0, nextLevel: 83, style: 'filter: grayscale(100%) brightness(0.3); -webkit-text-stroke: 1px black;' },
  { name: 'Smithing', level: 1, maxLevel: 1, icon: '⚒️', xp: 0, nextLevel: 83 },
  { name: 'Defence', level: 1, maxLevel: 1, icon: '🛡️', xp: 0, nextLevel: 83 },
  { name: 'Herblore', level: 1, maxLevel: 1, icon: '🌿', xp: 0, nextLevel: 83 },
  { name: 'Fishing', level: 1, maxLevel: 1, icon: '🎣', xp: 0, nextLevel: 83 },
  { name: 'Ranged', level: 1, maxLevel: 1, icon: '🏹', xp: 0, nextLevel: 83 },
  { name: 'Thieving', level: 1, maxLevel: 1, icon: '👥', xp: 0, nextLevel: 83, style: 'filter: grayscale(100%) brightness(0.3); -webkit-text-stroke: 1px black;' },
  { name: 'Cooking', level: 1, maxLevel: 1, icon: '🍳', xp: 0, nextLevel: 83 },
  { name: 'Prayer', level: 1, maxLevel: 1, icon: '✨', xp: 0, nextLevel: 83 },
  { name: 'Crafting', level: 1, maxLevel: 1, icon: '✂️', xp: 0, nextLevel: 83 },
  { name: 'Firemaking', level: 1, maxLevel: 1, icon: '🔥', xp: 0, nextLevel: 83 },
  { name: 'Magic', level: 1, maxLevel: 1, icon: '🔮', xp: 0, nextLevel: 83 },
  { name: 'Fletching', level: 1, maxLevel: 1, icon: '🔪', xp: 0, nextLevel: 83 },
  { name: 'Woodcutting', level: 1, maxLevel: 1, icon: '🪓', xp: 0, nextLevel: 83 },
  { name: 'Runecrafting', level: 1, maxLevel: 1, icon: '🔯', xp: 0, nextLevel: 83 },
  { name: 'Slayer', level: 1, maxLevel: 1, icon: '💀', xp: 0, nextLevel: 83 },
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
    
    // Update mouseover event
    skillSlot.addEventListener('mouseover', () => {
      const statsContainer = skillsMenu.querySelector('.stats-summary');
      if (statsContainer) {
        statsContainer.innerHTML = `
          <div class="stats-item">${skill.name}</div>
          <div class="stats-item">XP: ${skill.xp}</div>
          <div class="stats-item">Next Level: ${skill.nextLevel}</div>
        `;
      }
    });

    // Update mouseout event
    skillSlot.addEventListener('mouseout', () => {
      const statsContainer = skillsMenu.querySelector('.stats-summary');
      if (statsContainer) {
        statsContainer.innerHTML = `
          <div class="stats-item">QP: 0</div>
          <div class="stats-item skill-stat">Combat: 1</div>
          <div class="stats-item skill-stat">Total: ${skills.reduce((sum, s) => sum + s.level, 0)}</div>
        `;
      }
    });

    skillsContainer.appendChild(skillSlot);
  });

  // Calculate total level
  const totalLevel = skills.reduce((sum, skill) => sum + skill.level, 0);

  // Update the stats summary
  const statsContainer = skillsMenu.querySelector('.stats-summary');
  if (statsContainer) {
    statsContainer.innerHTML = `
      <div class="stats-item">QP: 0</div>
      <div class="stats-item skill-stat">Combat: 1</div>
      <div class="stats-item skill-stat">Total: ${totalLevel}</div>
    `;
  }
}

export { initializeSkillsMenu };