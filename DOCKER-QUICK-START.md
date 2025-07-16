# 🚀 Docker - Início Rápido

## ⚡ Setup Automático (Recomendado)

### Windows (PowerShell)
```powershell
# Executar setup automático
.\scripts\docker-setup.ps1

# Ou usar comandos individuais
docker.bat build
docker.bat up
```

### Linux/Mac
```bash
# Executar setup automático
chmod +x scripts/docker-setup.sh
./scripts/docker-setup.sh

# Ou usar Makefile
make build
make up
```

## 🛠️ Comandos Essenciais

### Produção
```bash
# Iniciar tudo
docker-compose up -d

# Ver logs
docker-compose logs -f

# Parar tudo
docker-compose down

# Status
docker-compose ps
```

### Desenvolvimento
```bash
# Iniciar ambiente de desenvolvimento
docker-compose -f docker-compose.dev.yml up -d

# Ver logs de desenvolvimento
docker-compose -f docker-compose.dev.yml logs -f

# Parar desenvolvimento
docker-compose -f docker-compose.dev.yml down
```

## 🌐 Acesso aos Serviços

- **Aplicação**: http://localhost:3000
- **PostgreSQL**: localhost:5432
- **Redis** (dev): localhost:6379
- **Debugger** (dev): localhost:9229

## 📋 Scripts NPM

```bash
# Produção
npm run docker:build
npm run docker:up
npm run docker:logs

# Desenvolvimento
npm run docker:dev
npm run docker:dev-logs

# Utilitários
npm run docker:shell
npm run docker:db-shell
npm run docker:backup
```

## 🔧 Configuração

1. **Arquivo .env**: Criado automaticamente pelo script
2. **Banco de dados**: Inicializado automaticamente
3. **Volumes**: Dados persistidos em `./data/`

## 🆘 Troubleshooting

### Problemas Comuns

1. **Porta em uso**: Mude a porta no `docker-compose.yml`
2. **Permissões**: Execute como administrador (Windows)
3. **Docker não roda**: Inicie o Docker Desktop

### Logs e Debug

```bash
# Ver todos os logs
docker-compose logs

# Ver logs de um serviço
docker-compose logs app

# Health check
docker-compose ps
```

## 📚 Documentação Completa

Veja `README-Docker.md` para documentação detalhada.

---

**Perspective** - Sistema moderno de desenvolvimento profissional com IA 