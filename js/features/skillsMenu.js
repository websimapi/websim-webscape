import { toggleMenu } from './menuManager.js';

function initializeSkillsMenu() {
  const skillsButton = document.querySelector('.icon.skills');
  const skillsMenu = document.getElementById('skills-menu');

  skillsButton.addEventListener('click', () => {
    toggleMenu(skillsButton, '#skills-menu');
  });

  // Initialize skills data with 21 skills
  const skills = [
    { name: 'Attack', level: 1, maxLevel: 1, icon: '⚔️' },
    { name: 'Defense', level: 1, maxLevel: 1, icon: '🛡️' },
    { name: 'Strength', level: 1, maxLevel: 1, icon: '💪' },
    { name: 'Hitpoints', level: 10, maxLevel: 10, icon: '❤️' },
    { name: 'Ranged', level: 1, maxLevel: 1, icon: '🏹' },
    { name: 'Prayer', level: 1, maxLevel: 1, icon: '✨' },
    { name: 'Magic', level: 1, maxLevel: 1, icon: '🔮' },
    { name: 'Cooking', level: 1, maxLevel: 1, icon: '🍳' },
    { name: 'Woodcutting', level: 1, maxLevel: 1, icon: '🪓' },
    { name: 'Fletching', level: 1, maxLevel: 1, icon: '🏃' },
    { name: 'Fishing', level: 1, maxLevel: 1, icon: '🎣' },
    { name: 'Firemaking', level: 1, maxLevel: 1, icon: '🔥' },
    { name: 'Crafting', level: 1, maxLevel: 1, icon: '✂️' },
    { name: 'Smithing', level: 1, maxLevel: 1, icon: '⚒️' },
    { name: 'Mining', level: 1, maxLevel: 1, icon: '⛏️' },
    { name: 'Herblore', level: 1, maxLevel: 1, icon: '🌿' },
    { name: 'Agility', level: 1, maxLevel: 1, icon: '🏃' },
    { name: 'Thieving', level: 1, maxLevel: 1, icon: '👥' },
    { name: 'Slayer', level: 1, maxLevel: 1, icon: '💀' },
    { name: 'Farming', level: 1, maxLevel: 1, icon: '🌱' },
    { name: 'Runecrafting', level: 1, maxLevel: 1, icon: '🔯' }
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
    skillSlot.title = skill.name; // Add tooltip showing skill name
    skillsContainer.appendChild(skillSlot);
  });

  // Calculate total level and combat level
  const totalLevel = skills.reduce((sum, skill) => sum + skill.level, 0);
  const questPoints = 0; // This would normally be calculated based on completed quests

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

function calculateCombatLevel(skills) {
  // Get base skill levels
  const attack = skills.find(s => s.name === 'Attack').level;
  const strength = skills.find(s => s.name === 'Strength').level;
  const defense = skills.find(s => s.name === 'Defense').level;
  const hitpoints = skills.find(s => s.name === 'Hitpoints').level;
  const prayer = skills.find(s => s.name === 'Prayer').level;
  const ranged = skills.find(s => s.name === 'Ranged').level;
  const magic = skills.find(s => s.name === 'Magic').level;

  // Calculate base combat level using the RuneScape formula
  const base = 0.25 * (defense + hitpoints + Math.floor(prayer/2));
  const melee = 0.325 * (attack + strength);
  const range = 0.325 * (Math.floor(ranged * 3/2));
  const mage = 0.325 * (Math.floor(magic * 3/2));
  
  // Return the highest of the three combat types plus base
  return Math.floor(base + Math.max(melee, range, mage));
}

export { initializeSkillsMenu };