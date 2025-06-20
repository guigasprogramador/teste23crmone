import { NextRequest, NextResponse } from 'next/server';
import { Licitacao } from '@/types/licitacoes';
import { crmonefactory } from '@/lib/supabase/client';

// Função auxiliar para formatar dados do banco para o formato do frontend
function formatarLicitacao(item: any): Licitacao {
  const orgao = item.orgaos || {};
  
  // Processar responsáveis, se houverem
  const responsaveisIds: string[] = [];
  if (item.licitacao_responsaveis && item.licitacao_responsaveis.length > 0) {
    item.licitacao_responsaveis.forEach((resp: any) => {
      if (resp.usuario_id) {
        responsaveisIds.push(resp.usuario_id);
      }
    });
  }
  
  // Processar documentos, se houverem
  const documentos = item.documentos || [];
  
  return {
    id: item.id,
    titulo: item.titulo,
    orgao: orgao.nome || '',
    orgaoId: item.orgao_id,
    status: item.status,
    dataAbertura: item.data_abertura,
    dataPublicacao: item.data_publicacao,
    valorEstimado: item.valor_estimado,
    valorProposta: item.valor_proposta,
    modalidade: item.modalidade,
    objeto: item.objeto,
    edital: item.edital,
    numeroEdital: item.numero_edital,
    responsavel: item.responsavel || '',
    responsavelId: item.responsavel_id,
    responsaveisIds: responsaveisIds,
    prazo: item.prazo,
    urlLicitacao: item.url_licitacao,
    urlEdital: item.url_edital,
    descricao: item.descricao,
    formaPagamento: item.forma_pagamento,
    obsFinanceiras: item.obs_financeiras,
    tipo: item.tipo,
    tipoFaturamento: item.tipo_faturamento,
    margemLucro: item.margem_lucro,
    contatoNome: item.contato_nome,
    contatoEmail: item.contato_email,
    contatoTelefone: item.contato_telefone,
    dataJulgamento: item.data_julgamento,
    dataCriacao: item.data_criacao,
    dataAtualizacao: item.data_atualizacao,
    documentos: documentos.map((doc: any) => ({
      id: doc.id,
      nome: doc.nome,
      url: doc.url,
      arquivo: doc.arquivo,
      dataCriacao: doc.data_criacao,
      dataAtualizacao: doc.data_atualizacao,
      tipo: doc.tipo,
      tamanho: doc.tamanho,
      licitacaoId: doc.licitacao_id,
      formato: doc.formato,
      categoria: doc.categoria,
      categoriaId: doc.categoria_id,
      uploadPor: doc.upload_por,
      resumo: doc.resumo,
      dataValidade: doc.data_validade,
      status: doc.status
    }))
  };
}

