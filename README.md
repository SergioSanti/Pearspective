# Pearspective

Sistema de simulação de cargos e trilhas de aprendizado.

## 🚀 Configuração do Ambiente

### Pré-requisitos
- Node.js (versão 14 ou superior)
- PostgreSQL
- npm ou yarn

### 1. Clone o repositório
```bash
git clone <url-do-repositorio>
cd Perspective
```

### 2. Configure as variáveis de ambiente
```bash
# Copie o arquivo de exemplo
cp env.example .env

# Edite o arquivo .env com suas configurações
nano .env
```

### 3. Configure o banco de dados
```bash
# Copie o arquivo de exemplo da configuração do banco
cp database/database.example.js database/database.js

# Edite o arquivo database/database.js com suas credenciais
nano database/database.js
```

### 4. Instale as dependências
```bash
# Dependências do projeto principal
npm install

# Dependências do backend
cd database
npm install
cd ..
```

### 5. Configure o banco de dados PostgreSQL
```sql
-- Execute os scripts SQL para criar as tabelas
-- Use o arquivo database/init.sql ou database/fix.sql
```

### 6. Inicie o servidor
```bash
cd database
node app.js
```

O servidor estará rodando em `http://localhost:3000`

## 📁 Estrutura do Projeto

```
Perspective/
├── assets/           # Arquivos de dados (JSON)
├── database/         # Backend e configuração do banco
├── biblioteca/       # Módulo de biblioteca
├── catalogo/         # Módulo de catálogo de cursos
├── historico/        # Módulo de histórico e certificados
├── simulador/        # Módulo de simulação de cargos
├── Page_inicial/     # Página inicial
└── ...
```

## 🔒 Segurança

⚠️ **Importante**: Os seguintes arquivos contêm informações sensíveis e não devem ser commitados:

- `.env` - Variáveis de ambiente
- `database/database.js` - Configuração do banco de dados
- `node_modules/` - Dependências do Node.js

Estes arquivos já estão incluídos no `.gitignore`.

## 🛠️ Desenvolvimento

Para contribuir com o projeto:

1. Faça um fork do repositório
2. Crie uma branch para sua feature
3. Configure o ambiente seguindo os passos acima
4. Faça suas alterações
5. Teste localmente
6. Envie um pull request

## 📝 Licença

Este projeto está sob a licença MIT.