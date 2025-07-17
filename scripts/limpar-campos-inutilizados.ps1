# 🧹 Script para limpar campos inutilizados do banco de dados
# Execute este script para remover campos que não estão sendo usados

Write-Host "🧹 Iniciando limpeza de campos inutilizados..." -ForegroundColor Green

# Verificar se o Docker está rodando
Write-Host "📋 Verificando se o container PostgreSQL está rodando..." -ForegroundColor Yellow
$containerStatus = docker ps --filter "name=pearspective_postgres" --format "table {{.Names}}\t{{.Status}}"

if ($containerStatus -notlike "*pearspective_postgres*") {
    Write-Host "❌ Container PostgreSQL não está rodando!" -ForegroundColor Red
    Write-Host "💡 Execute: docker-compose up -d" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Container PostgreSQL está rodando" -ForegroundColor Green

# Verificar se o arquivo de limpeza existe
$cleanupFile = "database/limpar-campos-inutilizados.sql"
if (-not (Test-Path $cleanupFile)) {
    Write-Host "❌ Arquivo de limpeza não encontrado: $cleanupFile" -ForegroundColor Red
    exit 1
}

Write-Host "📝 Executando limpeza de campos inutilizados..." -ForegroundColor Yellow

try {
    # Executar o script de limpeza
    $cleanupResult = docker exec pearspective_postgres psql -U postgres -d pearspective -f /docker-entrypoint-initdb.d/limpar-campos-inutilizados.sql
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Limpeza executada com sucesso!" -ForegroundColor Green
        Write-Host "📊 Campos inutilizados removidos das tabelas" -ForegroundColor Cyan
    } else {
        Write-Host "❌ Erro ao executar limpeza" -ForegroundColor Red
        Write-Host "🔍 Verifique se o arquivo limpar-campos-inutilizados.sql existe" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Erro ao executar limpeza: $($_.Exception.Message)" -ForegroundColor Red
}

# Verificar estrutura final
Write-Host "`n📋 Verificando estrutura final das tabelas:" -ForegroundColor Cyan

Write-Host "`n📊 Tabela CURSOS:" -ForegroundColor Yellow
docker exec pearspective_postgres psql -U postgres -d pearspective -c "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'cursos' ORDER BY ordinal_position;"

Write-Host "`n📊 Tabela CERTIFICADOS:" -ForegroundColor Yellow
docker exec pearspective_postgres psql -U postgres -d pearspective -c "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'certificados' ORDER BY ordinal_position;"

Write-Host "`n📊 Tabela USUARIOS:" -ForegroundColor Yellow
docker exec pearspective_postgres psql -U postgres -d pearspective -c "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'usuarios' ORDER BY ordinal_position;"

Write-Host "`n📊 Tabela CARGOS:" -ForegroundColor Yellow
docker exec pearspective_postgres psql -U postgres -d pearspective -c "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'cargos' ORDER BY ordinal_position;"

Write-Host "`n✅ Limpeza concluída!" -ForegroundColor Green
Write-Host "📊 Estrutura otimizada das tabelas:" -ForegroundColor Cyan
Write-Host "   - cursos: id, titulo, plataforma, url_externa, categoria, nivel, duracao, descricao" -ForegroundColor White
Write-Host "   - certificados: id, usuario_id, nome, instituicao, data_conclusao, descricao" -ForegroundColor White
Write-Host "   - usuarios: id, nome, email, senha, tipo_usuario, foto_perfil" -ForegroundColor White
Write-Host "   - cargos: id, nome_cargo, area_id, requisitos" -ForegroundColor White

Write-Host "`n💡 Para aplicar no Railway, execute o mesmo script no banco Railway" -ForegroundColor Yellow 