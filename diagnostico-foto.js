// Script de diagnóstico completo para problemas com fotos de usuário
// Execute este script no console do navegador

console.log('🔍 Diagnóstico Completo - Problemas com Fotos de Usuário');

// Função para verificar estado do banco
async function checkDatabase() {
  console.log('\n📊 Verificando estado do banco de dados...');
  
  try {
    const response = await fetch('/api/test/database');
    const data = await response.json();
    
    console.log('✅ Banco de dados:', data.status);
    console.log('- Tempo do banco:', data.database_time);
    console.log('- Total de usuários:', data.total_users);
    console.log('- Estrutura da tabela usuarios:');
    
    data.table_structure.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });
    
    return data;
  } catch (error) {
    console.error('❌ Erro ao verificar banco:', error);
    return null;
  }
}

// Função para verificar usuário específico
async function checkUser(userName) {
  console.log(`\n👤 Verificando usuário: ${userName}`);
  
  try {
    const response = await fetch(`/api/test/user/${encodeURIComponent(userName)}`);
    const data = await response.json();
    
    if (data.status === 'FOUND') {
      console.log('✅ Usuário encontrado:');
      console.log('- ID:', data.user.id);
      console.log('- Nome:', data.user.nome);
      console.log('- Email:', data.user.email);
      console.log('- Tipo:', data.user.tipo_usuario);
      console.log('- Departamento:', data.user.departamento);
      console.log('- Cargo:', data.user.cargo_atual);
      console.log('- Foto:', data.user.foto_perfil);
      console.log('- Tamanho da foto:', data.user.foto_tamanho, 'caracteres');
      console.log('- Data cadastro:', data.user.data_cadastro);
    } else {
      console.log('❌ Usuário não encontrado:', data.message);
    }
    
    return data;
  } catch (error) {
    console.error('❌ Erro ao verificar usuário:', error);
    return null;
  }
}

// Função para testar upload de foto
async function testPhotoUpload(userName, userId) {
  console.log(`\n📤 Testando upload de foto para usuário ${userName}...`);
  
  // Criar imagem de teste
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
    
    console.log('📊 Resposta do servidor:');
    console.log('- Status:', response.status);
    console.log('- OK:', response.ok);
    
    if (response.ok) {
      const updatedUser = await response.json();
      console.log('✅ Foto salva com sucesso:');
      console.log('- ID:', updatedUser.id);
      console.log('- Nome:', updatedUser.nome);
      console.log('- Foto salva:', updatedUser.foto_perfil ? 'Sim' : 'Não');
      
      if (updatedUser.foto_perfil) {
        console.log('- Tamanho da foto:', updatedUser.foto_perfil.length, 'caracteres');
        console.log('- Início da foto:', updatedUser.foto_perfil.substring(0, 50) + '...');
      }
    } else {
      const errorData = await response.json();
      console.error('❌ Erro ao salvar foto:', errorData);
    }
    
    return response.ok;
  } catch (error) {
    console.error('❌ Erro no teste de upload:', error);
    return false;
  }
}

// Função para testar busca de foto
async function testPhotoRetrieval(userName) {
  console.log(`\n📥 Testando busca de foto para usuário ${userName}...`);
  
  try {
    const response = await fetch(`/api/users/photo/${encodeURIComponent(userName)}`);
    
    console.log('📊 Resposta do servidor:');
    console.log('- Status:', response.status);
    console.log('- OK:', response.ok);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Foto encontrada:');
      console.log('- Foto presente:', data.foto_perfil ? 'Sim' : 'Não');
      
      if (data.foto_perfil) {
        console.log('- Tamanho da foto:', data.foto_perfil.length, 'caracteres');
        console.log('- Início da foto:', data.foto_perfil.substring(0, 50) + '...');
      }
    } else {
      const errorData = await response.json();
      console.error('❌ Erro na busca:', errorData);
    }
    
    return response.ok;
  } catch (error) {
    console.error('❌ Erro ao buscar foto:', error);
    return false;
  }
}

// Função para verificar localStorage
function checkLocalStorage() {
  console.log('\n💾 Verificando localStorage...');
  
  const keys = ['userName', 'userId', 'userPhoto', 'tipo_usuario', 'userDepartment', 'userPosition'];
  
  keys.forEach(key => {
    const value = localStorage.getItem(key);
    console.log(`- ${key}:`, value ? `"${value}"` : 'não definido');
  });
}

// Função para verificar se o usuário está logado
function checkUserLogin() {
  console.log('\n🔐 Verificando login do usuário...');
  
  const userName = localStorage.getItem('userName');
  const userId = localStorage.getItem('userId');
  
  if (userName && userId) {
    console.log('✅ Usuário logado:');
    console.log('- Nome:', userName);
    console.log('- ID:', userId);
    return { userName, userId };
  } else {
    console.log('❌ Usuário não logado');
    return null;
  }
}

// Função para diagnóstico completo
async function runFullDiagnostic() {
  console.log('\n🔍 Iniciando diagnóstico completo...');
  
  // 1. Verificar localStorage
  checkLocalStorage();
  
  // 2. Verificar login
  const userInfo = checkUserLogin();
  
  if (!userInfo) {
    console.log('❌ Usuário não logado - faça login primeiro');
    return;
  }
  
  // 3. Verificar banco de dados
  await checkDatabase();
  
  // 4. Verificar usuário no banco
  await checkUser(userInfo.userName);
  
  // 5. Testar upload de foto
  const uploadSuccess = await testPhotoUpload(userInfo.userName, userInfo.userId);
  
  // 6. Verificar se a foto foi salva
  if (uploadSuccess) {
    await checkUser(userInfo.userName);
  }
  
  // 7. Testar busca de foto
  await testPhotoRetrieval(userInfo.userName);
  
  console.log('\n✅ Diagnóstico completo finalizado!');
}

// Função para limpar dados de teste
async function clearTestData() {
  console.log('\n🗑️ Limpando dados de teste...');
  
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
      console.log('✅ Dados de teste limpos');
    } else {
      console.error('❌ Erro ao limpar dados');
    }
  } catch (error) {
    console.error('❌ Erro ao limpar dados:', error);
  }
}

// Expor funções para uso no console
window.diagnosticoFoto = {
  checkDatabase,
  checkUser,
  testPhotoUpload,
  testPhotoRetrieval,
  checkLocalStorage,
  checkUserLogin,
  runFullDiagnostic,
  clearTestData
};

console.log('\n📝 Funções disponíveis:');
console.log('- diagnosticoFoto.runFullDiagnostic() - Diagnóstico completo');
console.log('- diagnosticoFoto.checkDatabase() - Verificar banco');
console.log('- diagnosticoFoto.checkUser(userName) - Verificar usuário');
console.log('- diagnosticoFoto.testPhotoUpload(userName, userId) - Testar upload');
console.log('- diagnosticoFoto.testPhotoRetrieval(userName) - Testar busca');
console.log('- diagnosticoFoto.checkLocalStorage() - Verificar localStorage');
console.log('- diagnosticoFoto.checkUserLogin() - Verificar login');
console.log('- diagnosticoFoto.clearTestData() - Limpar dados de teste');

// Executar diagnóstico inicial
runFullDiagnostic(); 