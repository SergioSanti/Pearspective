# Deploy Simples - Sem Git

## Opção 1: Vercel CLI (Mais Simples)

### 1. Instalar Vercel CLI
```bash
npm install -g vercel
```

### 2. Fazer Login
```bash
vercel login
```

### 3. Deploy do Projeto
```bash
# Na pasta do projeto
vercel --prod
```

O Vercel vai detectar automaticamente que é um projeto Node.js e fazer o deploy.

## Opção 2: ZIP Upload no Vercel

### 1. Criar ZIP do Projeto
- Selecione TODOS os arquivos do projeto (exceto node_modules)
- Crie um arquivo ZIP

### 2. Upload no Vercel
- Vá para https://vercel.com/new
- Clique em "Upload Template"
- Arraste o ZIP

## Opção 3: GitHub Temporário (Mais Confiável)

### 1. Criar Repo Temporário
```bash
# Inicializar Git
git init
git add .
git commit -m "Initial commit"

# Criar repo no GitHub (via web)
# Depois conectar:
git remote add origin https://github.com/seu-usuario/repo-temporario.git
git push -u origin main
```

### 2. Deploy no Vercel
- Vá para https://vercel.com/new
- Importe o repo do GitHub
- Configure as variáveis de ambiente

## Opção 4: Netlify (Alternativa)

### 1. ZIP Upload no Netlify
- Vá para https://app.netlify.com/drop
- Arraste a pasta do projeto
- Netlify faz deploy automático

### 2. Configurar Backend
- Use Netlify Functions para API
- Ou conecte com Supabase/outro backend

## Opção 5: Railway (Mais Completo)

### 1. Criar Conta
- Vá para https://railway.app
- Conecte com GitHub

### 2. Deploy
- Clique em "New Project"
- Selecione "Deploy from GitHub repo"
- Ou use "Deploy from template"

## Recomendação: Vercel CLI

**Por que Vercel CLI é o mais simples:**

1. **Sem Git necessário** - Deploy direto
2. **Detecção automática** - Configura tudo sozinho
3. **Variáveis de ambiente** - Fácil de configurar
4. **Domínio automático** - URL pronta
5. **SSL automático** - HTTPS gratuito

### Passos Completos com Vercel CLI:

```bash
# 1. Instalar
npm install -g vercel

# 2. Login
vercel login

# 3. Na pasta do projeto
vercel --prod

# 4. Configurar variáveis de ambiente
vercel env add DATABASE_URL
vercel env add DB_HOST
vercel env add DB_USER
vercel env add DB_PASSWORD
vercel env add DB_NAME
vercel env add DB_PORT

# 5. Redeploy
vercel --prod
```

### Configuração do vercel.json (já existe):
```json
{
  "version": 2,
  "builds": [
    {
      "src": "api/app.js",
      "use": "@vercel/node"
    },
    {
      "src": "public/**",
      "use": "@vercel/static"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/app.js"
    },
    {
      "src": "/(.*)",
      "dest": "/public/$1"
    }
  ]
}
```

## Próximos Passos

1. **Escolha Vercel CLI** (recomendado)
2. **Configure o banco Supabase** (já feito)
3. **Configure as variáveis de ambiente**
4. **Teste o deploy**

Quer que eu te ajude com qual opção? 