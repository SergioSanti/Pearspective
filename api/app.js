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

// Configuração do banco de dados Railway
console.log('🚂 Configurando banco Railway...');
console.log('🔍 Ambiente:', process.env.NODE_ENV || 'production');
console.log('🔍 DATABASE_URL configurada:', !!process.env.DATABASE_URL);

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL não configurada! O sistema requer conexão com Railway.');
  process.exit(1);
}

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

// Teste de conexão e inicialização das tabelas
pool.query('SELECT NOW()', async (err, res) => {
  if (err) {
    console.error('❌ Erro ao conectar com o banco:', err);
    console.error('❌ DATABASE_URL:', process.env.DATABASE_URL ? 'Configurada' : 'Não configurada');
        } else {
    console.log('✅ Conectado ao banco de dados PostgreSQL');
    console.log('🔍 Configuração do banco:', {
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      ssl: 'Habilitado'
    });
    
    // Verificar e criar tabelas necessárias
    try {
      console.log('🔧 Verificando tabelas necessárias...');
      
      // Verificar se a tabela curriculos existe
      const curriculumTableExists = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'curriculos'
        );
      `);
      
      if (!curriculumTableExists.rows[0].exists) {
        console.log('❌ Tabela curriculos não existe, criando...');
        
        // Criar tabela curriculos
        await pool.query(`
          CREATE TABLE curriculos (
            id SERIAL PRIMARY KEY,
            usuario_nome VARCHAR(100) NOT NULL,
            nome_arquivo VARCHAR(255) NOT NULL,
            tipo_mime VARCHAR(100) NOT NULL,
            tamanho BIGINT NOT NULL,
            dados BYTEA NOT NULL,
            data_upload TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
        `);
        
        console.log('✅ Tabela curriculos criada com sucesso');
      } else {
        console.log('✅ Tabela curriculos já existe');
      }
      
      // Verificar se a tabela usuarios existe
      const usuariosTableExists = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'usuarios'
        );
      `);
      
      if (!usuariosTableExists.rows[0].exists) {
        console.log('❌ Tabela usuarios não existe, criando...');
        
        // Criar tabela usuarios
        await pool.query(`
          CREATE TABLE usuarios (
            id SERIAL PRIMARY KEY,
            nome VARCHAR(100) UNIQUE NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            senha VARCHAR(255) NOT NULL,
            tipo_usuario VARCHAR(50) DEFAULT 'usuario',
            foto_perfil TEXT,
            departamento VARCHAR(100),
            cargo_atual VARCHAR(100),
            nome_exibicao VARCHAR(100),
            data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
        `);
        
        console.log('✅ Tabela usuarios criada');
      } else {
        console.log('✅ Tabela usuarios já existe');
        
        // Verificar se a coluna nome_exibicao existe
        const nomeExibicaoExists = await pool.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'usuarios' 
            AND column_name = 'nome_exibicao'
          );
        `);
        
        if (!nomeExibicaoExists.rows[0].exists) {
          console.log('❌ Coluna nome_exibicao não existe, criando...');
          await pool.query('ALTER TABLE usuarios ADD COLUMN nome_exibicao VARCHAR(100)');
          console.log('✅ Coluna nome_exibicao criada');
        } else {
          console.log('✅ Coluna nome_exibicao já existe');
        }
      }
      
      // Verificar se os usuários padrão existem
      const adminExists = await pool.query('SELECT id FROM usuarios WHERE nome = $1', ['admin']);
      const sergioExists = await pool.query('SELECT id FROM usuarios WHERE nome = $1', ['sergio']);
      
      if (adminExists.rows.length === 0) {
        console.log('👤 Criando usuário admin...');
        await pool.query(`
          INSERT INTO usuarios (nome, email, senha, tipo_usuario) 
          VALUES ($1, $2, $3, $4)
        `, ['admin', 'admin@example.com', 'Admin123', 'admin']);
      }
      
      if (sergioExists.rows.length === 0) {
        console.log('👤 Criando usuário sergio...');
        await pool.query(`
          INSERT INTO usuarios (nome, email, senha, tipo_usuario) 
          VALUES ($1, $2, $3, $4)
        `, ['sergio', 'sergio@example.com', '12345', 'usuario']);
      }
      
      console.log('✅ Inicialização das tabelas concluída');
      
    } catch (error) {
      console.error('❌ Erro ao inicializar tabelas:', error);
    }
  }
});

// Rota de teste
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend funcionando!' });
});

// Rota de teste de banco
app.get('/api/test-db', async (req, res) => {
  try {
    console.log('🔍 Testando conexão com banco Railway...');
    const result = await pool.query('SELECT NOW() as current_time, version() as db_version');
    console.log('✅ Teste de banco OK:', result.rows[0]);
    res.json({ 
      message: 'Conexão com banco Railway OK!',
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
    console.log('🔍 Listando tabelas do Railway...');
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
    message: 'Servidor Railway funcionando',
    mode: 'railway',
    hasDatabase: true
  });
});

// Rota para garantir que os usuários padrão existam
app.get('/api/ensure-users', async (req, res) => {
  try {
    console.log('🔧 Verificando e criando usuários padrão no Railway...');
    
    // Verificar se a tabela usuarios existe
    const tableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'usuarios'
      );
    `);
    
    if (!tableExists.rows[0].exists) {
      console.log('❌ Tabela usuarios não existe, criando...');
      
      // Criar tabela usuarios
      await pool.query(`
        CREATE TABLE usuarios (
          id SERIAL PRIMARY KEY,
          nome VARCHAR(100) UNIQUE NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          senha VARCHAR(255) NOT NULL,
          tipo_usuario VARCHAR(50) DEFAULT 'usuario',
          foto_perfil TEXT,
          departamento VARCHAR(100),
          cargo_atual VARCHAR(100),
          data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      
      console.log('✅ Tabela usuarios criada');
    }
    
    // Verificar se a tabela curriculos existe
    const curriculumTableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'curriculos'
      );
    `);
    
    if (!curriculumTableExists.rows[0].exists) {
      console.log('❌ Tabela curriculos não existe, criando...');
      
      // Criar tabela curriculos (sem foreign key para evitar problemas)
      await pool.query(`
        CREATE TABLE curriculos (
          id SERIAL PRIMARY KEY,
          usuario_nome VARCHAR(100) NOT NULL,
          nome_arquivo VARCHAR(255) NOT NULL,
          tipo_mime VARCHAR(100) NOT NULL,
          tamanho BIGINT NOT NULL,
          dados BYTEA NOT NULL,
          data_upload TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      
      console.log('✅ Tabela curriculos criada');
    } else {
      console.log('✅ Tabela curriculos já existe');
    }
    
    // Verificar se os usuários padrão existem
    const adminExists = await pool.query('SELECT id FROM usuarios WHERE nome = $1', ['admin']);
    const sergioExists = await pool.query('SELECT id FROM usuarios WHERE nome = $1', ['sergio']);
    
    let createdUsers = [];
    
    if (adminExists.rows.length === 0) {
      console.log('👤 Criando usuário admin...');
      await pool.query(`
        INSERT INTO usuarios (nome, email, senha, tipo_usuario) 
        VALUES ($1, $2, $3, $4)
      `, ['admin', 'admin@example.com', 'Admin123', 'admin']);
      createdUsers.push('admin');
    }
    
    if (sergioExists.rows.length === 0) {
      console.log('👤 Criando usuário sergio...');
      await pool.query(`
        INSERT INTO usuarios (nome, email, senha, tipo_usuario) 
        VALUES ($1, $2, $3, $4)
      `, ['sergio', 'sergio@example.com', '12345', 'usuario']);
      createdUsers.push('sergio');
    }
    
    console.log('✅ Usuários verificados/criados:', createdUsers);
    res.json({ 
      message: 'Usuários verificados com sucesso',
      created: createdUsers,
      mode: 'railway'
    });
  } catch (error) {
    console.error('❌ Erro ao verificar usuários:', error);
    res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
  }
});

// Rota para verificar e corrigir estrutura da tabela cursos
app.get('/api/fix-cursos-table', async (req, res) => {
  try {
    console.log('🔧 Verificando estrutura da tabela cursos no Railway...');
    
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



// Rota para verificar e corrigir estrutura da tabela usuarios
app.get('/api/fix-usuarios-table', async (req, res) => {
  try {
    console.log('🔧 Verificando estrutura da tabela usuarios...');
    
    // Verificar se a tabela existe
    const tableCheck = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'usuarios'
    `);
    
    if (tableCheck.rows.length === 0) {
      console.log('❌ Tabela usuarios não existe, criando...');
      
      // Criar tabela usuarios completa
      await pool.query(`
        CREATE TABLE usuarios (
          id SERIAL PRIMARY KEY,
          nome VARCHAR(100) UNIQUE NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          senha VARCHAR(255) NOT NULL,
          tipo_usuario VARCHAR(50) DEFAULT 'usuario',
          foto_perfil TEXT,
          departamento VARCHAR(100),
          cargo_atual VARCHAR(100),
          nome_exibicao VARCHAR(100),
          data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      
      console.log('✅ Tabela usuarios criada com sucesso');
      res.json({ message: 'Tabela usuarios criada com sucesso', mode: 'railway' });
    } else {
      console.log('✅ Tabela usuarios já existe');
      
      // Verificar colunas existentes
      const columnsCheck = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'usuarios'
        ORDER BY ordinal_position
      `);
      
      console.log('📋 Colunas existentes:', columnsCheck.rows);
      
      // Verificar se nome_exibicao existe
      const hasNomeExibicao = columnsCheck.rows.some(row => row.column_name === 'nome_exibicao');
      
      if (!hasNomeExibicao) {
        console.log('❌ Coluna nome_exibicao não existe, criando...');
        await pool.query('ALTER TABLE usuarios ADD COLUMN nome_exibicao VARCHAR(100)');
        console.log('✅ Coluna nome_exibicao criada');
      }
      
      // Verificar dados dos usuários
      const usersData = await pool.query(`
        SELECT id, nome, email, tipo_usuario, departamento, cargo_atual, nome_exibicao 
        FROM usuarios 
        ORDER BY id
      `);
      
      console.log('👥 Dados dos usuários:', usersData.rows);
      
      res.json({ 
        message: 'Tabela usuarios verificada',
        columns: columnsCheck.rows,
        hasNomeExibicao: hasNomeExibicao || true,
        users: usersData.rows,
        mode: 'railway'
      });
    }
  } catch (error) {
    console.error('❌ Erro ao verificar tabela usuarios:', error);
    res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
  }
});

// Rota para definir área e cargo fixos para o Sergio
app.get('/api/fix-sergio-profile', async (req, res) => {
  try {
    console.log('🔧 Definindo área e cargo fixos para o Sergio...');
    
    // Atualizar o perfil do Sergio com área e cargo fixos
    const result = await pool.query(`
      UPDATE usuarios 
      SET departamento = 'Desenvolvimento', 
          cargo_atual = 'Desenvolvedor Full Stack',
          nome_exibicao = 'Sergio'
      WHERE nome = 'sergio'
      RETURNING id, nome, departamento, cargo_atual, nome_exibicao
    `);
    
    if (result.rows.length > 0) {
      console.log('✅ Perfil do Sergio atualizado:', result.rows[0]);
      res.json({ 
        message: 'Perfil do Sergio atualizado com sucesso',
        user: result.rows[0]
      });
    } else {
      console.log('⚠️ Usuário Sergio não encontrado');
      res.json({ 
        message: 'Usuário Sergio não encontrado',
        user: null
      });
    }
  } catch (error) {
    console.error('❌ Erro ao atualizar perfil do Sergio:', error);
    res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
  }
});



// Rota de login com banco de dados
app.post('/api/login', async (req, res) => {
  try {
    const { usuario, senha } = req.body;
    
    console.log('🔐 Tentativa de login:', { usuario, senha });
    
    // Login hardcoded que funciona
    if (usuario === 'admin' && senha === 'Admin123') {
      console.log('✅ Login admin bem-sucedido');
      
      // Limpar cookie antigo primeiro (mais robusto)
      res.clearCookie('sessionToken', { 
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });
      res.clearCookie('sessionToken', { 
        path: '/',
        httpOnly: false,
        secure: false,
        sameSite: 'lax'
      });
      
      // Gerar token de sessão com ID 1 para admin
      const sessionToken = `1-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      console.log('🔍 Token gerado para admin:', sessionToken);
      console.log('🔍 Token começa com 1-:', sessionToken.startsWith('1-'));
      console.log('🔍 Primeiros 2 caracteres do token:', sessionToken.substring(0, 2));
      
      // Configurar cookie de sessão com opções de segurança
      res.cookie('sessionToken', sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000, // 24 horas
        path: '/'
      });
      
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
      
      // Limpar cookie antigo primeiro (mais robusto)
      res.clearCookie('sessionToken', { 
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });
      res.clearCookie('sessionToken', { 
        path: '/',
        httpOnly: false,
        secure: false,
        sameSite: 'lax'
      });
      
      // Gerar token de sessão com ID 2 para sergio
      const sessionToken = `2-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      console.log('🔍 Token gerado para sergio:', sessionToken);
      console.log('🔍 Token começa com 2-:', sessionToken.startsWith('2-'));
      console.log('🔍 Primeiros 2 caracteres do token:', sessionToken.substring(0, 2));
      
      // Configurar cookie de sessão com opções de segurança
      res.cookie('sessionToken', sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000, // 24 horas
        path: '/'
      });
      
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
      cookies: req.cookies
    });
    
    if (!sessionToken) {
      console.log('❌ Nenhuma sessão encontrada');
      return res.status(401).json({ 
        authenticated: false, 
        message: 'Usuário não autenticado' 
      });
    }
    
    // Determinar qual usuário baseado no token
    let userName = '';
    let expectedUserId = null;
    
    console.log('🔍 Analisando token:', sessionToken);
    console.log('🔍 Token começa com 1-:', sessionToken.startsWith('1-'));
    console.log('🔍 Token começa com 2-:', sessionToken.startsWith('2-'));
    console.log('🔍 Token completo:', sessionToken);
    console.log('🔍 Primeiros 2 caracteres:', sessionToken.substring(0, 2));
    
    if (sessionToken.startsWith('1-')) {
      userName = 'admin';
      expectedUserId = 1;
      console.log('✅ Token identificado como ADMIN');
    } else if (sessionToken.startsWith('2-')) {
      userName = 'sergio';
      expectedUserId = 2;
      console.log('✅ Token identificado como SERGIO');
    } else {
      console.log('❌ Token inválido:', sessionToken);
      console.log('❌ Token não começa com 1- ou 2-');
      return res.status(401).json({ 
        authenticated: false, 
        message: 'Sessão inválida' 
      });
    }
    
    console.log('✅ Usuário identificado:', userName, 'ID:', expectedUserId);
    
    // Buscar dados do usuário no banco Railway PostgreSQL
    try {
      // Primeiro, verificar a estrutura da tabela usuarios
      const tableInfo = await pool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'usuarios' 
        ORDER BY ordinal_position
      `);
      
      console.log('🔍 Estrutura da tabela usuarios para /api/me:', tableInfo.rows.map(row => row.column_name));
      
      // Construir query dinamicamente baseada nas colunas existentes
      const availableColumns = tableInfo.rows.map(row => row.column_name);
      const selectColumns = [];
      
      // Adicionar colunas básicas que devem existir
      if (availableColumns.includes('id')) selectColumns.push('id');
      if (availableColumns.includes('nome')) selectColumns.push('nome');
      if (availableColumns.includes('email')) selectColumns.push('email');
      if (availableColumns.includes('tipo_usuario')) selectColumns.push('tipo_usuario');
      if (availableColumns.includes('foto_perfil')) selectColumns.push('foto_perfil');
      if (availableColumns.includes('nome_exibicao')) selectColumns.push('nome_exibicao');
      
      if (selectColumns.length === 0) {
        console.error('❌ Nenhuma coluna válida encontrada na tabela usuarios');
        throw new Error('Estrutura da tabela inválida');
      }
      
      const userQuery = `SELECT ${selectColumns.join(', ')} FROM usuarios WHERE nome = $1`;
      console.log('🔍 Query /api/me executada:', userQuery);
      
      const userResult = await pool.query(userQuery, [userName]);
      
      if (userResult.rows.length > 0) {
        const user = userResult.rows[0];
        console.log('✅ Dados do usuário encontrados no banco:', user);
        
        // Usar o ID real do banco, não o hardcoded
        const actualUserId = user.id || expectedUserId;
        console.log('🔍 ID do usuário:', { expected: expectedUserId, actual: actualUserId });
        
      res.json({
        authenticated: true,
        user: {
            id: actualUserId,
            nome: user.nome || userName,
            email: user.email || `${userName}@example.com`,
            tipo_usuario: user.tipo_usuario || 'usuario',
            foto_perfil: user.foto_perfil || null,
            nome_exibicao: user.nome_exibicao || user.nome || userName
          }
        });
      } else {
        console.log('❌ Usuário não encontrado no banco:', userName);
        // Fallback com dados básicos
        const fallbackUser = {
          id: expectedUserId,
          nome: userName,
          email: `${userName}@example.com`,
          tipo_usuario: userName === 'admin' ? 'admin' : 'usuario',
          foto_perfil: null,
          nome_exibicao: userName
        };
        
        console.log('🔄 Usando dados fallback:', fallbackUser);
      res.json({
        authenticated: true,
          user: fallbackUser
        });
        

      }
    } catch (dbError) {
      console.error('❌ Erro ao buscar usuário no banco:', dbError);
      console.error('❌ Erro ao buscar usuário no banco:', dbError);
      // Fallback com dados básicos em caso de erro no banco
      const fallbackUser = {
        id: expectedUserId,
        nome: userName,
        email: `${userName}@example.com`,
        tipo_usuario: userName === 'admin' ? 'admin' : 'usuario',
        foto_perfil: null,
        nome_exibicao: userName
      };
      
      console.log('🔄 Usando dados fallback devido a erro no banco:', fallbackUser);
      res.json({
        authenticated: true,
        user: fallbackUser
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
    
    // Limpar cookie de sessão com as mesmas opções usadas no login
    res.clearCookie('sessionToken', {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });
    
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
    
    // Primeiro, verificar a estrutura da tabela usuarios
    const tableInfo = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'usuarios' 
      ORDER BY ordinal_position
    `);
    
    console.log('🔍 Estrutura da tabela usuarios:', tableInfo.rows.map(row => row.column_name));
    
    // Construir query dinamicamente baseada nas colunas existentes
    const availableColumns = tableInfo.rows.map(row => row.column_name);
    const selectColumns = [];
    
    // Adicionar colunas básicas que devem existir
    if (availableColumns.includes('id')) selectColumns.push('id');
    if (availableColumns.includes('nome')) selectColumns.push('nome');
    if (availableColumns.includes('email')) selectColumns.push('email');
    if (availableColumns.includes('tipo_usuario')) selectColumns.push('tipo_usuario');
    if (availableColumns.includes('foto_perfil')) selectColumns.push('foto_perfil');
    if (availableColumns.includes('departamento')) selectColumns.push('departamento');
    if (availableColumns.includes('cargo_atual')) selectColumns.push('cargo_atual');
    if (availableColumns.includes('nome_exibicao')) selectColumns.push('nome_exibicao');
    if (availableColumns.includes('data_cadastro')) selectColumns.push('data_cadastro');
    
    if (selectColumns.length === 0) {
      console.error('❌ Nenhuma coluna válida encontrada na tabela usuarios');
      return res.status(500).json({ error: 'Estrutura da tabela inválida' });
    }
    
    const query = `SELECT ${selectColumns.join(', ')} FROM usuarios WHERE nome = $1`;
    console.log('🔍 Query executada:', query);
    
    const result = await pool.query(query, [username]);
    
    if (result.rows.length > 0) {
      const user = result.rows[0];
      console.log('✅ Perfil encontrado para usuário:', username);
      
      // Construir resposta com campos disponíveis
      const response = {
        id: user.id || null,
        nome: user.nome || username,
        nome_exibicao: user.nome_exibicao || user.nome || username,
        email: user.email || `${username}@example.com`,
        tipo_usuario: user.tipo_usuario || 'usuario',
        foto_perfil: user.foto_perfil || null,
        departamento: user.departamento || '',
        cargo_atual: user.cargo_atual || '',
        data_cadastro: user.data_cadastro || new Date().toISOString()
      };
      
      console.log('📊 Resposta construída:', response);
      res.json(response);
    } else {
      console.log('❌ Usuário não encontrado:', username);
      res.status(404).json({ error: 'Usuário não encontrado' });
    }
  } catch (error) {
    console.error('❌ Erro ao buscar perfil:', error);
    console.error('❌ Stack trace:', error.stack);
    res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
  }
});

