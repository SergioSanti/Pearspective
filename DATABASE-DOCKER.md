# 🗄️ Banco de Dados PostgreSQL no Docker

## ✅ **Status: Já Implementado!**

O banco de dados PostgreSQL já está completamente configurado e rodando no Docker! Aqui está tudo o que você precisa saber:

## 🏗️ **Configuração Atual**

### **Container PostgreSQL:**
- **Imagem**: `postgres:15-alpine`
- **Porta**: `5432`
- **Banco**: `pearspective`
- **Usuário**: `perspective_user`
- **Senha**: `perspective_password`
- **Volume**: `postgres_data` (dados persistentes)

### **Configurações Otimizadas:**
- ✅ **postgresql.conf** - Configurações de performance
- ✅ **pg_hba.conf** - Configurações de autenticação
- ✅ **Health checks** automáticos
- ✅ **Inicialização automática** com scripts SQL
- ✅ **Limites de memória** configurados

## 🚀 **Como Usar**

### **1. Iniciar o Banco:**
```bash
# Iniciar tudo (incluindo banco)
docker-compose up -d

# Ou apenas o banco
docker-compose up -d postgres
```

### **2. Verificar Status:**
```bash
# Via script (recomendado)
./scripts/database-manager.sh status

# Ou diretamente
docker-compose ps postgres
docker-compose exec postgres pg_isready -U perspective_user -d pearspective
```

### **3. Conectar ao Banco:**
```bash
# Via script (recomendado)
./scripts/database-manager.sh connect

# Ou diretamente
docker-compose exec postgres psql -U perspective_user -d pearspective
```

## 🛠️ **Gerenciamento Completo**

### **Scripts Disponíveis:**

#### **Windows (PowerShell):**
```powershell
# Status e conectividade
.\scripts\database-manager.ps1 status

# Conectar ao banco
.\scripts\database-manager.ps1 connect

# Backup e restore
.\scripts\database-manager.ps1 backup
.\scripts\database-manager.ps1 restore

# Reset completo
.\scripts\database-manager.ps1 reset

# Monitoramento
.\scripts\database-manager.ps1 logs
.\scripts\database-manager.ps1 stats
.\scripts\database-manager.ps1 tables
.\scripts\database-manager.ps1 size
```

#### **Linux/Mac:**
```bash
# Status e conectividade
./scripts/database-manager.sh status

# Conectar ao banco
./scripts/database-manager.sh connect

# Backup e restore
./scripts/database-manager.sh backup
./scripts/database-manager.sh restore

# Reset completo
./scripts/database-manager.sh reset

# Monitoramento
./scripts/database-manager.sh logs
./scripts/database-manager.sh stats
./scripts/database-manager.sh tables
./scripts/database-manager.sh size
```

## 📊 **Operações Comuns**

### **Backup:**
```bash
# Backup automático com timestamp
./scripts/database-manager.sh backup

# Backup manual
docker-compose exec -T postgres pg_dump -U perspective_user pearspective > backup.sql
```

### **Restore:**
```bash
# Restore interativo (lista backups disponíveis)
./scripts/database-manager.sh restore

# Restore manual
docker-compose exec -T postgres psql -U perspective_user -d pearspective < backup.sql
```

### **Reset Completo:**
```bash
# Reset com confirmação
./scripts/database-manager.sh reset

# Reset manual
docker-compose down -v
docker-compose up -d postgres
```

### **Monitoramento:**
```bash
# Ver logs em tempo real
./scripts/database-manager.sh logs

# Estatísticas do banco
./scripts/database-manager.sh stats

# Listar tabelas
./scripts/database-manager.sh tables

# Tamanho do banco
./scripts/database-manager.sh size
```

## 🔧 **Configurações Avançadas**

### **Arquivos de Configuração:**

#### **postgresql.conf:**
- Memória otimizada (256MB shared_buffers)
- Logs configurados
- Autovacuum habilitado
- Performance tuning

#### **pg_hba.conf:**
- Autenticação segura
- Conexões Docker permitidas
- Configurações de rede

### **Volumes e Persistência:**
```yaml
volumes:
  - postgres_data:/var/lib/postgresql/data  # Dados persistentes
  - ./database/init.sql:/docker-entrypoint-initdb.d/01-init.sql
  - ./database/migration_cursos.sql:/docker-entrypoint-initdb.d/02-migration_cursos.sql
  - ./database/fix.sql:/docker-entrypoint-initdb.d/03-fix.sql
  - ./database/postgresql.conf:/etc/postgresql/postgresql.conf
  - ./database/pg_hba.conf:/etc/postgresql/pg_hba.conf
```

### **Health Checks:**
```yaml
healthcheck:
  test: ["CMD-SHELL", "pg_isready -U perspective_user -d pearspective"]
  interval: 30s
  timeout: 10s
  retries: 3
```

## 🌐 **Conectividade**

### **Acesso Local:**
- **Host**: `localhost`
- **Porta**: `5432`
- **Banco**: `pearspective`
- **Usuário**: `perspective_user`
- **Senha**: `perspective_password`

### **Acesso Interno (Docker):**
- **Host**: `postgres`
- **Porta**: `5432`
- **Banco**: `pearspective`
- **Usuário**: `perspective_user`
- **Senha**: `perspective_password`

### **String de Conexão:**
```
# Local
postgresql://perspective_user:perspective_password@localhost:5432/pearspective

# Docker interno
postgresql://perspective_user:perspective_password@postgres:5432/pearspective
```

## 🔍 **Troubleshooting**

### **Problemas Comuns:**

#### **1. Container não inicia:**
```bash
# Verificar logs
docker-compose logs postgres

# Verificar se a porta está livre
lsof -i :5432
```

#### **2. Não consegue conectar:**
```bash
# Verificar se o container está rodando
docker-compose ps postgres

# Testar conectividade
docker-compose exec postgres pg_isready -U perspective_user -d pearspective
```

#### **3. Dados perdidos:**
```bash
# Verificar volumes
docker volume ls

# Restaurar backup
./scripts/database-manager.sh restore
```

#### **4. Performance lenta:**
```bash
# Verificar estatísticas
./scripts/database-manager.sh stats

# Executar VACUUM
./scripts/database-manager.sh vacuum

# Executar ANALYZE
./scripts/database-manager.sh analyze
```

## 📈 **Monitoramento e Performance**

### **Comandos Úteis:**
```bash
# Ver uso de recursos
docker stats perspective_postgres

# Ver logs em tempo real
docker-compose logs -f postgres

# Verificar queries lentas
docker-compose exec postgres psql -U perspective_user -d pearspective -c "
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;
"
```

### **Métricas Importantes:**
- **Conexões ativas**
- **Tamanho do banco**
- **Performance de queries**
- **Uso de memória**
- **Logs de erro**

## 🔒 **Segurança**

### **Configurações Implementadas:**
- ✅ **Autenticação por senha**
- ✅ **Conexões restritas por IP**
- ✅ **Usuário não-superuser**
- ✅ **Banco isolado**
- ✅ **Volumes seguros**

### **Recomendações:**
1. **Alterar senhas** em produção
2. **Configurar SSL** se necessário
3. **Fazer backups regulares**
4. **Monitorar logs**
5. **Atualizar PostgreSQL** regularmente

## 📚 **Recursos Adicionais**

- [PostgreSQL Docker Hub](https://hub.docker.com/_/postgres)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Docker PostgreSQL Best Practices](https://docs.docker.com/samples/library/postgres/)

---

**🎉 O banco de dados PostgreSQL está totalmente configurado e pronto para uso no Docker!** 