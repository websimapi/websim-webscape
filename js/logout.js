document.addEventListener('DOMContentLoaded', () => {
  // Add logout dialog HTML to the document
  const logoutDialogHTML = `
    <div class="logout-overlay"></div>
    <div class="logout-dialog">
      <div class="logout-message">
        When you have finished playing<br>
        Webscape, always use the<br>
        button below to logout safely.
      </div>
      <button class="logout-button">Click here to logout</button>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', logoutDialogHTML);

  // Get DOM elements
  const logoutButton = document.querySelector('.bottom-icon:nth-child(4)');
  const logoutDialog = document.querySelector('.logout-dialog');
  const logoutOverlay = document.querySelector('.logout-overlay');
  const confirmLogoutButton = document.querySelector('.logout-button');
  const inventoryContainer = document.getElementById('inventory');

  // Show logout dialog when logout button is clicked
  logoutButton.addEventListener('click', () => {
    logoutDialog.style.display = 'block';
    logoutOverlay.style.display = 'block';
    // Hide inventory when showing logout dialog
    if (inventoryContainer) {
      inventoryContainer.classList.add('hidden');
    }
  });

  // Handle logout confirmation
  confirmLogoutButton.addEventListener('click', () => {
    // Add actual logout logic here
    console.log('Logging out...');
    logoutDialog.style.display = 'none';
    logoutOverlay.style.display = 'none';
  });

  // Close dialog when clicking outside
  logoutOverlay.addEventListener('click', () => {
    logoutDialog.style.display = 'none';
    logoutOverlay.style.display = 'none';
  });
});