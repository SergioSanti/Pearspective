const express = require('express');
const pool = require('./database');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const axios = require('axios');

const app = express();
const PORT = 3000;

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

// ** ROTA NOVA PARA BUSCAR DADOS COMPLETOS DO CARGO PELO ID **
// Rota para buscar dados completos de um cargo pelo ID
app.get('/api/cargos/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  console.log('ID recebido:', id); // Para debug

  if (isNaN(id)) {
    return res.status(400).json({ erro: 'ID inválido' });
  }

  try {
    const result = await pool.query('SELECT * FROM cargos WHERE id = $1', [id]);
    console.log('Resultado da query:', result.rows); // Para debug

    if (result.rows.length === 0) {
      return res.status(404).json({ erro: 'Cargo não encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao buscar cargo:', error);
    res.status(500).json({ erro: 'Erro ao buscar cargo' });
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
const upload = multer();

// Listar certificados de um usuário
app.get('/api/certificados', async (req, res) => {
  const userId = req.query.usuario_id;
  if (!userId) {
    return res.status(400).json({ error: 'ID do usuário não fornecido' });
  }
  try {
    const result = await pool.query(
      `SELECT id, nome, data_inicio, data_conclusao, instituicao FROM certificados WHERE usuario_id = $1 ORDER BY data_conclusao DESC`,
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Erro ao buscar certificados:', err);
    res.status(500).json({ error: 'Erro ao buscar certificados' });
  }
});

// Adicionar certificado
app.post('/api/certificados', upload.single('pdf'), async (req, res) => {
  const { usuario_id, nome, data_inicio, data_conclusao, instituicao } = req.body;
  const pdf = req.file ? req.file.buffer : null;
  if (!usuario_id || !nome || !data_inicio || !data_conclusao || !instituicao || !pdf) {
    return res.status(400).json({ error: 'Todos os campos são obrigatórios, incluindo o PDF.' });
  }
  try {
    const result = await pool.query(
      `INSERT INTO certificados (usuario_id, nome, data_inicio, data_conclusao, instituicao, pdf)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [usuario_id, nome, data_inicio, data_conclusao, instituicao, pdf]
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

// Baixar PDF do certificado
app.get('/api/certificados/:id/pdf', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT pdf FROM certificados WHERE id = $1', [id]);
    if (result.rows.length === 0 || !result.rows[0].pdf) {
      return res.status(404).send('Arquivo não encontrado');
    }
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=certificado.pdf');
    res.send(result.rows[0].pdf);
  } catch (err) {
    console.error('Erro ao baixar PDF:', err);
    res.status(500).send('Erro ao baixar PDF');
  }
});

// Endpoint para buscar cursos reais da Udemy
app.get('/api/udemy-courses', async (req, res) => {
  const search = req.query.search;
  if (!search) {
    return res.status(400).json({ error: 'Parâmetro de busca não fornecido.' });
  }
  try {
    const udemyRes = await axios.get('https://www.udemy.com/api-2.0/courses/', {
      params: { search, page_size: 8 },
      headers: { 'Accept': 'application/json, text/plain, */*' }
    });
    // Retorna apenas os campos principais para o frontend
    const cursos = (udemyRes.data.results || []).map(curso => ({
      id: curso.id,
      title: curso.title,
      url: `https://www.udemy.com${curso.url}`,
      image: curso.image_480x270,
      headline: curso.headline
    }));
    res.json(cursos);
  } catch (err) {
    console.error('Erro ao buscar cursos na Udemy:', err.message);
    res.status(500).json({ error: 'Erro ao buscar cursos na Udemy.' });
  }
});

// Endpoint para buscar cursos reais da Coursera
app.get('/api/coursera-courses', async (req, res) => {
  const search = req.query.search;
  if (!search) {
    return res.status(400).json({ error: 'Parâmetro de busca não fornecido.' });
  }
  try {
    // Coursera API pública de catálogo (sem autenticação)
    const courseraRes = await axios.get('https://www.coursera.org/api/courses.v1', {
      params: { q: 'search', query: search, limit: 8, fields: 'photoUrl,description' },
      headers: { 'Accept': 'application/json, text/plain, */*' }
    });
    // Retorna apenas os campos principais para o frontend
    const cursos = (courseraRes.data.elements || []).map(curso => ({
      id: curso.id,
      title: curso.name,
      url: `https://www.coursera.org/learn/${curso.slug || curso.id}`,
      image: curso.photoUrl,
      description: curso.description
    }));
    res.json(cursos);
  } catch (err) {
    console.error('Erro ao buscar cursos na Coursera:', err.message);
    res.status(500).json({ error: 'Erro ao buscar cursos na Coursera.' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
}); 