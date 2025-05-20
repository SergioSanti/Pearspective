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

// Endpoint de login
app.post('/login', async (req, res) => {
  const { usuario, senha } = req.body;

  try {
    const query = 'SELECT * FROM usuarios WHERE nome = $1 AND senha = $2';
    const result = await pool.query(query, [usuario, senha]);

    if (result.rows.length > 0) {
      const user = result.rows[0];
      // Enviar tipo_usuario para uso futuro (controle de acesso)
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
