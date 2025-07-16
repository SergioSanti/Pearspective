# Script para ambiente de desenvolvimento do projeto Perspective (PowerShell)
# Autor: Sistema Perspective
# Versão: 1.0

param(
    [Parameter(Position=0)]
    [string]$Command = "start",
    [switch]$Help
)

if ($Help) {
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host "  Ambiente de Desenvolvimento - Perspective" -ForegroundColor Cyan
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Uso: .\scripts\docker-dev.ps1 [comando]" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Comandos disponíveis:" -ForegroundColor White
    Write-Host "  start     - Iniciar ambiente de desenvolvimento" -ForegroundColor Gray
    Write-Host "  stop      - Parar ambiente de desenvolvimento" -ForegroundColor Gray
    Write-Host "  restart   - Reiniciar ambiente de desenvolvimento" -ForegroundColor Gray
    Write-Host "  logs      - Mostrar logs" -ForegroundColor Gray
    Write-Host "  status    - Verificar status dos serviços" -ForegroundColor Gray
    Write-Host "  shell     - Acessar shell do container da aplicação" -ForegroundColor Gray
    Write-Host "  db-shell  - Acessar shell do banco de dados" -ForegroundColor Gray
    Write-Host "  help      - Mostrar esta ajuda" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Portas utilizadas:" -ForegroundColor White
    Write-Host "  - 3000: Aplicação Node.js" -ForegroundColor Gray
    Write-Host "  - 5432: PostgreSQL" -ForegroundColor Gray
    Write-Host "  - 6379: Redis (cache)" -ForegroundColor Gray
    Write-Host "  - 9229: Node.js debugger" -ForegroundColor Gray
    Write-Host ""
    exit 0
}

Write-Host "🔧 Iniciando ambiente de desenvolvimento do Perspective..." -ForegroundColor Green

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

# Verificar se o Docker está instalado e rodando
function Test-Docker {
    Write-Step "Verificando Docker..."
    try {
        docker info | Out-Null
        Write-Info "Docker OK!"
    }
    catch {
        Write-Error "Docker não está instalado ou não está rodando."
        exit 1
    }
}

# Parar serviços de produção se estiverem rodando
function Stop-Production {
    Write-Step "Parando serviços de produção..."
    try {
        $running = docker-compose ps --services --filter "status=running"
        if ($running) {
            docker-compose down
            Write-Info "Serviços de produção parados!"
        }
        else {
            Write-Info "Nenhum serviço de produção rodando."
        }
    }
    catch {
        Write-Warning "Não foi possível verificar serviços de produção."
    }
}

# Criar arquivo .env para desenvolvimento se não existir
function New-DevEnv {
    Write-Step "Configurando ambiente de desenvolvimento..."
    if (-not (Test-Path ".env.dev")) {
        $envContent = @"
# Configurações do Banco de Dados PostgreSQL para Desenvolvimento
DB_HOST=postgres
DB_PORT=5432
DB_NAME=pearspective_dev
DB_USER=perspective_user
DB_PASSWORD=perspective_password

# Configurações do Servidor
PORT=3000
NODE_ENV=development

# Configurações de Debug
DEBUG=app:*

# Configurações de Segurança
JWT_SECRET=dev_jwt_secret_$(Get-Random -Minimum 100000 -Maximum 999999)
SESSION_SECRET=dev_session_secret_$(Get-Random -Minimum 100000 -Maximum 999999)
"@
        $envContent | Out-File -FilePath ".env.dev" -Encoding UTF8
        Write-Info "Arquivo .env.dev criado!"
    }
    else {
        Write-Warning "Arquivo .env.dev já existe."
    }
}

# Build da imagem de desenvolvimento
function Build-DevImage {
    Write-Step "Construindo imagem de desenvolvimento..."
    docker-compose -f docker-compose.dev.yml build
    if ($LASTEXITCODE -eq 0) {
        Write-Info "Imagem de desenvolvimento construída!"
    }
    else {
        Write-Error "Erro ao construir imagem de desenvolvimento."
        exit 1
    }
}

