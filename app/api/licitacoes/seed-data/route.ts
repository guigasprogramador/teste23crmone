import { NextRequest, NextResponse } from 'next/server';
import { crmonefactory } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  try {
    // 1. Inserir órgãos
    const orgaos = [
      {
        nome: 'Prefeitura Municipal de São Paulo',
        cnpj: '12.345.678/0001-01',
        cidade: 'São Paulo',
        estado: 'SP',
        email: 'contato@prefeiturasp.gov.br',
        telefone: '(11) 3333-4444',
        website: 'www.prefeitura.sp.gov.br',
        endereco: 'Rua da Prefeitura, 123'
      },
      {
        nome: 'Governo do Estado de São Paulo',
        cnpj: '23.456.789/0001-02',
        cidade: 'São Paulo',
        estado: 'SP',
        email: 'contato@sp.gov.br',
        telefone: '(11) 4444-5555',
        website: 'www.sp.gov.br',
        endereco: 'Avenida do Estado, 456'
      },
      {
        nome: 'Ministério da Educação',
        cnpj: '34.567.890/0001-03',
        cidade: 'Brasília',
        estado: 'DF',
        email: 'contato@mec.gov.br',
        telefone: '(61) 5555-6666',
        website: 'www.mec.gov.br',
        endereco: 'Esplanada dos Ministérios, Bloco L'
      }
    ];

    const { data: orgaosInseridos, error: orgaosError } = await crmonefactory
      .from('orgaos')
      .upsert(orgaos, { onConflict: 'cnpj' })
      .select();

    if (orgaosError) {
      console.error('Erro ao inserir órgãos:', orgaosError);
      return NextResponse.json(
        { error: 'Erro ao inserir órgãos: ' + orgaosError.message },
        { status: 500 }
      );
    }

    // 2. Buscar IDs dos órgãos inseridos
    const { data: todosOrgaos } = await crmonefactory
      .from('orgaos')
      .select('id, nome');

    if (!todosOrgaos || todosOrgaos.length === 0) {
      return NextResponse.json(
        { error: 'Não foi possível recuperar os órgãos após a inserção' },
        { status: 500 }
      );
    }

    const orgaosMap = new Map();
    todosOrgaos.forEach(orgao => {
      orgaosMap.set(orgao.nome, orgao.id);
    });

    // 3. Inserir licitações
    const licitacoes = [
      {
        titulo: 'Aquisição de Computadores',
        orgao_id: orgaosMap.get('Prefeitura Municipal de São Paulo'),
        status: 'analise_interna',
        data_abertura: '2025-05-01',
        data_publicacao: '2025-04-01',
        valor_estimado: 500000.00,
        modalidade: 'Pregão Eletrônico',
        objeto: 'Aquisição de 100 computadores para as escolas municipais',
        numero_edital: '001/2025'
      },
      {
        titulo: 'Serviços de Manutenção Predial',
        orgao_id: orgaosMap.get('Governo do Estado de São Paulo'),
        status: 'aguardando_pregao',
        data_abertura: '2025-06-15',
        data_publicacao: '2025-05-15',
        valor_estimado: 1200000.00,
        modalidade: 'Concorrência',
        objeto: 'Contratação de empresa especializada em manutenção predial para os prédios administrativos',
        numero_edital: 'CONC-002/2025'
      },
      {
        titulo: 'Fornecimento de Merenda Escolar',
        orgao_id: orgaosMap.get('Ministério da Educação'),
        status: 'envio_documentos',
        data_abertura: '2025-05-20',
        data_publicacao: '2025-04-20',
        valor_estimado: 3000000.00,
        modalidade: 'Pregão Eletrônico',
        objeto: 'Fornecimento de merenda escolar para as escolas federais do estado',
        numero_edital: 'PE-003/2025'
      }
    ];

    // Verificar se todos os IDs de órgãos foram encontrados
    const todosPresentesComId = licitacoes.every(licitacao => !!licitacao.orgao_id);
    if (!todosPresentesComId) {
      return NextResponse.json(
        { error: 'Alguns órgãos não foram encontrados no banco de dados' },
        { status: 500 }
      );
    }

    const { data: licitacoesInseridas, error: licitacoesError } = await crmonefactory
      .from('licitacoes')
      .upsert(licitacoes, { onConflict: 'titulo' })
      .select();

    if (licitacoesError) {
      console.error('Erro ao inserir licitações:', licitacoesError);
      return NextResponse.json(
        { error: 'Erro ao inserir licitações: ' + licitacoesError.message },
        { status: 500 }
      );
    }

    // 4. Buscar IDs das licitações e categorias de documentos
    const { data: todasLicitacoes } = await crmonefactory
      .from('licitacoes')
      .select('id, titulo');

    const { data: todasCategorias } = await crmonefactory
      .from('documento_categorias')
      .select('id, nome');

    const licitacoesMap = new Map();
    todasLicitacoes.forEach(licitacao => {
      licitacoesMap.set(licitacao.titulo, licitacao.id);
    });

    const categoriasMap = new Map();
    todasCategorias.forEach(categoria => {
      categoriasMap.set(categoria.nome, categoria.id);
    });

    // 5. Inserir documentos
    const documentos = [
      {
        nome: 'Edital de Licitação - Computadores.pdf',
        licitacao_id: licitacoesMap.get('Aquisição de Computadores'),
        categoria_id: categoriasMap.get('Edital'),
        tipo: 'pdf',
        status: 'ativo'
      },
      {
        nome: 'Proposta Comercial - Manutenção.pdf',
        licitacao_id: licitacoesMap.get('Serviços de Manutenção Predial'),
        categoria_id: categoriasMap.get('Proposta'),
        tipo: 'pdf',
        status: 'ativo'
      },
      {
        nome: 'Documentos de Habilitação - Merenda.zip',
        licitacao_id: licitacoesMap.get('Fornecimento de Merenda Escolar'),
        categoria_id: categoriasMap.get('Habilitação'),
        tipo: 'zip',
        status: 'ativo'
      }
    ];

    // Verificar se todos os IDs foram encontrados
    const todosDocumentosComIds = documentos.every(doc => !!doc.licitacao_id && !!doc.categoria_id);
    if (!todosDocumentosComIds) {
      return NextResponse.json(
        { error: 'Algumas licitações ou categorias não foram encontradas no banco de dados' },
        { status: 500 }
      );
    }

    const { data: documentosInseridos, error: documentosError } = await crmonefactory
      .from('documentos')
      .upsert(documentos, { onConflict: 'nome' })
      .select();

    if (documentosError) {
      console.error('Erro ao inserir documentos:', documentosError);
      return NextResponse.json(
        { error: 'Erro ao inserir documentos: ' + documentosError.message },
        { status: 500 }
      );
    }

    // Retornar o resumo dos dados inseridos
    return NextResponse.json({
      mensagem: 'Dados de teste inseridos com sucesso',
      dados: {
        orgaos: orgaosInseridos?.length || 0,
        licitacoes: licitacoesInseridas?.length || 0,
        documentos: documentosInseridos?.length || 0
      }
    });
  } catch (error) {
    console.error('Erro ao inserir dados de teste:', error);
    return NextResponse.json(
      { error: 'Erro interno ao inserir dados de teste' },
      { status: 500 }
    );
  }
}
