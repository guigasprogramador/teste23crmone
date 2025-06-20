import { NextRequest, NextResponse } from 'next/server';
import { Oportunidade, OportunidadeStatus } from '@/types/comercial';
import { supabase, crmonefactory } from "@/lib/supabase/client";
import * as fs from 'fs';
import * as path from 'path';

// Path para o arquivo de "banco de dados" local (apenas para compatibilidade)
const dbPath = path.join(process.cwd(), 'data', 'oportunidades.json');

// Função para carregar os dados do arquivo
async function carregarOportunidades(): Promise<Oportunidade[]> {
  try {
    // Garantir que o diretório existe
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Criar arquivo se não existir
    if (!fs.existsSync(dbPath)) {
      // Dados iniciais para o "banco de dados"
      const oportunidadesIniciais: Oportunidade[] = [
        {
          id: "1",
          titulo: "Sistema de Gestão Municipal",
          cliente: "Prefeitura de São Paulo",
          clienteId: "c1",
          valor: "R$ 450.000,00",
          responsavel: "Ana Silva",
          responsavelId: "r1",
          prazo: "30/06/2023",
          status: "novo_lead",
          dataCriacao: "2023-01-15T10:30:00Z",
          dataAtualizacao: "2023-01-15T10:30:00Z",
          tipo: "produto",
          tipoFaturamento: "direto",
        },
        // ... outros dados iniciais
      ];
      
      fs.writeFileSync(dbPath, JSON.stringify(oportunidadesIniciais, null, 2));
      return oportunidadesIniciais;
    }
    
    // Ler do arquivo
    const data = fs.readFileSync(dbPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Erro ao carregar oportunidades do arquivo:', error);
    return [];
  }
}

// Função para salvar os dados no arquivo
async function salvarOportunidades(oportunidades: Oportunidade[]): Promise<void> {
  try {
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(dbPath, JSON.stringify(oportunidades, null, 2));
  } catch (error) {
    console.error('Erro ao salvar oportunidades no arquivo:', error);
  }
}

// Função auxiliar para formatar oportunidades do Supabase para o formato da aplicação
function formatarOportunidadesDoSupabase(oportunidades: any[]): Oportunidade[] {
  return oportunidades.map(opp => ({
    id: opp.id,
    titulo: opp.titulo,
    cliente: opp.cliente_nome || 'Cliente não especificado',
    clienteId: opp.cliente_id,
    valor: opp.valor ? `R$ ${opp.valor.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : 'A definir',
    responsavel: opp.responsavel_nome || 'Não atribuído',
    responsavelId: opp.responsavel_id,
    prazo: opp.prazo ? new Date(opp.prazo).toLocaleDateString('pt-BR') : 'Não definido',
    status: opp.status,
    descricao: opp.descricao,
    dataCriacao: opp.data_criacao,
    dataAtualizacao: opp.data_atualizacao,
    tipo: opp.tipo,
    tipoFaturamento: opp.tipo_faturamento,
    dataReuniao: opp.data_reuniao ? new Date(opp.data_reuniao).toLocaleDateString('pt-BR') : '',
    horaReuniao: opp.hora_reuniao,
    probabilidade: opp.probabilidade
  }));
}

// GET - Listar todas as oportunidades ou filtrar
export async function GET(request: NextRequest) {
  console.log("GET /api/comercial/oportunidades - Iniciando consulta de oportunidades");
  try {
    const { searchParams } = new URL(request.url);
    
    // Parâmetros de filtro
    const termo = searchParams.get('termo');
    const status = searchParams.get('status');
    const cliente = searchParams.get('cliente');
    const responsavel = searchParams.get('responsavel');
    const dataInicio = searchParams.get('dataInicio');
    const dataFim = searchParams.get('dataFim');
    
    console.log("Filtros aplicados:", { termo, status, cliente, responsavel, dataInicio, dataFim });
    
    // PRIMEIRA TENTATIVA: Buscar no Supabase
    try {
      console.log("Buscando oportunidades no Supabase");
      
      // Montar a consulta básica usando a view_oportunidades que já inclui dados relacionados
      let query = crmonefactory
        .from('view_oportunidades')
        .select('*');
      
      // Aplicar filtros
      if (termo) {
        query = query.or(`titulo.ilike.%${termo}%,cliente_nome.ilike.%${termo}%,descricao.ilike.%${termo}%`);
      }
      
      if (status && status !== 'todos') {
        query = query.eq('status', status);
      }
      
      if (cliente && cliente !== 'todos') {
        query = query.eq('cliente_nome', cliente);
      }
      
      if (responsavel && responsavel !== 'todos') {
        query = query.eq('responsavel_nome', responsavel);
      }
      
      if (dataInicio) {
        query = query.gte('prazo', dataInicio);
      }
      
      if (dataFim) {
        query = query.lte('prazo', dataFim);
      }
      
      // Ordenar por data de criação
      query = query.order('data_criacao', { ascending: false });
      
      const { data, error } = await query;
      
      if (error) {
        console.error("Erro ao consultar oportunidades no Supabase:", error);
        throw error;
      }
      
      if (data && data.length > 0) {
        console.log(`Encontradas ${data.length} oportunidades no Supabase`);
        // Converter para o formato esperado pelo frontend
        const formatadas = formatarOportunidadesDoSupabase(data);
        return NextResponse.json(formatadas);
      }
      
      console.log("Nenhuma oportunidade encontrada no Supabase, usando arquivo local como fallback");
    } catch (supabaseError) {
      console.error("Falha ao consultar Supabase:", supabaseError);
    }
    
    // FALLBACK: Usar o arquivo JSON local
    console.log("Usando arquivo local para buscar oportunidades");
    const oportunidades = await carregarOportunidades();
    
    let resultado = [...oportunidades];
    
    // Aplicar filtros nos dados locais
    if (termo) {
      const termoBusca = termo.toLowerCase();
      resultado = resultado.filter(
        (item) =>
          item.titulo.toLowerCase().includes(termoBusca) ||
          item.cliente.toLowerCase().includes(termoBusca) ||
          item.descricao?.toLowerCase().includes(termoBusca)
      );
    }
    
    if (status && status !== 'todos') {
      resultado = resultado.filter((item) => item.status === status);
    }
    
    if (cliente && cliente !== 'todos') {
      resultado = resultado.filter((item) => item.cliente === cliente);
    }
    
    if (responsavel && responsavel !== 'todos') {
      resultado = resultado.filter((item) => item.responsavel === responsavel);
    }
    
    if (dataInicio) {
      const dataInicioObj = new Date(dataInicio);
      resultado = resultado.filter((item) => {
        const dataPrazo = new Date(item.prazo.split('/').reverse().join('-'));
        return dataPrazo >= dataInicioObj;
      });
    }
    
    if (dataFim) {
      const dataFimObj = new Date(dataFim);
      resultado = resultado.filter((item) => {
        const dataPrazo = new Date(item.prazo.split('/').reverse().join('-'));
        return dataPrazo <= dataFimObj;
      });
    }
    
    console.log(`Retornando ${resultado.length} oportunidades do arquivo local`);
    return NextResponse.json(resultado);
  } catch (error) {
    console.error('Erro ao processar requisição de oportunidades:', error);
    return NextResponse.json(
      { error: 'Erro interno ao processar requisição de oportunidades' },
      { status: 500 }
    );
  }
}

// POST - Criar nova oportunidade
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    console.log('Dados recebidos para criar oportunidade:', data);
    
    // Validação básica
    if (!data.titulo || !data.cliente) {
      return NextResponse.json(
        { error: 'Título e cliente são obrigatórios' },
        { status: 400 }
      );
    }
    
    // Validação adicional para tipo e tipoFaturamento
    if (!data.tipo) {
      return NextResponse.json(
        { error: 'O tipo da oportunidade (produto/serviço) é obrigatório' },
        { status: 400 }
      );
    }
    
    // Se for produto, tipoFaturamento é obrigatório
    if (data.tipo === 'produto' && !data.tipoFaturamento) {
      return NextResponse.json(
        { error: 'Para produtos, o tipo de faturamento é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar se o cliente já existe (pelo CNPJ ou nome)
    let clienteId;
    let clienteExistente;

    if (data.cnpj) {
      console.log('Verificando cliente pelo CNPJ:', data.cnpj);
      const { data: clientePorCnpj } = await crmonefactory
        .from('clientes')
        .select('id, nome')
        .eq('cnpj', data.cnpj)
        .single();
      
      clienteExistente = clientePorCnpj;
    }

    if (!clienteExistente && data.cliente) {
      console.log('Verificando cliente pelo nome:', data.cliente);
      const { data: clientePorNome } = await crmonefactory
        .from('clientes')
        .select('id, nome')
        .eq('nome', data.cliente)
        .single();
      
      clienteExistente = clientePorNome;
    }

    // Se o cliente não existir, criar um novo
    if (!clienteExistente && (data.cliente && data.cnpj)) {
      console.log('Cliente não encontrado. Criando novo cliente:', data.cliente);
      console.log('Dados do cliente para criação:', {
        nome: data.cliente,
        cnpj: data.cnpj,
        contatoNome: data.contatoNome,
        contatoEmail: data.contatoEmail,
        segmento: data.segmento
      });
      
      // Preparar os dados do cliente para inserção
      const novoCliente = {
        nome: data.cliente,
        cnpj: data.cnpj,
        contato_nome: data.contatoNome,
        contato_telefone: data.contatoTelefone || '',
        contato_email: data.contatoEmail,
        endereco: data.endereco || '',
        segmento: data.segmento || 'Outros',
        data_cadastro: new Date().toISOString(),
        ativo: true,
        // Campos adicionais se disponíveis
        cidade: data.cidade || '',
        estado: data.estado || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Inserir o novo cliente no Supabase
      const { data: clienteCriado, error } = await crmonefactory
        .from('clientes')
        .insert(novoCliente)
        .select()
        .single();
      
      if (error) {
        console.error('Erro ao criar cliente:', error);
        console.error('Detalhes do erro:', {
          mensagem: error.message,
          código: error.code,
          detalhes: error.details,
          hint: error.hint
        });
        
        // Não retornar erro, continuar com a criação da oportunidade
        // Mas logar o erro para debug
      } else {
        console.log('Novo cliente criado com sucesso:', clienteCriado);
        clienteId = clienteCriado.id;
      }
    } else if (clienteExistente) {
      console.log('Cliente encontrado no banco de dados:', clienteExistente.id);
      clienteId = clienteExistente.id;
    }

    // Carregar oportunidades existentes do arquivo JSON
    const oportunidades = await carregarOportunidades();
    
    // Criar nova oportunidade
    const novaOportunidade: Oportunidade = {
      id: `opp-${Date.now()}`,
      titulo: data.titulo,
      cliente: data.cliente,
      clienteId: clienteId || data.clienteId || `client-${Date.now()}`,
      valor: data.valor || 'A definir',
      responsavel: data.responsavel || 'Não atribuído',
      responsavelId: data.responsavelId || '',
      prazo: data.prazo || 'Não definido',
      status: data.status || 'novo_lead',
      descricao: data.descricao || '',
      dataCriacao: new Date().toISOString(),
      dataAtualizacao: new Date().toISOString(),
      // Campos adicionais
      cnpj: data.cnpj,
      contatoNome: data.contatoNome,
      contatoTelefone: data.contatoTelefone,
      contatoEmail: data.contatoEmail,
      endereco: data.endereco,
      segmento: data.segmento,
      dataReuniao: data.dataReuniao,
      horaReuniao: data.horaReuniao,
      responsaveisIds: data.responsaveisIds,
      tipo: data.tipo,
      tipoFaturamento: data.tipoFaturamento,
    };
    
    // Salvar a oportunidade no Supabase
    try {
      console.log('Criando oportunidade no Supabase');
      
      // Converter valor para formato numérico
      let valorNumerico = 0;
      if (novaOportunidade.valor) {
        // Remover 'R$' e outros caracteres não numéricos, manter apenas dígitos, ponto e vírgula
        const valorLimpo = novaOportunidade.valor.replace(/[^0-9,.]/g, '');
        // Substituir vírgula por ponto para conversão numérica correta
        const valorComPonto = valorLimpo.replace(',', '.');
        valorNumerico = parseFloat(valorComPonto) || 0;
      }
      
      // Tratar datas corretamente
      let prazoDate = null;
      if (novaOportunidade.prazo && novaOportunidade.prazo !== 'Não definido') {
        try {
          // Convertendo formato DD/MM/YYYY para YYYY-MM-DD
          const partes = novaOportunidade.prazo.split('/');
          if (partes.length === 3) {
            prazoDate = `${partes[2]}-${partes[1]}-${partes[0]}`;
          }
        } catch (e) {
          console.error('Erro ao converter data de prazo:', e);
        }
      }
      
      let dataReuniaoDate = null;
      if (novaOportunidade.dataReuniao) {
        try {
          // Convertendo formato DD/MM/YYYY para YYYY-MM-DD
          const partes = novaOportunidade.dataReuniao.split('/');
          if (partes.length === 3) {
            dataReuniaoDate = `${partes[2]}-${partes[1]}-${partes[0]}`;
          }
        } catch (e) {
          console.error('Erro ao converter data de reunião:', e);
        }
      }
      
      // Converter para o formato do banco de dados
      const oportunidadeDB = {
        titulo: novaOportunidade.titulo,
        cliente_id: clienteId || null,
        valor: valorNumerico,
        responsavel_id: novaOportunidade.responsavelId || null,
        prazo: prazoDate,
        status: novaOportunidade.status || 'novo_lead',
        descricao: novaOportunidade.descricao || '',
        data_criacao: new Date().toISOString(),
        data_atualizacao: new Date().toISOString(),
        tipo: novaOportunidade.tipo || 'servico',
        tipo_faturamento: novaOportunidade.tipoFaturamento,
        data_reuniao: dataReuniaoDate,
        hora_reuniao: novaOportunidade.horaReuniao || null,
        probabilidade: 50, // Valor padrão para nova oportunidade
        posicao_kanban: 0 // Posição inicial
      };
      
      console.log('Dados formatados para inserção no Supabase:', oportunidadeDB);
      
      const { data: oportunidadeBD, error } = await crmonefactory
        .from('oportunidades')
        .insert(oportunidadeDB)
        .select()
        .single();
      
      if (error) {
        console.error('Erro ao criar oportunidade no Supabase:', error);
        console.error('Detalhes do erro:', {
          mensagem: error.message,
          código: error.code,
          detalhes: error.details,
          hint: error.hint
        });
        
        // Tratamento específico para diferentes tipos de erros
        if (error.code === '23503' && error.message.includes('foreign key constraint')) {
          // Erro de chave estrangeira - geralmente cliente_id ou responsavel_id inválido
          let mensagemErro = 'Falha na validação de dados relacionados';
          if (error.message.includes('cliente_id')) {
            mensagemErro = 'Cliente selecionado é inválido ou não existe mais no sistema';
          } else if (error.message.includes('responsavel_id')) {
            mensagemErro = 'Responsável selecionado é inválido ou não existe mais no sistema';
          }
          
          return NextResponse.json(
            { error: mensagemErro },
            { status: 400 }
          );
        }
        
        if (error.code === '23505') {
          // Erro de valor duplicado (unique constraint)
          return NextResponse.json(
            { error: 'Já existe uma oportunidade com estas informações no sistema' },
            { status: 409 }
          );
        }
        
        if (error.code === '22P02') {
          // Erro de tipo de dados inválido
          return NextResponse.json(
            { error: 'Dados em formato inválido. Verifique os valores dos campos e tente novamente.' },
            { status: 400 }
          );
        }

        if (error.code === '42501') {
          // Erro de permissão
          return NextResponse.json(
            { error: 'Você não tem permissão para criar oportunidades. Entre em contato com o administrador.' },
            { status: 403 }
          );
        }
        
        // Erro genérico para outros casos
        return NextResponse.json(
          { error: `Erro ao salvar oportunidade: ${error.message}` },
          { status: 500 }
        );
      } else {
        console.log('Oportunidade criada no Supabase com sucesso:', oportunidadeBD.id);
        novaOportunidade.id = oportunidadeBD.id;
      }
    } catch (erro) {
      console.error('Erro ao salvar oportunidade no Supabase:', erro);
      return NextResponse.json(
        { error: 'Erro interno ao processar a oportunidade. Tente novamente.' },
        { status: 500 }
      );
    }
    
    // Adicionar a oportunidade ao arquivo local (manter para compatibilidade)
    oportunidades.push(novaOportunidade);
    await salvarOportunidades(oportunidades);
    
    return NextResponse.json(novaOportunidade, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar oportunidade:', error);
    return NextResponse.json(
      { error: 'Erro ao criar oportunidade' },
      { status: 500 }
    );
  }
}
