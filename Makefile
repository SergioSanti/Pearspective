# Makefile para o projeto Perspective
# Autor: Sistema Perspective
# Versão: 1.0

.PHONY: help build up down restart logs status clean dev dev-up dev-down dev-logs shell db-shell backup restore

# Variáveis
COMPOSE_FILE = docker-compose.yml
COMPOSE_DEV_FILE = docker-compose.dev.yml
PROJECT_NAME = perspective

# Cores para output
GREEN = \033[0;32m
YELLOW = \033[1;33m
RED = \033[0;31m
BLUE = \033[0;34m
NC = \033[0m # No Color

# Ajuda
help:
	@echo "$(BLUE)==========================================$(NC)"
	@echo "$(BLUE)  Makefile - Projeto Perspective$(NC)"
	@echo "$(BLUE)==========================================$(NC)"
	@echo ""
	@echo "$(GREEN)Comandos de Produção:$(NC)"
	@echo "  build     - Construir imagens Docker"
	@echo "  up        - Iniciar serviços de produção"
	@echo "  down      - Parar serviços de produção"
	@echo "  restart   - Reiniciar serviços"
	@echo "  logs      - Ver logs dos serviços"
	@echo "  status    - Verificar status dos serviços"
	@echo "  clean     - Limpar containers, imagens e volumes"
	@echo ""
	@echo "$(YELLOW)Comandos de Desenvolvimento:$(NC)"
	@echo "  dev       - Iniciar ambiente de desenvolvimento"
	@echo "  dev-up    - Iniciar serviços de desenvolvimento"
	@echo "  dev-down  - Parar serviços de desenvolvimento"
	@echo "  dev-logs  - Ver logs de desenvolvimento"
	@echo ""
	@echo "$(BLUE)Comandos de Banco de Dados:$(NC)"
	@echo "  shell     - Acessar shell da aplicação"
	@echo "  db-shell  - Acessar shell do PostgreSQL"
	@echo "  backup    - Fazer backup do banco"
	@echo "  restore   - Restaurar backup do banco"
	@echo ""

# Produção
build:
	@echo "$(BLUE)[BUILD]$(NC) Construindo imagens Docker..."
	docker-compose -f $(COMPOSE_FILE) build

up:
	@echo "$(BLUE)[UP]$(NC) Iniciando serviços de produção..."
	docker-compose -f $(COMPOSE_FILE) up -d

down:
	@echo "$(BLUE)[DOWN]$(NC) Parando serviços de produção..."
	docker-compose -f $(COMPOSE_FILE) down

restart:
	@echo "$(BLUE)[RESTART]$(NC) Reiniciando serviços..."
	docker-compose -f $(COMPOSE_FILE) restart

logs:
	@echo "$(BLUE)[LOGS]$(NC) Mostrando logs dos serviços..."
	docker-compose -f $(COMPOSE_FILE) logs -f

status:
	@echo "$(BLUE)[STATUS]$(NC) Status dos serviços:"
	docker-compose -f $(COMPOSE_FILE) ps

clean:
	@echo "$(RED)[CLEAN]$(NC) Limpando containers, imagens e volumes..."
	docker-compose -f $(COMPOSE_FILE) down -v --rmi all
	docker system prune -f

# Desenvolvimento
dev: dev-up
	@echo "$(GREEN)[DEV]$(NC) Ambiente de desenvolvimento iniciado!"
	@echo "$(GREEN)🌐 Aplicação: http://localhost:3000$(NC)"
	@echo "$(GREEN)🗄️  PostgreSQL: localhost:5432$(NC)"
	@echo "$(GREEN)🔴 Redis: localhost:6379$(NC)"
	@echo "$(GREEN)🐛 Debugger: localhost:9229$(NC)"

dev-up:
	@echo "$(YELLOW)[DEV-UP]$(NC) Iniciando ambiente de desenvolvimento..."
	docker-compose -f $(COMPOSE_DEV_FILE) up -d

dev-down:
	@echo "$(YELLOW)[DEV-DOWN]$(NC) Parando ambiente de desenvolvimento..."
	docker-compose -f $(COMPOSE_DEV_FILE) down

dev-logs:
	@echo "$(YELLOW)[DEV-LOGS]$(NC) Logs do ambiente de desenvolvimento:"
	docker-compose -f $(COMPOSE_DEV_FILE) logs -f

# Shell e Banco
shell:
	@echo "$(BLUE)[SHELL]$(NC) Acessando shell da aplicação..."
	docker-compose -f $(COMPOSE_FILE) exec app sh

db-shell:
	@echo "$(BLUE)[DB-SHELL]$(NC) Acessando shell do PostgreSQL..."
	docker-compose -f $(COMPOSE_FILE) exec postgres psql -U perspective_user -d pearspective

# Backup e Restore
backup:
	@echo "$(BLUE)[BACKUP]$(NC) Fazendo backup do banco de dados..."
	@mkdir -p backups
	docker-compose -f $(COMPOSE_FILE) exec -T postgres pg_dump -U perspective_user pearspective > backups/backup_$(shell date +%Y%m%d_%H%M%S).sql
	@echo "$(GREEN)Backup salvo em backups/$(NC)"

restore:
	@echo "$(RED)[RESTORE]$(NC) Restaurando backup do banco de dados..."
	@echo "$(YELLOW)Arquivo de backup (ex: backups/backup_20231201_143022.sql):$(NC)"
	@read -p "Digite o nome do arquivo: " file; \
	docker-compose -f $(COMPOSE_FILE) exec -T postgres psql -U perspective_user -d pearspective < $$file

# Utilitários
install-deps:
	@echo "$(BLUE)[INSTALL-DEPS]$(NC) Instalando dependências..."
	docker-compose -f $(COMPOSE_FILE) exec app npm install

update-deps:
	@echo "$(BLUE)[UPDATE-DEPS]$(NC) Atualizando dependências..."
	docker-compose -f $(COMPOSE_FILE) exec app npm update

test:
	@echo "$(BLUE)[TEST]$(NC) Executando testes..."
	docker-compose -f $(COMPOSE_FILE) exec app npm test

lint:
	@echo "$(BLUE)[LINT]$(NC) Executando linter..."
	docker-compose -f $(COMPOSE_FILE) exec app npm run lint

# Monitoramento
monitor:
	@echo "$(BLUE)[MONITOR]$(NC) Monitorando recursos dos containers..."
	docker stats

health:
	@echo "$(BLUE)[HEALTH]$(NC) Verificando health dos serviços..."
	docker-compose -f $(COMPOSE_FILE) ps
	@echo ""
	@echo "$(GREEN)Testando conectividade:$(NC)"
	@curl -f http://localhost:3000/ || echo "$(RED)❌ Aplicação não está respondendo$(NC)"
	@docker-compose -f $(COMPOSE_FILE) exec -T postgres pg_isready -U perspective_user -d pearspective && echo "$(GREEN)✅ PostgreSQL OK$(NC)" || echo "$(RED)❌ PostgreSQL não está respondendo$(NC)" 