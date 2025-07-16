# 📚 Certificados e Cargos - Atualizações Implementadas

## 🎯 Resumo das Mudanças

Implementei funcionalidades completas para:
1. **Sistema de Certificados com PDF**: Upload e visualização de certificados em PDF
2. **Campo de Vagas nos Cargos**: Administradores podem gerenciar quantidade de vagas
3. **Integração com Banco de Dados**: Todos os dados são persistidos no PostgreSQL

## ✨ Funcionalidades Implementadas

### 📄 **Sistema de Certificados**

#### **Upload de PDF:**
- ✅ Campo para anexar arquivo PDF (máximo 10MB)
- ✅ Validação de tipo de arquivo (apenas PDF)
- ✅ Armazenamento no banco de dados (BYTEA)
- ✅ Visualização inline do PDF

#### **Interface Melhorada:**
- ✅ Formulário com campos obrigatórios e opcionais
- ✅ Descrição opcional para cada certificado
- ✅ Botão para visualizar PDF quando disponível
- ✅ Indicador visual quando não há PDF anexado

#### **Integração com Usuário:**
- ✅ Certificados vinculados ao usuário logado
- ✅ Cada usuário vê apenas seus próprios certificados
- ✅ CRUD completo (Criar, Ler, Atualizar, Deletar)

### 🏢 **Campo de Vagas nos Cargos**

#### **Banco de Dados:**
- ✅ Coluna `quantidade_vagas` adicionada na tabela `cargos`
- ✅ Valor padrão: 1 vaga
- ✅ Migration SQL criada

#### **API Atualizada:**
- ✅ Endpoints POST e PUT incluem campo `quantidade_vagas`
- ✅ Administradores podem editar quantidade de vagas
- ✅ Validação e tratamento de erros

## 🔧 **Arquivos Modificados**

### **Frontend:**
- `historico/historico.html` - Formulário com upload de PDF
- `historico/historico.js` - Integração com API e upload de arquivos
- `historico/certificados.css` - Estilos para PDF e descrição

### **Backend:**
- `database/app.js` - Endpoints para certificados e cargos atualizados
- `database/package.json` - Adicionado multer para upload de arquivos

### **Banco de Dados:**
- `database/migration_cargos_vagas.sql` - Migration para campo de vagas
- `database/run-migration.ps1` - Script para executar migration

## 🚀 **Como Usar**

### **1. Executar Migration do Banco:**
```powershell
# No PowerShell
.\database\run-migration.ps1
```

### **2. Instalar Dependências:**
```powershell
# No diretório database
cd database
npm install
```

### **3. Iniciar Servidor:**
```powershell
# No diretório database
node app.js
```

### **4. Testar Certificados:**
1. Acesse `historico/historico.html`
2. Faça login com qualquer usuário
3. Clique em "Adicionar Certificado"
4. Preencha os campos e anexe um PDF
5. Salve e visualize o certificado

### **5. Testar Cargos com Vagas:**
1. Acesse o simulador como administrador
2. Vá para "Gerenciar Cargos"
3. Edite um cargo e adicione quantidade de vagas
4. Salve as alterações

## 📊 **Estrutura do Banco**

### **Tabela `certificados`:**
```sql
CREATE TABLE certificados (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id),
    nome VARCHAR(200) NOT NULL,
    instituicao VARCHAR(200) NOT NULL,
    data_conclusao DATE NOT NULL,
    descricao TEXT,
    pdf BYTEA,
    data_emissao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### **Tabela `cargos` (atualizada):**
```sql
ALTER TABLE cargos ADD COLUMN quantidade_vagas INTEGER DEFAULT 1;
```

## 🔌 **Endpoints da API**

### **Certificados:**
- `GET /api/certificados/usuario/:userId` - Buscar certificados do usuário
- `GET /api/certificados/:id` - Buscar certificado específico
- `GET /api/certificados/:id/pdf` - Download do PDF
- `POST /api/certificados` - Adicionar certificado (com upload)
- `PUT /api/certificados/:id` - Atualizar certificado
- `DELETE /api/certificados/:id` - Excluir certificado

### **Cargos (atualizados):**
- `POST /api/cargos` - Criar cargo (inclui quantidade_vagas)
- `PUT /api/cargos/:id` - Atualizar cargo (inclui quantidade_vagas)

## 🛡️ **Segurança e Validação**

### **Upload de Arquivos:**
- ✅ Apenas arquivos PDF aceitos
- ✅ Limite de 10MB por arquivo
- ✅ Validação de MIME type
- ✅ Armazenamento seguro no banco

### **Controle de Acesso:**
- ✅ Certificados vinculados ao usuário logado
- ✅ Apenas administradores podem editar cargos
- ✅ Validação de dados obrigatórios

## 📱 **Interface do Usuário**

### **Página de Certificados:**
- ✅ Design responsivo e moderno
- ✅ Cards com informações completas
- ✅ Botão para visualizar PDF
- ✅ Indicador visual para certificados sem PDF
- ✅ Formulário intuitivo com validação

### **Formulário de Certificado:**
- ✅ Campos obrigatórios: Nome, Instituição, Data
- ✅ Campo opcional: Descrição
- ✅ Upload de PDF com validação
- ✅ Mensagens de ajuda e feedback

## ✅ **Status da Implementação**

- ✅ Sistema de certificados com PDF implementado
- ✅ Campo de vagas nos cargos adicionado
- ✅ API completa para CRUD de certificados
- ✅ Upload e visualização de PDF funcionando
- ✅ Interface atualizada e responsiva
- ✅ Integração com banco de dados
- ✅ Validações de segurança
- ✅ Scripts de migration criados

## 🧪 **Testes Recomendados**

### **Teste de Certificados:**
1. Adicionar certificado sem PDF
2. Adicionar certificado com PDF
3. Editar certificado existente
4. Visualizar PDF anexado
5. Excluir certificado

### **Teste de Cargos:**
1. Editar quantidade de vagas como admin
2. Verificar se o campo é salvo no banco
3. Testar com diferentes valores

O sistema está completo e pronto para uso! 🎉 