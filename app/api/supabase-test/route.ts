import { NextResponse } from "next/server";
import { supabase, testSupabaseConnection } from "@/lib/supabase/client";

export async function GET() {
  // Teste de conexão
  const connectionTest = await testSupabaseConnection();
  
  // Teste de listagem de tabelas
  let tablesTest;
  try {
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_schema, table_name')
      .in('table_schema', ['public', 'crmonefactory'])
      .order('table_schema, table_name');
    
    tablesTest = { success: !error, data, error };
  } catch (error) {
    tablesTest = { success: false, error };
  }
  
  // Verificar permissões
  let permissionsTest;
  try {
    const { data, error } = await supabase.rpc('check_permissions');
    permissionsTest = { success: !error, data, error };
  } catch (error) {
    permissionsTest = { 
      success: false, 
      error,
      message: "Função RPC 'check_permissions' não encontrada ou erro ao executar"
    };
  }
  
  // Verificar se o schema crmonefactory existe
  let schemaTest;
  try {
    const { data, error } = await supabase
      .from('information_schema.schemata')
      .select('schema_name')
      .eq('schema_name', 'crmonefactory')
      .single();
    
    schemaTest = { 
      success: !error && data, 
      exists: !!data,
      data, 
      error 
    };
  } catch (error) {
    schemaTest = { success: false, error };
  }
  
  // Retornar todos os resultados
  return NextResponse.json({
    timestamp: new Date().toISOString(),
    connection: connectionTest,
    tables: tablesTest,
    permissions: permissionsTest,
    schema: schemaTest,
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || 'URL não configurada',
    environment: process.env.NODE_ENV || 'development'
  });
}
