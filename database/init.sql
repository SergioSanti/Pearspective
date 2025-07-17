-- Criar tabela de áreas
CREATE TABLE IF NOT EXISTS areas (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL
);

-- Criar tabela de cargos
CREATE TABLE IF NOT EXISTS cargos (
    id SERIAL PRIMARY KEY,
    nome_cargo VARCHAR(100) NOT NULL,
    area_id INTEGER REFERENCES areas(id),
    requisitos JSONB NOT NULL
);

-- Criar tabela de usuários
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL,
    tipo_usuario VARCHAR(50) DEFAULT 'usuario',
    departamento VARCHAR(100),
    cargo_atual VARCHAR(100),
    foto_perfil TEXT,
    curriculo BYTEA,
    curriculo_nome VARCHAR(255),
    data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Criar tabela de certificados
CREATE TABLE IF NOT EXISTS certificados (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id),
    nome VARCHAR(200) NOT NULL,
    instituicao VARCHAR(200) NOT NULL,
    data_inicio DATE NOT NULL,
    data_conclusao DATE NOT NULL,
    data_emissao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_expiracao DATE,
    status VARCHAR(50) DEFAULT 'completed',
    nota INTEGER,
    horas INTEGER,
    categoria VARCHAR(100),
    pdf BYTEA,
    descricao TEXT
);

-- Criar tabela de cursos
CREATE TABLE IF NOT EXISTS cursos (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(200) NOT NULL,
    instrutor VARCHAR(100),
    plataforma VARCHAR(100),
    categoria VARCHAR(100),
    nivel VARCHAR(50),
    duracao VARCHAR(50),
    preco DECIMAL(10,2),
    avaliacao DECIMAL(3,2),
    estudantes INTEGER DEFAULT 0,
    imagem_url TEXT,
    descricao TEXT,
    url_externa TEXT,
    tags TEXT[],
    ativo BOOLEAN DEFAULT true,
    data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Criar tabela de recursos da biblioteca
CREATE TABLE IF NOT EXISTS recursos (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(200) NOT NULL,
    autor VARCHAR(100),
    tipo VARCHAR(50), -- 'document', 'video', 'audio'
    categoria VARCHAR(100),
    descricao TEXT,
    tamanho VARCHAR(50),
    duracao VARCHAR(50),
    url_download TEXT,
    url_visualizacao TEXT,
    tags TEXT[],
    downloads INTEGER DEFAULT 0,
    visualizacoes INTEGER DEFAULT 0,
    ativo BOOLEAN DEFAULT true,
    data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Criar tabela de progresso do usuário
CREATE TABLE IF NOT EXISTS progresso_usuario (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id),
    curso_id INTEGER REFERENCES cursos(id),
    status VARCHAR(50) DEFAULT 'em_andamento', -- 'em_andamento', 'concluido', 'pausado'
    progresso_percentual INTEGER DEFAULT 0,
    horas_estudadas INTEGER DEFAULT 0,
    data_inicio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_conclusao TIMESTAMP,
    ultima_atividade TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Criar tabela de atividades do usuário
CREATE TABLE IF NOT EXISTS atividades_usuario (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id),
    tipo VARCHAR(50), -- 'curso_concluido', 'certificado_obtido', 'meta_atingida'
    titulo VARCHAR(200),
    descricao TEXT,
    data_atividade TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    dados_extras JSONB
);



-- Criar tabela de recomendações de IA
CREATE TABLE IF NOT EXISTS recomendacoes_ia (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id),
    curso_id INTEGER REFERENCES cursos(id),
    relevancia INTEGER,
    razao TEXT,
    categoria VARCHAR(100),
    data_recomendacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    visualizada BOOLEAN DEFAULT false,
    aceita BOOLEAN DEFAULT false
);

