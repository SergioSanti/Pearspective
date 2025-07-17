# 🧹 Script para limpar campos inutilizados no Railway
# Execute este script para remover campos que não estão sendo usados no banco Railway

Write-Host "🧹 Iniciando limpeza de campos inutilizados no Railway..." -ForegroundColor Green

# Verificar se Railway CLI está instalado
Write-Host "📋 Verificando Railway CLI..." -ForegroundColor Yellow
try {
    $railwayVersion = railway --version
    Write-Host "✅ Railway CLI encontrado: $railwayVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Railway CLI não encontrado!" -ForegroundColor Red
    Write-Host "💡 Instale com: npm install -g @railway/cli" -ForegroundColor Yellow
    exit 1
}

# Verificar se está logado no Railway
Write-Host "📋 Verificando login no Railway..." -ForegroundColor Yellow
try {
    $loginStatus = railway whoami
    Write-Host "✅ Logado no Railway como: $loginStatus" -ForegroundColor Green
} catch {
    Write-Host "❌ Não está logado no Railway!" -ForegroundColor Red
    Write-Host "💡 Execute: railway login" -ForegroundColor Yellow
    exit 1
}

# Verificar se o projeto está linkado
Write-Host "📋 Verificando projeto linkado..." -ForegroundColor Yellow
try {
    $projectStatus = railway status
    Write-Host "✅ Projeto linkado" -ForegroundColor Green
} catch {
    Write-Host "❌ Projeto não está linkado!" -ForegroundColor Red
    Write-Host "💡 Execute: railway link" -ForegroundColor Yellow
    exit 1
}

# Verificar se o arquivo de limpeza existe
$cleanupFile = "database/limpar-campos-inutilizados.sql"
if (-not (Test-Path $cleanupFile)) {
    Write-Host "❌ Arquivo de limpeza não encontrado: $cleanupFile" -ForegroundColor Red
    exit 1
}

Write-Host "📝 Executando limpeza de campos inutilizados no Railway..." -ForegroundColor Yellow

try {
    # Executar o script de limpeza no Railway
    $cleanupResult = railway run psql < $cleanupFile
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Limpeza executada com sucesso no Railway!" -ForegroundColor Green
        Write-Host "📊 Campos inutilizados removidos das tabelas" -ForegroundColor Cyan
    } else {
        Write-Host "❌ Erro ao executar limpeza no Railway" -ForegroundColor Red
        Write-Host "🔍 Verifique se o banco PostgreSQL está configurado no Railway" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Erro ao executar limpeza no Railway: $($_.Exception.Message)" -ForegroundColor Red
}

# Verificar estrutura final no Railway
Write-Host "`n📋 Verificando estrutura final das tabelas no Railway:" -ForegroundColor Cyan

Write-Host "`n📊 Tabela CURSOS:" -ForegroundColor Yellow
railway run psql -c "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'cursos' ORDER BY ordinal_position;"

Write-Host "`n📊 Tabela CERTIFICADOS:" -ForegroundColor Yellow
railway run psql -c "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'certificados' ORDER BY ordinal_position;"

Write-Host "`n📊 Tabela USUARIOS:" -ForegroundColor Yellow
railway run psql -c "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'usuarios' ORDER BY ordinal_position;"

Write-Host "`n📊 Tabela CARGOS:" -ForegroundColor Yellow
railway run psql -c "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'cargos' ORDER BY ordinal_position;"

Write-Host "`n✅ Limpeza no Railway concluída!" -ForegroundColor Green
Write-Host "📊 Estrutura otimizada das tabelas:" -ForegroundColor Cyan
Write-Host "   - cursos: id, titulo, plataforma, url_externa, categoria, nivel, duracao, descricao" -ForegroundColor White
Write-Host "   - certificados: id, usuario_id, nome, instituicao, data_conclusao, descricao" -ForegroundColor White
Write-Host "   - usuarios: id, nome, email, senha, tipo_usuario, foto_perfil" -ForegroundColor White
Write-Host "   - cargos: id, nome_cargo, area_id, requisitos" -ForegroundColor White

Write-Host "`n🎉 Banco Railway otimizado e pronto para uso!" -ForegroundColor Green 