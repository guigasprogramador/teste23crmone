-- Script para garantir permissões adequadas nas tabelas do schema crmonefactory
BEGIN;

-- Remover políticas de segurança por linha (RLS) existentes para todas as tabelas
DROP POLICY IF EXISTS "Allow select for users" ON crmonefactory.users;
DROP POLICY IF EXISTS "Allow insert for users" ON crmonefactory.users;
DROP POLICY IF EXISTS "Allow update for users" ON crmonefactory.users;
DROP POLICY IF EXISTS "Allow delete for users" ON crmonefactory.users;
DROP POLICY IF EXISTS "Allow all for refresh_tokens" ON crmonefactory.refresh_tokens;
DROP POLICY IF EXISTS "Allow all for user_profiles" ON crmonefactory.user_profiles;
DROP POLICY IF EXISTS "Allow all for user_preferences" ON crmonefactory.user_preferences;
DROP POLICY IF EXISTS "Allow all for clientes" ON crmonefactory.clientes;
DROP POLICY IF EXISTS "Allow all for contatos" ON crmonefactory.contatos;
DROP POLICY IF EXISTS "Allow all for segmentos_clientes" ON crmonefactory.segmentos_clientes;
DROP POLICY IF EXISTS "Allow all for oportunidades" ON crmonefactory.oportunidades;
DROP POLICY IF EXISTS "Allow all for oportunidades_responsaveis" ON crmonefactory.oportunidades_responsaveis;
DROP POLICY IF EXISTS "Allow all for reunioes" ON crmonefactory.reunioes;
DROP POLICY IF EXISTS "Allow all for reunioes_participantes" ON crmonefactory.reunioes_participantes;
DROP POLICY IF EXISTS "Allow all for notas" ON crmonefactory.notas;
DROP POLICY IF EXISTS "Allow all for responsaveis" ON crmonefactory.responsaveis;

-- Ativar RLS nas tabelas
ALTER TABLE crmonefactory.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE crmonefactory.refresh_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE crmonefactory.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE crmonefactory.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE crmonefactory.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE crmonefactory.contatos ENABLE ROW LEVEL SECURITY;
ALTER TABLE crmonefactory.segmentos_clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE crmonefactory.oportunidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE crmonefactory.oportunidades_responsaveis ENABLE ROW LEVEL SECURITY;
ALTER TABLE crmonefactory.reunioes ENABLE ROW LEVEL SECURITY;
ALTER TABLE crmonefactory.reunioes_participantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE crmonefactory.notas ENABLE ROW LEVEL SECURITY;
ALTER TABLE crmonefactory.responsaveis ENABLE ROW LEVEL SECURITY;

-- Criar políticas para a tabela users
CREATE POLICY "Allow select for users" 
ON crmonefactory.users 
FOR SELECT 
TO anon, authenticated 
USING (true);

CREATE POLICY "Allow insert for users" 
ON crmonefactory.users 
FOR INSERT 
TO anon, authenticated 
WITH CHECK (true);

CREATE POLICY "Allow update for users" 
ON crmonefactory.users 
FOR UPDATE 
TO anon, authenticated 
USING (true);

CREATE POLICY "Allow delete for users" 
ON crmonefactory.users 
FOR DELETE 
TO anon, authenticated 
USING (true);

-- Criar políticas para as demais tabelas
CREATE POLICY "Allow all for refresh_tokens" 
ON crmonefactory.refresh_tokens 
FOR ALL 
TO anon, authenticated 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Allow all for user_profiles" 
ON crmonefactory.user_profiles 
FOR ALL 
TO anon, authenticated 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Allow all for user_preferences" 
ON crmonefactory.user_preferences 
FOR ALL 
TO anon, authenticated 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Allow all for clientes" 
ON crmonefactory.clientes 
FOR ALL 
TO anon, authenticated 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Allow all for contatos" 
ON crmonefactory.contatos 
FOR ALL 
TO anon, authenticated 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Allow all for segmentos_clientes" 
ON crmonefactory.segmentos_clientes 
FOR ALL 
TO anon, authenticated 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Allow all for oportunidades" 
ON crmonefactory.oportunidades 
FOR ALL 
TO anon, authenticated 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Allow all for oportunidades_responsaveis" 
ON crmonefactory.oportunidades_responsaveis 
FOR ALL 
TO anon, authenticated 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Allow all for reunioes" 
ON crmonefactory.reunioes 
FOR ALL 
TO anon, authenticated 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Allow all for reunioes_participantes" 
ON crmonefactory.reunioes_participantes 
FOR ALL 
TO anon, authenticated 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Allow all for notas" 
ON crmonefactory.notas 
FOR ALL 
TO anon, authenticated 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Allow all for responsaveis" 
ON crmonefactory.responsaveis 
FOR ALL 
TO anon, authenticated 
USING (true) 
WITH CHECK (true);

-- Confirmação de permissões
GRANT ALL PRIVILEGES ON SCHEMA crmonefactory TO anon, authenticated;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA crmonefactory TO anon, authenticated;

COMMIT;
