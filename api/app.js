const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const path = require('path');
const cookieParser = require('cookie-parser');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;



// Middleware
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie']
}));

// Log para debug de todas as requisições (apenas para rotas da API)
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    console.log(`📨 ${req.method} ${req.path} - ${new Date().toISOString()}`);
    // Log do body para debug
    if (req.method === 'POST' || req.method === 'PUT') {
      console.log('📋 Body recebido:', req.body);
    }
  }
  next();
});
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Configurar multer para upload de arquivos
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});

// Servir arquivos estáticos da raiz
app.use(express.static(path.join(__dirname, '..')));

// Log para debug de arquivos estáticos
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    next();
  } else {
    console.log('📁 Arquivo estático solicitado:', req.path);
    next();
  }
});

// Rota raiz - servir index.html
app.get('/', (req, res) => {
  console.log('🏠 Servindo index.html da raiz');
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// Configuração do banco de dados para Railway
console.log('🚂 Configurando banco para Railway...');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Tratamento de erros do pool
pool.on('error', (err) => {
  console.error('❌ Erro inesperado no pool de conexão:', err);
});

pool.on('connect', () => {
  console.log('✅ Nova conexão estabelecida com o banco');
});

// Teste de conexão
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Erro ao conectar com o banco:', err);
    console.error('❌ DATABASE_URL:', process.env.DATABASE_URL ? 'Configurada' : 'Não configurada');
  } else {
    console.log('✅ Conectado ao banco de dados PostgreSQL');
    console.log('🔍 Configuração do banco:', {
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      ssl: 'Habilitado'
    });
  }
});

// Rota de teste
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend funcionando!' });
});

// Rota de teste de banco
app.get('/api/test-db', async (req, res) => {
  if (!pool) {
    return res.json({ 
      message: 'Modo local: sem conexão com banco',
      mode: 'local'
    });
  }
  
  try {
    console.log('🔍 Testando conexão com banco...');
    const result = await pool.query('SELECT NOW() as current_time, version() as db_version');
    console.log('✅ Teste de banco OK:', result.rows[0]);
    res.json({ 
      message: 'Conexão com banco OK!',
      current_time: result.rows[0].current_time,
      db_version: result.rows[0].db_version,
      mode: 'railway'
    });
  } catch (error) {
    console.error('❌ Erro no teste de banco:', error);
    res.status(500).json({ error: 'Erro no banco', details: error.message });
  }
});

// Rota de teste de tabelas
app.get('/api/test-tables', async (req, res) => {
  try {
    console.log('🔍 Listando tabelas...');
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    console.log('✅ Tabelas encontradas:', result.rows);
    res.json({ 
      message: 'Tabelas listadas!',
      tables: result.rows.map(row => row.table_name),
      mode: 'railway'
    });
  } catch (error) {
    console.error('❌ Erro ao listar tabelas:', error);
    res.status(500).json({ error: 'Erro ao listar tabelas', details: error.message });
  }
});

// Rota para verificar se o servidor está funcionando
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Servidor funcionando',
    mode: 'railway'
  });
});

