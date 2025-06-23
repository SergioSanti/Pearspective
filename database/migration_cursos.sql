-- RECRIAÇÃO COMPLETA DA TABELA DE CURSOS
-- Este script irá apagar a tabela 'cursos' existente e recriá-la com a estrutura correta.
-- Todas as informações de cursos salvas anteriormente serão perdidas.
-- Você poderá adicionar os cursos novamente através do painel de administração.

-- 1. Apagar a tabela antiga para garantir um recomeço limpo
DROP TABLE IF EXISTS cursos CASCADE;
-- O CASCADE remove objetos dependentes, como chaves estrangeiras, o que é mais seguro.

-- 2. Criar a nova tabela 'cursos' com a estrutura correta
CREATE TABLE cursos (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    platform VARCHAR(100),
    description TEXT,
    area VARCHAR(50),
    level VARCHAR(50),
    duration VARCHAR(50),
    badge VARCHAR(50),
    badgeColor VARCHAR(20) DEFAULT 'primary',
    url TEXT,
    featured BOOLEAN DEFAULT false,
    "new" BOOLEAN DEFAULT false, -- "new" é uma palavra reservada, aspas são necessárias
    data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Inserir dados de exemplo para que a página não comece vazia
INSERT INTO cursos (title, platform, description, area, level, duration, badge, badgeColor, url, featured, "new") VALUES
(
  'Formação Front-end', 
  'Alura', 
  'Formação completa em desenvolvimento front-end com HTML, CSS, JavaScript e React. Inclui projetos práticos e certificado reconhecido.',
  'ti',
  'intermediario',
  'longo',
  'Frontend',
  'primary',
  'https://www.alura.com.br/formacao-front-end',
  true,
  false
),
(
  'Gestão de Pessoas',
  'Alura',
  'Desenvolva habilidades essenciais para liderar equipes de forma eficaz. Inclui técnicas de motivação, feedback e desenvolvimento de talentos.',
  'gestao',
  'intermediario',
  'medio',
  'Soft Skills',
  'success',
  'https://www.alura.com.br/cursos-online-gestao-pessoas',
  false,
  true
);

-- Fim do script. A tabela agora está pronta para ser usada pela API.
-- Nenhuma mensagem de 'echo' é necessária. Se o script rodar sem erros, a migração foi um sucesso. 