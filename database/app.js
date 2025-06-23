const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

// Configuração da conexão com PostgreSQL
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'pearspective',
  user: 'admin',
  password: 'admin123',
});

app.use(cors());
app.use(express.json());

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
  if (!area_id) {
    return res.status(400).json({ error: 'area_id não fornecido' });
  }
  try {
    const query = 'SELECT id, nome_cargo FROM cargos WHERE area_id = $1';
    const result = await pool.query(query, [area_id]);
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
  const { area_id, nome_cargo, complexidade, responsabilidades, requisitos } = req.body;
  if (!area_id || !nome_cargo) {
    return res.status(400).json({ error: 'ID da área e nome do cargo são obrigatórios.' });
  }
  try {
    const result = await pool.query(
      'INSERT INTO cargos (area_id, nome_cargo, complexidade, responsabilidades, requisitos) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [area_id, nome_cargo, complexidade, responsabilidades, JSON.stringify(requisitos || {})]
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
  const { nome_cargo, complexidade, responsabilidades, requisitos } = req.body;
  if (!nome_cargo) {
    return res.status(400).json({ error: 'O nome do cargo é obrigatório.' });
  }
  try {
    const result = await pool.query(
      'UPDATE cargos SET nome_cargo = $1, complexidade = $2, responsabilidades = $3, requisitos = $4 WHERE id = $5 RETURNING *',
      [nome_cargo, complexidade, responsabilidades, JSON.stringify(requisitos || {}), id]
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

// Endpoint de login
app.post('/login', async (req, res) => {
  const { usuario, senha } = req.body;

  try {
    const query = 'SELECT * FROM usuarios WHERE nome = $1 AND senha = $2';
    const result = await pool.query(query, [usuario, senha]);

    if (result.rows.length > 0) {
      const user = result.rows[0];
      res.json({ success: true, message: 'Login válido', tipo_usuario: user.tipo_usuario, id: user.id, nome: user.nome });
    } else {
      res.status(401).json({ success: false, message: 'Usuário ou senha incorretos.' });
    }
  } catch (error) {
    console.error('Erro na consulta do login:', error);
    res.status(500).json({ success: false, message: 'Erro interno no servidor' });
  }
});

// --- ROTAS DE CERTIFICADOS ---

// Listar certificados de um usuário
app.get('/api/certificados', async (req, res) => {
  const userId = req.query.usuario_id;
  if (!userId) {
    return res.status(400).json({ error: 'ID do usuário não fornecido' });
  }
  try {
    const result = await pool.query(
      `SELECT id, nome, data_inicio, data_conclusao, instituicao, status, nota, horas, categoria, descricao FROM certificados WHERE usuario_id = $1 ORDER BY data_conclusao DESC`,
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Erro ao buscar certificados:', err);
    res.status(500).json({ error: 'Erro ao buscar certificados' });
  }
});

// Adicionar certificado
app.post('/api/certificados', async (req, res) => {
  const { usuario_id, nome, data_inicio, data_conclusao, instituicao, nota, horas, categoria, descricao } = req.body;
  if (!usuario_id || !nome || !data_inicio || !data_conclusao || !instituicao) {
    return res.status(400).json({ error: 'Campos obrigatórios não fornecidos.' });
  }
  try {
    const result = await pool.query(
      `INSERT INTO certificados (usuario_id, nome, data_inicio, data_conclusao, instituicao, nota, horas, categoria, descricao)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [usuario_id, nome, data_inicio, data_conclusao, instituicao, nota, horas, categoria, descricao]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Erro ao adicionar certificado:', err);
    res.status(500).json({ error: 'Erro ao adicionar certificado' });
  }
});

// Deletar certificado
app.delete('/api/certificados/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM certificados WHERE id = $1', [id]);
    res.status(204).send();
  } catch (err) {
    console.error('Erro ao deletar certificado:', err);
    res.status(500).json({ error: 'Erro ao deletar certificado' });
  }
});

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

// --- ROTAS DE ANALYTICS ---

// API para métricas de uso
app.get('/api/analytics/usage', async (req, res) => {
  try {
    // Buscar métricas mais recentes do banco
    const result = await pool.query(
      `SELECT * FROM metricas_analytics 
       ORDER BY data_metricas DESC 
       LIMIT 1`
    );

    if (result.rows.length > 0) {
      const metricas = result.rows[0];
      res.json({
        totalUsers: metricas.total_usuarios,
        activeUsers: metricas.usuarios_ativos,
        courseCompletionRate: metricas.taxa_conclusao,
        averageSatisfaction: metricas.satisfacao_media,
        totalHours: metricas.total_horas,
        certificatesIssued: metricas.certificados_emitidos,
        monthlyEngagement: metricas.dados_mensais,
        departmentPerformance: metricas.dados_departamento
      });
    } else {
      // Dados padrão se não houver métricas
      res.json({
        totalUsers: 1247,
        activeUsers: 892,
        courseCompletionRate: 76.5,
        averageSatisfaction: 4.2,
        totalHours: 2847,
        certificatesIssued: 342,
        monthlyEngagement: [],
        departmentPerformance: []
      });
    }
  } catch (error) {
    console.error('Erro ao buscar métricas:', error);
    res.status(500).json({ error: 'Erro ao buscar métricas' });
  }
});

// API para estatísticas do dashboard
app.get('/api/dashboard/stats/:usuario_id', async (req, res) => {
  const { usuario_id } = req.params;
  
  try {
    // Buscar estatísticas do usuário
    const [certificados, progresso, atividades] = await Promise.all([
      pool.query('SELECT COUNT(*) as total FROM certificados WHERE usuario_id = $1', [usuario_id]),
      pool.query('SELECT COUNT(*) as total, SUM(horas_estudadas) as horas FROM progresso_usuario WHERE usuario_id = $1', [usuario_id]),
      pool.query('SELECT COUNT(*) as total FROM atividades_usuario WHERE usuario_id = $1', [usuario_id])
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

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
}); 