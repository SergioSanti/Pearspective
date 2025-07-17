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

// Rota de login simplificada - FUNCIONA SEM BANCO
app.post('/api/login', async (req, res) => {
  try {
    const { usuario, senha } = req.body;
    
    console.log('🔐 Tentativa de login:', { usuario, senha });
    console.log('📡 Rota /api/login chamada');
    
    // Login hardcoded para teste - SEM DEPENDER DO BANCO
    if (usuario === 'admin' && senha === 'Admin123') {
      console.log('✅ Login admin bem-sucedido');
      res.json({ 
        success: true, 
        id: 1,
        nome: 'admin',
        tipo_usuario: 'admin',
        foto_perfil: null
      });
    } else if (usuario === 'sergio' && senha === '12345') {
      console.log('✅ Login sergio bem-sucedido');
      res.json({ 
        success: true, 
        id: 2,
        nome: 'sergio',
        tipo_usuario: 'usuario',
        foto_perfil: null
      });
    } else {
      console.log('❌ Credenciais inválidas:', { usuario, senha });
      res.status(401).json({ success: false, message: 'Credenciais inválidas' });
    }
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
});

// Rota para buscar foto do usuário - FUNCIONA SEM BANCO
app.get('/api/users/photo/:username', async (req, res) => {
  try {
    const { username } = req.params;
    
    // Mock data - SEM DEPENDER DO BANCO
    if (username === 'admin') {
      res.json({ foto_perfil: null });
    } else if (username === 'sergio') {
      res.json({ foto_perfil: null });
    } else {
      res.status(404).json({ error: 'Usuário não encontrado' });
    }
  } catch (error) {
    console.error('Erro ao buscar foto:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para buscar perfil do usuário - FUNCIONA SEM BANCO
app.get('/api/users/profile/:username', async (req, res) => {
  try {
    const { username } = req.params;
    
    // Mock data - SEM DEPENDER DO BANCO
    if (username === 'admin') {
      res.json({
        id: 1,
        username: 'admin',
        nome: 'Administrador',
        nome_exibicao: 'Admin',
        foto_perfil: null,
        departamento: 'TI',
        cargo_atual: 'Administrador'
      });
    } else if (username === 'sergio') {
      res.json({
        id: 2,
        username: 'sergio',
        nome: 'Sergio',
        nome_exibicao: 'Sergio',
        foto_perfil: null,
        departamento: 'Desenvolvimento',
        cargo_atual: 'Desenvolvedor'
      });
    } else {
      res.status(404).json({ error: 'Usuário não encontrado' });
    }
  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para atualizar perfil do usuário - FUNCIONA SEM BANCO
app.put('/api/users/profile/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { departamento, cargo_atual, foto_perfil } = req.body;
    
    // Mock update - SEM DEPENDER DO BANCO
    console.log('📝 Atualizando perfil:', { id, departamento, cargo_atual, foto_perfil });
    
    res.json({
      id: parseInt(id),
      username: id === '1' ? 'admin' : 'sergio',
      nome: id === '1' ? 'Administrador' : 'Sergio',
      nome_exibicao: id === '1' ? 'Admin' : 'Sergio',
      foto_perfil: foto_perfil,
      departamento: departamento,
      cargo_atual: cargo_atual
    });
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para verificar se o servidor está funcionando
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Servidor funcionando' });
});

// Rota para áreas (mock data)
app.get('/api/areas', (req, res) => {
  res.json([
    { id: 1, nome: 'Tecnologia da Informação' },
    { id: 2, nome: 'Recursos Humanos' },
    { id: 3, nome: 'Marketing' },
    { id: 4, nome: 'Vendas' },
    { id: 5, nome: 'Financeiro' }
  ]);
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