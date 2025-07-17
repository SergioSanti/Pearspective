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
    
    // Forçar reflow para garantir que as mudanças sejam aplicadas
    html.offsetHeight;
  }
  
  // Função para atualizar os ícones baseado no tema
  function updateThemeIcons(theme) {
    console.log('[DARK MODE] Atualizando ícones para tema:', theme);
    
    const sunIcon = document.querySelector('.sun-icon');
    const moonIcon = document.querySelector('.moon-icon');
    
    console.log('[DARK MODE] Ícones encontrados:', { sunIcon: !!sunIcon, moonIcon: !!moonIcon });
    
    if (sunIcon && moonIcon) {
      if (theme === 'dark') {
        sunIcon.style.display = 'none';
        moonIcon.style.display = 'block';
        console.log('[DARK MODE] Ícones atualizados para modo escuro');
      } else {
        sunIcon.style.display = 'block';
        moonIcon.style.display = 'none';
        console.log('[DARK MODE] Ícones atualizados para modo claro');
      }
    } else {
      console.warn('[DARK MODE] Ícones não encontrados');
    }
  }
  
  // Função para inicializar o tema
  function initializeTheme() {
    console.log('[DARK MODE] Inicializando tema...');
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    console.log('[DARK MODE] Tema salvo:', savedTheme);
    console.log('[DARK MODE] Prefere escuro:', prefersDark);
    
    // Usar tema salvo ou preferência do sistema
    const theme = savedTheme || (prefersDark ? 'dark' : 'light');
    
    console.log('[DARK MODE] Tema escolhido:', theme);
    
    document.documentElement.setAttribute('data-theme', theme);
    updateThemeIcons(theme);
    
    console.log('[DARK MODE] Tema aplicado:', document.documentElement.getAttribute('data-theme'));
  }
  
  // Função para configurar o botão de dark mode
  function setupDarkModeButton() {
    console.log('[DARK MODE] Configurando botão...');
    
    // Verificar se já existe um botão
    const existingButton = document.getElementById('darkModeToggle');
    if (existingButton) {
      console.log('[DARK MODE] Botão já existe, configurando event listener...');
      console.log('[DARK MODE] Botão encontrado:', existingButton);
      
      // Remover event listeners antigos (se houver)
      const newButton = existingButton.cloneNode(true);
      
      // Remover qualquer onclick inline
      newButton.removeAttribute('onclick');
      
      existingButton.parentNode.replaceChild(newButton, existingButton);
      
      // Adicionar event listener
      newButton.addEventListener('click', (e) => {
        console.log('[DARK MODE] Clique detectado no botão!');
        e.preventDefault();
        e.stopPropagation();
        toggleTheme();
      });
      
      console.log('[DARK MODE] Botão configurado com sucesso');
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
    setupDarkModeButton();
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
  
  // Verificação adicional após carregamento completo
  window.addEventListener('load', () => {
    console.log('[DARK MODE] Página carregada completamente, verificando configuração...');
    setTimeout(initializeDarkMode, 200);
    
    // Debug adicional
    setTimeout(() => {
      const button = document.getElementById('darkModeToggle');
      console.log('[DARK MODE] Debug final - Botão encontrado:', !!button);
      if (button) {
        console.log('[DARK MODE] Botão HTML:', button.outerHTML);
        console.log('[DARK MODE] Botão clicável:', button.onclick);
      }
    }, 500);
  });
  
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
  
  // Função global para compatibilidade com onclick inline
  window.toggleDarkMode = toggleTheme;
})(); 