# Diagrama Simples - Pearspective

## Arquitetura Geral

```mermaid
graph TB
    subgraph "Frontend"
        A[HTML/CSS/JS]
        B[Navbar]
        C[Páginas: Login, Perfil, Biblioteca, etc.]
    end
    
    subgraph "Backend (Railway)"
        D[Node.js + Express]
        E[API Routes]
        F[Autenticação JWT]
    end
    
    subgraph "Banco de Dados (Railway)"
        G[PostgreSQL]
        H[Usuários]
        I[Certificados]
        J[Currículos]
    end
    
    A --> D
    B --> D
    C --> D
    D --> G
    E --> G
    F --> G
```

## Fluxo Principal

```mermaid
sequenceDiagram
    participant U as Usuário
    participant F as Frontend
    participant B as Backend
    participant DB as Database
    
    U->>F: Acessa sistema
    F->>B: Login
    B->>DB: Verifica credenciais
    DB-->>B: Dados do usuário
    B-->>F: Token JWT
    F->>B: Requisições autenticadas
    B->>DB: Consultas/Updates
    DB-->>B: Resultados
    B-->>F: Respostas
    F-->>U: Interface atualizada
```

## Tecnologias

- **Frontend**: HTML5, CSS3, JavaScript ES6+
- **Backend**: Node.js, Express.js
- **Banco**: PostgreSQL (Railway)
- **Deploy**: Railway
- **Autenticação**: JWT
- **Segurança**: HTTPS/SSL

## Como Gerar Imagens

1. **Mermaid Live Editor**: https://mermaid.live
2. **VS Code**: Instalar extensão "Mermaid Preview"
3. **Online**: Copiar código entre ```mermaid e colar no editor

## Estrutura de Arquivos

```
Perspective/
├── api/           # Backend API
├── assets/        # CSS, JS, imagens
├── database/      # Configurações DB
├── docs/          # Documentação
├── scripts/       # Scripts de deploy
└── *.html         # Páginas frontend
``` 