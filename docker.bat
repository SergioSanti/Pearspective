@echo off
REM Arquivo batch para comandos Docker no Windows
REM Autor: Sistema Perspective
REM Versão: 1.0

setlocal enabledelayedexpansion

REM Cores para output (Windows 10+)
set "GREEN=[92m"
set "YELLOW=[93m"
set "RED=[91m"
set "BLUE=[94m"
set "NC=[0m"

REM Verificar se o comando foi fornecido
if "%1"=="" goto :help

REM Comandos de produção
if "%1"=="build" goto :build
if "%1"=="up" goto :up
if "%1"=="down" goto :down
if "%1"=="restart" goto :restart
if "%1"=="logs" goto :logs
if "%1"=="status" goto :status
if "%1"=="clean" goto :clean

REM Comandos de desenvolvimento
if "%1"=="dev" goto :dev
if "%1"=="dev-up" goto :dev-up
if "%1"=="dev-down" goto :dev-down
if "%1"=="dev-logs" goto :dev-logs

REM Comandos de shell e banco
if "%1"=="shell" goto :shell
if "%1"=="db-shell" goto :db-shell

REM Comandos de backup
if "%1"=="backup" goto :backup
if "%1"=="restore" goto :restore

REM Comandos de utilitários
if "%1"=="install-deps" goto :install-deps
if "%1"=="update-deps" goto :update-deps
if "%1"=="test" goto :test
if "%1"=="monitor" goto :monitor
if "%1"=="health" goto :health

REM Comando de ajuda
if "%1"=="help" goto :help

echo %RED%Comando inválido: %1%NC%
echo Use "docker.bat help" para ver os comandos disponíveis.
exit /b 1

:help
echo %BLUE%==========================================%NC%
echo %BLUE%  Docker Batch - Projeto Perspective%NC%
echo %BLUE%==========================================%NC%
echo.
echo %GREEN%Comandos de Produção:%NC%
echo   build     - Construir imagens Docker
echo   up        - Iniciar serviços de produção
echo   down      - Parar serviços de produção
echo   restart   - Reiniciar serviços
echo   logs      - Ver logs dos serviços
echo   status    - Verificar status dos serviços
echo   clean     - Limpar containers, imagens e volumes
echo.
echo %YELLOW%Comandos de Desenvolvimento:%NC%
echo   dev       - Iniciar ambiente de desenvolvimento
echo   dev-up    - Iniciar serviços de desenvolvimento
echo   dev-down  - Parar serviços de desenvolvimento
echo   dev-logs  - Ver logs de desenvolvimento
echo.
echo %BLUE%Comandos de Banco de Dados:%NC%
echo   shell     - Acessar shell da aplicação
echo   db-shell  - Acessar shell do PostgreSQL
echo   backup    - Fazer backup do banco
echo   restore   - Restaurar backup do banco
echo.
echo %BLUE%Comandos de Utilitários:%NC%
echo   install-deps - Instalar dependências
echo   update-deps  - Atualizar dependências
echo   test         - Executar testes
echo   monitor      - Monitorar recursos
echo   health       - Verificar saúde dos serviços
echo.
goto :eof

:build
echo %BLUE%[BUILD]%NC% Construindo imagens Docker...
docker-compose build
goto :eof

:up
echo %BLUE%[UP]%NC% Iniciando serviços de produção...
docker-compose up -d
goto :eof

:down
echo %BLUE%[DOWN]%NC% Parando serviços de produção...
docker-compose down
goto :eof

:restart
echo %BLUE%[RESTART]%NC% Reiniciando serviços...
docker-compose restart
goto :eof

:logs
echo %BLUE%[LOGS]%NC% Mostrando logs dos serviços...
docker-compose logs -f
goto :eof

:status
echo %BLUE%[STATUS]%NC% Status dos serviços:
docker-compose ps
goto :eof

:clean
echo %RED%[CLEAN]%NC% Limpando containers, imagens e volumes...
docker-compose down -v --rmi all
docker system prune -f
goto :eof

:dev
echo %YELLOW%[DEV]%NC% Iniciando ambiente de desenvolvimento...
call :dev-up
echo %GREEN%[DEV]%NC% Ambiente de desenvolvimento iniciado!
echo %GREEN%🌐 Aplicação: http://localhost:3000%NC%
echo %GREEN%🗄️  PostgreSQL: localhost:5432%NC%
echo %GREEN%🔴 Redis: localhost:6379%NC%
echo %GREEN%🐛 Debugger: localhost:9229%NC%
goto :eof

:dev-up
echo %YELLOW%[DEV-UP]%NC% Iniciando ambiente de desenvolvimento...
docker-compose -f docker-compose.dev.yml up -d
goto :eof

:dev-down
echo %YELLOW%[DEV-DOWN]%NC% Parando ambiente de desenvolvimento...
docker-compose -f docker-compose.dev.yml down
goto :eof

:dev-logs
echo %YELLOW%[DEV-LOGS]%NC% Logs do ambiente de desenvolvimento:
docker-compose -f docker-compose.dev.yml logs -f
goto :eof

:shell
echo %BLUE%[SHELL]%NC% Acessando shell da aplicação...
docker-compose exec app sh
goto :eof

:db-shell
echo %BLUE%[DB-SHELL]%NC% Acessando shell do PostgreSQL...
docker-compose exec postgres psql -U perspective_user -d pearspective
goto :eof

:backup
echo %BLUE%[BACKUP]%NC% Fazendo backup do banco de dados...
if not exist "backups" mkdir backups
for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
set "YY=%dt:~2,2%" & set "YYYY=%dt:~0,4%" & set "MM=%dt:~4,2%" & set "DD=%dt:~6,2%"
set "HH=%dt:~8,2%" & set "Min=%dt:~10,2%" & set "Sec=%dt:~12,2%"
set "datestamp=%YYYY%%MM%%DD%_%HH%%Min%%Sec%"
docker-compose exec -T postgres pg_dump -U perspective_user pearspective > backups\backup_%datestamp%.sql
echo %GREEN%Backup salvo em backups\backup_%datestamp%.sql%NC%
goto :eof

:restore
echo %RED%[RESTORE]%NC% Restaurando backup do banco de dados...
set /p "file=Digite o nome do arquivo (ex: backups\backup_20231201_143022.sql): "
docker-compose exec -T postgres psql -U perspective_user -d pearspective < %file%
goto :eof

:install-deps
echo %BLUE%[INSTALL-DEPS]%NC% Instalando dependências...
docker-compose exec app npm install
goto :eof

:update-deps
echo %BLUE%[UPDATE-DEPS]%NC% Atualizando dependências...
docker-compose exec app npm update
goto :eof

:test
echo %BLUE%[TEST]%NC% Executando testes...
docker-compose exec app npm test
goto :eof

:monitor
echo %BLUE%[MONITOR]%NC% Monitorando recursos dos containers...
docker stats
goto :eof

:health
echo %BLUE%[HEALTH]%NC% Verificando health dos serviços...
docker-compose ps
echo.
echo %GREEN%Testando conectividade:%NC%
curl -f http://localhost:3000/ >nul 2>&1 && echo %GREEN%✅ Aplicação OK%NC% || echo %RED%❌ Aplicação não está respondendo%NC%
docker-compose exec -T postgres pg_isready -U perspective_user -d pearspective >nul 2>&1 && echo %GREEN%✅ PostgreSQL OK%NC% || echo %RED%❌ PostgreSQL não está respondendo%NC%
goto :eof

:eof 