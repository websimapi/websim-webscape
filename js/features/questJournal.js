import { toggleMenu } from './menuManager.js';

function initializeQuestJournal() {
  const questButton = document.querySelector('.icon.quest');
  const questJournal = document.querySelector('.quest-journal');

  // Setup quest journal toggle
  questButton.addEventListener('click', () => {
    toggleMenu(questButton, '.quest-journal');
  });
}

export { initializeQuestJournal };