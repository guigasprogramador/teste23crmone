import { NextRequest, NextResponse } from 'next/server';
import { Responsavel } from '@/types/comercial';

// Simulação de banco de dados em memória (mesma do arquivo anterior)
let responsaveis: Responsavel[] = [
  {
    id: "r1",
    nome: "Ana Silva",
    email: "ana.silva@empresa.com",
    cargo: "Gerente Comercial",
    departamento: "Comercial",
    ativo: true,
  },
  {
    id: "r2",
    nome: "Carlos Oliveira",
    email: "carlos.oliveira@empresa.com",
    cargo: "Consultor de Vendas",
    departamento: "Comercial",
    ativo: true,
  },
  {
    id: "r3",
    nome: "Pedro Santos",
    email: "pedro.santos@empresa.com",
    cargo: "Analista de Negócios",
    departamento: "Comercial",
    ativo: true,
  },
  {
    id: "r4",
    nome: "Maria Souza",
    email: "maria.souza@empresa.com",
    cargo: "Diretora Comercial",
    departamento: "Diretoria",
    ativo: true,
  },
];

// GET - Obter um responsável específico
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const responsavel = responsaveis.find((r) => r.id === id);
    
    if (!responsavel) {
      return NextResponse.json(
        { error: 'Responsável não encontrado' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(responsavel);
  } catch (error) {
    console.error('Erro ao buscar responsável:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar responsável' },
      { status: 500 }
    );
  }
}

// PUT - Atualizar um responsável
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const data = await request.json();
    
    const index = responsaveis.findIndex((r) => r.id === id);
    
    if (index === -1) {
      return NextResponse.json(
        { error: 'Responsável não encontrado' },
        { status: 404 }
      );
    }
    
    // Atualizar responsável
    const responsavelAtualizado = {
      ...responsaveis[index],
      ...data,
    };
    
    responsaveis[index] = responsavelAtualizado;
    
    return NextResponse.json(responsavelAtualizado);
  } catch (error) {
    console.error('Erro ao atualizar responsável:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar responsável' },
      { status: 500 }
    );
  }
}

// DELETE - Desativar um responsável (não excluir permanentemente)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const index = responsaveis.findIndex((r) => r.id === id);
    
    if (index === -1) {
      return NextResponse.json(
        { error: 'Responsável não encontrado' },
        { status: 404 }
      );
    }
    
    // Desativar responsável em vez de excluir
    responsaveis[index] = {
      ...responsaveis[index],
      ativo: false,
    };
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao desativar responsável:', error);
    return NextResponse.json(
      { error: 'Erro ao desativar responsável' },
      { status: 500 }
    );
  }
}
