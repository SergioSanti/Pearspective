const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const pool = require('./database');

const app = express();
const PORT = 3000;

// Função para aguardar o banco de dados estar pronto
async function waitForDatabase() {
  const maxRetries = 50; // Aumentado para 50 tentativas
  let retries = 0;
  
  console.log('🔍 Tentando conectar ao banco de dados...');
  
  while (retries < maxRetries) {
    try {
      const client = await pool.connect();
      await client.query('SELECT 1');
      client.release();
      console.log('✅ Banco de dados conectado com sucesso!');
      return true;
    } catch (error) {
      retries++;
      console.log(`⏳ Aguardando banco de dados... (tentativa ${retries}/${maxRetries}) - ${error.message}`);
      
      // Aguarda mais tempo entre tentativas
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
  
  console.error('❌ Falha ao conectar ao banco de dados após várias tentativas');
  return false;
}

app.use(cors());
app.use(express.json({ limit: '2mb' })); // Aumentar limite para 2MB para fotos de perfil

// Middleware de erro global para capturar erros do multer
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    console.error('❌ Erro do Multer:', err);
    
    let errorMessage = 'Erro no upload do arquivo';
    let statusCode = 400;
    
    if (err.code === 'LIMIT_FILE_SIZE') {
      errorMessage = 'Arquivo muito grande. Tamanho máximo permitido: 2MB para fotos, 10MB para PDFs';
    } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      errorMessage = 'Arquivo inesperado no upload';
    } else {
      errorMessage = err.message;
    }
    
    return res.status(statusCode).json({ 
      error: errorMessage,
      details: err.message,
      code: err.code
    });
  } else if (err.message && err.message.includes('Apenas')) {
    // Erro de tipo de arquivo não permitido
    console.error('❌ Erro de tipo de arquivo:', err.message);
    return res.status(400).json({ 
      error: err.message,
      details: 'Formato de arquivo não suportado'
    });
  } else if (err.type === 'entity.too.large') {
    // Erro de payload muito grande
    console.error('❌ Payload muito grande:', err);
    return res.status(413).json({ 
      error: 'Arquivo muito grande',
      details: `Tamanho máximo permitido: 2MB. Arquivo enviado: ${Math.round(err.length / 1024)}KB`,
      maxSize: '2MB'
    });
  } else if (err) {
    console.error('❌ Erro geral:', err);
    return res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: err.message 
    });
  }
  next();
});

// Configuração do multer para upload de arquivos
const storage = multer.memoryStorage();

// Configuração para PDFs (certificados)
const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Apenas arquivos PDF são permitidos'), false);
        }
    }
});

// Configuração para fotos de perfil
const uploadPhoto = multer({ 
    storage: storage,
    limits: {
        fileSize: 2 * 1024 * 1024 // 2MB para fotos de perfil
    },
    fileFilter: (req, file, cb) => {
        // Validar tipos de imagem permitidos
        const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Apenas imagens são permitidas (JPEG, PNG, GIF, WebP)'), false);
        }
    }
});

// Serve arquivos estáticos da raiz do projeto (onde está o login.html)
app.use(express.static(path.join(__dirname, '..')));

// Página inicial - login
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'login.html'));
});

// API para listar áreas
app.get('/api/areas', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, nome FROM areas ORDER BY nome');
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar áreas:', error);
    res.status(500).json({ erro: 'Erro ao buscar áreas' });
  }
});

// API para listar cargos filtrando por área (query parameter)
app.get('/api/cargos', async (req, res) => {
  const area_id = req.query.area_id;
  
  try {
    let query, params;
    
    if (area_id) {
      // Se area_id fornecido, filtrar por área
      query = 'SELECT id, nome_cargo FROM cargos WHERE area_id = $1 ORDER BY nome_cargo';
      params = [area_id];
    } else {
      // Se não fornecido, retornar todos os cargos
      query = 'SELECT id, nome_cargo FROM cargos ORDER BY nome_cargo';
      params = [];
    }
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Erro ao buscar cargos:', err);
    res.status(500).json({ error: 'Erro ao buscar cargos' });
  }
});

// API para listar cargos filtrando por área
app.get('/api/cargos/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  console.log('ID recebido:', id);

  if (isNaN(id)) {
    return res.status(400).json({ error: 'ID inválido' });
  }

  try {
    const result = await pool.query('SELECT * FROM cargos WHERE id = $1', [id]);
    console.log('Resultado da query:', result.rows);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cargo não encontrado' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao buscar cargo:', error);
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
});

// --- ADMIN: Gerenciamento de Áreas ---

// Criar Área (POST)
app.post('/api/areas', async (req, res) => {
  const { nome } = req.body;
  if (!nome) {
    return res.status(400).json({ error: 'O nome da área é obrigatório.' });
  }
  try {
    const result = await pool.query('INSERT INTO areas (nome) VALUES ($1) RETURNING *', [nome]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar área:', error);
    res.status(500).json({ error: 'Erro ao criar área.' });
  }
});

// Atualizar Área (PUT)
app.put('/api/areas/:id', async (req, res) => {
  const { id } = req.params;
  const { nome } = req.body;
  if (!nome) {
    return res.status(400).json({ error: 'O nome da área é obrigatório.' });
  }
  try {
    const result = await pool.query('UPDATE areas SET nome = $1 WHERE id = $2 RETURNING *', [nome, id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Área não encontrada.' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar área:', error);
    res.status(500).json({ error: 'Erro ao atualizar área.' });
  }
});

// Deletar Área (DELETE)
app.delete('/api/areas/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // Primeiro, deleta os cargos associados para evitar violação de chave estrangeira
    await pool.query('DELETE FROM cargos WHERE area_id = $1', [id]);
    // Depois, deleta a área
    const result = await pool.query('DELETE FROM areas WHERE id = $1', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Área não encontrada.' });
    }
    res.status(204).send();
  } catch (error) {
    console.error('Erro ao deletar área:', error);
    res.status(500).json({ error: 'Erro ao deletar área.' });
  }
});

