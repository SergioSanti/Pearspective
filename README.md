# 🎯 Pearspective - Sistema de Desenvolvimento Profissional

Um sistema moderno de desenvolvimento profissional com foco em cultura organizacional, oferecendo trilhas de carreira, cursos recomendados e ferramentas para planejar o crescimento profissional.

## ✨ **Características Principais**

- **Design System Moderno** com CSS custom properties
- **Interface Responsiva** para todos os dispositivos
- **Sistema de Autenticação** seguro
- **Catálogo de Cursos** com filtros avançados
- **Biblioteca de Recursos** com busca inteligente
- **Simulador de Cargos** interativo
- **Gestão de Certificados** completa


## 🛠️ **Tecnologias Utilizadas**

### Frontend
- **HTML5** semântico e acessível
- **CSS3** com design system moderno
- **JavaScript** vanilla para interatividade
- **Fonte Inter** para tipografia moderna

### Backend
- **Node.js** com Express
- **PostgreSQL** para banco de dados
- **Socket.IO** para comunicação em tempo real
- **Multer** para upload de arquivos

### IA e Processamento
- **Natural** para processamento de linguagem natural
- **Compromise** para análise de texto
- **Sentiment** para análise de sentimento

## 📦 **Versões das Dependências**

### Core
- Node.js 18+
- Express 4.21.2
- PostgreSQL 14+

### Frontend
- Fonte Inter (Google Fonts)
- CSS Custom Properties
- JavaScript ES6+

### Backend
- Express 4.21.2
- Socket.IO 4.7.2
- Natural 6.5.0

## 🚀 **Configuração do Ambiente**

### Pré-requisitos
- Node.js (versão 16 ou superior)
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
# Para desenvolvimento
npm run dev

# Para produção
npm start
```

O servidor estará rodando em `http://localhost:3000`

## 📁 **Estrutura do Projeto**

```
Perspective/
├── Page_inicial/          # Página inicial do sistema
│   ├── index.html        # Página principal
│   ├── index.css         # Estilos da página inicial
│   └── index.js          # JavaScript da página inicial
├── catalogo/              # Catálogo de cursos
│   ├── catalogo.html     # Página do catálogo
│   ├── catalogo.css      # Estilos do catálogo
│   └── cursos.js         # JavaScript do catálogo
├── biblioteca/            # Biblioteca de cursos
│   ├── biblioteca.html   # Página da biblioteca
│   ├── biblioteca.css    # Estilos da biblioteca
│   └── biblioteca.js     # JavaScript da biblioteca
├── simulador/             # Simulador de cargos
│   ├── simulador.html    # Página do simulador
│   ├── simulador.css     # Estilos do simulador
│   └── simulador.js      # JavaScript do simulador
├── historico/             # Histórico e certificados
│   ├── historico.html    # Página de certificados
│   └── certificados.css  # Estilos dos certificados
├── database/              # Backend e configuração do banco
│   ├── app.js            # Servidor Express com APIs
│   ├── init.sql          # Scripts de inicialização do banco
│   ├── database.js       # Configuração do PostgreSQL
│   └── package.json      # Dependências do backend
├── assets/               # Recursos e dados
│   ├── global-styles.css # Design system global
│   └── dados/            # Arquivos JSON de dados
├── login.html            # Página de login
├── login.css             # Estilos do login
├── login.js              # JavaScript do login
├── navbar.html           # Componente de navegação
├── navbar.css            # Estilos da navbar
├── navbar.js             # JavaScript da navbar
├── package.json          # Dependências principais
└── README.md             # Documentação
```

## 🤖 **Funcionalidades de IA**

### Recomendações Personalizadas
- Algoritmo baseado no perfil do usuário
- Análise de histórico de cursos
- Sugestões de trilhas de carreira
- Relevância calculada automaticamente

### Chatbot Inteligente
- Base de conhecimento integrada
- Respostas contextuais
- Suporte a múltiplos idiomas
- Interface conversacional moderna

### Análise de Sentimento
- Processamento de feedback dos usuários
- Métricas de satisfação


### Predição de Carreira
- Análise de habilidades atuais
- Sugestões de próximos passos
- Timeline de desenvolvimento
- Cursos recomendados



## 🎨 **Design System**

### Cores
- **Primary**: Azul (#0ea5e9)
- **Success**: Verde (#22c55e)
- **Warning**: Amarelo (#f59e0b)
- **Danger**: Vermelho (#ef4444)

### Componentes
- Cards responsivos
- Botões com estados
- Formulários modernos
- Navegação intuitiva

### Animações
- Transições suaves
- Micro-interações
- Loading states
- Feedback visual

## 🔒 **Segurança**

⚠️ **Importante**: Os seguintes arquivos contêm informações sensíveis e não devem ser commitados:

- `.env` - Variáveis de ambiente
- `database/database.js` - Configuração do banco de dados
- `node_modules/` - Dependências do Node.js

Estes arquivos já estão incluídos no `.gitignore`.

## 🛠️ **Desenvolvimento**

Para contribuir com o projeto:

1. Faça um fork do repositório
2. Crie uma branch para sua feature
3. Configure o ambiente seguindo os passos acima
4. Faça suas alterações
5. Teste localmente
6. Envie um pull request

### Scripts Disponíveis
```bash
npm start            # Inicia o servidor backend
npm run dev          # Inicia o servidor em modo desenvolvimento
npm test             # Executa os testes
```

## 📱 **Responsividade**

O sistema é totalmente responsivo e funciona em:
- Desktop (1200px+)
- Tablet (768px - 1199px)
- Mobile (320px - 767px)

## 🔮 **Roadmap Futuro**

### Fase 3 (Próximas versões)
- [ ] Integração com APIs externas (LinkedIn Learning, Coursera)
- [ ] Sistema de gamificação avançado
- [ ] Machine Learning para predições mais precisas
- [ ] App mobile nativo
- [ ] Integração com sistemas de RH
- [ ] Marketplace de cursos interno

## 📝 **Licença**

Este projeto está sob a licença MIT.

## 🤝 **Contribuição**

Contribuições são bem-vindas! Por favor, leia o guia de contribuição antes de enviar um pull request.

---

**Pearspective v2.0** - Transformando o desenvolvimento profissional com IA moderna.