-- Criar tabela de conversas do chatbot
CREATE TABLE IF NOT EXISTS conversas_chatbot (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id),
    mensagem_usuario TEXT,
    resposta_bot TEXT,
    sentimento VARCHAR(50),
    score_sentimento INTEGER,
    data_conversa TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);



-- Inserir dados iniciais

-- Inserir áreas
INSERT INTO areas (nome) VALUES
    ('Tecnologia'),
    ('Administração'),
    ('Recursos Humanos'),
    ('Marketing'),
    ('Vendas'),
    ('Financeiro')
ON CONFLICT (id) DO NOTHING;

-- Inserir cargos
INSERT INTO cargos (nome_cargo, area_id, requisitos) VALUES
    (
        'Desenvolvedor Frontend',
        1,
        '{
            "experiencia": "2+ anos de experiência",
            "formacao": "Graduação em Ciência da Computação ou áreas afins",
            "idiomas": "Inglês intermediário",
            "habilidades": "HTML, CSS, JavaScript, React",
            "soft_skills": "Trabalho em equipe, comunicação efetiva"
        }'::jsonb
    ),
    (
        'Desenvolvedor Backend',
        1,
        '{
            "experiencia": "3+ anos de experiência",
            "formacao": "Graduação em Ciência da Computação ou áreas afins",
            "idiomas": "Inglês avançado",
            "habilidades": "Node.js, SQL, APIs REST",
            "soft_skills": "Resolução de problemas, liderança técnica"
        }'::jsonb
    ),
    (
        'Analista de RH',
        3,
        '{
            "experiencia": "2+ anos em RH",
            "formacao": "Graduação em Administração, Psicologia ou áreas afins",
            "idiomas": "Inglês básico",
            "habilidades": "Gestão de pessoas, recrutamento e seleção",
            "soft_skills": "Empatia, comunicação clara, confidencialidade"
        }'::jsonb
    ),
    (
        'Assistente Administrativo',
        2,
        '{
            "experiencia": "1+ ano em funções administrativas",
            "formacao": "Ensino Médio completo, cursos técnicos na área",
            "idiomas": "Não requerido",
            "habilidades": "Pacote Office, gestão de documentos",
            "soft_skills": "Organização, proatividade, atendimento ao cliente"
        }'::jsonb
    ),
    (
        'Analista de Marketing',
        4,
        '{
            "experiencia": "2+ anos em marketing",
            "formacao": "Graduação em Marketing, Publicidade ou áreas afins",
            "idiomas": "Inglês intermediário",
            "habilidades": "Marketing Digital, Google Ads, Facebook Ads",
            "soft_skills": "Criatividade, análise de dados, comunicação"
        }'::jsonb
    ),
    (
        'Representante de Vendas',
        5,
        '{
            "experiencia": "1+ ano em vendas",
            "formacao": "Ensino Médio completo",
            "idiomas": "Não requerido",
            "habilidades": "Técnicas de vendas, CRM, negociação",
            "soft_skills": "Persuasão, resiliência, relacionamento com cliente"
        }'::jsonb
    )
ON CONFLICT (id) DO NOTHING;

-- Inserir usuário administrador principal
INSERT INTO usuarios (nome, email, senha, tipo_usuario, departamento, cargo_atual) VALUES
    ('admin', 'admin@pearspective.com', 'Admin123', 'admin', 'TI', 'Administrador do Sistema')
ON CONFLICT (email) DO NOTHING;

-- Inserir usuário de teste
INSERT INTO usuarios (nome, email, senha, tipo_usuario, departamento, cargo_atual) VALUES
    ('sergio', 'sergio@pearspective.com', '12345', 'usuario', 'Tecnologia', 'Desenvolvedor Frontend')
ON CONFLICT (email) DO NOTHING;

