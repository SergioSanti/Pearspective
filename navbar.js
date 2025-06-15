function getUserInitial() {
  const userName = localStorage.getItem('userName') || 'U';
  return userName.charAt(0).toUpperCase();
}
function updateUserCircle() {
  const userCircle = document.getElementById('userCircle');
  const userPhoto = localStorage.getItem('userPhoto');
  const userName = localStorage.getItem('userName') || '';
  const userNameDisplay = document.getElementById('userNameDisplay');
  console.log('[NAVBAR] userName lido do localStorage:', userName);
  if (userCircle) {
    if (userPhoto) {
      userCircle.innerHTML = `<img src="${userPhoto}" alt="Foto do usuário">`;
    } else {
      userCircle.textContent = getUserInitial();
    }
  }
  if (userNameDisplay) {
    userNameDisplay.textContent = userName;
  }
}
const photoUpload = document.getElementById('photoUpload');
if (photoUpload) {
  photoUpload.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function(e) {
        localStorage.setItem('userPhoto', e.target.result);
        updateUserCircle();
      };
      reader.readAsDataURL(file);
    }
  });
}
const logoutButton = document.getElementById('logoutButton');
if (logoutButton) {
  logoutButton.addEventListener('click', function(e) {
    e.preventDefault();
    localStorage.removeItem('userName');
    localStorage.removeItem('userPhoto');
    localStorage.removeItem('userId');
    console.log('[NAVBAR] Logoff: localStorage após remoção:', localStorage.getItem('userName'));
    window.location.href = '/login.html';
  });
}
updateUserCircle(); 