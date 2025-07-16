// Script de teste para verificar a sincronização das fotos de usuário
// Execute este script no console do navegador para testar

console.log('🧪 Teste de Sincronização de Fotos de Usuário');

// Função para testar o estado atual
function testCurrentState() {
  console.log('\n📊 Estado Atual:');
  console.log('userName:', localStorage.getItem('userName'));
  console.log('userId:', localStorage.getItem('userId'));
  console.log('userPhoto no localStorage:', localStorage.getItem('userPhoto') ? 'Presente' : 'Não presente');
  
  // Testar busca no banco
  const userName = localStorage.getItem('userName');
  if (userName) {
    fetch(`/api/users/photo/${encodeURIComponent(userName)}`)
      .then(response => response.json())
      .then(data => {
        console.log('foto_perfil no banco:', data.foto_perfil ? 'Presente' : 'Não presente');
      })
      .catch(error => {
        console.error('Erro ao buscar foto no banco:', error);
      });
  }
}

// Função para forçar sincronização
function forceSync() {
  console.log('\n🔄 Forçando sincronização...');
  const userName = localStorage.getItem('userName');
  const userId = localStorage.getItem('userId');
  
  if (userName && userId) {
    fetch(`/api/users/profile/${userId}`)
      .then(response => response.json())
      .then(userData => {
        if (userData.foto_perfil) {
          localStorage.setItem('userPhoto', userData.foto_perfil);
          console.log('✅ Foto sincronizada do banco para localStorage');
        } else {
          localStorage.removeItem('userPhoto');
          console.log('❌ Nenhuma foto encontrada no banco');
        }
        // Recarregar a página para aplicar mudanças
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      })
      .catch(error => {
        console.error('Erro ao sincronizar:', error);
      });
  } else {
    console.log('❌ Dados de usuário não encontrados');
  }
}

// Função para limpar cache
function clearPhotoCache() {
  console.log('\n🗑️ Limpando cache de foto...');
  localStorage.removeItem('userPhoto');
  console.log('✅ Cache limpo');
  setTimeout(() => {
    window.location.reload();
  }, 1000);
}

// Função para testar persistência após logout
function testLogoutPersistence() {
  console.log('\n🚪 Testando persistência após logout...');
  const currentPhoto = localStorage.getItem('userPhoto');
  console.log('Foto atual no cache:', currentPhoto ? 'Presente' : 'Não presente');
  
  // Simular logout (remover dados de sessão mas manter foto)
  const tempPhoto = localStorage.getItem('userPhoto');
  localStorage.removeItem('userName');
  localStorage.removeItem('userId');
  localStorage.removeItem('tipo_usuario');
  
  console.log('Após simulação de logout:');
  console.log('userName:', localStorage.getItem('userName'));
  console.log('userPhoto mantida:', localStorage.getItem('userPhoto') ? 'Sim' : 'Não');
  
  // Restaurar dados para teste
  localStorage.setItem('userName', 'teste');
  localStorage.setItem('userId', '1');
  if (tempPhoto) {
    localStorage.setItem('userPhoto', tempPhoto);
  }
  
  console.log('✅ Teste de persistência concluído');
}

// Função para forçar recarregamento do banco
function forceReloadFromDatabase() {
  console.log('\n🔄 Forçando recarregamento do banco...');
  localStorage.removeItem('userPhoto');
  
  if (window.navbarDebug && window.navbarDebug.forceReloadPhoto) {
    window.navbarDebug.forceReloadPhoto();
  } else {
    console.log('❌ Função de recarregamento não disponível');
  }
}

// Expor funções para uso no console
window.testPhotoSync = {
  testCurrentState,
  forceSync,
  clearPhotoCache,
  testLogoutPersistence,
  forceReloadFromDatabase
};

console.log('\n📝 Funções disponíveis:');
console.log('- testPhotoSync.testCurrentState() - Verificar estado atual');
console.log('- testPhotoSync.forceSync() - Forçar sincronização');
console.log('- testPhotoSync.clearPhotoCache() - Limpar cache');
console.log('- testPhotoSync.testLogoutPersistence() - Testar persistência após logout');
console.log('- testPhotoSync.forceReloadFromDatabase() - Forçar recarregamento do banco');

// Executar teste inicial
testCurrentState(); 