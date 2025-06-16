const { Pool } = require('pg');

// Template de configuração do banco de dados
// Copie este arquivo para database.js e configure com suas credenciais
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'pearspective',
  user: process.env.DB_USER || 'seu_usuario',
  password: process.env.DB_PASSWORD || 'sua_senha',
});

pool.connect()
  .then(() => console.log('✅ Conectado ao banco de dados PostgreSQL.'))
  .catch((err) => console.error('❌ Erro ao conectar ao banco de dados:', err));

module.exports = pool; 