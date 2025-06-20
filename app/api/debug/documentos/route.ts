import { NextRequest, NextResponse } from 'next/server';
import { supabase, crmonefactory } from '@/lib/supabase/client';

// GET - Endpoint de diagnóstico para documentos
export async function GET(request: NextRequest) {
  try {
    const resultados = {
      estruturaTabela: null,
      amostras: null,
      contagem: null,
      teste: null,
      erro: null
    };

    // 1. Verificar estrutura da tabela
    try {
      const { data: colunas, error } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type')
        .eq('table_schema', 'crmonefactory')
        .eq('table_name', 'documentos');
      
      if (error) throw error;
      resultados.estruturaTabela = colunas;
    } catch (error: any) {
      resultados.erro = {
        estruturaTabela: { mensagem: error.message, detalhes: error }
      };
    }

    // 2. Pegar amostra de documentos (últimos 5)
    try {
      const { data, error } = await crmonefactory
        .from('documentos')
        .select('*')
        .order('data_criacao', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      resultados.amostras = data;
    } catch (error: any) {
      resultados.erro = {
        ...resultados.erro,
        amostras: { mensagem: error.message, detalhes: error }
      };
    }

    // 3. Contagem por licitação
    try {
      const { data, error } = await crmonefactory
        .from('documentos')
        .select('licitacao_id, count(*)', { count: 'exact' })
        .group('licitacao_id');
      
      if (error) throw error;
      resultados.contagem = data;
    } catch (error: any) {
      resultados.erro = {
        ...resultados.erro,
        contagem: { mensagem: error.message, detalhes: error }
      };
    }

    // 4. Tentar um SQL direto para verificar mais detalhes
    try {
      const { data, error } = await supabase.rpc('debug_documentos', {});
      
      if (error && error.message.includes('function "debug_documentos" does not exist')) {
        // Criar a função se não existir
        await supabase.rpc('create_debug_function', {});
        // Tentar novamente
        const resultado = await supabase.rpc('debug_documentos', {});
        resultados.teste = resultado.data;
      } else if (error) {
        throw error;
      } else {
        resultados.teste = data;
      }
    } catch (error: any) {
      resultados.erro = {
        ...resultados.erro,
        teste: { mensagem: error.message, detalhes: error }
      };
    }

    return NextResponse.json(resultados);
  } catch (error: any) {
    console.error('Erro geral no diagnóstico:', error);
    return NextResponse.json(
      { error: 'Erro ao realizar diagnóstico', detalhes: error.message },
      { status: 500 }
    );
  }
}
