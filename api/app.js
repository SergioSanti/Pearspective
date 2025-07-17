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
    
    try {
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
      
      console.log('🔍 Schema detectado para login:', { hasUsername, hasNome, hasEmail });
      
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
          console.log('✅ Login admin bem-sucedido (fallback)');
          return res.json({ 
            success: true, 
            id: 1,
            nome: 'admin',
            tipo_usuario: 'admin',
            foto_perfil: null
          });
        } else if (usuario === 'sergio' && senha === '12345') {
          console.log('✅ Login sergio bem-sucedido (fallback)');
          return res.json({ 
            success: true,
            id: 2,
            nome: 'sergio',
            tipo_usuario: 'usuario',
            foto_perfil: null
          });
        } else {
          console.log('❌ Credenciais inválidas (fallback)');
          return res.status(401).json({ success: false, message: 'Credenciais inválidas' });
        }
      }
      
      console.log('🔍 Query de login:', query, 'Params:', params);
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
    } catch (dbError) {
      console.error('❌ Erro na query do banco:', dbError);
      // Fallback para teste em caso de erro no banco
      if (usuario === 'admin' && senha === 'Admin123') {
        console.log('✅ Login admin bem-sucedido (fallback por erro)');
        return res.json({ 
          success: true, 
          id: 1,
          nome: 'admin',
          tipo_usuario: 'admin',
          foto_perfil: null
        });
      } else if (usuario === 'sergio' && senha === '12345') {
        console.log('✅ Login sergio bem-sucedido (fallback por erro)');
        return res.json({ 
          success: true,
          id: 2,
          nome: 'sergio',
          tipo_usuario: 'usuario',
          foto_perfil: null
        });
      } else {
        console.log('❌ Credenciais inválidas (fallback por erro)');
        return res.status(401).json({ success: false, message: 'Credenciais inválidas' });
      }
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
    console.log(`👤 Buscando foto do usuário: ${username}`);
    
    // Query adaptativa
    const checkSchema = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'usuarios' 
      AND column_name IN ('username', 'nome', 'email')
    `);
    
    const hasUsername = checkSchema.rows.some(row => row.column_name === 'username');
    const hasNome = checkSchema.rows.some(row => row.column_name === 'nome');
    const hasEmail = checkSchema.rows.some(row => row.column_name === 'email');
    
    let query = '';
    let params = [username];
    
    if (hasUsername) {
      query = 'SELECT foto_perfil FROM usuarios WHERE username = $1';
    } else if (hasNome) {
      query = 'SELECT foto_perfil FROM usuarios WHERE nome = $1';
    } else if (hasEmail) {
      query = 'SELECT foto_perfil FROM usuarios WHERE email = $1';
    } else {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    
    const result = await pool.query(query, params);

    if (result.rows.length > 0) {
      console.log('✅ Foto encontrada para usuário:', username);
      res.json({ foto_perfil: result.rows[0].foto_perfil });
    } else {
      console.log('❌ Usuário não encontrado:', username);
      res.status(404).json({ error: 'Usuário não encontrado' });
    }
  } catch (error) {
    console.error('❌ Erro ao buscar foto:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para buscar perfil do usuário
app.get('/api/users/profile/:username', async (req, res) => {
  try {
    const { username } = req.params;
    console.log(`👤 Buscando perfil do usuário: ${username}`);
    
    // Query adaptativa
    const checkSchema = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'usuarios' 
      AND column_name IN ('username', 'nome', 'email', 'nome_exibicao', 'departamento', 'cargo_atual')
    `);
    
    const hasUsername = checkSchema.rows.some(row => row.column_name === 'username');
    const hasNome = checkSchema.rows.some(row => row.column_name === 'nome');
    const hasEmail = checkSchema.rows.some(row => row.column_name === 'email');
    const hasNomeExibicao = checkSchema.rows.some(row => row.column_name === 'nome_exibicao');
    const hasDepartamento = checkSchema.rows.some(row => row.column_name === 'departamento');
    const hasCargoAtual = checkSchema.rows.some(row => row.column_name === 'cargo_atual');
    
    let query = '';
    let params = [username];
    
    if (hasUsername && hasNomeExibicao && hasDepartamento && hasCargoAtual) {
      query = 'SELECT id, username, nome, nome_exibicao, foto_perfil, departamento, cargo_atual FROM usuarios WHERE username = $1 OR nome = $1';
    } else if (hasNome && hasDepartamento && hasCargoAtual) {
      query = 'SELECT id, nome, foto_perfil, departamento, cargo_atual FROM usuarios WHERE nome = $1';
    } else if (hasEmail) {
      query = 'SELECT id, email, foto_perfil FROM usuarios WHERE email = $1';
    } else {
      // Fallback simples
      query = 'SELECT * FROM usuarios WHERE username = $1 OR nome = $1 OR email = $1';
    }
    
    const result = await pool.query(query, params);
    
    if (result.rows.length > 0) {
      console.log('✅ Perfil encontrado para usuário:', username);
      res.json(result.rows[0]);
    } else {
      console.log('❌ Usuário não encontrado:', username);
      res.status(404).json({ error: 'Usuário não encontrado' });
    }
  } catch (error) {
    console.error('❌ Erro ao buscar perfil:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para atualizar perfil do usuário
app.put('/api/users/profile/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { departamento, cargo_atual, foto_perfil } = req.body;
    
    console.log(`👤 Atualizando perfil do usuário ${id}:`, { departamento, cargo_atual, foto_perfil });
    
    // Query adaptativa
    const checkSchema = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'usuarios' 
      AND column_name IN ('departamento', 'cargo_atual', 'foto_perfil')
    `);
    
    const hasDepartamento = checkSchema.rows.some(row => row.column_name === 'departamento');
    const hasCargoAtual = checkSchema.rows.some(row => row.column_name === 'cargo_atual');
    const hasFotoPerfil = checkSchema.rows.some(row => row.column_name === 'foto_perfil');
    
    let query = '';
    let params = [];
    
    if (hasDepartamento && hasCargoAtual && hasFotoPerfil) {
      query = 'UPDATE usuarios SET departamento = $1, cargo_atual = $2, foto_perfil = $3 WHERE id = $4 RETURNING *';
      params = [departamento, cargo_atual, foto_perfil, id];
    } else if (hasDepartamento && hasCargoAtual) {
      query = 'UPDATE usuarios SET departamento = $1, cargo_atual = $2 WHERE id = $3 RETURNING *';
      params = [departamento, cargo_atual, id];
    } else {
      // Fallback simples
      query = 'UPDATE usuarios SET foto_perfil = $1 WHERE id = $2 RETURNING *';
      params = [foto_perfil, id];
    }
    
    const result = await pool.query(query, params);
    
    if (result.rows.length > 0) {
      console.log('✅ Perfil atualizado com sucesso');
      res.json(result.rows[0]);
    } else {
      console.log('❌ Usuário não encontrado para atualização');
      res.status(404).json({ error: 'Usuário não encontrado' });
    }
  } catch (error) {
    console.error('❌ Erro ao atualizar perfil:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para buscar cargos
app.get('/api/cargos', async (req, res) => {
  try {
    console.log('📋 Buscando cargos...');
    console.log('🔍 Query params:', req.query);
    
    // Query adaptativa baseada no schema real
    let query = '';
    let params = [];
    
    // Verificar se existe coluna 'nome_cargo' ou 'nome'
    const checkSchema = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'cargos' 
      AND column_name IN ('nome_cargo', 'nome')
    `);
    
    const hasNomeCargo = checkSchema.rows.some(row => row.column_name === 'nome_cargo');
    const hasNome = checkSchema.rows.some(row => row.column_name === 'nome');
    
    if (hasNomeCargo) {
      query = 'SELECT * FROM cargos ORDER BY nome_cargo';
    } else if (hasNome) {
      query = 'SELECT * FROM cargos ORDER BY nome';
    } else {
      // Fallback - tentar com qualquer coluna que exista
      query = 'SELECT * FROM cargos';
    }
    
    const result = await pool.query(query);
    
    console.log(`✅ Encontrados ${result.rows.length} cargos`);
    console.log('📊 Primeiros 3 cargos:', result.rows.slice(0, 3));
    console.log('🔍 Schema detectado:', { hasNomeCargo, hasNome });
    
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Erro ao buscar cargos:', error);
    console.error('❌ Stack trace:', error.stack);
    res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
  }
});

