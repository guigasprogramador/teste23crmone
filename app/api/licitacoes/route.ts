import { NextRequest, NextResponse } from 'next/server';
import { Licitacao, LicitacaoStatus, LicitacaoFiltros, LicitacaoEstatisticas } from '@/types/licitacoes';
import { supabase, crmonefactory } from '@/lib/supabase/client';

// GET - Obter licitações com filtros ou estatísticas
export async function GET(request: NextRequest) {
  try {
    console.log('API de licitações: Recebendo requisição GET');
    
    const { searchParams } = new URL(request.url);
    
    // Parâmetros de filtro
    const status = searchParams.get('status');
    const orgao = searchParams.get('orgao');
    const orgaoId = searchParams.get('orgaoId');
    const responsavel = searchParams.get('responsavel');
    const responsavelId = searchParams.get('responsavelId');
    const modalidade = searchParams.get('modalidade');
    const termo = searchParams.get('termo');
    const dataInicio = searchParams.get('dataInicio');
    const dataFim = searchParams.get('dataFim');
    const valorMin = searchParams.get('valorMin') ? parseFloat(searchParams.get('valorMin')!) : null;
    const valorMax = searchParams.get('valorMax') ? parseFloat(searchParams.get('valorMax')!) : null;
    
    // Parâmetro para estatísticas
    const estatisticas = searchParams.get('estatisticas') === 'true';
    
    // Se solicitado estatísticas, retornar as estatísticas
    if (estatisticas) {
      return await obterEstatisticas();
    }
    
    console.log('Buscando licitações no Supabase');
    
    // Método simplificado - primeiro buscar todas as licitações
    let query = crmonefactory
      .from('licitacoes')
      .select('*');
    
    // Aplicar filtros na consulta se existirem
    if (status) {
      query = query.eq('status', status);
    }
    
    if (orgaoId) {
      query = query.eq('orgao_id', orgaoId);
    }
    
    if (responsavelId) {
      query = query.eq('responsavel_id', responsavelId);
    }
    
    if (modalidade) {
      query = query.eq('modalidade', modalidade);
    }
    
    if (termo) {
      query = query.or(`titulo.ilike.%${termo}%,objeto.ilike.%${termo}%,descricao.ilike.%${termo}%`);
    }
    
    if (dataInicio) {
      query = query.gte('data_abertura', dataInicio);
    }
    
    if (dataFim) {
      query = query.lte('data_abertura', dataFim);
    }
    
    if (valorMin !== null) {
      query = query.gte('valor_estimado', valorMin);
    }
    
    if (valorMax !== null) {
      query = query.lte('valor_estimado', valorMax);
    }
    
    // Ordenar pelo mais recente
    query = query.order('data_atualizacao', { ascending: false });
    
    // Executar a consulta
    const { data, error } = await query;
    
    if (error) {
      console.error('Erro ao consultar licitações:', error);
      return NextResponse.json(
        { error: 'Erro ao listar licitações: ' + error.message },
        { status: 500 }
      );
    }
    
    console.log(`Foram encontradas ${data.length} licitações`);
    
    if (data.length === 0) {
      return NextResponse.json([]);
    }
    
    // Array para armazenar licitações completas
    const licitacoesCompletas: Licitacao[] = [];
    
    // Processar cada licitação
    for (const licitacao of data) {
      // 1. Buscar o órgão relacionado
      let orgaoData = null;
      if (licitacao.orgao_id) {
        const { data: orgaos, error: orgaoError } = await crmonefactory
          .from('orgaos')
          .select('*')
          .eq('id', licitacao.orgao_id)
          .single();
        
        if (orgaoError) {
          console.warn(`Erro ao buscar órgão para licitação ${licitacao.id}:`, orgaoError);
        } else {
          orgaoData = orgaos;
        }
      }
      
      // 2. Buscar os responsáveis relacionados
      let responsaveis = [];
      if (licitacao.responsaveis_ids && Array.isArray(licitacao.responsaveis_ids)) {
        // Buscar cada responsável individualmente
        for (const respId of licitacao.responsaveis_ids) {
          const { data: resp, error: respError } = await crmonefactory
            .from('usuarios')
            .select('id, nome')
            .eq('id', respId)
            .single();
          
          if (!respError && resp) {
            responsaveis.push(resp);
          }
        }
      } else if (licitacao.responsavel_id) {
        // Buscar somente o responsável principal
        const { data: resp, error: respError } = await crmonefactory
          .from('usuarios')
          .select('id, nome')
          .eq('id', licitacao.responsavel_id)
          .single();
        
        if (!respError && resp) {
          responsaveis.push(resp);
        }
      }
      
      // 3. Buscar documentos relacionados
      let documentos = [];
      const { data: docs, error: docsError } = await crmonefactory
        .from('documentos')
        .select('*')
        .eq('licitacao_id', licitacao.id);
      
      if (docsError) {
        console.warn(`Erro ao buscar documentos para licitação ${licitacao.id}:`, docsError);
      } else {
        documentos = docs;
      }
      
      // 4. Formatar a licitação com todas as informações
      const licitacaoFormatada = formatarLicitacao(licitacao, orgaoData, responsaveis, documentos);
      licitacoesCompletas.push(licitacaoFormatada);
    }
    
    return NextResponse.json(licitacoesCompletas);
  } catch (error: any) {
    console.error('Erro ao consultar licitações:', error);
    return NextResponse.json(
      { error: 'Erro ao listar licitações: ' + error.message },
      { status: 500 }
    );
  }
}

