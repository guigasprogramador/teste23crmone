import { NextRequest, NextResponse } from 'next/server';
import { crmonefactory } from '@/lib/supabase/client';

// GET - Obter um serviço específico de uma licitação
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; servicoId: string } }
) {
  try {
    const licitacaoId = await Promise.resolve(params.id);
    const servicoId = await Promise.resolve(params.servicoId);
    
    const { data, error } = await crmonefactory
      .from('licitacao_servicos')
      .select('*')
      .eq('id', servicoId)
      .eq('licitacao_id', licitacaoId)
      .single();
    
    if (error) {
      console.error('Erro ao buscar serviço:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar serviço da licitação' },
        { status: 500 }
      );
    }
    
    if (!data) {
      return NextResponse.json(
        { error: 'Serviço não encontrado' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Erro ao processar requisição de serviço:', error);
    return NextResponse.json(
      { error: 'Erro interno ao processar serviço' },
      { status: 500 }
    );
  }
}

// PUT - Atualizar um serviço específico de uma licitação
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; servicoId: string } }
) {
  try {
    const licitacaoId = params.id;
    const servicoId = params.servicoId;
    const data = await request.json();
    
    // Validação básica
    if (!data.nome) {
      return NextResponse.json(
        { error: 'Nome do serviço é obrigatório' },
        { status: 400 }
      );
    }
    
    // Preparar objeto para atualização
    const servico = {
      nome: data.nome,
      descricao: data.descricao || '',
      valor: data.valor || 0,
      unidade: data.unidade || 'unidade',
      quantidade: data.quantidade || 1,
      data_atualizacao: new Date().toISOString()
    };
    
    // Atualizar o serviço
    const { data: servicoAtualizado, error } = await crmonefactory
      .from('licitacao_servicos')
      .update(servico)
      .eq('id', servicoId)
      .eq('licitacao_id', licitacaoId)
      .select()
      .single();
    
    if (error) {
      console.error('Erro ao atualizar serviço:', error);
      return NextResponse.json(
        { error: 'Erro ao atualizar serviço da licitação' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(servicoAtualizado);
  } catch (error) {
    console.error('Erro ao processar atualização de serviço:', error);
    return NextResponse.json(
      { error: 'Erro interno ao atualizar serviço' },
      { status: 500 }
    );
  }
}

// DELETE - Excluir um serviço específico de uma licitação
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; servicoId: string } }
) {
  try {
    const licitacaoId = params.id;
    const servicoId = params.servicoId;
    
    const { error } = await crmonefactory
      .from('licitacao_servicos')
      .delete()
      .eq('id', servicoId)
      .eq('licitacao_id', licitacaoId);
    
    if (error) {
      console.error('Erro ao excluir serviço:', error);
      return NextResponse.json(
        { error: 'Erro ao excluir serviço da licitação' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao processar exclusão de serviço:', error);
    return NextResponse.json(
      { error: 'Erro interno ao excluir serviço' },
      { status: 500 }
    );
  }
}