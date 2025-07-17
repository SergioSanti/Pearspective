# Deploy rápido para Railway
Write-Host "🚀 Iniciando deploy para Railway..." -ForegroundColor Green

# Verificar se Railway CLI está instalado
try {
    railway --version
    Write-Host "✅ Railway CLI encontrado" -ForegroundColor Green
} catch {
    Write-Host "❌ Railway CLI não encontrado. Instalando..." -ForegroundColor Red
    npm install -g @railway/cli
}

# Login no Railway (se necessário)
Write-Host "🔐 Verificando login no Railway..." -ForegroundColor Yellow
railway login

# Conectar ao projeto
Write-Host "🔗 Conectando ao projeto Railway..." -ForegroundColor Yellow
railway link

# Fazer deploy
Write-Host "📦 Fazendo deploy..." -ForegroundColor Yellow
railway up

Write-Host "✅ Deploy concluído!" -ForegroundColor Green
Write-Host "🌐 Acesse: https://pearspective-production.up.railway.app" -ForegroundColor Cyan 