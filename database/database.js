const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'pearspective',
  user: 'admin',      // usuário do banco
  password: 'admin123', // senha do banco
});

pool.connect()
  .then(() => console.log('✅ Conectado ao banco de dados PostgreSQL.'))
  .catch((err) => console.error('❌ Erro ao conectar ao banco de dados:', err));

module.exports = pool;
