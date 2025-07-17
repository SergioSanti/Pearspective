const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware básico
app.use(cors());
app.use(express.json());

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Rota raiz
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Configuração do banco de dados
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/pearspective',
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

// Teste de conexão
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Erro ao conectar com o banco:', err);
  } else {
    console.log('✅ Conectado ao banco de dados PostgreSQL');
  }
});

// Rota de teste
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend funcionando!' });
});

// Rota de saúde
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Servidor funcionando' });
});

// Rota de login simplificada
app.post('/api/login', async (req, res) => {
  try {
    const { usuario, senha } = req.body;
    
    // Fallback simples para teste
    if (usuario === 'admin' && senha === 'Admin123') {
      return res.json({ 
        success: true, 
        id: 1,
        nome: 'admin',
        tipo_usuario: 'admin',
        foto_perfil: null
      });
    } else if (usuario === 'sergio' && senha === '12345') {
      return res.json({ 
        success: true,
        id: 2,
        nome: 'sergio',
        tipo_usuario: 'usuario',
        foto_perfil: null
      });
    } else {
      return res.status(401).json({ success: false, message: 'Credenciais inválidas' });
    }
  } catch (error) {
    console.error('❌ Erro no login:', error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
});

// Rota para buscar áreas
app.get('/api/areas', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, nome FROM areas ORDER BY nome');
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Erro ao buscar áreas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para buscar cargos
app.get('/api/cargos', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, nome_cargo, area_id, requisitos FROM cargos ORDER BY nome_cargo');
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Erro ao buscar cargos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para buscar cargos por área
app.get('/api/cargos/area/:areaId', async (req, res) => {
  try {
    const { areaId } = req.params;
    const result = await pool.query('SELECT id, nome_cargo, area_id, requisitos FROM cargos WHERE area_id = $1 ORDER BY nome_cargo', [areaId]);
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Erro ao buscar cargos por área:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para buscar cursos
app.get('/api/cursos', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, titulo, plataforma, url_externa, categoria, nivel, duracao, descricao FROM cursos ORDER BY titulo');
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Erro ao buscar cursos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para criar curso
app.post('/api/cursos', async (req, res) => {
  try {
    const { title, platform, url, area, level, duration, description } = req.body;
    
    // Converter area (ID) para nome se fornecido
    let categoria = 'Geral';
    if (area) {
      if (!isNaN(Number(area))) {
        const areaResult = await pool.query('SELECT nome FROM areas WHERE id = $1', [area]);
        if (areaResult.rows.length > 0) {
          categoria = areaResult.rows[0].nome;
        }
      } else if (typeof area === 'string') {
        categoria = area;
      }
    }
    
    const query = `
      INSERT INTO cursos (titulo, plataforma, url_externa, categoria, nivel, duracao, descricao)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, titulo, plataforma, url_externa, categoria, nivel, duracao, descricao
    `;
    const values = [
      title || 'Curso sem título',
      platform || 'Não especificado', 
      url || '',
      categoria,
      level || 'Intermediário',
      duration || '',
      description || ''
    ];
    
    const result = await pool.query(query, values);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('❌ Erro ao criar curso:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para atualizar curso
app.put('/api/cursos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    let { title, platform, url, area, level, duration, description } = req.body;
    
    // Converter area (ID) para nome se fornecido
    let categoria = 'Geral';
    if (area) {
      if (!isNaN(Number(area))) {
        const areaResult = await pool.query('SELECT nome FROM areas WHERE id = $1', [area]);
        if (areaResult.rows.length > 0) {
          categoria = areaResult.rows[0].nome;
        }
      } else if (typeof area === 'string') {
        categoria = area;
      }
    }
    
    const query = `
      UPDATE cursos SET
        titulo = $1,
        plataforma = $2,
        url_externa = $3,
        categoria = $4,
        nivel = $5,
        duracao = $6,
        descricao = $7
      WHERE id = $8
      RETURNING id, titulo, plataforma, url_externa, categoria, nivel, duracao, descricao
    `;
    const values = [
      title || 'Curso sem título',
      platform || 'Não especificado',
      url || '',
      categoria,
      level || 'Intermediário',
      duration || '',
      description || '',
      id
    ];
    
    const result = await pool.query(query, values);
    
    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ error: 'Curso não encontrado' });
    }
  } catch (error) {
    console.error('❌ Erro ao atualizar curso:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para deletar curso
app.delete('/api/cursos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM cursos WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length > 0) {
      res.json({ message: 'Curso deletado com sucesso' });
    } else {
      res.status(404).json({ error: 'Curso não encontrado' });
    }
  } catch (error) {
    console.error('❌ Erro ao deletar curso:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota catch-all para arquivos estáticos
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📁 Servindo arquivos estáticos de: ${path.join(__dirname, 'public')}`);
});

module.exports = app; 