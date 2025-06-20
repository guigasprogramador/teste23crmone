import { NextRequest, NextResponse } from 'next/server';
import { supabase, crmonefactory } from '@/lib/supabase/client';

// GET - Buscar documentos por ID da licitação
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const licitacaoId = searchParams.get('licitacaoId');
    
    console.log(`[DEBUG] Buscando documentos para licitação: ${licitacaoId}`);
    
    if (!licitacaoId) {
      console.log('[DEBUG] ID da licitação não fornecido');
      return NextResponse.json(
        { error: 'ID da licitação é obrigatório' },
        { status: 400 }
      );
    }
    
    // Buscar documentos da tabela documentos no schema crmonefactory
    console.log('[DEBUG] Executando consulta no Supabase');
    const { data, error } = await crmonefactory
      .from('documentos')
      .select('*')
      .eq('licitacao_id', licitacaoId);
    
    if (error) {
      console.error('[DEBUG] Erro ao buscar documentos:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar documentos no banco de dados' },
        { status: 500 }
      );
    }
    
    console.log(`[DEBUG] Documentos encontrados: ${data?.length || 0}`);
    console.log('[DEBUG] Dados brutos:', JSON.stringify(data || []));
    
    // Formatar os dados para o formato esperado pelo front-end
    const documentosFormatados = data.map((doc: any) => ({
      id: doc.id,
      nome: doc.nome,
      tipo: doc.categoria || 'Documento',
      url: doc.url,
      data: new Date(doc.data_criacao).toLocaleDateString('pt-BR'),
      tamanho: formatarTamanho(doc.tamanho || 0),
      licitacaoId: doc.licitacao_id,
      formato: doc.formato,
      arquivo: doc.arquivo
    }));
    
    console.log('[DEBUG] Documentos formatados:', JSON.stringify(documentosFormatados));
    
    return NextResponse.json(documentosFormatados);
  } catch (error) {
    console.error('[DEBUG] Erro ao listar documentos:', error);
    return NextResponse.json(
      { error: 'Erro ao listar documentos' },
      { status: 500 }
    );
  }
}

// Função para formatar o tamanho do arquivo de bytes para KB, MB, etc.
function formatarTamanho(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
