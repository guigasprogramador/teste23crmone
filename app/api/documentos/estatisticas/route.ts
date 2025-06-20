import { NextRequest, NextResponse } from 'next/server';
import { Documento } from '@/types/licitacoes';
import * as fs from 'fs';
import * as path from 'path';

// Path para o arquivo de "banco de dados"
const dbPath = path.join(process.cwd(), 'data', 'documentos.json');

// Interface para estatísticas de documentos
interface DocumentoEstatisticas {
  total: number;
  vencemEm30Dias: number;
  porTipo: Record<string, number>;
  porLicitacao: Record<string, number>;
  tamanhoTotal: number; // em bytes
}

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

// GET - Obter estatísticas de documentos
export async function GET(request: NextRequest) {
  try {
    const documentos = await carregarDocumentos();
    
    // Data atual e data daqui a 30 dias
    const dataAtual = new Date();
    const data30Dias = new Date();
    data30Dias.setDate(dataAtual.getDate() + 30);
    
    // Calcular estatísticas
    const estatisticas: DocumentoEstatisticas = {
      total: documentos.length,
      vencemEm30Dias: 0, // Podemos implementar isso se tivermos um campo de validade nos documentos
      porTipo: {},
      porLicitacao: {},
      tamanhoTotal: 0,
    };
    
    // Contar documentos por tipo e licitação, e calcular tamanho total
    documentos.forEach(doc => {
      // Contagem por tipo
      if (doc.tipo) {
        estatisticas.porTipo[doc.tipo] = (estatisticas.porTipo[doc.tipo] || 0) + 1;
      }
      
      // Contagem por licitação
      if (doc.licitacaoId) {
        estatisticas.porLicitacao[doc.licitacaoId] = (estatisticas.porLicitacao[doc.licitacaoId] || 0) + 1;
      }
      
      // Tamanho total
      if (doc.tamanho) {
        estatisticas.tamanhoTotal += doc.tamanho;
      }
      
      // Simulação para documentos que vencem em 30 dias (para fins de demonstração)
      // Na implementação real, você teria um campo de data de validade
      if (Math.random() < 0.2) { // 20% dos documentos simulados como vencendo em 30 dias
        estatisticas.vencemEm30Dias++;
      }
    });
    
    return NextResponse.json(estatisticas);
  } catch (error) {
    console.error('Erro ao obter estatísticas de documentos:', error);
    return NextResponse.json(
      { error: 'Erro ao obter estatísticas de documentos' },
      { status: 500 }
    );
  }
}
