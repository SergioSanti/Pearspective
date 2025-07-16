-- Migração para adicionar campo curriculo na tabela usuarios
-- Execute este script se a tabela já existir

-- Adicionar coluna curriculo se não existir
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS curriculo BYTEA;

-- Adicionar coluna para nome original do arquivo
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS curriculo_nome VARCHAR(255);

-- Verificar se as colunas foram adicionadas
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'usuarios' AND column_name IN ('curriculo', 'curriculo_nome'); 