-- Inserir cursos de exemplo
INSERT INTO cursos (titulo, instrutor, plataforma, categoria, nivel, duracao, preco, avaliacao, estudantes, descricao, tags) VALUES
    ('React Avançado: Hooks e Context API', 'João Silva', 'Alura', 'frontend', 'advanced', '8h', 89.90, 4.8, 1247, 'Aprenda React avançado com Hooks, Context API e padrões modernos de desenvolvimento.', ARRAY['React', 'Hooks', 'JavaScript', 'Frontend']),
    ('Node.js e Express: APIs RESTful', 'Maria Santos', 'Udemy', 'backend', 'intermediate', '12h', 67.90, 4.6, 2156, 'Desenvolva APIs RESTful robustas com Node.js, Express e MongoDB.', ARRAY['Node.js', 'Express', 'APIs', 'Backend']),
    ('Docker e Kubernetes para DevOps', 'Carlos Oliveira', 'Coursera', 'devops', 'advanced', '15h', 129.90, 4.9, 892, 'Domine containerização e orquestração com Docker e Kubernetes.', ARRAY['Docker', 'Kubernetes', 'DevOps', 'Containers']),
    ('Liderança e Gestão de Equipes', 'Ana Costa', 'LinkedIn Learning', 'soft-skills', 'intermediate', '6h', 45.90, 4.7, 3456, 'Desenvolva habilidades de liderança e gestão eficaz de equipes.', ARRAY['Liderança', 'Gestão', 'Soft Skills', 'Equipes']),
    ('Python para Data Science', 'Pedro Lima', 'DataCamp', 'data-science', 'beginner', '10h', 79.90, 4.5, 1876, 'Introdução ao Python para análise de dados e machine learning.', ARRAY['Python', 'Data Science', 'Machine Learning', 'Análise']),
    ('TypeScript do Zero ao Avançado', 'Lucas Mendes', 'Alura', 'frontend', 'intermediate', '14h', 99.90, 4.8, 1567, 'Aprenda TypeScript desde o básico até conceitos avançados.', ARRAY['TypeScript', 'JavaScript', 'Frontend', 'Padrões'])
ON CONFLICT (id) DO NOTHING;

-- Inserir recursos da biblioteca
INSERT INTO recursos (titulo, autor, tipo, categoria, descricao, tamanho, duracao, tags) VALUES
    ('Guia Completo de React Hooks', 'João Silva', 'document', 'frontend', 'Guia completo sobre React Hooks com exemplos práticos e casos de uso.', '2.4 MB', NULL, ARRAY['React', 'Hooks', 'JavaScript', 'Frontend']),
    ('Microserviços: Arquitetura e Implementação', 'Maria Santos', 'video', 'backend', 'Vídeo explicativo sobre arquitetura de microserviços e implementação prática.', NULL, '45 min', ARRAY['Microserviços', 'Arquitetura', 'Backend', 'Docker']),
    ('Podcast: Liderança em Equipes Ágeis', 'Carlos Oliveira', 'audio', 'soft-skills', 'Podcast sobre liderança e gestão de equipes em metodologias ágeis.', NULL, '32 min', ARRAY['Liderança', 'Agile', 'Gestão', 'Soft Skills']),
    ('Manual de DevOps com Kubernetes', 'Ana Costa', 'document', 'devops', 'Manual completo sobre DevOps e implementação com Kubernetes.', '5.2 MB', NULL, ARRAY['DevOps', 'Kubernetes', 'CI/CD', 'Infraestrutura']),
    ('Webinar: Gestão de Projetos Digitais', 'Pedro Lima', 'video', 'management', 'Webinar sobre gestão eficaz de projetos digitais e ferramentas modernas.', NULL, '1h 15min', ARRAY['Gestão', 'Projetos', 'Digital', 'Ferramentas']),
    ('E-book: TypeScript Avançado', 'Lucas Mendes', 'document', 'frontend', 'E-book completo sobre TypeScript avançado com padrões e boas práticas.', '8.1 MB', NULL, ARRAY['TypeScript', 'JavaScript', 'Frontend', 'Padrões'])
ON CONFLICT (id) DO NOTHING;

 