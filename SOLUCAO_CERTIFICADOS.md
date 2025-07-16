# 🔧 Solução para Problemas dos Certificados

## 🚨 Problemas Identificados

1. **Erro 404 no endpoint de certificados**
2. **Conflito de rotas no Express**
3. **Ordem incorreta dos endpoints**

## ✅ Soluções Implementadas

### **1. Reorganização dos Endpoints**

O problema principal era que o endpoint `/api/certificados/:id` estava interceptando as requisições antes do `/api/certificados/usuario/:userId`.

**Ordem Correta:**
```javascript
// 1. Endpoint mais específico primeiro
app.get('/api/certificados/usuario/:userId', ...)

// 2. Endpoint com sub-rota
app.get('/api/certificados/:id/pdf', ...)

// 3. Endpoint genérico por último
app.get('/api/certificados/:id', ...)
```

### **2. Remoção de Endpoints Duplicados**

Removidos endpoints antigos que conflitavam com os novos:
- ❌ `app.get('/api/certificados', ...)` (antigo)
- ✅ `app.get('/api/certificados/usuario/:userId', ...)` (novo)

### **3. Validação de Dados**

Adicionadas validações nos endpoints:
```javascript
if (!usuario_id || !nome || !instituicao || !data_conclusao) {
  return res.status(400).json({ error: 'Campos obrigatórios não fornecidos' });
}
```

## 🧪 Como Testar

### **1. Página de Teste**
Acesse: `http://localhost:3000/test-certificados.html`

### **2. Testes Manuais**

#### **Teste 1: Buscar Certificados do Usuário**
```bash
curl http://localhost:3000/api/certificados/usuario/2
```

**Resposta Esperada:**
```json
[]
```
(Array vazio se não há certificados)

#### **Teste 2: Adicionar Certificado**
```bash
curl -X POST http://localhost:3000/api/certificados \
  -F "usuario_id=2" \
  -F "nome=Curso de Teste" \
  -F "instituicao=Instituição de Teste" \
  -F "data_conclusao=2024-01-01" \
  -F "descricao=Descrição de teste"
```

**Resposta Esperada:**
```json
{
  "id": 1,
  "message": "Certificado adicionado com sucesso"
}
```

#### **Teste 3: Verificar Banco de Dados**
```bash
curl http://localhost:3000/api/test/database
```

## 🔍 Verificações Importantes

### **1. Servidor Rodando**
```bash
netstat -an | findstr :3000
```

### **2. Banco de Dados Conectado**
```bash
docker exec pearspective_postgres psql -U admin -d pearspective -c "SELECT COUNT(*) FROM certificados;"
```

### **3. Tabela de Certificados Existe**
```bash
docker exec pearspective_postgres psql -U admin -d pearspective -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'certificados');"
```

## 🛠️ Comandos para Reiniciar

### **1. Parar Servidor**
```powershell
taskkill /f /im node.exe
```

### **2. Navegar para Diretório**
```powershell
cd database
```

### **3. Instalar Dependências**
```powershell
npm install
```

### **4. Iniciar Servidor**
```powershell
node app.js
```

## 📋 Checklist de Verificação

- [ ] Servidor rodando na porta 3000
- [ ] Banco de dados conectado
- [ ] Tabela certificados existe
- [ ] Endpoints organizados corretamente
- [ ] Multer instalado e configurado
- [ ] CORS habilitado
- [ ] Validações implementadas

## 🎯 Resultado Esperado

Após as correções:

1. **Frontend**: Página de certificados carrega sem erros
2. **API**: Endpoints respondem corretamente
3. **Upload**: PDFs podem ser anexados
4. **Visualização**: PDFs podem ser visualizados
5. **CRUD**: Todas as operações funcionam

## 🚀 Próximos Passos

1. **Teste a página**: `http://localhost:3000/historico/historico.html`
2. **Adicione certificados** com PDF
3. **Verifique se funcionam** todas as operações
4. **Teste o campo de vagas** nos cargos

O sistema deve estar funcionando corretamente agora! 🎉 