import { NextRequest, NextResponse } from 'next/server';
import { supabase, crmonefactory } from '@/lib/supabase/client';

// GET - Obter todos os documentos ou filtrar por parâmetros
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Obter parâmetros da URL
    const { searchParams } = new URL(request.url);
    const licitacaoId = searchParams.get('licitacaoId');
    const tipo = searchParams.get('tipo');
    const categoria = searchParams.get('categoria');
    const status = searchParams.get('status') || 'ativo';

    // Construir a consulta base
    let query = crmonefactory.from('doc').select('*');

    // Aplicar filtros se fornecidos
    if (licitacaoId) {
      query = query.eq('licitacao_id', licitacaoId);
    }
    if (tipo) {
      query = query.eq('tipo', tipo);
    }
    if (categoria) {
      query = query.eq('categoria', categoria);
    }
    if (status) {
      query = query.eq('status', status);
    }

    // Ordenar por data de criação (mais recentes primeiro)
    query = query.order('data_criacao', { ascending: false });

    // Executar a consulta
    const { data, error } = await query;

    if (error) {
      console.error('Erro ao buscar documentos:', error);
      return NextResponse.json({ error: 'Erro ao buscar documentos' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      documentos: data || []
    });
  } catch (error: any) {
    console.error('Erro ao processar requisição de documentos:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor: ' + error.message },
      { status: 500 }
    );
  }
}

// POST - Criar um novo documento (metadados apenas, sem upload de arquivo)
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Obter dados do corpo da requisição
    const body = await request.json();
    
    // Validar campos obrigatórios
    if (!body.nome || !body.tipo || !body.categoria) {
      return NextResponse.json(
        { error: 'Nome, tipo e categoria são campos obrigatórios' },
        { status: 400 }
      );
    }

    // Data atual para os campos de auditoria
    const dataAtual = new Date().toISOString();
    
    // Inserir documento na tabela doc
    const { data, error } = await crmonefactory
      .from('doc')
      .insert([
        {
          nome: body.nome,
          tipo: body.tipo,
          categoria: body.categoria,
          descricao: body.descricao || null,
          licitacao_id: body.licitacaoId || null,
          numero_documento: body.numeroDocumento || null,
          data_validade: body.dataValidade || null,
          url_documento: body.urlDocumento || null,
          arquivo_path: body.arquivoPath || null,
          formato: body.formato || null,
          tamanho: body.tamanho || null,
          status: 'ativo',
          criado_por: body.criadoPor || null,
          data_criacao: dataAtual,
          data_atualizacao: dataAtual
        }
      ])
      .select();

    if (error) {
      console.error('Erro ao criar documento:', error);
      return NextResponse.json(
        { error: 'Erro ao criar documento: ' + error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Documento criado com sucesso',
      documento: data[0]
    }, { status: 201 });
  } catch (error: any) {
    console.error('Erro ao processar criação de documento:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor: ' + error.message },
      { status: 500 }
    );
  }
}

// PATCH - Atualizar um documento existente
export async function PATCH(request: NextRequest) {
  try {
    // Verificar autenticação
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Obter dados do corpo da requisição
    const body = await request.json();
    
    // Validar ID do documento
    if (!body.id) {
      return NextResponse.json(
        { error: 'ID do documento é obrigatório para atualização' },
        { status: 400 }
      );
    }

    // Preparar dados para atualização
    const updateData: any = {};
    
    // Adicionar apenas campos que foram fornecidos
    if (body.nome !== undefined) updateData.nome = body.nome;
    if (body.tipo !== undefined) updateData.tipo = body.tipo;
    if (body.categoria !== undefined) updateData.categoria = body.categoria;
    if (body.descricao !== undefined) updateData.descricao = body.descricao;
    if (body.numeroDocumento !== undefined) updateData.numero_documento = body.numeroDocumento;
    if (body.dataValidade !== undefined) updateData.data_validade = body.dataValidade;
    if (body.urlDocumento !== undefined) updateData.url_documento = body.urlDocumento;
    if (body.status !== undefined) updateData.status = body.status;
    
    // Data de atualização sempre é atualizada
    updateData.data_atualizacao = new Date().toISOString();

    // Atualizar documento na tabela doc
    const { data, error } = await crmonefactory
      .from('doc')
      .update(updateData)
      .eq('id', body.id)
      .select();

    if (error) {
      console.error('Erro ao atualizar documento:', error);
      return NextResponse.json(
        { error: 'Erro ao atualizar documento: ' + error.message },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: 'Documento não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Documento atualizado com sucesso',
      documento: data[0]
    });
  } catch (error: any) {
    console.error('Erro ao processar atualização de documento:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor: ' + error.message },
      { status: 500 }
    );
  }
}

// DELETE - Excluir ou marcar um documento como excluído
export async function DELETE(request: NextRequest) {
  try {
    // Verificar autenticação
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Obter ID do documento
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID do documento é obrigatório para exclusão' },
        { status: 400 }
      );
    }

    // Verificar se é para excluir fisicamente ou apenas marcar como excluído
    const excluirFisicamente = searchParams.get('fisicamente') === 'true';
    
    if (excluirFisicamente) {
      // Primeiro, obter o path do arquivo para excluí-lo do storage
      const { data: docData, error: fetchError } = await crmonefactory
        .from('doc')
        .select('arquivo_path')
        .eq('id', id)
        .single();
        
      if (fetchError) {
        console.error('Erro ao buscar documento para exclusão:', fetchError);
        return NextResponse.json(
          { error: 'Erro ao buscar documento para exclusão' },
          { status: 500 }
        );
      }
      
      // Se houver um arquivo associado, excluí-lo do storage
      if (docData && docData.arquivo_path) {
        const { error: storageError } = await supabase.storage
          .from('documentos')
          .remove([docData.arquivo_path]);
          
        if (storageError) {
          console.error('Erro ao excluir arquivo do storage:', storageError);
          // Continue mesmo com erro, para pelo menos excluir o registro
        }
      }
      
      // Excluir o registro do banco de dados
      const { error: deleteError } = await crmonefactory
        .from('doc')
        .delete()
        .eq('id', id);
        
      if (deleteError) {
        console.error('Erro ao excluir documento do banco de dados:', deleteError);
        return NextResponse.json(
          { error: 'Erro ao excluir documento do banco de dados' },
          { status: 500 }
        );
      }
    } else {
      // Apenas marcar como excluído (soft delete)
      const { error: updateError } = await crmonefactory
        .from('doc')
        .update({ 
          status: 'excluido',
          data_atualizacao: new Date().toISOString()
        })
        .eq('id', id);
        
      if (updateError) {
        console.error('Erro ao marcar documento como excluído:', updateError);
        return NextResponse.json(
          { error: 'Erro ao marcar documento como excluído' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: excluirFisicamente 
        ? 'Documento excluído permanentemente com sucesso'
        : 'Documento marcado como excluído com sucesso'
    });
  } catch (error: any) {
    console.error('Erro ao processar exclusão de documento:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor: ' + error.message },
      { status: 500 }
    );
  }
}
