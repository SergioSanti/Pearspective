const db = require('./database');

db.query('SELECT NOW()')
  .then(res => {
    console.log('Conexão bem-sucedida:', res.rows[0]);
    process.exit();
  })
  .catch(err => {
    console.error('Erro ao testar conexão:', err);
    process.exit(1);
  });
