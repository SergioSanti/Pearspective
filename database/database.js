const { Pool } = require('pg');

// Configuração do pool de conexões
// Aceita tanto DATABASE_URL quanto variáveis separadas
let pool;

if (process.env.DATABASE_URL) {
  // Usar DATABASE_URL (padrão para Vercel, Heroku, etc.)
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });
  
  console.log('✅ Configuração: DATABASE_URL (produção)');
} else {
  // Usar variáveis separadas (desenvolvimento local)
  pool = new Pool({
    host: process.env.DB_HOST || 'pearspective_postgres',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'pearspective',
    user: process.env.DB_USER || 'admin',
    password: process.env.DB_PASSWORD || 'Admin123',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });
  
  console.log('✅ Configuração: Variáveis separadas (desenvolvimento)');
}

// Testar conexão
pool.connect()
  .then(() => {
    console.log('✅ Conectado ao banco de dados PostgreSQL.');
    if (process.env.DATABASE_URL) {
      console.log('   Modo: DATABASE_URL (produção)');
    } else {
      console.log(`   Host: ${process.env.DB_HOST || 'pearspective_postgres'}:${process.env.DB_PORT || 5432}`);
      console.log(`   Database: ${process.env.DB_NAME || 'pearspective'}`);
      console.log(`   User: ${process.env.DB_USER || 'admin'}`);
      console.log('   Modo: Variáveis separadas (desenvolvimento)');
    }
  })
  .catch((err) => {
    console.error('❌ Erro ao conectar ao banco de dados:', err.message);
    if (process.env.DATABASE_URL) {
      console.log('\n💡 Dicas para resolver (produção):');
      console.log('   1. Verifique se DATABASE_URL está configurada no Vercel');
      console.log('   2. Confirme se a string de conexão do Supabase está correta');
      console.log('   3. Verifique se o banco está acessível');
    } else {
      console.log('\n💡 Dicas para resolver (desenvolvimento):');
      console.log('   1. Verifique se o container está rodando: docker ps');
      console.log('   2. Reinicie os containers: docker-compose down && docker-compose up -d');
      console.log('   3. Verifique os logs: docker-compose logs postgres');
      console.log('   4. Aguarde o banco inicializar completamente');
    }
  });

pool.on('error', (err) => {
  console.error('Erro inesperado no pool de conexões:', err);
  process.exit(-1);
});

module.exports = pool; 