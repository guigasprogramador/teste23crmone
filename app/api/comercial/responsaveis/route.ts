import { NextRequest, NextResponse } from 'next/server';
import { Responsavel } from '@/types/comercial';

// Simulação de banco de dados em memória
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

// GET - Listar todos os responsáveis ou filtrar
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parâmetros de filtro
    const termo = searchParams.get('termo');
    const departamento = searchParams.get('departamento');
    const ativo = searchParams.get('ativo');
    
    let resultado = [...responsaveis];
    
    // Aplicar filtros
    if (termo) {
      const termoBusca = termo.toLowerCase();
      resultado = resultado.filter(
        (item) =>
          item.nome.toLowerCase().includes(termoBusca) ||
          item.email.toLowerCase().includes(termoBusca) ||
          (item.cargo && item.cargo.toLowerCase().includes(termoBusca))
      );
    }
    
    if (departamento && departamento !== 'todos') {
      resultado = resultado.filter((item) => item.departamento === departamento);
    }
    
    if (ativo !== null && ativo !== undefined) {
      const ativoBoolean = ativo === 'true';
      resultado = resultado.filter((item) => item.ativo === ativoBoolean);
    }
    
    return NextResponse.json(resultado);
  } catch (error) {
    console.error('Erro ao buscar responsáveis:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar responsáveis' },
      { status: 500 }
    );
  }
}

// POST - Criar novo responsável
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Validação básica
    if (!data.nome || !data.email) {
      return NextResponse.json(
        { error: 'Nome e email são obrigatórios' },
        { status: 400 }
      );
    }
    
    const novoResponsavel: Responsavel = {
      id: `resp-${Date.now()}`,
      nome: data.nome,
      email: data.email,
      cargo: data.cargo || '',
      departamento: data.departamento || 'Comercial',
      ativo: true,
    };
    
    responsaveis.push(novoResponsavel);
    
    return NextResponse.json(novoResponsavel, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar responsável:', error);
    return NextResponse.json(
      { error: 'Erro ao criar responsável' },
      { status: 500 }
    );
  }
}
