# Script para reiniciar o servidor Node.js
Write-Host "Reiniciando servidor Node.js..." -ForegroundColor Yellow

# Parar processos Node.js existentes na porta 3000
Write-Host "Parando processos existentes..." -ForegroundColor Cyan
$processes = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.ProcessName -eq "node" }
if ($processes) {
    $processes | Stop-Process -Force
    Write-Host "Processos Node.js parados" -ForegroundColor Green
} else {
    Write-Host "Nenhum processo Node.js encontrado" -ForegroundColor Blue
}

# Aguardar um pouco
Start-Sleep -Seconds 2

# Navegar para o diretório do banco de dados
Write-Host "Navegando para o diretório database..." -ForegroundColor Cyan
Set-Location "database"

# Verificar se o arquivo app.js existe
if (-not (Test-Path "app.js")) {
    Write-Host "Arquivo app.js nao encontrado!" -ForegroundColor Red
    exit 1
}

# Instalar dependências se necessário
Write-Host "Verificando dependencias..." -ForegroundColor Cyan
if (-not (Test-Path "node_modules")) {
    Write-Host "Instalando dependencias..." -ForegroundColor Yellow
    npm install
}

# Iniciar o servidor
Write-Host "Iniciando servidor na porta 3000..." -ForegroundColor Green
Write-Host "Acesse: http://localhost:3000" -ForegroundColor Cyan
Write-Host "Para parar o servidor, pressione Ctrl+C" -ForegroundColor Yellow
Write-Host ""

node app.js 