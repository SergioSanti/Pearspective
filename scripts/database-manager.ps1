# Script para gerenciar o banco de dados PostgreSQL no Docker
# Autor: Sistema Perspective
# Versão: 1.0

param(
    [Parameter(Position=0)]
    [string]$Command = "help",
    [string]$Database = "pearspective",
    [string]$User = "perspective_user",
    [string]$Password = "perspective_password"
)

# Cores para output
$Green = "Green"
$Yellow = "Yellow"
$Red = "Red"
$Blue = "Blue"
$Cyan = "Cyan"

# Função para imprimir mensagens coloridas
function Write-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor $Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor $Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor $Red
}

function Write-Step {
    param([string]$Message)
    Write-Host "[STEP] $Message" -ForegroundColor $Blue
}

# Função para mostrar ajuda
function Show-Help {
    Write-Host "==========================================" -ForegroundColor $Cyan
    Write-Host "  Gerenciador de Banco de Dados - Perspective" -ForegroundColor $Cyan
    Write-Host "==========================================" -ForegroundColor $Cyan
    Write-Host ""
    Write-Host "Uso: .\scripts\database-manager.ps1 [comando] [opções]" -ForegroundColor $Yellow
    Write-Host ""
    Write-Host "Comandos disponíveis:" -ForegroundColor $Green
    Write-Host "  status     - Verificar status do banco" -ForegroundColor $Blue
    Write-Host "  connect    - Conectar ao banco via psql" -ForegroundColor $Blue
    Write-Host "  backup     - Fazer backup do banco" -ForegroundColor $Blue
    Write-Host "  restore    - Restaurar backup do banco" -ForegroundColor $Blue
    Write-Host "  reset      - Reset completo do banco" -ForegroundColor $Blue
    Write-Host "  logs       - Ver logs do PostgreSQL" -ForegroundColor $Blue
    Write-Host "  stats      - Ver estatísticas do banco" -ForegroundColor $Blue
    Write-Host "  tables     - Listar tabelas" -ForegroundColor $Blue
    Write-Host "  users      - Listar usuários" -ForegroundColor $Blue
    Write-Host "  size       - Ver tamanho do banco" -ForegroundColor $Blue
    Write-Host "  vacuum     - Executar VACUUM" -ForegroundColor $Blue
    Write-Host "  analyze    - Executar ANALYZE" -ForegroundColor $Blue
    Write-Host "  help       - Mostrar esta ajuda" -ForegroundColor $Blue
    Write-Host ""
    Write-Host "Opções:" -ForegroundColor $Green
    Write-Host "  -Database  - Nome do banco (padrão: pearspective)" -ForegroundColor $Yellow
    Write-Host "  -User      - Usuário (padrão: perspective_user)" -ForegroundColor $Yellow
    Write-Host "  -Password  - Senha (padrão: perspective_password)" -ForegroundColor $Yellow
    Write-Host ""
    Write-Host "Exemplos:" -ForegroundColor $Green
    Write-Host "  .\scripts\database-manager.ps1 status" -ForegroundColor $Blue
    Write-Host "  .\scripts\database-manager.ps1 backup" -ForegroundColor $Blue
    Write-Host "  .\scripts\database-manager.ps1 connect" -ForegroundColor $Blue
    Write-Host "  .\scripts\database-manager.ps1 reset" -ForegroundColor $Blue
    Write-Host ""
}

# Verificar se o container está rodando
function Test-ContainerRunning {
    try {
        $container = docker ps --filter "name=perspective_postgres" --format "{{.Names}}"
        if ($container -eq "perspective_postgres") {
            return $true
        }
        return $false
    }
    catch {
        return $false
    }
}

# Verificar status do banco
function Get-DatabaseStatus {
    Write-Step "Verificando status do banco de dados..."
    
    if (-not (Test-ContainerRunning)) {
        Write-Error "Container do PostgreSQL não está rodando!"
        Write-Host "Execute: docker-compose up -d postgres" -ForegroundColor $Yellow
        return
    }
    
    Write-Info "Container PostgreSQL está rodando"
    
    # Testar conectividade
    try {
        docker-compose exec -T postgres pg_isready -U $User -d $Database | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-Info "✅ Banco de dados está respondendo"
        }
        else {
            Write-Error "❌ Banco de dados não está respondendo"
        }
    }
    catch {
        Write-Error "Erro ao testar conectividade"
    }
    
    # Mostrar informações do container
    Write-Host ""
    Write-Host "Informações do Container:" -ForegroundColor $Cyan
    docker-compose ps postgres
}

# Conectar ao banco
function Connect-Database {
    Write-Step "Conectando ao banco de dados..."
    
    if (-not (Test-ContainerRunning)) {
        Write-Error "Container do PostgreSQL não está rodando!"
        return
    }
    
    Write-Info "Conectando como $User no banco $Database..."
    docker-compose exec postgres psql -U $User -d $Database
}

