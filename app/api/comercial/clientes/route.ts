import { NextRequest, NextResponse } from 'next/server';
import { Cliente } from '@/types/comercial';
import { supabase, crmonefactory } from "@/lib/supabase/client";

// GET - Listar todos os clientes ou filtrar
export async function GET(request: NextRequest) {
  try {
    console.log('Iniciando busca de clientes');
    const { searchParams } = new URL(request.url);
    
    // Parâmetros de filtro
    const termo = searchParams.get('termo');
    const segmento = searchParams.get('segmento');
    const ativo = searchParams.get('ativo');
    
    console.log('Filtros aplicados:', { termo, segmento, ativo });
    
    // Consulta base - Garantindo que estamos usando a tabela no schema crmonefactory
    let query = crmonefactory.from('clientes').select('*');
    
    // Aplicar filtros
    if (termo) {
      const termoBusca = `%${termo}%`;
      query = query.or(`nome.ilike.${termoBusca},cnpj.ilike.${termoBusca},contato_nome.ilike.${termoBusca},contato_email.ilike.${termoBusca}`);
    }
    
    if (segmento && segmento !== 'todos') {
      query = query.eq('segmento', segmento);
    }
    
    if (ativo !== null && ativo !== undefined) {
      const ativoBoolean = ativo === 'true';
      query = query.eq('ativo', ativoBoolean);
    }
    
    console.log('Executando consulta no Supabase');
    // Executar consulta
    const { data, error } = await query.order('nome');
    
    console.log('Resultado da consulta:', { encontrados: data?.length || 0, erro: error });
    
    if (error) {
      console.error('Erro ao buscar clientes do Supabase:', error);
      return NextResponse.json(
        { error: `Erro ao buscar clientes: ${error.message}` },
        { status: 500 }
      );
    }
    
    if (!data || data.length === 0) {
      console.log('Nenhum cliente encontrado');
      return NextResponse.json([]);
    }
    
    // Transformar para o formato esperado pelo frontend
    const clientesFormatados = data.map((cliente: any) => ({
      id: cliente.id,
      nome: cliente.nome,
      cnpj: cliente.cnpj,
      contatoNome: cliente.contato_nome,
      contatoTelefone: cliente.contato_telefone,
      contatoEmail: cliente.contato_email,
      endereco: cliente.endereco,
      segmento: cliente.segmento,
      dataCadastro: cliente.data_cadastro,
      ativo: cliente.ativo,
      // Campos adicionais
      cidade: cliente.cidade,
      estado: cliente.estado,
      descricao: cliente.descricao,
      observacoes: cliente.observacoes,
      faturamento: cliente.faturamento
    }));
    
    console.log(`Retornando ${clientesFormatados.length} clientes formatados`);
    return NextResponse.json(clientesFormatados);
  } catch (error) {
    console.error('Erro ao processar requisição de clientes:', error);
    return NextResponse.json(
      { error: 'Erro interno ao processar requisição de clientes' },
      { status: 500 }
    );
  }
}

// POST - Criar novo cliente
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Validação básica
    if (!data.nome || !data.cnpj || !data.contatoNome || !data.contatoEmail) {
      return NextResponse.json(
        { error: 'Nome, CNPJ, nome de contato e email são obrigatórios' },
        { status: 400 }
      );
    }
    
    // Converter para o formato do banco de dados
    const clienteDB = {
      nome: data.nome,
      cnpj: data.cnpj,
      contato_nome: data.contatoNome,
      contato_telefone: data.contatoTelefone || '',
      contato_email: data.contatoEmail,
      endereco: data.endereco,
      segmento: data.segmento || 'Outros',
      cidade: data.cidade,
      estado: data.estado,
      data_cadastro: new Date().toISOString(),
      ativo: true,
      descricao: data.descricao,
      observacoes: data.observacoes,
      faturamento: data.faturamento,
      responsavel_interno: data.responsavelInterno
    };
    
    // Inserir no Supabase
    const { data: novoCliente, error } = await crmonefactory
      .from('clientes')
      .insert(clienteDB)
      .select()
      .single();
      
    if (error) {
      console.error('Erro ao criar cliente no Supabase:', error);
      return NextResponse.json(
        { error: `Erro ao criar cliente: ${error.message}` },
        { status: 500 }
      );
    }
    
    // Transformar para o formato esperado pelo frontend
    const clienteFormatado = {
      id: novoCliente.id,
      nome: novoCliente.nome,
      cnpj: novoCliente.cnpj,
      contatoNome: novoCliente.contato_nome,
      contatoTelefone: novoCliente.contato_telefone,
      contatoEmail: novoCliente.contato_email,
      endereco: novoCliente.endereco,
      segmento: novoCliente.segmento,
      dataCadastro: novoCliente.data_cadastro,
      ativo: novoCliente.ativo,
      // Campos adicionais
      cidade: novoCliente.cidade,
      estado: novoCliente.estado,
      descricao: novoCliente.descricao,
      observacoes: novoCliente.observacoes,
      faturamento: novoCliente.faturamento
    };
    
    return NextResponse.json(clienteFormatado, { status: 201 });
  } catch (error) {
    console.error('Erro ao processar criação de cliente:', error);
    return NextResponse.json(
      { error: 'Erro interno ao processar criação de cliente' },
      { status: 500 }
    );
  }
}
