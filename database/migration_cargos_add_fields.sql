-- Adiciona os campos complexidade e responsabilidades na tabela cargos, se não existirem
ALTER TABLE cargos ADD COLUMN IF NOT EXISTS complexidade TEXT;
ALTER TABLE cargos ADD COLUMN IF NOT EXISTS responsabilidades TEXT; 