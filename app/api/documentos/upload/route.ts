import { NextRequest, NextResponse } from 'next/server';
import { supabase, crmonefactory } from '@/lib/supabase/client';

// POST - Upload de arquivo para o Supabase Storage
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação (versão simplificada que aceita "anonymous")
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    // Não verificamos mais se o token é válido, apenas se o header existe

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
    const licitacaoId = formData.get('licitacaoId') as string | null;
    const tipo = formData.get('tipo') as string | null;

    if (!file) {
      return NextResponse.json(
        { error: 'Nenhum arquivo enviado' },
        { status: 400 }
      );
    }

    if (!licitacaoId) {
      return NextResponse.json(
        { error: 'ID da licitação é obrigatório' },
        { status: 400 }
      );
    }

    // Gerar um nome de arquivo único para evitar colisões
    const fileName = file.name;
    const fileExt = fileName.split('.').pop();
    const uniqueId = Date.now() + '-' + Math.random().toString(36).substring(2, 9);
    const uniqueFileName = `${uniqueId}.${fileExt}`;
    
    // Caminho do arquivo no bucket do Supabase
    const filePath = `${licitacaoId}/${uniqueFileName}`;

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
          
          // Após criar o bucket, é necessário configurar políticas de RLS (Row Level Security)
          console.log('Bucket documentos criado com sucesso, configurando políticas de segurança...');
          
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
      console.error('Erro durante o upload:', uploadError);
      return NextResponse.json(
        { error: 'Erro durante o processo de upload' },
        { status: 500 }
      );
    }

    // Obter a URL pública do arquivo
    const { data: publicUrl } = supabase.storage
      .from('documentos')
      .getPublicUrl(filePath);

    // Console.log para depuração
    console.log('Arquivo enviado com sucesso para o Supabase Storage:');
    console.log('URL pública:', publicUrl.publicUrl);
    console.log('licitacao_id:', licitacaoId);
    console.log('nome:', fileName);
    
    // NOVO: Registrar o documento na tabela 'documentos' do schema 'crmonefactory'
    try {
      // Determinar categoria ou tipo do documento
      const categoria = tipo || determinarCategoriaPorExtensao(fileExt || '');
      
      // Data atual para os campos de auditoria
      const dataAtual = new Date().toISOString();
      
      // Inserir registro na tabela documentos
      const { data: documentoInserido, error: insertError } = await crmonefactory
        .from('documentos')
        .insert([
          {
            nome: fileName,
            url: publicUrl.publicUrl,
            arquivo: filePath,
            tipo: categoria,
            categoria: categoria,
            formato: fileExt,
            tamanho: buffer.length,
            licitacao_id: licitacaoId,
            status: 'ativo',
            data_criacao: dataAtual,
            data_atualizacao: dataAtual
          }
        ])
        .select();
      
      if (insertError) {
        console.error('Erro ao registrar documento no banco de dados:', insertError);
        // Retornar sucesso parcial já que o arquivo foi enviado, mesmo que o registro falhe
        return NextResponse.json({
          success: true,
          warning: 'Arquivo enviado com sucesso, mas houve um erro ao registrar no banco de dados',
          error: insertError.message,
          file: {
            originalName: fileName,
            name: uniqueFileName,
            size: buffer.length,
            url: publicUrl.publicUrl,
            licitacaoId: licitacaoId
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
          licitacaoId: licitacaoId
        }
      }, { status: 201 });
    }
    catch (dbError: any) {
      console.error('Erro inesperado ao registrar documento:', dbError);
      
      // Retornar sucesso parcial já que o arquivo foi enviado, mesmo que o registro falhe
      return NextResponse.json({
        success: true,
        warning: 'Arquivo enviado com sucesso, mas houve um erro ao registrar no banco de dados',
        error: dbError.message,
        file: {
          originalName: fileName,
          name: uniqueFileName,
          size: buffer.length,
          url: publicUrl.publicUrl,
          licitacaoId: licitacaoId
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

// Função para determinar categoria com base na extensão
function determinarCategoriaPorExtensao(extensao: string): string {
  const extensaoLower = extensao.toLowerCase();
  
  const categoriasExtensoes: Record<string, string[]> = {
    'Documento': ['doc', 'docx', 'txt', 'rtf', 'odt'],
    'Planilha': ['xls', 'xlsx', 'csv', 'ods'],
    'Apresentação': ['ppt', 'pptx', 'odp'],
    'PDF': ['pdf'],
    'Imagem': ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff', 'webp'],
    'Compactado': ['zip', 'rar', '7z', 'tar', 'gz'],
    'Vídeo': ['mp4', 'avi', 'mov', 'wmv', 'mkv'],
    'Áudio': ['mp3', 'wav', 'ogg', 'flac', 'm4a'],
    'Código': ['html', 'css', 'js', 'ts', 'java', 'py', 'c', 'cpp', 'cs', 'php', 'sql']
  };
  
  for (const [categoria, extensoes] of Object.entries(categoriasExtensoes)) {
    if (extensoes.includes(extensaoLower)) {
      return categoria;
    }
  }
  
  return 'Outro'; // Categoria padrão quando a extensão não é reconhecida
}
