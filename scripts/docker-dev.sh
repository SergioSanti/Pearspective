#!/bin/bash

# Script para ambiente de desenvolvimento do projeto Perspective
# Autor: Sistema Perspective
# Versão: 1.0

set -e

echo "🔧 Iniciando ambiente de desenvolvimento do Perspective..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para imprimir mensagens coloridas
print_message() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Verificar se o Docker está instalado e rodando
check_docker() {
    print_step "Verificando Docker..."
    if ! command -v docker &> /dev/null; then
        print_error "Docker não está instalado."
        exit 1
    fi
    
    if ! docker info &> /dev/null; then
        print_error "Docker não está rodando."
        exit 1
    fi
    
    print_message "Docker OK!"
}

# Parar serviços de produção se estiverem rodando
stop_production() {
    print_step "Parando serviços de produção..."
    if docker-compose ps | grep -q "Up"; then
        docker-compose down
        print_message "Serviços de produção parados!"
    else
        print_message "Nenhum serviço de produção rodando."
    fi
}

# Criar arquivo .env para desenvolvimento se não existir
create_dev_env() {
    print_step "Configurando ambiente de desenvolvimento..."
    if [ ! -f .env.dev ]; then
        cat > .env.dev << EOF
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
JWT_SECRET=dev_jwt_secret_$(openssl rand -hex 16)
SESSION_SECRET=dev_session_secret_$(openssl rand -hex 16)
EOF
        print_message "Arquivo .env.dev criado!"
    else
        print_warning "Arquivo .env.dev já existe."
    fi
}

# Build da imagem de desenvolvimento
build_dev_image() {
    print_step "Construindo imagem de desenvolvimento..."
    docker-compose -f docker-compose.dev.yml build
    print_message "Imagem de desenvolvimento construída!"
}

# Iniciar serviços de desenvolvimento
start_dev_services() {
    print_step "Iniciando serviços de desenvolvimento..."
    docker-compose -f docker-compose.dev.yml up -d
    print_message "Serviços de desenvolvimento iniciados!"
}

# Aguardar banco de dados estar pronto
wait_for_database() {
    print_step "Aguardando banco de dados..."
    echo "Aguardando PostgreSQL..."
    until docker-compose -f docker-compose.dev.yml exec -T postgres pg_isready -U perspective_user -d pearspective_dev; do
        echo "Aguardando PostgreSQL..."
        sleep 2
    done
    print_message "Banco de dados pronto!"
}

# Verificar status dos serviços
check_status() {
    print_step "Status dos serviços:"
    docker-compose -f docker-compose.dev.yml ps
}

# Mostrar logs
show_logs() {
    print_step "Logs dos serviços:"
    docker-compose -f docker-compose.dev.yml logs --tail=30
}

# Função para mostrar ajuda
show_help() {
    echo "=========================================="
    echo "  Ambiente de Desenvolvimento - Perspective"
    echo "=========================================="
    echo ""
    echo "Comandos disponíveis:"
    echo "  start     - Iniciar ambiente de desenvolvimento"
    echo "  stop      - Parar ambiente de desenvolvimento"
    echo "  restart   - Reiniciar ambiente de desenvolvimento"
    echo "  logs      - Mostrar logs"
    echo "  status    - Verificar status dos serviços"
    echo "  shell     - Acessar shell do container da aplicação"
    echo "  db-shell  - Acessar shell do banco de dados"
    echo "  help      - Mostrar esta ajuda"
    echo ""
    echo "Portas utilizadas:"
    echo "  - 3000: Aplicação Node.js"
    echo "  - 5432: PostgreSQL"
    echo "  - 6379: Redis (cache)"
    echo "  - 9229: Node.js debugger"
    echo ""
}

# Função para parar serviços
stop_dev_services() {
    print_step "Parando serviços de desenvolvimento..."
    docker-compose -f docker-compose.dev.yml down
    print_message "Serviços parados!"
}

# Função para reiniciar serviços
restart_dev_services() {
    print_step "Reiniciando serviços..."
    docker-compose -f docker-compose.dev.yml restart
    print_message "Serviços reiniciados!"
}

# Função para acessar shell da aplicação
shell_app() {
    print_step "Acessando shell da aplicação..."
    docker-compose -f docker-compose.dev.yml exec app sh
}

# Função para acessar shell do banco
shell_db() {
    print_step "Acessando shell do banco de dados..."
    docker-compose -f docker-compose.dev.yml exec postgres psql -U perspective_user -d pearspective_dev
}

# Função principal
main() {
    case "${1:-start}" in
        "start")
            echo "=========================================="
            echo "  Iniciando Ambiente de Desenvolvimento"
            echo "=========================================="
            echo ""
            
            check_docker
            stop_production
            create_dev_env
            build_dev_image
            start_dev_services
            wait_for_database
            check_status
            
            echo ""
            echo "=========================================="
            print_message "Ambiente de desenvolvimento pronto!"
            echo "=========================================="
            echo ""
            echo "🌐 Aplicação: http://localhost:3000"
            echo "🗄️  PostgreSQL: localhost:5432"
            echo "🔴 Redis: localhost:6379"
            echo "🐛 Debugger: localhost:9229"
            echo ""
            echo "📋 Comandos úteis:"
            echo "  - Ver logs: ./scripts/docker-dev.sh logs"
            echo "  - Parar: ./scripts/docker-dev.sh stop"
            echo "  - Shell app: ./scripts/docker-dev.sh shell"
            echo "  - Shell DB: ./scripts/docker-dev.sh db-shell"
            echo ""
            ;;
        "stop")
            stop_dev_services
            ;;
        "restart")
            restart_dev_services
            ;;
        "logs")
            show_logs
            ;;
        "status")
            check_status
            ;;
        "shell")
            shell_app
            ;;
        "db-shell")
            shell_db
            ;;
        "help"|"-h"|"--help")
            show_help
            ;;
        *)
            print_error "Comando inválido: $1"
            echo ""
            show_help
            exit 1
            ;;
    esac
}

# Executar função principal
main "$@" 