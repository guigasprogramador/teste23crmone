import { crmonefactory } from '../lib/supabase/client';
import fs from 'fs';
import path from 'path';

async function executeSqlScript() {
  try {
    // Ler o conteúdo do arquivo SQL
    const sqlFilePath = path.join(process.cwd(), 'schema', 'licitacoes', '04_test_data.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Dividir o SQL em comandos separados
    const commands = sqlContent.split(';').filter(cmd => cmd.trim().length > 0);
    
    console.log(`Encontrados ${commands.length} comandos SQL para executar.`);
    
    // Executar cada comando separadamente
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i].trim() + ';';
      console.log(`Executando comando ${i + 1}/${commands.length}...`);
      
      const { data, error } = await crmonefactory.rpc('execute_sql', {
        sql_query: command
      });
      
      if (error) {
        console.error(`Erro ao executar comando ${i + 1}:`, error);
      } else {
        console.log(`Comando ${i + 1} executado com sucesso:`, data);
      }
    }
    
    console.log('Todos os comandos foram executados.');
  } catch (error) {
    console.error('Erro ao executar script SQL:', error);
  }
}

// Executar a função
executeSqlScript()
  .then(() => console.log('Script SQL executado com sucesso!'))
  .catch(err => console.error('Falha ao executar script:', err));
