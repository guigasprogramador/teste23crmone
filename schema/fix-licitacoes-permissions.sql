-- Script para corrigir permissões nas tabelas do módulo de licitações
BEGIN;

-- Remover políticas de segurança por linha (RLS) existentes para as tabelas de licitações
DROP POLICY IF EXISTS "Allow all for licitacoes" ON crmonefactory.licitacoes;
DROP POLICY IF EXISTS "Allow all for orgaos" ON crmonefactory.orgaos;
DROP POLICY IF EXISTS "Allow all for orgao_contatos" ON crmonefactory.orgao_contatos;
DROP POLICY IF EXISTS "Allow all for documento_categorias" ON crmonefactory.documento_categorias;
DROP POLICY IF EXISTS "Allow all for licitacao_responsaveis" ON crmonefactory.licitacao_responsaveis;
DROP POLICY IF EXISTS "Allow all for documentos" ON crmonefactory.documentos;
DROP POLICY IF EXISTS "Allow all for licitacao_etapas" ON crmonefactory.licitacao_etapas;
DROP POLICY IF EXISTS "Allow all for licitacao_historico" ON crmonefactory.licitacao_historico;

-- Ativar RLS nas tabelas de licitações
ALTER TABLE crmonefactory.licitacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE crmonefactory.orgaos ENABLE ROW LEVEL SECURITY;
ALTER TABLE crmonefactory.orgao_contatos ENABLE ROW LEVEL SECURITY;
ALTER TABLE crmonefactory.documento_categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE crmonefactory.licitacao_responsaveis ENABLE ROW LEVEL SECURITY;
ALTER TABLE crmonefactory.documentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE crmonefactory.licitacao_etapas ENABLE ROW LEVEL SECURITY;
ALTER TABLE crmonefactory.licitacao_historico ENABLE ROW LEVEL SECURITY;

-- Criar políticas para a tabela licitacoes
CREATE POLICY "Allow all for licitacoes" 
ON crmonefactory.licitacoes 
FOR ALL 
TO anon, authenticated 
USING (true) 
WITH CHECK (true);

-- Criar políticas para as demais tabelas do módulo de licitações
CREATE POLICY "Allow all for orgaos" 
ON crmonefactory.orgaos 
FOR ALL 
TO anon, authenticated 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Allow all for orgao_contatos" 
ON crmonefactory.orgao_contatos 
FOR ALL 
TO anon, authenticated 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Allow all for documento_categorias" 
ON crmonefactory.documento_categorias 
FOR ALL 
TO anon, authenticated 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Allow all for licitacao_responsaveis" 
ON crmonefactory.licitacao_responsaveis 
FOR ALL 
TO anon, authenticated 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Allow all for documentos" 
ON crmonefactory.documentos 
FOR ALL 
TO anon, authenticated 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Allow all for licitacao_etapas" 
ON crmonefactory.licitacao_etapas 
FOR ALL 
TO anon, authenticated 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Allow all for licitacao_historico" 
ON crmonefactory.licitacao_historico 
FOR ALL 
TO anon, authenticated 
USING (true) 
WITH CHECK (true);

-- Confirmação de permissões
GRANT ALL PRIVILEGES ON SCHEMA crmonefactory TO anon, authenticated;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA crmonefactory TO anon, authenticated;

COMMIT;