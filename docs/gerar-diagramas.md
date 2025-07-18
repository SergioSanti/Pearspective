# 🎨 Como Gerar Diagramas da Arquitetura

## 📋 Diagramas Disponíveis

### 1. **Arquitetura Geral** (`01-arquitetura-geral.puml`)
- Visão geral do sistema
- Componentes principais
- Conexões entre camadas

### 2. **Fluxo de Dados** (`02-fluxo-dados.puml`)
- Sequência de interações
- Autenticação e navegação
- Upload e atualizações

### 3. **Banco de Dados** (`03-banco-dados.puml`)
- Modelo de dados
- Tabelas e relacionamentos
- Estrutura completa

### 4. **Componentes** (`04-componentes.puml`)
- Serviços e repositórios
- Camadas de abstração
- Infraestrutura

---

## 🛠️ Métodos para Gerar

### **Método 1: PlantUML Online (Mais Fácil)**

1. **Acesse:** https://www.plantuml.com/plantuml/uml/
2. **Abra o arquivo:** `docs/diagramas/XX-nome.puml`
3. **Copie o conteúdo** (sem as marcações @startuml/@enduml)
4. **Cole no editor** online
5. **Clique em "Submit"**
6. **Salve a imagem** (PNG/SVG)

### **Método 2: VS Code Extension**

1. **Instale a extensão:** "PlantUML" (jebbs.plantuml)
2. **Abra o arquivo:** `.puml`
3. **Pressione:** `Alt+Shift+D` para preview
4. **Exporte:** Clique com botão direito → "Export Current File"

### **Método 3: Mermaid Live Editor**

1. **Acesse:** https://mermaid.live/
2. **Use os códigos Mermaid** da documentação principal
3. **Visualize em tempo real**
4. **Exporte como PNG/SVG**

### **Método 4: Draw.io (Manual)**

1. **Acesse:** https://app.diagrams.net/
2. **Crie novo diagrama**
3. **Use as formas** para recriar
4. **Exporte como PNG/PDF**

---

## 📁 Estrutura de Arquivos

```
docs/
├── arquitetura-projeto.md          # Documentação completa
├── gerar-diagramas.md             # Este guia
└── diagramas/
    ├── 01-arquitetura-geral.puml  # Arquitetura geral
    ├── 02-fluxo-dados.puml        # Fluxo de dados
    ├── 03-banco-dados.puml        # Banco de dados
    └── 04-componentes.puml        # Componentes
```

---

## 🎯 Passo a Passo Rápido

### **Para PlantUML Online:**

1. **Escolha o diagrama:**
   - `01-arquitetura-geral.puml` - Visão geral
   - `02-fluxo-dados.puml` - Interações
   - `03-banco-dados.puml` - Dados
   - `04-componentes.puml` - Serviços

2. **Copie o conteúdo** (linhas entre @startuml e @enduml)

3. **Cole no editor:** https://www.plantuml.com/plantuml/uml/

4. **Clique em "Submit"**

5. **Salve a imagem**

---

## 🔧 Configurações Recomendadas

### **PlantUML Online:**
- **Format:** PNG (alta qualidade)
- **Theme:** Plain (limpo)
- **Background:** #f5f5f5 (cinza claro)

### **VS Code:**
- **Extension:** PlantUML
- **Shortcut:** Alt+Shift+D
- **Export:** PNG/SVG

### **Mermaid:**
- **Theme:** Default
- **Background:** White
- **Export:** PNG/SVG

---

## 📊 Exemplos de Uso

### **Para Documentação:**
- Use **PNG** para documentos
- Use **SVG** para web
- Use **PDF** para impressão

### **Para Apresentações:**
- Use **PNG** com alta resolução
- Mantenha proporção 16:9
- Use fundo transparente

### **Para Desenvolvimento:**
- Use **SVG** para versionamento
- Mantenha arquivos `.puml` no projeto
- Atualize quando houver mudanças

---

## 🚀 Dicas

1. **Mantenha os arquivos `.puml`** no projeto para versionamento
2. **Use nomes descritivos** para os diagramas
3. **Atualize quando** houver mudanças na arquitetura
4. **Documente as mudanças** junto com os diagramas
5. **Use cores consistentes** em todos os diagramas

---

## 📞 Suporte

Se tiver problemas:

1. **Verifique a sintaxe** do PlantUML
2. **Teste no editor online** primeiro
3. **Consulte a documentação** do PlantUML
4. **Use o Mermaid** como alternativa

---

## 🎨 Personalização

### **Cores do Tema:**
```plantuml
!theme plain
skinparam backgroundColor #f5f5f5
skinparam componentStyle rectangle
```

### **Estilos Personalizados:**
```plantuml
skinparam component {
  BackgroundColor #ffffff
  BorderColor #333333
  FontColor #000000
}
```

### **Tamanhos:**
```plantuml
skinparam maxMessageSize 150
skinparam maxTextSize 150
``` 