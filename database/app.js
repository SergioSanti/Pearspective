const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

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
    const { username, password } = req.body;
    
    // Login hardcoded para teste
    if (username === 'admin' && password === 'admin') {
      res.json({
        success: true,
        user: {
          id: 1,
          username: 'admin',
          name: 'Administrador',
          tipo_usuario: 'admin'
        }
      });
    } else if (username === 'sergio' && password === 'sergio') {
      res.json({
        success: true,
        user: {
          id: 2,
          username: 'sergio',
          name: 'Sergio',
          tipo_usuario: 'user'
        }
      });
    } else {
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

// Rota para servir arquivos estáticos
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
}); 