# 🎓 Sistema de Recomendações de Cursos - Pearspective

## 📋 Visão Geral

O sistema de recomendações de cursos foi transformado em uma plataforma completa de administração onde você pode gerenciar manualmente todos os cursos recomendados. Agora você tem controle total sobre quais cursos aparecem, suas informações e links diretos para as plataformas.

## ✨ Funcionalidades Principais

### 🔧 **Modo Administrador**
- **Botão Admin**: Clique no botão "🔧 Admin" no canto superior direito
- **Painel de Controle**: Acesso completo para gerenciar cursos
- **Formulário Completo**: Adicionar e editar todos os detalhes dos cursos

### ➕ **Adicionar Cursos**
1. Clique em "🔧 Admin" para ativar o modo administrador
2. Clique em "➕ Adicionar Curso"
3. Preencha todos os campos obrigatórios:
   - **Título do Curso**: Nome completo do curso
   - **Plataforma**: Selecione a plataforma (Alura, Udemy, Coursera, etc.)
   - **URL do Curso**: Link direto para o curso na plataforma
   - **Área**: Categoria do curso (TI, Gestão, Marketing, etc.)
   - **Nível**: Básico, Intermediário ou Avançado
   - **Duração**: Até 10h, 10h a 30h, ou Mais de 30h
   - **Categoria**: Badge personalizado (Frontend, DevOps, Marketing, etc.)
   - **Cor da Categoria**: Cor do badge (Azul, Verde, Amarelo, etc.)
   - **Descrição**: Descrição detalhada do curso
   - **Opções**: Marcar como "Curso em destaque" ou "Curso novo"

### ✏️ **Editar Cursos**
1. No modo admin, cada curso terá botões de ação
2. Clique no botão "✏️" para editar
3. Modifique qualquer informação
4. Clique em "💾 Salvar Curso"

### 🗑️ **Excluir Cursos**
1. No modo admin, clique no botão "🗑️" no curso
2. Confirme a exclusão no modal
3. O curso será removido permanentemente

### 🔍 **Sistema de Filtros**
- **Busca por texto**: Encontre cursos por título, descrição, plataforma ou categoria
- **Filtro por área**: Tecnologia, Gestão, Marketing, etc.
- **Filtro por nível**: Básico, Intermediário, Avançado
- **Filtro por duração**: Curto, Médio, Longo

## 🎨 **Recursos Visuais**

### 🏷️ **Badges de Certificado**
- Todos os cursos exibem o badge "🎓 Certificado"
- Destaque visual para cursos com certificados válidos

### ⭐ **Cursos em Destaque**
- Badge "⭐ Destaque" para cursos especiais
- Borda colorida para destacar

### 🆕 **Cursos Novos**
- Badge "🆕 Novo" para cursos recentes
- Borda verde para identificar

### 🎨 **Cores de Categoria**
- **Azul (Primary)**: Tecnologia, Frontend, Backend
- **Verde (Success)**: Soft Skills, Gestão
- **Amarelo (Warning)**: Marketing, Vendas
- **Vermelho (Danger)**: Urgente, Importante
- **Ciano (Info)**: Informações, Documentação

## 💾 **Armazenamento de Dados**

### 📱 **LocalStorage**
- Todos os dados são salvos no navegador
- Persistência entre sessões
- Backup automático dos cursos

### 🔄 **Sincronização**
- Dados carregados automaticamente ao abrir a página
- Alterações salvas instantaneamente
- Sem necessidade de servidor

## 🚀 **Como Usar**

### **Para Administradores:**
1. **Acesse a página**: `catalogo/catalogo.html`
2. **Ative o modo admin**: Clique em "🔧 Admin"
3. **Gerencie cursos**: Adicione, edite ou exclua conforme necessário
4. **Salve alterações**: Todas as mudanças são salvas automaticamente

### **Para Usuários:**
1. **Navegue pelos cursos**: Use os filtros para encontrar o que procura
2. **Clique nos links**: Direcionamento direto para as plataformas
3. **Visualize detalhes**: Informações completas sobre cada curso

## 🔗 **Plataformas Suportadas**

### ✅ **Plataformas com Certificados:**
- **Alura**: Cursos de tecnologia e soft skills
- **Udemy**: Cursos diversos com certificados
- **Coursera**: Cursos universitários certificados
- **edX**: Cursos de universidades renomadas
- **LinkedIn Learning**: Cursos profissionais
- **Pluralsight**: Cursos de tecnologia avançados

### ❌ **Plataformas Excluídas:**
- **YouTube**: Não oferece certificados válidos

## 📱 **Responsividade**

### **Desktop:**
- Layout em grid responsivo
- Painel admin completo
- Formulários otimizados

### **Mobile:**
- Layout adaptativo
- Botões touch-friendly
- Navegação simplificada

## 🎯 **Benefícios do Sistema**

### **Para Administradores:**
- ✅ Controle total sobre o conteúdo
- ✅ Interface intuitiva e fácil de usar
- ✅ Sem necessidade de conhecimento técnico
- ✅ Salvamento automático de dados
- ✅ Sistema de notificações

### **Para Usuários:**
- ✅ Cursos selecionados e verificados
- ✅ Links diretos para plataformas
- ✅ Filtros avançados de busca
- ✅ Informações completas sobre cada curso
- ✅ Design moderno e responsivo

## 🔧 **Tecnologias Utilizadas**

- **HTML5**: Estrutura semântica
- **CSS3**: Design moderno com variáveis CSS
- **JavaScript ES6+**: Funcionalidades avançadas
- **LocalStorage**: Persistência de dados
- **Intersection Observer**: Animações de entrada
- **FormData API**: Manipulação de formulários

## 📝 **Estrutura de Dados**

```javascript
{
  id: 1234567890,
  title: "Nome do Curso",
  platform: "Nome da Plataforma",
  description: "Descrição detalhada do curso...",
  area: "ti|gestao|marketing|financas|rh|juridico",
  level: "basico|intermediario|avancado",
  duration: "curto|medio|longo",
  badge: "Nome da Categoria",
  badgeColor: "primary|success|warning|danger|info",
  url: "https://link-para-o-curso.com",
  featured: true|false,
  new: true|false
}
```

## 🎉 **Pronto para Uso!**

O sistema está completamente funcional e pronto para uso. Você pode começar a adicionar seus cursos recomendados imediatamente. Todos os dados são salvos localmente e persistirão entre as sessões do navegador.

---

**Desenvolvido para o Pearspective** 🚀
*Transformando a forma como você gerencia recomendações de cursos* 