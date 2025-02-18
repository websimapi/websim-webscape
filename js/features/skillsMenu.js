import { toggleMenu } from './menuManager.js';

function initializeSkillsMenu() {
  const skillsButton = document.querySelector('.icon.skills');
  const skillsMenu = document.getElementById('skills-menu');

  skillsButton.addEventListener('click', () => {
    toggleMenu(skillsButton, '#skills-menu');
  });

  // Initialize skills data with 21 skills in the specified order
  const skills = [
    { name: 'Attack', level: 1, maxLevel: 1, icon: '⚔️' },
    { name: 'Hitpoints', level: 10, maxLevel: 10, icon: '❤️' },
    { name: 'Mining', level: 1, maxLevel: 1, icon: '⛏️' },
    { name: 'Strength', level: 1, maxLevel: 1, icon: '💪' },
    { name: 'Agility', level: 1, maxLevel: 1, icon: '🏃' },
    { name: 'Smithing', level: 1, maxLevel: 1, icon: '⚒️' },
    { name: 'Defence', level: 1, maxLevel: 1, icon: '🛡️' },
    { name: 'Herblore', level: 1, maxLevel: 1, icon: '🌿' },
    { name: 'Fishing', level: 1, maxLevel: 1, icon: '🎣' },
    { name: 'Ranged', level: 1, maxLevel: 1, icon: '🏹' },
    { name: 'Thieving', level: 1, maxLevel: 1, icon: '👥' },
    { name: 'Cooking', level: 1, maxLevel: 1, icon: '🍳' },
    { name: 'Prayer', level: 1, maxLevel: 1, icon: '✨' },
    { name: 'Crafting', level: 1, maxLevel: 1, icon: '✂️' },
    { name: 'Firemaking', level: 1, maxLevel: 1, icon: '🔥' },
    { name: 'Magic', level: 1, maxLevel: 1, icon: '🔮' },
    { name: 'Fletching', level: 1, maxLevel: 1, icon: '🔪\n🪵' }, 
    { name: 'Woodcutting', level: 1, maxLevel: 1, icon: '🪓' },
    { name: 'Runecrafting', level: 1, maxLevel: 1, icon: '🔯' },
    { name: 'Slayer', level: 1, maxLevel: 1, icon: '💀' },
    { name: 'Farming', level: 1, maxLevel: 1, icon: '🌱' }
  ];

  const skillsContainer = skillsMenu.querySelector('.skills-grid');
  
  // Clear any existing content
  skillsContainer.innerHTML = '';
  
  // Create skill slots
  skills.forEach(skill => {
    const skillSlot = document.createElement('div');
    skillSlot.className = 'skill-slot';
    skillSlot.innerHTML = `
      <div class="skill-icon">${skill.icon}</div>
      <div class="skill-level">${skill.level}/${skill.maxLevel}</div>
    `;
    skillSlot.title = skill.name; 
    skillsContainer.appendChild(skillSlot);
  });

  // Calculate total level
  const totalLevel = skills.reduce((sum, skill) => sum + skill.level, 0);
  const questPoints = 0; 

  // Update the stats summary with new format
  const statsContainer = skillsMenu.querySelector('.stats-summary');
  if (statsContainer) {
    statsContainer.innerHTML = `
      <div class="stats-item">QP: ${questPoints}</div>
      <div class="stats-item">Combat: 1</div>
      <div class="stats-item">Total: ${totalLevel}</div>
    `;
  }
}

export { initializeSkillsMenu };