function getUserInitial(userName = 'U') {
  return userName.charAt(0).toUpperCase();
}

async function updateUserCircle() {
  const userCircle = document.getElementById('userCircle');
  const userNameDisplay = document.getElementById('userNameDisplay');
  
  console.log('[NAVBAR] Verificando sessão atual...');
  
  if (userCircle) {
    try {
      // Buscar dados do banco do Railway
      const response = await fetch('/api/me', {
        credentials: 'include' // Incluir cookies
      });
      
      if (response.ok) {
        const sessionData = await response.json();
        console.log('[NAVBAR] Sessão válida:', sessionData.user.nome);
        
        if (sessionData.authenticated && sessionData.user) {
          const user = sessionData.user;
          console.log('[NAVBAR] Dados do usuário recebidos:', user);
          
          // Foto
          console.log('[NAVBAR] Verificando foto do usuário:', {
            temFoto: !!user.foto_perfil,
            fotoLength: user.foto_perfil ? user.foto_perfil.length : 0,
            fotoPreview: user.foto_perfil ? user.foto_perfil.substring(0, 50) + '...' : 'null'
          });
          
          if (user.foto_perfil) {
            userCircle.innerHTML = `<img src="${user.foto_perfil}" alt="Foto do usuário">`;
            console.log('[NAVBAR] Foto carregada do banco de dados');
          } else {
            userCircle.textContent = getUserInitial(user.nome);
            console.log('[NAVBAR] Nenhuma foto no banco, usando inicial');
          }
          
          // Nome de exibição
          if (userNameDisplay) {
            // Usar nome_exibicao se disponível, senão usar nome
            const displayName = user.nome_exibicao || user.nome;
            userNameDisplay.textContent = displayName;
            console.log('[NAVBAR] Nome de exibição definido:', displayName);
          }
        } else {
          console.error('[NAVBAR] Dados de sessão inválidos:', sessionData);
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
      console.log('[NAVBAR] Arquivo selecionado:', file.name, file.size, file.type);
      
      const reader = new FileReader();
      reader.onload = async function(e) {
        const photoData = e.target.result;
        console.log('[NAVBAR] Arquivo convertido, tamanho:', photoData.length);
        
        try {
          // Buscar nome do usuário da sessão atual
          console.log('[NAVBAR] Buscando sessão para upload...');
          const sessionResponse = await fetch('/api/me', {
            credentials: 'include'
          });
          
          console.log('[NAVBAR] Status da resposta da sessão:', sessionResponse.status);
          
          if (!sessionResponse.ok) {
            console.error('[NAVBAR] Sessão inválida para upload');
            return;
          }
          
          const sessionData = await sessionResponse.json();
          console.log('[NAVBAR] Dados da sessão recebidos:', sessionData);
          
          if (!sessionData.authenticated || !sessionData.user) {
            console.error('[NAVBAR] Sessão inválida para upload:', sessionData);
            return;
          }
          
          const userName = sessionData.user.nome;
          console.log('[NAVBAR] Nome do usuário extraído:', userName);
          
          if (!userName) {
            console.error('[NAVBAR] Nome do usuário não encontrado na sessão');
            console.error('[NAVBAR] Estrutura da sessão:', JSON.stringify(sessionData, null, 2));
            return;
          }
          
          console.log('[NAVBAR] Iniciando upload para usuário:', userName);
          
          // Atualizar foto usando a rota específica
          const updateResponse = await fetch(`/api/users/photo/${encodeURIComponent(userName)}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              foto_perfil: photoData
            })
          });
          
          console.log('[NAVBAR] Status da resposta do upload:', updateResponse.status);
          
          if (updateResponse.ok) {
            console.log('[NAVBAR] Foto atualizada com sucesso');
            // Atualizar interface
            updateUserCircle();
          } else {
            const errorData = await updateResponse.json();
            console.error('[NAVBAR] Erro ao atualizar foto:', errorData);
          }
        } catch (error) {
          console.error('[NAVBAR] Erro ao processar upload de foto:', error);
          console.error('[NAVBAR] Stack trace:', error.stack);
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