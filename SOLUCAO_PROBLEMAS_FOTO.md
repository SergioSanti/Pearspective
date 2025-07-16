# Guia de Solução de Problemas - Fotos de Usuário

## 🚨 Problema Principal
A imagem não está sendo armazenada no banco de dados com seu respectivo usuário.

## 🔍 Diagnóstico

### 1. **Verificar se o usuário está logado**
```javascript
// No console do navegador
console.log('userName:', localStorage.getItem('userName'));
console.log('userId:', localStorage.getItem('userId'));
```

### 2. **Verificar estado do banco de dados**
```javascript
// Execute no console
fetch('/api/test/database')
  .then(response => response.json())
  .then(data => console.log('Banco:', data));
```

### 3. **Verificar usuário específico**
```javascript
// Substitua 'nome_do_usuario' pelo nome real
fetch('/api/test/user/nome_do_usuario')
  .then(response => response.json())
  .then(data => console.log('Usuário:', data));
```

## 🛠️ Scripts de Diagnóstico

### Script Completo de Diagnóstico
```javascript
// Execute este script no console do navegador
// Copie e cole o conteúdo do arquivo: diagnostico-foto.js
```

### Script de Teste do Banco
```javascript
// Execute este script no console do navegador
// Copie e cole o conteúdo do arquivo: test-database-photo.js
```

## 🔧 Soluções por Problema

### Problema 1: Usuário não encontrado no banco
**Sintomas:**
- Erro 404 ao buscar usuário
- Foto não aparece após login

**Solução:**
1. Verificar se o usuário existe no banco:
```sql
SELECT * FROM usuarios WHERE nome = 'nome_do_usuario';
```

2. Se não existir, criar o usuário:
```sql
INSERT INTO usuarios (nome, email, senha, tipo_usuario) 
VALUES ('nome_do_usuario', 'email@exemplo.com', 'senha123', 'usuario');
```

### Problema 2: Campo foto_perfil não existe
**Sintomas:**
- Erro ao salvar foto
- Campo não encontrado na tabela

**Solução:**
1. Verificar estrutura da tabela:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'usuarios';
```

2. Se o campo não existir, adicionar:
```sql
ALTER TABLE usuarios ADD COLUMN foto_perfil TEXT;
```

### Problema 3: Foto não está sendo salva
**Sintomas:**
- Upload parece funcionar mas foto não aparece
- Erro 500 no servidor

**Solução:**
1. Verificar logs do servidor
2. Testar upload manual:
```javascript
fetch('/api/users/profile/USER_ID', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    nome: 'nome_do_usuario',
    foto_perfil: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzAwNzNhYSIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPlRlc3RlPC90ZXh0Pjwvc3ZnPg=='
  })
})
.then(response => response.json())
.then(data => console.log('Resultado:', data));
```

### Problema 4: Foto não está sendo carregada
**Sintomas:**
- Foto salva no banco mas não aparece na interface
- Erro ao buscar foto

**Solução:**
1. Verificar endpoint de busca:
```javascript
fetch('/api/users/photo/nome_do_usuario')
  .then(response => response.json())
  .then(data => console.log('Foto:', data));
```

2. Verificar se a foto está no banco:
```sql
SELECT nome, foto_perfil FROM usuarios WHERE nome = 'nome_do_usuario';
```

### Problema 5: Foto some após logout/login
**Sintomas:**
- Foto aparece durante a sessão
- Desaparece após fazer logout e login novamente

**Solução:**
1. Verificar se a foto está sendo salva no banco (não apenas localStorage)
2. Verificar se o endpoint de login retorna a foto
3. Verificar se a navbar busca a foto do banco

## 🧪 Testes Automatizados

### Teste 1: Verificar Estado Inicial
```javascript
// Execute no console
diagnosticoFoto.runFullDiagnostic();
```

### Teste 2: Testar Upload de Foto
```javascript
// Execute no console
const userName = localStorage.getItem('userName');
const userId = localStorage.getItem('userId');
diagnosticoFoto.testPhotoUpload(userName, userId);
```

### Teste 3: Testar Busca de Foto
```javascript
// Execute no console
const userName = localStorage.getItem('userName');
diagnosticoFoto.testPhotoRetrieval(userName);
```

## 📋 Checklist de Verificação

### ✅ Banco de Dados
- [ ] Conexão com banco funcionando
- [ ] Tabela `usuarios` existe
- [ ] Campo `foto_perfil` existe (TEXT)
- [ ] Usuário existe no banco
- [ ] Usuário tem ID válido

### ✅ Backend
- [ ] Servidor rodando na porta correta
- [ ] Endpoint `/api/users/profile/:userId` funcionando
- [ ] Endpoint `/api/users/photo/:userName` funcionando
- [ ] Endpoint `/login` retorna `foto_perfil`
- [ ] Logs mostram operações de foto

### ✅ Frontend
- [ ] Usuário logado (userName e userId no localStorage)
- [ ] Página de perfil carrega dados do usuário
- [ ] Upload de foto funciona
- [ ] Navbar busca foto do banco
- [ ] Foto aparece após upload

### ✅ Sincronização
- [ ] Foto salva no banco ao fazer upload
- [ ] Foto carregada do banco ao fazer login
- [ ] Foto aparece na navbar após login
- [ ] Foto aparece na página de perfil
- [ ] Foto persiste após logout/login

## 🚀 Comandos de Debug

### Verificar Logs do Servidor
```bash
# No terminal onde o servidor está rodando
# Verificar logs de conexão com banco
# Verificar logs de operações de foto
```

### Verificar Banco de Dados
```sql
-- Conectar ao PostgreSQL
psql -h localhost -U admin -d pearspective

-- Verificar usuários
SELECT id, nome, email, foto_perfil FROM usuarios;

-- Verificar estrutura da tabela
\d usuarios

-- Verificar se foto está sendo salva
SELECT nome, LENGTH(foto_perfil) as tamanho_foto FROM usuarios WHERE foto_perfil IS NOT NULL;
```

### Verificar Frontend
```javascript
// No console do navegador
// Verificar localStorage
console.log('localStorage:', Object.fromEntries(Object.entries(localStorage)));

// Verificar se usuário está logado
console.log('userName:', localStorage.getItem('userName'));
console.log('userId:', localStorage.getItem('userId'));

// Testar busca de foto
fetch('/api/users/photo/' + encodeURIComponent(localStorage.getItem('userName')))
  .then(r => r.json())
  .then(d => console.log('Foto:', d));
```

## 📞 Próximos Passos

1. **Execute o diagnóstico completo:**
   ```javascript
   diagnosticoFoto.runFullDiagnostic();
   ```

2. **Verifique os resultados** e identifique o problema específico

3. **Aplique a solução** correspondente ao problema encontrado

4. **Teste novamente** para confirmar que o problema foi resolvido

5. **Se o problema persistir**, verifique os logs do servidor e banco de dados

## 🆘 Suporte

Se nenhuma das soluções acima resolver o problema:

1. **Execute o diagnóstico completo** e copie os resultados
2. **Verifique os logs do servidor** para erros específicos
3. **Teste a conexão com o banco** diretamente
4. **Verifique se todos os endpoints** estão funcionando

O problema mais comum é que a foto não está sendo salva no banco de dados. Use os scripts de teste para identificar exatamente onde está falhando. 