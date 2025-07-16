-- Migration para adicionar campo quantidade_vagas na tabela cargos
-- Execute este script para atualizar a estrutura do banco

-- Adicionar coluna quantidade_vagas na tabela cargos
ALTER TABLE cargos ADD COLUMN IF NOT EXISTS quantidade_vagas INTEGER DEFAULT 1;

-- Atualizar cargos existentes com valores padrão
UPDATE cargos SET quantidade_vagas = 1 WHERE quantidade_vagas IS NULL;

-- Comentário na coluna para documentação
COMMENT ON COLUMN cargos.quantidade_vagas IS 'Quantidade de vagas disponíveis para este cargo';

-- Verificar se a coluna foi adicionada corretamente
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'cargos' AND column_name = 'quantidade_vagas'; 