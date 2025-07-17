# 🗄️ Migrar Banco Docker → Railway

## 📋 Pré-requisitos:
- Banco Docker rodando localmente
- Projeto já configurado no Railway
- Dados que você quer preservar

## 🚀 Passo a Passo:

### 1. Criar dump do banco Docker
```bash
# Conectar ao container Docker
docker exec -it perspective-postgres-1 pg_dump -U postgres -d pearspective > dump_railway.sql
```

### 2. Criar banco PostgreSQL no Railway
- Vá para seu projeto no Railway
- Clique **"New"** → **"Database"** → **"PostgreSQL"**
- Railway vai criar automaticamente

### 3. Obter credenciais do Railway
- No banco criado, clique em **"Connect"**
- Copie a **"Postgres Connection URL"**
- Exemplo: `postgresql://postgres:password@containers-us-west-1.railway.app:5432/railway`

### 4. Configurar variável no Railway
- Vá para seu projeto → **"Variables"**
- Adicione:
```
DATABASE_URL=postgresql://postgres:password@containers-us-west-1.railway.app:5432/railway
```

### 5. Importar dados para Railway
```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Login no Railway
railway login

# Conectar ao projeto
railway link

# Importar dump
railway run psql < dump_railway.sql
```

## 🔧 Alternativa: Via pgAdmin (Interface Web)

### 1. Acessar pgAdmin do Railway
- No banco Railway, clique em **"Query"**
- Abre interface web do PostgreSQL

### 2. Importar via interface
- Clique em **"Upload"** ou **"Import"**
- Selecione o arquivo `dump_railway.sql`
- Execute a importação

## 📊 Verificar Importação

### 1. Conectar ao banco Railway
```bash
railway run psql
```

### 2. Verificar tabelas
```sql
\dt
SELECT COUNT(*) FROM usuarios;
SELECT COUNT(*) FROM cursos;
SELECT COUNT(*) FROM certificados;
```

## 🎯 Scripts Automatizados

### Script para fazer dump:
```bash
#!/bin/bash
echo "📦 Criando dump do banco Docker..."
docker exec -it perspective-postgres-1 pg_dump -U postgres -d pearspective > dump_railway.sql
echo "✅ Dump criado: dump_railway.sql"
```

### Script para importar no Railway:
```bash
#!/bin/bash
echo "🚂 Importando para Railway..."
railway run psql < dump_railway.sql
echo "✅ Importação concluída!"
```

## 🔍 Troubleshooting

### Erro de conexão:
```bash
# Verificar se Railway CLI está conectado
railway status

# Reconectar se necessário
railway link
```

### Erro de permissão:
```bash
# Dar permissões ao arquivo
chmod +r dump_railway.sql
```

### Erro de encoding:
```bash
# Especificar encoding
railway run psql --set ON_ERROR_STOP=on < dump_railway.sql
```

## ✅ Resultado Final:

- **Banco Docker** → **Banco Railway**
- **Dados preservados** - Todos os usuários, cursos, certificados
- **Conexão automática** - Via DATABASE_URL
- **Backup automático** - Railway faz backup

## 🎯 Próximos Passos:

1. **Fazer dump** do banco Docker
2. **Criar banco** no Railway
3. **Importar dados**
4. **Configurar DATABASE_URL**
5. **Testar aplicação**

**Quer que eu te ajude com algum passo específico?** 