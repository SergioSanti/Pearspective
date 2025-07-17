# Configurar banco de dados no Railway
Write-Host "🗄️ Configurando banco de dados no Railway..." -ForegroundColor Green

# Verificar se há banco PostgreSQL no projeto
Write-Host "🔍 Verificando serviços do Railway..." -ForegroundColor Yellow
railway service list

# Se não houver banco, criar um
Write-Host "📦 Criando banco PostgreSQL (se não existir)..." -ForegroundColor Yellow
Write-Host "💡 Vá para o Railway Dashboard e adicione um serviço PostgreSQL" -ForegroundColor Cyan

# Configurar variáveis de ambiente
Write-Host "⚙️ Configurando variáveis de ambiente..." -ForegroundColor Yellow

# NODE_ENV
railway variables set NODE_ENV=production

# Verificar DATABASE_URL
Write-Host "🔗 Verificando DATABASE_URL..." -ForegroundColor Yellow
railway variables list | findstr DATABASE_URL

Write-Host "✅ Configuração concluída!" -ForegroundColor Green
Write-Host "📝 Para configurar o banco:" -ForegroundColor Cyan
Write-Host "   1. Vá para Railway Dashboard" -ForegroundColor White
Write-Host "   2. Clique em 'New Service' > 'Database' > 'PostgreSQL'" -ForegroundColor White
Write-Host "   3. Copie a DATABASE_URL e configure como variável" -ForegroundColor White
Write-Host "   4. Execute: railway variables set DATABASE_URL=sua_url_aqui" -ForegroundColor White 