// Rota para verificar e corrigir estrutura da tabela cursos
app.get('/api/fix-cursos-table', async (req, res) => {
  try {
    console.log('🔧 Verificando estrutura da tabela cursos...');
    
    // Verificar se a tabela existe
    const tableCheck = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'cursos'
    `);
    
    if (tableCheck.rows.length === 0) {
      console.log('❌ Tabela cursos não existe, criando...');
      
      // Criar tabela cursos com estrutura correta
      await pool.query(`
        CREATE TABLE cursos (
          id SERIAL PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          platform VARCHAR(100) NOT NULL,
          url TEXT,
          area VARCHAR(100) DEFAULT 'Geral',
          level VARCHAR(50) DEFAULT 'Intermediário',
          duration VARCHAR(50),
          description TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      
      console.log('✅ Tabela cursos criada com sucesso');
      res.json({ message: 'Tabela cursos criada com sucesso', mode: 'railway' });
    } else {
      console.log('✅ Tabela cursos já existe');
      
      // Verificar colunas existentes
      const columnsCheck = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'cursos'
        ORDER BY ordinal_position
      `);
      
      console.log('📋 Colunas existentes:', columnsCheck.rows);
      res.json({ 
        message: 'Tabela cursos existe',
        columns: columnsCheck.rows,
        mode: 'railway'
      });
    }
  } catch (error) {
    console.error('❌ Erro ao verificar tabela cursos:', error);
    res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
  }
});

// Rota de teste para PUT
app.put('/api/test-put', (req, res) => {
  console.log('✅ Rota PUT de teste funcionando');
  res.json({ message: 'PUT funcionando', body: req.body });
});



// Rota de login com banco de dados
app.post('/api/login', async (req, res) => {
  try {
    const { usuario, senha } = req.body;
    
    console.log('🔐 Tentativa de login:', { usuario, senha });
    
    // Fallback direto para teste - sem complicação
    if (usuario === 'admin' && senha === 'Admin123') {
      console.log('✅ Login admin bem-sucedido');
      
      // Gerar token de sessão
      const sessionToken = `1-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Configurar cookie de sessão
      res.cookie('sessionToken', sessionToken);
      
      return res.json({ 
        success: true, 
        id: 1,
        nome: 'admin',
        tipo_usuario: 'admin',
        foto_perfil: null,
        sessionToken: sessionToken
      });
    } else if (usuario === 'sergio' && senha === '12345') {
      console.log('✅ Login sergio bem-sucedido');
      
      // Gerar token de sessão
      const sessionToken = `2-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Configurar cookie de sessão
      res.cookie('sessionToken', sessionToken);
      
      return res.json({ 
        success: true,
        id: 2,
        nome: 'sergio',
        tipo_usuario: 'usuario',
        foto_perfil: null,
        sessionToken: sessionToken
      });
    } else {
      console.log('❌ Credenciais inválidas');
      return res.status(401).json({ success: false, message: 'Credenciais inválidas' });
    }
  } catch (error) {
    console.error('❌ Erro no login:', error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
});

// Rota para verificar usuário atual logado
app.get('/api/me', async (req, res) => {
  try {
    // Verificar se há um token de sessão no header ou cookie
    const authHeader = req.headers.authorization;
    const sessionToken = req.cookies?.sessionToken || authHeader?.replace('Bearer ', '');
    
    console.log('🔍 Verificando sessão atual:', { 
      hasAuthHeader: !!authHeader, 
      hasSessionToken: !!sessionToken,
      cookies: req.cookies,
      allHeaders: Object.keys(req.headers),
      userAgent: req.headers['user-agent'],
      origin: req.headers.origin,
      referer: req.headers.referer
    });
    
    if (!sessionToken) {
      console.log('❌ Nenhuma sessão encontrada');
      return res.status(401).json({ 
        authenticated: false, 
        message: 'Usuário não autenticado' 
      });
    }
    
    // Para simplificar, vamos usar uma abordagem mais direta
    // Se o token começa com "1-", é admin, se começa com "2-", é sergio
    if (sessionToken.startsWith('1-')) {
      console.log('✅ Admin autenticado via token');
      res.json({
        authenticated: true,
        user: {
          id: 1,
          nome: 'admin',
          email: 'admin@example.com',
          tipo_usuario: 'admin',
        foto_perfil: null
        }
      });
    } else if (sessionToken.startsWith('2-')) {
      console.log('✅ Sergio autenticado via token');
      res.json({
        authenticated: true,
        user: {
          id: 2,
          nome: 'sergio',
          email: 'sergio@example.com',
          tipo_usuario: 'usuario',
          foto_perfil: null
        }
      });
    } else {
      console.log('❌ Token inválido:', sessionToken);
      res.status(401).json({ 
        authenticated: false, 
        message: 'Sessão inválida' 
      });
    }
  } catch (error) {
    console.error('❌ Erro ao verificar sessão:', error);
    res.status(500).json({ 
      authenticated: false, 
      message: 'Erro interno do servidor' 
    });
  }
});

// Rota para fazer logout
app.post('/api/logout', (req, res) => {
  try {
    console.log('🚪 Logout solicitado');
    
    // Limpar cookie de sessão simples
    res.clearCookie('sessionToken');
    
    console.log('✅ Cookie de sessão removido');
    res.json({ success: true, message: 'Logout realizado com sucesso' });
  } catch (error) {
    console.error('❌ Erro no logout:', error);
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
    
    // Query simples e direta
    const query = 'SELECT id, nome, email, tipo_usuario, foto_perfil, departamento, cargo_atual FROM usuarios WHERE nome = $1';
    const result = await pool.query(query, [username]);
    
    if (result.rows.length > 0) {
      const user = result.rows[0];
      console.log('✅ Perfil encontrado para usuário:', username);
      res.json({
        id: user.id,
        nome: user.nome,
        nome_exibicao: user.nome,
        email: user.email,
        tipo_usuario: user.tipo_usuario,
        foto_perfil: user.foto_perfil,
        departamento: user.departamento || '',
        cargo_atual: user.cargo_atual || '',
        data_cadastro: user.data_cadastro || new Date().toISOString()
      });
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
app.put('/api/users/profile/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const { departamento, cargo_atual, foto_perfil } = req.body;
    
    console.log(`👤 Atualizando perfil do usuário ${username}:`, { 
      departamento, 
      cargo_atual, 
      foto_perfil: foto_perfil ? 'Foto fornecida' : 'Sem foto' 
    });
    
    // Verificar se o usuário existe primeiro
    const userCheck = await pool.query('SELECT id, nome FROM usuarios WHERE nome = $1', [username]);
    
    if (userCheck.rows.length === 0) {
      console.log('❌ Usuário não encontrado:', username);
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    
    console.log('✅ Usuário encontrado:', userCheck.rows[0]);
    
    // Query simples para atualizar o perfil
    const query = `
      UPDATE usuarios 
      SET departamento = COALESCE($1, departamento), 
          cargo_atual = COALESCE($2, cargo_atual), 
          foto_perfil = COALESCE($3, foto_perfil)
      WHERE nome = $4 
      RETURNING id, nome, email, tipo_usuario, foto_perfil, departamento, cargo_atual
    `;
    
    console.log('🔍 Executando query:', query);
    console.log('📋 Parâmetros:', [departamento, cargo_atual, foto_perfil ? 'Foto presente' : 'Sem foto', username]);
    
    const result = await pool.query(query, [departamento, cargo_atual, foto_perfil, username]);
    
    if (result.rows.length > 0) {
      console.log('✅ Perfil atualizado com sucesso:', result.rows[0]);
      res.json(result.rows[0]);
    } else {
      console.log('❌ Nenhuma linha atualizada');
      res.status(500).json({ error: 'Erro ao atualizar perfil' });
    }
  } catch (error) {
    console.error('❌ Erro ao atualizar perfil:', error);
    console.error('❌ Stack trace:', error.stack);
    res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
  }
});

// Rota específica para upload de foto
app.put('/api/users/photo/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const { foto_perfil } = req.body;
    
    console.log(`📸 Atualizando foto do usuário ${username}:`, { 
      foto_perfil: foto_perfil ? 'Foto fornecida' : 'Sem foto' 
    });
    
    if (!foto_perfil) {
      return res.status(400).json({ error: 'Foto não fornecida' });
    }
    
    // Verificar se o usuário existe
    const userCheck = await pool.query('SELECT id, nome FROM usuarios WHERE nome = $1', [username]);
    
    if (userCheck.rows.length === 0) {
      console.log('❌ Usuário não encontrado:', username);
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    
    // Atualizar apenas a foto
    const query = 'UPDATE usuarios SET foto_perfil = $1 WHERE nome = $2 RETURNING id, nome, foto_perfil';
    const result = await pool.query(query, [foto_perfil, username]);
    
    if (result.rows.length > 0) {
      console.log('✅ Foto atualizada com sucesso');
      res.json(result.rows[0]);
    } else {
      console.log('❌ Erro ao atualizar foto');
      res.status(500).json({ error: 'Erro ao atualizar foto' });
    }
  } catch (error) {
    console.error('❌ Erro ao atualizar foto:', error);
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
      query = 'SELECT id, nome_cargo, area_id, requisitos FROM cargos ORDER BY nome_cargo';
    } else if (hasNome) {
      query = 'SELECT id, nome_cargo, area_id, requisitos FROM cargos ORDER BY nome';
    } else {
      // Fallback - tentar com qualquer coluna que exista
      query = 'SELECT id, nome_cargo, area_id, requisitos FROM cargos';
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
    
    // Simples: buscar cargos pelo area_id
    const result = await pool.query('SELECT id, nome_cargo, area_id, requisitos FROM cargos WHERE area_id = $1 ORDER BY nome_cargo', [areaId]);
    
    console.log(`✅ Encontrados ${result.rows.length} cargos para área ${areaId}`);
    console.log('📊 Cargos:', result.rows.map(c => c.nome_cargo));
    
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
    
    const result = await pool.query('SELECT id, nome_cargo, area_id, requisitos FROM cargos WHERE id = $1', [id]);
    
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
    console.log('📋 Criando cargo - Dados recebidos:', JSON.stringify(req.body, null, 2));
    const { nome_cargo, area_id, requisitos, quantidade_vagas } = req.body;
    
    // Validar campos obrigatórios
    if (!nome_cargo || !area_id) {
      console.log('❌ Campos obrigatórios faltando:', { nome_cargo, area_id });
      return res.status(400).json({ error: 'Nome do cargo e área são obrigatórios' });
    }
    
    // Converter requisitos para JSON se for objeto
    let requisitosJson = requisitos;
    if (typeof requisitos === 'object' && requisitos !== null) {
      requisitosJson = JSON.stringify(requisitos);
      console.log('🔍 Requisitos convertidos para JSON:', requisitosJson);
    }
    
    // Verificar se a área existe
    const areaCheck = await pool.query('SELECT id FROM areas WHERE id = $1', [parseInt(area_id)]);
    if (areaCheck.rows.length === 0) {
      console.log('❌ Área não encontrada:', area_id);
      return res.status(400).json({ error: 'Área não encontrada' });
    }
    
    // Verificar estrutura da tabela cargos
    const tableInfo = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'cargos' 
      ORDER BY ordinal_position
    `);
    console.log('🔍 Estrutura da tabela cargos:', tableInfo.rows);
    
    // Verificar se a coluna quantidade_vagas existe
    const hasQuantidadeVagas = tableInfo.rows.some(row => row.column_name === 'quantidade_vagas');
    
    console.log('🔍 Dados processados:', {
      nome_cargo,
      area_id: parseInt(area_id),
      quantidade_vagas: parseInt(quantidade_vagas) || 1,
      requisitos: requisitosJson,
      hasQuantidadeVagas
    });
    
    let result;
    if (hasQuantidadeVagas) {
      // Se a coluna existe, usar ela
      result = await pool.query(
        'INSERT INTO cargos (nome_cargo, area_id, requisitos, quantidade_vagas) VALUES ($1, $2, $3, $4) RETURNING id, nome_cargo, area_id, requisitos',
        [nome_cargo, parseInt(area_id), requisitosJson, parseInt(quantidade_vagas) || 1]
      );
    } else {
      // Se não existe, usar apenas as colunas básicas
      result = await pool.query(
        'INSERT INTO cargos (nome_cargo, area_id, requisitos) VALUES ($1, $2, $3) RETURNING id, nome_cargo, area_id, requisitos',
        [nome_cargo, parseInt(area_id), requisitosJson]
      );
    }
    
    console.log('✅ Cargo criado com sucesso:', result.rows[0]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('❌ Erro ao criar cargo:', error);
    console.error('❌ Stack trace:', error.stack);
    console.error('❌ Error details:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      hint: error.hint
    });
    res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
  }
});

