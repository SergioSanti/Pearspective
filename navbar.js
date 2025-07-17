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
            userCircle.innerHTML = `<img src="${user.foto_perfil}" alt="Foto do usuário">`;
            console.log('[NAVBAR] Foto carregada do banco de dados');
          } else {
            userCircle.textContent = getUserInitial(user.nome);
            console.log('[NAVBAR] Nenhuma foto no banco, usando inicial');
          }
          
          // Nome de exibição
          if (userNameDisplay) {
            userNameDisplay.textContent = user.nome;
          }
        }
      } else {
        console.log('[NAVBAR] Sessão inválida ou expirada');
        
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
      
      userCircle.textContent = getUserInitial();
      console.log('[NAVBAR] Erro na verificação de sessão');
      
      if (userNameDisplay) {
        userNameDisplay.textContent = '';
      }
      
      // Redirecionar para login se não estiver na página de login
      if (!window.location.pathname.includes('login.html')) {
        console.log('[NAVBAR] Redirecionando para login devido a erro...');
        window.location.href = '/login.html';
      }
    }
  }
}
const photoUpload = document.getElementById('photoUpload');
if (photoUpload) {
  photoUpload.addEventListener('change', async function(e) {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async function(e) {
        const photoData = e.target.result;
        
        try {
          // Primeiro, obter dados da sessão atual
          const sessionResponse = await fetch('/api/me', {
            credentials: 'include'
          });
          
          if (sessionResponse.ok) {
            const sessionData = await sessionResponse.json();
            
            if (sessionData.authenticated && sessionData.user) {
              // Atualizar foto no banco de dados
              const updateResponse = await fetch(`/api/users/profile/${sessionData.user.id}`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                  foto_perfil: photoData
                })
              });
              
              if (updateResponse.ok) {
                console.log('[NAVBAR] Foto atualizada com sucesso');
                // Recarregar sessão para mostrar nova foto
                updateUserCircle();
              } else {
                console.error('[NAVBAR] Erro ao atualizar foto no banco');
              }
            }
          } else {
            console.error('[NAVBAR] Sessão inválida para upload de foto');
          }
        } catch (error) {
          console.error('[NAVBAR] Erro ao processar upload de foto:', error);
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
      console.log('[NAVBAR] Logout realizado com sucesso');
    } catch (error) {
      console.error('[NAVBAR] Erro ao fazer logout:', error);
    }
    
    // Redirecionar para login
    window.location.href = '/login.html';
  });
}

// Função para forçar recarregamento da sessão
function forceReloadSession() {
  updateUserCircle();
  console.log('[NAVBAR] Sessão recarregada');
}

// Expor funções para debugging
window.navbarDebug = {
  forceReloadSession,
  updateUserCircle
};

updateUserCircle(); 