function getUserInitial() {
  const userName = localStorage.getItem('userName') || 'U';
  return userName.charAt(0).toUpperCase();
}
function updateUserCircle() {
  const userCircle = document.getElementById('userCircle');
  const userName = localStorage.getItem('userName') || '';
  const userNameDisplay = document.getElementById('userNameDisplay');
  console.log('[NAVBAR] userName lido do localStorage:', userName);
  
  if (userCircle) {
    if (userName) {
      // SEMPRE buscar foto do banco de dados primeiro
      fetch(`/api/users/photo/${encodeURIComponent(userName)}`)
        .then(response => {
          if (!response.ok) {
            throw new Error('Usuário não encontrado');
          }
          return response.json();
        })
        .then(userData => {
          if (userData.foto_perfil) {
            // Atualizar localStorage e exibir foto
            localStorage.setItem('userPhoto', userData.foto_perfil);
            userCircle.innerHTML = `<img src="${userData.foto_perfil}" alt="Foto do usuário">`;
            console.log('[NAVBAR] Foto carregada do banco de dados');
          } else {
            // Se não há foto no banco, usar inicial
            localStorage.removeItem('userPhoto');
            userCircle.textContent = getUserInitial();
            console.log('[NAVBAR] Nenhuma foto no banco, usando inicial');
          }
        })
        .catch(error => {
          console.error('[NAVBAR] Erro ao buscar foto do usuário:', error);
          // Fallback para localStorage se disponível
          const userPhoto = localStorage.getItem('userPhoto');
          if (userPhoto) {
            userCircle.innerHTML = `<img src="${userPhoto}" alt="Foto do usuário">`;
            console.log('[NAVBAR] Usando foto do localStorage como fallback');
          } else {
            userCircle.textContent = getUserInitial();
            console.log('[NAVBAR] Usando inicial como fallback');
          }
        });
    } else {
      // Se não há userName, limpar tudo
      localStorage.removeItem('userPhoto');
      userCircle.textContent = getUserInitial();
      console.log('[NAVBAR] Nenhum usuário logado');
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
        const photoData = e.target.result;
        localStorage.setItem('userPhoto', photoData);
        updateUserCircle();
        
        // Sincronizar com o banco de dados
        const userName = localStorage.getItem('userName');
        const userId = localStorage.getItem('userId');
        
        if (userName && userId) {
          fetch(`/api/users/profile/${userId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              nome: userName,
              departamento: localStorage.getItem('userDepartment') || '',
              cargo_atual: localStorage.getItem('userPosition') || '',
              foto_perfil: photoData
            })
          })
          .then(response => response.json())
          .then(updatedUser => {
            console.log('[NAVBAR] Foto sincronizada com o banco:', updatedUser.foto_perfil ? 'Salva' : 'Não salva');
          })
          .catch(error => {
            console.error('[NAVBAR] Erro ao sincronizar foto:', error);
          });
        }
      };
      reader.readAsDataURL(file);
    }
  });
}
const logoutButton = document.getElementById('logoutButton');
if (logoutButton) {
  logoutButton.addEventListener('click', function(e) {
    e.preventDefault();
    
    // Remover apenas dados de sessão, manter foto como cache
    localStorage.removeItem('userName');
    localStorage.removeItem('userId');
    localStorage.removeItem('tipo_usuario');
    localStorage.removeItem('userDepartment');
    localStorage.removeItem('userPosition');
    
    // NÃO remover userPhoto - manter como cache
    console.log('[NAVBAR] Logoff: dados de sessão removidos, foto mantida como cache');
    window.location.href = '/login.html';
  });
}

// Função para limpar cache de fotos (usar apenas quando necessário)
function clearPhotoCache() {
  localStorage.removeItem('userPhoto');
  console.log('[NAVBAR] Cache de foto limpo');
}

// Função para forçar recarregamento da foto do banco
function forceReloadPhoto() {
  localStorage.removeItem('userPhoto');
  updateUserCircle();
  console.log('[NAVBAR] Foto recarregada do banco de dados');
}

// Expor funções para debugging
window.navbarDebug = {
  clearPhotoCache,
  forceReloadPhoto,
  updateUserCircle
};

updateUserCircle(); 