// Script simples para testar upload de foto
// Execute este script no console do navegador

console.log('📤 Teste Simples de Upload');

async function testUpload() {
  console.log('\n📤 Testando upload...');
  
  try {
    // Foto de teste simples
    const testPhoto = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI0MCIgZmlsbD0iIzAwNzNhYSIvPjx0ZXh0IHg9IjUwIiB5PSI1NSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0id2hpdGUiPkE8L3RleHQ+PC9zdmc+';
    
    const response = await fetch('/api/users/profile/admin', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        nome: 'admin',
        departamento: 'TI',
        cargo_atual: 'Administrador do Sistema',
        foto_perfil: testPhoto
      })
    });
    
    console.log('📊 Status:', response.status);
    console.log('📊 OK:', response.ok);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Upload bem-sucedido:', data);
      
      // Verificar se a foto foi salva
      const photoResponse = await fetch('/api/users/photo/admin');
      if (photoResponse.ok) {
        const photoData = await photoResponse.json();
        console.log('✅ Foto no banco:', photoData.foto_perfil ? 'Presente' : 'Não presente');
        
        if (photoData.foto_perfil) {
          console.log('🎉 SUCESSO! Foto foi salva no banco!');
          
          // Atualizar localStorage
          localStorage.setItem('userPhoto', photoData.foto_perfil);
          console.log('💾 Foto salva no localStorage');
          
          // Recarregar página
          console.log('🔄 Recarregando página...');
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        }
      }
    } else {
      const errorData = await response.json();
      console.log('❌ Erro:', errorData);
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

// Executar teste
testUpload(); 