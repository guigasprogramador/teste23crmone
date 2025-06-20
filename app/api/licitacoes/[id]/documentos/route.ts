import { NextRequest, NextResponse } from 'next/server';
import { Licitacao, Documento } from '@/types/licitacoes';

// Referência ao "banco de dados" na memória
let licitacoes: Licitacao[] = [];

// Função para carregar os dados atuais
async function carregarLicitacoes() {
  const routeModule = await import('../../route');
  
  // @ts-ignore
  licitacoes = routeModule.default?.licitacoes || [];
  
  if (!licitacoes || !Array.isArray(licitacoes)) {
    console.error('Erro ao carregar licitações: formato inválido');
    licitacoes = [];
  }
  
  return licitacoes;
}

// GET - Listar todos os documentos de uma licitação
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await carregarLicitacoes();
    
    const id = params.id;
    const licitacao = licitacoes.find(l => l.id === id);
    
    if (!licitacao) {
      return NextResponse.json(
        { error: 'Licitação não encontrada' },
        { status: 404 }
      );
    }
    
    // Se a licitação existir, retornar seus documentos (mesmo que seja um array vazio)
    return NextResponse.json(licitacao.documentos || []);
  } catch (error) {
    console.error('Erro ao buscar documentos da licitação:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar documentos da licitação' },
      { status: 500 }
    );
  }
}

// POST - Adicionar novo documento a uma licitação
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await carregarLicitacoes();
    
    const id = params.id;
    const index = licitacoes.findIndex(l => l.id === id);
    
    if (index === -1) {
      return NextResponse.json(
        { error: 'Licitação não encontrada' },
        { status: 404 }
      );
    }
    
    const data = await request.json();
    
    // Validação básica
    if (!data.nome || !data.tipo) {
      return NextResponse.json(
        { error: 'Nome e tipo do documento são obrigatórios' },
        { status: 400 }
      );
    }
    
    // Data atual para campos de auditoria
    const agora = new Date().toISOString();
    
    // Criar novo documento
    const novoDocumento: Documento = {
      id: `doc-${Date.now()}`,
      nome: data.nome,
      url: data.url || '',
      tipo: data.tipo,
      licitacaoId: id,
      dataCriacao: agora,
      dataAtualizacao: agora
    };
    
    // Adicionar o documento à licitação
    if (!licitacoes[index].documentos) {
      licitacoes[index].documentos = [];
    }
    
    licitacoes[index].documentos.push(novoDocumento);
    
    // Atualizar a data de atualização da licitação
    licitacoes[index].dataAtualizacao = agora;
    
    return NextResponse.json(novoDocumento, { status: 201 });
  } catch (error) {
    console.error('Erro ao adicionar documento:', error);
    return NextResponse.json(
      { error: 'Erro ao adicionar documento' },
      { status: 500 }
    );
  }
}

// DELETE - Remover todos os documentos de uma licitação
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await carregarLicitacoes();
    
    const id = params.id;
    const index = licitacoes.findIndex(l => l.id === id);
    
    if (index === -1) {
      return NextResponse.json(
        { error: 'Licitação não encontrada' },
        { status: 404 }
      );
    }
    
    // Data atual para campos de auditoria
    const agora = new Date().toISOString();
    
    // Guardar a contagem de documentos removidos
    const documentosRemovidos = licitacoes[index].documentos?.length || 0;
    
    // Remover todos os documentos
    licitacoes[index].documentos = [];
    
    // Atualizar a data de atualização da licitação
    licitacoes[index].dataAtualizacao = agora;
    
    return NextResponse.json(
      { message: `${documentosRemovidos} documento(s) removido(s) com sucesso` },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erro ao remover documentos:', error);
    return NextResponse.json(
      { error: 'Erro ao remover documentos' },
      { status: 500 }
    );
  }
}
