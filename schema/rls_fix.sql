-- Script para corrigir políticas RLS na tabela doc
-- Este script modifica as políticas para garantir que o usuário possa inserir documentos

-- Verificar se a tabela é configurada para RLS
ALTER TABLE crmonefactory.doc ENABLE ROW LEVEL SECURITY;

-- Remover todas as políticas existentes
DROP POLICY IF EXISTS "Usuários autenticados podem ver todos os documentos" ON crmonefactory.doc;
DROP POLICY IF EXISTS "Usuários autenticados podem inserir documentos" ON crmonefactory.doc;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar documentos" ON crmonefactory.doc;
DROP POLICY IF EXISTS "Usuários autenticados podem excluir documentos" ON crmonefactory.doc;

-- Recriar políticas com condições mais permissivas
-- Política para SELECT: permitir para todos os usuários autenticados
CREATE POLICY "Usuários autenticados podem ver todos os documentos"
  ON crmonefactory.doc
  FOR SELECT
  TO authenticated
  USING (true);

-- Política para INSERT: permitir para todos os usuários autenticados, independente do uid
CREATE POLICY "Usuários autenticados podem inserir documentos"
  ON crmonefactory.doc
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Política para UPDATE: permitir para todos os usuários autenticados
CREATE POLICY "Usuários autenticados podem atualizar documentos"
  ON crmonefactory.doc
  FOR UPDATE
  TO authenticated
  USING (true);

-- Política para DELETE: permitir para todos os usuários autenticados
CREATE POLICY "Usuários autenticados podem excluir documentos"
  ON crmonefactory.doc
  FOR DELETE
  TO authenticated
  USING (true);

-- Garantir que as permissões estejam corretas
GRANT ALL ON TABLE crmonefactory.doc TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE crmonefactory.doc TO authenticated;
