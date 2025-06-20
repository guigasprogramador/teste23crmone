import { NextRequest, NextResponse } from 'next/server';
import { supabase, crmonefactory } from '@/lib/supabase/client';

// POST - Upload de arquivo para o Supabase Storage e registro na tabela doc
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Verificar se a requisição é do tipo multipart/form-data
    const contentType = request.headers.get('content-type');
    if (!contentType || !contentType.includes('multipart/form-data')) {
      return NextResponse.json(
        { error: 'Requisição deve ser multipart/form-data' },
        { status: 400 }
      );
    }

    // Processar o formulário
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    
    // Extrair outros campos do formulário
    const nome = formData.get('nome') as string | null;
    const tipo = formData.get('tipo') as string | null;
    const categoria = formData.get('categoria') as string | null;
    const descricao = formData.get('descricao') as string | null;
    const licitacaoId = formData.get('licitacaoId') as string | null;
    const numeroDocumento = formData.get('numeroDocumento') as string | null;
    const dataValidade = formData.get('dataValidade') as string | null;
    const urlDocumento = formData.get('urlDocumento') as string | null;

    // Validar campos obrigatórios
    if (!file) {
      return NextResponse.json(
        { error: 'Nenhum arquivo enviado' },
        { status: 400 }
      );
    }

    if (!nome || !tipo || !categoria) {
      return NextResponse.json(
        { error: 'Nome, tipo e categoria são campos obrigatórios' },
        { status: 400 }
      );
    }

    // Gerar um nome de arquivo único para evitar colisões
    const fileName = file.name;
    const fileExt = fileName.split('.').pop();
    const uniqueId = Date.now() + '-' + Math.random().toString(36).substring(2, 9);
    const uniqueFileName = `${uniqueId}.${fileExt}`;
    
    // Caminho do arquivo no bucket do Supabase
    const directoryPath = licitacaoId ? `docs/${licitacaoId}` : 'docs';
    const filePath = `${directoryPath}/${uniqueFileName}`;

    // Obter os bytes do arquivo
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload para o Supabase Storage
    let uploadResult;
    
    try {
      // Tentar fazer o upload
      const { data, error } = await supabase.storage
        .from('documentos')
        .upload(filePath, buffer, {
          contentType: file.type,
          upsert: false
        });
        
      if (error) {
        // Verificar se é por causa do bucket não existir
        if (error.message.includes('bucket') && error.message.includes('created first')) {
          // Tentar criar o bucket
          const { error: bucketError } = await supabase.storage.createBucket('documentos', {
            public: true
          });
          
          if (bucketError) {
            console.error('Erro ao criar bucket documentos:', bucketError);
            return NextResponse.json(
              { error: 'Erro ao criar bucket de documentos' },
              { status: 500 }
            );
          }
          
          // Tentar novamente o upload após criar o bucket
          const { data: retryData, error: retryError } = await supabase.storage
            .from('documentos')
            .upload(filePath, buffer, {
              contentType: file.type,
              upsert: false
            });
            
          if (retryError) {
            console.error('Erro no upload após criar bucket:', retryError);
            return NextResponse.json(
              { error: 'Erro ao fazer upload do arquivo após criar bucket' },
              { status: 500 }
            );
          }
          
          uploadResult = retryData;
        } else {
          console.error('Erro no upload para o Supabase Storage:', error);
          return NextResponse.json(
            { error: 'Erro ao fazer upload do arquivo: ' + error.message },
            { status: 500 }
          );
        }
      } else {
        uploadResult = data;
      }
    } catch (uploadError) {
      console.error('Erro durante upload:', uploadError);
      return NextResponse.json(
        { error: 'Erro interno durante upload do arquivo' },
        { status: 500 }
      );
    }
    
    // Obter URL pública do arquivo
    const { data: publicUrl } = await supabase.storage
      .from('documentos')
      .getPublicUrl(filePath);
      
    if (!publicUrl) {
      console.error('Erro ao obter URL pública do arquivo');
      return NextResponse.json(
        { error: 'Erro ao obter URL pública do arquivo' },
        { status: 500 }
      );
    }

    console.log('Arquivo enviado com sucesso. URL pública:', publicUrl);
    
    // Registrar o documento na tabela doc
    try {      
      // Data atual para os campos de auditoria
      const dataAtual = new Date().toISOString();
      
      // Verificar e formatar corretamente a data de validade, se existir
      let dataValidadeFormatada = null;
      if (dataValidade) {
        // Se a data estiver no formato DD/MM/YYYY, converter para YYYY-MM-DD
        if (dataValidade.includes('/')) {
          const partes = dataValidade.split('/');
          if (partes.length === 3) {
            const [dia, mes, ano] = partes;
            dataValidadeFormatada = `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
          }
        } else {
          // Assumir que já está em formato ISO
          dataValidadeFormatada = dataValidade;
        }
        console.log(`Data de validade convertida: ${dataValidade} -> ${dataValidadeFormatada}`);
      }
      
      // Corrigir a formatação dos dados a serem inseridos
      const docData = {
        nome: nome,
        tipo: tipo,
        categoria: categoria,
        descricao: descricao || null,
        licitacao_id: licitacaoId || null,
        numero_documento: numeroDocumento || null,
        data_validade: dataValidadeFormatada,
        url_documento: urlDocumento || null,
        arquivo_path: filePath,
        formato: fileExt,
        tamanho: buffer.length,
        status: 'ativo',
        data_criacao: dataAtual,
        data_atualizacao: dataAtual
      };
      
      console.log('Tentando inserir dados na tabela doc:', JSON.stringify(docData, null, 2));
      
      // Tentar múltiplas abordagens para inserir o documento
      let documentoInserido = null;
      let insertError = null;

      // Abordagem 1: Usar cliente normal com tabela não qualificada
      console.log("Tentativa 1: Inserir usando client normal com tabela não qualificada");
      try {
        const resultado = await crmonefactory
          .from('doc')
          .insert([docData])
          .select();
        
        if (resultado.error) {
          console.error("Erro na tentativa 1:", resultado.error);
          insertError = resultado.error;
        } else {
          documentoInserido = resultado.data;
          console.log("Sucesso na tentativa 1!");
        }
      } catch (err) {
        console.error("Exceção na tentativa 1:", err);
      }
      
      // Abordagem 2: Usar cliente normal com tabela qualificada
      if (!documentoInserido) {
        console.log("Tentativa 2: Inserir usando client normal com tabela qualificada");
        try {
          const resultado = await supabase
            .from('crmonefactory.doc')
            .insert([docData])
            .select();
          
          if (resultado.error) {
            console.error("Erro na tentativa 2:", resultado.error);
            insertError = resultado.error;
          } else {
            documentoInserido = resultado.data;
            console.log("Sucesso na tentativa 2!");
          }
        } catch (err) {
          console.error("Exceção na tentativa 2:", err);
        }
      }
      
      // Verificar o resultado final
      if (!documentoInserido) {
        console.error('Erro ao registrar documento no banco de dados:', insertError);
        if (insertError) {
          console.error('Código do erro:', insertError.code);
          console.error('Detalhes do erro:', insertError.details);
          console.error('Mensagem do erro:', insertError.message);
        }
        
        // Retornar sucesso parcial já que o arquivo foi enviado
        return NextResponse.json({
          success: true,
          warning: 'Arquivo enviado com sucesso, mas houve um erro ao registrar no banco de dados',
          error: insertError ? insertError.message : 'Erro desconhecido',
          errorDetails: insertError ? {
            code: insertError.code,
            details: insertError.details
          } : undefined,
          file: {
            originalName: fileName,
            name: uniqueFileName,
            size: buffer.length,
            url: publicUrl.publicUrl,
            path: filePath
          }
        }, { status: 201 });
      }
      
      console.log('Documento registrado com sucesso no banco de dados:', documentoInserido);
      
      // Retornar sucesso completo
      return NextResponse.json({
        success: true,
        message: 'Arquivo enviado e registrado com sucesso',
        documento: documentoInserido ? documentoInserido[0] : null,
        file: {
          originalName: fileName,
          name: uniqueFileName,
          size: buffer.length,
          url: publicUrl.publicUrl,
          path: filePath
        }
      }, { status: 201 });
    }
    catch (dbError: any) {
      console.error('Erro inesperado ao registrar documento:', dbError);
      console.error('Stack trace:', dbError.stack);
      
      if (dbError.details) {
        console.error('Detalhes do erro:', dbError.details);
      }
      
      // Retornar sucesso parcial já que o arquivo foi enviado, mesmo que o registro falhe
      return NextResponse.json({
        success: true,
        warning: 'Arquivo enviado com sucesso, mas houve um erro ao registrar no banco de dados',
        error: dbError.message || 'Erro desconhecido',
        errorStack: process.env.NODE_ENV === 'development' ? dbError.stack : undefined,
        file: {
          originalName: fileName,
          name: uniqueFileName,
          size: buffer.length,
          url: publicUrl.publicUrl,
          path: filePath
        }
      }, { status: 201 });
    }
    
  } catch (error: any) {
    console.error('Erro ao fazer upload de arquivo:', error);
    return NextResponse.json(
      { error: 'Erro ao processar upload de arquivo: ' + error.message },
      { status: 500 }
    );
  }
}