// GET - Obter uma licitação específica pelo ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    // Buscar a licitação com suas relações
    const { data, error } = await crmonefactory
      .from('licitacoes')
      .select(`
        *,
        orgaos (id, nome, cnpj, cidade, estado),
        licitacao_responsaveis (
          id,
          papel,
          usuario_id,
          usuarios (id, nome)
        ),
        documentos (id, nome, url, tipo, categoria_id)
      `)
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Erro ao buscar licitação:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar licitação: ' + error.message },
        { status: error.code === 'PGRST116' ? 404 : 500 }
      );
    }
    
    if (!data) {
      return NextResponse.json(
        { error: 'Licitação não encontrada' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(formatarLicitacao(data));
  } catch (error) {
    console.error('Erro ao buscar licitação:', error);
    return NextResponse.json(
      { error: 'Erro interno ao buscar licitação' },
      { status: 500 }
    );
  }
}

// PUT - Atualizar uma licitação completa
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const data = await request.json();
    
    // Validação básica
    if (!data.titulo || !data.orgaoId) {
      return NextResponse.json(
        { error: 'Título e órgão são obrigatórios' },
        { status: 400 }
      );
    }
    
    // Extrair documentos e responsáveis para atualização separada
    const { documentos, responsaveis, ...licitacaoData } = data;
    
    // Preparar objeto para atualização (snake_case para o banco)
    const licitacao = {
      titulo: licitacaoData.titulo,
      orgao_id: licitacaoData.orgaoId,
      status: licitacaoData.status,
      data_abertura: licitacaoData.dataAbertura,
      data_publicacao: licitacaoData.dataPublicacao,
      data_julgamento: licitacaoData.dataJulgamento,
      valor_estimado: licitacaoData.valorEstimado,
      valor_proposta: licitacaoData.valorProposta,
      modalidade: licitacaoData.modalidade,
      objeto: licitacaoData.objeto,
      edital: licitacaoData.edital,
      numero_edital: licitacaoData.numeroEdital,
      responsavel_id: licitacaoData.responsavelId,
      prazo: licitacaoData.prazo,
      url_licitacao: licitacaoData.urlLicitacao,
      url_edital: licitacaoData.urlEdital,
      descricao: licitacaoData.descricao,
      forma_pagamento: licitacaoData.formaPagamento,
      obs_financeiras: licitacaoData.obsFinanceiras,
      tipo: licitacaoData.tipo,
      tipo_faturamento: licitacaoData.tipoFaturamento,
      margem_lucro: licitacaoData.margemLucro,
      contato_nome: licitacaoData.contatoNome,
      contato_email: licitacaoData.contatoEmail,
      contato_telefone: licitacaoData.contatoTelefone,
      posicao_kanban: licitacaoData.posicaoKanban
    };
    
    // Atualizar a licitação
    const { data: licitacaoAtualizada, error } = await crmonefactory
      .from('licitacoes')
      .update(licitacao)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Erro ao atualizar licitação:', error);
      return NextResponse.json(
        { error: 'Erro ao atualizar licitação: ' + error.message },
        { status: error.code === 'PGRST116' ? 404 : 500 }
      );
    }
    
    // Tratar documentos, se houver
    if (documentos && documentos.length > 0) {
      // Primeiro, remove documentos existentes se necessário
      await crmonefactory
        .from('documentos')
        .delete()
        .eq('licitacao_id', id);
      
      // Depois, insere os novos documentos
      const docsToInsert = documentos.map((doc: any) => ({
        nome: doc.nome,
        url: doc.url,
        arquivo: doc.arquivo,
        tipo: doc.tipo,
        licitacao_id: id,
        formato: doc.formato,
        categoria_id: doc.categoriaId,
        resumo: doc.resumo,
        data_validade: doc.dataValidade,
        upload_por: doc.uploadPor
      }));
      
      await crmonefactory
        .from('documentos')
        .insert(docsToInsert);
    }
    
    // Tratar responsáveis, se houver
    if (responsaveis && responsaveis.length > 0) {
      // Primeiro, remove responsáveis existentes
      await crmonefactory
        .from('licitacao_responsaveis')
        .delete()
        .eq('licitacao_id', id);
      
      // Depois, insere os novos responsáveis
      const respsToInsert = responsaveis.map((resp: any) => ({
        licitacao_id: id,
        usuario_id: resp.usuarioId,
        papel: resp.papel || 'colaborador'
      }));
      
      await crmonefactory
        .from('licitacao_responsaveis')
        .insert(respsToInsert);
    }
    
    // Buscar a licitação completa com as relações
    const { data: licitacaoCompleta, error: fetchError } = await crmonefactory
      .from('licitacoes')
      .select(`
        *,
        orgaos (id, nome, cnpj, cidade, estado),
        licitacao_responsaveis (
          id,
          papel,
          usuario_id,
          usuarios (id, nome)
        ),
        documentos (id, nome, url, tipo, categoria_id)
      `)
      .eq('id', id)
      .single();
    
    if (fetchError) {
      console.error('Erro ao buscar licitação completa:', fetchError);
      // Retornar a licitação atualizada mesmo sem dados relacionados
      return NextResponse.json(formatarLicitacao(licitacaoAtualizada));
    }
    
    return NextResponse.json(formatarLicitacao(licitacaoCompleta));
  } catch (error) {
    console.error('Erro ao atualizar licitação:', error);
    return NextResponse.json(
      { error: 'Erro interno ao atualizar licitação' },
      { status: 500 }
    );
  }
}