// POST - Criar nova licitação
export async function POST(request: NextRequest) {
  try {
    console.log('API de licitações: Recebendo requisição POST');
    
    // Obter os dados
    const licitacaoData = await request.json();
    
    // Validar dados obrigatórios
    if (!licitacaoData.titulo) {
      return NextResponse.json(
        { error: 'Título é obrigatório' },
        { status: 400 }
      );
    }
    
    console.log('Dados recebidos:', JSON.stringify(licitacaoData).substring(0, 200) + '...');
    
    // Preparar o objeto para inserção no banco
    const licitacaoDb = {
      titulo: licitacaoData.titulo,
      status: licitacaoData.status || 'nova',
      modalidade: licitacaoData.modalidade,
      numero_processo: licitacaoData.numeroProcesso,
      objeto: licitacaoData.objeto,
      edital: licitacaoData.edital,
      numero_edital: licitacaoData.numeroEdital,
      data_abertura: licitacaoData.dataAbertura,
      data_limite_proposta: licitacaoData.dataLimiteProposta,
      orgao_id: licitacaoData.orgaoId,
      valor_estimado: licitacaoData.valorEstimado,
      responsavel_id: licitacaoData.responsavelId,
      responsaveis_ids: licitacaoData.responsaveisIds,
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
      data_julgamento: licitacaoData.dataJulgamento,
      data_criacao: new Date().toISOString(),
      data_atualizacao: new Date().toISOString()
    };
    
    // Inserir no banco
    const { data, error } = await crmonefactory
      .from('licitacoes')
      .insert(licitacaoDb)
      .select()
      .single();
    
    if (error) {
      console.error('Erro ao criar licitação:', error);
      return NextResponse.json(
        { error: 'Erro ao criar licitação: ' + error.message },
        { status: 500 }
      );
    }
    
    console.log('Licitação criada com sucesso, ID:', data.id);
    
    // Se houver documentos, processar cada um
    if (licitacaoData.documentos && Array.isArray(licitacaoData.documentos)) {
      for (const documento of licitacaoData.documentos) {
        // Adaptar para o formato do banco
        const docDb = {
          nome: documento.nome,
          url: documento.url,
          arquivo: documento.arquivo,
          tipo: documento.tipo,
          tamanho: documento.tamanho,
          licitacao_id: data.id, // ID da licitação recém-criada
          formato: documento.formato,
          categoria: documento.categoria,
          categoria_id: documento.categoriaId,
          upload_por: documento.uploadPor,
          resumo: documento.resumo,
          data_validade: documento.dataValidade,
          status: documento.status || 'ativo',
          data_criacao: new Date().toISOString(),
          data_atualizacao: new Date().toISOString()
        };
        
        // Inserir o documento
        const { error: docError } = await crmonefactory
          .from('documentos')
          .insert(docDb);
        
        if (docError) {
          console.warn(`Erro ao criar documento para licitação ${data.id}:`, docError);
        }
      }
    }
    
    // Obter a licitação completa para retornar
    return NextResponse.json(
      await obterLicitacaoCompleta(data.id)
    );
  } catch (error: any) {
    console.error('Erro ao criar licitação:', error);
    return NextResponse.json(
      { error: 'Erro ao criar licitação: ' + error.message },
      { status: 500 }
    );
  }
}

