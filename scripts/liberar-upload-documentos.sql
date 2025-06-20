-- Script para criar bucket de documentos e configurar acesso público
BEGIN;

-- Garantir que o bucket existe (ou criá-lo se não existir)
INSERT INTO storage.buckets (id, name, public)
VALUES ('documentos', 'documentos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Remover políticas existentes para evitar conflitos
DROP POLICY IF EXISTS "Permitir uploads de documentos para usuários autenticados" ON storage.objects;
DROP POLICY IF EXISTS "Permitir leitura pública de documentos" ON storage.objects;
DROP POLICY IF EXISTS "Permitir atualizações nos próprios documentos" ON storage.objects;
DROP POLICY IF EXISTS "Permitir remoção dos próprios documentos" ON storage.objects;

-- Criar política para permitir uploads por qualquer usuário autenticado
CREATE POLICY "Permitir uploads de documentos para usuários autenticados" ON storage.objects
FOR INSERT TO authenticated, anon, service_role
WITH CHECK (
    bucket_id = 'documentos'
);

-- Criar política para permitir acesso de leitura por qualquer pessoa
CREATE POLICY "Permitir leitura pública de documentos" ON storage.objects
FOR SELECT TO authenticated, anon, service_role
USING (bucket_id = 'documentos');

-- Criar política para permitir atualizações por usuários em seus próprios arquivos
CREATE POLICY "Permitir atualizações nos próprios documentos" ON storage.objects
FOR UPDATE TO authenticated, anon, service_role
USING (bucket_id = 'documentos')
WITH CHECK (bucket_id = 'documentos');

-- Criar política para permitir remoção por usuários em seus próprios arquivos
CREATE POLICY "Permitir remoção dos próprios documentos" ON storage.objects
FOR DELETE TO authenticated, anon, service_role
USING (bucket_id = 'documentos');

-- Verificação
SELECT * FROM storage.buckets WHERE id = 'documentos';

COMMIT;