// --- ADMIN: Gerenciamento de Cargos ---

// Criar Cargo (POST)
app.post('/api/cargos', async (req, res) => {
  const { area_id, nome_cargo, complexidade, responsabilidades, requisitos, quantidade_vagas } = req.body;
  if (!area_id || !nome_cargo) {
    return res.status(400).json({ error: 'ID da área e nome do cargo são obrigatórios.' });
  }
  try {
    const result = await pool.query(
      'INSERT INTO cargos (area_id, nome_cargo, complexidade, responsabilidades, requisitos, quantidade_vagas) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [area_id, nome_cargo, complexidade, responsabilidades, JSON.stringify(requisitos || {}), quantidade_vagas || 1]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar cargo:', error);
    res.status(500).json({ error: 'Erro ao criar cargo.' });
  }
});

// Atualizar Cargo (PUT)
app.put('/api/cargos/:id', async (req, res) => {
  const { id } = req.params;
  const { nome_cargo, complexidade, responsabilidades, requisitos, quantidade_vagas } = req.body;
  if (!nome_cargo) {
    return res.status(400).json({ error: 'O nome do cargo é obrigatório.' });
  }
  try {
    const result = await pool.query(
      'UPDATE cargos SET nome_cargo = $1, complexidade = $2, responsabilidades = $3, requisitos = $4, quantidade_vagas = $5 WHERE id = $6 RETURNING *',
      [nome_cargo, complexidade, responsabilidades, JSON.stringify(requisitos || {}), quantidade_vagas || 1, id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Cargo não encontrado.' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar cargo:', error);
    res.status(500).json({ error: 'Erro ao atualizar cargo.' });
  }
});

// Deletar Cargo (DELETE)
app.delete('/api/cargos/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM cargos WHERE id = $1', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Cargo não encontrado.' });
    }
    res.status(204).send();
  } catch (error) {
    console.error('Erro ao deletar cargo:', error);
    res.status(500).json({ error: 'Erro ao deletar cargo.' });
  }
});

// --- ROTAS DE PERFIL DO USUÁRIO ---

