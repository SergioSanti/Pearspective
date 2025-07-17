# Guia de Importação do Banco de Dados no Supabase

## Pré-requisitos
- Conta no Supabase (gratuita)
- Projeto criado no Supabase
- Arquivo de dump do PostgreSQL dividido em partes

## Passo 1: Preparar o Dump

Execute o script PowerShell para dividir o dump:

```powershell
.\split-dump.ps1 -DumpFile "seu-dump.sql" -OutputDir "dump-parts"
```

Isso criará os seguintes arquivos na pasta `dump-parts`:
- `01-structure.sql` - Estrutura das tabelas
- `02-small-tables-data.sql` - Dados das tabelas pequenas
- `03-certificados-structure.sql` - Estrutura da tabela certificados
- `04-certificados-data-part*.sql` - Dados de certificados divididos
- `05-usuarios-data.sql` - Dados de usuários
- `06-sequences-constraints.sql` - Sequências e constraints

## Passo 2: Acessar o Supabase

1. Acesse [supabase.com](https://supabase.com)
2. Faça login na sua conta
3. Abra seu projeto
4. Vá para **SQL Editor** no menu lateral

## Passo 3: Importar os Arquivos

### Importar na Ordem Correta:

#### 1. Estrutura das Tabelas
- Abra o arquivo `01-structure.sql`
- Cole o conteúdo no SQL Editor
- Clique em **Run** (ou pressione Ctrl+Enter)
- Aguarde a execução

#### 2. Dados das Tabelas Pequenas
- Abra o arquivo `02-small-tables-data.sql`
- Cole o conteúdo no SQL Editor
- Clique em **Run**
- Aguarde a execução

#### 3. Estrutura da Tabela Certificados
- Abra o arquivo `03-certificados-structure.sql`
- Cole o conteúdo no SQL Editor
- Clique em **Run**
- Aguarde a execução

#### 4. Dados de Certificados (Partes)
- Importe **UM POR VEZ** os arquivos `04-certificados-data-part*.sql`
- Para cada arquivo:
  - Abra o arquivo
  - Cole o conteúdo no SQL Editor
  - Clique em **Run**
  - Aguarde a execução
  - **Limpe o editor** antes do próximo arquivo

#### 5. Dados de Usuários
- Abra o arquivo `05-usuarios-data.sql`
- Cole o conteúdo no SQL Editor
- Clique em **Run**
- Aguarde a execução

#### 6. Sequências e Constraints
- Abra o arquivo `06-sequences-constraints.sql`
- Cole o conteúdo no SQL Editor
- Clique em **Run**
- Aguarde a execução

## Passo 4: Verificar a Importação

### Verificar Tabelas:
```sql
-- Listar todas as tabelas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';

-- Verificar dados em algumas tabelas
SELECT COUNT(*) FROM areas;
SELECT COUNT(*) FROM cargos;
SELECT COUNT(*) FROM cursos;
SELECT COUNT(*) FROM recursos;
SELECT COUNT(*) FROM certificados;
SELECT COUNT(*) FROM usuarios;
```

### Verificar Sequências:
```sql
-- Verificar sequências
SELECT sequence_name, last_value 
FROM information_schema.sequences;
```

## Solução de Problemas

### Erro: "syntax error at or near"
- **Causa**: Arquivo muito grande ou sintaxe incorreta
- **Solução**: Verifique se o arquivo foi dividido corretamente

### Erro: "relation already exists"
- **Causa**: Tabela já existe no banco
- **Solução**: 
  ```sql
  DROP TABLE IF EXISTS nome_da_tabela CASCADE;
  ```

### Erro: "duplicate key value violates unique constraint"
- **Causa**: Dados duplicados
- **Solução**: Limpe os dados existentes antes de importar:
  ```sql
  TRUNCATE TABLE nome_da_tabela CASCADE;
  ```

### Erro: "connection timeout"
- **Causa**: Arquivo muito grande
- **Solução**: Divida o arquivo em partes menores

### Erro: "out of memory"
- **Causa**: Dados muito grandes (especialmente PDFs)
- **Solução**: 
  - Importe sem os dados de PDF primeiro
  - Depois importe os PDFs separadamente

## Dicas Importantes

1. **Sempre limpe o SQL Editor** entre as importações
2. **Aguarde cada execução** terminar antes da próxima
3. **Verifique os logs** de erro se algo falhar
4. **Faça backup** do banco antes de importar
5. **Teste em um ambiente de desenvolvimento** primeiro

## Verificação Final

Após importar tudo, execute:

```sql
-- Verificar integridade dos dados
SELECT 
    'areas' as tabela, COUNT(*) as registros FROM areas
UNION ALL
SELECT 'cargos', COUNT(*) FROM cargos
UNION ALL
SELECT 'cursos', COUNT(*) FROM cursos
UNION ALL
SELECT 'recursos', COUNT(*) FROM recursos
UNION ALL
SELECT 'certificados', COUNT(*) FROM certificados
UNION ALL
SELECT 'usuarios', COUNT(*) FROM usuarios;
```

## Configuração da Aplicação

Após a importação, certifique-se de que sua aplicação está configurada com:

1. **String de conexão** correta do Supabase
2. **Variáveis de ambiente** configuradas no Vercel
3. **Permissões** adequadas no Supabase

## Suporte

Se encontrar problemas:
1. Verifique os logs de erro no Supabase
2. Confirme que todos os arquivos foram importados
3. Verifique a ordem de importação
4. Consulte a documentação do Supabase 