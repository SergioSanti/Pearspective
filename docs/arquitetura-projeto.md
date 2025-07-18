# 🏗️ Arquitetura do Projeto Pearspective

## 📋 Visão Geral

O Pearspective é um sistema de desenvolvimento profissional com arquitetura **Full-Stack** baseada em **Node.js** e **PostgreSQL**, hospedado no **Railway**.

---

## 🏛️ Diagrama de Arquitetura Geral

### PlantUML
```plantuml
@startuml arquitetura-geral
!theme plain
skinparam backgroundColor #f5f5f5
skinparam componentStyle rectangle

package "Frontend (Cliente)" {
  [Páginas HTML] as HTML
  [CSS Estilos] as CSS
  [JavaScript ES6+] as JS
  [Dark Mode] as DM
}

package "Backend (Servidor)" {
  [Express.js] as EXPRESS
  [Node.js Runtime] as NODE
  [JWT Authentication] as JWT
  [Multer Upload] as MULTER
  [bcrypt Security] as BCRYPT
}

package "Banco de Dados" {
  database "PostgreSQL" as DB
  [Tabela: usuarios] as USERS
  [Tabela: areas] as AREAS
  [Tabela: cargos] as CARGOS
  [Tabela: certificados] as CERTS
  [Tabela: curriculos] as CURR
}

package "Infraestrutura" {
  [Railway Platform] as RAILWAY
  [SSL/TLS] as SSL
  [Docker Container] as DOCKER
}

package "APIs Externas" {
  [File Upload] as UPLOAD
  [Session Management] as SESSION
}

' Conexões
HTML --> EXPRESS : HTTP/HTTPS
CSS --> HTML : Estilos
JS --> EXPRESS : AJAX/Fetch
DM --> JS : Theme Toggle

EXPRESS --> NODE : Runtime
JWT --> EXPRESS : Auth Middleware
MULTER --> EXPRESS : File Handling
BCRYPT --> EXPRESS : Password Hash

EXPRESS --> DB : Connection Pool
DB --> USERS : CRUD
DB --> AREAS : CRUD
DB --> CARGOS : CRUD
DB --> CERTS : CRUD
DB --> CURR : Binary Storage

RAILWAY --> DOCKER : Containerization
DOCKER --> NODE : Runtime
SSL --> RAILWAY : Security
UPLOAD --> MULTER : File Processing
SESSION --> JWT : Token Management

@enduml
```

### Mermaid
```mermaid
graph TB
    subgraph "Frontend (Cliente)"
        HTML[Páginas HTML]
        CSS[CSS Estilos]
        JS[JavaScript ES6+]
        DM[Dark Mode]
    end
    
    subgraph "Backend (Servidor)"
        EXPRESS[Express.js]
        NODE[Node.js Runtime]
        JWT[JWT Authentication]
        MULTER[Multer Upload]
        BCRYPT[bcrypt Security]
    end
    
    subgraph "Banco de Dados"
        DB[(PostgreSQL)]
        USERS[Tabela: usuarios]
        AREAS[Tabela: areas]
        CARGOS[Tabela: cargos]
        CERTS[Tabela: certificados]
        CURR[Tabela: curriculos]
    end
    
    subgraph "Infraestrutura"
        RAILWAY[Railway Platform]
        SSL[SSL/TLS]
        DOCKER[Docker Container]
    end
    
    HTML --> EXPRESS
    CSS --> HTML
    JS --> EXPRESS
    DM --> JS
    
    EXPRESS --> NODE
    JWT --> EXPRESS
    MULTER --> EXPRESS
    BCRYPT --> EXPRESS
    
    EXPRESS --> DB
    DB --> USERS
    DB --> AREAS
    DB --> CARGOS
    DB --> CERTS
    DB --> CURR
    
    RAILWAY --> DOCKER
    DOCKER --> NODE
    SSL --> RAILWAY
```

---

## 🔄 Diagrama de Fluxo de Dados