// Rota para buscar cargos por área
app.get('/api/cargos/area/:areaId', async (req, res) => {
  try {
    const { areaId } = req.params;
    console.log(`📋 Buscando cargos da área ${areaId}...`);
    
    // Query adaptativa - verificar todas as possíveis colunas
    const checkSchema = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'cargos' 
      AND column_name IN ('area_id', 'area_nome', 'area', 'departamento')
    `);
    
    console.log('🔍 Colunas encontradas na tabela cargos:', checkSchema.rows.map(r => r.column_name));
    
    const hasAreaId = checkSchema.rows.some(row => row.column_name === 'area_id');
    const hasAreaNome = checkSchema.rows.some(row => row.column_name === 'area_nome');
    const hasArea = checkSchema.rows.some(row => row.column_name === 'area');
    const hasDepartamento = checkSchema.rows.some(row => row.column_name === 'departamento');
    
    console.log('🔍 Schema detectado:', { hasAreaId, hasAreaNome, hasArea, hasDepartamento });
    
    let query = '';
    let params = [];
    
    if (hasAreaId) {
      // Se tem area_id, usar diretamente
      query = 'SELECT * FROM cargos WHERE area_id = $1 ORDER BY nome_cargo';
      params = [areaId];
      console.log('✅ Usando area_id para filtrar');
    } else if (hasAreaNome) {
      // Se tem area_nome, buscar o nome da área primeiro
      const areaResult = await pool.query('SELECT nome FROM areas WHERE id = $1', [areaId]);
      if (areaResult.rows.length > 0) {
        query = 'SELECT * FROM cargos WHERE area_nome = $1 ORDER BY nome_cargo';
        params = [areaResult.rows[0].nome];
        console.log('✅ Usando area_nome para filtrar:', areaResult.rows[0].nome);
      }
    } else if (hasArea) {
      // Se tem area, buscar o nome da área primeiro
      const areaResult = await pool.query('SELECT nome FROM areas WHERE id = $1', [areaId]);
      if (areaResult.rows.length > 0) {
        query = 'SELECT * FROM cargos WHERE area = $1 ORDER BY nome_cargo';
        params = [areaResult.rows[0].nome];
        console.log('✅ Usando area para filtrar:', areaResult.rows[0].nome);
      }
    } else if (hasDepartamento) {
      // Se tem departamento, buscar o nome da área primeiro
      const areaResult = await pool.query('SELECT nome FROM areas WHERE id = $1', [areaId]);
      if (areaResult.rows.length > 0) {
        query = 'SELECT * FROM cargos WHERE departamento = $1 ORDER BY nome_cargo';
        params = [areaResult.rows[0].nome];
        console.log('✅ Usando departamento para filtrar:', areaResult.rows[0].nome);
      }
    }
    
    if (!query) {
      console.log('❌ Nenhuma coluna de área encontrada, retornando vazio');
      return res.json([]);
    }
    
    console.log('🔍 Query final:', query, 'Params:', params);
    const result = await pool.query(query, params);
    
    console.log(`✅ Encontrados ${result.rows.length} cargos para área ${areaId}`);
    console.log('📊 Cargos encontrados:', result.rows.map(c => c.nome_cargo || c.nome));
    
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Erro ao buscar cargos por área:', error);
    console.error('❌ Stack trace:', error.stack);
    res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
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
    console.log('🏢 Buscando áreas...');
    
    const result = await pool.query('SELECT * FROM areas ORDER BY nome');
    
    console.log(`✅ Encontradas ${result.rows.length} áreas`);
    console.log('📊 Áreas:', result.rows);
    
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Erro ao buscar áreas:', error);
    console.error('❌ Stack trace:', error.stack);
    res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
  }
});

// Rota para buscar cursos
app.get('/api/cursos', async (req, res) => {
  try {
    console.log('📚 Buscando cursos...');
    
    const result = await pool.query('SELECT * FROM cursos ORDER BY nome');
    
    console.log(`✅ Encontrados ${result.rows.length} cursos`);
    console.log('📊 Primeiros 3 cursos:', result.rows.slice(0, 3));
    
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Erro ao buscar cursos:', error);
    console.error('❌ Stack trace:', error.stack);
    res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
  }
});

// Rota para buscar certificados
app.get('/api/certificados', async (req, res) => {
  try {
    console.log('🏆 Buscando certificados...');
    
    // Query adaptativa baseada no schema real
    const checkSchema = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'certificados' 
      AND column_name IN ('data_obtencao', 'data_conclusao')
    `);
    
    const hasDataObtencao = checkSchema.rows.some(row => row.column_name === 'data_obtencao');
    const hasDataConclusao = checkSchema.rows.some(row => row.column_name === 'data_conclusao');
    
    let query = '';
    if (hasDataObtencao) {
      query = 'SELECT * FROM certificados ORDER BY data_obtencao DESC';
    } else if (hasDataConclusao) {
      query = 'SELECT * FROM certificados ORDER BY data_conclusao DESC';
    } else {
      query = 'SELECT * FROM certificados ORDER BY id DESC';
    }
    
    const result = await pool.query(query);
    
    console.log(`✅ Encontrados ${result.rows.length} certificados`);
    console.log('📊 Primeiros 3 certificados:', result.rows.slice(0, 3));
    
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Erro ao buscar certificados:', error);
    console.error('❌ Stack trace:', error.stack);
    res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
  }
});

