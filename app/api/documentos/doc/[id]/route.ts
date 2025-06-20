import { NextRequest, NextResponse } from 'next/server';
import { supabase, crmonefactory } from '@/lib/supabase/client';

interface PathParams {
  params: {
    id: string;
  };
}

// GET - Obter um documento específico pelo ID
export async function GET(request: NextRequest, { params }: PathParams) {
  try {
    const id = params.id;
    
    if (!id) {
      return NextResponse.json({ error: 'ID do documento não fornecido' }, { status: 400 });
    }

    // Verificar autenticação
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Buscar documento pelo ID
    const { data, error } = await crmonefactory
      .from('doc')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // PGRST116 é o código de erro para "nenhum registro encontrado"
        return NextResponse.json({ error: 'Documento não encontrado' }, { status: 404 });
      }
      
      console.error('Erro ao buscar documento:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar documento: ' + error.message },
        { status: 500 }
      );
    }

    // Gerar URL pública para o arquivo, se houver
    let publicUrl = null;
    if (data.arquivo_path) {
      const { data: urlData } = await supabase.storage
        .from('documentos')
        .getPublicUrl(data.arquivo_path);
        
      publicUrl = urlData.publicUrl;
    }

    // Retorna o documento com URL pública
    return NextResponse.json({
      success: true,
      documento: {
        ...data,
        publicUrl
      }
    });
  } catch (error: any) {
    console.error('Erro ao processar requisição de documento:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor: ' + error.message },
      { status: 500 }
    );
  }
}

// PATCH - Atualizar um documento específico pelo ID
export async function PATCH(request: NextRequest, { params }: PathParams) {
  try {
    const id = params.id;
    
    if (!id) {
      return NextResponse.json({ error: 'ID do documento não fornecido' }, { status: 400 });
    }

    // Verificar autenticação
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Obter dados do corpo da requisição
    const body = await request.json();
    
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
      .eq('id', id)
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

// DELETE - Excluir um documento específico pelo ID
export async function DELETE(request: NextRequest, { params }: PathParams) {
  try {
    const id = params.id;
    
    if (!id) {
      return NextResponse.json({ error: 'ID do documento não fornecido' }, { status: 400 });
    }

    // Verificar autenticação
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    
    // Verificar se é para excluir fisicamente ou apenas marcar como excluído
    const { searchParams } = new URL(request.url);
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
