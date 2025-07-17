# Testar aplicação no Railway
Write-Host "🧪 Testando aplicação no Railway..." -ForegroundColor Green

$url = "https://pearspective-production.up.railway.app"

Write-Host "🌐 Testando URL: $url" -ForegroundColor Yellow

# Testar página inicial
try {
    $response = Invoke-WebRequest -Uri $url -Method GET -TimeoutSec 10
    Write-Host "✅ Página inicial: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "❌ Erro na página inicial: $($_.Exception.Message)" -ForegroundColor Red
}

# Testar API health
try {
    $healthUrl = "$url/api/health"
    $healthResponse = Invoke-WebRequest -Uri $healthUrl -Method GET -TimeoutSec 10
    Write-Host "✅ API Health: $($healthResponse.StatusCode)" -ForegroundColor Green
    $healthData = $healthResponse.Content | ConvertFrom-Json
    Write-Host "📊 Status: $($healthData.status) - $($healthData.message)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Erro na API Health: $($_.Exception.Message)" -ForegroundColor Red
}

# Testar página de login
try {
    $loginUrl = "$url/login"
    $loginResponse = Invoke-WebRequest -Uri $loginUrl -Method GET -TimeoutSec 10
    Write-Host "✅ Página de login: $($loginResponse.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "❌ Erro na página de login: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "🎯 Teste concluído!" -ForegroundColor Green 