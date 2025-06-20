import { NextRequest, NextResponse } from 'next/server';
import { crmonefactory } from '@/lib/supabase/client';

// GET - Listar categorias de documentos
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parâmetros de filtro
    const ativo = searchParams.get('ativo');
    
    // Iniciar a consulta
    let query = crmonefactory
      .from('documento_categorias')
      .select('*');
    
    // Aplicar filtros se existirem
    if (ativo !== null) {
      query = query.eq('ativo', ativo === 'true');
    }
    
    // Ordenar por nome
    query = query.order('nome', { ascending: true });
    
    // Executar a consulta
    const { data, error } = await query;
    
    if (error) {
      console.error('Erro ao consultar categorias de documentos:', error);
      return NextResponse.json(
        { error: 'Erro ao listar categorias: ' + error.message },
        { status: 500 }
      );
    }
    
    // Formatar os dados
    const categorias = data.map(categoria => ({
      id: categoria.id,
      nome: categoria.nome,
      descricao: categoria.descricao,
      ativo: categoria.ativo,
      cor: categoria.cor,
      icone: categoria.icone,
      dataCriacao: categoria.data_criacao,
      dataAtualizacao: categoria.data_atualizacao
    }));
    
    return NextResponse.json(categorias);
  } catch (error) {
    console.error('Erro ao listar categorias de documentos:', error);
    return NextResponse.json(
      { error: 'Erro interno ao processar categorias de documentos' },
      { status: 500 }
    );
  }
}

// POST - Criar nova categoria de documento
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Validar dados básicos
    if (!data.nome) {
      return NextResponse.json(
        { error: 'Nome da categoria é obrigatório' },
        { status: 400 }
      );
    }
    
    // Preparar o objeto para inserção
    const categoria = {
      nome: data.nome,
      descricao: data.descricao,
      ativo: data.ativo !== false, // Default true
      cor: data.cor || '#007bff',
      icone: data.icone
    };
    
    // Inserir a categoria
    const { data: categoriaInserida, error } = await crmonefactory
      .from('documento_categorias')
      .insert(categoria)
      .select()
      .single();
    
    if (error) {
      console.error('Erro ao criar categoria:', error);
      return NextResponse.json(
        { error: 'Erro ao criar categoria: ' + error.message },
        { status: 500 }
      );
    }
    
    // Formatar para retorno
    const categoriaFormatada = {
      id: categoriaInserida.id,
      nome: categoriaInserida.nome,
      descricao: categoriaInserida.descricao,
      ativo: categoriaInserida.ativo,
      cor: categoriaInserida.cor,
      icone: categoriaInserida.icone,
      dataCriacao: categoriaInserida.data_criacao,
      dataAtualizacao: categoriaInserida.data_atualizacao
    };
    
    return NextResponse.json(categoriaFormatada, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar categoria de documento:', error);
    return NextResponse.json(
      { error: 'Erro interno ao criar categoria de documento' },
      { status: 500 }
    );
  }
}
