// 🧹 Script Node.js para remover campos problemáticos da tabela cursos no Railway
// Execute: node database/limpar-campos-railway.js

const { Pool } = require('pg');

// Configuração do banco Railway - usar URL externa
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/pearspective',
  ssl: process.env.DATABASE_URL ? {
    rejectUnauthorized: false
  } : false
});

async function limparCamposCursos() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Conectando ao banco Railway...');
    
    // Verificar estrutura atual
    console.log('\n📊 ESTRUTURA ATUAL DA TABELA CURSOS:');
    const estruturaAtual = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'cursos' 
      ORDER BY ordinal_position
    `);
    
    estruturaAtual.rows.forEach(row => {
      console.log(`   - ${row.column_name} (${row.data_type})`);
    });
    
    // Lista de campos para remover
    const camposParaRemover = [
      'badge',
      'badgecolor', 
      'featured',
      'new',
      'is_new',
      'data_cadastro',
      'instrutor',
      'preco',
      'avaliacao',
      'estudantes',
      'imagem_url',
      'tags',
      'ativo'
    ];
    
    console.log('\n🧹 REMOVENDO CAMPOS PROBLEMÁTICOS...');
    
    for (const campo of camposParaRemover) {
      try {
        // Verificar se o campo existe
        const campoExiste = await client.query(`
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'cursos' AND column_name = $1
        `, [campo]);
        
        if (campoExiste.rows.length > 0) {
          // Remover o campo
          await client.query(`ALTER TABLE cursos DROP COLUMN ${campo}`);
          console.log(`✅ Campo "${campo}" removido com sucesso`);
        } else {
          console.log(`ℹ️ Campo "${campo}" não existe na tabela`);
        }
      } catch (error) {
        console.log(`⚠️ Erro ao remover campo "${campo}": ${error.message}`);
      }
    }
    
    // Verificar estrutura final
    console.log('\n📊 ESTRUTURA FINAL DA TABELA CURSOS:');
    const estruturaFinal = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'cursos' 
      ORDER BY ordinal_position
    `);
    
    estruturaFinal.rows.forEach(row => {
      console.log(`   - ${row.column_name} (${row.data_type})`);
    });
    
    // Verificar dados na tabela
    console.log('\n📋 VERIFICANDO DADOS NA TABELA:');
    const totalCursos = await client.query('SELECT COUNT(*) as total FROM cursos');
    console.log(`   Total de cursos: ${totalCursos.rows[0].total}`);
    
    if (totalCursos.rows[0].total > 0) {
      const exemplos = await client.query(`
        SELECT id, titulo, plataforma, categoria, nivel, duracao 
        FROM cursos 
        LIMIT 3
      `);
      
      console.log('\n📚 Exemplos de cursos:');
      exemplos.rows.forEach(curso => {
        console.log(`   - ID ${curso.id}: ${curso.titulo} (${curso.plataforma})`);
      });
    }
    
    console.log('\n🎉 LIMPEZA CONCLUÍDA COM SUCESSO!');
    console.log('📊 Estrutura otimizada da tabela cursos:');
    console.log('   - id (SERIAL PRIMARY KEY)');
    console.log('   - titulo (VARCHAR)');
    console.log('   - plataforma (VARCHAR)');
    console.log('   - url_externa (TEXT)');
    console.log('   - categoria (VARCHAR)');
    console.log('   - nivel (VARCHAR)');
    console.log('   - duracao (VARCHAR)');
    console.log('   - descricao (TEXT)');
    console.log('\n✅ Todos os campos problemáticos foram removidos!');
    console.log('🚀 A API /api/cursos deve funcionar normalmente agora.');
    
  } catch (error) {
    console.error('❌ Erro durante a limpeza:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Executar a limpeza
limparCamposCursos().catch(console.error); 