# Iniciar serviços de desenvolvimento
function Start-DevServices {
    Write-Step "Iniciando serviços de desenvolvimento..."
    docker-compose -f docker-compose.dev.yml up -d
    if ($LASTEXITCODE -eq 0) {
        Write-Info "Serviços de desenvolvimento iniciados!"
    }
    else {
        Write-Error "Erro ao iniciar serviços de desenvolvimento."
        exit 1
    }
}

# Aguardar banco de dados estar pronto
function Wait-Database {
    Write-Step "Aguardando banco de dados..."
    Write-Host "Aguardando PostgreSQL..." -ForegroundColor Yellow
    $maxAttempts = 30
    $attempt = 0
    
    do {
        $attempt++
        try {
            docker-compose -f docker-compose.dev.yml exec -T postgres pg_isready -U perspective_user -d pearspective_dev | Out-Null
            if ($LASTEXITCODE -eq 0) {
                Write-Info "Banco de dados pronto!"
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
function Get-Status {
    Write-Step "Status dos serviços:"
    docker-compose -f docker-compose.dev.yml ps
}

# Mostrar logs
function Show-Logs {
    Write-Step "Logs dos serviços:"
    docker-compose -f docker-compose.dev.yml logs --tail=30
}

# Função para parar serviços
function Stop-DevServices {
    Write-Step "Parando serviços de desenvolvimento..."
    docker-compose -f docker-compose.dev.yml down
    Write-Info "Serviços parados!"
}

# Função para reiniciar serviços
function Restart-DevServices {
    Write-Step "Reiniciando serviços..."
    docker-compose -f docker-compose.dev.yml restart
    Write-Info "Serviços reiniciados!"
}

# Função para acessar shell da aplicação
function Enter-AppShell {
    Write-Step "Acessando shell da aplicação..."
    docker-compose -f docker-compose.dev.yml exec app sh
}

# Função para acessar shell do banco
function Enter-DbShell {
    Write-Step "Acessando shell do banco de dados..."
    docker-compose -f docker-compose.dev.yml exec postgres psql -U perspective_user -d pearspective_dev
}

# Função principal
function Main {
    switch ($Command.ToLower()) {
        "start" {
            Write-Host "==========================================" -ForegroundColor Cyan
            Write-Host "  Iniciando Ambiente de Desenvolvimento" -ForegroundColor Cyan
            Write-Host "==========================================" -ForegroundColor Cyan
            Write-Host ""
            
            Test-Docker
            Stop-Production
            New-DevEnv
            Build-DevImage
            Start-DevServices
            Wait-Database
            Get-Status
            
            Write-Host ""
            Write-Host "==========================================" -ForegroundColor Cyan
            Write-Info "Ambiente de desenvolvimento pronto!"
            Write-Host "==========================================" -ForegroundColor Cyan
            Write-Host ""
            Write-Host "🌐 Aplicação: http://localhost:3000" -ForegroundColor White
            Write-Host "🗄️  PostgreSQL: localhost:5432" -ForegroundColor White
            Write-Host "🔴 Redis: localhost:6379" -ForegroundColor White
            Write-Host "🐛 Debugger: localhost:9229" -ForegroundColor White
            Write-Host ""
            Write-Host "📋 Comandos úteis:" -ForegroundColor White
            Write-Host "  - Ver logs: .\scripts\docker-dev.ps1 logs" -ForegroundColor Gray
            Write-Host "  - Parar: .\scripts\docker-dev.ps1 stop" -ForegroundColor Gray
            Write-Host "  - Shell app: .\scripts\docker-dev.ps1 shell" -ForegroundColor Gray
            Write-Host "  - Shell DB: .\scripts\docker-dev.ps1 db-shell" -ForegroundColor Gray
            Write-Host ""
        }
        "stop" {
            Stop-DevServices
        }
        "restart" {
            Restart-DevServices
        }
        "logs" {
            Show-Logs
        }
        "status" {
            Get-Status
        }
        "shell" {
            Enter-AppShell
        }
        "db-shell" {
            Enter-DbShell
        }
        default {
            Write-Error "Comando inválido: $Command"
            Write-Host ""
            Write-Host "Use .\scripts\docker-dev.ps1 help para ver os comandos disponíveis." -ForegroundColor Yellow
            exit 1
        }
    }
}

# Executar função principal
Main 