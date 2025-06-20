import { NextRequest, NextResponse } from 'next/server';
import { Nota } from '@/types/comercial';

// Simulau00e7u00e3o de banco de dados em memu00f3ria
let notas: Nota[] = [
  {
    id: "n1",
    oportunidadeId: "1",
    autor: "Ana Silva",
    autorId: "r1",
    data: "2023-05-23T10:30:00Z",
    texto: "Cliente possui urgu00eancia na implementau00e7u00e3o do sistema devido ao prazo legal que se encerra em agosto.",
  },
  {
    id: "n2",
    oportunidadeId: "1",
    autor: "Carlos Oliveira",
    autorId: "r2",
    data: "2023-05-27T14:45:00Z",
    texto: "Cliente solicitou detalhamento do mu00f3dulo de relatu00f3rios e exportau00e7u00e3o de dados.",
  },
  {
    id: "n3",
    oportunidadeId: "2",
    autor: "Carlos Oliveira",
    autorId: "r2",
    data: "2023-06-02T09:15:00Z",
    texto: "Reuniu00e3o agendada para apresentau00e7u00e3o da plataforma. Cliente demonstrou interesse especial no mu00f3dulo de avaliau00e7u00e3o.",
  },
  {
    id: "n4",
    oportunidadeId: "3",
    autor: "Ana Silva",
    autorId: "r1",
    data: "2023-06-10T11:30:00Z",
    texto: "Levantamento inicial realizado. Cliente possui infraestrutura antiga que precisaru00e1 de atualizau00e7u00e3o completa.",
  },
  {
    id: "n5",
    oportunidadeId: "4",
    autor: "Pedro Santos",
    autorId: "r3",
    data: "2023-06-15T16:00:00Z",
    texto: "Proposta enviada com detalhamento dos mu00f3dulos de rastreamento e controle de manutenau00e7u00e3o.",
  },
];

// GET - Listar todas as notas ou filtrar por oportunidade
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Filtrar por oportunidade
    const oportunidadeId = searchParams.get('oportunidadeId');
    
    let resultado = [...notas];
    
    if (oportunidadeId) {
      resultado = resultado.filter((nota) => nota.oportunidadeId === oportunidadeId);
    }
    
    // Ordenar por data (mais recente primeiro)
    resultado.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
    
    return NextResponse.json(resultado);
  } catch (error) {
    console.error('Erro ao buscar notas:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar notas' },
      { status: 500 }
    );
  }
}

// POST - Criar nova nota
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Validau00e7u00e3o bu00e1sica
    if (!data.oportunidadeId || !data.autor || !data.texto) {
      return NextResponse.json(
        { error: 'ID da oportunidade, autor e texto su00e3o obrigatu00f3rios' },
        { status: 400 }
      );
    }
    
    const novaNota: Nota = {
      id: `note-${Date.now()}`,
      oportunidadeId: data.oportunidadeId,
      autor: data.autor,
      autorId: data.autorId || 'user-unknown',
      data: new Date().toISOString(),
      texto: data.texto,
    };
    
    notas.push(novaNota);
    
    return NextResponse.json(novaNota, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar nota:', error);
    return NextResponse.json(
      { error: 'Erro ao criar nota' },
      { status: 500 }
    );
  }
}