// Rota para atualizar perfil do usuário
app.put('/api/users/profile/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const { departamento, cargo_atual, foto_perfil, nome_exibicao } = req.body;
    
    console.log(`👤 Atualizando perfil do usuário ${username}:`, { 
      departamento, 
      cargo_atual, 
      foto_perfil: foto_perfil ? 'Foto fornecida' : 'Sem foto',
      nome_exibicao
    });
    
    // Verificar se o usuário existe primeiro
    const userCheck = await pool.query('SELECT id, nome FROM usuarios WHERE nome = $1', [username]);
    
    if (userCheck.rows.length === 0) {
      console.log('❌ Usuário não encontrado:', username);
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    
    console.log('✅ Usuário encontrado:', userCheck.rows[0]);
    
    // Verificar estrutura da tabela usuarios
    const tableInfo = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'usuarios' 
      ORDER BY ordinal_position
    `);
    
    console.log('🔍 Estrutura da tabela usuarios:', tableInfo.rows.map(row => row.column_name));
    
    // Construir query dinamicamente baseada nas colunas existentes
    const availableColumns = tableInfo.rows.map(row => row.column_name);
    const updateFields = [];
    const queryParams = [];
    let paramIndex = 1;
    
    // Adicionar campos que existem na tabela
    if (availableColumns.includes('departamento') && departamento !== undefined) {
      updateFields.push(`departamento = $${paramIndex++}`);
      queryParams.push(departamento);
    }
    
    if (availableColumns.includes('cargo_atual') && cargo_atual !== undefined) {
      updateFields.push(`cargo_atual = $${paramIndex++}`);
      queryParams.push(cargo_atual);
    }
    
    if (availableColumns.includes('foto_perfil') && foto_perfil !== undefined) {
      updateFields.push(`foto_perfil = $${paramIndex++}`);
      queryParams.push(foto_perfil);
    }
    
    if (availableColumns.includes('nome_exibicao') && nome_exibicao !== undefined) {
      updateFields.push(`nome_exibicao = $${paramIndex++}`);
      queryParams.push(nome_exibicao);
    }
    
    if (updateFields.length === 0) {
      console.log('❌ Nenhum campo válido para atualizar');
      return res.status(400).json({ error: 'Nenhum campo válido para atualizar' });
    }
    
    // Construir query de retorno baseada nas colunas disponíveis
    const returnColumns = [];
    if (availableColumns.includes('id')) returnColumns.push('id');
    if (availableColumns.includes('nome')) returnColumns.push('nome');
    if (availableColumns.includes('email')) returnColumns.push('email');
    if (availableColumns.includes('tipo_usuario')) returnColumns.push('tipo_usuario');
    if (availableColumns.includes('foto_perfil')) returnColumns.push('foto_perfil');
    if (availableColumns.includes('departamento')) returnColumns.push('departamento');
    if (availableColumns.includes('cargo_atual')) returnColumns.push('cargo_atual');
    if (availableColumns.includes('nome_exibicao')) returnColumns.push('nome_exibicao');
    
    const query = `
      UPDATE usuarios 
      SET ${updateFields.join(', ')}
      WHERE nome = $${paramIndex}
      RETURNING ${returnColumns.join(', ')}
    `;
    
    queryParams.push(username);
    
    console.log('🔍 Executando query:', query);
    console.log('📋 Parâmetros:', queryParams);
    
    const result = await pool.query(query, queryParams);
    
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
    
    if (!username) {
      console.log('❌ Username não fornecido');
      return res.status(400).json({ error: 'Username não fornecido' });
    }
    
    console.log('🔍 Passo 1: Verificando se o usuário existe...');
    
    // Verificar se o usuário existe primeiro
    const userCheck = await pool.query('SELECT nome FROM usuarios WHERE nome = $1', [username]);
    console.log('👤 Resultado da verificação do usuário:', userCheck.rows);
    
    if (userCheck.rows.length === 0) {
      console.log('❌ Usuário não encontrado:', username);
        return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    
    console.log('✅ Usuário encontrado, verificando tabela curriculos...');
    
    // Verificar se a tabela curriculos existe
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'curriculos'
      );
    `);
    console.log('📋 Tabela curriculos existe:', tableCheck.rows[0].exists);
    
    if (!tableCheck.rows[0].exists) {
      console.log('❌ Tabela curriculos não existe');
      return res.json({
        hasCurriculum: false,
        lastUpdated: null,
        status: 'table_missing'
      });
    }
    
    console.log('✅ Tabela curriculos existe, buscando currículos...');
    
    // Buscar currículo no banco de dados
    const result = await pool.query(
      'SELECT nome_arquivo, tamanho, data_upload FROM curriculos WHERE usuario_nome = $1 ORDER BY data_upload DESC LIMIT 1',
      [username]
    );
    
    console.log(`📊 Resultado da busca: ${result.rows.length} currículos encontrados`);
    
    if (result.rows.length > 0) {
      const curriculum = result.rows[0];
      console.log('✅ Currículo encontrado:', {
        fileName: curriculum.nome_arquivo,
        size: curriculum.tamanho,
        uploadDate: curriculum.data_upload
      });
      res.json({
        hasCurriculum: true,
        fileName: curriculum.nome_arquivo,
        fileSize: curriculum.tamanho,
        lastUpdated: curriculum.data_upload,
        status: 'uploaded'
      });
    } else {
      console.log('❌ Nenhum currículo encontrado para:', username);
    res.json({ 
      hasCurriculum: false, 
      lastUpdated: null,
      status: 'not_uploaded'
    });
    }
  } catch (error) {
    console.error('❌ Erro ao buscar status do currículo:', error);
    console.error('❌ Stack trace:', error.stack);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: error.message,
      stack: error.stack
    });
  }
});

