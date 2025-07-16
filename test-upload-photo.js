// Script para testar upload de foto
// Execute este script no console do navegador

console.log('📤 Testando Upload de Foto');

// Função para testar upload de foto
async function testPhotoUpload() {
  console.log('\n📤 Testando upload de foto...');
  
  try {
    // Criar uma foto de teste (base64 simples)
    const testPhoto = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI0MCIgZmlsbD0iIzAwNzNhYSIvPjx0ZXh0IHg9IjUwIiB5PSI1NSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0id2hpdGUiPkE8L3RleHQ+PC9zdmc+';
    
    console.log('📊 Enviando foto de teste...');
    
    const response = await fetch('/api/users/profile/1', {
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
    
    console.log('📊 Status do upload:', response.status);
    console.log('📊 OK:', response.ok);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Foto enviada com sucesso:', data);
      
      // Testar se a foto foi salva no banco
      console.log('\n🔍 Verificando se a foto foi salva...');
      const photoResponse = await fetch('/api/users/photo/admin');
      
      if (photoResponse.ok) {
        const photoData = await photoResponse.json();
        console.log('✅ Foto confirmada no banco:', photoData.foto_perfil ? 'Presente' : 'Não presente');
        
        if (photoData.foto_perfil) {
          console.log('✅ Foto salva com sucesso!');
          console.log('📏 Tamanho da foto:', photoData.foto_perfil.length, 'caracteres');
          
          // Atualizar localStorage
          localStorage.setItem('userPhoto', photoData.foto_perfil);
          console.log('💾 Foto salva no localStorage');
          
          // Recarregar a página para ver a foto
          console.log('🔄 Recarregando página para ver a foto...');
          setTimeout(() => {
            window.location.reload();
          }, 2000);
          
        } else {
          console.log('❌ Foto não foi salva no banco');
        }
      } else {
        console.log('❌ Erro ao verificar foto no banco');
      }
    } else {
      const errorData = await response.json();
      console.log('❌ Erro no upload:', errorData);
    }
    
  } catch (error) {
    console.error('❌ Erro no upload:', error);
  }
}

// Função para verificar foto atual
async function checkCurrentPhoto() {
  console.log('\n🔍 Verificando foto atual...');
  
  try {
    const response = await fetch('/api/users/photo/admin');
    
    if (response.ok) {
      const data = await response.json();
      console.log('📊 Foto atual:', data.foto_perfil ? 'Presente' : 'Não presente');
      
      if (data.foto_perfil) {
        console.log('✅ Foto encontrada no banco!');
        console.log('📏 Tamanho:', data.foto_perfil.length, 'caracteres');
        
        // Verificar localStorage
        const localPhoto = localStorage.getItem('userPhoto');
        console.log('💾 Foto no localStorage:', localPhoto ? 'Presente' : 'Não presente');
        
        return data.foto_perfil;
      } else {
        console.log('ℹ️ Nenhuma foto definida ainda');
        return null;
      }
    } else {
      console.log('❌ Erro ao buscar foto');
      return null;
    }
    
  } catch (error) {
    console.error('❌ Erro ao verificar foto:', error);
    return null;
  }
}

// Função para testar exibição da foto
function testPhotoDisplay() {
  console.log('\n🖼️ Testando exibição da foto...');
  
  // Verificar se há foto no localStorage
  const userPhoto = localStorage.getItem('userPhoto');
  console.log('💾 Foto no localStorage:', userPhoto ? 'Presente' : 'Não presente');
  
  if (userPhoto) {
    console.log('✅ Foto disponível para exibição');
    
    // Procurar elementos de foto na página
    const photoElements = document.querySelectorAll('img[src*="data:image"], .user-photo, .profile-photo, #userPhoto');
    console.log('🔍 Elementos de foto encontrados:', photoElements.length);
    
    photoElements.forEach((element, index) => {
      console.log(`📸 Elemento ${index + 1}:`, element.tagName, element.className, element.id);
      console.log('   Src atual:', element.src);
      
      // Atualizar src se necessário
      if (!element.src.includes('data:image') || element.src !== userPhoto) {
        element.src = userPhoto;
        console.log('   ✅ Src atualizado');
      } else {
        console.log('   ℹ️ Src já está correto');
      }
    });
    
    // Procurar elementos de inicial
    const initialElements = document.querySelectorAll('.user-initial, .profile-initial, [data-initial]');
    console.log('🔤 Elementos de inicial encontrados:', initialElements.length);
    
    initialElements.forEach((element, index) => {
      console.log(`🔤 Elemento ${index + 1}:`, element.tagName, element.className, element.id);
      console.log('   Texto atual:', element.textContent);
      
      // Ocultar inicial se há foto
      element.style.display = 'none';
      console.log('   ✅ Inicial ocultada');
    });
    
  } else {
    console.log('❌ Nenhuma foto disponível');
  }
}

// Função para teste completo
async function runCompleteTest() {
  console.log('\n🧪 Executando teste completo...');
  
  // 1. Verificar foto atual
  const currentPhoto = await checkCurrentPhoto();
  
  // 2. Se não há foto, fazer upload
  if (!currentPhoto) {
    console.log('\n📤 Fazendo upload de foto de teste...');
    await testPhotoUpload();
  } else {
    console.log('\n✅ Foto já existe, testando exibição...');
    testPhotoDisplay();
  }
  
  // 3. Testar exibição
  setTimeout(() => {
    testPhotoDisplay();
  }, 1000);
  
  console.log('\n✅ Teste completo finalizado!');
}

// Expor funções
window.testUpload = {
  testPhotoUpload,
  checkCurrentPhoto,
  testPhotoDisplay,
  runCompleteTest
};

console.log('\n📝 Funções disponíveis:');
console.log('- testUpload.runCompleteTest() - Teste completo');
console.log('- testUpload.testPhotoUpload() - Upload de foto');
console.log('- testUpload.checkCurrentPhoto() - Verificar foto atual');
console.log('- testUpload.testPhotoDisplay() - Testar exibição');

// Executar teste
runCompleteTest(); 