const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use(express.static(path.join(__dirname, '..')));

// Rota raiz - servir index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Configuração do banco de dados
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/pearspective',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Teste de conexão
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Erro ao conectar com o banco:', err);
        } else {
    console.log('Conectado ao banco de dados PostgreSQL');
  }
});

// Rota de teste
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend funcionando!' });
});

// Rota de login simplificada
app.post('/api/login', async (req, res) => {
  try {
    const { usuario, senha } = req.body;
    
    console.log('🔐 Tentativa de login:', { usuario, senha });
    console.log('📡 Rota /api/login chamada');
    
    // Login hardcoded para teste - usando as credenciais do banco
    if (usuario === 'admin' && senha === 'Admin123') {
      console.log('✅ Login admin bem-sucedido');
    res.json({ 
      success: true, 
        id: 1,
        nome: 'admin',
        tipo_usuario: 'admin',
        foto_perfil: null
      });
    } else if (usuario === 'sergio' && senha === '12345') {
      console.log('✅ Login sergio bem-sucedido');
    res.json({ 
        success: true,
        id: 2,
        nome: 'sergio',
        tipo_usuario: 'usuario',
        foto_perfil: null
      });
    } else {
      console.log('❌ Credenciais inválidas:', { usuario, senha });
      res.status(401).json({ success: false, message: 'Credenciais inválidas' });
    }
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
});

// Rota para buscar foto do usuário
app.get('/api/users/photo/:username', async (req, res) => {
  try {
    const { username } = req.params;
    
    const result = await pool.query(
      'SELECT foto_perfil FROM usuarios WHERE username = $1',
      [username]
    );

    if (result.rows.length > 0) {
      res.json({ foto_perfil: result.rows[0].foto_perfil });
    } else {
      res.status(404).json({ error: 'Usuário não encontrado' });
    }
  } catch (error) {
    console.error('Erro ao buscar foto:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para buscar perfil do usuário
app.get('/api/users/profile/:username', async (req, res) => {
  try {
    const { username } = req.params;
    
    const result = await pool.query(
      'SELECT id, username, nome, nome_exibicao, foto_perfil, departamento, cargo_atual FROM usuarios WHERE username = $1',
      [username]
    );
    
    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ error: 'Usuário não encontrado' });
    }
  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para atualizar perfil do usuário
app.put('/api/users/profile/:id', async (req, res) => {
  try {
  const { id } = req.params;
    const { departamento, cargo_atual, foto_perfil } = req.body;
    
    const result = await pool.query(
      'UPDATE usuarios SET departamento = $1, cargo_atual = $2, foto_perfil = $3 WHERE id = $4 RETURNING *',
      [departamento, cargo_atual, foto_perfil, id]
    );
    
    if (result.rows.length > 0) {
    res.json(result.rows[0]);
    } else {
      res.status(404).json({ error: 'Usuário não encontrado' });
    }
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para verificar se o servidor está funcionando
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Servidor funcionando' });
});

// Exportar para Vercel
module.exports = app; 