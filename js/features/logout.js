function initializeLogout() {
  const logoutButton = document.querySelector('.bottom-icon:nth-child(4)');
  const logoutPopup = document.getElementById('logout-popup');
  const closeLogoutButtons = document.querySelectorAll('.logout-button');

  logoutButton.addEventListener('click', () => {
    if (logoutButton.classList.contains('selected')) {
      logoutButton.classList.remove('selected');
      logoutPopup.classList.add('hidden');
    } else {
      logoutButton.classList.add('selected');
      logoutPopup.classList.remove('hidden');
    }
  });

  closeLogoutButtons.forEach(button => {
    button.addEventListener('click', () => {
      logoutButton.classList.remove('selected');
      logoutPopup.classList.add('hidden');
    });
  });
}

export { initializeLogout };