// Script para testar o armazenamento de fotos no banco de dados
// Execute este script no console do navegador

console.log('🧪 Teste de Armazenamento de Fotos no Banco de Dados');

// Função para testar se a foto está sendo salva no banco
async function testPhotoStorage() {
  console.log('\n📸 Testando armazenamento de foto no banco...');
  
  const userName = localStorage.getItem('userName');
  const userId = localStorage.getItem('userId');
  
  if (!userName || !userId) {
    console.log('❌ Usuário não logado');
    return;
  }
  
  console.log('Usuário:', userName);
  console.log('ID:', userId);
  
  // 1. Verificar foto atual no banco
  try {
    const response = await fetch(`/api/users/profile/${userName}`);
    const userData = await response.json();
    
    console.log('📊 Estado atual no banco:');
    console.log('- ID:', userData.id);
    console.log('- Nome:', userData.nome);
    console.log('- Foto no banco:', userData.foto_perfil ? 'Presente' : 'Não presente');
    
    if (userData.foto_perfil) {
      console.log('- Tamanho da foto:', userData.foto_perfil.length, 'caracteres');
      console.log('- Início da foto:', userData.foto_perfil.substring(0, 50) + '...');
    }
    
  } catch (error) {
    console.error('❌ Erro ao buscar dados do usuário:', error);
  }
}

// Função para testar upload de foto
async function testPhotoUpload() {
  console.log('\n📤 Testando upload de foto...');
  
  const userName = localStorage.getItem('userName');
  const userId = localStorage.getItem('userId');
  
  if (!userName || !userId) {
    console.log('❌ Usuário não logado');
    return;
  }
  
  // Criar uma imagem de teste (base64 simples)
  const testImage = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzAwNzNhYSIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPlRlc3RlPC90ZXh0Pjwvc3ZnPg==';
  
  try {
    const response = await fetch(`/api/users/profile/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        nome: userName,
        departamento: localStorage.getItem('userDepartment') || '',
        cargo_atual: localStorage.getItem('userPosition') || '',
        foto_perfil: testImage
      })
    });
    
    if (response.ok) {
      const updatedUser = await response.json();
      console.log('✅ Foto de teste salva no banco:');
      console.log('- ID:', updatedUser.id);
      console.log('- Nome:', updatedUser.nome);
      console.log('- Foto salva:', updatedUser.foto_perfil ? 'Sim' : 'Não');
      
      if (updatedUser.foto_perfil) {
        console.log('- Tamanho:', updatedUser.foto_perfil.length, 'caracteres');
        console.log('- Início:', updatedUser.foto_perfil.substring(0, 50) + '...');
      }
    } else {
      console.error('❌ Erro ao salvar foto:', response.status);
    }
    
  } catch (error) {
    console.error('❌ Erro no teste de upload:', error);
  }
}

// Função para testar busca de foto
async function testPhotoRetrieval() {
  console.log('\n📥 Testando busca de foto...');
  
  const userName = localStorage.getItem('userName');
  
  if (!userName) {
    console.log('❌ Usuário não logado');
    return;
  }
  
  try {
    const response = await fetch(`/api/users/photo/${encodeURIComponent(userName)}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Foto encontrada:');
      console.log('- Foto presente:', data.foto_perfil ? 'Sim' : 'Não');
      
      if (data.foto_perfil) {
        console.log('- Tamanho:', data.foto_perfil.length, 'caracteres');
        console.log('- Início:', data.foto_perfil.substring(0, 50) + '...');
      }
    } else {
      console.log('❌ Erro na busca:', response.status);
    }
    
  } catch (error) {
    console.error('❌ Erro ao buscar foto:', error);
  }
}

// Função para limpar foto do banco
async function clearPhotoFromDatabase() {
  console.log('\n🗑️ Limpando foto do banco...');
  
  const userName = localStorage.getItem('userName');
  const userId = localStorage.getItem('userId');
  
  if (!userName || !userId) {
    console.log('❌ Usuário não logado');
    return;
  }
  
  try {
    const response = await fetch(`/api/users/profile/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        nome: userName,
        departamento: localStorage.getItem('userDepartment') || '',
        cargo_atual: localStorage.getItem('userPosition') || '',
        foto_perfil: null
      })
    });
    
    if (response.ok) {
      const updatedUser = await response.json();
      console.log('✅ Foto removida do banco:');
      console.log('- ID:', updatedUser.id);
      console.log('- Nome:', updatedUser.nome);
      console.log('- Foto presente:', updatedUser.foto_perfil ? 'Sim' : 'Não');
    } else {
      console.error('❌ Erro ao remover foto:', response.status);
    }
    
  } catch (error) {
    console.error('❌ Erro ao limpar foto:', error);
  }
}

// Função para testar todo o fluxo
async function testCompleteFlow() {
  console.log('\n🔄 Testando fluxo completo...');
  
  // 1. Verificar estado inicial
  await testPhotoStorage();
  
  // 2. Fazer upload de foto de teste
  await testPhotoUpload();
  
  // 3. Verificar se foi salva
  await testPhotoRetrieval();
  
  // 4. Limpar foto
  await clearPhotoFromDatabase();
  
  console.log('\n✅ Teste completo finalizado!');
}

// Expor funções para uso no console
window.testDatabasePhoto = {
  testPhotoStorage,
  testPhotoUpload,
  testPhotoRetrieval,
  clearPhotoFromDatabase,
  testCompleteFlow
};

console.log('\n📝 Funções disponíveis:');
console.log('- testDatabasePhoto.testPhotoStorage() - Verificar foto no banco');
console.log('- testDatabasePhoto.testPhotoUpload() - Testar upload de foto');
console.log('- testDatabasePhoto.testPhotoRetrieval() - Testar busca de foto');
console.log('- testDatabasePhoto.clearPhotoFromDatabase() - Limpar foto do banco');
console.log('- testDatabasePhoto.testCompleteFlow() - Testar fluxo completo');

// Executar teste inicial
testPhotoStorage(); 