### PlantUML
```plantuml
@startuml fluxo-dados
!theme plain
skinparam backgroundColor #f5f5f5

actor "Usuário" as USER
participant "Frontend" as FE
participant "Express.js" as API
participant "JWT Auth" as AUTH
participant "PostgreSQL" as DB
participant "Railway" as INFRA

== Autenticação ==
USER -> FE: Acessa sistema
FE -> API: GET /api/me
API -> AUTH: Verifica token
AUTH -> API: Token válido
API -> FE: Dados do usuário
FE -> USER: Página carregada

== Navegação ==
USER -> FE: Navega para perfil
FE -> API: GET /api/users/profile/:username
API -> DB: SELECT usuarios
DB -> API: Dados do usuário
API -> FE: Perfil completo
FE -> USER: Perfil exibido

== Upload de Arquivo ==
USER -> FE: Faz upload
FE -> API: POST /api/users/curriculum/:username
API -> AUTH: Verifica permissão
AUTH -> API: Permissão OK
API -> DB: INSERT curriculos
DB -> API: Arquivo salvo
API -> FE: Upload confirmado
FE -> USER: Sucesso

== Atualização de Perfil ==
USER -> FE: Edita perfil
FE -> API: PUT /api/users/profile/:username
API -> AUTH: Verifica token
AUTH -> API: Token válido
API -> DB: UPDATE usuarios
DB -> API: Dados atualizados
API -> FE: Perfil atualizado
FE -> USER: Confirmação

@enduml
```

### Mermaid
```mermaid
sequenceDiagram
    participant U as Usuário
    participant F as Frontend
    participant A as Express.js
    participant J as JWT Auth
    participant D as PostgreSQL
    participant R as Railway

    Note over U,R: Autenticação
    U->>F: Acessa sistema
    F->>A: GET /api/me
    A->>J: Verifica token
    J->>A: Token válido
    A->>F: Dados do usuário
    F->>U: Página carregada

    Note over U,R: Navegação
    U->>F: Navega para perfil
    F->>A: GET /api/users/profile/:username
    A->>D: SELECT usuarios
    D->>A: Dados do usuário
    A->>F: Perfil completo
    F->>U: Perfil exibido

    Note over U,R: Upload de Arquivo
    U->>F: Faz upload
    F->>A: POST /api/users/curriculum/:username
    A->>J: Verifica permissão
    J->>A: Permissão OK
    A->>D: INSERT curriculos
    D->>A: Arquivo salvo
    A->>F: Upload confirmado
    F->>U: Sucesso

    Note over U,R: Atualização de Perfil
    U->>F: Edita perfil
    F->>A: PUT /api/users/profile/:username
    A->>J: Verifica token
    J->>A: Token válido
    A->>D: UPDATE usuarios
    D->>A: Dados atualizados
    A->>F: Perfil atualizado
    F->>U: Confirmação
```

---

## 🗄️ Diagrama do Banco de Dados

### PlantUML
```plantuml
@startuml banco-dados
!theme plain
skinparam backgroundColor #f5f5f5

entity "usuarios" {
  * id : SERIAL
  --
  * nome : VARCHAR(100)
  * email : VARCHAR(255)
  * senha : VARCHAR(255)
  tipo_usuario : VARCHAR(50)
  foto_perfil : TEXT
  departamento : VARCHAR(100)
  cargo_atual : VARCHAR(100)
  nome_exibicao : VARCHAR(100)
  data_cadastro : TIMESTAMP
}

entity "areas" {
  * id : SERIAL
  --
  * nome : VARCHAR(100)
  descricao : TEXT
  data_criacao : TIMESTAMP
}

entity "cargos" {
  * id : SERIAL
  --
  * nome_cargo : VARCHAR(100)
  * area_id : INTEGER
  requisitos : TEXT
  data_criacao : TIMESTAMP
}

entity "certificados" {
  * id : SERIAL
  --
  * usuario_id : INTEGER
  * nome : VARCHAR(200)
  emissor : VARCHAR(200)
  data_emissao : DATE
  data_validade : DATE
  arquivo : TEXT
  data_upload : TIMESTAMP
}

entity "curriculos" {
  * id : SERIAL
  --
  * usuario_nome : VARCHAR(100)
  * nome_arquivo : VARCHAR(255)
  * tipo_mime : VARCHAR(100)
  * tamanho : INTEGER
  * dados : BYTEA
  data_upload : TIMESTAMP
}

' Relacionamentos
usuarios ||--o{ certificados : possui
usuarios ||--o{ curriculos : possui
areas ||--o{ cargos : contém
cargos }o--|| areas : pertence_a

@enduml
```

