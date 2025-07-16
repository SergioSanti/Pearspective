-- Verificar se a coluna existe e renomear se necessário
DO $$ 
BEGIN
    -- Se a coluna 'nome' existir e 'nome_cargo' não existir, renomear
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'cargos' 
        AND column_name = 'nome'
    ) AND NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'cargos' 
        AND column_name = 'nome_cargo'
    ) THEN
        ALTER TABLE cargos RENAME COLUMN nome TO nome_cargo;
    END IF;
END $$;

-- Verificar e corrigir a estrutura da tabela
CREATE TABLE IF NOT EXISTS cargos_new (
    id SERIAL PRIMARY KEY,
    nome_cargo VARCHAR(100) NOT NULL,
    area_id INTEGER REFERENCES areas(id),
    requisitos JSONB NOT NULL
);

-- Copiar dados existentes para a nova tabela
INSERT INTO cargos_new (id, nome_cargo, area_id, requisitos)
SELECT 
    id,
    COALESCE(nome_cargo, 'Cargo Padrão') as nome_cargo,
    area_id,
    requisitos
FROM cargos
ON CONFLICT (id) DO NOTHING;

-- Dropar a tabela antiga e renomear a nova
DROP TABLE IF EXISTS cargos;
ALTER TABLE cargos_new RENAME TO cargos;

-- Recriar a tabela cargos com a estrutura correta
DROP TABLE IF EXISTS cargos;

CREATE TABLE cargos (
    id SERIAL PRIMARY KEY,
    nome_cargo VARCHAR(100) NOT NULL,
    area_id INTEGER REFERENCES areas(id),
    requisitos JSONB NOT NULL
);

-- Reinserir os dados
INSERT INTO cargos (nome_cargo, area_id, requisitos) VALUES
    ('Desenvolvedor Frontend', 1, '{"experiencia": "2+ anos", "formacao": "Superior em Ciência da Computação ou áreas afins", "idiomas": "Inglês intermediário", "habilidades": "HTML, CSS, JavaScript, React", "soft_skills": "Trabalho em equipe, comunicação clara"}'),
    ('Desenvolvedor Backend', 1, '{"experiencia": "3+ anos", "formacao": "Superior em Ciência da Computação ou áreas afins", "idiomas": "Inglês intermediário", "habilidades": "Node.js, PostgreSQL, APIs REST", "soft_skills": "Resolução de problemas, autonomia"}'),
    ('Analista de RH', 3, '{"experiencia": "2+ anos", "formacao": "Superior em Administração, Psicologia ou áreas afins", "idiomas": "Inglês básico", "habilidades": "Recrutamento, gestão de pessoas", "soft_skills": "Empatia, comunicação, organização"}'),
    ('Gerente de Projetos', 1, '{"experiencia": "5+ anos", "formacao": "Superior em áreas técnicas", "idiomas": "Inglês avançado", "habilidades": "Metodologias ágeis, gestão de equipes", "soft_skills": "Liderança, negociação, gestão de conflitos"}'),
    ('Analista de Marketing Digital', 2, '{"experiencia": "2+ anos", "formacao": "Superior em Marketing, Publicidade ou áreas afins", "idiomas": "Inglês intermediário", "habilidades": "SEO, mídias sociais", "soft_skills": "Criatividade, análise de dados"}');

-- Adicionar campo foto_perfil se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'usuarios' 
        AND column_name = 'foto_perfil'
    ) THEN
        ALTER TABLE usuarios ADD COLUMN foto_perfil TEXT;
        RAISE NOTICE 'Campo foto_perfil adicionado à tabela usuarios';
    ELSE
        RAISE NOTICE 'Campo foto_perfil já existe na tabela usuarios';
    END IF;
END $$; 