// Rota para buscar currículo
app.get('/api/users/curriculum/:username', async (req, res) => {
  try {
    const { username } = req.params;
    console.log(`📄 Buscando currículo para: ${username}`);
    
    // Buscar currículo no banco de dados
    const result = await pool.query(
      'SELECT nome_arquivo, tipo_mime, dados FROM curriculos WHERE usuario_nome = $1 ORDER BY data_upload DESC LIMIT 1',
      [username]
    );
    
    if (result.rows.length > 0) {
      const curriculum = result.rows[0];
      console.log('✅ Currículo encontrado, enviando arquivo:', curriculum.nome_arquivo);
      
      // Configurar headers para download
      res.setHeader('Content-Type', curriculum.tipo_mime);
      res.setHeader('Content-Disposition', `inline; filename="${curriculum.nome_arquivo}"`);
      
      // Enviar dados do arquivo
      res.send(curriculum.dados);
    } else {
      console.log('❌ Currículo não encontrado para:', username);
    res.status(404).json({ error: 'Currículo não encontrado' });
    }
  } catch (error) {
    console.error('❌ Erro ao buscar currículo:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para upload de currículo
app.post('/api/users/curriculum/:username', upload.single('curriculum'), async (req, res) => {
  try {
    const { username } = req.params;
    const file = req.file;
    
    console.log(`📄 Upload de currículo para: ${username}`);
    console.log('📋 Dados do arquivo:', {
      originalname: file?.originalname,
      mimetype: file?.mimetype,
      size: file?.size,
      buffer: file?.buffer ? 'Presente' : 'Ausente'
    });
    
    if (!username) {
      console.log('❌ Username não fornecido');
      return res.status(400).json({ error: 'Username não fornecido' });
    }
    
    if (!file) {
      console.log('❌ Nenhum arquivo recebido');
      return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }
    
    // Validar tipo de arquivo
    if (file.mimetype !== 'application/pdf') {
      console.log('❌ Tipo de arquivo inválido:', file.mimetype);
      return res.status(400).json({ error: 'Apenas arquivos PDF são permitidos' });
    }
    
    // Validar tamanho (máximo 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      console.log('❌ Arquivo muito grande:', file.size, 'bytes');
      return res.status(400).json({ error: 'Arquivo muito grande. Máximo 10MB permitido' });
    }
    
    // Verificar se o usuário existe
    const userCheck = await pool.query('SELECT nome FROM usuarios WHERE nome = $1', [username]);
    if (userCheck.rows.length === 0) {
      console.log('❌ Usuário não encontrado:', username);
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    
    console.log('✅ Usuário encontrado, prosseguindo com upload');
    
    // Deletar currículo anterior se existir
    const deleteResult = await pool.query('DELETE FROM curriculos WHERE usuario_nome = $1 RETURNING id', [username]);
    if (deleteResult.rows.length > 0) {
      console.log('🗑️ Currículo anterior removido');
    } else {
      console.log('📝 Nenhum currículo anterior encontrado');
    }
    
    // Salvar novo currículo no banco de dados
    console.log('💾 Salvando currículo no banco de dados...');
    const result = await pool.query(
      'INSERT INTO curriculos (usuario_nome, nome_arquivo, tipo_mime, tamanho, dados) VALUES ($1, $2, $3, $4, $5) RETURNING id, data_upload',
      [username, file.originalname, file.mimetype, file.size, file.buffer]
    );
    
    console.log('✅ Currículo salvo no banco de dados:', {
      id: result.rows[0].id,
      uploadDate: result.rows[0].data_upload
    });
    
    res.json({
      message: 'Currículo enviado com sucesso',
      fileName: file.originalname,
      fileSize: file.size,
      lastUpdated: result.rows[0].data_upload
    });
  } catch (error) {
    console.error('❌ Erro ao fazer upload do currículo:', error);
    console.error('❌ Stack trace:', error.stack);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: error.message,
      stack: error.stack
    });
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
    
    // Deletar currículo do banco de dados
    const result = await pool.query('DELETE FROM curriculos WHERE usuario_nome = $1 RETURNING id', [username]);
    
    if (result.rows.length > 0) {
      console.log('✅ Currículo deletado com sucesso');
    res.json({ message: 'Currículo deletado com sucesso' });
    } else {
      console.log('❌ Nenhum currículo encontrado para deletar');
      res.status(404).json({ error: 'Currículo não encontrado' });
    }
  } catch (error) {
    console.error('❌ Erro ao deletar currículo:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota de teste para currículo
app.get('/api/test-curriculum', async (req, res) => {
  try {
    console.log('🧪 Testando funcionalidade de currículo...');
    
    // Verificar se a tabela curriculos existe
    const tableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'curriculos'
      );
    `);
    
    if (!tableExists.rows[0].exists) {
      return res.json({ 
        error: 'Tabela curriculos não existe',
        status: 'table_missing'
      });
    }
    
    // Verificar estrutura da tabela
    const columns = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'curriculos' 
      ORDER BY ordinal_position
    `);
    
    // Contar currículos existentes
    const count = await pool.query('SELECT COUNT(*) as total FROM curriculos');
    
    res.json({
      status: 'ok',
      tableExists: true,
      columns: columns.rows,
      totalCurriculums: count.rows[0].total,
      message: 'Teste de currículo concluído'
    });
    
  } catch (error) {
    console.error('❌ Erro no teste de currículo:', error);
    res.status(500).json({ 
      error: 'Erro no teste de currículo', 
      details: error.message 
    });
  }
});

// Rota de debug para verificar usuário específico
app.get('/api/debug-user/:username', async (req, res) => {
  try {
    const { username } = req.params;
    console.log(`🔍 Debug do usuário: ${username}`);
    
    // Verificar se o usuário existe
    const userResult = await pool.query('SELECT id, nome, email, tipo_usuario FROM usuarios WHERE nome = $1', [username]);
    
    if (userResult.rows.length === 0) {
      return res.json({
        error: 'Usuário não encontrado',
        username: username,
        status: 'user_not_found'
      });
    }
    
    const user = userResult.rows[0];
    
    // Verificar currículos do usuário
    const curriculumResult = await pool.query('SELECT id, nome_arquivo, tamanho, data_upload FROM curriculos WHERE usuario_nome = $1', [username]);
    
    res.json({
      status: 'ok',
      user: user,
      curriculums: curriculumResult.rows,
      totalCurriculums: curriculumResult.rows.length,
      message: 'Debug do usuário concluído'
    });
    
  } catch (error) {
    console.error('❌ Erro no debug do usuário:', error);
    res.status(500).json({ 
      error: 'Erro no debug do usuário', 
      details: error.message 
    });
  }
});

// Rota de teste específica para currículo do admin
app.get('/api/test-admin-curriculum', async (req, res) => {
  try {
    console.log('🧪 Testando currículo do admin especificamente...');
    
    // 1. Verificar se o usuário admin existe
    const adminCheck = await pool.query('SELECT id, nome FROM usuarios WHERE nome = $1', ['admin']);
    console.log('👤 Verificação do admin:', adminCheck.rows);
    
    if (adminCheck.rows.length === 0) {
      return res.json({
        error: 'Usuário admin não encontrado',
        status: 'admin_not_found'
      });
    }
    
    // 2. Verificar se a tabela curriculos existe
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'curriculos'
      );
    `);
    console.log('📋 Tabela curriculos existe:', tableCheck.rows[0].exists);
    
    if (!tableCheck.rows[0].exists) {
      return res.json({
        error: 'Tabela curriculos não existe',
        status: 'table_missing'
      });
    }
    
    // 3. Verificar estrutura da tabela curriculos
    const columnsCheck = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'curriculos' 
      ORDER BY ordinal_position
    `);
    console.log('📊 Colunas da tabela curriculos:', columnsCheck.rows);
    
    // 4. Tentar buscar currículos do admin
    const curriculumCheck = await pool.query(
      'SELECT id, nome_arquivo, tamanho, data_upload FROM curriculos WHERE usuario_nome = $1',
      ['admin']
    );
    console.log('📄 Currículos do admin:', curriculumCheck.rows);
    
    res.json({
      status: 'ok',
      admin: adminCheck.rows[0],
      tableExists: tableCheck.rows[0].exists,
      columns: columnsCheck.rows,
      curriculums: curriculumCheck.rows,
      totalCurriculums: curriculumCheck.rows.length,
      message: 'Teste do admin concluído'
    });
    
  } catch (error) {
    console.error('❌ Erro no teste do admin:', error);
    console.error('❌ Stack trace:', error.stack);
    res.status(500).json({ 
      error: 'Erro no teste do admin', 
      details: error.message,
      stack: error.stack
    });
  }
});

// Rota para recriar tabela curriculos se necessário
app.post('/api/fix-curriculum-table', async (req, res) => {
  try {
    console.log('🔧 Recriando tabela curriculos...');
    
    // 1. Verificar se a tabela existe
    const tableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'curriculos'
      );
    `);
    
    if (tableExists.rows[0].exists) {
      console.log('🗑️ Tabela curriculos existe, removendo...');
      await pool.query('DROP TABLE curriculos CASCADE');
    }
    
    // 2. Criar tabela curriculos
    console.log('📋 Criando tabela curriculos...');
    await pool.query(`
      CREATE TABLE curriculos (
        id SERIAL PRIMARY KEY,
        usuario_nome VARCHAR(100) NOT NULL,
        nome_arquivo VARCHAR(255) NOT NULL,
        tipo_mime VARCHAR(100) NOT NULL,
        tamanho BIGINT NOT NULL,
        dados BYTEA NOT NULL,
        data_upload TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // 3. Verificar estrutura
    const columns = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'curriculos' 
      ORDER BY ordinal_position
    `);
    
    console.log('✅ Tabela curriculos recriada com sucesso');
    
    res.json({
      status: 'ok',
      message: 'Tabela curriculos recriada com sucesso',
      columns: columns.rows
    });
    
  } catch (error) {
    console.error('❌ Erro ao recriar tabela curriculos:', error);
    console.error('❌ Stack trace:', error.stack);
    res.status(500).json({ 
      error: 'Erro ao recriar tabela', 
      details: error.message,
      stack: error.stack
    });
  }
});

// Rota GET para criar tabela curriculos (mais fácil de testar)
app.get('/api/create-curriculum-table', async (req, res) => {
  try {
    console.log('🔧 Criando tabela curriculos via GET...');
    
    // 1. Verificar se a tabela existe
    const tableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'curriculos'
      );
    `);
    
    if (tableExists.rows[0].exists) {
      console.log('✅ Tabela curriculos já existe');
      return res.json({
        status: 'exists',
        message: 'Tabela curriculos já existe'
      });
    }
    
    // 2. Criar tabela curriculos (sem foreign key para evitar problemas)
    console.log('📋 Criando tabela curriculos...');
    await pool.query(`
      CREATE TABLE curriculos (
        id SERIAL PRIMARY KEY,
        usuario_nome VARCHAR(100) NOT NULL,
        nome_arquivo VARCHAR(255) NOT NULL,
        tipo_mime VARCHAR(100) NOT NULL,
        tamanho BIGINT NOT NULL,
        dados BYTEA NOT NULL,
        data_upload TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // 3. Verificar estrutura
    const columns = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'curriculos' 
      ORDER BY ordinal_position
    `);
    
    console.log('✅ Tabela curriculos criada com sucesso');
    
    res.json({
      status: 'created',
      message: 'Tabela curriculos criada com sucesso',
      columns: columns.rows
    });
    
  } catch (error) {
    console.error('❌ Erro ao criar tabela curriculos:', error);
    console.error('❌ Stack trace:', error.stack);
    res.status(500).json({ 
      error: 'Erro ao criar tabela', 
      details: error.message,
      stack: error.stack
    });
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

// Rota de debug para verificar dados dos usuários
app.get('/api/debug/users', async (req, res) => {
  try {
    console.log('🔍 Debug: Verificando dados dos usuários...');
    
    // Verificar estrutura da tabela usuarios
    const tableInfo = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'usuarios' 
      ORDER BY ordinal_position
    `);
    
    console.log('🔍 Estrutura da tabela usuarios:', tableInfo.rows);
    
    // Buscar todos os usuários
    const users = await pool.query('SELECT id, nome, email, tipo_usuario, foto_perfil FROM usuarios ORDER BY id');
    console.log('👥 Usuários encontrados:', users.rows);
    
    // Buscar todos os certificados
    const certs = await pool.query('SELECT id, usuario_id, nome, instituicao FROM certificados ORDER BY id');
    console.log('🏆 Certificados encontrados:', certs.rows);
    
    res.json({
      tableStructure: tableInfo.rows,
      users: users.rows,
      certificates: certs.rows
    });
  } catch (error) {
    console.error('❌ Erro no debug:', error);
    res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
  }
});

// Rota de teste para verificar tokens
app.get('/api/test-token', async (req, res) => {
  try {
    const sessionToken = req.cookies?.sessionToken;
    
    console.log('🔍 Testando token:', sessionToken);
    
    if (!sessionToken) {
      return res.json({ error: 'Nenhum token encontrado' });
    }
    
    const result = {
      token: sessionToken,
      startsWith1: sessionToken.startsWith('1-'),
      startsWith2: sessionToken.startsWith('2-'),
      length: sessionToken.length
    };
    
    if (sessionToken.startsWith('1-')) {
      result.user = 'admin';
      result.id = 1;
    } else if (sessionToken.startsWith('2-')) {
      result.user = 'sergio';
      result.id = 2;
    } else {
      result.user = 'desconhecido';
      result.id = null;
    }
    
    console.log('🔍 Resultado do teste:', result);
    res.json(result);
  } catch (error) {
    console.error('❌ Erro no teste:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para garantir que os usuários existam com IDs corretos
app.post('/api/ensure-users', async (req, res) => {
  try {
    console.log('🔧 Garantindo que os usuários existam...');
    
    // Verificar se a tabela usuarios existe
    const tableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'usuarios'
      );
    `);
    
    if (!tableExists.rows[0].exists) {
      console.log('❌ Tabela usuarios não existe, criando...');
      
      // Criar tabela usuarios
      await pool.query(`
        CREATE TABLE IF NOT EXISTS usuarios (
          id SERIAL PRIMARY KEY,
          nome VARCHAR(100) NOT NULL UNIQUE,
          email VARCHAR(100) UNIQUE,
          senha VARCHAR(255) NOT NULL,
          tipo_usuario VARCHAR(50) DEFAULT 'usuario',
          foto_perfil TEXT,
          data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      
      console.log('✅ Tabela usuarios criada');
    }
    
    // Verificar se admin existe
    let adminUser = await pool.query('SELECT id, nome FROM usuarios WHERE nome = $1', ['admin']);
    if (adminUser.rows.length === 0) {
      console.log('👤 Criando usuário admin...');
      await pool.query(
        'INSERT INTO usuarios (id, nome, email, senha, tipo_usuario) VALUES (1, $1, $2, $3, $4) ON CONFLICT (id) DO NOTHING',
        ['admin', 'admin@example.com', 'Admin123', 'admin']
      );
      adminUser = await pool.query('SELECT id, nome FROM usuarios WHERE nome = $1', ['admin']);
      console.log('✅ Admin criado:', adminUser.rows[0]);
    } else {
      console.log('✅ Admin já existe:', adminUser.rows[0]);
    }
    
    // Verificar se sergio existe
    let sergioUser = await pool.query('SELECT id, nome FROM usuarios WHERE nome = $1', ['sergio']);
    if (sergioUser.rows.length === 0) {
      console.log('👤 Criando usuário sergio...');
      await pool.query(
        'INSERT INTO usuarios (id, nome, email, senha, tipo_usuario) VALUES (2, $1, $2, $3, $4) ON CONFLICT (id) DO NOTHING',
        ['sergio', 'sergio@example.com', '12345', 'usuario']
      );
      sergioUser = await pool.query('SELECT id, nome FROM usuarios WHERE nome = $1', ['sergio']);
      console.log('✅ Sergio criado:', sergioUser.rows[0]);
    } else {
      console.log('✅ Sergio já existe:', sergioUser.rows[0]);
    }
    
    // Buscar todos os usuários para confirmar
    const allUsers = await pool.query('SELECT id, nome, email, tipo_usuario FROM usuarios ORDER BY id');
    console.log('👥 Todos os usuários:', allUsers.rows);
    
    res.json({
      success: true,
      message: 'Usuários garantidos',
      users: allUsers.rows
    });
  } catch (error) {
    console.error('❌ Erro ao garantir usuários:', error);
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
    
    // Debug: Mostrar todos os certificados para verificar se há problema
    console.log('🔍 Todos os certificados na tabela:');
    const allCerts = await pool.query('SELECT id, usuario_id, nome, instituicao FROM certificados ORDER BY id');
    console.log('📋 Certificados totais:', allCerts.rows);
    
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
    
    // Verificar se o usuário existe
    const userCheck = await pool.query('SELECT id, nome FROM usuarios WHERE id = $1', [parseInt(usuario_id)]);
    if (userCheck.rows.length === 0) {
      console.log('❌ Usuário não encontrado para certificado:', usuario_id);
      return res.status(400).json({ error: 'Usuário não encontrado' });
    }
    
    console.log('✅ Usuário validado para certificado:', userCheck.rows[0]);
    
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

// Rota de debug para verificar tokens e sessões
app.get('/api/debug-session', async (req, res) => {
  try {
    console.log('🔍 [DEBUG] Verificando sessão debug...');
    
    const authHeader = req.headers.authorization;
    const sessionToken = req.cookies?.sessionToken || authHeader?.replace('Bearer ', '');
    
    console.log('🔍 [DEBUG] Headers:', {
      authorization: authHeader,
      cookies: req.cookies,
      sessionToken: sessionToken
    });
    
    const debugInfo = {
      timestamp: new Date().toISOString(),
      hasAuthHeader: !!authHeader,
      hasSessionToken: !!sessionToken,
      cookies: req.cookies,
      sessionToken: sessionToken,
      tokenAnalysis: {}
    };
    
    if (sessionToken) {
      const tokenParts = sessionToken.split('-');
      const userId = parseInt(tokenParts[0]);
      
      debugInfo.tokenAnalysis = {
        tokenParts: tokenParts,
        userId: userId,
        isValidUserId: !isNaN(userId),
        length: sessionToken.length,
        prefix: tokenParts[0],
        fullToken: sessionToken
      };
      
      if (!isNaN(userId)) {
        debugInfo.identifiedUserId = userId;
        debugInfo.expectedUserId = userId;
      } else {
        debugInfo.identifiedUserId = null;
        debugInfo.expectedUserId = null;
      }
    }
    
    console.log('🔍 [DEBUG] Informações de debug:', debugInfo);
    res.json(debugInfo);
    
  } catch (error) {
    console.error('❌ [DEBUG] Erro no debug de sessão:', error);
    res.status(500).json({ error: error.message });
  }
});

// Rota para forçar limpeza de cookies
app.post('/api/clear-session', (req, res) => {
  try {
    console.log('🧹 Forçando limpeza de cookies...');
    
    // Limpar cookie com todas as variações possíveis
    res.clearCookie('sessionToken');
    res.clearCookie('sessionToken', { path: '/' });
    res.clearCookie('sessionToken', { path: '/', httpOnly: true });
    res.clearCookie('sessionToken', { path: '/', httpOnly: true, secure: true });
    res.clearCookie('sessionToken', { path: '/', httpOnly: true, secure: false });
    
    console.log('✅ Cookies limpos forçadamente');
    res.json({ success: true, message: 'Cookies limpos com sucesso' });
  } catch (error) {
    console.error('❌ Erro ao limpar cookies:', error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
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