// PATCH - Atualizar parcialmente uma licitação
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const dadosAtualizacao = await request.json();
    
    // Converter campos do camelCase para snake_case
    const camposParaAtualizar: Record<string, any> = {};
    
    // Mapeamento de camelCase para snake_case
    Object.entries(dadosAtualizacao).forEach(([key, value]) => {
      // Ignorar alguns campos especiais que não devem ser atualizados diretamente
      if (['id', 'documentos', 'responsaveis', 'responsaveisIds'].includes(key)) {
        return;
      }
      
      // Converter camelCase para snake_case
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      camposParaAtualizar[snakeKey] = value;
    });
    
    // Atualizar a licitação
    const { data: licitacaoAtualizada, error } = await crmonefactory
      .from('licitacoes')
      .update(camposParaAtualizar)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Erro ao atualizar licitação:', error);
      return NextResponse.json(
        { error: 'Erro ao atualizar licitação: ' + error.message },
        { status: error.code === 'PGRST116' ? 404 : 500 }
      );
    }
    
    // Atualizar os documentos se fornecidos
    if (dadosAtualizacao.documentos) {
      // Atualização parcial de documentos não exclui documentos existentes
      // apenas adiciona novos documentos
      const docsToInsert = dadosAtualizacao.documentos
        .filter((doc: any) => !doc.id) // Apenas documentos novos
        .map((doc: any) => ({
          nome: doc.nome,
          url: doc.url,
          arquivo: doc.arquivo,
          tipo: doc.tipo,
          licitacao_id: id,
          formato: doc.formato,
          categoria_id: doc.categoriaId,
          resumo: doc.resumo,
          data_validade: doc.dataValidade,
          upload_por: doc.uploadPor
        }));
      
      if (docsToInsert.length > 0) {
        await crmonefactory
          .from('documentos')
          .insert(docsToInsert);
      }
    }
    
    // Atualizar os responsáveis se fornecidos
    if (dadosAtualizacao.responsaveis || dadosAtualizacao.responsaveisIds) {
      const responsaveis = dadosAtualizacao.responsaveis || 
        (dadosAtualizacao.responsaveisIds || []).map((userId: string) => ({
          usuarioId: userId,
          papel: 'colaborador'
        }));
      
      if (responsaveis.length > 0) {
        // Remover responsáveis existentes
        await crmonefactory
          .from('licitacao_responsaveis')
          .delete()
          .eq('licitacao_id', id);
        
        // Inserir novos responsáveis
        const respsToInsert = responsaveis.map((resp: any) => ({
          licitacao_id: id,
          usuario_id: resp.usuarioId,
          papel: resp.papel || 'colaborador'
        }));
        
        await crmonefactory
          .from('licitacao_responsaveis')
          .insert(respsToInsert);
      }
    }
    
    // Buscar a licitação completa com as relações
    const { data: licitacaoCompleta, error: fetchError } = await crmonefactory
      .from('licitacoes')
      .select(`
        *,
        orgaos (id, nome, cnpj, cidade, estado),
        licitacao_responsaveis (
          id,
          papel,
          usuario_id,
          usuarios (id, nome)
        ),
        documentos (id, nome, url, tipo, categoria_id)
      `)
      .eq('id', id)
      .single();
    
    if (fetchError) {
      console.error('Erro ao buscar licitação completa:', fetchError);
      return NextResponse.json(formatarLicitacao(licitacaoAtualizada));
    }
    
    return NextResponse.json(formatarLicitacao(licitacaoCompleta));
  } catch (error) {
    console.error('Erro ao atualizar licitação:', error);
    return NextResponse.json(
      { error: 'Erro interno ao atualizar licitação' },
      { status: 500 }
    );
  }
}

// DELETE - Excluir uma licitação
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    // Primeiro, removemos os documentos relacionados
    const { error: docError } = await crmonefactory
      .from('documentos')
      .delete()
      .eq('licitacao_id', id);
    
    if (docError) {
      console.error('Erro ao excluir documentos da licitação:', docError);
    }
    
    // Depois, removemos os responsáveis relacionados
    const { error: respError } = await crmonefactory
      .from('licitacao_responsaveis')
      .delete()
      .eq('licitacao_id', id);
    
    if (respError) {
      console.error('Erro ao excluir responsáveis da licitação:', respError);
    }
    
    // Por fim, removemos a licitação
    const { error } = await crmonefactory
      .from('licitacoes')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Erro ao excluir licitação:', error);
      return NextResponse.json(
        { error: 'Erro ao excluir licitação: ' + error.message },
        { status: error.code === 'PGRST116' ? 404 : 500 }
      );
    }
    
    return NextResponse.json({ success: true, message: 'Licitação excluída com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir licitação:', error);
    return NextResponse.json(
      { error: 'Erro interno ao excluir licitação' },
      { status: 500 }
    );
  }
}
