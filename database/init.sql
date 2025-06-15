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

-- Inserir áreas
INSERT INTO areas (nome) VALUES
    ('Tecnologia'),
    ('Administração'),
    ('Recursos Humanos')
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
    )
ON CONFLICT (id) DO NOTHING; 