### Mermaid
```mermaid
erDiagram
    usuarios {
        int id PK
        varchar nome UK
        varchar email UK
        varchar senha
        varchar tipo_usuario
        text foto_perfil
        varchar departamento
        varchar cargo_atual
        varchar nome_exibicao
        timestamp data_cadastro
    }
    
    areas {
        int id PK
        varchar nome
        text descricao
        timestamp data_criacao
    }
    
    cargos {
        int id PK
        varchar nome_cargo
        int area_id FK
        text requisitos
        timestamp data_criacao
    }
    
    certificados {
        int id PK
        int usuario_id FK
        varchar nome
        varchar emissor
        date data_emissao
        date data_validade
        text arquivo
        timestamp data_upload
    }
    
    curriculos {
        int id PK
        varchar usuario_nome FK
        varchar nome_arquivo
        varchar tipo_mime
        int tamanho
        bytea dados
        timestamp data_upload
    }
    
    usuarios ||--o{ certificados : possui
    usuarios ||--o{ curriculos : possui
    areas ||--o{ cargos : contém
    cargos }o--|| areas : pertence_a
```

---

## 🏢 Diagrama de Componentes

### PlantUML
```plantuml
@startuml componentes
!theme plain
skinparam backgroundColor #f5f5f5

package "Frontend Components" {
  [Navbar] as NAV
  [Profile Page] as PROFILE
  [Login Page] as LOGIN
  [Catalog Page] as CATALOG
  [Library Page] as LIBRARY
  [Simulator] as SIM
}

package "Backend Services" {
  [Auth Service] as AUTH_SVC
  [User Service] as USER_SVC
  [File Service] as FILE_SVC
  [Area Service] as AREA_SVC
  [Position Service] as POS_SVC
}

package "Database Layer" {
  [User Repository] as USER_REPO
  [File Repository] as FILE_REPO
  [Area Repository] as AREA_REPO
  [Position Repository] as POS_REPO
}

package "Infrastructure" {
  [Railway Hosting] as HOST
  [PostgreSQL DB] as DB
  [SSL Certificate] as SSL
  [Docker Container] as DOCKER
}

' Conexões
NAV --> AUTH_SVC : Session Check
PROFILE --> USER_SVC : CRUD Operations
LOGIN --> AUTH_SVC : Authentication
CATALOG --> AREA_SVC : List Areas
LIBRARY --> FILE_SVC : File Management
SIM --> POS_SVC : Position Data

AUTH_SVC --> USER_REPO : User Data
USER_SVC --> USER_REPO : User Operations
FILE_SVC --> FILE_REPO : File Storage
AREA_SVC --> AREA_REPO : Area Data
POS_SVC --> POS_REPO : Position Data

USER_REPO --> DB : SQL Queries
FILE_REPO --> DB : Binary Storage
AREA_REPO --> DB : Area Queries
POS_REPO --> DB : Position Queries

HOST --> DOCKER : Containerization
DOCKER --> DB : Database Connection
SSL --> HOST : Security Layer

@enduml
```

