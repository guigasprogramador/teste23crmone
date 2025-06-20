import { supabaseAdmin } from '../lib/supabase/admin-client';
import fs from 'fs';
import path from 'path';

async function aplicarPoliticasStorage() {
  console.log('Iniciando aplicação de políticas de storage...');
  
  try {
    // Ler o arquivo SQL
    const sqlPath = path.join(process.cwd(), 'scripts', 'liberar-upload-avatars.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('Executando script SQL para liberar políticas de storage:');
    console.log('-'.repeat(50));
    console.log(sqlContent);
    console.log('-'.repeat(50));
    
    // Executar o script SQL usando o cliente de administração
    // Supabase não tem método query diretamente, vamos executar diretamente via API REST
    const { data, error } = await supabaseAdmin.rpc('pgrest', { 
      query: sqlContent 
    });
    
    if (error) {
      console.error('Erro ao aplicar políticas de storage:');
      console.error(error);
      throw error;
    }
    
    console.log('Políticas de storage aplicadas com sucesso!');
    console.log('Resultado:', data);
    
    // Verificar se o bucket existe
    const { data: buckets, error: bucketsError } = await supabaseAdmin
      .storage
      .listBuckets();
      
    if (bucketsError) {
      console.error('Erro ao verificar buckets:');
      console.error(bucketsError);
    } else {
      console.log('Buckets encontrados:', buckets);
      
      // Verificar se o bucket avatars existe na lista
      const avatarBucket = buckets.find(bucket => bucket.name === 'avatars');
      if (avatarBucket) {
        console.log('Bucket avatars encontrado:', avatarBucket);
      } else {
        console.log('Bucket avatars não encontrado na lista de buckets.');
      }
    }
  } catch (error) {
    console.error('Erro durante a execução:');
    console.error(error);
    process.exit(1);
  }
}

// Executar a função principal
aplicarPoliticasStorage();
