const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');

const app = express();

// Middleware básico
app.use(cors());
app.use(express.json({ limit: '2mb' }));

// Tratamento de erro global
app.use((err, req, res, next) => {
  console.error('❌ Erro:', err);
  res.status(500).json({ 
    error: 'Erro interno do servidor',
    message: err.message 
  });
});

// Rota de teste simples
app.get('/api/test', (req, res) => {
  res.json({ message: 'API funcionando!' });
});

// Rota de login simplificada
app.post('/api/login', async (req, res) => {
  try {
    const { usuario, senha } = req.body;
    
    console.log('🔐 Tentativa de login:', { usuario, senha });
    
    // Por enquanto, vamos usar dados fixos para testar
    if (usuario === 'admin' && senha === 'Admin123') {
      res.json({ 
        success: true, 
        message: 'Login válido', 
        tipo_usuario: 'admin', 
        id: 1, 
        nome: 'admin',
        foto_perfil: null
      });
    } else if (usuario === 'sergio' && senha === '12345') {
      res.json({ 
        success: true, 
        message: 'Login válido', 
        tipo_usuario: 'usuario', 
        id: 2, 
        nome: 'sergio',
        foto_perfil: null
      });
    } else {
      res.status(401).json({ success: false, message: 'Usuário ou senha incorretos.' });
    }
  } catch (error) {
    console.error('❌ Erro no login:', error);
    res.status(500).json({ success: false, message: 'Erro interno no servidor' });
  }
});

// Rota para servir arquivos estáticos
app.get('*', (req, res) => {
  res.json({ message: 'API Pearspective funcionando!' });
});

module.exports = app; 