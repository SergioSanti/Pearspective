const express = require('express');
const cors = require('cors');
const path = require('path');
const { Pool } = require('pg');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Configuração do multer para upload de arquivos
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});

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

// Rota para curriculum do usuário - BUSCA DO BANCO
app.get('/api/users/curriculum/:username', async (req, res) => {
  try {
    const { username } = req.params;
    
    console.log('📄 Buscando curriculum para:', username);
    
    // Query baseada na estrutura real (nome)
    const result = await pool.query(
      'SELECT id, nome, tipo_usuario, departamento, cargo_atual, foto_perfil FROM usuarios WHERE nome = $1',
      [username]
    );
    
    if (result.rows.length > 0) {
      const user = result.rows[0];
      res.json({
        id: user.id,
        nome: user.nome,
        tipo_usuario: user.tipo_usuario,
        departamento: user.departamento || null,
        cargo_atual: user.cargo_atual || null,
        foto_perfil: user.foto_perfil || null,
        // Campos adicionais que podem estar no curriculum
        experiencia: null,
        formacao: null,
        habilidades: null
      });
    } else {
      res.status(404).json({ error: 'Usuário não encontrado' });
    }
  } catch (error) {
    console.error('Erro ao buscar curriculum:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para status do curriculum - BUSCA DO BANCO
app.get('/api/users/curriculum/:username/status', async (req, res) => {
  try {
    const { username } = req.params;
    
    console.log('📊 Buscando status do curriculum para:', username);
    
    // Query baseada na estrutura real (nome)
    const result = await pool.query(
      'SELECT id, nome, tipo_usuario, departamento, cargo_atual FROM usuarios WHERE nome = $1',
      [username]
    );
    
    if (result.rows.length > 0) {
      const user = result.rows[0];
      res.json({
        completo: !!(user.departamento && user.cargo_atual),
        departamento: user.departamento || null,
        cargo_atual: user.cargo_atual || null
      });
    } else {
      res.status(404).json({ error: 'Usuário não encontrado' });
    }
  } catch (error) {
    console.error('Erro ao buscar status do curriculum:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para atualizar curriculum - ATUALIZA NO BANCO
app.put('/api/users/curriculum/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const { departamento, cargo_atual, experiencia, formacao, habilidades } = req.body;
    
    console.log('📝 Atualizando curriculum para:', username, { departamento, cargo_atual });
    
    const result = await pool.query(
      'UPDATE usuarios SET departamento = $1, cargo_atual = $2 WHERE nome = $3 RETURNING *',
      [departamento, cargo_atual, username]
    );
    
    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ error: 'Usuário não encontrado' });
    }
  } catch (error) {
    console.error('Erro ao atualizar curriculum:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para display name do usuário - BUSCA DO BANCO
app.get('/api/users/display-name/:username', async (req, res) => {
  try {
    const { username } = req.params;
    
    console.log('👤 Buscando display name para:', username);
    
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
        display_name: user.nome // Usando nome como display_name
      });
    } else {
      res.status(404).json({ error: 'Usuário não encontrado' });
    }
  } catch (error) {
    console.error('Erro ao buscar display name:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para atualizar display name - ATUALIZA NO BANCO
app.put('/api/users/display-name/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const { display_name } = req.body;
    
    console.log('📝 Atualizando display name para:', username, { display_name });
    
    const result = await pool.query(
      'UPDATE usuarios SET nome = $1 WHERE nome = $2 RETURNING *',
      [display_name, username]
    );
    
    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ error: 'Usuário não encontrado' });
    }
  } catch (error) {
    console.error('Erro ao atualizar display name:', error);
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
    // Retorna array vazio em caso de erro
    res.json([]);
  }
});

// Rota para cargos - BUSCA DO BANCO
app.get('/api/cargos', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, nome_cargo, quantidade_vagas, requisitos, area_id FROM cargos ORDER BY nome_cargo');
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Erro ao buscar cargos:', error);
    res.json([]);
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

// Rota para deletar área
app.delete('/api/areas/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('🗑️ Deletando área:', id);
    
    const result = await pool.query(
      'DELETE FROM areas WHERE id = $1 RETURNING id',
      [id]
    );
    
    if (result.rows.length > 0) {
      console.log('✅ Área deletada:', id);
      res.json({ success: true });
    } else {
      console.log('❌ Área não encontrada');
      res.status(404).json({ error: 'Área não encontrada' });
    }
  } catch (error) {
    console.error('❌ Erro ao deletar área:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para buscar cargo específico
app.get('/api/cargos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('📋 Buscando cargo específico:', id);
    
    const result = await pool.query(
      'SELECT id, nome_cargo, quantidade_vagas, requisitos, area_id FROM cargos WHERE id = $1',
      [id]
    );
    
    if (result.rows.length > 0) {
      console.log('✅ Cargo encontrado:', result.rows[0]);
      res.json(result.rows[0]);
    } else {
      console.log('❌ Cargo não encontrado');
      res.status(404).json({ error: 'Cargo não encontrado' });
    }
  } catch (error) {
    console.error('❌ Erro ao buscar cargo:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para adicionar cargo
app.post('/api/cargos', async (req, res) => {
  try {
    const { nome_cargo, quantidade_vagas, requisitos, area_id } = req.body;
    
    console.log('➕ Adicionando cargo:', { nome_cargo, quantidade_vagas, area_id });
    
    const result = await pool.query(
      'INSERT INTO cargos (nome_cargo, quantidade_vagas, requisitos, area_id) VALUES ($1, $2, $3, $4) RETURNING id, nome_cargo, quantidade_vagas, requisitos, area_id',
      [nome_cargo, quantidade_vagas, JSON.stringify(requisitos), area_id]
    );
    
    console.log('✅ Cargo adicionado:', result.rows[0]);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('❌ Erro ao adicionar cargo:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para atualizar cargo
app.put('/api/cargos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nome_cargo, quantidade_vagas, requisitos, area_id } = req.body;
    
    console.log('📝 Atualizando cargo:', { id, nome_cargo, quantidade_vagas, area_id });
    
    const result = await pool.query(
      'UPDATE cargos SET nome_cargo = $1, quantidade_vagas = $2, requisitos = $3, area_id = $4 WHERE id = $5 RETURNING id, nome_cargo, quantidade_vagas, requisitos, area_id',
      [nome_cargo, quantidade_vagas, JSON.stringify(requisitos), area_id, id]
    );
    
    if (result.rows.length > 0) {
      console.log('✅ Cargo atualizado:', result.rows[0]);
      res.json(result.rows[0]);
    } else {
      console.log('❌ Cargo não encontrado');
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
    
    console.log('🗑️ Deletando cargo:', id);
    
    const result = await pool.query(
      'DELETE FROM cargos WHERE id = $1 RETURNING id',
      [id]
    );
    
    if (result.rows.length > 0) {
      console.log('✅ Cargo deletado:', id);
      res.json({ success: true });
    } else {
      console.log('❌ Cargo não encontrado');
      res.status(404).json({ error: 'Cargo não encontrado' });
    }
  } catch (error) {
    console.error('❌ Erro ao deletar cargo:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para buscar certificados do usuário - BUSCA DO BANCO
app.get('/api/certificados/usuario/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    console.log('🏆 Buscando certificados para usuário:', userId);
    
    const result = await pool.query(
      'SELECT id, nome, instituicao, data_conclusao, descricao, tem_pdf FROM certificados WHERE usuario_id = $1 ORDER BY data_conclusao DESC',
      [userId]
    );
    
    console.log(`✅ Encontrados ${result.rows.length} certificados para usuário ${userId}`);
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Erro ao buscar certificados:', error);
    res.json([]);
  }
});

// Rota para buscar certificado específico - BUSCA DO BANCO
app.get('/api/certificados/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('🏆 Buscando certificado específico:', id);
    
    const result = await pool.query(
      'SELECT id, nome, instituicao, data_inicio, data_conclusao, descricao, tem_pdf FROM certificados WHERE id = $1',
      [id]
    );
    
    if (result.rows.length > 0) {
      console.log('✅ Certificado encontrado:', result.rows[0]);
      res.json(result.rows[0]);
    } else {
      console.log('❌ Certificado não encontrado');
      res.status(404).json({ error: 'Certificado não encontrado' });
    }
  } catch (error) {
    console.error('❌ Erro ao buscar certificado:', error);
    res.json({ error: 'Certificado não encontrado' });
  }
});

// Rota para adicionar certificado - SALVA NO BANCO
app.post('/api/certificados', upload.single('pdf'), async (req, res) => {
  try {
    const { usuario_id, nome, instituicao, data_inicio, data_conclusao, descricao } = req.body;
    const pdfFile = req.file;
    
    console.log('➕ Adicionando certificado:', { nome, instituicao, usuario_id });
    
    let query, params;
    if (pdfFile) {
      query = 'INSERT INTO certificados (usuario_id, nome, instituicao, data_inicio, data_conclusao, descricao, tem_pdf, pdf_data, pdf_nome) VALUES ($1, $2, $3, $4, $5, $6, true, $7, $8) RETURNING id, nome, instituicao, data_conclusao, descricao, tem_pdf';
      params = [usuario_id, nome, instituicao, data_inicio, data_conclusao, descricao, pdfFile.buffer, pdfFile.originalname];
    } else {
      query = 'INSERT INTO certificados (usuario_id, nome, instituicao, data_inicio, data_conclusao, descricao, tem_pdf) VALUES ($1, $2, $3, $4, $5, $6, false) RETURNING id, nome, instituicao, data_conclusao, descricao, tem_pdf';
      params = [usuario_id, nome, instituicao, data_inicio, data_conclusao, descricao];
    }
    
    const result = await pool.query(query, params);
    
    console.log('✅ Certificado adicionado:', result.rows[0]);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('❌ Erro ao adicionar certificado:', error);
    res.json({ error: 'Erro ao adicionar certificado' });
  }
});

// Rota para atualizar certificado - ATUALIZA NO BANCO
app.put('/api/certificados/:id', upload.single('pdf'), async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, instituicao, data_inicio, data_conclusao, descricao } = req.body;
    const pdfFile = req.file;
    
    console.log('📝 Atualizando certificado:', { id, nome, instituicao });
    
    let query, params;
    if (pdfFile) {
      query = 'UPDATE certificados SET nome = $1, instituicao = $2, data_inicio = $3, data_conclusao = $4, descricao = $5, tem_pdf = true, pdf_data = $6, pdf_nome = $7 WHERE id = $8 RETURNING id, nome, instituicao, data_conclusao, descricao, tem_pdf';
      params = [nome, instituicao, data_inicio, data_conclusao, descricao, pdfFile.buffer, pdfFile.originalname, id];
    } else {
      query = 'UPDATE certificados SET nome = $1, instituicao = $2, data_inicio = $3, data_conclusao = $4, descricao = $5 WHERE id = $6 RETURNING id, nome, instituicao, data_conclusao, descricao, tem_pdf';
      params = [nome, instituicao, data_inicio, data_conclusao, descricao, id];
    }
    
    const result = await pool.query(query, params);
    
    if (result.rows.length > 0) {
      console.log('✅ Certificado atualizado:', result.rows[0]);
      res.json(result.rows[0]);
    } else {
      console.log('❌ Certificado não encontrado');
      res.json({ error: 'Certificado não encontrado' });
    }
  } catch (error) {
    console.error('❌ Erro ao atualizar certificado:', error);
    res.json({ error: 'Erro ao atualizar certificado' });
  }
});

// Rota para deletar certificado - DELETA DO BANCO
app.delete('/api/certificados/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('🗑️ Deletando certificado:', id);
    
    const result = await pool.query(
      'DELETE FROM certificados WHERE id = $1 RETURNING id',
      [id]
    );
    
    if (result.rows.length > 0) {
      console.log('✅ Certificado deletado:', id);
      res.json({ success: true });
    } else {
      console.log('❌ Certificado não encontrado');
      res.status(404).json({ error: 'Certificado não encontrado' });
    }
  } catch (error) {
    console.error('❌ Erro ao deletar certificado:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para buscar PDF do certificado - BUSCA DO BANCO
app.get('/api/certificados/:id/pdf', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('📄 Buscando PDF do certificado:', id);
    
    const result = await pool.query(
      'SELECT pdf_data, pdf_nome FROM certificados WHERE id = $1 AND tem_pdf = true',
      [id]
    );
    
    if (result.rows.length > 0) {
      const { pdf_data, pdf_nome } = result.rows[0];
      console.log('✅ PDF encontrado:', pdf_nome);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${pdf_nome}"`);
      res.send(Buffer.from(pdf_data, 'base64'));
    } else {
      console.log('❌ PDF não encontrado');
      res.status(404).json({ error: 'PDF não encontrado' });
    }
  } catch (error) {
    console.error('❌ Erro ao buscar PDF:', error);
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