### Mermaid
```mermaid
graph TB
    subgraph "Frontend Components"
        NAV[Navbar]
        PROFILE[Profile Page]
        LOGIN[Login Page]
        CATALOG[Catalog Page]
        LIBRARY[Library Page]
        SIM[Simulator]
    end
    
    subgraph "Backend Services"
        AUTH_SVC[Auth Service]
        USER_SVC[User Service]
        FILE_SVC[File Service]
        AREA_SVC[Area Service]
        POS_SVC[Position Service]
    end
    
    subgraph "Database Layer"
        USER_REPO[User Repository]
        FILE_REPO[File Repository]
        AREA_REPO[Area Repository]
        POS_REPO[Position Repository]
    end
    
    subgraph "Infrastructure"
        HOST[Railway Hosting]
        DB[(PostgreSQL DB)]
        SSL[SSL Certificate]
        DOCKER[Docker Container]
    end
    
    NAV --> AUTH_SVC
    PROFILE --> USER_SVC
    LOGIN --> AUTH_SVC
    CATALOG --> AREA_SVC
    LIBRARY --> FILE_SVC
    SIM --> POS_SVC
    
    AUTH_SVC --> USER_REPO
    USER_SVC --> USER_REPO
    FILE_SVC --> FILE_REPO
    AREA_SVC --> AREA_REPO
    POS_SVC --> POS_REPO
    
    USER_REPO --> DB
    FILE_REPO --> DB
    AREA_REPO --> DB
    POS_REPO --> DB
    
    HOST --> DOCKER
    DOCKER --> DB
    SSL --> HOST
```

---

## 🛠️ Como Gerar os Diagramas

### **Opção 1: PlantUML Online**
1. Acesse: https://www.plantuml.com/plantuml/uml/
2. Cole o código PlantUML
3. Clique em "Submit"
4. Salve a imagem

### **Opção 2: VS Code Extension**
1. Instale a extensão "PlantUML"
2. Crie arquivo `.puml`
3. Cole o código
4. Pressione `Alt+Shift+D` para preview

### **Opção 3: Mermaid Live Editor**
1. Acesse: https://mermaid.live/
2. Cole o código Mermaid
3. Visualize em tempo real
4. Exporte como PNG/SVG

### **Opção 4: Draw.io**
1. Acesse: https://app.diagrams.net/
2. Crie novo diagrama
3. Use as formas para recriar
4. Exporte como PNG/PDF

---

## 📊 Tecnologias Utilizadas

| Camada | Tecnologia | Versão | Propósito |
|--------|------------|--------|-----------|
| **Frontend** | HTML5 | - | Estrutura |
| **Frontend** | CSS3 | - | Estilização |
| **Frontend** | JavaScript | ES6+ | Interatividade |
| **Backend** | Node.js | 18+ | Runtime |
| **Backend** | Express.js | 4.18+ | Framework |
| **Backend** | JWT | 9.0+ | Autenticação |
| **Backend** | bcrypt | 5.1+ | Criptografia |
| **Backend** | Multer | 1.4+ | Upload de arquivos |
| **Database** | PostgreSQL | 14+ | Banco de dados |
| **Database** | pg | 8.11+ | Driver Node.js |
| **Infra** | Railway | - | Hospedagem |
| **Infra** | Docker | - | Containerização |
| **Infra** | SSL/TLS | - | Segurança |

---

## 🔒 Segurança

- **JWT Tokens** para autenticação
- **bcrypt** para hash de senhas
- **SSL/TLS** para comunicação segura
- **Validação de entrada** em todas as APIs
- **Sanitização de dados** antes do banco
- **CORS** configurado adequadamente

---

## 🚀 Performance

- **Connection Pool** para PostgreSQL
- **Static File Serving** otimizado
- **Compression** de respostas
- **Caching** de dados estáticos
- **Lazy Loading** de componentes
- **Minificação** de assets

---

## 📈 Escalabilidade

- **Arquitetura modular** para fácil expansão
- **Separação de responsabilidades**
- **APIs RESTful** bem definidas
- **Containerização** para deploy consistente
- **Banco de dados** normalizado
- **Logs estruturados** para monitoramento 