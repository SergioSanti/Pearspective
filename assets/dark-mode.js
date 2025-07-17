// ===== DARK MODE MANAGER =====
// Script para gerenciar o dark mode em todas as páginas

(function() {
  'use strict';

  // Função para alternar o tema
  function toggleTheme() {
    console.log('[DARK MODE] Alternando tema...');
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    console.log('[DARK MODE] Tema atual:', currentTheme, 'Novo tema:', newTheme);
    
    html.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    // Atualizar ícones se existirem
    updateThemeIcons(newTheme);
    
    console.log('[DARK MODE] Tema alterado para:', newTheme);
  }
  
  // Função para atualizar os ícones baseado no tema
  function updateThemeIcons(theme) {
    const sunIcon = document.querySelector('.sun-icon');
    const moonIcon = document.querySelector('.moon-icon');
    
    if (sunIcon && moonIcon) {
      if (theme === 'dark') {
        sunIcon.style.display = 'none';
        moonIcon.style.display = 'block';
      } else {
        sunIcon.style.display = 'block';
        moonIcon.style.display = 'none';
      }
    }
  }
  
  // Função para inicializar o tema
  function initializeTheme() {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // Usar tema salvo ou preferência do sistema
    const theme = savedTheme || (prefersDark ? 'dark' : 'light');
    
    document.documentElement.setAttribute('data-theme', theme);
    updateThemeIcons(theme);
  }
  
  // Função para criar o botão de dark mode se não existir
  function createDarkModeButton() {
    console.log('[DARK MODE] Tentando criar botão...');
    
    // Verificar se já existe um botão
    if (document.getElementById('darkModeToggle')) {
      console.log('[DARK MODE] Botão já existe');
      return;
    }
    
    // Verificar se existe uma área de usuário
    const userArea = document.querySelector('.user-area');
    if (!userArea) {
      console.log('[DARK MODE] Área de usuário não encontrada');
      return;
    }
    
    console.log('[DARK MODE] Criando botão...');
    
    // Criar o botão
    const darkModeToggle = document.createElement('button');
    darkModeToggle.id = 'darkModeToggle';
    darkModeToggle.className = 'dark-mode-toggle';
    darkModeToggle.setAttribute('aria-label', 'Alternar modo escuro');
    darkModeToggle.innerHTML = `
      <span class="icon sun-icon">☀️</span>
      <span class="icon moon-icon" style="display: none;">🌙</span>
    `;
    
    // Adicionar o botão no início da área do usuário
    userArea.insertBefore(darkModeToggle, userArea.firstChild);
    
    // Adicionar event listener
    darkModeToggle.addEventListener('click', toggleTheme);
    
    console.log('[DARK MODE] Botão criado e adicionado');
  }
  
  // Função para inicializar tudo
  function initializeDarkMode() {
    console.log('[DARK MODE] Inicializando sistema...');
    initializeTheme();
    createDarkModeButton();
  }
  
  // Inicializar quando o DOM estiver pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeDarkMode);
  } else {
    // Se o DOM já está pronto, inicializar imediatamente
    initializeDarkMode();
  }
  
  // Também tentar inicializar após um pequeno delay para garantir que tudo carregou
  setTimeout(initializeDarkMode, 100);
  
  // Escutar mudanças na preferência do sistema
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!localStorage.getItem('theme')) {
      const newTheme = e.matches ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', newTheme);
      updateThemeIcons(newTheme);
    }
  });
  
  // Expor funções globalmente para uso em outros scripts
  window.DarkMode = {
    toggle: toggleTheme,
    initialize: initializeTheme,
    updateIcons: updateThemeIcons
  };
})(); 