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

// Configuração do banco de dados com SSL forçado para Railway
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

// Rota para verificar se o servidor está funcionando
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Servidor funcionando' });
});

// Rota de login com banco de dados
app.post('/api/login', async (req, res) => {
  try {
    const { usuario, senha } = req.body;
    
    console.log('🔐 Tentativa de login:', { usuario, senha });
    
    // Query adaptativa baseada no schema do banco
    let query = '';
    let params = [];
    
    // Verificar se existe coluna 'username' ou 'nome'
    const checkSchema = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'usuarios' 
      AND column_name IN ('username', 'nome', 'email')
    `);
    
    const hasUsername = checkSchema.rows.some(row => row.column_name === 'username');
    const hasNome = checkSchema.rows.some(row => row.column_name === 'nome');
    const hasEmail = checkSchema.rows.some(row => row.column_name === 'email');
    
    if (hasUsername) {
      query = 'SELECT * FROM usuarios WHERE username = $1 AND senha = $2';
      params = [usuario, senha];
    } else if (hasNome) {
      query = 'SELECT * FROM usuarios WHERE nome = $1 AND senha = $2';
      params = [usuario, senha];
    } else if (hasEmail) {
      query = 'SELECT * FROM usuarios WHERE email = $1 AND senha = $2';
      params = [usuario, senha];
    } else {
      // Fallback para teste
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
    }
    
    const result = await pool.query(query, params);
    
    if (result.rows.length > 0) {
      const user = result.rows[0];
      console.log('✅ Login bem-sucedido:', user.nome || user.username);
      res.json({ 
        success: true, 
        id: user.id,
        nome: user.nome || user.username,
        tipo_usuario: user.tipo_usuario || 'usuario',
        foto_perfil: user.foto_perfil
      });
    } else {
      console.log('❌ Credenciais inválidas');
      res.status(401).json({ success: false, message: 'Credenciais inválidas' });
    }
  } catch (error) {
    console.error('❌ Erro no login:', error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
});

// Rota para buscar foto do usuário
app.get('/api/users/photo/:username', async (req, res) => {
  try {
    const { username } = req.params;
    
    const result = await pool.query(
      'SELECT foto_perfil FROM usuarios WHERE username = $1 OR nome = $1',
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
      'SELECT id, username, nome, nome_exibicao, foto_perfil, departamento, cargo_atual FROM usuarios WHERE username = $1 OR nome = $1',
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

// Rota para buscar cargos
app.get('/api/cargos', async (req, res) => {
  try {
    console.log('📋 Buscando cargos...');
    
    const result = await pool.query('SELECT * FROM cargos ORDER BY nome');
    
    console.log(`✅ Encontrados ${result.rows.length} cargos`);
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
    console.log(`📋 Buscando cargos da área ${areaId}...`);
    
    const result = await pool.query('SELECT * FROM cargos WHERE area_id = $1 ORDER BY nome', [areaId]);
    
    console.log(`✅ Encontrados ${result.rows.length} cargos para área ${areaId}`);
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Erro ao buscar cargos por área:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para buscar um cargo específico
app.get('/api/cargos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query('SELECT * FROM cargos WHERE id = $1', [id]);
    
    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ error: 'Cargo não encontrado' });
    }
  } catch (error) {
    console.error('Erro ao buscar cargo:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para criar cargo
app.post('/api/cargos', async (req, res) => {
  try {
    const { nome, descricao, area_id, nivel } = req.body;
    
    const result = await pool.query(
      'INSERT INTO cargos (nome, descricao, area_id, nivel) VALUES ($1, $2, $3, $4) RETURNING *',
      [nome, descricao, area_id, nivel]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar cargo:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para atualizar cargo
app.put('/api/cargos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, descricao, area_id, nivel } = req.body;
    
    const result = await pool.query(
      'UPDATE cargos SET nome = $1, descricao = $2, area_id = $3, nivel = $4 WHERE id = $5 RETURNING *',
      [nome, descricao, area_id, nivel, id]
    );
    
    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ error: 'Cargo não encontrado' });
    }
  } catch (error) {
    console.error('Erro ao atualizar cargo:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para deletar cargo
app.delete('/api/cargos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query('DELETE FROM cargos WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length > 0) {
      res.json({ message: 'Cargo deletado com sucesso' });
    } else {
      res.status(404).json({ error: 'Cargo não encontrado' });
    }
  } catch (error) {
    console.error('Erro ao deletar cargo:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para buscar áreas
app.get('/api/areas', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM areas ORDER BY nome');
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar áreas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para buscar cursos
app.get('/api/cursos', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM cursos ORDER BY nome');
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar cursos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para buscar certificados
app.get('/api/certificados', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM certificados ORDER BY data_obtencao DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar certificados:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para buscar certificados por usuário
app.get('/api/certificados/usuario/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const result = await pool.query(
      'SELECT * FROM certificados WHERE usuario_id = $1 ORDER BY data_obtencao DESC',
      [userId]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar certificados do usuário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para criar certificado
app.post('/api/certificados', async (req, res) => {
  try {
    const { nome, instituicao, data_obtencao, usuario_id, url_certificado } = req.body;
    
    const result = await pool.query(
      'INSERT INTO certificados (nome, instituicao, data_obtencao, usuario_id, url_certificado) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [nome, instituicao, data_obtencao, usuario_id, url_certificado]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar certificado:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para atualizar certificado
app.put('/api/certificados/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, instituicao, data_obtencao, url_certificado } = req.body;
    
    const result = await pool.query(
      'UPDATE certificados SET nome = $1, instituicao = $2, data_obtencao = $3, url_certificado = $4 WHERE id = $5 RETURNING *',
      [nome, instituicao, data_obtencao, url_certificado, id]
    );
    
    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ error: 'Certificado não encontrado' });
    }
  } catch (error) {
    console.error('Erro ao atualizar certificado:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para deletar certificado
app.delete('/api/certificados/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query('DELETE FROM certificados WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length > 0) {
      res.json({ message: 'Certificado deletado com sucesso' });
    } else {
      res.status(404).json({ error: 'Certificado não encontrado' });
    }
  } catch (error) {
    console.error('Erro ao deletar certificado:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para buscar dados de teste do banco
app.get('/api/database-test', async (req, res) => {
  try {
    console.log('🔍 Testando conexão com banco...');
    
    // Testar conexão
    const connectionTest = await pool.query('SELECT NOW() as current_time');
    console.log('✅ Conexão OK:', connectionTest.rows[0]);
    
    // Contar registros nas tabelas principais
    const cargosCount = await pool.query('SELECT COUNT(*) as count FROM cargos');
    const usuariosCount = await pool.query('SELECT COUNT(*) as count FROM usuarios');
    const areasCount = await pool.query('SELECT COUNT(*) as count FROM areas');
    
    const result = {
      connection: 'OK',
      current_time: connectionTest.rows[0].current_time,
      tables: {
        cargos: cargosCount.rows[0].count,
        usuarios: usuariosCount.rows[0].count,
        areas: areasCount.rows[0].count
      }
    };
    
    console.log('📊 Resultado do teste:', result);
    res.json(result);
  } catch (error) {
    console.error('❌ Erro no teste do banco:', error);
    res.status(500).json({ error: error.message });
  }
});

// Rota para buscar estrutura das tabelas
app.get('/api/schema', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT table_name, column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      ORDER BY table_name, ordinal_position
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar schema:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota catch-all para arquivos estáticos
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Iniciar servidor
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`📁 Servindo arquivos estáticos de: ${path.join(__dirname, '..', 'public')}`);
  });
}

// Exportar para Vercel/Railway
module.exports = app; 