# Configurar Railway
Write-Host "🔧 Configurando Railway..." -ForegroundColor Green

# Verificar se está conectado
Write-Host "🔗 Verificando conexão com Railway..." -ForegroundColor Yellow
railway status

# Configurar variáveis de ambiente
Write-Host "⚙️ Configurando variáveis de ambiente..." -ForegroundColor Yellow

# NODE_ENV
railway variables set NODE_ENV=production

# Verificar se DATABASE_URL existe
Write-Host "🗄️ Verificando DATABASE_URL..." -ForegroundColor Yellow
railway variables list | findstr DATABASE_URL

Write-Host "✅ Configuração concluída!" -ForegroundColor Green
Write-Host "📦 Faça deploy novamente: railway up" -ForegroundColor Cyan 