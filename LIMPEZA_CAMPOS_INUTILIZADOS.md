# 🧹 Limpeza de Campos Inutilizados do Banco de Dados

## 📋 Resumo

Este documento explica como remover campos inutilizados das tabelas do banco de dados para otimizar a estrutura e melhorar a performance.

## 🎯 Campos Identificados para Remoção

### **Tabela `cursos`**

#### ✅ **Campos UTILIZADOS (mantidos):**
- `id` - Chave primária
- `titulo` - Título do curso
- `plataforma` - Nome da plataforma
- `url_externa` - Link para o curso
- `categoria` - Categoria/área do curso
- `nivel` - Nível do curso
- `duracao` - Duração do curso
- `descricao` - Descrição do curso

#### ❌ **Campos INUTILIZADOS (removidos):**
- `instrutor` - Nome do instrutor
- `preco` - Preço do curso
- `avaliacao` - Avaliação/rating
- `estudantes` - Número de estudantes
- `imagem_url` - URL da imagem
- `tags` - Array de tags
- `ativo` - Status ativo/inativo
- `data_cadastro` - Data de cadastro

### **Tabela `certificados`**

#### ✅ **Campos UTILIZADOS (mantidos):**
- `id` - Chave primária
- `usuario_id` - ID do usuário
- `nome` - Nome do certificado
- `instituicao` - Instituição emissora
- `data_conclusao` - Data de conclusão
- `descricao` - Descrição do certificado

#### ❌ **Campos INUTILIZADOS (removidos):**
- `data_inicio` - Data de início
- `data_emissao` - Data de emissão
- `data_expiracao` - Data de expiração
- `status` - Status do certificado
- `nota` - Nota/avaliação
- `horas` - Horas de curso
- `categoria` - Categoria do certificado
- `pdf` - Arquivo PDF

### **Tabela `usuarios`**

#### ✅ **Campos UTILIZADOS (mantidos):**
- `id` - Chave primária
- `nome` - Nome do usuário
- `email` - Email do usuário
- `senha` - Senha do usuário
- `tipo_usuario` - Tipo de usuário
- `foto_perfil` - Foto do perfil

#### ❌ **Campos INUTILIZADOS (removidos):**
- `departamento` - Departamento do usuário
- `cargo_atual` - Cargo atual
- `curriculo` - Arquivo do currículo
- `curriculo_nome` - Nome do arquivo do currículo
- `data_cadastro` - Data de cadastro

### **Tabela `cargos`**

#### ✅ **Campos UTILIZADOS (mantidos):**
- `id` - Chave primária
- `nome_cargo` - Nome do cargo
- `area_id` - ID da área
- `requisitos` - Requisitos em JSON

#### ❌ **Campos INUTILIZADOS (removidos):**
- `quantidade_vagas` - Quantidade de vagas (se existir)

## 🚀 Como Executar a Limpeza

### **1. Banco Local (Docker)**

```powershell
# Execute o script PowerShell
.\scripts\limpar-campos-inutilizados.ps1
```

### **2. Banco Railway**

```powershell
# Execute o script PowerShell para Railway
.\scripts\limpar-railway.ps1
```

### **3. Execução Manual**

#### **Banco Local:**
```bash
# Conectar ao container Docker
docker exec -it pearspective_postgres psql -U postgres -d pearspective -f /docker-entrypoint-initdb.d/limpar-campos-inutilizados.sql
```

#### **Banco Railway:**
```bash
# Via Railway CLI
railway run psql < database/limpar-campos-inutilizados.sql
```

## 📊 Estrutura Final Otimizada

### **Tabela `cursos`:**
```sql
CREATE TABLE cursos (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(200) NOT NULL,
    plataforma VARCHAR(100),
    categoria VARCHAR(100),
    nivel VARCHAR(50),
    duracao VARCHAR(50),
    descricao TEXT,
    url_externa TEXT
);
```

### **Tabela `certificados`:**
```sql
CREATE TABLE certificados (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id),
    nome VARCHAR(200) NOT NULL,
    instituicao VARCHAR(200) NOT NULL,
    data_conclusao DATE NOT NULL,
    descricao TEXT
);
```

### **Tabela `usuarios`:**
```sql
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL,
    tipo_usuario VARCHAR(50) DEFAULT 'usuario',
    foto_perfil TEXT
);
```

### **Tabela `cargos`:**
```sql
CREATE TABLE cargos (
    id SERIAL PRIMARY KEY,
    nome_cargo VARCHAR(100) NOT NULL,
    area_id INTEGER REFERENCES areas(id),
    requisitos JSONB NOT NULL
);
```

## ✅ Benefícios da Limpeza

### **Performance:**
- ✅ Menos dados para processar
- ✅ Queries mais rápidas
- ✅ Menos espaço em disco
- ✅ Backup mais rápido

### **Manutenibilidade:**
- ✅ Código mais limpo
- ✅ Menos confusão sobre campos
- ✅ Estrutura mais simples
- ✅ Menos bugs potenciais

### **Compatibilidade:**
- ✅ Backend já otimizado
- ✅ Frontend não afetado
- ✅ Funcionalidades mantidas
- ✅ Dados preservados

## 🔍 Verificação

Após a limpeza, você pode verificar a estrutura das tabelas:

```sql
-- Verificar estrutura da tabela cursos
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'cursos' 
ORDER BY ordinal_position;

-- Verificar estrutura da tabela certificados
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'certificados' 
ORDER BY ordinal_position;

-- Verificar estrutura da tabela usuarios
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'usuarios' 
ORDER BY ordinal_position;

-- Verificar estrutura da tabela cargos
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'cargos' 
ORDER BY ordinal_position;
```

## ⚠️ Importante

- **Backup**: Sempre faça backup antes de executar a limpeza
- **Teste**: Teste em ambiente de desenvolvimento primeiro
- **Railway**: Execute tanto no banco local quanto no Railway
- **Verificação**: Confirme que todas as funcionalidades continuam funcionando

## 🎯 Resultado Final

Após a limpeza, seu banco de dados terá:
- ✅ Estrutura otimizada
- ✅ Apenas campos necessários
- ✅ Melhor performance
- ✅ Código mais limpo
- ✅ Manutenção mais fácil

**Quer executar a limpeza agora? Use os scripts PowerShell fornecidos!** 