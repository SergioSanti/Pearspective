const express = require('express');
const cors = require('cors');
const path = require('path');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Configuração do banco de dados
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/pearspective',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Teste de conexão - SEMPRE funcionar mesmo sem banco
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('⚠️ Erro ao conectar com o banco:', err.message);
    console.log('ℹ️ Aplicação continuará funcionando sem banco de dados');
  } else {
    console.log('✅ Conectado ao banco de dados PostgreSQL');
  }
});

// Servir arquivos estáticos - MÚLTIPLAS PASTAS
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname)));
app.use('/assets', express.static(path.join(__dirname, 'public', 'assets')));
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// Rota raiz - servir index.html
app.get('/', (req, res) => {
  console.log('📄 Servindo index.html');
  const indexPath = path.join(__dirname, 'public', 'index.html');
  const simpleIndexPath = path.join(__dirname, 'public', 'index-simple.html');
  
  // Tentar servir o index.html original primeiro
  if (require('fs').existsSync(indexPath)) {
    console.log('✅ Servindo index.html original');
    res.sendFile(indexPath);
  } else if (require('fs').existsSync(simpleIndexPath)) {
    console.log('✅ Servindo index-simple.html como fallback');
    res.sendFile(simpleIndexPath);
  } else {
    console.log('❌ Nenhum arquivo index encontrado');
    res.status(404).send('Página inicial não encontrada');
  }
});

// Rota para login.html
app.get('/login', (req, res) => {
  console.log('🔐 Servindo login.html');
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Rota para outras páginas HTML
app.get('/:page', (req, res) => {
  const page = req.params.page;
  const htmlFile = path.join(__dirname, 'public', `${page}.html`);
  const cssFile = path.join(__dirname, 'public', `${page}.css`);
  const jsFile = path.join(__dirname, 'public', `${page}.js`);
  
  console.log(`📄 Tentando servir: ${page}`);
  
  // Verificar se o arquivo HTML existe
  if (require('fs').existsSync(htmlFile)) {
    console.log(`✅ Servindo ${page}.html`);
    res.sendFile(htmlFile);
  } else {
    console.log(`❌ Arquivo não encontrado: ${htmlFile}`);
    res.status(404).send('Página não encontrada');
  }
});

// Rota de teste
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend funcionando!' });
});

// Rota de login - BUSCA DO BANCO
app.post('/api/login', async (req, res) => {
  try {
    const { usuario, senha } = req.body;
    
    console.log('🔐 Tentativa de login:', { usuario, senha });
    
    // Query baseada na estrutura real do banco (nome, senha, tipo_usuario)
    const result = await pool.query(
      'SELECT id, nome, senha, tipo_usuario FROM usuarios WHERE nome = $1 AND senha = $2',
      [usuario, senha]
    );
    
    if (result.rows.length > 0) {
      const user = result.rows[0];
      console.log('✅ Login bem-sucedido:', user.nome);
      res.json({ 
        success: true, 
        id: user.id,
        nome: user.nome,
        tipo_usuario: user.tipo_usuario,
        foto_perfil: null
      });
    } else {
      console.log('❌ Credenciais inválidas');
      res.status(401).json({ success: false, message: 'Credenciais inválidas' });
    }
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
});

// Rota para buscar foto do usuário - BUSCA DO BANCO
app.get('/api/users/photo/:username', async (req, res) => {
  try {
    const { username } = req.params;
    
    // Query baseada na estrutura real (nome)
    const result = await pool.query(
      'SELECT foto_perfil FROM usuarios WHERE nome = $1',
      [username]
    );

    if (result.rows.length > 0) {
      res.json({ foto_perfil: result.rows[0].foto_perfil || null });
    } else {
      res.status(404).json({ error: 'Usuário não encontrado' });
    }
  } catch (error) {
    console.error('Erro ao buscar foto:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para buscar perfil do usuário - BUSCA DO BANCO
app.get('/api/users/profile/:username', async (req, res) => {
  try {
    const { username } = req.params;
    
    // Query baseada na estrutura real (nome)
    const result = await pool.query(
      'SELECT id, nome, tipo_usuario FROM usuarios WHERE nome = $1',
      [username]
    );
    
    if (result.rows.length > 0) {
      const user = result.rows[0];
      res.json({
        id: user.id,
        nome: user.nome,
        tipo_usuario: user.tipo_usuario,
        foto_perfil: null,
        departamento: null,
        cargo_atual: null
      });
    } else {
      res.status(404).json({ error: 'Usuário não encontrado' });
    }
  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para atualizar perfil do usuário - ATUALIZA NO BANCO
app.put('/api/users/profile/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { departamento, cargo_atual, foto_perfil } = req.body;
    
    console.log('📝 Atualizando perfil:', { id, departamento, cargo_atual, foto_perfil });
    
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

// Rota para áreas - BUSCA DO BANCO
app.get('/api/areas', async (req, res) => {
  try {
    console.log('📋 Buscando áreas no banco de dados...');
    
    const result = await pool.query('SELECT id, nome FROM areas ORDER BY nome');
    
    console.log(`✅ Encontradas ${result.rows.length} áreas no banco`);
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Erro ao buscar áreas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para cargos - BUSCA DO BANCO
app.get('/api/cargos', async (req, res) => {
  try {
    const areaId = req.query.area;
    
    console.log('📋 Buscando cargos para área:', areaId);
    
    const result = await pool.query(
      'SELECT id, nome, descricao FROM cargos WHERE area_id = $1 ORDER BY nome',
      [areaId]
    );
    
    console.log(`✅ Encontrados ${result.rows.length} cargos para área ${areaId}`);
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Erro ao buscar cargos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para adicionar área
app.post('/api/areas', async (req, res) => {
  try {
    const { nome } = req.body;
    
    console.log('➕ Adicionando área:', nome);
    
    const result = await pool.query(
      'INSERT INTO areas (nome) VALUES ($1) RETURNING id, nome',
      [nome]
    );
    
    console.log('✅ Área adicionada:', result.rows[0]);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('❌ Erro ao adicionar área:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para adicionar cargo
app.post('/api/cargos', async (req, res) => {
  try {
    const { nome, descricao, area_id } = req.body;
    
    console.log('➕ Adicionando cargo:', { nome, descricao, area_id });
    
    const result = await pool.query(
      'INSERT INTO cargos (nome, descricao, area_id) VALUES ($1, $2, $3) RETURNING id, nome, descricao, area_id',
      [nome, descricao, area_id]
    );
    
    console.log('✅ Cargo adicionado:', result.rows[0]);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('❌ Erro ao adicionar cargo:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Middleware de erro para capturar rotas não encontradas
app.use((req, res, next) => {
  console.log(`❌ Rota não encontrada: ${req.method} ${req.url}`);
  res.status(404).send('Página não encontrada');
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📁 Diretório atual: ${__dirname}`);
  console.log(`🌐 Acesse: http://localhost:${PORT}`);
  console.log(`🔧 NODE_ENV: ${process.env.NODE_ENV}`);
  console.log(`🗄️ DATABASE_URL: ${process.env.DATABASE_URL ? 'Configurado' : 'Não configurado'}`);
  console.log(`📦 Versão Node: ${process.version}`);
});

module.exports = app; 