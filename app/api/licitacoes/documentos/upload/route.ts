import { NextRequest, NextResponse } from 'next/server';
import { supabase, crmonefactory } from '@/lib/supabase/client';
import { randomUUID } from 'crypto';

// Função auxiliar para processar a requisição multipart-form
async function processarMultipart(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    // Extrair arquivo e metadados
    const file = formData.get('file') as File;
    const licitacaoId = formData.get('licitacaoId') as string;
    const nome = formData.get('nome') as string || file.name;
    const tipo = formData.get('tipo') as string || '';
    const categoriaId = formData.get('categoriaId') as string;
    const uploadPor = formData.get('uploadPor') as string;
    
    if (!file) {
      throw new Error('Arquivo não fornecido');
    }
    
    if (!licitacaoId) {
      throw new Error('ID da licitação é obrigatório');
    }
    
    // Obter informações sobre o arquivo
    const formatoArray = file.name.split('.');
    const formato = formatoArray.length > 1 ? formatoArray.pop()?.toLowerCase() : '';
    const tamanho = file.size;
    
    // Gerar um nome único para o arquivo
    const nomeUnico = `${randomUUID()}.${formato}`;
    const caminho = `licitacoes/${licitacaoId}/${nomeUnico}`;
    
    // Array Buffer do arquivo
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);
    
    return {
      file: buffer,
      caminho,
      metadata: {
        licitacaoId,
        nome,
        tipo,
        categoriaId,
        uploadPor,
        formato,
        tamanho,
        nomeOriginal: file.name
      }
    };
  } catch (error) {
    console.error('Erro ao processar multipart:', error);
    throw error;
  }
}

// POST - Upload de documento
export async function POST(request: NextRequest) {
  try {
    const { file, caminho, metadata } = await processarMultipart(request);
    
    // 1. Fazer upload do arquivo para o Supabase Storage
    const { data: fileData, error: uploadError } = await supabase
      .storage
      .from('documentos')
      .upload(caminho, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: `application/${metadata.formato}`
      });
    
    if (uploadError) {
      console.error('Erro ao fazer upload do arquivo:', uploadError);
      return NextResponse.json(
        { error: 'Erro ao fazer upload do arquivo: ' + uploadError.message },
        { status: 500 }
      );
    }
    
    // 2. Gerar URL pública para o arquivo
    const { data: urlData } = await supabase
      .storage
      .from('documentos')
      .getPublicUrl(caminho);
    
    const url = urlData.publicUrl;
    
    // 3. Registrar o documento no banco de dados
    const documento = {
      nome: metadata.nome,
      licitacao_id: metadata.licitacaoId,
      url: url,
      arquivo: caminho,
      tipo: metadata.tipo,
      tamanho: metadata.tamanho,
      formato: metadata.formato,
      categoria_id: metadata.categoriaId,
      upload_por: metadata.uploadPor,
      status: 'ativo'
    };
    
    const { data: documentoInserido, error: dbError } = await crmonefactory
      .from('documentos')
      .insert(documento)
      .select(`
        *,
        licitacoes (id, titulo),
        documento_categorias (id, nome, descricao)
      `)
      .single();
    
    if (dbError) {
      console.error('Erro ao registrar documento no banco:', dbError);
      // Tentar remover o arquivo do storage se falhar o registro no banco
      await supabase.storage.from('documentos').remove([caminho]);
      
      return NextResponse.json(
        { error: 'Erro ao registrar documento: ' + dbError.message },
        { status: 500 }
      );
    }
    
    // Formatar o documento para retornar ao cliente
    const documentoFormatado = {
      id: documentoInserido.id,
      nome: documentoInserido.nome,
      url: documentoInserido.url,
      arquivo: documentoInserido.arquivo,
      licitacaoId: documentoInserido.licitacao_id,
      tipo: documentoInserido.tipo,
      tamanho: documentoInserido.tamanho,
      formato: documentoInserido.formato,
      categoria: documentoInserido.documento_categorias?.nome,
      categoriaId: documentoInserido.categoria_id,
      uploadPor: documentoInserido.upload_por,
      status: documentoInserido.status,
      dataCriacao: documentoInserido.data_criacao,
      dataAtualizacao: documentoInserido.data_atualizacao
    };
    
    return NextResponse.json(documentoFormatado, { status: 201 });
  } catch (error: any) {
    console.error('Erro ao processar upload de documento:', error);
    return NextResponse.json(
      { error: 'Erro ao processar upload: ' + error.message },
      { status: 500 }
    );
  }
}

// DELETE - Excluir documento (com o arquivo)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID do documento é obrigatório' },
        { status: 400 }
      );
    }
    
    // 1. Obter informações do documento
    const { data: documento, error: fetchError } = await crmonefactory
      .from('documentos')
      .select('*')
      .eq('id', id)
      .single();
    
    if (fetchError || !documento) {
      console.error('Erro ao buscar documento:', fetchError);
      return NextResponse.json(
        { error: 'Documento não encontrado' },
        { status: 404 }
      );
    }
    
    // 2. Remover arquivo do storage se existir o caminho
    if (documento.arquivo) {
      const { error: deleteStorageError } = await supabase
        .storage
        .from('documentos')
        .remove([documento.arquivo]);
      
      if (deleteStorageError) {
        console.error('Erro ao excluir arquivo do storage:', deleteStorageError);
        // Continuar mesmo se falhar a remoção do arquivo
      }
    }
    
    // 3. Excluir o registro do banco de dados
    const { error: deleteDbError } = await crmonefactory
      .from('documentos')
      .delete()
      .eq('id', id);
    
    if (deleteDbError) {
      console.error('Erro ao excluir documento do banco:', deleteDbError);
      return NextResponse.json(
        { error: 'Erro ao excluir documento: ' + deleteDbError.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Documento excluído com sucesso'
    });
  } catch (error: any) {
    console.error('Erro ao excluir documento:', error);
    return NextResponse.json(
      { error: 'Erro interno ao excluir documento: ' + error.message },
      { status: 500 }
    );
  }
}
