import { supabaseAdmin } from '../lib/supabase/admin-client';

async function criarBucketAvatars() {
  console.log('Iniciando criação do bucket avatars...');
  
  try {
    // 1. Verificar se o bucket já existe
    const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets();
    
    if (listError) {
      console.error('Erro ao listar buckets:', listError);
      throw listError;
    }
    
    const bucketExists = buckets.some(bucket => bucket.name === 'avatars');
    
    // 2. Criar o bucket se não existir
    if (!bucketExists) {
      console.log('Bucket avatars não encontrado. Criando...');
      
      const { data, error } = await supabaseAdmin.storage.createBucket('avatars', {
        public: true, // Configurar como público
        fileSizeLimit: 5242880, // 5MB em bytes
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
      });
      
      if (error) {
        console.error('Erro ao criar bucket avatars:', error);
        throw error;
      }
      
      console.log('Bucket avatars criado com sucesso!');
    } else {
      console.log('Bucket avatars já existe. Atualizando configurações...');
      
      // 3. Atualizar o bucket para ser público
      const { data, error } = await supabaseAdmin.storage.updateBucket('avatars', {
        public: true,
        fileSizeLimit: 5242880, // 5MB em bytes
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
      });
      
      if (error) {
        console.error('Erro ao atualizar bucket avatars:', error);
        throw error;
      }
      
      console.log('Bucket avatars atualizado com sucesso!');
    }
    
    // 4. Verificar o bucket após a operação
    const { data: updatedBuckets, error: verifyError } = await supabaseAdmin.storage.listBuckets();
    
    if (verifyError) {
      console.error('Erro ao verificar buckets após criação/atualização:', verifyError);
    } else {
      const avatarBucket = updatedBuckets.find(bucket => bucket.name === 'avatars');
      if (avatarBucket) {
        console.log('Configuração final do bucket avatars:', avatarBucket);
      } else {
        console.log('Bucket avatars não encontrado após operação!');
      }
    }
    
    console.log('Operação concluída com sucesso!');
  } catch (error) {
    console.error('Erro durante a execução:', error);
    process.exit(1);
  }
}

// Executar a função principal
criarBucketAvatars();
