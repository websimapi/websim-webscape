document.addEventListener('DOMContentLoaded', () => {
  const chestIcon = document.querySelector('.icon.chest');
  const inventoryContainer = document.getElementById('inventory');

  if (chestIcon && inventoryContainer) {
    chestIcon.addEventListener('click', () => {
      if (chestIcon.classList.contains('selected')) {
        chestIcon.classList.remove('selected');
        inventoryContainer.classList.add('hidden');
      } else {
        chestIcon.classList.add('selected');
        inventoryContainer.classList.remove('hidden');
      }
    });
  }
});