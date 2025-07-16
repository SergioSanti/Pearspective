// Script para testar especificamente o usuário admin
// Execute este script no console do navegador

console.log('🧪 Teste Específico - Usuário Admin');

// Função para testar se o admin existe no banco
async function testAdminUser() {
  console.log('\n👤 Testando usuário admin...');
  
  try {
    // Testar endpoint de teste de usuário
    const response = await fetch('/api/test/user/admin');
    const data = await response.json();
    
    console.log('📊 Resultado do teste:', data);
    
    if (data.status === 'FOUND') {
      console.log('✅ Admin encontrado no banco!');
      console.log('- ID:', data.user.id);
      console.log('- Nome:', data.user.nome);
      console.log('- Email:', data.user.email);
      console.log('- Tipo:', data.user.tipo_usuario);
      console.log('- Foto:', data.user.foto_perfil);
    } else {
      console.log('❌ Admin não encontrado:', data.message);
    }
    
  } catch (error) {
    console.error('❌ Erro ao testar admin:', error);
  }
}

// Função para testar endpoint de foto
async function testAdminPhoto() {
  console.log('\n📸 Testando endpoint de foto para admin...');
  
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

// Função para testar todos os usuários
async function testAllUsers() {
  console.log('\n📋 Testando todos os usuários...');
  
  try {
    const response = await fetch('/api/test/database');
    const data = await response.json();
    
    console.log('📊 Estado do banco:', data);
    
    // Testar cada usuário
    if (data.total_users > 0) {
      console.log('\n🔍 Testando cada usuário:');
      
      // Vamos testar os usuários conhecidos
      const testUsers = ['admin', 'sergio'];
      
      for (const userName of testUsers) {
        try {
          const userResponse = await fetch(`/api/test/user/${encodeURIComponent(userName)}`);
          const userData = await userResponse.json();
          
          console.log(`\n👤 ${userName}:`, userData.status);
          if (userData.status === 'FOUND') {
            console.log(`  - ID: ${userData.user.id}`);
            console.log(`  - Nome: ${userData.user.nome}`);
            console.log(`  - Foto: ${userData.user.foto_perfil}`);
          }
        } catch (error) {
          console.error(`❌ Erro ao testar ${userName}:`, error);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Erro ao testar usuários:', error);
  }
}

// Função para testar login do admin
async function testAdminLogin() {
  console.log('\n🔐 Testando login do admin...');
  
  try {
    const response = await fetch('/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        usuario: 'admin',
        senha: 'Admin123'
      })
    });
    
    const data = await response.json();
    
    console.log('📊 Resultado do login:', data);
    
    if (data.success) {
      console.log('✅ Login do admin funcionou!');
      console.log('- ID:', data.id);
      console.log('- Nome:', data.nome);
      console.log('- Tipo:', data.tipo_usuario);
      console.log('- Foto:', data.foto_perfil ? 'Presente' : 'Não presente');
    } else {
      console.log('❌ Login do admin falhou:', data.message);
    }
    
  } catch (error) {
    console.error('❌ Erro no login:', error);
  }
}

// Função para diagnóstico completo do admin
async function runAdminDiagnostic() {
  console.log('\n🔍 Diagnóstico Completo - Usuário Admin');
  
  // 1. Testar se o admin existe
  await testAdminUser();
  
  // 2. Testar endpoint de foto
  await testAdminPhoto();
  
  // 3. Testar todos os usuários
  await testAllUsers();
  
  // 4. Testar login
  await testAdminLogin();
  
  console.log('\n✅ Diagnóstico do admin finalizado!');
}

// Expor funções para uso no console
window.testAdmin = {
  testAdminUser,
  testAdminPhoto,
  testAllUsers,
  testAdminLogin,
  runAdminDiagnostic
};

console.log('\n📝 Funções disponíveis:');
console.log('- testAdmin.runAdminDiagnostic() - Diagnóstico completo do admin');
console.log('- testAdmin.testAdminUser() - Testar se admin existe');
console.log('- testAdmin.testAdminPhoto() - Testar endpoint de foto');
console.log('- testAdmin.testAllUsers() - Testar todos os usuários');
console.log('- testAdmin.testAdminLogin() - Testar login do admin');

// Executar diagnóstico inicial
runAdminDiagnostic(); 