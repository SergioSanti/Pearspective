# LIMPEZA DO PROJETO - ARQUIVOS DESNECESSÁRIOS

## 🗑️ ARQUIVOS PARA DELETAR (TESTES E DEBUG)

### Arquivos de Teste (Root)
- `test-redirect.html` - Página de teste de redirecionamento
- `test-pdf-viewer.html` - Teste de visualizador PDF
- `test-endpoints.html` - Teste de endpoints
- `test-curriculum-upload.html` - Teste de upload de currículo
- `test-curriculum-fix.html` - Teste de correção de currículo
- `test-curriculum-filename.html` - Teste de nome de arquivo
- `test-certificados.html` - Teste de certificados
- `test-cargos.html` - Teste de cargos
- `test-admin-access.js` - Teste de acesso admin
- `test-admin-user.js` - Teste de usuário admin
- `test-curriculum.js` - Teste de currículo
- `test-database-photo.js` - Teste de foto no banco
- `test-debug-admin.js` - Teste de debug admin
- `test-photo-fix.js` - Teste de correção de foto
- `test-photo-sync.js` - Teste de sincronização de foto
- `test-server.js` - Teste de servidor
- `test-simple-upload.js` - Teste de upload simples
- `test-upload-photo.js` - Teste de upload de foto
- `test-api.html` - Teste de API

### Arquivos de Teste (Public)
- `public/test-redirect.html` - Duplicado do root
- `public/test-login.html` - Teste de login
- `public/test-api.html` - Teste de API

### Arquivos de Teste (API)
- `api/test-login.js` - Teste de login API

## 📁 DIRETÓRIOS DUPLICADOS

### Diretórios Originais (Manter apenas para referência)
- `Page_inicial/` - Conteúdo já copiado para `public/`
- `catalogo/` - Conteúdo já copiado para `public/`
- `biblioteca/` - Conteúdo já copiado para `public/`
- `simulador/` - Conteúdo já copiado para `public/`
- `historico/` - Conteúdo já copiado para `public/`
- `perfil/` - Conteúdo já copiado para `public/`

### Diretório Src (Não usado)
- `src/components/Login.js` - Componente React não usado

## 📄 ARQUIVOS DE DEPLOY DESNECESSÁRIOS

### Múltiplos Guias de Deploy
- `vercel-deploy.md` - Guia Vercel (manter apenas DEPLOY_SIMPLES.md)
- `README-RENDER.md` - Guia Render (não usado)
- `render.yaml` - Configuração Render (não usado)
- `render-build.sh` - Script Render (não usado)

### Scripts de Commit Desnecessários
- `commit-simple.txt` - Texto de commit
- `fix-login.ps1` - Script de fix de login
- `commit-fix.bat` - Script de commit
- `FIX-LOGIN.md` - Arquivo vazio

## 🗄️ ARQUIVOS DE BANCO DESNECESSÁRIOS

### Dumps e Migrações Antigas
- `dump_local.sql` - Dump local (4.3MB - muito grande)
- `dump-supabase/` - Diretório de dumps antigos
- `dump-parts/` - Diretório de partes de dump
- `import-completo-com-usuarios.sql` - Import antigo
- `import-completo-supabase.sql` - Import antigo
- `limpar-banco-supabase.sql` - Script de limpeza
- `fix-supabase-owners.sql` - Fix de owners
- `adicionar_cargos.sql` - Script de cargos

### Scripts de Conversão
- `convert-to-insert.ps1` - Script de conversão
- `create-data-only-files.ps1` - Script de criação de dados
- `create-clean-dump.ps1` - Script de dump limpo
- `split-dump.ps1` - Script de divisão de dump
- `GUIA_IMPORT_SUPABASE.md` - Guia de import

