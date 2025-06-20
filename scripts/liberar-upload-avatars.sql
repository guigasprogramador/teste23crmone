-- Script para criar bucket de avatares e configurar acesso público
BEGIN;

-- Garantir que o bucket existe (ou criá-lo se não existir)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Criar política para permitir uploads por qualquer usuário autenticado
CREATE POLICY "Permitir uploads de avatares para usuários autenticados" ON storage.objects
FOR INSERT TO authenticated, anon, service_role
WITH CHECK (
    bucket_id = 'avatars'
);

-- Criar política para permitir acesso de leitura por qualquer pessoa
CREATE POLICY "Permitir leitura pública de avatares" ON storage.objects
FOR SELECT TO authenticated, anon, service_role
USING (bucket_id = 'avatars');

-- Criar política para permitir atualizações por usuários em seus próprios arquivos
CREATE POLICY "Permitir atualizações nos próprios avatares" ON storage.objects
FOR UPDATE TO authenticated, anon, service_role
USING (bucket_id = 'avatars')
WITH CHECK (bucket_id = 'avatars');

-- Criar política para permitir remoção por usuários em seus próprios arquivos
CREATE POLICY "Permitir remoção dos próprios avatares" ON storage.objects
FOR DELETE TO authenticated, anon, service_role
USING (bucket_id = 'avatars');

-- Verificação
SELECT * FROM storage.buckets WHERE id = 'avatars';

COMMIT;
