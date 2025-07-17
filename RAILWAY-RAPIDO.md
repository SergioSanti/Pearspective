# 🚂 Railway - Deploy Rápido e Simples

## 🎯 Por que Railway é melhor:

✅ **Estrutura original** - Não muda nada do projeto
✅ **Funciona igual localhost** - Servidor Node.js completo
✅ **PostgreSQL gratuito** - Banco incluído
✅ **Deploy automático** - Do GitHub
✅ **URL HTTPS** - Automática

## 🚀 Passos Rápidos:

### 1. Criar conta Railway
- Vá para https://railway.app
- Clique "Start a New Project"
- Conecte GitHub

### 2. Deploy automático
- Clique "Deploy from GitHub repo"
- Selecione seu repositório
- Clique "Deploy Now"

### 3. Adicionar banco PostgreSQL
- Clique "New" → "Database" → "PostgreSQL"
- Railway cria automaticamente

### 4. Configurar variáveis
No projeto → Variables:
```
DATABASE_URL=postgresql://postgres:password@localhost:5432/perspective
```

### 5. Pronto!
- URL: `perspective-production.up.railway.app`
- Funciona exatamente como localhost

## 📁 Estrutura Mantida:

```
Perspective/
├── Page_inicial/          # ✅ Original
├── catalogo/             # ✅ Original  
├── biblioteca/           # ✅ Original
├── simulador/            # ✅ Original
├── historico/            # ✅ Original
├── perfil/               # ✅ Original
├── database/app.js       # ✅ Backend
├── assets/               # ✅ Assets
└── package.json          # ✅ Configurado
```

## 🔧 Configurações Feitas:

✅ `package.json` - Ajustado para Railway
✅ `database/app.js` - Já configurado
✅ `railway.json` - Configuração Railway

## 🎯 Resultado:

- **Zero mudanças** na estrutura
- **Funciona igual localhost**
- **Banco PostgreSQL** gratuito
- **Deploy automático**

**Quer começar agora? É só 5 passos!** 