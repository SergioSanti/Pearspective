# 🐳 Perspective - Guia Docker

Este guia explica como executar o projeto Perspective usando Docker, incluindo configuração, desenvolvimento e produção.

## 📋 Pré-requisitos

- [Docker](https://docs.docker.com/get-docker/) (versão 20.10+)
- [Docker Compose](https://docs.docker.com/compose/install/) (versão 2.0+)
- Git

## 🚀 Início Rápido

### 1. Setup Automático (Recomendado)

Execute o script de setup automático:

```bash
# Tornar o script executável
chmod +x scripts/docker-setup.sh

# Executar setup
./scripts/docker-setup.sh
```

### 2. Setup Manual

Se preferir fazer manualmente:

```bash
# 1. Build das imagens
docker-compose build

# 2. Iniciar serviços
docker-compose up -d

# 3. Verificar status
docker-compose ps
```

## 🏗️ Estrutura do Projeto

```
Perspective/
├── Dockerfile                 # Imagem da aplicação Node.js
├── Dockerfile.dev            # Imagem para desenvolvimento
├── docker-compose.yml        # Orquestração produção
├── docker-compose.dev.yml    # Orquestração desenvolvimento
├── nginx.conf               # Configuração do proxy reverso
├── .dockerignore            # Arquivos ignorados no build
├── scripts/
│   ├── docker-setup.sh      # Script de setup automático
│   └── docker-dev.sh        # Script para desenvolvimento
└── database/
    ├── app.js               # Aplicação principal
    ├── database.js          # Configuração do banco
    ├── init.sql             # Inicialização do banco
    └── ...
```

## 🔧 Ambientes Disponíveis

### Produção

```bash
# Iniciar
docker-compose up -d

# Parar
docker-compose down

# Ver logs
docker-compose logs -f

# Rebuild
docker-compose build --no-cache
```

### Desenvolvimento

```bash
# Usar script (recomendado)
./scripts/docker-dev.sh start

# Ou manualmente
docker-compose -f docker-compose.dev.yml up -d

# Parar desenvolvimento
./scripts/docker-dev.sh stop

# Ver logs
./scripts/docker-dev.sh logs

# Acessar shell da aplicação
./scripts/docker-dev.sh shell

# Acessar shell do banco
./scripts/docker-dev.sh db-shell
```

## 🌐 Acesso aos Serviços

### Produção
- **Aplicação**: http://localhost:3000
- **Banco PostgreSQL**: localhost:5432
- **Nginx**: http://localhost:80 (redireciona para HTTPS)

### Desenvolvimento
- **Aplicação**: http://localhost:3000
- **Banco PostgreSQL**: localhost:5432
- **Redis**: localhost:6379
- **Debugger Node.js**: localhost:9229

## 📊 Serviços Incluídos

### 1. Aplicação Node.js
- **Imagem**: Node.js 18 Alpine
- **Porta**: 3000
- **Volumes**: 
  - `./assets:/app/assets` (arquivos estáticos)
  - `./logs:/app/logs` (logs da aplicação)

### 2. PostgreSQL
- **Imagem**: PostgreSQL 15 Alpine
- **Porta**: 5432
- **Banco**: pearspective (produção) / pearspective_dev (desenvolvimento)
- **Usuário**: perspective_user
- **Senha**: perspective_password

### 3. Nginx (Produção)
- **Imagem**: Nginx Alpine
- **Portas**: 80, 443
- **Função**: Proxy reverso, SSL, cache, rate limiting

### 4. Redis (Desenvolvimento)
- **Imagem**: Redis 7 Alpine
- **Porta**: 6379
- **Função**: Cache e sessões

## 🔐 Configuração de Segurança

### Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
# Banco de Dados
DB_HOST=postgres
DB_PORT=5432
DB_NAME=pearspective
DB_USER=perspective_user
DB_PASSWORD=perspective_password

# Servidor
PORT=3000
NODE_ENV=production

# Segurança
JWT_SECRET=seu_jwt_secret_aqui
SESSION_SECRET=seu_session_secret_aqui
```

### SSL/HTTPS

Para habilitar HTTPS:

1. Coloque seus certificados em `./ssl/`
2. Descomente as linhas SSL no `nginx.conf`
3. Reinicie os serviços

## 🛠️ Comandos Úteis

### Gerenciamento de Containers

```bash
# Ver status dos serviços
docker-compose ps

# Ver logs em tempo real
docker-compose logs -f app

# Reiniciar um serviço
docker-compose restart app

# Parar todos os serviços
docker-compose down

# Parar e remover volumes
docker-compose down -v
```

### Banco de Dados

```bash
# Gerenciador de banco (recomendado)
./scripts/database-manager.sh status
./scripts/database-manager.sh backup
./scripts/database-manager.sh connect

# Ou comandos diretos
docker-compose exec postgres psql -U perspective_user -d pearspective

# Backup do banco
docker-compose exec postgres pg_dump -U perspective_user pearspective > backup.sql

# Restaurar backup
docker-compose exec -T postgres psql -U perspective_user -d pearspective < backup.sql
```

### Desenvolvimento

```bash
# Instalar dependências no container
docker-compose -f docker-compose.dev.yml exec app npm install

# Executar testes
docker-compose -f docker-compose.dev.yml exec app npm test

# Debug da aplicação
# Acesse http://localhost:9229 no Chrome DevTools
```

## 🔍 Troubleshooting

### Problemas Comuns

#### 1. Porta já em uso
```bash
# Verificar o que está usando a porta
lsof -i :3000

# Parar processo
kill -9 <PID>
```

#### 2. Banco não conecta
```bash
# Verificar se o PostgreSQL está rodando
docker-compose exec postgres pg_isready

# Verificar logs
docker-compose logs postgres
```

#### 3. Aplicação não inicia
```bash
# Verificar logs da aplicação
docker-compose logs app

# Rebuild da imagem
docker-compose build --no-cache app
```

#### 4. Permissões de arquivo
```bash
# Corrigir permissões dos scripts
chmod +x scripts/*.sh
```

### Logs e Debug

```bash
# Ver todos os logs
docker-compose logs

# Ver logs de um serviço específico
docker-compose logs app

# Ver logs com timestamps
docker-compose logs -t

# Seguir logs em tempo real
docker-compose logs -f
```

## 📈 Monitoramento

### Health Checks

Os serviços incluem health checks automáticos:

```bash
# Verificar health dos serviços
docker-compose ps

# Verificar health manualmente
docker-compose exec app curl -f http://localhost:3000/
```

### Métricas

```bash
# Uso de recursos dos containers
docker stats

# Informações detalhadas
docker-compose exec app top
```

## 🚀 Deploy em Produção

### 1. Preparação

```bash
# Build da imagem de produção
docker-compose build

# Configurar variáveis de ambiente
cp env.example .env
# Editar .env com valores de produção
```

### 2. Deploy

```bash
# Iniciar serviços
docker-compose up -d

# Verificar status
docker-compose ps

# Verificar logs
docker-compose logs
```

### 3. SSL/HTTPS

1. Obter certificados SSL
2. Colocar em `./ssl/cert.pem` e `./ssl/key.pem`
3. Descomentar configurações SSL no `nginx.conf`
4. Reiniciar serviços

## 🔄 Atualizações

### Atualizar Código

```bash
# Parar serviços
docker-compose down

# Pull das mudanças
git pull

# Rebuild e reiniciar
docker-compose build --no-cache
docker-compose up -d
```

### Atualizar Dependências

```bash
# Entrar no container
docker-compose exec app sh

# Atualizar dependências
npm update

# Sair e rebuild
exit
docker-compose build app
```

## 📚 Recursos Adicionais

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Node.js Docker Best Practices](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)
- [PostgreSQL Docker](https://hub.docker.com/_/postgres)
- [Nginx Docker](https://hub.docker.com/_/nginx)

## 🤝 Contribuição

Para contribuir com melhorias no Docker:

1. Teste suas mudanças localmente
2. Atualize a documentação
3. Crie um pull request com descrição detalhada

## 📞 Suporte

Se encontrar problemas:

1. Verifique os logs: `docker-compose logs`
2. Consulte a seção troubleshooting
3. Abra uma issue no repositório

---

**Perspective** - Sistema moderno de desenvolvimento profissional com IA 