// Buscar perfil do usuário por nome
app.get('/api/users/profile/:userName', async (req, res) => {
  const { userName } = req.params;
  
  console.log('🔍 Buscando perfil do usuário:', userName);
  
  try {
    let query, params;
    if (!isNaN(userName)) {
      // Se é um ID, buscar por ID
      query = 'SELECT id, nome, nome_exibicao, email, tipo_usuario, departamento, cargo_atual, foto_perfil, data_cadastro FROM usuarios WHERE id = $1';
      params = [parseInt(userName)];
    } else {
      // Se é um nome, buscar por nome
      query = 'SELECT id, nome, nome_exibicao, email, tipo_usuario, departamento, cargo_atual, foto_perfil, data_cadastro FROM usuarios WHERE nome = $1';
      params = [userName];
    }
    
    const result = await pool.query(query, params);
    
    if (result.rows.length === 0) {
      console.log('❌ Usuário não encontrado:', userName);
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    
    console.log('✅ Perfil encontrado:', { 
      id: result.rows[0].id, 
      nome: result.rows[0].nome,
      nome_exibicao: result.rows[0].nome_exibicao,
      foto_perfil: result.rows[0].foto_perfil ? 'Presente' : 'Não presente'
    });
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('❌ Erro ao buscar perfil do usuário:', error);
    res.status(500).json({ error: 'Erro ao buscar perfil do usuário' });
  }
});

// Atualizar perfil do usuário
app.put('/api/users/profile/:userName', async (req, res) => {
  const { userName } = req.params;
  const { departamento, cargo_atual, foto_perfil } = req.body;
  
  console.log('📸 Atualizando perfil do usuário:', { userName, departamento, cargo_atual, foto_perfil: foto_perfil ? 'Foto presente' : 'Sem foto' });
  
  try {
    // Verificar se userName é um ID numérico ou nome
    let query, params;
    if (!isNaN(userName)) {
      // Se é um ID, buscar por ID - NÃO alterar o nome (login)
      query = 'UPDATE usuarios SET departamento = $1, cargo_atual = $2, foto_perfil = $3 WHERE id = $4 RETURNING *';
      params = [departamento, cargo_atual, foto_perfil, parseInt(userName)];
    } else {
      // Se é um nome, buscar por nome - NÃO alterar o nome (login)
      query = 'UPDATE usuarios SET departamento = $1, cargo_atual = $2, foto_perfil = $3 WHERE nome = $4 RETURNING *';
      params = [departamento, cargo_atual, foto_perfil, userName];
    }
    
    const result = await pool.query(query, params);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    
    console.log('✅ Perfil atualizado com sucesso:', { 
      id: result.rows[0].id, 
      nome: result.rows[0].nome,
      foto_perfil: result.rows[0].foto_perfil ? 'Salva' : 'Não salva'
    });
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('❌ Erro ao atualizar perfil do usuário:', error);
    res.status(500).json({ error: 'Erro ao atualizar perfil do usuário' });
  }
});

// Atualizar nome de exibição do usuário (separado do login)
app.put('/api/users/display-name/:userName', async (req, res) => {
  const { userName } = req.params;
  const { displayName } = req.body;
  
  console.log('📝 Atualizando nome de exibição do usuário:', { userName, displayName });
  
  try {
    // Verificar se userName é um ID numérico ou nome
    let query, params;
    if (!isNaN(userName)) {
      // Se é um ID, buscar por ID
      query = 'UPDATE usuarios SET nome_exibicao = $1 WHERE id = $2 RETURNING *';
      params = [displayName, parseInt(userName)];
    } else {
      // Se é um nome, buscar por nome
      query = 'UPDATE usuarios SET nome_exibicao = $1 WHERE nome = $2 RETURNING *';
      params = [displayName, userName];
    }
    
    const result = await pool.query(query, params);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    
    console.log('✅ Nome de exibição atualizado com sucesso:', { 
      id: result.rows[0].id, 
      nome: result.rows[0].nome,
      nome_exibicao: result.rows[0].nome_exibicao
    });
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('❌ Erro ao atualizar nome de exibição:', error);
    res.status(500).json({ error: 'Erro ao atualizar nome de exibição' });
  }
});

// --- ROTAS DE CURRÍCULO ---

// Upload de currículo
app.post('/api/users/curriculum/:userName', upload.single('curriculum'), async (req, res) => {
  const { userName } = req.params;
  const file = req.file;
  
  console.log('📄 Upload de currículo para usuário:', userName);
  console.log('📄 Arquivo recebido:', file ? {
    originalname: file.originalname,
    mimetype: file.mimetype,
    size: file.size,
    buffer: file.buffer ? 'Presente' : 'Não presente'
  } : 'Nenhum arquivo');
  
  if (!file) {
    return res.status(400).json({ error: 'Nenhum arquivo enviado' });
  }
  
  // Validar tipo de arquivo
  if (file.mimetype !== 'application/pdf') {
    return res.status(400).json({ error: 'Apenas arquivos PDF são permitidos' });
  }
  
  // Validar tamanho (máximo 10MB)
  if (file.size > 10 * 1024 * 1024) {
    return res.status(400).json({ error: 'O arquivo deve ter no máximo 10MB' });
  }
  
  try {
    console.log('📄 Tentando salvar no banco de dados...');
    let query, params;
    if (!isNaN(userName)) {
      // Se é um ID, buscar por ID
      query = 'UPDATE usuarios SET curriculo = $1, curriculo_nome = $2 WHERE id = $3 RETURNING id, nome, curriculo, curriculo_nome';
      params = [file.buffer, file.originalname, parseInt(userName)];
    } else {
      // Se é um nome, buscar por nome
      query = 'UPDATE usuarios SET curriculo = $1, curriculo_nome = $2 WHERE nome = $3 RETURNING id, nome, curriculo, curriculo_nome';
      params = [file.buffer, file.originalname, userName];
    }
    
    const result = await pool.query(query, params);
    
    if (result.rows.length === 0) {
      console.log('❌ Usuário não encontrado:', userName);
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    
    console.log('✅ Currículo salvo com sucesso:', { 
      id: result.rows[0].id, 
      nome: result.rows[0].nome,
      curriculo: result.rows[0].curriculo ? 'Presente' : 'Não presente',
      curriculo_nome: result.rows[0].curriculo_nome
    });
    
    res.json({ 
      success: true, 
      message: 'Currículo enviado com sucesso',
      fileName: file.originalname,
      fileSize: file.size
    });
  } catch (error) {
    console.error('❌ Erro ao salvar currículo:', error);
    console.error('❌ Detalhes do erro:', {
      message: error.message,
      stack: error.stack,
      code: error.code
    });
    res.status(500).json({ 
      error: 'Erro ao salvar currículo',
      details: error.message
    });
  }
});

// Download de currículo
app.get('/api/users/curriculum/:userName', async (req, res) => {
  const { userName } = req.params;
  
  console.log('📄 Buscando currículo do usuário:', userName);
  
  try {
    let query, params;
    if (!isNaN(userName)) {
      // Se é um ID, buscar por ID
      query = 'SELECT curriculo, curriculo_nome FROM usuarios WHERE id = $1';
      params = [parseInt(userName)];
    } else {
      // Se é um nome, buscar por nome
      query = 'SELECT curriculo, curriculo_nome FROM usuarios WHERE nome = $1';
      params = [userName];
    }
    
    const result = await pool.query(query, params);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    
    if (!result.rows[0].curriculo) {
      return res.status(404).json({ error: 'Currículo não encontrado' });
    }
    
    console.log('✅ Currículo encontrado para usuário:', userName);
    
    // Usar nome original do arquivo ou nome padrão
    const fileName = result.rows[0].curriculo_nome || `curriculo_${userName}.pdf`;
    
    // Configurar headers para download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', result.rows[0].curriculo.length);
    
    res.send(result.rows[0].curriculo);
  } catch (error) {
    console.error('❌ Erro ao buscar currículo:', error);
    res.status(500).json({ error: 'Erro ao buscar currículo' });
  }
});

// Verificar se usuário tem currículo
app.get('/api/users/curriculum/:userName/status', async (req, res) => {
  const { userName } = req.params;
  
  console.log('📄 Verificando status do currículo para usuário:', userName);
  
  try {
    let query, params;
    if (!isNaN(userName)) {
      // Se é um ID, buscar por ID
      query = 'SELECT curriculo, curriculo_nome FROM usuarios WHERE id = $1';
      params = [parseInt(userName)];
    } else {
      // Se é um nome, buscar por nome
      query = 'SELECT curriculo, curriculo_nome FROM usuarios WHERE nome = $1';
      params = [userName];
    }
    
    const result = await pool.query(query, params);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    
    const curriculo = result.rows[0].curriculo;
    const curriculoNome = result.rows[0].curriculo_nome;
    const hasCurriculum = curriculo !== null && curriculo.length > 0;
    const fileSize = curriculo ? curriculo.length : 0;
    
    console.log('✅ Status do currículo verificado:', { 
      usuario: userName, 
      tem_curriculo: hasCurriculum,
      tamanho: fileSize,
      nome_arquivo: curriculoNome
    });
    
    res.json({ 
      hasCurriculum,
      fileSize,
      fileName: curriculoNome || 'curriculo.pdf',
      message: hasCurriculum ? 'Currículo encontrado' : 'Nenhum currículo encontrado'
    });
  } catch (error) {
    console.error('❌ Erro ao verificar currículo:', error);
    res.status(500).json({ error: 'Erro ao verificar currículo' });
  }
});

// Excluir currículo
app.delete('/api/users/curriculum/:userName', async (req, res) => {
  const { userName } = req.params;
  
  console.log('🗑️ Excluindo currículo do usuário:', userName);
  
  try {
    let query, params;
    if (!isNaN(userName)) {
      // Se é um ID, buscar por ID
      query = 'UPDATE usuarios SET curriculo = NULL, curriculo_nome = NULL WHERE id = $1 RETURNING id, nome';
      params = [parseInt(userName)];
    } else {
      // Se é um nome, buscar por nome
      query = 'UPDATE usuarios SET curriculo = NULL, curriculo_nome = NULL WHERE nome = $1 RETURNING id, nome';
      params = [userName];
    }
    
    const result = await pool.query(query, params);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    
    console.log('✅ Currículo excluído com sucesso:', { 
      id: result.rows[0].id, 
      nome: result.rows[0].nome
    });
    
    res.json({ 
      success: true, 
      message: 'Currículo excluído com sucesso' 
    });
  } catch (error) {
    console.error('❌ Erro ao excluir currículo:', error);
    res.status(500).json({ error: 'Erro ao excluir currículo' });
  }
});

// Adicionar área se não existir
app.post('/api/areas', async (req, res) => {
  const { nome } = req.body;
  
  if (!nome) {
    return res.status(400).json({ error: 'Nome da área é obrigatório' });
  }
  
  try {
    // Verificar se a área já existe
    const existingArea = await pool.query('SELECT id FROM areas WHERE nome = $1', [nome]);
    
    if (existingArea.rows.length > 0) {
      return res.json(existingArea.rows[0]);
    }
    
    // Criar nova área
    const result = await pool.query('INSERT INTO areas (nome) VALUES ($1) RETURNING *', [nome]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao adicionar área:', error);
    res.status(500).json({ error: 'Erro ao adicionar área' });
  }
});

// Adicionar cargo se não existir
app.post('/api/positions', async (req, res) => {
  const { nome_cargo, area_nome } = req.body;
  
  if (!nome_cargo || !area_nome) {
    return res.status(400).json({ error: 'Nome do cargo e área são obrigatórios' });
  }
  
  try {
    // Buscar área
    const areaResult = await pool.query('SELECT id FROM areas WHERE nome = $1', [area_nome]);
    
    if (areaResult.rows.length === 0) {
      return res.status(404).json({ error: 'Área não encontrada' });
    }
    
    const areaId = areaResult.rows[0].id;
    
    // Verificar se o cargo já existe
    const existingPosition = await pool.query('SELECT id FROM cargos WHERE nome_cargo = $1 AND area_id = $2', [nome_cargo, areaId]);
    
    if (existingPosition.rows.length > 0) {
      return res.json(existingPosition.rows[0]);
    }
    
    // Criar novo cargo
    const result = await pool.query(
      'INSERT INTO cargos (nome_cargo, area_id, requisitos) VALUES ($1, $2, $3) RETURNING *',
      [nome_cargo, areaId, JSON.stringify({})]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao adicionar cargo:', error);
    res.status(500).json({ error: 'Erro ao adicionar cargo' });
  }
});

// Endpoint de login
app.post('/login', async (req, res) => {
  const { usuario, senha } = req.body;

  try {
    const query = 'SELECT * FROM usuarios WHERE nome = $1 AND senha = $2';
    const result = await pool.query(query, [usuario, senha]);

    if (result.rows.length > 0) {
      const user = result.rows[0];
      res.json({ 
        success: true, 
        message: 'Login válido', 
        tipo_usuario: user.tipo_usuario, 
        id: user.id, 
        nome: user.nome,
        foto_perfil: user.foto_perfil || null
      });
    } else {
      res.status(401).json({ success: false, message: 'Usuário ou senha incorretos.' });
    }
  } catch (error) {
    console.error('Erro na consulta do login:', error);
    res.status(500).json({ success: false, message: 'Erro interno no servidor' });
  }
});

// --- ROTAS DE CERTIFICADOS (REMOVIDAS - USAR NOVOS ENDPOINTS ABAIXO) ---

// --- ROTAS DE RECOMENDAÇÃO DE CURSOS (CRUD COMPLETO) ---

// Listar todos os cursos (GET)
app.get('/api/cursos', async (req, res) => {
  try {
    // A query agora busca pelas novas colunas e renomeia "new" para "is_new" para evitar conflitos de palavra-chave
    const result = await pool.query('SELECT id, title, platform, description, area, level, duration, badge, badgeColor, url, featured, "new" as is_new FROM cursos ORDER BY id DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar cursos:', error);
    res.status(500).json({ error: 'Erro ao buscar cursos' });
  }
});

// Adicionar um novo curso (POST)
app.post('/api/cursos', async (req, res) => {
  const { title, platform, url, area, level, duration, badge, badgeColor, description, featured, "new": is_new } = req.body;

  // Validação simples
  if (!title || !platform || !url) {
    return res.status(400).json({ error: 'Título, plataforma e URL são obrigatórios.' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO cursos (title, platform, url, area, level, duration, badge, badgeColor, description, featured, "new")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING id, title, platform, description, area, level, duration, badge, badgeColor, url, featured, "new" as is_new`,
      [title, platform, url, area, level, duration, badge, badgeColor, description, featured || false, is_new || false]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao adicionar curso:', error);
    res.status(500).json({ error: 'Erro ao adicionar curso' });
  }
});

// Atualizar um curso existente (PUT)
app.put('/api/cursos/:id', async (req, res) => {
  const { id } = req.params;
  const { title, platform, url, area, level, duration, badge, badgeColor, description, featured, "new": is_new } = req.body;

  try {
    const result = await pool.query(
      `UPDATE cursos 
       SET title = $1, platform = $2, url = $3, area = $4, level = $5, duration = $6, badge = $7, badgeColor = $8, description = $9, featured = $10, "new" = $11
       WHERE id = $12
       RETURNING id, title, platform, description, area, level, duration, badge, badgeColor, url, featured, "new" as is_new`,
      [title, platform, url, area, level, duration, badge, badgeColor, description, featured, is_new, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Curso não encontrado.' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar curso:', error);
    res.status(500).json({ error: 'Erro ao atualizar curso' });
  }
});

// Deletar um curso (DELETE)
app.delete('/api/cursos/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('DELETE FROM cursos WHERE id = $1', [id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Curso não encontrado.' });
    }

    res.status(204).send(); // 204 No Content
  } catch (error) {
    console.error('Erro ao deletar curso:', error);
    res.status(500).json({ error: 'Erro ao deletar curso' });
  }
});

// --- ROTAS DE RECURSOS DA BIBLIOTECA ---

// Listar recursos da biblioteca
app.get('/api/recursos', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM recursos WHERE ativo = true ORDER BY titulo');
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar recursos:', error);
    res.status(500).json({ error: 'Erro ao buscar recursos' });
  }
});

// Buscar recursos com filtros
app.get('/api/recursos/buscar', async (req, res) => {
  const { tipo, categoria, busca } = req.query;
  
  try {
    let query = 'SELECT * FROM recursos WHERE ativo = true';
    const params = [];
    let paramIndex = 1;

    if (tipo && tipo !== 'all') {
      query += ` AND tipo = $${paramIndex}`;
      params.push(tipo);
      paramIndex++;
    }

    if (categoria && categoria !== 'all') {
      query += ` AND categoria = $${paramIndex}`;
      params.push(categoria);
      paramIndex++;
    }

    if (busca) {
      query += ` AND (titulo ILIKE $${paramIndex} OR descricao ILIKE $${paramIndex} OR autor ILIKE $${paramIndex})`;
      params.push(`%${busca}%`);
      paramIndex++;
    }

    query += ' ORDER BY titulo';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar recursos:', error);
    res.status(500).json({ error: 'Erro ao buscar recursos' });
  }
});

// --- ROTAS DE PROGRESSO DO USUÁRIO ---

// Buscar progresso do usuário
app.get('/api/progresso/:usuario_id', async (req, res) => {
  const { usuario_id } = req.params;
  
  try {
    const result = await pool.query(
      `SELECT p.*, c.titulo as curso_titulo, c.plataforma, c.categoria
       FROM progresso_usuario p
       JOIN cursos c ON p.curso_id = c.id
       WHERE p.usuario_id = $1
       ORDER BY p.ultima_atividade DESC`,
      [usuario_id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar progresso:', error);
    res.status(500).json({ error: 'Erro ao buscar progresso' });
  }
});

// Atualizar progresso do usuário
app.post('/api/progresso', async (req, res) => {
  const { usuario_id, curso_id, progresso_percentual, horas_estudadas, status } = req.body;
  
  try {
    const result = await pool.query(
      `INSERT INTO progresso_usuario (usuario_id, curso_id, progresso_percentual, horas_estudadas, status, ultima_atividade)
       VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
       ON CONFLICT (usuario_id, curso_id) 
       DO UPDATE SET 
         progresso_percentual = $3,
         horas_estudadas = $4,
         status = $5,
         ultima_atividade = CURRENT_TIMESTAMP
       RETURNING *`,
      [usuario_id, curso_id, progresso_percentual, horas_estudadas, status]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar progresso:', error);
    res.status(500).json({ error: 'Erro ao atualizar progresso' });
  }
});

// --- ROTAS DE ATIVIDADES DO USUÁRIO ---

// Buscar atividades do usuário
app.get('/api/atividades/:usuario_id', async (req, res) => {
  const { usuario_id } = req.params;
  
  try {
    const result = await pool.query(
      `SELECT * FROM atividades_usuario 
       WHERE usuario_id = $1 
       ORDER BY data_atividade DESC 
       LIMIT 10`,
      [usuario_id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar atividades:', error);
    res.status(500).json({ error: 'Erro ao buscar atividades' });
  }
});

// Adicionar atividade do usuário
app.post('/api/atividades', async (req, res) => {
  const { usuario_id, tipo, titulo, descricao, dados_extras } = req.body;
  
  try {
    const result = await pool.query(
      `INSERT INTO atividades_usuario (usuario_id, tipo, titulo, descricao, dados_extras)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [usuario_id, tipo, titulo, descricao, dados_extras]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao adicionar atividade:', error);
    res.status(500).json({ error: 'Erro ao adicionar atividade' });
  }
});

// --- ROTAS DE IA E RECOMENDAÇÕES ---

// API para recomendações personalizadas
app.get('/api/recommendations', async (req, res) => {
  const userId = req.query.user_id;
  
  try {
    // Buscar recomendações do banco de dados
    const result = await pool.query(
      `SELECT r.*, c.titulo, c.plataforma, c.duracao, c.nivel, c.categoria
       FROM recomendacoes_ia r
       JOIN cursos c ON r.curso_id = c.id
       WHERE r.usuario_id = $1 AND r.visualizada = false
       ORDER BY r.relevancia DESC
       LIMIT 5`,
      [userId]
    );

    if (result.rows.length === 0) {
      // Se não há recomendações, gerar baseado no perfil
      const recomendacoes = await gerarRecomendacoes(userId);
      res.json(recomendacoes);
    } else {
      res.json(result.rows);
    }
  } catch (error) {
    console.error('Erro ao gerar recomendações:', error);
    res.status(500).json({ error: 'Erro ao gerar recomendações' });
  }
});

// Função para gerar recomendações baseadas no perfil
async function gerarRecomendacoes(userId) {
  try {
    // Buscar cursos mais populares
    const result = await pool.query(
      `SELECT * FROM cursos 
       WHERE ativo = true 
       ORDER BY estudantes DESC, avaliacao DESC 
       LIMIT 5`
    );

    return result.rows.map((curso, index) => ({
      id: curso.id,
      titulo: curso.titulo,
      plataforma: curso.plataforma,
      duracao: curso.duracao,
      nivel: curso.nivel,
      relevancia: 90 - (index * 10),
      categoria: curso.categoria,
      razao: 'Baseado na popularidade e avaliações'
    }));
  } catch (error) {
    console.error('Erro ao gerar recomendações:', error);
    return [];
  }
}

// API para estatísticas do dashboard
app.get('/api/dashboard/stats/:usuario_id', async (req, res) => {
  const { usuario_id } = req.params;
  
  try {
    // Se o usuario_id não é um número, buscar pelo nome
    let userId = usuario_id;
    if (isNaN(usuario_id)) {
      const userResult = await pool.query('SELECT id FROM usuarios WHERE nome = $1', [usuario_id]);
      if (userResult.rows.length === 0) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }
      userId = userResult.rows[0].id;
    }
    
    // Buscar estatísticas do usuário
    const [certificados, progresso, atividades] = await Promise.all([
      pool.query('SELECT COUNT(*) as total FROM certificados WHERE usuario_id = $1', [userId]),
      pool.query('SELECT COUNT(*) as total, SUM(horas_estudadas) as horas FROM progresso_usuario WHERE usuario_id = $1', [userId]),
      pool.query('SELECT COUNT(*) as total FROM atividades_usuario WHERE usuario_id = $1', [userId])
    ]);

    const stats = {
      cursosConcluidos: parseInt(progresso.rows[0]?.total || 0),
      horasEstudadas: parseInt(progresso.rows[0]?.horas || 0),
      certificados: parseInt(certificados.rows[0]?.total || 0),
      progressoGeral: Math.min(100, Math.round((parseInt(progresso.rows[0]?.total || 0) / 20) * 100)),
      proximaMeta: 'Desenvolvedor Full Stack',
      tempoEstimado: '3 meses'
    };

    res.json(stats);
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({ error: 'Erro ao buscar estatísticas' });
  }
});

// Endpoint de debug para verificar consulta SQL
app.get('/api/debug/users/:userName', async (req, res) => {
  const { userName } = req.params;
  
  console.log('🔍 Verificando usuário:', userName);
  
  try {
    // Testar consulta exata
    const exactQuery = await pool.query(
      'SELECT * FROM usuarios WHERE nome = $1',
      [userName]
    );
    
    // Testar consulta case-insensitive
    const caseInsensitiveQuery = await pool.query(
      'SELECT * FROM usuarios WHERE LOWER(nome) = LOWER($1)',
      [userName]
    );
    
    // Listar todos os usuários para comparação
    const allUsers = await pool.query('SELECT id, nome, email FROM usuarios ORDER BY id');
    
    res.json({
      searchedFor: userName,
      exactMatch: {
        found: exactQuery.rows.length > 0,
        user: exactQuery.rows[0] || null
      },
      caseInsensitiveMatch: {
        found: caseInsensitiveQuery.rows.length > 0,
        user: caseInsensitiveQuery.rows[0] || null
      },
      allUsers: allUsers.rows,
      debug: {
        exactQuery: `SELECT * FROM usuarios WHERE nome = '${userName}'`,
        caseInsensitiveQuery: `SELECT * FROM usuarios WHERE LOWER(nome) = LOWER('${userName}')`
      }
    });
    
  } catch (error) {
    console.error('❌ Erro na consulta:', error);
    res.status(500).json({ 
      error: 'Erro na consulta',
      debug: {
        error: error.message,
        stack: error.stack
      }
    });
  }
});

// Buscar foto do usuário por nome (para navbar)
app.get('/api/users/photo/:userName', async (req, res) => {
  const { userName } = req.params;
  
  try {
    // Primeiro, vamos verificar se o usuário existe
    const checkUser = await pool.query(
      'SELECT id, nome, email FROM usuarios WHERE nome = $1',
      [userName]
    );
    
    if (checkUser.rows.length === 0) {
      console.log('❌ Usuário não encontrado:', userName);
      
      // Vamos listar todos os usuários para debug
      const allUsers = await pool.query('SELECT id, nome, email FROM usuarios');
      
      return res.status(404).json({ 
        error: 'Usuário não encontrado',
        debug: {
          searchedFor: userName,
          totalUsers: allUsers.rows.length,
          allUsers: allUsers.rows.map(u => ({ id: u.id, nome: u.nome }))
        }
      });
    }
    
    // Agora buscar a foto
    const result = await pool.query(
      'SELECT foto_perfil FROM usuarios WHERE nome = $1',
      [userName]
    );
    
    console.log('✅ Foto encontrada para usuário:', userName);
    
    res.json({ foto_perfil: result.rows[0].foto_perfil });
  } catch (error) {
    console.error('❌ Erro ao buscar foto do usuário:', error);
    res.status(500).json({ 
      error: 'Erro ao buscar foto do usuário',
      debug: {
        error: error.message,
        stack: error.stack
      }
    });
  }
});

// Endpoint de teste para verificar estado do banco
app.get('/api/test/database', async (req, res) => {
  try {
    // Testar conexão
    const result = await pool.query('SELECT NOW() as current_time');
    
    // Verificar tabela de usuários
    const usersResult = await pool.query('SELECT COUNT(*) as total FROM usuarios');
    
    // Verificar estrutura da tabela
    const structureResult = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'usuarios' 
      ORDER BY ordinal_position
    `);
    
    res.json({
      status: 'OK',
      database_time: result.rows[0].current_time,
      total_users: usersResult.rows[0].total,
      table_structure: structureResult.rows,
      message: 'Banco de dados funcionando corretamente'
    });
  } catch (error) {
    console.error('❌ Erro no teste do banco:', error);
    res.status(500).json({ 
      status: 'ERROR',
      error: error.message,
      message: 'Problema com o banco de dados'
    });
  }
});

// Endpoint de teste para verificar usuário específico
app.get('/api/test/user/:userName', async (req, res) => {
  const { userName } = req.params;
  
  try {
    const result = await pool.query(
      'SELECT id, nome, email, tipo_usuario, departamento, cargo_atual, foto_perfil, data_cadastro FROM usuarios WHERE nome = $1',
      [userName]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        status: 'NOT_FOUND',
        message: 'Usuário não encontrado',
        userName: userName
      });
    }
    
    const user = result.rows[0];
    res.json({
      status: 'FOUND',
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        tipo_usuario: user.tipo_usuario,
        departamento: user.departamento,
        cargo_atual: user.cargo_atual,
        foto_perfil: user.foto_perfil ? 'Presente' : 'Não presente',
        foto_tamanho: user.foto_perfil ? user.foto_perfil.length : 0,
        data_cadastro: user.data_cadastro
      }
    });
  } catch (error) {
    console.error('❌ Erro ao buscar usuário:', error);
    res.status(500).json({ 
      status: 'ERROR',
      error: error.message,
      message: 'Erro ao buscar usuário'
    });
  }
});

// ===== ENDPOINTS PARA CERTIFICADOS =====

// Buscar certificados de um usuário (DEVE VIR ANTES DO /:id)
app.get('/api/certificados/usuario/:userId', async (req, res) => {
  const { userId } = req.params;
  
  console.log('🔍 Buscando certificados para usuário:', userId);
  
  try {
    const result = await pool.query(
      'SELECT id, nome, instituicao, data_conclusao, descricao, pdf IS NOT NULL as tem_pdf FROM certificados WHERE usuario_id = $1 ORDER BY data_conclusao DESC',
      [userId]
    );
    
    console.log('✅ Certificados encontrados:', result.rows.length);
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Erro ao buscar certificados:', error);
    res.status(500).json({ error: 'Erro ao buscar certificados' });
  }
});

// Buscar PDF do certificado (DEVE VIR ANTES DO /:id)
app.get('/api/certificados/:id/pdf', async (req, res) => {
  const { id } = req.params;
  
  try {
    const result = await pool.query(
      'SELECT pdf, nome FROM certificados WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0 || !result.rows[0].pdf) {
      return res.status(404).json({ error: 'PDF não encontrado' });
    }
    
    const { pdf, nome } = result.rows[0];
    const filename = `${nome.replace(/[^a-zA-Z0-9]/g, '_')}_certificado.pdf`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    res.send(pdf);
  } catch (error) {
    console.error('Erro ao buscar PDF:', error);
    res.status(500).json({ error: 'Erro ao buscar PDF' });
  }
});

// Buscar certificado específico (DEVE VIR POR ÚLTIMO)
app.get('/api/certificados/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    const result = await pool.query(
      'SELECT id, nome, instituicao, data_inicio, data_conclusao, descricao FROM certificados WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Certificado não encontrado' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao buscar certificado:', error);
    res.status(500).json({ error: 'Erro ao buscar certificado' });
  }
});

// Adicionar novo certificado
app.post('/api/certificados', upload.single('pdf'), async (req, res) => {
  console.log('🔍 Recebendo requisição POST para certificados');
  console.log('📋 Body:', req.body);
  console.log('📁 File:', req.file ? 'Presente' : 'Não presente');
  
  const { usuario_id, nome, instituicao, data_inicio, data_conclusao, descricao } = req.body;
  const pdfBuffer = req.file ? req.file.buffer : null;
  
  if (!usuario_id || !nome || !instituicao || !data_conclusao) {
    console.log('❌ Campos obrigatórios não fornecidos');
    console.log('📋 Campos recebidos:', { usuario_id, nome, instituicao, data_inicio, data_conclusao });
    return res.status(400).json({ error: 'Campos obrigatórios não fornecidos' });
  }
  
  // Se data_inicio não for fornecida, usar a data_conclusao
  const dataInicio = data_inicio || data_conclusao;
  
  try {
    const result = await pool.query(
      'INSERT INTO certificados (usuario_id, nome, instituicao, data_inicio, data_conclusao, descricao, pdf) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
      [usuario_id, nome, instituicao, dataInicio, data_conclusao, descricao, pdfBuffer]
    );
    
    console.log('✅ Certificado adicionado com sucesso, ID:', result.rows[0].id);
    res.status(201).json({ id: result.rows[0].id, message: 'Certificado adicionado com sucesso' });
  } catch (error) {
    console.error('❌ Erro ao adicionar certificado:', error);
    res.status(500).json({ error: 'Erro ao adicionar certificado' });
  }
});

// Atualizar certificado
app.put('/api/certificados/:id', upload.single('pdf'), async (req, res) => {
  const { id } = req.params;
  const { nome, instituicao, data_inicio, data_conclusao, descricao } = req.body;
  const pdfBuffer = req.file ? req.file.buffer : null;
  
  if (!nome || !instituicao || !data_conclusao) {
    return res.status(400).json({ error: 'Campos obrigatórios não fornecidos' });
  }
  
  // Se data_inicio não for fornecida, usar a data_conclusao
  const dataInicio = data_inicio || data_conclusao;
  
  try {
    let query, params;
    
    if (pdfBuffer) {
      // Atualizar com novo PDF
      query = 'UPDATE certificados SET nome = $1, instituicao = $2, data_inicio = $3, data_conclusao = $4, descricao = $5, pdf = $6 WHERE id = $7 RETURNING id';
      params = [nome, instituicao, dataInicio, data_conclusao, descricao, pdfBuffer, id];
    } else {
      // Atualizar sem alterar PDF
      query = 'UPDATE certificados SET nome = $1, instituicao = $2, data_inicio = $3, data_conclusao = $4, descricao = $5 WHERE id = $6 RETURNING id';
      params = [nome, instituicao, dataInicio, data_conclusao, descricao, id];
    }
    
    const result = await pool.query(query, params);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Certificado não encontrado' });
    }
    
    res.json({ id: result.rows[0].id, message: 'Certificado atualizado com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar certificado:', error);
    res.status(500).json({ error: 'Erro ao atualizar certificado' });
  }
});

// Excluir certificado
app.delete('/api/certificados/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    const result = await pool.query('DELETE FROM certificados WHERE id = $1', [id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Certificado não encontrado' });
    }
    
    res.json({ message: 'Certificado excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir certificado:', error);
    res.status(500).json({ error: 'Erro ao excluir certificado' });
  }
});

// Iniciar servidor apenas após o banco estar pronto
async function startServer() {
  const dbReady = await waitForDatabase();
  
  if (dbReady) {
app.listen(PORT, () => {
      console.log(`🚀 Servidor rodando na porta ${PORT}`);
      console.log(`📊 Acesse: http://localhost:${PORT}`);
    });
  } else {
    console.error('❌ Não foi possível iniciar o servidor - banco de dados não disponível');
    process.exit(1);
  }
}

startServer(); 