# Fazer backup
function Backup-Database {
    Write-Step "Fazendo backup do banco de dados..."
    
    if (-not (Test-ContainerRunning)) {
        Write-Error "Container do PostgreSQL não está rodando!"
        return
    }
    
    # Criar diretório de backup se não existir
    if (-not (Test-Path "backups")) {
        New-Item -ItemType Directory -Path "backups" | Out-Null
    }
    
    # Gerar timestamp
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $backupFile = "backups\backup_${Database}_${timestamp}.sql"
    
    Write-Info "Criando backup: $backupFile"
    
    try {
        docker-compose exec -T postgres pg_dump -U $User -d $Database > $backupFile
        if ($LASTEXITCODE -eq 0) {
            $size = (Get-Item $backupFile).Length
            $sizeMB = [math]::Round($size / 1MB, 2)
            Write-Info "✅ Backup criado com sucesso! Tamanho: $sizeMB MB"
        }
        else {
            Write-Error "❌ Erro ao criar backup"
        }
    }
    catch {
        Write-Error "Erro durante o backup: $_"
    }
}

# Restaurar backup
function Restore-Database {
    Write-Step "Restaurando backup do banco de dados..."
    
    if (-not (Test-ContainerRunning)) {
        Write-Error "Container do PostgreSQL não está rodando!"
        return
    }
    
    # Listar backups disponíveis
    if (Test-Path "backups") {
        $backups = Get-ChildItem "backups\*.sql" | Sort-Object LastWriteTime -Descending
        if ($backups.Count -eq 0) {
            Write-Error "Nenhum arquivo de backup encontrado em backups/"
            return
        }
        
        Write-Host "Backups disponíveis:" -ForegroundColor $Cyan
        for ($i = 0; $i -lt $backups.Count; $i++) {
            Write-Host "  $($i + 1). $($backups[$i].Name) ($(Get-Date $backups[$i].LastWriteTime -Format 'dd/MM/yyyy HH:mm'))" -ForegroundColor $Blue
        }
        
        $choice = Read-Host "`nEscolha o número do backup (1-$($backups.Count))"
        $index = [int]$choice - 1
        
        if ($index -ge 0 -and $index -lt $backups.Count) {
            $backupFile = $backups[$index].FullName
            Write-Warning "Restaurando: $($backups[$index].Name)"
            $confirm = Read-Host "Tem certeza? (s/n)"
            
            if ($confirm -eq "s" -or $confirm -eq "S") {
                try {
                    docker-compose exec -T postgres psql -U $User -d $Database < $backupFile
                    if ($LASTEXITCODE -eq 0) {
                        Write-Info "✅ Backup restaurado com sucesso!"
                    }
                    else {
                        Write-Error "❌ Erro ao restaurar backup"
                    }
                }
                catch {
                    Write-Error "Erro durante a restauração: $_"
                }
            }
        }
        else {
            Write-Error "Escolha inválida"
        }
    }
    else {
        Write-Error "Diretório backups/ não encontrado"
    }
}

# Reset completo do banco
function Reset-Database {
    Write-Step "Reset completo do banco de dados..."
    
    Write-Warning "ATENÇÃO: Esta operação irá apagar todos os dados!"
    $confirm = Read-Host "Tem certeza? Digite 'CONFIRMAR' para continuar"
    
    if ($confirm -eq "CONFIRMAR") {
        Write-Info "Parando serviços..."
        docker-compose down
        
        Write-Info "Removendo volumes..."
        docker-compose down -v
        
        Write-Info "Reiniciando serviços..."
        docker-compose up -d postgres
        
        Write-Info "Aguardando banco estar pronto..."
        Start-Sleep -Seconds 10
        
        # Aguardar banco estar pronto
        $maxAttempts = 30
        $attempt = 0
        do {
            $attempt++
            try {
                docker-compose exec -T postgres pg_isready -U $User -d $Database | Out-Null
                if ($LASTEXITCODE -eq 0) {
                    Write-Info "✅ Banco de dados resetado e pronto!"
                    return
                }
            }
            catch {
                # Ignorar erro e continuar tentando
            }
            
            Write-Host "Tentativa $attempt/$maxAttempts - Aguardando PostgreSQL..." -ForegroundColor $Yellow
            Start-Sleep -Seconds 2
        } while ($attempt -lt $maxAttempts)
        
        Write-Error "Timeout aguardando banco de dados."
    }
    else {
        Write-Info "Operação cancelada"
    }
}

# Ver logs do PostgreSQL
function Show-DatabaseLogs {
    Write-Step "Mostrando logs do PostgreSQL..."
    
    if (-not (Test-ContainerRunning)) {
        Write-Error "Container do PostgreSQL não está rodando!"
        return
    }
    
    docker-compose logs -f postgres
}

