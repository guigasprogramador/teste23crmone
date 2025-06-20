import { NextRequest, NextResponse } from 'next/server';
import { crmonefactory } from '@/lib/supabase/client';

// GET - Listar todos os serviços de uma licitação
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const licitacaoId = await Promise.resolve(params.id);
    
    const { data, error } = await crmonefactory
      .from('licitacao_servicos')
      .select('*')
      .eq('licitacao_id', licitacaoId)
      .order('data_criacao', { ascending: false });
    
    if (error) {
      console.error('Erro ao buscar serviços:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar serviços da licitação' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Erro ao processar requisição de serviços:', error);
    return NextResponse.json(
      { error: 'Erro interno ao processar serviços' },
      { status: 500 }
    );
  }
}

// POST - Adicionar um novo serviço a uma licitação
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const licitacaoId = params.id;
    const data = await request.json();
    
    // Validação básica
    if (!data.nome) {
      return NextResponse.json(
        { error: 'Nome do serviço é obrigatório' },
        { status: 400 }
      );
    }
    
    // Preparar objeto para inserção
    const servico = {
      licitacao_id: licitacaoId,
      nome: data.nome,
      descricao: data.descricao || '',
      valor: data.valor || 0,
      unidade: data.unidade || 'unidade',
      quantidade: data.quantidade || 1
    };
    
    // Inserir o serviço
    const { data: servicoInserido, error } = await crmonefactory
      .from('licitacao_servicos')
      .insert(servico)
      .select()
      .single();
    
    if (error) {
      console.error('Erro ao inserir serviço:', error);
      return NextResponse.json(
        { error: 'Erro ao adicionar serviço à licitação' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(servicoInserido);
  } catch (error) {
    console.error('Erro ao processar adição de serviço:', error);
    return NextResponse.json(
      { error: 'Erro interno ao adicionar serviço' },
      { status: 500 }
    );
  }
}