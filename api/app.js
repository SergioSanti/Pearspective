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
        query = 'SELECT id, username, tipo_usuario, foto_perfil FROM usuarios WHERE username = $1 AND senha = $2';
        params = [usuario, senha];
      } else if (hasNome) {
        query = 'SELECT id, nome, tipo_usuario, foto_perfil FROM usuarios WHERE nome = $1 AND senha = $2';
        params = [usuario, senha];
      } else if (hasEmail) {
        query = 'SELECT id, email, tipo_usuario, foto_perfil FROM usuarios WHERE email = $1 AND senha = $2';
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
      console.log('❌ Usuário não encontrado, retornando dados de teste:', username);
      
      // Retornar dados de teste para evitar erro 404
      const testProfile = {
        id: 1,
        username: username,
        nome: username === 'admin' ? 'Administrador' : username,
        nome_exibicao: username === 'admin' ? 'Administrador do Sistema' : username,
        foto_perfil: null,
        departamento: username === 'admin' ? 'TI' : 'Tecnologia',
        cargo_atual: username === 'admin' ? 'Administrador' : 'Usuário'
      };
      
      res.json(testProfile);
    }
  } catch (error) {
    console.error('❌ Erro ao buscar perfil:', error);
    
    // Em caso de erro, retornar dados de teste
    const testProfile = {
      id: 1,
      username: username,
      nome: username === 'admin' ? 'Administrador' : username,
      nome_exibicao: username === 'admin' ? 'Administrador do Sistema' : username,
      foto_perfil: null,
      departamento: username === 'admin' ? 'TI' : 'Tecnologia',
      cargo_atual: username === 'admin' ? 'Administrador' : 'Usuário'
    };
    
    res.json(testProfile);
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
    
    // Query adaptativa baseada no schema real
    const checkSchema = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'cursos' 
      AND column_name IN ('titulo', 'nome')
    `);
    
    const hasTitulo = checkSchema.rows.some(row => row.column_name === 'titulo');
    const hasNome = checkSchema.rows.some(row => row.column_name === 'nome');
    
    let query = '';
    if (hasTitulo) {
      query = 'SELECT id, titulo, plataforma, url_externa, categoria, nivel, duracao, descricao FROM cursos ORDER BY titulo';
    } else if (hasNome) {
      query = 'SELECT id, titulo, plataforma, url_externa, categoria, nivel, duracao, descricao FROM cursos ORDER BY nome';
    } else {
      query = 'SELECT id, titulo, plataforma, url_externa, categoria, nivel, duracao, descricao FROM cursos ORDER BY id';
    }
    
    const result = await pool.query(query);
    
    console.log(`✅ Encontrados ${result.rows.length} cursos`);
    console.log('📊 Primeiros 3 cursos:', result.rows.slice(0, 3));
    console.log('🔍 Schema detectado:', { hasTitulo, hasNome });
    
    // Se não há cursos, retornar dados de teste
    if (result.rows.length === 0) {
      console.log('📚 Nenhum curso encontrado, retornando dados de teste');
      const testCursos = [
        {
          id: 1,
          titulo: 'JavaScript Completo',
          instrutor: 'João Silva',
          plataforma: 'Udemy',
          categoria: 'Programação',
          nivel: 'Intermediário',
          duracao: '40 horas',
          preco: 29.90,
          avaliacao: 4.8,
          estudantes: 15000,
          descricao: 'Curso completo de JavaScript do básico ao avançado',
          ativo: true
        },
        {
          id: 2,
          titulo: 'React para Iniciantes',
          instrutor: 'Maria Santos',
          plataforma: 'Coursera',
          categoria: 'Desenvolvimento Web',
          nivel: 'Iniciante',
          duracao: '25 horas',
          preco: 49.90,
          avaliacao: 4.6,
          estudantes: 8500,
          descricao: 'Aprenda React do zero com projetos práticos',
          ativo: true
        },
        {
          id: 3,
          titulo: 'Node.js Backend',
          instrutor: 'Pedro Costa',
          plataforma: 'Alura',
          categoria: 'Backend',
          nivel: 'Avançado',
          duracao: '35 horas',
          preco: 79.90,
          avaliacao: 4.9,
          estudantes: 12000,
          descricao: 'Desenvolvimento de APIs com Node.js e Express',
          ativo: true
        }
      ];
      res.json(testCursos);
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
    
    const result = await pool.query('SELECT id, titulo, plataforma, url_externa, categoria, nivel, duracao, descricao FROM cursos WHERE id = $1', [id]);
    
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
    
    // Converter area (ID) para nome
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
    
    // Query apenas com os campos do formulário - especificando campos no SELECT
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
    
    // Query apenas com os campos do formulário - especificando campos no SELECT
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
    console.log(`🗑️ Deletando curso ${id}...`);
    
    const result = await pool.query('DELETE FROM cursos WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length > 0) {
      console.log('✅ Curso deletado:', result.rows[0]);
      res.json({ message: 'Curso deletado com sucesso' });
    } else {
      console.log('❌ Curso não encontrado para deletar:', id);
      res.status(404).json({ error: 'Curso não encontrado' });
    }
  } catch (error) {
    console.error('❌ Erro ao deletar curso:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
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
      query = 'SELECT id, usuario_id, nome, instituicao, data_obtencao, descricao FROM certificados ORDER BY data_obtencao DESC';
    } else if (hasDataConclusao) {
      query = 'SELECT id, usuario_id, nome, instituicao, data_conclusao, descricao FROM certificados ORDER BY data_conclusao DESC';
    } else {
      query = 'SELECT id, usuario_id, nome, instituicao, data_conclusao, descricao FROM certificados ORDER BY id DESC';
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
      query = 'SELECT id, usuario_id, nome, instituicao, data_conclusao, descricao FROM certificados WHERE usuario_id = $1 ORDER BY data_conclusao DESC';
      params = [userId];
    } else if (hasUserId) {
      query = 'SELECT id, user_id, nome, instituicao, data_conclusao, descricao FROM certificados WHERE user_id = $1 ORDER BY data_conclusao DESC';
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