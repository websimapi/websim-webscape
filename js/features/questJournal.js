import { toggleMenu } from './menuManager.js';

function initializeQuestJournal() {
  const questButton = document.querySelector('.icon.quest');
  const questJournal = document.getElementById('quest-journal');

  questButton.addEventListener('click', () => {
    toggleMenu(questButton, '#quest-journal');
  });

  // Populate quest list with placeholder quests
  const questList = [
    { category: 'FREE QUESTS:', quests: [
      "Village Mystery",
      "Mountain Path",
      "Forest Guardian",
      "Lost Treasure",
      "Cave Explorer",
      "River Journey",
      "Ancient Secrets"
    ]},
    { category: 'MEMBERS QUESTS:', quests: [
      "Dragon's Call",
      "Shadow Temple",
      "Desert Storm",
      "Ice Mountain",
      "Dark Forces",
      "Ocean's Deep"
    ]}
  ];

  const journalContent = questJournal.querySelector('.quest-journal-content');
  
  // First clear any existing content
  journalContent.innerHTML = '';
  
  questList.forEach(section => {
    const categoryHeader = document.createElement('div');
    categoryHeader.className = 'quest-category';
    categoryHeader.textContent = section.category;
    journalContent.appendChild(categoryHeader);

    section.quests.forEach(quest => {
      const questEntry = document.createElement('div');
      questEntry.className = 'quest-entry';
      questEntry.textContent = quest;
      journalContent.appendChild(questEntry);
    });
  });
}

export { initializeQuestJournal };