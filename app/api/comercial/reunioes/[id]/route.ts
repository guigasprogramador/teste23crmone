import { NextRequest, NextResponse } from 'next/server';
import { Reuniao } from '@/types/comercial';

// Simulação de banco de dados em memória (mesma do arquivo anterior)
let reunioes: Reuniao[] = [
  {
    id: "r1",
    oportunidadeId: "1",
    titulo: "Apresentação inicial",
    data: "2023-06-15",
    hora: "14:30",
    local: "Online - Microsoft Teams",
    participantes: ["Ana Silva", "João Silva"],
    notas: "Apresentar portfólio de soluções e entender necessidades específicas.",
    concluida: false,
  },
  {
    id: "r2",
    oportunidadeId: "2",
    titulo: "Demonstração de produto",
    data: "2023-06-20",
    hora: "10:00",
    local: "Sede do cliente",
    participantes: ["Carlos Oliveira", "Maria Oliveira", "Pedro Santos"],
    notas: "Demonstrar módulos específicos solicitados pelo cliente.",
    concluida: false,
  },
  {
    id: "r3",
    oportunidadeId: "3",
    titulo: "Levantamento técnico",
    data: "2023-06-25",
    hora: "09:30",
    local: "Hospital Municipal",
    participantes: ["Ana Silva", "Roberto Santos", "Técnico de TI"],
    notas: "Avaliar infraestrutura atual e requisitos técnicos.",
    concluida: false,
  },
  {
    id: "r4",
    oportunidadeId: "4",
    titulo: "Apresentação da proposta",
    data: "2023-06-10",
    hora: "15:00",
    local: "Online - Zoom",
    participantes: ["Pedro Santos", "Carlos Ferreira", "Equipe de Logística"],
    notas: "Apresentar proposta detalhada com cronograma de implementação.",
    concluida: true,
  },
  {
    id: "r5",
    oportunidadeId: "5",
    titulo: "Negociação de valores",
    data: "2023-06-30",
    hora: "11:00",
    local: "Escritório central",
    participantes: ["Carlos Oliveira", "Ana Pereira", "Diretor Financeiro"],
    notas: "Discutir condições comerciais e possíveis descontos.",
    concluida: false,
  },
];

// GET - Obter uma reunião específica
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const reuniao = reunioes.find((r) => r.id === id);
    
    if (!reuniao) {
      return NextResponse.json(
        { error: 'Reunião não encontrada' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(reuniao);
  } catch (error) {
    console.error('Erro ao buscar reunião:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar reunião' },
      { status: 500 }
    );
  }
}

// PUT - Atualizar uma reunião
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const data = await request.json();
    
    const index = reunioes.findIndex((r) => r.id === id);
    
    if (index === -1) {
      return NextResponse.json(
        { error: 'Reunião não encontrada' },
        { status: 404 }
      );
    }
    
    // Atualizar reunião
    const reuniaoAtualizada = {
      ...reunioes[index],
      ...data,
    };
    
    reunioes[index] = reuniaoAtualizada;
    
    return NextResponse.json(reuniaoAtualizada);
  } catch (error) {
    console.error('Erro ao atualizar reunião:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar reunião' },
      { status: 500 }
    );
  }
}

// PATCH - Marcar reunião como concluída
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const { concluida, notas } = await request.json();
    
    const index = reunioes.findIndex((r) => r.id === id);
    
    if (index === -1) {
      return NextResponse.json(
        { error: 'Reunião não encontrada' },
        { status: 404 }
      );
    }
    
    // Atualizar status da reunião
    reunioes[index] = {
      ...reunioes[index],
      concluida: concluida !== undefined ? concluida : reunioes[index].concluida,
      notas: notas !== undefined ? notas : reunioes[index].notas,
    };
    
    return NextResponse.json(reunioes[index]);
  } catch (error) {
    console.error('Erro ao atualizar status da reunião:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar status da reunião' },
      { status: 500 }
    );
  }
}

// DELETE - Excluir uma reunião
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const index = reunioes.findIndex((r) => r.id === id);
    
    if (index === -1) {
      return NextResponse.json(
        { error: 'Reunião não encontrada' },
        { status: 404 }
      );
    }
    
    // Remover reunião
    reunioes.splice(index, 1);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao excluir reunião:', error);
    return NextResponse.json(
      { error: 'Erro ao excluir reunião' },
      { status: 500 }
    );
  }
}
