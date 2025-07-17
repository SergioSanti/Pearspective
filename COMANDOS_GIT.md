# Comandos Git para Commit da Limpeza

## 🚀 Comandos Simples (Execute um por vez):

### 1. Verificar status
```bash
git status
```

### 2. Adicionar todas as mudanças
```bash
git add .
```

### 3. Fazer commit
```bash
git commit -m "🧹 LIMPEZA COMPLETA: Remove arquivos desnecessários

- Deletados ~50 arquivos de teste e debug
- Removidos diretórios duplicados
- Limpeza de dumps antigos (~10MB liberados)
- Estrutura otimizada para deploy Vercel"
```

### 4. Enviar para GitHub
```bash
git push
```

## 📊 Ou execute tudo de uma vez:

```bash
git add . && git commit -m "🧹 LIMPEZA COMPLETA: Remove arquivos desnecessários" && git push
```

## 🎯 Depois do commit:

```bash
vercel --prod
```

## 📋 Resumo da Limpeza:

✅ **Arquivos deletados:**
- ~50 arquivos de teste
- 6 diretórios duplicados
- Dumps antigos (4.3MB)
- Configurações Docker
- Documentação antiga

✅ **Estrutura final limpa:**
- `public/` - Frontend para Vercel
- `api/` - Backend para Vercel
- `database/` - Scripts essenciais
- `assets/` - Imagens e dados
- `package.json`, `vercel.json`, `README.md` 