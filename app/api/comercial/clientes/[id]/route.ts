import { NextRequest, NextResponse } from 'next/server';
import { Cliente } from '@/types/comercial';
import { supabase, crmonefactory } from "@/lib/supabase/client";

// GET - Obter um cliente específico
export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    // Obter o ID dos parâmetros da rota e decodificar
    const { id } = context.params;
    const idOuNome = decodeURIComponent(id);
    let cliente;
    let error;
    
    console.log('Buscando cliente com parâmetro:', idOuNome);
    
    // Verificar se o parâmetro é um UUID válido
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const isUuid = uuidRegex.test(idOuNome);
    
    if (isUuid) {
      // Buscar por ID
      console.log('Buscando cliente por ID:', idOuNome);
      const result = await crmonefactory
        .from('clientes')
        .select('*')
        .eq('id', idOuNome)
        .single();
      
      cliente = result.data;
      error = result.error;
      
      if (cliente) {
        console.log('Cliente encontrado por ID:', cliente.nome);
      } else {
        console.log('Nenhum cliente encontrado com o ID:', idOuNome);
      }
    } else {
      // Buscar por nome (usando % para busca parcial)
      console.log('Buscando cliente por nome:', idOuNome);
      
      // Primeiro tenta busca exata
      let result = await crmonefactory
        .from('clientes')
        .select('*')
        .eq('nome', idOuNome)
        .limit(1);
      
      // Se não encontrar com busca exata, tenta com ILIKE
      if (!result.data || result.data.length === 0) {
        result = await crmonefactory
          .from('clientes')
          .select('*')
          .ilike('nome', `%${idOuNome}%`)
          .limit(5);
      }
      
      // Verificar se encontrou resultados
      if (result.data && result.data.length > 0) {
        cliente = result.data[0];
        console.log('Cliente encontrado por nome:', cliente.nome);
      } else {
        cliente = null;
        console.log('Nenhum cliente encontrado com o nome:', idOuNome);
      }
      error = result.error;
    }
    
    if (error) {
      console.error('Erro ao buscar cliente do Supabase:', error);
      return NextResponse.json(
        { error: `Erro ao buscar cliente: ${error.message}` },
        { status: 500 }
      );
    }
    
    if (!cliente) {
      return NextResponse.json(
        { error: 'Cliente não encontrado' },
        { status: 404 }
      );
    }
    
    // Transformar para o formato esperado pelo frontend
    const clienteFormatado = {
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
    };
    
    return NextResponse.json(clienteFormatado);
  } catch (error) {
    console.error('Erro ao processar requisição de cliente:', error);
    return NextResponse.json(
      { error: 'Erro interno ao processar requisição de cliente' },
      { status: 500 }
    );
  }
}

// PUT - Atualizar um cliente
export async function PUT(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    // Obter o ID dos parâmetros da rota
    const { id } = context.params;
    const data = await request.json();
    
    // Verificar se o cliente existe
    const { data: clienteExistente, error: erroConsulta } = await crmonefactory
      .from('clientes')
      .select('id')
      .eq('id', id)
      .single();
    
    if (erroConsulta && erroConsulta.code !== 'PGRST116') { // Não é "not found"
      console.error('Erro ao verificar cliente:', erroConsulta);
      return NextResponse.json(
        { error: `Erro ao verificar cliente: ${erroConsulta.message}` },
        { status: 500 }
      );
    }
    
    if (!clienteExistente) {
      return NextResponse.json(
        { error: 'Cliente não encontrado' },
        { status: 404 }
      );
    }
    
    // Converter para o formato do banco de dados
    const clienteDB: Record<string, any> = {
      nome: data.nome,
      cnpj: data.cnpj,
      contato_nome: data.contatoNome,
      contato_telefone: data.contatoTelefone,
      contato_email: data.contatoEmail,
      endereco: data.endereco,
      segmento: data.segmento,
      cidade: data.cidade,
      estado: data.estado,
      ativo: data.ativo,
      descricao: data.descricao,
      observacoes: data.observacoes,
      faturamento: data.faturamento,
      responsavel_interno: data.responsavelInterno,
      updated_at: new Date().toISOString()
    };
    
    // Filtrar campos undefined
    Object.keys(clienteDB).forEach(key => {
      if (clienteDB[key] === undefined) {
        delete clienteDB[key];
      }
    });
    
    // Atualizar o cliente no Supabase
    const { data: clienteAtualizado, error } = await crmonefactory
      .from('clientes')
      .update(clienteDB)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Erro ao atualizar cliente no Supabase:', error);
      return NextResponse.json(
        { error: `Erro ao atualizar cliente: ${error.message}` },
        { status: 500 }
      );
    }
    
    // Transformar para o formato esperado pelo frontend
    const clienteFormatado = {
      id: clienteAtualizado.id,
      nome: clienteAtualizado.nome,
      cnpj: clienteAtualizado.cnpj,
      contatoNome: clienteAtualizado.contato_nome,
      contatoTelefone: clienteAtualizado.contato_telefone,
      contatoEmail: clienteAtualizado.contato_email,
      endereco: clienteAtualizado.endereco,
      segmento: clienteAtualizado.segmento,
      dataCadastro: clienteAtualizado.data_cadastro,
      ativo: clienteAtualizado.ativo,
      // Campos adicionais
      cidade: clienteAtualizado.cidade,
      estado: clienteAtualizado.estado,
      descricao: clienteAtualizado.descricao,
      observacoes: clienteAtualizado.observacoes,
      faturamento: clienteAtualizado.faturamento
    };
    
    return NextResponse.json(clienteFormatado);
  } catch (error) {
    console.error('Erro ao processar atualização de cliente:', error);
    return NextResponse.json(
      { error: 'Erro interno ao processar atualização de cliente' },
      { status: 500 }
    );
  }
}

// DELETE - Desativar um cliente (não excluir permanentemente)
export async function DELETE(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    // Obter o ID dos parâmetros da rota
    const { id } = context.params;
    
    // Verificar se o cliente existe
    const { data: clienteExistente, error: erroConsulta } = await crmonefactory
      .from('clientes')
      .select('id')
      .eq('id', id)
      .single();
    
    if (erroConsulta && erroConsulta.code !== 'PGRST116') { // Não é "not found"
      console.error('Erro ao verificar cliente:', erroConsulta);
      return NextResponse.json(
        { error: `Erro ao verificar cliente: ${erroConsulta.message}` },
        { status: 500 }
      );
    }
    
    if (!clienteExistente) {
      return NextResponse.json(
        { error: 'Cliente não encontrado' },
        { status: 404 }
      );
    }
    
    // Desativar cliente em vez de excluir
    const { error } = await crmonefactory
      .from('clientes')
      .update({ 
        ativo: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);
    
    if (error) {
      console.error('Erro ao desativar cliente no Supabase:', error);
      return NextResponse.json(
        { error: `Erro ao desativar cliente: ${error.message}` },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao processar desativação de cliente:', error);
    return NextResponse.json(
      { error: 'Erro interno ao processar desativação de cliente' },
      { status: 500 }
    );
  }
}
