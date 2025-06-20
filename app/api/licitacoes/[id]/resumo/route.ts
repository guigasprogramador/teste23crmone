import { NextRequest, NextResponse } from 'next/server';
import { crmonefactory } from '@/lib/supabase/client';

// GET - Obter o resumo de uma licitação
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const licitacaoId = await Promise.resolve(params.id);
    
    const { data, error } = await crmonefactory
      .from('licitacao_resumos')
      .select('*')
      .eq('licitacao_id', licitacaoId)
      .single();
    
    // Tratamento de erro específico para 'não encontrado'
    if (error) {
      // Se for erro de 'não encontrado', retornar objeto vazio com status 200
      if (error.code === 'PGRST116') {
        return NextResponse.json({ 
          licitacao_id: licitacaoId,
          conteudo: '',
          pontos_importantes: [] 
        });
      }
      
      // Para outros tipos de erro, retornar 500 com detalhes do erro
      console.error('Erro ao buscar resumo:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar resumo da licitação', details: error.message },
        { status: 500 }
      );
    }
    
    // Verificação adicional para garantir que temos dados
    if (!data) {
      return NextResponse.json(
        { error: 'Resumo não encontrado' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Erro ao processar requisição de resumo:', error);
    return NextResponse.json(
      { error: 'Erro interno ao processar resumo' },
      { status: 500 }
    );
  }
}

// POST - Criar um novo resumo para uma licitação
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const licitacaoId = await Promise.resolve(params.id);
    const data = await request.json();
    
    // Verificar se já existe um resumo para esta licitação
    const { data: resumoExistente } = await crmonefactory
      .from('licitacao_resumos')
      .select('id')
      .eq('licitacao_id', licitacaoId)
      .single();
    
    if (resumoExistente) {
      return NextResponse.json(
        { error: 'Já existe um resumo para esta licitação. Use PUT para atualizar.' },
        { status: 400 }
      );
    }
    
    // Preparar objeto para inserção
    const resumo = {
      licitacao_id: licitacaoId,
      conteudo: data.conteudo || '',
      pontos_importantes: data.pontos_importantes || []
    };
    
    // Inserir o resumo
    const { data: resumoInserido, error } = await crmonefactory
      .from('licitacao_resumos')
      .insert(resumo)
      .select()
      .single();
    
    if (error) {
      console.error('Erro ao inserir resumo:', error);
      return NextResponse.json(
        { error: 'Erro ao adicionar resumo à licitação' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(resumoInserido);
  } catch (error) {
    console.error('Erro ao processar adição de resumo:', error);
    return NextResponse.json(
      { error: 'Erro interno ao adicionar resumo' },
      { status: 500 }
    );
  }
}

// PUT - Atualizar o resumo de uma licitação (se não existir, cria um novo)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const licitacaoId = await Promise.resolve(params.id);
    const data = await request.json();
    
    // Verificar se já existe um resumo para esta licitação
    const { data: resumoExistente } = await crmonefactory
      .from('licitacao_resumos')
      .select('id')
      .eq('licitacao_id', licitacaoId)
      .single();
    
    // Preparar objeto para atualização/inserção
    const resumo = {
      licitacao_id: licitacaoId,
      conteudo: data.conteudo || '',
      pontos_importantes: data.pontos_importantes || [],
      data_atualizacao: new Date().toISOString()
    };
    
    let resultado;
    
    if (resumoExistente) {
      // Atualizar o resumo existente
      const { data: resumoAtualizado, error } = await crmonefactory
        .from('licitacao_resumos')
        .update(resumo)
        .eq('licitacao_id', licitacaoId)
        .select()
        .single();
      
      if (error) {
        console.error('Erro ao atualizar resumo:', error);
        return NextResponse.json(
          { error: 'Erro ao atualizar resumo da licitação' },
          { status: 500 }
        );
      }
      
      resultado = resumoAtualizado;
    } else {
      // Inserir um novo resumo
      const { data: resumoInserido, error } = await crmonefactory
        .from('licitacao_resumos')
        .insert(resumo)
        .select()
        .single();
      
      if (error) {
        console.error('Erro ao inserir novo resumo:', error);
        return NextResponse.json(
          { error: 'Erro ao inserir novo resumo da licitação' },
          { status: 500 }
        );
      }
      
      resultado = resumoInserido;
    }
    
    return NextResponse.json(resultado);
  } catch (error) {
    console.error('Erro ao processar atualização de resumo:', error);
    return NextResponse.json(
      { error: 'Erro interno ao atualizar resumo' },
      { status: 500 }
    );
  }
}