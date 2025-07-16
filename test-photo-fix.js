// Script para testar se a foto está funcionando corretamente
// Execute este script no console do navegador

console.log('🔧 Teste da Correção da Foto');

// Testar se o endpoint está funcionando
async function testPhotoEndpoint() {
  console.log('\n📸 Testando endpoint de foto...');
  
  try {
    const response = await fetch('/api/users/photo/admin');
    
    console.log('📊 Status da resposta:', response.status);
    console.log('📊 OK:', response.ok);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Endpoint funcionando:', data);
      
      if (data.foto_perfil) {
        console.log('✅ Foto encontrada no banco!');
      } else {
        console.log('ℹ️ Foto não definida ainda (isso é normal)');
      }
    } else {
      const errorData = await response.json();
      console.log('❌ Erro no endpoint:', errorData);
    }
    
  } catch (error) {
    console.error('❌ Erro ao testar endpoint:', error);
  }
}

// Testar se o navbar consegue buscar a foto
async function testNavbarPhoto() {
  console.log('\n🧭 Testando busca de foto no navbar...');
  
  try {
    // Simular o que o navbar faz
    const userName = localStorage.getItem('userName');
    console.log('👤 Usuário do localStorage:', userName);
    
    if (userName) {
      const response = await fetch(`/api/users/photo/${encodeURIComponent(userName)}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Navbar conseguiu buscar foto:', data);
        
        if (data.foto_perfil) {
          console.log('✅ Foto encontrada!');
          // Atualizar localStorage
          localStorage.setItem('userPhoto', data.foto_perfil);
          console.log('💾 Foto salva no localStorage');
        } else {
          console.log('ℹ️ Foto não definida, usando inicial');
        }
      } else {
        console.log('❌ Navbar não conseguiu buscar foto');
      }
    } else {
      console.log('❌ Nenhum usuário no localStorage');
    }
    
  } catch (error) {
    console.error('❌ Erro no navbar:', error);
  }
}

// Testar upload de foto
async function testPhotoUpload() {
  console.log('\n📤 Testando upload de foto...');
  
  try {
    // Criar uma foto de teste (base64 simples)
    const testPhoto = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI0MCIgZmlsbD0iIzAwNzNhYSIvPjx0ZXh0IHg9IjUwIiB5PSI1NSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0id2hpdGUiPkE8L3RleHQ+PC9zdmc+';
    
    const response = await fetch('/api/users/update-profile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: '1', // ID do admin
        nome: 'admin',
        departamento: 'TI',
        cargo_atual: 'Administrador do Sistema',
        foto_perfil: testPhoto
      })
    });
    
    console.log('📊 Status do upload:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Foto enviada com sucesso:', data);
      
      // Testar se a foto foi salva
      const photoResponse = await fetch('/api/users/photo/admin');
      if (photoResponse.ok) {
        const photoData = await photoResponse.json();
        console.log('✅ Foto confirmada no banco:', photoData.foto_perfil ? 'Presente' : 'Não presente');
      }
    } else {
      const errorData = await response.json();
      console.log('❌ Erro no upload:', errorData);
    }
    
  } catch (error) {
    console.error('❌ Erro no upload:', error);
  }
}

// Testar fluxo completo
async function testCompleteFlow() {
  console.log('\n🔄 Testando fluxo completo...');
  
  // 1. Testar endpoint
  await testPhotoEndpoint();
  
  // 2. Testar navbar
  await testNavbarPhoto();
  
  // 3. Testar upload
  await testPhotoUpload();
  
  console.log('\n✅ Teste completo finalizado!');
}

// Expor funções
window.testPhotoFix = {
  testPhotoEndpoint,
  testNavbarPhoto,
  testPhotoUpload,
  testCompleteFlow
};

console.log('\n📝 Funções disponíveis:');
console.log('- testPhotoFix.testCompleteFlow() - Teste completo');
console.log('- testPhotoFix.testPhotoEndpoint() - Testar endpoint');
console.log('- testPhotoFix.testNavbarPhoto() - Testar navbar');
console.log('- testPhotoFix.testPhotoUpload() - Testar upload');

// Executar teste completo
testCompleteFlow(); 