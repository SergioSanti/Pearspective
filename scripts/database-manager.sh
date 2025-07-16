#!/bin/bash

# Script para gerenciar o banco de dados PostgreSQL no Docker
# Autor: Sistema Perspective
# Versão: 1.0

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Variáveis padrão
COMMAND=${1:-help}
DATABASE=${2:-pearspective}
USER=${3:-perspective_user}
PASSWORD=${4:-perspective_password}

# Função para imprimir mensagens coloridas
print_info() {
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

# Função para mostrar ajuda
show_help() {
    echo -e "${CYAN}==========================================${NC}"
    echo -e "${CYAN}  Gerenciador de Banco de Dados - Perspective${NC}"
    echo -e "${CYAN}==========================================${NC}"
    echo ""
    echo -e "Uso: ${YELLOW}./scripts/database-manager.sh [comando] [banco] [usuario] [senha]${NC}"
    echo ""
    echo -e "${GREEN}Comandos disponíveis:${NC}"
    echo -e "  ${BLUE}status${NC}     - Verificar status do banco"
    echo -e "  ${BLUE}connect${NC}    - Conectar ao banco via psql"
    echo -e "  ${BLUE}backup${NC}     - Fazer backup do banco"
    echo -e "  ${BLUE}restore${NC}    - Restaurar backup do banco"
    echo -e "  ${BLUE}reset${NC}      - Reset completo do banco"
    echo -e "  ${BLUE}logs${NC}       - Ver logs do PostgreSQL"
    echo -e "  ${BLUE}stats${NC}      - Ver estatísticas do banco"
    echo -e "  ${BLUE}tables${NC}     - Listar tabelas"
    echo -e "  ${BLUE}users${NC}      - Listar usuários"
    echo -e "  ${BLUE}size${NC}       - Ver tamanho do banco"
    echo -e "  ${BLUE}vacuum${NC}     - Executar VACUUM"
    echo -e "  ${BLUE}analyze${NC}    - Executar ANALYZE"
    echo -e "  ${BLUE}help${NC}       - Mostrar esta ajuda"
    echo ""
    echo -e "${GREEN}Exemplos:${NC}"
    echo -e "  ${BLUE}./scripts/database-manager.sh status${NC}"
    echo -e "  ${BLUE}./scripts/database-manager.sh backup${NC}"
    echo -e "  ${BLUE}./scripts/database-manager.sh connect${NC}"
    echo -e "  ${BLUE}./scripts/database-manager.sh reset${NC}"
    echo ""
}

# Verificar se o container está rodando
check_container_running() {
    if docker ps --filter "name=perspective_postgres" --format "{{.Names}}" | grep -q "perspective_postgres"; then
        return 0
    else
        return 1
    fi
}

# Verificar status do banco
get_database_status() {
    print_step "Verificando status do banco de dados..."
    
    if ! check_container_running; then
        print_error "Container do PostgreSQL não está rodando!"
        echo "Execute: docker-compose up -d postgres"
        return 1
    fi
    
    print_info "Container PostgreSQL está rodando"
    
    # Testar conectividade
    if docker-compose exec -T postgres pg_isready -U "$USER" -d "$DATABASE" >/dev/null 2>&1; then
        print_info "✅ Banco de dados está respondendo"
    else
        print_error "❌ Banco de dados não está respondendo"
    fi
    
    # Mostrar informações do container
    echo ""
    echo -e "${CYAN}Informações do Container:${NC}"
    docker-compose ps postgres
}

# Conectar ao banco
connect_database() {
    print_step "Conectando ao banco de dados..."
    
    if ! check_container_running; then
        print_error "Container do PostgreSQL não está rodando!"
        return 1
    fi
    
    print_info "Conectando como $USER no banco $DATABASE..."
    docker-compose exec postgres psql -U "$USER" -d "$DATABASE"
}

# Fazer backup
backup_database() {
    print_step "Fazendo backup do banco de dados..."
    
    if ! check_container_running; then
        print_error "Container do PostgreSQL não está rodando!"
        return 1
    fi
    
    # Criar diretório de backup se não existir
    mkdir -p backups
    
    # Gerar timestamp
    timestamp=$(date +%Y%m%d_%H%M%S)
    backup_file="backups/backup_${DATABASE}_${timestamp}.sql"
    
    print_info "Criando backup: $backup_file"
    
    if docker-compose exec -T postgres pg_dump -U "$USER" -d "$DATABASE" > "$backup_file"; then
        size=$(du -h "$backup_file" | cut -f1)
        print_info "✅ Backup criado com sucesso! Tamanho: $size"
    else
        print_error "❌ Erro ao criar backup"
    fi
}

# Restaurar backup
restore_database() {
    print_step "Restaurando backup do banco de dados..."
    
    if ! check_container_running; then
        print_error "Container do PostgreSQL não está rodando!"
        return 1
    fi
    
    # Listar backups disponíveis
    if [ -d "backups" ]; then
        backups=($(ls -t backups/*.sql 2>/dev/null))
        if [ ${#backups[@]} -eq 0 ]; then
            print_error "Nenhum arquivo de backup encontrado em backups/"
            return 1
        fi
        
        echo -e "${CYAN}Backups disponíveis:${NC}"
        for i in "${!backups[@]}"; do
            filename=$(basename "${backups[$i]}")
            date=$(stat -c %y "${backups[$i]}" | cut -d' ' -f1,2)
            echo -e "  ${BLUE}$((i+1)).${NC} $filename ($date)"
        done
        
        read -p $'\nEscolha o número do backup (1-'${#backups[@]}'): ' choice
        index=$((choice-1))
        
        if [ $index -ge 0 ] && [ $index -lt ${#backups[@]} ]; then
            backup_file="${backups[$index]}"
            print_warning "Restaurando: $(basename "$backup_file")"
            read -p "Tem certeza? (s/n): " confirm
            
            if [[ $confirm =~ ^[Ss]$ ]]; then
                if docker-compose exec -T postgres psql -U "$USER" -d "$DATABASE" < "$backup_file"; then
                    print_info "✅ Backup restaurado com sucesso!"
                else
                    print_error "❌ Erro ao restaurar backup"
                fi
            fi
        else
            print_error "Escolha inválida"
        fi
    else
        print_error "Diretório backups/ não encontrado"
    fi
}

# Reset completo do banco
reset_database() {
    print_step "Reset completo do banco de dados..."
    
    print_warning "ATENÇÃO: Esta operação irá apagar todos os dados!"
    read -p "Tem certeza? Digite 'CONFIRMAR' para continuar: " confirm
    
    if [ "$confirm" = "CONFIRMAR" ]; then
        print_info "Parando serviços..."
        docker-compose down
        
        print_info "Removendo volumes..."
        docker-compose down -v
        
        print_info "Reiniciando serviços..."
        docker-compose up -d postgres
        
        print_info "Aguardando banco estar pronto..."
        sleep 10
        
        # Aguardar banco estar pronto
        max_attempts=30
        attempt=0
        while [ $attempt -lt $max_attempts ]; do
            attempt=$((attempt+1))
            if docker-compose exec -T postgres pg_isready -U "$USER" -d "$DATABASE" >/dev/null 2>&1; then
                print_info "✅ Banco de dados resetado e pronto!"
                return 0
            fi
            
            echo -e "${YELLOW}Tentativa $attempt/$max_attempts - Aguardando PostgreSQL...${NC}"
            sleep 2
        done
        
        print_error "Timeout aguardando banco de dados."
    else
        print_info "Operação cancelada"
    fi
}

# Ver logs do PostgreSQL
show_database_logs() {
    print_step "Mostrando logs do PostgreSQL..."
    
    if ! check_container_running; then
        print_error "Container do PostgreSQL não está rodando!"
        return 1
    fi
    
    docker-compose logs -f postgres
}

# Ver estatísticas do banco
get_database_stats() {
    print_step "Obtendo estatísticas do banco de dados..."
    
    if ! check_container_running; then
        print_error "Container do PostgreSQL não está rodando!"
        return 1
    fi
    
    query="SELECT schemaname, tablename, attname, n_distinct, correlation FROM pg_stats WHERE schemaname NOT IN ('information_schema', 'pg_catalog') ORDER BY schemaname, tablename, attname;"
    
    echo -e "${CYAN}Estatísticas das tabelas:${NC}"
    docker-compose exec -T postgres psql -U "$USER" -d "$DATABASE" -c "$query"
}

# Listar tabelas
get_database_tables() {
    print_step "Listando tabelas do banco de dados..."
    
    if ! check_container_running; then
        print_error "Container do PostgreSQL não está rodando!"
        return 1
    fi
    
    query="SELECT schemaname, tablename, tableowner, tablespace, hasindexes, hasrules, hastriggers, rowsecurity FROM pg_tables WHERE schemaname NOT IN ('information_schema', 'pg_catalog') ORDER BY schemaname, tablename;"
    
    echo -e "${CYAN}Tabelas do banco:${NC}"
    docker-compose exec -T postgres psql -U "$USER" -d "$DATABASE" -c "$query"
}

# Listar usuários
get_database_users() {
    print_step "Listando usuários do banco de dados..."
    
    if ! check_container_running; then
        print_error "Container do PostgreSQL não está rodando!"
        return 1
    fi
    
    query="SELECT usename, usesuper, usecreatedb, usesuper, usebypassrls, valuntil, useconfig FROM pg_user ORDER BY usename;"
    
    echo -e "${CYAN}Usuários do banco:${NC}"
    docker-compose exec -T postgres psql -U "$USER" -d "$DATABASE" -c "$query"
}

# Ver tamanho do banco
get_database_size() {
    print_step "Calculando tamanho do banco de dados..."
    
    if ! check_container_running; then
        print_error "Container do PostgreSQL não está rodando!"
        return 1
    fi
    
    query="SELECT pg_size_pretty(pg_database_size('$DATABASE')) as database_size, pg_size_pretty(pg_total_relation_size('$DATABASE')) as total_size;"
    
    echo -e "${CYAN}Tamanho do banco:${NC}"
    docker-compose exec -T postgres psql -U "$USER" -d "$DATABASE" -c "$query"
}

# Executar VACUUM
invoke_database_vacuum() {
    print_step "Executando VACUUM no banco de dados..."
    
    if ! check_container_running; then
        print_error "Container do PostgreSQL não está rodando!"
        return 1
    fi
    
    print_warning "VACUUM pode demorar dependendo do tamanho do banco"
    read -p "Continuar? (s/n): " confirm
    
    if [[ $confirm =~ ^[Ss]$ ]]; then
        if docker-compose exec -T postgres psql -U "$USER" -d "$DATABASE" -c "VACUUM ANALYZE;"; then
            print_info "✅ VACUUM executado com sucesso!"
        else
            print_error "❌ Erro ao executar VACUUM"
        fi
    else
        print_info "Operação cancelada"
    fi
}

# Executar ANALYZE
invoke_database_analyze() {
    print_step "Executando ANALYZE no banco de dados..."
    
    if ! check_container_running; then
        print_error "Container do PostgreSQL não está rodando!"
        return 1
    fi
    
    if docker-compose exec -T postgres psql -U "$USER" -d "$DATABASE" -c "ANALYZE;"; then
        print_info "✅ ANALYZE executado com sucesso!"
    else
        print_error "❌ Erro ao executar ANALYZE"
    fi
}

# Função principal
main() {
    case $COMMAND in
        "status")
            get_database_status
            ;;
        "connect")
            connect_database
            ;;
        "backup")
            backup_database
            ;;
        "restore")
            restore_database
            ;;
        "reset")
            reset_database
            ;;
        "logs")
            show_database_logs
            ;;
        "stats")
            get_database_stats
            ;;
        "tables")
            get_database_tables
            ;;
        "users")
            get_database_users
            ;;
        "size")
            get_database_size
            ;;
        "vacuum")
            invoke_database_vacuum
            ;;
        "analyze")
            invoke_database_analyze
            ;;
        "help"|"-h"|"--help")
            show_help
            ;;
        *)
            print_error "Comando inválido: $COMMAND"
            echo ""
            show_help
            exit 1
            ;;
    esac
}

# Executar função principal
main 