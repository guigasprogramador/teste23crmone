import { NextRequest, NextResponse } from 'next/server';
import { Licitacao, Documento } from '@/types/licitacoes';

// Referência ao "banco de dados" na memória
let licitacoes: Licitacao[] = [];

// Função para carregar os dados atuais
async function carregarLicitacoes() {
  const routeModule = await import('../../../route');
  
  // @ts-ignore
  licitacoes = routeModule.default?.licitacoes || [];
  
  if (!licitacoes || !Array.isArray(licitacoes)) {
    console.error('Erro ao carregar licitações: formato inválido');
    licitacoes = [];
  }
  
  return licitacoes;
}

// GET - Obter um documento específico
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; documentoId: string } }
) {
  try {
    await carregarLicitacoes();
    
    const { id, documentoId } = params;
    const licitacao = licitacoes.find(l => l.id === id);
    
    if (!licitacao) {
      return NextResponse.json(
        { error: 'Licitação não encontrada' },
        { status: 404 }
      );
    }
    
    const documento = licitacao.documentos?.find(d => d.id === documentoId);
    
    if (!documento) {
      return NextResponse.json(
        { error: 'Documento não encontrado' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(documento);
  } catch (error) {
    console.error('Erro ao buscar documento:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar documento' },
      { status: 500 }
    );
  }
}

// PUT - Atualizar um documento específico
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; documentoId: string } }
) {
  try {
    await carregarLicitacoes();
    
    const { id, documentoId } = params;
    const licitacaoIndex = licitacoes.findIndex(l => l.id === id);
    
    if (licitacaoIndex === -1) {
      return NextResponse.json(
        { error: 'Licitação não encontrada' },
        { status: 404 }
      );
    }
    
    const documentoIndex = licitacoes[licitacaoIndex].documentos?.findIndex(d => d.id === documentoId) ?? -1;
    
    if (documentoIndex === -1) {
      return NextResponse.json(
        { error: 'Documento não encontrado' },
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
    
    // Criar documento atualizado
    const documentoAtualizado: Documento = {
      ...licitacoes[licitacaoIndex].documentos![documentoIndex],
      nome: data.nome,
      url: data.url || licitacoes[licitacaoIndex].documentos![documentoIndex].url,
      tipo: data.tipo,
      dataAtualizacao: agora
    };
    
    // Atualizar o documento na licitação
    licitacoes[licitacaoIndex].documentos![documentoIndex] = documentoAtualizado;
    
    // Atualizar a data de atualização da licitação
    licitacoes[licitacaoIndex].dataAtualizacao = agora;
    
    return NextResponse.json(documentoAtualizado);
  } catch (error) {
    console.error('Erro ao atualizar documento:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar documento' },
      { status: 500 }
    );
  }
}

// PATCH - Atualizar parcialmente um documento
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; documentoId: string } }
) {
  try {
    await carregarLicitacoes();
    
    const { id, documentoId } = params;
    const licitacaoIndex = licitacoes.findIndex(l => l.id === id);
    
    if (licitacaoIndex === -1) {
      return NextResponse.json(
        { error: 'Licitação não encontrada' },
        { status: 404 }
      );
    }
    
    const documentoIndex = licitacoes[licitacaoIndex].documentos?.findIndex(d => d.id === documentoId) ?? -1;
    
    if (documentoIndex === -1) {
      return NextResponse.json(
        { error: 'Documento não encontrado' },
        { status: 404 }
      );
    }
    
    const data = await request.json();
    
    // Data atual para campos de auditoria
    const agora = new Date().toISOString();
    
    // Criar documento atualizado (apenas os campos fornecidos)
    const documentoAtualizado: Documento = {
      ...licitacoes[licitacaoIndex].documentos![documentoIndex],
      ...data,
      id: documentoId, // Garantir que o ID não seja alterado
      licitacaoId: id, // Garantir que o ID da licitação não seja alterado
      dataAtualizacao: agora
    };
    
    // Atualizar o documento na licitação
    licitacoes[licitacaoIndex].documentos![documentoIndex] = documentoAtualizado;
    
    // Atualizar a data de atualização da licitação
    licitacoes[licitacaoIndex].dataAtualizacao = agora;
    
    return NextResponse.json(documentoAtualizado);
  } catch (error) {
    console.error('Erro ao atualizar documento parcialmente:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar documento' },
      { status: 500 }
    );
  }
}

// DELETE - Excluir um documento específico
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; documentoId: string } }
) {
  try {
    await carregarLicitacoes();
    
    const { id, documentoId } = params;
    const licitacaoIndex = licitacoes.findIndex(l => l.id === id);
    
    if (licitacaoIndex === -1) {
      return NextResponse.json(
        { error: 'Licitação não encontrada' },
        { status: 404 }
      );
    }
    
    const documentoIndex = licitacoes[licitacaoIndex].documentos?.findIndex(d => d.id === documentoId) ?? -1;
    
    if (documentoIndex === -1) {
      return NextResponse.json(
        { error: 'Documento não encontrado' },
        { status: 404 }
      );
    }
    
    // Guardar o documento para retornar na resposta
    const documentoRemovido = licitacoes[licitacaoIndex].documentos![documentoIndex];
    
    // Remover o documento
    licitacoes[licitacaoIndex].documentos!.splice(documentoIndex, 1);
    
    // Atualizar a data de atualização da licitação
    const agora = new Date().toISOString();
    licitacoes[licitacaoIndex].dataAtualizacao = agora;
    
    return NextResponse.json(
      { 
        message: 'Documento removido com sucesso', 
        documento: documentoRemovido 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erro ao remover documento:', error);
    return NextResponse.json(
      { error: 'Erro ao remover documento' },
      { status: 500 }
    );
  }
}
