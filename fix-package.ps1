# Script para corrigir package-lock.json
Write-Host "🔧 Corrigindo package-lock.json..." -ForegroundColor Yellow

# 1. Deletar package-lock.json antigo
Write-Host "🗑️ Removendo package-lock.json antigo..." -ForegroundColor Red
Remove-Item -Path "package-lock.json" -Force -ErrorAction SilentlyContinue

# 2. Deletar node_modules
Write-Host "🗑️ Removendo node_modules..." -ForegroundColor Red
Remove-Item -Path "node_modules" -Recurse -Force -ErrorAction SilentlyContinue

# 3. Instalar dependências novamente
Write-Host "📦 Instalando dependências..." -ForegroundColor Green
npm install

# 4. Verificar se funcionou
Write-Host "✅ Verificando instalação..." -ForegroundColor Green
npm list --depth=0

Write-Host "`n🎯 Próximos passos:" -ForegroundColor Magenta
Write-Host "1. git add ." -ForegroundColor White
Write-Host "2. git commit -m 'Fix package-lock.json'" -ForegroundColor White
Write-Host "3. git push" -ForegroundColor White
Write-Host "4. Railway vai fazer deploy automático" -ForegroundColor White 