// Função auxiliar para formatar dados do banco para o formato do frontend
function formatarLicitacao(item: any, orgao = null, responsaveis = [], documentos = []): Licitacao {
  // Extrair IDs dos responsáveis
  const responsaveisIds = responsaveis.map((r: any) => r.id);
  
  // Nome do responsável principal
  let responsavelNome = '';
  if (item.responsavel_id) {
    const resp = responsaveis.find((r: any) => r.id === item.responsavel_id);
    if (resp) {
      responsavelNome = resp.nome;
    }
  }
  
  return {
    id: item.id,
    titulo: item.titulo,
    status: item.status,
    modalidade: item.modalidade,
    numeroProcesso: item.numero_processo,
    dataAbertura: item.data_abertura,
    dataLimiteProposta: item.data_limite_proposta,
    orgao: orgao ? orgao.nome : '',
    orgaoId: item.orgao_id,
    valorEstimado: item.valor_estimado,
    objeto: item.objeto,
    edital: item.edital,
    numeroEdital: item.numero_edital,
    responsavel: responsavelNome || '',
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

// Função para obter uma licitação completa por ID
async function obterLicitacaoCompleta(id: string): Promise<Licitacao> {
  // 1. Buscar a licitação
  const { data: licitacao, error } = await crmonefactory
    .from('licitacoes')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
    throw new Error(`Erro ao buscar licitação: ${error.message}`);
  }
  
  // 2. Buscar o órgão relacionado
  let orgaoData = null;
  if (licitacao.orgao_id) {
    const { data: orgao } = await crmonefactory
      .from('orgaos')
      .select('*')
      .eq('id', licitacao.orgao_id)
      .single();
    
    orgaoData = orgao;
  }
  
  // 3. Buscar os responsáveis
  let responsaveis = [];
  if (licitacao.responsaveis_ids && Array.isArray(licitacao.responsaveis_ids)) {
    for (const respId of licitacao.responsaveis_ids) {
      const { data: resp } = await crmonefactory
        .from('usuarios')
        .select('id, nome')
        .eq('id', respId)
        .single();
      
      if (resp) {
        responsaveis.push(resp);
      }
    }
  } else if (licitacao.responsavel_id) {
    const { data: resp } = await crmonefactory
      .from('usuarios')
      .select('id, nome')
      .eq('id', licitacao.responsavel_id)
      .single();
    
    if (resp) {
      responsaveis.push(resp);
    }
  }
  
  // 4. Buscar documentos
  const { data: documentos } = await crmonefactory
    .from('documentos')
    .select('*')
    .eq('licitacao_id', id);
  
  // 5. Formatar e retornar
  return formatarLicitacao(licitacao, orgaoData, responsaveis, documentos || []);
}

// Função para obter estatísticas
async function obterEstatisticas(): Promise<NextResponse> {
  try {
    console.log('Calculando estatísticas');
    
    // Buscar todas as licitações para cálculos
    const { data, error } = await crmonefactory
      .from('licitacoes')
      .select('*');
    
    if (error) {
      console.error('Erro ao buscar licitações para estatísticas:', error);
      return NextResponse.json(
        { error: 'Erro ao calcular estatísticas: ' + error.message },
        { status: 500 }
      );
    }
    
    console.log(`Encontradas ${data.length} licitações para cálculo de estatísticas`);
    
    // Contadores
    const total = data.length;
    const vencidas = data.filter(l => l.status === 'vencida').length;
    const ativas = data.filter(l => 
      ['analise_interna', 'aguardando_pregao', 'envio_documentos', 'assinaturas'].includes(l.status)
    ).length;
    
    // Calcular valor total de licitações ativas
    const valorTotal = data
      .filter(l => l.status !== 'arquivada' && l.status !== 'nao_vencida')
      .reduce((soma, l) => soma + (l.valor_estimado || 0), 0);
    
    // Calcular taxa de sucesso (vencidas / total de finalizadas)
    const finalizadas = data.filter(l => 
      ['vencida', 'nao_vencida', 'concluida', 'arquivada'].includes(l.status)
    ).length;
    
    const taxaSucesso = finalizadas > 0 
      ? (vencidas / finalizadas) * 100 
      : 0;
    
    // Calcular pregões próximos (com data de abertura nos próximos 7 dias)
    const hoje = new Date();
    const emSeteDias = new Date();
    emSeteDias.setDate(hoje.getDate() + 7);
    
    const pregoesProximos = data.filter(l => {
      if (!l.data_abertura) return false;
      const dataAbertura = new Date(l.data_abertura);
      return dataAbertura >= hoje && dataAbertura <= emSeteDias;
    }).length;
    
    // Estatísticas por modalidade
    const porModalidade: Record<string, number> = {};
    data.forEach(l => {
      if (l.modalidade) {
        porModalidade[l.modalidade] = (porModalidade[l.modalidade] || 0) + 1;
      }
    });
    
    // Estatísticas por status
    const porStatus: Record<string, number> = {};
    data.forEach(l => {
      porStatus[l.status] = (porStatus[l.status] || 0) + 1;
    });
    
    const estatisticas: LicitacaoEstatisticas = {
      total,
      ativas,
      vencidas,
      valorTotal,
      taxaSucesso,
      pregoesProximos,
      porModalidade,
      porStatus
    };
    
    console.log('Estatísticas calculadas com sucesso');
    return NextResponse.json(estatisticas);
  } catch (error) {
    console.error('Erro ao calcular estatísticas:', error);
    return NextResponse.json(
      { error: 'Erro interno ao calcular estatísticas' },
      { status: 500 }
    );
  }
}
