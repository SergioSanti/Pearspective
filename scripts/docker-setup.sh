#!/bin/bash

# Script de setup para o projeto Perspective com Docker
# Autor: Sistema Perspective
# Versão: 1.0

set -e

echo "🚀 Iniciando setup do projeto Perspective com Docker..."

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

# Verificar se o Docker está instalado
check_docker() {
    print_step "Verificando se o Docker está instalado..."
    if ! command -v docker &> /dev/null; then
        print_error "Docker não está instalado. Por favor, instale o Docker primeiro."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose não está instalado. Por favor, instale o Docker Compose primeiro."
        exit 1
    fi
    
    print_message "Docker e Docker Compose encontrados!"
}

# Verificar se o Docker está rodando
check_docker_running() {
    print_step "Verificando se o Docker está rodando..."
    if ! docker info &> /dev/null; then
        print_error "Docker não está rodando. Por favor, inicie o Docker primeiro."
        exit 1
    fi
    print_message "Docker está rodando!"
}

# Criar arquivo .env se não existir
create_env_file() {
    print_step "Criando arquivo .env..."
    if [ ! -f .env ]; then
        cat > .env << EOF
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
JWT_SECRET=seu_jwt_secret_aqui_$(openssl rand -hex 32)
SESSION_SECRET=seu_session_secret_aqui_$(openssl rand -hex 32)
EOF
        print_message "Arquivo .env criado com sucesso!"
    else
        print_warning "Arquivo .env já existe. Mantendo configurações atuais."
    fi
}

# Criar diretórios necessários
create_directories() {
    print_step "Criando diretórios necessários..."
    mkdir -p logs
    mkdir -p ssl
    print_message "Diretórios criados!"
}

# Build das imagens
build_images() {
    print_step "Construindo imagens Docker..."
    docker-compose build
    print_message "Imagens construídas com sucesso!"
}

# Iniciar serviços
start_services() {
    print_step "Iniciando serviços..."
    docker-compose up -d
    print_message "Serviços iniciados!"
}

# Aguardar banco de dados estar pronto
wait_for_database() {
    print_step "Aguardando banco de dados estar pronto..."
    echo "Aguardando PostgreSQL..."
    until docker-compose exec -T postgres pg_isready -U perspective_user -d pearspective; do
        echo "Aguardando PostgreSQL..."
        sleep 2
    done
    print_message "Banco de dados está pronto!"
}

# Verificar status dos serviços
check_services_status() {
    print_step "Verificando status dos serviços..."
    docker-compose ps
}

# Mostrar logs
show_logs() {
    print_step "Mostrando logs dos serviços..."
    docker-compose logs --tail=50
}

# Função principal
main() {
    echo "=========================================="
    echo "  Setup do Projeto Perspective com Docker"
    echo "=========================================="
    echo ""
    
    check_docker
    check_docker_running
    create_env_file
    create_directories
    build_images
    start_services
    wait_for_database
    check_services_status
    
    echo ""
    echo "=========================================="
    print_message "Setup concluído com sucesso!"
    echo "=========================================="
    echo ""
    echo "🌐 Aplicação disponível em: http://localhost:3000"
    echo "🗄️  Banco de dados PostgreSQL: localhost:5432"
    echo ""
    echo "📋 Comandos úteis:"
    echo "  - Ver logs: docker-compose logs -f"
    echo "  - Parar serviços: docker-compose down"
    echo "  - Reiniciar: docker-compose restart"
    echo "  - Modo desenvolvimento: docker-compose -f docker-compose.dev.yml up"
    echo ""
    
    # Perguntar se quer ver os logs
    read -p "Deseja ver os logs dos serviços? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        show_logs
    fi
}

# Executar função principal
main "$@" 