### Migrações Antigas (Database)
- `database/fix_columns.sql` - Fix de colunas
- `database/migration_cargos_vagas.sql` - Migração antiga
- `database/migration_curriculo.sql` - Migração antiga
- `database/migration_cargos_add_fields.sql` - Migração antiga
- `database/fix_cargos_table.sql` - Fix de tabela
- `database/insert_cargos.sql` - Insert de cargos
- `database/clear_curriculum.sql` - Limpeza de currículo
- `database/migration_cursos.sql` - Migração de cursos
- `database/test-db.js` - Teste de banco

## 🐳 ARQUIVOS DOCKER DESNECESSÁRIOS

### Configurações Docker (Não usadas no Vercel)
- `docker-compose.yml` - Docker compose
- `docker-compose.dev.yml` - Docker compose dev
- `docker-compose.override.yml` - Docker compose override
- `Dockerfile` - Dockerfile
- `docker.bat` - Script Docker
- `nginx.conf` - Configuração Nginx
- `wait-for-db.sh` - Script de espera do banco

### Guias Docker
- `README-Docker.md` - Guia Docker
- `DOCKER-QUICK-START.md` - Guia rápido Docker
- `DATABASE-DOCKER.md` - Guia banco Docker

## 📝 ARQUIVOS DE DOCUMENTAÇÃO DESNECESSÁRIOS

### Guias de Problemas Resolvidos
- `SOLUCAO_FINAL_FOTO.md` - Solução de foto
- `SOLUCAO_PROBLEMAS_FOTO.md` - Problemas de foto
- `SOLUCAO_CERTIFICADOS.md` - Solução certificados
- `CORRECOES_FOTO.md` - Correções de foto
- `CORRECOES_FOTO_USUARIO.md` - Correções de foto usuário
- `CONTROLE_ACESSO_ADMIN.md` - Controle de acesso
- `USUARIO_SERGIO.md` - Usuário Sergio

## 🔧 ARQUIVOS DE DIAGNÓSTICO

### Scripts de Diagnóstico
- `diagnostico-foto.js` - Diagnóstico de foto
- `env.example` - Exemplo de env

## 📊 RESUMO DE LIMPEZA

### Arquivos para Deletar: ~50 arquivos
### Espaço a ser liberado: ~10MB
### Diretórios para remover: ~8 diretórios

## ✅ ESTRUTURA FINAL LIMPA

```
Perspective/
├── public/           # Frontend para Vercel
├── api/             # Backend para Vercel
├── database/        # Scripts de banco essenciais
├── assets/          # Assets (imagens, dados)
├── package.json     # Dependências
├── vercel.json      # Configuração Vercel
├── .gitignore       # Git ignore
├── README.md        # Documentação principal
└── DEPLOY_SIMPLES.md # Guia de deploy
```

## 🚀 COMANDOS PARA LIMPEZA

```bash
# Deletar arquivos de teste
rm test-*.html test-*.js

# Deletar diretórios duplicados
rm -rf Page_inicial/ catalogo/ biblioteca/ simulador/ historico/ perfil/

# Deletar arquivos de deploy desnecessários
rm vercel-deploy.md README-RENDER.md render.yaml render-build.sh

# Deletar scripts desnecessários
rm commit-simple.txt fix-login.ps1 commit-fix.bat FIX-LOGIN.md

# Deletar dumps e imports antigos
rm dump_local.sql import-*.sql limpar-banco-supabase.sql fix-supabase-owners.sql
rm -rf dump-supabase/ dump-parts/

# Deletar scripts de conversão
rm convert-to-insert.ps1 create-*.ps1 split-dump.ps1 GUIA_IMPORT_SUPABASE.md

# Deletar arquivos Docker
rm docker-compose*.yml Dockerfile docker.bat nginx.conf wait-for-db.sh
rm README-Docker.md DOCKER-QUICK-START.md DATABASE-DOCKER.md

# Deletar documentação antiga
rm SOLUCAO_*.md CORRECOES_*.md CONTROLE_ACESSO_ADMIN.md USUARIO_SERGIO.md

# Deletar arquivos de diagnóstico
rm diagnostico-foto.js env.example

# Deletar diretório src não usado
rm -rf src/
```

Quer que eu execute a limpeza agora? 