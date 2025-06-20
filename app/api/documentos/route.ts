import { NextRequest, NextResponse } from 'next/server';
import { Documento } from '@/types/licitacoes';
import * as fs from 'fs';
import * as path from 'path';

// Path para o arquivo de "banco de dados"
const dbPath = path.join(process.cwd(), 'data', 'documentos.json');

// Função para carregar os dados do arquivo
async function carregarDocumentos(): Promise<Documento[]> {
  try {
    // Garantir que o diretório existe
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Criar arquivo se não existir
    if (!fs.existsSync(dbPath)) {
      // Dados iniciais para o "banco de dados"
      const documentosIniciais: Documento[] = [
        {
          id: "1",
          nome: "Edital_Pregao_123.pdf",
          tipo: "Edital",
          url: "/documentos/sample/edital_pregao_123.pdf",
          dataCriacao: "2023-01-10T10:30:00Z",
          dataAtualizacao: "2023-01-10T10:30:00Z",
          licitacaoId: "1",
          tamanho: 2500000,
          arquivo: "Edital_Pregao_123.pdf",
        },
        {
          id: "2",
          nome: "Proposta_Comercial.docx",
          tipo: "Proposta",
          url: "/documentos/sample/proposta_comercial.docx",
          dataCriacao: "2023-01-15T14:20:00Z",
          dataAtualizacao: "2023-01-15T14:20:00Z",
          licitacaoId: "2",
          tamanho: 1800000,
          arquivo: "Proposta_Comercial.docx",
        },
        {
          id: "3",
          nome: "Certidao_Negativa.pdf",
          tipo: "Certidão",
          url: "/documentos/sample/certidao_negativa.pdf",
          dataCriacao: "2023-02-05T09:15:00Z",
          dataAtualizacao: "2023-02-05T09:15:00Z",
          licitacaoId: "1",
          tamanho: 500000,
          arquivo: "Certidao_Negativa.pdf",
        },
        {
          id: "4",
          nome: "Contrato_Assinado.pdf",
          tipo: "Contrato",
          url: "/documentos/sample/contrato_assinado.pdf",
          dataCriacao: "2023-03-10T16:45:00Z",
          dataAtualizacao: "2023-03-10T16:45:00Z",
          licitacaoId: "3",
          tamanho: 3200000,
          arquivo: "Contrato_Assinado.pdf",
        },
        {
          id: "5",
          nome: "Planilha_Orcamento.xlsx",
          tipo: "Planilha",
          url: "/documentos/sample/planilha_orcamento.xlsx",
          dataCriacao: "2023-04-20T11:30:00Z",
          dataAtualizacao: "2023-04-20T11:30:00Z",
          licitacaoId: "4",
          tamanho: 1200000,
          arquivo: "Planilha_Orcamento.xlsx",
        },
        {
          id: "6",
          nome: "Termo_Referencia.pdf",
          tipo: "Termo de Referência",
          url: "/documentos/sample/termo_referencia.pdf",
          dataCriacao: "2023-05-15T13:20:00Z",
          dataAtualizacao: "2023-05-15T13:20:00Z",
          licitacaoId: "2",
          tamanho: 4500000,
          arquivo: "Termo_Referencia.pdf",
        },
        {
          id: "7",
          nome: "Procuracao.pdf",
          tipo: "Procuração",
          url: "/documentos/sample/procuracao.pdf",
          dataCriacao: "2023-06-08T10:10:00Z",
          dataAtualizacao: "2023-06-08T10:10:00Z",
          licitacaoId: "5",
          tamanho: 800000,
          arquivo: "Procuracao.pdf",
        },
      ];
      
      fs.writeFileSync(dbPath, JSON.stringify(documentosIniciais, null, 2));
      return documentosIniciais;
    }
    
    // Ler do arquivo
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

// GET - Listar todos os documentos ou filtrar
export async function GET(request: NextRequest) {
  try {
    const documentos = await carregarDocumentos();
    const { searchParams } = new URL(request.url);
    
    // Parâmetros de filtro
    const termo = searchParams.get('termo')?.toLowerCase();
    const tipo = searchParams.get('tipo');
    const licitacaoId = searchParams.get('licitacaoId');
    const dataInicio = searchParams.get('dataInicio');
    const dataFim = searchParams.get('dataFim');
    
    // Aplicar filtros
    let documentosFiltrados = [...documentos];
    
    if (termo) {
      documentosFiltrados = documentosFiltrados.filter(doc => 
        doc.nome.toLowerCase().includes(termo)
      );
    }
    
    if (tipo && tipo !== 'todos') {
      documentosFiltrados = documentosFiltrados.filter(doc => doc.tipo === tipo);
    }
    
    if (licitacaoId && licitacaoId !== 'todos') {
      documentosFiltrados = documentosFiltrados.filter(doc => doc.licitacaoId === licitacaoId);
    }
    
    if (dataInicio) {
      const dataInicioObj = new Date(dataInicio);
      documentosFiltrados = documentosFiltrados.filter(doc => {
        const dataCriacao = new Date(doc.dataCriacao);
        return dataCriacao >= dataInicioObj;
      });
    }
    
    if (dataFim) {
      const dataFimObj = new Date(dataFim);
      documentosFiltrados = documentosFiltrados.filter(doc => {
        const dataCriacao = new Date(doc.dataCriacao);
        return dataCriacao <= dataFimObj;
      });
    }
    
    return NextResponse.json(documentosFiltrados);
  } catch (error) {
    console.error('Erro ao listar documentos:', error);
    return NextResponse.json(
      { error: 'Erro ao listar documentos' },
      { status: 500 }
    );
  }
}

// POST - Criar novo documento
export async function POST(request: NextRequest) {
  try {
    const documentos = await carregarDocumentos();
    const data = await request.json();
    
    // Validação básica
    if (!data.nome || !data.tipo) {
      return NextResponse.json(
        { error: 'Nome e tipo são campos obrigatórios' },
        { status: 400 }
      );
    }
    
    // Gerar ID único
    const id = `doc-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    // Timestamp para auditoria
    const agora = new Date().toISOString();
    
    // Criar novo documento
    const novoDocumento: Documento = {
      id,
      nome: data.nome,
      tipo: data.tipo,
      url: data.url || `/documentos/${id}/${data.nome}`,
      dataCriacao: agora,
      dataAtualizacao: agora,
      licitacaoId: data.licitacaoId || "",
      tamanho: data.tamanho || 0,
      arquivo: data.arquivo || data.nome,
    };
    
    // Adicionar ao "banco de dados"
    documentos.push(novoDocumento);
    await salvarDocumentos(documentos);
    
    return NextResponse.json(novoDocumento, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar documento:', error);
    return NextResponse.json(
      { error: 'Erro ao criar documento' },
      { status: 500 }
    );
  }
}
