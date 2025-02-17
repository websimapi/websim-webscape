// Create tooltip element
const tooltip = document.createElement('div');
tooltip.className = 'action-tooltip';
tooltip.style.display = 'none';
document.body.appendChild(tooltip);

// Add tooltip functionality to buttons and player names
function addTooltip(element, actionText, menuCount = 0) {
  element.addEventListener('mouseover', (e) => {
    tooltip.style.display = 'block';
    tooltip.textContent = menuCount ? `${actionText} / ${menuCount}` : actionText;
    
    // Position tooltip in top-left of game screen
    const gameScreen = document.getElementById('game-screen');
    const gameRect = gameScreen.getBoundingClientRect();
    tooltip.style.left = `${gameRect.left + 5}px`;
    tooltip.style.top = `${gameRect.top + 5}px`;
  });

  element.addEventListener('mouseout', () => {
    tooltip.style.display = 'none';
  });
}

export { addTooltip, tooltip };