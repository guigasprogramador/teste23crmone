-- Script para corrigir problemas de RLS desabilitando-o completamente
-- ATENÇÃO: Este script é uma solução temporária para resolver o problema imediato
-- Uma solução mais robusta com RLS adequado deve ser implementada para produção

-- Desabilitar RLS completamente na tabela doc
ALTER TABLE crmonefactory.doc DISABLE ROW LEVEL SECURITY;

-- Remover todas as políticas existentes
DROP POLICY IF EXISTS "Usuários autenticados podem ver todos os documentos" ON crmonefactory.doc;
DROP POLICY IF EXISTS "Usuários autenticados podem inserir documentos" ON crmonefactory.doc;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar documentos" ON crmonefactory.doc;
DROP POLICY IF EXISTS "Usuários autenticados podem excluir documentos" ON crmonefactory.doc;

-- Garantir que as permissões estejam corretas (incluindo o papel anon)
GRANT ALL ON TABLE crmonefactory.doc TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE crmonefactory.doc TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE crmonefactory.doc TO anon;

-- Informar ao usuário que o RLS foi desabilitado
SELECT 'RLS desabilitado com sucesso para a tabela crmonefactory.doc' AS status;