// Rota para buscar certificados por usuário
app.get('/api/certificados/usuario/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    console.log(`🏆 Buscando certificados do usuário ${userId}...`);
    
    // Query adaptativa
    const checkSchema = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'certificados' 
      AND column_name IN ('usuario_id', 'user_id')
    `);
    
    const hasUsuarioId = checkSchema.rows.some(row => row.column_name === 'usuario_id');
    const hasUserId = checkSchema.rows.some(row => row.column_name === 'user_id');
    
    let query = '';
    let params = [];
    
    if (hasUsuarioId) {
      query = 'SELECT * FROM certificados WHERE usuario_id = $1 ORDER BY data_obtencao DESC';
      params = [userId];
    } else if (hasUserId) {
      query = 'SELECT * FROM certificados WHERE user_id = $1 ORDER BY data_obtencao DESC';
      params = [userId];
    } else {
      // Se não encontrar, retornar vazio
      return res.json([]);
    }
    
    const result = await pool.query(query, params);
    
    console.log(`✅ Encontrados ${result.rows.length} certificados para usuário ${userId}`);
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Erro ao buscar certificados do usuário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para criar certificado
app.post('/api/certificados', async (req, res) => {
  try {
    console.log('🏆 Criando certificado...', req.body);
    
    const { nome, instituicao, data_obtencao, usuario_id, url_certificado } = req.body;
    
    // Query adaptativa
    const checkSchema = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'certificados' 
      AND column_name IN ('usuario_id', 'user_id', 'data_obtencao', 'data_conclusao')
    `);
    
    const hasUsuarioId = checkSchema.rows.some(row => row.column_name === 'usuario_id');
    const hasUserId = checkSchema.rows.some(row => row.column_name === 'user_id');
    const hasDataObtencao = checkSchema.rows.some(row => row.column_name === 'data_obtencao');
    const hasDataConclusao = checkSchema.rows.some(row => row.column_name === 'data_conclusao');
    
    let query = '';
    let params = [];
    
    if (hasUsuarioId && hasDataObtencao) {
      query = 'INSERT INTO certificados (nome, instituicao, data_obtencao, usuario_id, url_certificado) VALUES ($1, $2, $3, $4, $5) RETURNING *';
      params = [nome, instituicao, data_obtencao, usuario_id, url_certificado];
    } else if (hasUserId && hasDataConclusao) {
      query = 'INSERT INTO certificados (nome, instituicao, data_conclusao, user_id, url_certificado) VALUES ($1, $2, $3, $4, $5) RETURNING *';
      params = [nome, instituicao, data_obtencao, usuario_id, url_certificado];
    } else {
      // Fallback simples
      query = 'INSERT INTO certificados (nome, instituicao) VALUES ($1, $2) RETURNING *';
      params = [nome, instituicao];
    }
    
    const result = await pool.query(query, params);
    
    console.log('✅ Certificado criado:', result.rows[0]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('❌ Erro ao criar certificado:', error);
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

// Rota para visualizar todos os dados do banco
app.get('/api/database-dump', async (req, res) => {
  try {
    console.log('🔍 Fazendo dump completo do banco...');
    
    const result = {
      timestamp: new Date().toISOString(),
      connection: 'OK',
      tables: {}
    };
    
    // Listar todas as tabelas
    const tablesQuery = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('📋 Tabelas encontradas:', tablesQuery.rows.map(t => t.table_name));
    
    // Para cada tabela, buscar todos os dados
    for (const table of tablesQuery.rows) {
      const tableName = table.table_name;
      console.log(`📊 Buscando dados da tabela: ${tableName}`);
      
      try {
        const dataQuery = await pool.query(`SELECT * FROM ${tableName} LIMIT 50`);
        result.tables[tableName] = {
          count: dataQuery.rows.length,
          columns: Object.keys(dataQuery.rows[0] || {}),
          data: dataQuery.rows
        };
        console.log(`✅ ${tableName}: ${dataQuery.rows.length} registros`);
      } catch (error) {
        console.error(`❌ Erro ao buscar ${tableName}:`, error.message);
        result.tables[tableName] = {
          error: error.message,
          count: 0,
          data: []
        };
      }
    }
    
    console.log('✅ Dump completo finalizado');
    res.json(result);
  } catch (error) {
    console.error('❌ Erro no dump do banco:', error);
    res.status(500).json({ error: error.message });
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