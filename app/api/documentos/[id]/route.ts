import { NextRequest, NextResponse } from 'next/server';
import { Documento } from '@/types/licitacoes';
import * as fs from 'fs';
import * as path from 'path';

// Path para o arquivo de "banco de dados"
const dbPath = path.join(process.cwd(), 'data', 'documentos.json');

// Função para carregar os dados do arquivo
async function carregarDocumentos(): Promise<Documento[]> {
  try {
    if (!fs.existsSync(dbPath)) {
      console.error('Arquivo de documentos não encontrado');
      return [];
    }
    
    const data = fs.readFileSync(dbPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Erro ao carregar documentos:', error);
    return [];
  }
}

// Função para salvar os dados no arquivo
async function salvarDocumentos(documentos: Documento[]): Promise<void> {
  try {
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(dbPath, JSON.stringify(documentos, null, 2));
  } catch (error) {
    console.error('Erro ao salvar documentos:', error);
  }
}

// GET - Obter um documento específico
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const documentos = await carregarDocumentos();
    const id = params.id;
    
    const documento = documentos.find(doc => doc.id === id);
    
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

// PUT - Atualizar um documento (substituição completa)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const documentos = await carregarDocumentos();
    const id = params.id;
    const index = documentos.findIndex(doc => doc.id === id);
    
    if (index === -1) {
      return NextResponse.json(
        { error: 'Documento não encontrado' },
        { status: 404 }
      );
    }
    
    const data = await request.json();
    
    // Validação básica
    if (!data.nome || !data.tipo) {
      return NextResponse.json(
        { error: 'Nome e tipo são campos obrigatórios' },
        { status: 400 }
      );
    }
    
    // Timestamp para auditoria
    const agora = new Date().toISOString();
    
    // Atualizar documento
    const documentoAtualizado: Documento = {
      ...documentos[index],
      nome: data.nome,
      tipo: data.tipo,
      url: data.url || documentos[index].url,
      dataAtualizacao: agora,
      licitacaoId: data.licitacaoId || documentos[index].licitacaoId,
      tamanho: data.tamanho !== undefined ? data.tamanho : documentos[index].tamanho,
      arquivo: data.arquivo || documentos[index].arquivo,
    };
    
    // Atualizar no "banco de dados"
    documentos[index] = documentoAtualizado;
    await salvarDocumentos(documentos);
    
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
  { params }: { params: { id: string } }
) {
  try {
    const documentos = await carregarDocumentos();
    const id = params.id;
    const index = documentos.findIndex(doc => doc.id === id);
    
    if (index === -1) {
      return NextResponse.json(
        { error: 'Documento não encontrado' },
        { status: 404 }
      );
    }
    
    const data = await request.json();
    
    // Timestamp para auditoria
    const agora = new Date().toISOString();
    
    // Atualizar documento (apenas os campos fornecidos)
    const documentoAtualizado: Documento = {
      ...documentos[index],
      ...data,
      id: documentos[index].id, // Garantir que o ID não mude
      dataAtualizacao: agora,
    };
    
    // Atualizar no "banco de dados"
    documentos[index] = documentoAtualizado;
    await salvarDocumentos(documentos);
    
    return NextResponse.json(documentoAtualizado);
  } catch (error) {
    console.error('Erro ao atualizar documento parcialmente:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar documento parcialmente' },
      { status: 500 }
    );
  }
}

// DELETE - Excluir um documento
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const documentos = await carregarDocumentos();
    const id = params.id;
    const index = documentos.findIndex(doc => doc.id === id);
    
    if (index === -1) {
      return NextResponse.json(
        { error: 'Documento não encontrado' },
        { status: 404 }
      );
    }
    
    // Remover do array
    const documentoRemovido = documentos.splice(index, 1)[0];
    
    // Salvar no "banco de dados"
    await salvarDocumentos(documentos);
    
    return NextResponse.json({ 
      message: 'Documento excluído com sucesso',
      documento: documentoRemovido
    });
  } catch (error) {
    console.error('Erro ao excluir documento:', error);
    return NextResponse.json(
      { error: 'Erro ao excluir documento' },
      { status: 500 }
    );
  }
}
