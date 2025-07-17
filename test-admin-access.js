// Script para testar controle de acesso de admin
// Execute este script no console do navegador

console.log('🔒 Teste de Controle de Acesso - Admin');

// Função para verificar tipo de usuário atual
function checkCurrentUser() {
  console.log('\n👤 Verificando usuário atual...');
  
  const userName = localStorage.getItem('userName');
  const userType = localStorage.getItem('tipo_usuario');
  const userId = localStorage.getItem('userId');
  
  console.log('📊 Dados do usuário:');
  console.log('- Nome:', userName);
  console.log('- Tipo:', userType);
  console.log('- ID:', userId);
  
  return { userName, userType, userId };
}

// Função para simular login como admin
function simulateAdminLogin() {
  console.log('\n🔐 Simulando login como admin...');
  
  localStorage.setItem('userName', 'admin');
  localStorage.setItem('tipo_usuario', 'admin');
  localStorage.setItem('userId', '1');
  
  console.log('✅ Login como admin simulado');
  console.log('🔄 Recarregando página...');
  
  setTimeout(() => {
    window.location.reload();
  }, 1000);
}

// Função para simular login como usuário comum
function simulateUserLogin() {
  console.log('\n👤 Simulando login como usuário comum...');
  
  localStorage.setItem('userName', 'sergio');
  localStorage.setItem('tipo_usuario', 'usuario');
  localStorage.setItem('userId', '2');
  
  console.log('✅ Login como usuário comum simulado');
  console.log('🔄 Recarregando página...');
  
  setTimeout(() => {
    window.location.reload();
  }, 1000);
}

// Função para testar acesso ao catálogo
function testCatalogAccess() {
  console.log('\n📚 Testando acesso ao catálogo...');
  
  const userType = localStorage.getItem('tipo_usuario');
  
  if (userType === 'admin') {
    console.log('✅ Usuário admin - deve ter acesso completo');
    console.log('🔧 Botão admin deve estar visível');
    console.log('✏️ Botões de editar devem estar visíveis');
    console.log('🗑️ Botões de excluir devem estar visíveis');
  } else {
    console.log('🔒 Usuário comum - acesso restrito');
    console.log('❌ Botão admin deve estar oculto');
    console.log('❌ Botões de editar devem estar ocultos');
    console.log('❌ Botões de excluir devem estar ocultos');
  }
}

// Função para testar tentativas de acesso não autorizado
function testUnauthorizedAccess() {
  console.log('\n🚫 Testando tentativas de acesso não autorizado...');
  
  const userType = localStorage.getItem('tipo_usuario');
  
  if (userType !== 'admin') {
    console.log('🔒 Usuário não é admin - testando restrições...');
    
    // Tentar acessar funções de admin
    if (window.courseManager) {
      console.log('📝 Testando showAddForm()...');
      window.courseManager.showAddForm();
      
      console.log('📝 Testando showEditForm(1)...');
      window.courseManager.showEditForm(1);
      
      console.log('📝 Testando showDeleteModal(1)...');
      window.courseManager.showDeleteModal(1);
      
      console.log('📝 Testando toggleAdminMode()...');
      window.courseManager.toggleAdminMode();
    } else {
      console.log('❌ CourseManager não encontrado');
    }
  } else {
    console.log('✅ Usuário é admin - acesso permitido');
  }
}

// Função para verificar elementos visuais
function checkVisualElements() {
  console.log('\n👁️ Verificando elementos visuais...');
  
  const adminToggle = document.getElementById('admin-toggle');
  const adminPanel = document.getElementById('admin-panel');
  const editButtons = document.querySelectorAll('.edit-course');
  const deleteButtons = document.querySelectorAll('.delete-course');
  
  console.log('🔧 Botão Admin:', adminToggle ? (adminToggle.style.display === 'none' ? '❌ Oculto' : '✅ Visível') : '❌ Não encontrado');
  console.log('📋 Painel Admin:', adminPanel ? (adminPanel.style.display === 'none' ? '❌ Oculto' : '✅ Visível') : '❌ Não encontrado');
  console.log('✏️ Botões Editar:', editButtons.length > 0 ? `${editButtons.length} encontrados` : '❌ Não encontrados');
  console.log('🗑️ Botões Excluir:', deleteButtons.length > 0 ? `${deleteButtons.length} encontrados` : '❌ Não encontrados');
}

// Função para teste completo
function runCompleteTest() {
  console.log('\n🧪 Executando teste completo de controle de acesso...');
  
  // 1. Verificar usuário atual
  const user = checkCurrentUser();
  
  // 2. Testar acesso ao catálogo
  testCatalogAccess();
  
  // 3. Verificar elementos visuais
  checkVisualElements();
  
  // 4. Testar tentativas não autorizadas
  testUnauthorizedAccess();
  
  console.log('\n✅ Teste completo finalizado!');
}

// Expor funções para uso no console
window.testAdminAccess = {
  checkCurrentUser,
  simulateAdminLogin,
  simulateUserLogin,
  testCatalogAccess,
  testUnauthorizedAccess,
  checkVisualElements,
  runCompleteTest
};

console.log('\n📝 Funções disponíveis:');
console.log('- testAdminAccess.runCompleteTest() - Teste completo');
console.log('- testAdminAccess.simulateAdminLogin() - Login como admin');
console.log('- testAdminAccess.simulateUserLogin() - Login como usuário');
console.log('- testAdminAccess.checkCurrentUser() - Verificar usuário atual');
console.log('- testAdminAccess.testCatalogAccess() - Testar acesso ao catálogo');
console.log('- testAdminAccess.checkVisualElements() - Verificar elementos visuais');

// Executar teste
runCompleteTest(); 