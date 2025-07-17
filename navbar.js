function getUserInitial(userName = 'U') {
  return userName.charAt(0).toUpperCase();
}

async function updateUserCircle() {
  const userCircle = document.getElementById('userCircle');
  const userNameDisplay = document.getElementById('userNameDisplay');
  
  console.log('[NAVBAR] Verificando sessão atual...');
  
  if (userCircle) {
    try {
      // Verificar sessão atual via API
      const response = await fetch('/api/me', {
        credentials: 'include' // Incluir cookies
      });
      
      if (response.ok) {
        const sessionData = await response.json();
        console.log('[NAVBAR] Sessão válida:', sessionData.user.nome);
        
        if (sessionData.authenticated && sessionData.user) {
          const user = sessionData.user;
          
          // Foto
          if (user.foto_perfil) {
            localStorage.setItem('userPhoto', user.foto_perfil);
            userCircle.innerHTML = `<img src="${user.foto_perfil}" alt="Foto do usuário">`;
            console.log('[NAVBAR] Foto carregada do banco de dados');
          } else {
            localStorage.removeItem('userPhoto');
            userCircle.textContent = getUserInitial(user.nome);
            console.log('[NAVBAR] Nenhuma foto no banco, usando inicial');
          }
          
          // Nome de exibição
          if (userNameDisplay) {
            userNameDisplay.textContent = user.nome;
          }
          
          // Atualizar localStorage com dados da sessão
          localStorage.setItem('userName', user.nome);
          localStorage.setItem('userId', user.id);
          localStorage.setItem('tipo_usuario', user.tipo_usuario);
        }
      } else {
        console.log('[NAVBAR] Sessão inválida ou expirada');
        // Limpar dados de sessão
        localStorage.removeItem('userName');
        localStorage.removeItem('userId');
        localStorage.removeItem('tipo_usuario');
        localStorage.removeItem('userPhoto');
        
        userCircle.textContent = getUserInitial();
        if (userNameDisplay) userNameDisplay.textContent = '';
        
        // Redirecionar para login se não estiver na página de login
        if (!window.location.pathname.includes('login.html')) {
          console.log('[NAVBAR] Redirecionando para login...');
          window.location.href = '/login.html';
        }
      }
    } catch (error) {
      console.error('[NAVBAR] Erro ao verificar sessão:', error);
      
      // Fallback para localStorage se disponível
      const userName = localStorage.getItem('userName');
      const userPhoto = localStorage.getItem('userPhoto');
      
      if (userName && userPhoto) {
        userCircle.innerHTML = `<img src="${userPhoto}" alt="Foto do usuário">`;
        console.log('[NAVBAR] Usando foto do localStorage como fallback');
      } else if (userName) {
        userCircle.textContent = getUserInitial(userName);
        console.log('[NAVBAR] Usando inicial como fallback');
      } else {
        userCircle.textContent = getUserInitial();
        console.log('[NAVBAR] Nenhum usuário logado');
      }
      
      if (userNameDisplay) {
        userNameDisplay.textContent = userName || '';
      }
    }
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
  logoutButton.addEventListener('click', async function(e) {
    e.preventDefault();
    
    try {
      // Chamar API para fazer logout (limpar cookie)
      await fetch('/api/logout', {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.error('[NAVBAR] Erro ao fazer logout:', error);
    }
    
    // Limpar dados locais
    localStorage.removeItem('userName');
    localStorage.removeItem('userId');
    localStorage.removeItem('tipo_usuario');
    localStorage.removeItem('userDepartment');
    localStorage.removeItem('userPosition');
    localStorage.removeItem('userPhoto');
    
    console.log('[NAVBAR] Logoff: dados de sessão removidos');
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