import { toggleMenu } from './menuManager.js';

function initializeGameOptions() {
  const wrenchButton = document.querySelector('.bottom-icon.wrench-icon');
  
  wrenchButton.addEventListener('click', () => {
    toggleMenu(wrenchButton, '.game-options');
  });

  // Handle option button clicks
  const optionButtons = document.querySelectorAll('.option-button');
  optionButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      // Remove selected class from siblings
      const siblings = e.target.parentElement.querySelectorAll('.option-button');
      siblings.forEach(sibling => sibling.classList.remove('selected'));
      // Add selected class to clicked button
      e.target.classList.add('selected');
    });
  });
}

export { initializeGameOptions };