# Ver estatísticas do banco
function Get-DatabaseStats {
    Write-Step "Obtendo estatísticas do banco de dados..."
    
    if (-not (Test-ContainerRunning)) {
        Write-Error "Container do PostgreSQL não está rodando!"
        return
    }
    
    $query = @"
SELECT 
    schemaname,
    tablename,
    attname,
    n_distinct,
    correlation
FROM pg_stats 
WHERE schemaname NOT IN ('information_schema', 'pg_catalog')
ORDER BY schemaname, tablename, attname;
"@
    
    Write-Host "Estatísticas das tabelas:" -ForegroundColor $Cyan
    docker-compose exec -T postgres psql -U $User -d $Database -c $query
}

# Listar tabelas
function Get-DatabaseTables {
    Write-Step "Listando tabelas do banco de dados..."
    
    if (-not (Test-ContainerRunning)) {
        Write-Error "Container do PostgreSQL não está rodando!"
        return
    }
    
    $query = @"
SELECT 
    schemaname,
    tablename,
    tableowner,
    tablespace,
    hasindexes,
    hasrules,
    hastriggers,
    rowsecurity
FROM pg_tables 
WHERE schemaname NOT IN ('information_schema', 'pg_catalog')
ORDER BY schemaname, tablename;
"@
    
    Write-Host "Tabelas do banco:" -ForegroundColor $Cyan
    docker-compose exec -T postgres psql -U $User -d $Database -c $query
}

# Listar usuários
function Get-DatabaseUsers {
    Write-Step "Listando usuários do banco de dados..."
    
    if (-not (Test-ContainerRunning)) {
        Write-Error "Container do PostgreSQL não está rodando!"
        return
    }
    
    $query = @"
SELECT 
    usename,
    usesuper,
    usecreatedb,
    usesuper,
    usebypassrls,
    valuntil,
    useconfig
FROM pg_user
ORDER BY usename;
"@
    
    Write-Host "Usuários do banco:" -ForegroundColor $Cyan
    docker-compose exec -T postgres psql -U $User -d $Database -c $query
}

# Ver tamanho do banco
function Get-DatabaseSize {
    Write-Step "Calculando tamanho do banco de dados..."
    
    if (-not (Test-ContainerRunning)) {
        Write-Error "Container do PostgreSQL não está rodando!"
        return
    }
    
    $query = @"
SELECT 
    pg_size_pretty(pg_database_size('$Database')) as database_size,
    pg_size_pretty(pg_total_relation_size('$Database')) as total_size;
"@
    
    Write-Host "Tamanho do banco:" -ForegroundColor $Cyan
    docker-compose exec -T postgres psql -U $User -d $Database -c $query
}

# Executar VACUUM
function Invoke-DatabaseVacuum {
    Write-Step "Executando VACUUM no banco de dados..."
    
    if (-not (Test-ContainerRunning)) {
        Write-Error "Container do PostgreSQL não está rodando!"
        return
    }
    
    Write-Warning "VACUUM pode demorar dependendo do tamanho do banco"
    $confirm = Read-Host "Continuar? (s/n)"
    
    if ($confirm -eq "s" -or $confirm -eq "S") {
        try {
            docker-compose exec -T postgres psql -U $User -d $Database -c "VACUUM ANALYZE;"
            if ($LASTEXITCODE -eq 0) {
                Write-Info "✅ VACUUM executado com sucesso!"
            }
            else {
                Write-Error "❌ Erro ao executar VACUUM"
            }
        }
        catch {
            Write-Error "Erro durante VACUUM: $_"
        }
    }
    else {
        Write-Info "Operação cancelada"
    }
}

# Executar ANALYZE
function Invoke-DatabaseAnalyze {
    Write-Step "Executando ANALYZE no banco de dados..."
    
    if (-not (Test-ContainerRunning)) {
        Write-Error "Container do PostgreSQL não está rodando!"
        return
    }
    
    try {
        docker-compose exec -T postgres psql -U $User -d $Database -c "ANALYZE;"
        if ($LASTEXITCODE -eq 0) {
            Write-Info "✅ ANALYZE executado com sucesso!"
        }
        else {
            Write-Error "❌ Erro ao executar ANALYZE"
        }
    }
    catch {
        Write-Error "Erro durante ANALYZE: $_"
    }
}

# Função principal
function Main {
    switch ($Command.ToLower()) {
        "status" { Get-DatabaseStatus }
        "connect" { Connect-Database }
        "backup" { Backup-Database }
        "restore" { Restore-Database }
        "reset" { Reset-Database }
        "logs" { Show-DatabaseLogs }
        "stats" { Get-DatabaseStats }
        "tables" { Get-DatabaseTables }
        "users" { Get-DatabaseUsers }
        "size" { Get-DatabaseSize }
        "vacuum" { Invoke-DatabaseVacuum }
        "analyze" { Invoke-DatabaseAnalyze }
        "help" { Show-Help }
        default {
            Write-Error "Comando inválido: $Command"
            Write-Host ""
            Show-Help
        }
    }
}

# Executar função principal
Main 