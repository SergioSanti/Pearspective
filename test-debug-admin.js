// Script de teste rápido para debug do admin
// Execute este script no console do navegador

console.log('🔍 Teste Rápido - Debug Admin');

// Testar endpoint de debug
async function testDebugAdmin() {
  console.log('\n🔍 Testando debug do admin...');
  
  try {
    const response = await fetch('/api/debug/users/admin');
    const data = await response.json();
    
    console.log('📊 Resultado do debug:', data);
    
    if (data.exactMatch.found) {
      console.log('✅ Admin encontrado com consulta exata!');
      console.log('- ID:', data.exactMatch.user.id);
      console.log('- Nome:', data.exactMatch.user.nome);
      console.log('- Email:', data.exactMatch.user.email);
    } else {
      console.log('❌ Admin não encontrado com consulta exata');
    }
    
    if (data.caseInsensitiveMatch.found) {
      console.log('✅ Admin encontrado com consulta case-insensitive!');
      console.log('- ID:', data.caseInsensitiveMatch.user.id);
      console.log('- Nome:', data.caseInsensitiveMatch.user.nome);
      console.log('- Email:', data.caseInsensitiveMatch.user.email);
    } else {
      console.log('❌ Admin não encontrado com consulta case-insensitive');
    }
    
    console.log('\n📋 Todos os usuários no banco:');
    data.allUsers.forEach(user => {
      console.log(`- ID: ${user.id}, Nome: "${user.nome}", Email: ${user.email}`);
    });
    
  } catch (error) {
    console.error('❌ Erro no debug:', error);
  }
}

// Testar endpoint de foto com debug
async function testPhotoWithDebug() {
  console.log('\n📸 Testando endpoint de foto com debug...');
  
  try {
    const response = await fetch('/api/users/photo/admin');
    
    console.log('📊 Status da resposta:', response.status);
    console.log('📊 OK:', response.ok);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Foto encontrada:', data);
    } else {
      const errorData = await response.json();
      console.log('❌ Erro na busca:', errorData);
    }
    
  } catch (error) {
    console.error('❌ Erro ao buscar foto:', error);
  }
}

// Testar diretamente no banco
async function testDirectDatabase() {
  console.log('\n🗄️ Testando acesso direto ao banco...');
  
  try {
    // Testar endpoint de teste de banco
    const dbResponse = await fetch('/api/test/database');
    const dbData = await dbResponse.json();
    
    console.log('📊 Estado do banco:', {
      status: dbData.status,
      total_users: dbData.total_users,
      database_time: dbData.database_time
    });
    
    // Testar endpoint de usuário específico
    const userResponse = await fetch('/api/test/user/admin');
    const userData = await userResponse.json();
    
    console.log('👤 Dados do admin:', userData);
    
  } catch (error) {
    console.error('❌ Erro no teste direto:', error);
  }
}

// Executar todos os testes
async function runAllTests() {
  console.log('\n🧪 Executando todos os testes...');
  
  await testDebugAdmin();
  await testPhotoWithDebug();
  await testDirectDatabase();
  
  console.log('\n✅ Todos os testes finalizados!');
}

// Expor funções
window.debugAdmin = {
  testDebugAdmin,
  testPhotoWithDebug,
  testDirectDatabase,
  runAllTests
};

console.log('\n📝 Funções disponíveis:');
console.log('- debugAdmin.runAllTests() - Executar todos os testes');
console.log('- debugAdmin.testDebugAdmin() - Testar debug do admin');
console.log('- debugAdmin.testPhotoWithDebug() - Testar endpoint de foto');
console.log('- debugAdmin.testDirectDatabase() - Testar banco diretamente');

// Executar testes
runAllTests(); 