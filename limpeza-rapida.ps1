# Script de Limpeza Rápida - Perspective Project
Write-Host "🧹 Iniciando limpeza do projeto..." -ForegroundColor Green

# 1. Deletar diretórios duplicados
Write-Host "📁 Removendo diretórios duplicados..." -ForegroundColor Yellow
Remove-Item -Path "Page_inicial", "catalogo", "biblioteca", "simulador", "historico", "perfil", "src" -Recurse -Force -ErrorAction SilentlyContinue

# 2. Deletar arquivos de deploy desnecessários
Write-Host "📄 Removendo arquivos de deploy desnecessários..." -ForegroundColor Yellow
Remove-Item -Path "vercel-deploy.md", "README-RENDER.md", "render.yaml", "render-build.sh" -Force -ErrorAction SilentlyContinue

# 3. Deletar scripts desnecessários
Write-Host "🔧 Removendo scripts desnecessários..." -ForegroundColor Yellow
Remove-Item -Path "commit-simple.txt", "fix-login.ps1", "commit-fix.bat", "FIX-LOGIN.md" -Force -ErrorAction SilentlyContinue

# 4. Deletar dumps e imports antigos
Write-Host "🗄️ Removendo dumps e imports antigos..." -ForegroundColor Yellow
Remove-Item -Path "dump_local.sql", "import-completo-com-usuarios.sql", "import-completo-supabase.sql", "limpar-banco-supabase.sql", "fix-supabase-owners.sql", "adicionar_cargos.sql" -Force -ErrorAction SilentlyContinue
Remove-Item -Path "dump-supabase", "dump-parts" -Recurse -Force -ErrorAction SilentlyContinue

# 5. Deletar scripts de conversão
Write-Host "🔄 Removendo scripts de conversão..." -ForegroundColor Yellow
Remove-Item -Path "convert-to-insert.ps1", "create-data-only-files.ps1", "create-clean-dump.ps1", "split-dump.ps1", "GUIA_IMPORT_SUPABASE.md" -Force -ErrorAction SilentlyContinue

# 6. Deletar arquivos Docker
Write-Host "🐳 Removendo arquivos Docker..." -ForegroundColor Yellow
Remove-Item -Path "docker-compose.yml", "docker-compose.dev.yml", "docker-compose.override.yml", "Dockerfile", "docker.bat", "nginx.conf", "wait-for-db.sh" -Force -ErrorAction SilentlyContinue
Remove-Item -Path "README-Docker.md", "DOCKER-QUICK-START.md", "DATABASE-DOCKER.md" -Force -ErrorAction SilentlyContinue

# 7. Deletar documentação antiga
Write-Host "📝 Removendo documentação antiga..." -ForegroundColor Yellow
Remove-Item -Path "SOLUCAO_FINAL_FOTO.md", "SOLUCAO_PROBLEMAS_FOTO.md", "SOLUCAO_CERTIFICADOS.md", "CORRECOES_FOTO.md", "CORRECOES_FOTO_USUARIO.md", "CONTROLE_ACESSO_ADMIN.md", "USUARIO_SERGIO.md" -Force -ErrorAction SilentlyContinue

# 8. Deletar arquivos de diagnóstico
Write-Host "🔍 Removendo arquivos de diagnóstico..." -ForegroundColor Yellow
Remove-Item -Path "diagnostico-foto.js", "env.example" -Force -ErrorAction SilentlyContinue

# 9. Deletar migrações antigas do database
Write-Host "🗄️ Removendo migrações antigas..." -ForegroundColor Yellow
Remove-Item -Path "database/fix_columns.sql", "database/migration_cargos_vagas.sql", "database/migration_curriculo.sql", "database/migration_cargos_add_fields.sql", "database/fix_cargos_table.sql", "database/insert_cargos.sql", "database/clear_curriculum.sql", "database/migration_cursos.sql", "database/test-db.js" -Force -ErrorAction SilentlyContinue

# 10. Deletar arquivos de teste restantes
Write-Host "🧪 Removendo arquivos de teste restantes..." -ForegroundColor Yellow
Remove-Item -Path "public/test-*.html", "public/test-*.js", "api/test-*.js" -Force -ErrorAction SilentlyContinue

Write-Host "✅ Limpeza concluída!" -ForegroundColor Green
Write-Host "📊 Arquivos removidos com sucesso!" -ForegroundColor Cyan

# Mostrar estrutura final
Write-Host "`n📁 Estrutura final do projeto:" -ForegroundColor Magenta
Get-ChildItem -Directory | Select-Object Name
Write-Host "`n📄 Arquivos principais:" -ForegroundColor Magenta
Get-ChildItem -File | Where-Object {$_.Name -notlike ".*"} | Select-Object Name 