import { NextRequest, NextResponse } from 'next/server';
import { Orgao } from '@/types/licitacoes';
import { crmonefactory } from '@/lib/supabase/client';

// GET - Listar órgãos
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parâmetros de filtro
    const termo = searchParams.get('termo');
    const segmento = searchParams.get('segmento');
    const estado = searchParams.get('estado');
    const ativo = searchParams.get('ativo');
    
    // Iniciar a consulta
    let query = crmonefactory
      .from('orgaos')
      .select(`
        *,
        orgao_contatos (
          id,
          nome,
          cargo,
          email,
          telefone
        )
      `);
    
    // Aplicar filtros se existirem
    if (termo) {
      query = query.or(`nome.ilike.%${termo}%,cnpj.ilike.%${termo}%`);
    }
    
    if (segmento) {
      query = query.eq('segmento', segmento);
    }
    
    if (estado) {
      query = query.eq('estado', estado);
    }
    
    if (ativo) {
      query = query.eq('ativo', ativo === 'true');
    }
    
    // Ordenar por nome
    query = query.order('nome', { ascending: true });
    
    // Executar a consulta
    const { data, error } = await query;
    
    if (error) {
      console.error('Erro ao consultar órgãos:', error);
      return NextResponse.json(
        { error: 'Erro ao listar órgãos: ' + error.message },
        { status: 500 }
      );
    }
    
    // Formatar os dados para o formato esperado pelo frontend
    const orgaos = data.map(formatarOrgao);
    
    return NextResponse.json(orgaos);
  } catch (error) {
    console.error('Erro ao listar órgãos:', error);
    return NextResponse.json(
      { error: 'Erro interno ao processar órgãos' },
      { status: 500 }
    );
  }
}

// POST - Criar novo órgão
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Validar dados básicos
    if (!data.nome) {
      return NextResponse.json(
        { error: 'Nome do órgão é obrigatório' },
        { status: 400 }
      );
    }
    
    // Extrair contatos para inserção separada
    const { contatos, ...orgaoData } = data;
    
    // Preparar o objeto para inserção
    const orgao = {
      nome: orgaoData.nome,
      tipo: orgaoData.tipo,
      cnpj: orgaoData.cnpj,
      endereco: orgaoData.endereco,
      cidade: orgaoData.cidade,
      estado: orgaoData.estado,
      segmento: orgaoData.segmento,
      origem_lead: orgaoData.origemLead,
      responsavel_interno: orgaoData.responsavelInterno,
      descricao: orgaoData.descricao,
      observacoes: orgaoData.observacoes,
      faturamento: orgaoData.faturamento,
      ativo: orgaoData.ativo !== false // Default true
    };
    
    // Inserir o órgão
    const { data: orgaoInserido, error } = await crmonefactory
      .from('orgaos')
      .insert(orgao)
      .select()
      .single();
    
    if (error) {
      console.error('Erro ao criar órgão:', error);
      return NextResponse.json(
        { error: 'Erro ao criar órgão: ' + error.message },
        { status: 500 }
      );
    }
    
    // Inserir contatos associados, se houver
    if (contatos && contatos.length > 0 && orgaoInserido.id) {
      const contatosParaInserir = contatos.map((contato: any) => ({
        orgao_id: orgaoInserido.id,
        nome: contato.nome,
        cargo: contato.cargo,
        email: contato.email,
        telefone: contato.telefone
      }));
      
      const { error: contatosError } = await crmonefactory
        .from('orgao_contatos')
        .insert(contatosParaInserir);
      
      if (contatosError) {
        console.error('Erro ao inserir contatos do órgão:', contatosError);
      }
    }
    
    // Buscar o órgão completo com contatos
    const { data: orgaoCompleto, error: fetchError } = await crmonefactory
      .from('orgaos')
      .select(`
        *,
        orgao_contatos (
          id, 
          nome,
          cargo,
          email,
          telefone
        )
      `)
      .eq('id', orgaoInserido.id)
      .single();
    
    if (fetchError) {
      console.error('Erro ao buscar órgão completo:', fetchError);
      // Retornar o órgão mesmo sem os contatos
      return NextResponse.json(formatarOrgao(orgaoInserido), { status: 201 });
    }
    
    return NextResponse.json(formatarOrgao(orgaoCompleto), { status: 201 });
  } catch (error) {
    console.error('Erro ao criar órgão:', error);
    return NextResponse.json(
      { error: 'Erro interno ao criar órgão' },
      { status: 500 }
    );
  }
}

// Função auxiliar para formatar o órgão no formato esperado pelo frontend
function formatarOrgao(item: any): Orgao {
  return {
    id: item.id,
    nome: item.nome,
    tipo: item.tipo,
    cnpj: item.cnpj,
    endereco: item.endereco,
    cidade: item.cidade,
    estado: item.estado,
    segmento: item.segmento,
    origemLead: item.origem_lead,
    responsavelInterno: item.responsavel_interno,
    descricao: item.descricao,
    observacoes: item.observacoes,
    faturamento: item.faturamento,
    contatos: item.orgao_contatos ? item.orgao_contatos.map((contato: any) => ({
      id: contato.id,
      nome: contato.nome,
      cargo: contato.cargo,
      email: contato.email,
      telefone: contato.telefone
    })) : [],
    dataCriacao: item.data_criacao,
    dataAtualizacao: item.data_atualizacao,
    ativo: item.ativo
  };
}
