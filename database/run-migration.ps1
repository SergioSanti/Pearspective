# Script para executar migration do banco de dados
# Execute este script para adicionar o campo quantidade_vagas na tabela cargos

Write-Host "🔧 Executando migration do banco de dados..." -ForegroundColor Green

# Verificar se o Docker está rodando
Write-Host "📋 Verificando se o container PostgreSQL está rodando..." -ForegroundColor Yellow
$containerStatus = docker ps --filter "name=pearspective_postgres" --format "table {{.Names}}\t{{.Status}}"

if ($containerStatus -notlike "*pearspective_postgres*") {
    Write-Host "❌ Container PostgreSQL não está rodando!" -ForegroundColor Red
    Write-Host "💡 Execute: docker-compose up -d" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Container PostgreSQL está rodando" -ForegroundColor Green

# Executar a migration
Write-Host "📝 Executando migration..." -ForegroundColor Yellow

try {
    $migrationResult = docker exec pearspective_postgres psql -U admin -d pearspective -f /docker-entrypoint-initdb.d/migration_cargos_vagas.sql
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Migration executada com sucesso!" -ForegroundColor Green
        Write-Host "📊 Campo 'quantidade_vagas' adicionado na tabela 'cargos'" -ForegroundColor Cyan
    } else {
        Write-Host "❌ Erro ao executar migration" -ForegroundColor Red
        Write-Host "🔍 Verifique se o arquivo migration_cargos_vagas.sql existe" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Erro ao executar migration: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n📋 Para verificar se a migration foi aplicada:" -ForegroundColor Cyan
Write-Host "   docker exec pearspective_postgres psql -U admin -d pearspective -c \"SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'cargos' AND column_name = 'quantidade_vagas';\"" 