// Rota para atualizar cargo
app.put('/api/cargos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nome_cargo, area_id, requisitos, quantidade_vagas } = req.body;
    
    console.log(`📋 Atualizando cargo ${id}:`, req.body);
    
    // Verificar estrutura da tabela cargos
    const tableInfo = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'cargos' 
      ORDER BY ordinal_position
    `);
    
    // Verificar se a coluna quantidade_vagas existe
    const hasQuantidadeVagas = tableInfo.rows.some(row => row.column_name === 'quantidade_vagas');
    
    // Converter requisitos para JSON se for objeto
    let requisitosJson = requisitos;
    if (typeof requisitos === 'object' && requisitos !== null) {
      requisitosJson = JSON.stringify(requisitos);
    }
    
    let result;
    if (hasQuantidadeVagas) {
      // Se a coluna existe, usar ela
      result = await pool.query(
        'UPDATE cargos SET nome_cargo = $1, area_id = $2, requisitos = $3, quantidade_vagas = $4 WHERE id = $5 RETURNING id, nome_cargo, area_id, requisitos',
        [nome_cargo, area_id, requisitosJson, quantidade_vagas, id]
      );
    } else {
      // Se não existe, usar apenas as colunas básicas
      result = await pool.query(
        'UPDATE cargos SET nome_cargo = $1, area_id = $2, requisitos = $3 WHERE id = $4 RETURNING id, nome_cargo, area_id, requisitos',
        [nome_cargo, area_id, requisitosJson, id]
      );
    }
    
    if (result.rows.length > 0) {
      console.log('✅ Cargo atualizado:', result.rows[0]);
    res.json(result.rows[0]);
    } else {
      res.status(404).json({ error: 'Cargo não encontrado' });
    }
  } catch (error) {
    console.error('❌ Erro ao atualizar cargo:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para deletar cargo
app.delete('/api/cargos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`🗑️ Deletando cargo ${id}...`);
    
    const result = await pool.query('DELETE FROM cargos WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length > 0) {
      console.log('✅ Cargo deletado:', result.rows[0]);
      res.json({ message: 'Cargo deletado com sucesso' });
    } else {
      res.status(404).json({ error: 'Cargo não encontrado' });
    }
  } catch (error) {
    console.error('❌ Erro ao deletar cargo:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para deletar área
app.delete('/api/areas/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🗑️ Deletando área ${id}...`);
    
    const result = await pool.query('DELETE FROM areas WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length > 0) {
      console.log('✅ Área deletada:', result.rows[0]);
      res.json({ message: 'Área deletada com sucesso' });
    } else {
      console.log('❌ Área não encontrada para deletar:', id);
      res.status(404).json({ error: 'Área não encontrada' });
    }
  } catch (error) {
    console.error('❌ Erro ao deletar área:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});



// Rota para buscar status do currículo
app.get('/api/users/curriculum/:username/status', async (req, res) => {
  try {
    const { username } = req.params;
    console.log(`📄 Buscando status do currículo para: ${username}`);
    
    // Simular status do currículo
    res.json({ 
      hasCurriculum: false, 
      lastUpdated: null,
      status: 'not_uploaded'
    });
  } catch (error) {
    console.error('❌ Erro ao buscar status do currículo:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para buscar currículo
app.get('/api/users/curriculum/:username', async (req, res) => {
  try {
    const { username } = req.params;
    console.log(`📄 Buscando currículo para: ${username}`);
    
    res.status(404).json({ error: 'Currículo não encontrado' });
  } catch (error) {
    console.error('❌ Erro ao buscar currículo:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para atualizar currículo
app.put('/api/users/curriculum/:username', async (req, res) => {
  try {
    const { username } = req.params;
    console.log(`📄 Atualizando currículo para: ${username}`);
    
    res.json({ message: 'Currículo atualizado com sucesso' });
  } catch (error) {
    console.error('❌ Erro ao atualizar currículo:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para deletar currículo
app.delete('/api/users/curriculum/:username', async (req, res) => {
  try {
    const { username } = req.params;
    console.log(`📄 Deletando currículo para: ${username}`);
    
    res.json({ message: 'Currículo deletado com sucesso' });
  } catch (error) {
    console.error('❌ Erro ao deletar currículo:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para atualizar display name
app.put('/api/users/display-name/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const { displayName } = req.body;
    console.log(`👤 Atualizando display name para ${username}: ${displayName}`);
    
    res.json({ 
      username,
      displayName,
      message: 'Display name atualizado com sucesso'
    });
  } catch (error) {
    console.error('❌ Erro ao atualizar display name:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para criar posições
app.post('/api/positions', async (req, res) => {
  try {
    const { nome, area_id } = req.body;
    console.log(`🏢 Criando posição: ${nome} na área ${area_id}`);
    
    res.status(201).json({ 
      id: Date.now(),
      nome,
      area_id,
      message: 'Posição criada com sucesso'
    });
  } catch (error) {
    console.error('❌ Erro ao criar posição:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para buscar áreas
app.get('/api/areas', async (req, res) => {
  try {
    console.log('🏢 Buscando áreas...');
    
    const result = await pool.query('SELECT id, nome FROM areas ORDER BY nome');
    
    console.log(`✅ Encontradas ${result.rows.length} áreas`);
    console.log('📊 Áreas:', result.rows);
    
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Erro ao buscar áreas:', error);
    console.error('❌ Stack trace:', error.stack);
    res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
  }
});

// Rota para buscar uma área específica
app.get('/api/areas/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query('SELECT id, nome FROM areas WHERE id = $1', [id]);
    
    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ error: 'Área não encontrada' });
    }
  } catch (error) {
    console.error('Erro ao buscar área:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para criar área
app.post('/api/areas', async (req, res) => {
  try {
    console.log('🏢 Criando área:', req.body);
    const { nome } = req.body;
    
    const result = await pool.query(
      'INSERT INTO areas (nome) VALUES ($1) RETURNING id, nome',
      [nome]
    );
    
    console.log('✅ Área criada:', result.rows[0]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('❌ Erro ao criar área:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para atualizar área
app.put('/api/areas/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nome } = req.body;
    
    console.log(`🏢 Atualizando área ${id}:`, req.body);
    
    const result = await pool.query(
      'UPDATE areas SET nome = $1 WHERE id = $2 RETURNING id, nome',
      [nome, id]
    );
    
    if (result.rows.length > 0) {
      console.log('✅ Área atualizada:', result.rows[0]);
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ error: 'Área não encontrada' });
    }
  } catch (error) {
    console.error('❌ Erro ao atualizar área:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para deletar área
app.delete('/api/areas/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`🗑️ Deletando área ${id}...`);
    
    // Primeiro deletar todos os cargos da área
    await pool.query('DELETE FROM cargos WHERE area_id = $1', [id]);
    console.log('✅ Cargos da área deletados');
    
    // Depois deletar a área
    const result = await pool.query('DELETE FROM areas WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length > 0) {
      console.log('✅ Área deletada:', result.rows[0]);
      res.json({ message: 'Área e cargos associados deletados com sucesso' });
    } else {
      res.status(404).json({ error: 'Área não encontrada' });
    }
  } catch (error) {
    console.error('❌ Erro ao deletar área:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para buscar cursos
app.get('/api/cursos', async (req, res) => {
  try {
    console.log('📚 Buscando cursos...');
    
    // Verificar se a tabela cursos existe
    const tableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'cursos'
      );
    `);
    
    if (!tableExists.rows[0].exists) {
      console.log('❌ Tabela cursos não existe, criando...');
      
      // Criar tabela cursos com nomes corretos
      await pool.query(`
        CREATE TABLE IF NOT EXISTS cursos (
          id SERIAL PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          platform VARCHAR(100),
          url TEXT,
          area VARCHAR(100),
          level VARCHAR(50),
          duration VARCHAR(50),
          description TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      
      console.log('✅ Tabela cursos criada');
    }
    

    
    // Query corrigida para usar os nomes corretos das colunas
    const query = `
      SELECT 
        id,
        title,
        platform,
        url,
        area,
        level,
        duration,
        description
      FROM cursos 
      ORDER BY id DESC
    `;
    
    const result = await pool.query(query);
    
    console.log(`✅ Encontrados ${result.rows.length} cursos`);
    
    console.log('📊 Primeiros 3 cursos:', result.rows.slice(0, 3));
    
    // Se não há cursos, retornar array vazio
    if (result.rows.length === 0) {
      console.log('📚 Nenhum curso encontrado no banco');
      res.json([]);
    } else {
      res.json(result.rows);
    }
  } catch (error) {
    console.error('❌ Erro ao buscar cursos:', error);
    console.error('❌ Stack trace:', error.stack);
    res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
  }
});

// Rota para buscar um curso específico
app.get('/api/cursos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📚 Buscando curso ${id}...`);
    
    const query = `
      SELECT 
        id,
        title,
        platform,
        url,
        area,
        level,
        duration,
        description
      FROM cursos 
      WHERE id = $1
    `;
    
    const result = await pool.query(query, [id]);
    
    if (result.rows.length > 0) {
      console.log('✅ Curso encontrado:', result.rows[0]);
      res.json(result.rows[0]);
    } else {
      console.log('❌ Curso não encontrado:', id);
      res.status(404).json({ error: 'Curso não encontrado' });
    }
  } catch (error) {
    console.error('❌ Erro ao buscar curso:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para criar curso
app.post('/api/cursos', async (req, res) => {
  try {
    let { title, platform, url, area, level, duration, description } = req.body;
    
    console.log('📝 Criando novo curso:', { title, platform, url, area, level, duration, description });
    
    // Converter area (ID) para nome
    let categoria = 'Geral';
    if (area) {
      if (!isNaN(Number(area))) {
        console.log('🔍 Buscando nome da área por ID:', area);
        const areaResult = await pool.query('SELECT nome FROM areas WHERE id = $1', [area]);
        if (areaResult.rows.length > 0) {
          categoria = areaResult.rows[0].nome;
          console.log('✅ Nome da área encontrado:', categoria);
        } else {
          console.log('⚠️ Área não encontrada, usando padrão');
        }
      } else if (typeof area === 'string') {
        categoria = area;
        console.log('✅ Usando nome da área diretamente:', categoria);
      }
    }
    
    // Query corrigida para usar os nomes corretos das colunas
    const query = `
      INSERT INTO cursos (title, platform, url, area, level, duration, description)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, title, platform, url, area, level, duration, description
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
    
    console.log('🔍 Query de inserção:', query);
    console.log('📋 Valores:', values);
    
    const result = await pool.query(query, values);
    console.log('✅ Curso criado com sucesso:', result.rows[0]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('❌ Erro ao criar curso:', error);
    console.error('❌ Stack trace:', error.stack);
    res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
  }
});

// Rota para atualizar curso
app.put('/api/cursos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    let { title, platform, url, area, level, duration, description } = req.body;
    
    console.log(`📝 Atualizando curso ${id}:`, { title, platform, url, area, level, duration, description });
    
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
    
    // Query corrigida para usar os nomes corretos das colunas
    const query = `
      UPDATE cursos SET
        title = $1,
        platform = $2,
        url = $3,
        area = $4,
        level = $5,
        duration = $6,
        description = $7
      WHERE id = $8
      RETURNING *
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
    
    console.log('🔍 Query de atualização:', query);
    console.log('📋 Valores:', values);
    
    const result = await pool.query(query, values);
    
    if (result.rows.length > 0) {
      console.log('✅ Curso atualizado com sucesso:', result.rows[0]);
      res.json(result.rows[0]);
    } else {
      console.log('❌ Curso não encontrado para atualização:', id);
      res.status(404).json({ error: 'Curso não encontrado' });
    }
  } catch (error) {
    console.error('❌ Erro ao atualizar curso:', error);
    console.error('❌ Stack trace:', error.stack);
    res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
  }
});

// Rota para deletar curso
app.delete('/api/cursos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🗑️ Deletando curso ${id}...`);
    
    // Primeiro verificar se o curso existe
    const checkResult = await pool.query('SELECT * FROM cursos WHERE id = $1', [id]);
    if (checkResult.rows.length === 0) {
      console.log('❌ Curso não encontrado para deletar:', id);
      return res.status(404).json({ error: 'Curso não encontrado' });
    }
    
    console.log('✅ Curso encontrado para deletar:', checkResult.rows[0]);
    
    const result = await pool.query('DELETE FROM cursos WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length > 0) {
      console.log('✅ Curso deletado com sucesso:', result.rows[0]);
      res.json({ message: 'Curso deletado com sucesso' });
    } else {
      console.log('❌ Erro: Nenhuma linha foi deletada');
      res.status(500).json({ error: 'Falha na deleção' });
    }
  } catch (error) {
    console.error('❌ Erro ao deletar curso:', error);
    console.error('❌ Stack trace:', error.stack);
    res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
  }
});

// Rota para buscar certificados
app.get('/api/certificados', async (req, res) => {
  try {
    console.log('🏆 Buscando certificados...');
    
    // Verificar quais colunas existem na tabela certificados
    console.log('🔍 Verificando colunas da tabela certificados para listagem...');
    const columnsCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'certificados'
      ORDER BY ordinal_position
    `);
    
    const existingColumns = columnsCheck.rows.map(row => row.column_name);
    console.log('🔍 Colunas existentes para listagem:', existingColumns);
    
    // Construir query adaptativa baseada nas colunas existentes
    let selectColumns = ['id', 'usuario_id', 'nome', 'instituicao'];
    
    if (existingColumns.includes('data_inicio')) {
      selectColumns.push('data_inicio');
    }
    
    if (existingColumns.includes('data_conclusao')) {
      selectColumns.push('data_conclusao');
    }
    
    if (existingColumns.includes('descricao')) {
      selectColumns.push('descricao');
    }
    
    if (existingColumns.includes('pdf')) {
      selectColumns.push('pdf');
    }
    
    const query = `SELECT ${selectColumns.join(', ')} FROM certificados ORDER BY ${existingColumns.includes('data_conclusao') ? 'data_conclusao DESC' : 'id DESC'}`;
    console.log('🔍 Query de listagem adaptativa:', query);
    
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
    
    // Validar userId
    if (!userId || isNaN(userId)) {
      console.log('❌ userId inválido:', userId);
      return res.status(400).json({ error: 'ID de usuário inválido' });
    }
    
    // Teste simples primeiro
    console.log('🔍 Testando conexão básica...');
    const testResult = await pool.query('SELECT 1 as test');
    console.log('✅ Teste básico OK:', testResult.rows[0]);
    
    // Verificar se a tabela existe
    console.log('🔍 Verificando tabela certificados...');
    const tableCheck = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'certificados'
    `);
    
    console.log('🔍 Tabelas encontradas:', tableCheck.rows);
    
    if (tableCheck.rows.length === 0) {
      console.log('❌ Tabela certificados não existe, criando...');
      
      // Criar tabela certificados
      await pool.query(`
        CREATE TABLE IF NOT EXISTS certificados (
          id SERIAL PRIMARY KEY,
          nome VARCHAR(255) NOT NULL,
          instituicao VARCHAR(255) NOT NULL,
          data_conclusao DATE,
          descricao TEXT,
          usuario_id INTEGER,
          pdf BYTEA,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      
      console.log('✅ Tabela certificados criada');
      return res.json([]);
    }
    
    // Verificar quais colunas existem na tabela certificados
    console.log('🔍 Verificando colunas da tabela certificados...');
    const columnsCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'certificados'
      ORDER BY ordinal_position
    `);
    
    const existingColumns = columnsCheck.rows.map(row => row.column_name);
    console.log('🔍 Colunas existentes:', existingColumns);
    
    // Construir query adaptativa baseada nas colunas existentes
    let selectColumns = ['id', 'usuario_id', 'nome', 'instituicao'];
    
    if (existingColumns.includes('data_inicio')) {
      selectColumns.push('data_inicio');
    }
    
    if (existingColumns.includes('data_conclusao')) {
      selectColumns.push('data_conclusao');
    }
    
    if (existingColumns.includes('descricao')) {
      selectColumns.push('descricao');
    }
    
    if (existingColumns.includes('pdf')) {
      selectColumns.push('pdf');
    }
    
    const query = `SELECT ${selectColumns.join(', ')} FROM certificados WHERE usuario_id = $1 ORDER BY ${existingColumns.includes('data_conclusao') ? 'data_conclusao DESC' : 'id DESC'}`;
    const params = [parseInt(userId)];
    
    console.log('🔍 Executando query adaptativa:', query, 'Params:', params);
    
    const result = await pool.query(query, params);
    
    console.log(`✅ Encontrados ${result.rows.length} certificados`);
    res.json(result.rows);
    
  } catch (error) {
    console.error('❌ Erro na rota de certificados:', error);
    console.error('❌ Stack:', error.stack);
    console.error('❌ Error name:', error.name);
    console.error('❌ Error code:', error.code);
    console.error('❌ Error detail:', error.detail);
    res.status(500).json({ 
      error: 'Erro interno do servidor', 
      details: error.message,
      stack: error.stack 
    });
  }
});

// Rota para criar certificado
app.post('/api/certificados', upload.single('pdf'), async (req, res) => {
  try {
    console.log('🏆 Criando certificado...', req.body);
    
    // Extrair dados do FormData ou JSON
    const nome = req.body.nome;
    const instituicao = req.body.instituicao;
    const data_conclusao = req.body.data_conclusao;
    const descricao = req.body.descricao;
    const usuario_id = req.body.usuario_id;
    
    console.log('📋 Dados recebidos:', { nome, instituicao, data_conclusao, descricao, usuario_id });
    console.log('📄 Arquivo PDF recebido:', req.file ? 'Sim' : 'Não');
    if (req.file) {
      console.log('📄 Detalhes do arquivo:', {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
      });
    }
    
    // Validar dados obrigatórios
    if (!nome || !instituicao || !usuario_id) {
      console.log('❌ Dados obrigatórios faltando:', { nome, instituicao, usuario_id });
      return res.status(400).json({ error: 'Nome, instituição e ID do usuário são obrigatórios' });
    }
    
    // Verificar se a tabela certificados existe
    const tableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'certificados'
      );
    `);
    
    if (!tableExists.rows[0].exists) {
      console.log('❌ Tabela certificados não existe, criando...');
      
      // Criar tabela certificados
      await pool.query(`
        CREATE TABLE IF NOT EXISTS certificados (
          id SERIAL PRIMARY KEY,
          nome VARCHAR(255) NOT NULL,
          instituicao VARCHAR(255) NOT NULL,
          data_conclusao DATE,
          descricao TEXT,
          usuario_id INTEGER,
          pdf BYTEA,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      
      console.log('✅ Tabela certificados criada');
    }
    
    // Verificar quais colunas existem na tabela certificados
    console.log('🔍 Verificando colunas da tabela certificados para inserção...');
    const columnsCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'certificados'
      ORDER BY ordinal_position
    `);
    
    const existingColumns = columnsCheck.rows.map(row => row.column_name);
    console.log('🔍 Colunas existentes para inserção:', existingColumns);
    
    // Construir query adaptativa baseada nas colunas existentes
    let query = '';
    let params = [];
    
    // Definir data_inicio padrão se não fornecida
    const data_inicio = req.body.data_inicio || data_conclusao || new Date().toISOString().split('T')[0];
    
    if (req.file && existingColumns.includes('pdf')) {
      // Query com PDF
      if (existingColumns.includes('data_inicio') && existingColumns.includes('data_conclusao')) {
        query = 'INSERT INTO certificados (nome, instituicao, data_inicio, data_conclusao, usuario_id, pdf) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *';
        params = [nome, instituicao, data_inicio, data_conclusao, parseInt(usuario_id), req.file.buffer];
      } else if (existingColumns.includes('data_inicio')) {
        query = 'INSERT INTO certificados (nome, instituicao, data_inicio, usuario_id, pdf) VALUES ($1, $2, $3, $4, $5) RETURNING *';
        params = [nome, instituicao, data_inicio, parseInt(usuario_id), req.file.buffer];
      } else if (existingColumns.includes('data_conclusao')) {
        query = 'INSERT INTO certificados (nome, instituicao, data_conclusao, usuario_id, pdf) VALUES ($1, $2, $3, $4, $5) RETURNING *';
        params = [nome, instituicao, data_conclusao, parseInt(usuario_id), req.file.buffer];
      } else {
        query = 'INSERT INTO certificados (nome, instituicao, usuario_id, pdf) VALUES ($1, $2, $3, $4) RETURNING *';
        params = [nome, instituicao, parseInt(usuario_id), req.file.buffer];
      }
    } else {
      // Query sem PDF
      if (existingColumns.includes('data_inicio') && existingColumns.includes('data_conclusao')) {
        query = 'INSERT INTO certificados (nome, instituicao, data_inicio, data_conclusao, usuario_id) VALUES ($1, $2, $3, $4, $5) RETURNING *';
        params = [nome, instituicao, data_inicio, data_conclusao, parseInt(usuario_id)];
      } else if (existingColumns.includes('data_inicio')) {
        query = 'INSERT INTO certificados (nome, instituicao, data_inicio, usuario_id) VALUES ($1, $2, $3, $4) RETURNING *';
        params = [nome, instituicao, data_inicio, parseInt(usuario_id)];
      } else if (existingColumns.includes('data_conclusao')) {
        query = 'INSERT INTO certificados (nome, instituicao, data_conclusao, usuario_id) VALUES ($1, $2, $3, $4) RETURNING *';
        params = [nome, instituicao, data_conclusao, parseInt(usuario_id)];
      } else {
        query = 'INSERT INTO certificados (nome, instituicao, usuario_id) VALUES ($1, $2, $3) RETURNING *';
        params = [nome, instituicao, parseInt(usuario_id)];
      }
    }
    
    console.log('🔍 Query de inserção:', query, 'Params:', params);
    
    const result = await pool.query(query, params);
    
    console.log('✅ Certificado criado:', result.rows[0]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('❌ Erro ao criar certificado:', error);
    console.error('❌ Stack trace:', error.stack);
    console.error('❌ Error name:', error.name);
    console.error('❌ Error code:', error.code);
    console.error('❌ Error detail:', error.detail);
    res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
  }
});

// Rota para atualizar certificado
app.put('/api/certificados/:id', upload.single('pdf'), async (req, res) => {
  try {
    const { id } = req.params;
    const nome = req.body.nome;
    const instituicao = req.body.instituicao;
    const data_conclusao = req.body.data_conclusao;
    const descricao = req.body.descricao;
    
    console.log(`🏆 Atualizando certificado ID: ${id}`, req.body);
    
    // Validar dados obrigatórios
    if (!nome || !instituicao) {
      console.log('❌ Dados obrigatórios faltando:', { nome, instituicao });
      return res.status(400).json({ error: 'Nome e instituição são obrigatórios' });
    }
    
    // Verificar quais colunas existem na tabela certificados
    console.log('🔍 Verificando colunas da tabela certificados para atualização...');
    const columnsCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'certificados'
      ORDER BY ordinal_position
    `);
    
    const existingColumns = columnsCheck.rows.map(row => row.column_name);
    console.log('🔍 Colunas existentes para atualização:', existingColumns);
    
    // Construir query adaptativa baseada nas colunas existentes
    let query = '';
    let params = [];
    
    // Definir data_inicio padrão se não fornecida
    const data_inicio = req.body.data_inicio || data_conclusao || new Date().toISOString().split('T')[0];
    
    if (req.file && existingColumns.includes('pdf')) {
      // Query com PDF
      if (existingColumns.includes('data_inicio') && existingColumns.includes('data_conclusao')) {
        query = 'UPDATE certificados SET nome = $1, instituicao = $2, data_inicio = $3, data_conclusao = $4, pdf = $5 WHERE id = $6 RETURNING *';
        params = [nome, instituicao, data_inicio, data_conclusao, req.file.buffer, parseInt(id)];
      } else if (existingColumns.includes('data_inicio')) {
        query = 'UPDATE certificados SET nome = $1, instituicao = $2, data_inicio = $3, pdf = $4 WHERE id = $5 RETURNING *';
        params = [nome, instituicao, data_inicio, req.file.buffer, parseInt(id)];
      } else if (existingColumns.includes('data_conclusao')) {
        query = 'UPDATE certificados SET nome = $1, instituicao = $2, data_conclusao = $3, pdf = $4 WHERE id = $5 RETURNING *';
        params = [nome, instituicao, data_conclusao, req.file.buffer, parseInt(id)];
      } else {
        query = 'UPDATE certificados SET nome = $1, instituicao = $2, pdf = $3 WHERE id = $4 RETURNING *';
        params = [nome, instituicao, req.file.buffer, parseInt(id)];
      }
    } else {
      // Query sem PDF
      if (existingColumns.includes('data_inicio') && existingColumns.includes('data_conclusao')) {
        query = 'UPDATE certificados SET nome = $1, instituicao = $2, data_inicio = $3, data_conclusao = $4 WHERE id = $5 RETURNING *';
        params = [nome, instituicao, data_inicio, data_conclusao, parseInt(id)];
      } else if (existingColumns.includes('data_inicio')) {
        query = 'UPDATE certificados SET nome = $1, instituicao = $2, data_inicio = $3 WHERE id = $4 RETURNING *';
        params = [nome, instituicao, data_inicio, parseInt(id)];
      } else if (existingColumns.includes('data_conclusao')) {
        query = 'UPDATE certificados SET nome = $1, instituicao = $2, data_conclusao = $3 WHERE id = $4 RETURNING *';
        params = [nome, instituicao, data_conclusao, parseInt(id)];
      } else {
        query = 'UPDATE certificados SET nome = $1, instituicao = $2 WHERE id = $3 RETURNING *';
        params = [nome, instituicao, parseInt(id)];
      }
    }
    
    console.log('🔍 Query de atualização:', query, 'Params:', params);
    
    const result = await pool.query(query, params);
    
    if (result.rows.length > 0) {
      console.log('✅ Certificado atualizado:', result.rows[0]);
      res.json(result.rows[0]);
    } else {
      console.log('❌ Certificado não encontrado para atualização:', id);
      res.status(404).json({ error: 'Certificado não encontrado' });
    }
  } catch (error) {
    console.error('❌ Erro ao atualizar certificado:', error);
    console.error('❌ Stack trace:', error.stack);
    console.error('❌ Error name:', error.name);
    console.error('❌ Error code:', error.code);
    console.error('❌ Error detail:', error.detail);
    res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
  }
});

// Rota para buscar certificado por ID
app.get('/api/certificados/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🏆 Buscando certificado ID: ${id}`);
    
    // Validar ID
    if (!id || isNaN(id)) {
      console.log('❌ ID inválido:', id);
      return res.status(400).json({ error: 'ID inválido' });
    }
    
    // Verificar quais colunas existem na tabela certificados
    console.log('🔍 Verificando colunas da tabela certificados para busca...');
    const columnsCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'certificados'
      ORDER BY ordinal_position
    `);
    
    const existingColumns = columnsCheck.rows.map(row => row.column_name);
    console.log('🔍 Colunas existentes para busca:', existingColumns);
    
    // Construir query adaptativa baseada nas colunas existentes
    let selectColumns = ['id', 'usuario_id', 'nome', 'instituicao'];
    
    if (existingColumns.includes('data_inicio')) {
      selectColumns.push('data_inicio');
    }
    
    if (existingColumns.includes('data_conclusao')) {
      selectColumns.push('data_conclusao');
    }
    
    if (existingColumns.includes('descricao')) {
      selectColumns.push('descricao');
    }
    
    if (existingColumns.includes('pdf')) {
      selectColumns.push('pdf');
    }
    
    const query = `SELECT ${selectColumns.join(', ')} FROM certificados WHERE id = $1`;
    const params = [parseInt(id)];
    
    console.log('🔍 Query de busca adaptativa:', query, 'Params:', params);
    
    const result = await pool.query(query, params);
    
    if (result.rows.length > 0) {
      console.log('✅ Certificado encontrado:', result.rows[0]);
      res.json(result.rows[0]);
    } else {
      console.log('❌ Certificado não encontrado:', id);
      res.status(404).json({ error: 'Certificado não encontrado' });
    }
  } catch (error) {
    console.error('❌ Erro ao buscar certificado:', error);
    console.error('❌ Stack trace:', error.stack);
    console.error('❌ Error name:', error.name);
    console.error('❌ Error code:', error.code);
    console.error('❌ Error detail:', error.detail);
    res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
  }
});

// Rota para buscar PDF do certificado
app.get('/api/certificados/:id/pdf', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📄 Buscando PDF do certificado ID: ${id}`);
    
    // Validar ID
    if (!id || isNaN(id)) {
      console.log('❌ ID inválido:', id);
      return res.status(400).json({ error: 'ID inválido' });
    }
    
    // Verificar quais colunas existem na tabela certificados
    console.log('🔍 Verificando colunas da tabela certificados para PDF...');
    const columnsCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'certificados'
      ORDER BY ordinal_position
    `);
    
    const existingColumns = columnsCheck.rows.map(row => row.column_name);
    console.log('🔍 Colunas existentes para PDF:', existingColumns);
    
    // Construir query adaptativa baseada nas colunas existentes
    let selectColumns = ['nome'];
    
    if (existingColumns.includes('pdf')) {
      selectColumns.push('pdf');
    }
    
    const query = `SELECT ${selectColumns.join(', ')} FROM certificados WHERE id = $1`;
    const params = [parseInt(id)];
    
    console.log('🔍 Query de PDF adaptativa:', query, 'Params:', params);
    
    const certResult = await pool.query(query, params);
    
    if (certResult.rows.length === 0) {
      console.log('❌ Certificado não encontrado:', id);
      return res.status(404).json({ error: 'Certificado não encontrado' });
    }
    
    const certificado = certResult.rows[0];
    
    if (!certificado.pdf) {
      console.log('❌ Certificado não tem PDF anexado:', id);
      return res.status(404).json({ error: 'PDF não encontrado' });
    }
    
    // Retornar o PDF como blob
    console.log('✅ PDF encontrado para certificado:', certificado.nome);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${certificado.nome}.pdf"`);
    res.send(certificado.pdf);
    
  } catch (error) {
    console.error('❌ Erro ao buscar PDF:', error);
    console.error('❌ Stack trace:', error.stack);
    console.error('❌ Error name:', error.name);
    console.error('❌ Error code:', error.code);
    console.error('❌ Error detail:', error.detail);
    res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
  }
});

// Rota para deletar certificado
app.delete('/api/certificados/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🗑️ Deletando certificado ID: ${id}`);
    
    // Validar ID
    if (!id || isNaN(id)) {
      console.log('❌ ID inválido:', id);
      return res.status(400).json({ error: 'ID inválido' });
    }
    
    const query = 'DELETE FROM certificados WHERE id = $1 RETURNING *';
    const params = [parseInt(id)];
    
    console.log('🔍 Query de deleção:', query, 'Params:', params);
    
    const result = await pool.query(query, params);
    
    if (result.rows.length > 0) {
      console.log('✅ Certificado deletado:', result.rows[0]);
      res.json({ message: 'Certificado deletado com sucesso' });
    } else {
      console.log('❌ Certificado não encontrado para deleção:', id);
      res.status(404).json({ error: 'Certificado não encontrado' });
    }
  } catch (error) {
    console.error('❌ Erro ao deletar certificado:', error);
    console.error('❌ Stack trace:', error.stack);
    console.error('❌ Error name:', error.name);
    console.error('❌ Error code:', error.code);
    console.error('❌ Error detail:', error.detail);
    res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
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

// Rota catch-all para arquivos estáticos (apenas para rotas que não começam com /api)
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return next();
  }
  console.log('📁 Rota catch-all servindo index.html para:', req.path);
  res.sendFile(path.join(__dirname, '..', 'index.html'), (err) => {
    if (err) {
      console.error('❌ Erro ao servir arquivo estático:', err);
      res.status(404).send('Arquivo não encontrado');
    }
  });
});

// Tratamento de erros global
app.use((error, req, res, next) => {
  console.error('❌ Erro global não tratado:', error);
  console.error('❌ Stack trace:', error.stack);
  res.status(500).json({ 
    error: 'Erro interno do servidor', 
    details: error.message 
  });
});

// Iniciar servidor
if (require.main === module) {
  const server = app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`📁 Servindo arquivos estáticos de: ${path.join(__dirname, '..')}`);
  });
  
  // Tratamento de erros do servidor
  server.on('error', (error) => {
    console.error('❌ Erro no servidor:', error);
  });
}

// Exportar para Vercel/Railway
module.exports = app; 