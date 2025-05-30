const express = require('express');
const pool = require('./database');
const cors = require('cors');
const path = require('path');

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
      res.json({ success: true, message: 'Login válido', tipo_usuario: user.tipo_usuario });
    } else {
      res.status(401).json({ success: false, message: 'Usuário ou senha incorretos.' });
    }
  } catch (error) {
    console.error('Erro na consulta do login:', error);
    res.status(500).json({ success: false, message: 'Erro interno no servidor' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
