# 🚀 Deploy Pearspective no Render

## Configuração Automática

Este projeto está configurado para deploy automático no Render.

### 📋 Pré-requisitos

1. Conta no [Render](https://render.com) (gratuita)
2. Projeto no GitHub
3. 5 minutos para configurar

### 🎯 Passos para Deploy

#### 1. Criar Conta no Render
- Acesse [render.com](https://render.com)
- Faça login com GitHub
- Clique em "New +"

#### 2. Deploy do Frontend (Static Site)
- Escolha **"Static Site"**
- Conecte seu repositório GitHub
- Configure:
  - **Name**: `pearspective-frontend`
  - **Build Command**: `npm run build`
  - **Publish Directory**: `public`
- Clique em "Create Static Site"

#### 3. Deploy do Backend (Web Service)
- Escolha **"Web Service"**
- Conecte o mesmo repositório
- Configure:
  - **Name**: `pearspective-api`
  - **Build Command**: `npm install`
  - **Start Command**: `npm start`
- Clique em "Create Web Service"

#### 4. Criar Banco PostgreSQL
- Escolha **"PostgreSQL"**
- Configure:
  - **Name**: `pearspective-db`
  - **Database**: `pearspective`
  - **User**: `pearspective_user`
- Clique em "Create Database"

#### 5. Configurar Variáveis de Ambiente
No serviço do backend, adicione as variáveis:

```
DB_HOST=seu-host-postgresql
DB_USER=seu-usuario
DB_PASSWORD=sua-senha
DB_NAME=pearspective
DB_PORT=5432
NODE_ENV=production
```

#### 6. Importar Dados
- Use o arquivo `import-completo-com-usuarios.sql`
- Importe no banco PostgreSQL do Render

### 🔗 URLs Finais

- **Frontend**: `https://pearspective-frontend.onrender.com`
- **Backend**: `https://pearspective-api.onrender.com`
- **Banco**: Configurado automaticamente

### ✅ Verificação

1. Acesse o frontend
2. Teste o login com usuário "sergio"
3. Verifique se todas as páginas carregam
4. Teste funcionalidades principais

### 🆘 Troubleshooting

**Problema**: Páginas não carregam
**Solução**: Verificar se arquivos estão na pasta `public/`

**Problema**: Login não funciona
**Solução**: Verificar variáveis de ambiente do banco

**Problema**: CSS não carrega
**Solução**: Verificar se `render-build.sh` foi executado

### 📞 Suporte

Se algo não funcionar, verifique:
1. Logs no Render Dashboard
2. Variáveis de ambiente
3. Conexão com banco de dados

---

**🎉 Pronto! Seu projeto estará funcionando exatamente como no localhost!** 