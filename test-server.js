// Script para testar se o servidor está funcionando
// Execute este script no console do navegador

console.log('🔍 Teste do Servidor');

// Testar se o servidor está respondendo
async function testServer() {
  console.log('\n🌐 Testando se o servidor está respondendo...');
  
  try {
    const response = await fetch('/api/test/database');
    
    console.log('📊 Status da resposta:', response.status);
    console.log('📊 OK:', response.ok);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Servidor funcionando!');
      console.log('- Status:', data.status);
      console.log('- Total de usuários:', data.total_users);
      console.log('- Tempo do banco:', data.database_time);
    } else {
      console.log('❌ Servidor não está respondendo corretamente');
    }
    
  } catch (error) {
    console.error('❌ Erro ao conectar com o servidor:', error);
    console.log('💡 Verifique se o servidor está rodando na porta 3000');
  }
}

// Testar endpoint específico
async function testSpecificEndpoint() {
  console.log('\n🎯 Testando endpoint específico...');
  
  try {
    const response = await fetch('/api/users/photo/admin');
    
    console.log('📊 Status da resposta:', response.status);
    console.log('📊 OK:', response.ok);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Endpoint funcionando:', data);
    } else {
      const errorData = await response.json();
      console.log('❌ Erro no endpoint:', errorData);
    }
    
  } catch (error) {
    console.error('❌ Erro no endpoint:', error);
  }
}

// Testar todos os endpoints
async function testAllEndpoints() {
  console.log('\n🧪 Testando todos os endpoints...');
  
  const endpoints = [
    '/api/test/database',
    '/api/test/user/admin',
    '/api/users/photo/admin',
    '/api/debug/users/admin'
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`\n🔍 Testando: ${endpoint}`);
      const response = await fetch(endpoint);
      
      console.log(`- Status: ${response.status}`);
      console.log(`- OK: ${response.ok}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`- Dados:`, data);
      } else {
        const errorData = await response.json();
        console.log(`- Erro:`, errorData);
      }
      
    } catch (error) {
      console.error(`❌ Erro em ${endpoint}:`, error);
    }
  }
}

// Executar todos os testes
async function runServerTests() {
  console.log('\n🚀 Iniciando testes do servidor...');
  
  await testServer();
  await testSpecificEndpoint();
  await testAllEndpoints();
  
  console.log('\n✅ Testes do servidor finalizados!');
}

// Expor funções
window.testServer = {
  testServer,
  testSpecificEndpoint,
  testAllEndpoints,
  runServerTests
};

console.log('\n📝 Funções disponíveis:');
console.log('- testServer.runServerTests() - Executar todos os testes');
console.log('- testServer.testServer() - Testar servidor');
console.log('- testServer.testSpecificEndpoint() - Testar endpoint específico');
console.log('- testServer.testAllEndpoints() - Testar todos os endpoints');

// Executar testes
runServerTests(); 