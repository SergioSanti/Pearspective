# Script de setup para o projeto Perspective com Docker (PowerShell)
# Autor: Sistema Perspective
# Versão: 1.0

param(
    [switch]$Help
)

if ($Help) {
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host "  Setup do Projeto Perspective com Docker" -ForegroundColor Cyan
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Uso: .\scripts\docker-setup.ps1" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Este script irá:" -ForegroundColor White
    Write-Host "  - Verificar se o Docker está instalado e rodando" -ForegroundColor White
    Write-Host "  - Criar arquivo .env com configurações" -ForegroundColor White
    Write-Host "  - Construir as imagens Docker" -ForegroundColor White
    Write-Host "  - Iniciar todos os serviços" -ForegroundColor White
    Write-Host "  - Configurar o banco de dados" -ForegroundColor White
    Write-Host ""
    exit 0
}

Write-Host "🚀 Iniciando setup do projeto Perspective com Docker..." -ForegroundColor Green

# Função para imprimir mensagens coloridas
function Write-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

function Write-Step {
    param([string]$Message)
    Write-Host "[STEP] $Message" -ForegroundColor Blue
}

# Verificar se o Docker está instalado
function Test-Docker {
    Write-Step "Verificando se o Docker está instalado..."
    try {
        $dockerVersion = docker --version
        Write-Info "Docker encontrado: $dockerVersion"
    }
    catch {
        Write-Error "Docker não está instalado. Por favor, instale o Docker Desktop primeiro."
        exit 1
    }
    
    try {
        $composeVersion = docker-compose --version
        Write-Info "Docker Compose encontrado: $composeVersion"
    }
    catch {
        Write-Error "Docker Compose não está instalado. Por favor, instale o Docker Compose primeiro."
        exit 1
    }
}

# Verificar se o Docker está rodando
function Test-DockerRunning {
    Write-Step "Verificando se o Docker está rodando..."
    try {
        docker info | Out-Null
        Write-Info "Docker está rodando!"
    }
    catch {
        Write-Error "Docker não está rodando. Por favor, inicie o Docker Desktop primeiro."
        exit 1
    }
}

# Criar arquivo .env se não existir
function New-EnvFile {
    Write-Step "Criando arquivo .env..."
    if (-not (Test-Path ".env")) {
        $envContent = @"
# Configurações do Banco de Dados PostgreSQL
DB_HOST=postgres
DB_PORT=5432
DB_NAME=pearspective
DB_USER=perspective_user
DB_PASSWORD=perspective_password

# Configurações do Servidor
PORT=3000
NODE_ENV=production

# Configurações de Segurança
JWT_SECRET=seu_jwt_secret_aqui_$(Get-Random -Minimum 100000 -Maximum 999999)
SESSION_SECRET=seu_session_secret_aqui_$(Get-Random -Minimum 100000 -Maximum 999999)
"@
        $envContent | Out-File -FilePath ".env" -Encoding UTF8
        Write-Info "Arquivo .env criado com sucesso!"
    }
    else {
        Write-Warning "Arquivo .env já existe. Mantendo configurações atuais."
    }
}

# Criar diretórios necessários
function New-Directories {
    Write-Step "Criando diretórios necessários..."
    if (-not (Test-Path "logs")) {
        New-Item -ItemType Directory -Path "logs" | Out-Null
    }
    if (-not (Test-Path "ssl")) {
        New-Item -ItemType Directory -Path "ssl" | Out-Null
    }
    Write-Info "Diretórios criados!"
}

# Build das imagens
function Build-Images {
    Write-Step "Construindo imagens Docker..."
    docker-compose build
    if ($LASTEXITCODE -eq 0) {
        Write-Info "Imagens construídas com sucesso!"
    }
    else {
        Write-Error "Erro ao construir imagens Docker."
        exit 1
    }
}

# Iniciar serviços
function Start-Services {
    Write-Step "Iniciando serviços..."
    docker-compose up -d
    if ($LASTEXITCODE -eq 0) {
        Write-Info "Serviços iniciados!"
    }
    else {
        Write-Error "Erro ao iniciar serviços."
        exit 1
    }
}

# Aguardar banco de dados estar pronto
function Wait-Database {
    Write-Step "Aguardando banco de dados estar pronto..."
    Write-Host "Aguardando PostgreSQL..." -ForegroundColor Yellow
    $maxAttempts = 30
    $attempt = 0
    
    do {
        $attempt++
        try {
            docker-compose exec -T postgres pg_isready -U perspective_user -d pearspective | Out-Null
            if ($LASTEXITCODE -eq 0) {
                Write-Info "Banco de dados está pronto!"
                return
            }
        }
        catch {
            # Ignorar erro e continuar tentando
        }
        
        Write-Host "Tentativa $attempt/$maxAttempts - Aguardando PostgreSQL..." -ForegroundColor Yellow
        Start-Sleep -Seconds 2
    } while ($attempt -lt $maxAttempts)
    
    Write-Error "Timeout aguardando banco de dados."
    exit 1
}

# Verificar status dos serviços
function Get-ServicesStatus {
    Write-Step "Verificando status dos serviços..."
    docker-compose ps
}

# Mostrar logs
function Show-Logs {
    Write-Step "Mostrando logs dos serviços..."
    docker-compose logs --tail=50
}

# Função principal
function Main {
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host "  Setup do Projeto Perspective com Docker" -ForegroundColor Cyan
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host ""
    
    Test-Docker
    Test-DockerRunning
    New-EnvFile
    New-Directories
    Build-Images
    Start-Services
    Wait-Database
    Get-ServicesStatus
    
    Write-Host ""
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Info "Setup concluído com sucesso!"
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "🌐 Aplicação disponível em: http://localhost:3000" -ForegroundColor White
    Write-Host "🗄️  Banco de dados PostgreSQL: localhost:5432" -ForegroundColor White
    Write-Host ""
    Write-Host "📋 Comandos úteis:" -ForegroundColor White
    Write-Host "  - Ver logs: docker-compose logs -f" -ForegroundColor Gray
    Write-Host "  - Parar serviços: docker-compose down" -ForegroundColor Gray
    Write-Host "  - Reiniciar: docker-compose restart" -ForegroundColor Gray
    Write-Host "  - Modo desenvolvimento: .\scripts\docker-dev.ps1" -ForegroundColor Gray
    Write-Host ""
    
    # Perguntar se quer ver os logs
    $response = Read-Host "Deseja ver os logs dos serviços? (s/n)"
    if ($response -eq "s" -or $response -eq "S" -or $response -eq "y" -or $response -eq "Y") {
        Show-Logs
    }
}

# Executar função principal
Main 