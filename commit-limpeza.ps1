# Script de Commit da Limpeza - Perspective Project
Write-Host "🚀 Iniciando commit da limpeza..." -ForegroundColor Green

# 1. Verificar status
Write-Host "📊 Verificando status do Git..." -ForegroundColor Yellow
git status

# 2. Adicionar todas as mudanças
Write-Host "📁 Adicionando arquivos..." -ForegroundColor Yellow
git add .

# 3. Verificar o que será commitado
Write-Host "📋 Arquivos que serão commitados:" -ForegroundColor Cyan
git status --porcelain

# 4. Fazer commit
Write-Host "💾 Fazendo commit..." -ForegroundColor Yellow
git commit -m "🧹 LIMPEZA COMPLETA: Remove arquivos desnecessários

- Deletados ~50 arquivos de teste e debug
- Removidos diretórios duplicados (Page_inicial/, catalogo/, etc.)
- Limpeza de dumps e imports antigos (~10MB liberados)
- Removidos arquivos Docker não utilizados
- Limpeza de documentação antiga
- Estrutura otimizada para deploy Vercel

Arquivos mantidos:
- public/ (frontend para Vercel)
- api/ (backend para Vercel)
- database/ (scripts essenciais)
- assets/ (imagens e dados)
- package.json, vercel.json, README.md"

# 5. Verificar resultado
Write-Host "✅ Commit realizado com sucesso!" -ForegroundColor Green
Write-Host "📊 Status final:" -ForegroundColor Cyan
git status

Write-Host "`n🎯 Próximos passos:" -ForegroundColor Magenta
Write-Host "1. git push (para enviar para GitHub)" -ForegroundColor White
Write-Host "2. vercel --prod (para fazer deploy)" -ForegroundColor White 