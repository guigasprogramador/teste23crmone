import { NextRequest, NextResponse } from 'next/server';
import { Documento } from '@/types/licitacoes';
import { crmonefactory, supabase } from '@/lib/supabase/client';

// GET - Listar documentos com filtros
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parâmetros de filtro
    const licitacaoId = searchParams.get('licitacaoId');
    const tipo = searchParams.get('tipo');
    const categoriaId = searchParams.get('categoriaId');
    
    // Iniciar a consulta
    let query = crmonefactory
      .from('documentos')
      .select(`
        *,
        licitacoes (id, titulo),
        documento_categorias (id, nome, descricao)
      `);
    
    // Aplicar filtros se existirem
    if (licitacaoId) {
      query = query.eq('licitacao_id', licitacaoId);
    }
    
    if (tipo) {
      query = query.eq('tipo', tipo);
    }
    
    if (categoriaId) {
      query = query.eq('categoria_id', categoriaId);
    }
    
    // Ordenar por mais recente
    query = query.order('data_criacao', { ascending: false });
    
    // Executar a consulta
    const { data, error } = await query;
    
    if (error) {
      console.error('Erro ao consultar documentos:', error);
      return NextResponse.json(
        { error: 'Erro ao listar documentos: ' + error.message },
        { status: 500 }
      );
    }
    
    // Formatar os dados para o formato esperado pelo frontend
    const documentos = data.map(formatarDocumento);
    
    return NextResponse.json(documentos);
  } catch (error) {
    console.error('Erro ao listar documentos:', error);
    return NextResponse.json(
      { error: 'Erro interno ao processar documentos' },
      { status: 500 }
    );
  }
}

// POST - Criar novo documento
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Validar dados básicos
    if (!data.nome || !data.licitacaoId) {
      return NextResponse.json(
        { error: 'Nome e ID da licitação são obrigatórios' },
        { status: 400 }
      );
    }
    
    // Preparar o objeto para inserção
    const documento = {
      nome: data.nome,
      licitacao_id: data.licitacaoId,
      url: data.url,
      arquivo: data.arquivo,
      tipo: data.tipo,
      tamanho: data.tamanho,
      formato: data.formato,
      categoria_id: data.categoriaId,
      upload_por: data.uploadPor,
      resumo: data.resumo,
      data_validade: data.dataValidade,
      status: data.status || 'ativo'
    };
    
    // Inserir o documento
    const { data: documentoInserido, error } = await crmonefactory
      .from('documentos')
      .insert(documento)
      .select(`
        *,
        licitacoes (id, titulo),
        documento_categorias (id, nome, descricao)
      `)
      .single();
    
    if (error) {
      console.error('Erro ao criar documento:', error);
      return NextResponse.json(
        { error: 'Erro ao criar documento: ' + error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json(formatarDocumento(documentoInserido), { status: 201 });
  } catch (error) {
    console.error('Erro ao criar documento:', error);
    return NextResponse.json(
      { error: 'Erro interno ao criar documento' },
      { status: 500 }
    );
  }
}

// Função auxiliar para formatar o documento no formato esperado pelo frontend
function formatarDocumento(item: any): Documento {
  // Extrair dados relacionados
  const licitacao = item.licitacoes || {};
  const categoria = item.documento_categorias || {};
  
  return {
    id: item.id,
    nome: item.nome,
    url: item.url,
    arquivo: item.arquivo,
    licitacaoId: item.licitacao_id,
    tipo: item.tipo,
    tamanho: item.tamanho,
    formato: item.formato,
    categoriaId: item.categoria_id,
    categoria: categoria.nome,
    uploadPor: item.upload_por,
    resumo: item.resumo,
    dataValidade: item.data_validade,
    status: item.status,
    licitacao: licitacao.titulo,
    dataCriacao: item.data_criacao,
    dataAtualizacao: item.data_atualizacao
  };
}
