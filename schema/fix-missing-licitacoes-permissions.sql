-- Script para corrigir permissões nas tabelas de serviços e resumos de licitações
BEGIN;

-- Remover políticas de segurança por linha (RLS) existentes para as tabelas
DROP POLICY IF EXISTS "Allow all for licitacao_servicos" ON crmonefactory.licitacao_servicos;
DROP POLICY IF EXISTS "Allow all for licitacao_resumos" ON crmonefactory.licitacao_resumos;

-- Ativar RLS nas tabelas
ALTER TABLE crmonefactory.licitacao_servicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE crmonefactory.licitacao_resumos ENABLE ROW LEVEL SECURITY;

-- Criar políticas para a tabela licitacao_servicos
CREATE POLICY "Allow all for licitacao_servicos" 
ON crmonefactory.licitacao_servicos 
FOR ALL 
TO anon, authenticated 
USING (true) 
WITH CHECK (true);

-- Criar políticas para a tabela licitacao_resumos
CREATE POLICY "Allow all for licitacao_resumos" 
ON crmonefactory.licitacao_resumos 
FOR ALL 
TO anon, authenticated 
USING (true) 
WITH CHECK (true);

-- Confirmação de permissões
GRANT ALL PRIVILEGES ON SCHEMA crmonefactory TO anon, authenticated;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA crmonefactory TO anon, authenticated;
GRANT ALL PRIVILEGES ON TABLE crmonefactory.licitacao_servicos TO anon, authenticated;
GRANT ALL PRIVILEGES ON TABLE crmonefactory.licitacao_resumos TO anon, authenticated;

COMMIT;