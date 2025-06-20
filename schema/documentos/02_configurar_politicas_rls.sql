-- Script para configurar políticas de RLS (Row Level Security) para o bucket 'documentos'
-- Este script deve ser executado no Supabase SQL Editor

-- Criar políticas de acesso para o bucket 'documentos'

BEGIN;

-- Garantir que o bucket existe (ou criá-lo se não existir)
INSERT INTO storage.buckets (id, name, public)
VALUES ('documentos', 'documentos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Verificar se as políticas já existem antes de criar
DO $$
DECLARE
  policy_exists BOOLEAN;
BEGIN
  -- Verificar política de upload
  SELECT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND policyname = 'Permitir uploads de documentos para usuários autenticados'
  ) INTO policy_exists;
  
  IF NOT policy_exists THEN
    EXECUTE format('
      CREATE POLICY "Permitir uploads de documentos para usuários autenticados" ON storage.objects
      FOR INSERT TO authenticated, anon, service_role
      WITH CHECK (bucket_id = ''documentos'')
    ');
    RAISE NOTICE 'Política de upload criada';
  ELSE
    RAISE NOTICE 'Política de upload já existe';
  END IF;
  
  -- Verificar política de leitura
  SELECT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND policyname = 'Permitir leitura pública de documentos'
  ) INTO policy_exists;
  
  IF NOT policy_exists THEN
    EXECUTE format('
      CREATE POLICY "Permitir leitura pública de documentos" ON storage.objects
      FOR SELECT TO authenticated, anon, service_role
      USING (bucket_id = ''documentos'')
    ');
    RAISE NOTICE 'Política de leitura criada';
  ELSE
    RAISE NOTICE 'Política de leitura já existe';
  END IF;
  
  -- Verificar política de atualização
  SELECT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND policyname = 'Permitir atualizações nos próprios documentos'
  ) INTO policy_exists;
  
  IF NOT policy_exists THEN
    EXECUTE format('
      CREATE POLICY "Permitir atualizações nos próprios documentos" ON storage.objects
      FOR UPDATE TO authenticated, anon, service_role
      USING (bucket_id = ''documentos'')
      WITH CHECK (bucket_id = ''documentos'')
    ');
    RAISE NOTICE 'Política de atualização criada';
  ELSE
    RAISE NOTICE 'Política de atualização já existe';
  END IF;
  
  -- Verificar política de remoção
  SELECT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND policyname = 'Permitir remoção dos próprios documentos'
  ) INTO policy_exists;
  
  IF NOT policy_exists THEN
    EXECUTE format('
      CREATE POLICY "Permitir remoção dos próprios documentos" ON storage.objects
      FOR DELETE TO authenticated, anon, service_role
      USING (bucket_id = ''documentos'')
    ');
    RAISE NOTICE 'Política de remoção criada';
  ELSE
    RAISE NOTICE 'Política de remoção já existe';
  END IF;
END
$$;

-- Verificação de bucket
SELECT * FROM storage.buckets WHERE id = 'documentos';

COMMIT;
