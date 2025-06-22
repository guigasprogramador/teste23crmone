import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { getDbConnection } from '@/lib/mysql/client';
import { verifyJwtToken } from '@/lib/auth/jwt'; // Assuming this function exists and works

const UPLOAD_DIR = path.join(process.cwd(), 'public/uploads/documents');

// Helper function to format document for response (adjust based on actual needs)
const formatDocumentForResponse = async (connection: any, documentId: string) => {
  // This query needs to join with users, licitacoes, and aggregate tags
  // Placeholder - adapt this query to your actual schema and needs
  const [rows]: any = await connection.execute(
    `SELECT
      d.*,
      u.nome_completo as criado_por_nome,
      l.titulo as licitacao_titulo,
      GROUP_CONCAT(t.nome) as tags_concatenadas
    FROM documentos d
    LEFT JOIN usuarios u ON d.criado_por = u.id
    LEFT JOIN licitacoes l ON d.licitacao_id = l.id
    LEFT JOIN documentos_tags dt ON d.id = dt.documento_id
    LEFT JOIN tags t ON dt.tag_id = t.id
    WHERE d.id = ?
    GROUP BY d.id`,
    [documentId]
  );
  if (rows.length > 0) {
    const doc = rows[0];
    return {
      ...doc,
      tags: doc.tags_concatenadas ? doc.tags_concatenadas.split(',') : [],
      data_criacao: new Date(doc.data_criacao).toISOString(),
      data_atualizacao: new Date(doc.data_atualizacao).toISOString(),
      data_validade: doc.data_validade ? new Date(doc.data_validade).toISOString().split('T')[0] : null, // Format as YYYY-MM-DD
    };
  }
  return null;
};

export async function POST(request: NextRequest) {
  let connection;
  try {
    let token = request.cookies.get('accessToken')?.value;
    const authHeader = request.headers.get('authorization');

    if (!token && authHeader && authHeader.startsWith('Bearer ')) {
      console.log("Token not found in cookie, attempting to use Authorization header for POST /api/documentos/doc/upload");
      token = authHeader.split(' ')[1];
    }

    if (!token) {
      return NextResponse.json({ error: 'Não autorizado: token não fornecido' }, { status: 401 });
    }
    const tokenPayload = await verifyJwtToken(token); // Assuming verifyJwtToken takes a token string
    if (!tokenPayload || !tokenPayload.userId) {
      return NextResponse.json({ error: 'Não autorizado ou token inválido' }, { status: 401 });
    }
    const userIdFromToken = tokenPayload.userId;

    const contentType = request.headers.get('content-type');
    if (!contentType || !contentType.includes('multipart/form-data')) {
      return NextResponse.json({ error: 'Requisição deve ser multipart/form-data' }, { status: 400 });
    }

    // Ensure UPLOAD_DIR exists
    if (!fs.existsSync(UPLOAD_DIR)) {
      fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 });
    }

    // --- File Processing ---
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const fileExt = path.extname(file.name);
    const originalFilename = file.name;
    const storedFilename = `${uuidv4()}${fileExt}`;
    const fullPath = path.join(UPLOAD_DIR, storedFilename);
    const relativePathForDb = path.join('uploads/documents', storedFilename); // Relative to 'public/'

    // Save file to disk
    fs.writeFileSync(fullPath, fileBuffer);

    // --- Database Operations ---
    connection = await getDbConnection();
    await connection.beginTransaction();

    // --- Document Metadata ---
    const newDocumentId = uuidv4();
    const nome = formData.get('nome') as string || originalFilename;
    const tipo = formData.get('tipo') as string;
    const licitacaoId = formData.get('licitacaoId') as string | null;
    const descricao = formData.get('descricao') as string | null;
    const numeroDocumento = formData.get('numeroDocumento') as string | null;
    let dataValidade = formData.get('dataValidade') as string | null; // Expects YYYY-MM-DD
    const categoriaForm = formData.get('categoria') as string | null; // Changed from categoriaLegado, and from formData
    const tagsString = formData.get('tags') as string | null; // Expects comma-separated string e.g., "tag1,tag2"

    if (!tipo) {
      await connection.rollback(); // Rollback before returning error
      fs.unlinkSync(fullPath); // Delete uploaded file if metadata is bad
      return NextResponse.json({ error: 'Campo "tipo" é obrigatório.' }, { status: 400 });
    }
    
    // Basic date validation for dataValidade
    if (dataValidade && !/^\d{4}-\d{2}-\d{2}$/.test(dataValidade)) {
        // Try to parse if DD/MM/YYYY
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(dataValidade)) {
            const [day, month, year] = dataValidade.split('/');
            dataValidade = `${year}-${month}-${day}`;
        } else {
            await connection.rollback();
            fs.unlinkSync(fullPath);
            return NextResponse.json({ error: 'Formato de dataValidade inválido. Use YYYY-MM-DD.' }, { status: 400 });
        }
    }


    const documentoDb = {
      id: newDocumentId,
      nome: nome,
      tipo: tipo,
      licitacao_id: licitacaoId || null,
      criado_por: userIdFromToken,
      arquivo_path: relativePathForDb,
      url_documento: `/api/documentos/doc/${newDocumentId}/download`,
      formato: fileExt ? fileExt.substring(1) : null,
      tamanho: fileBuffer.length,
      status: 'ativo',
      descricao: descricao || null,
      numero_documento: numeroDocumento || null,
      data_validade: dataValidade ? new Date(dataValidade) : null,
      categoria: categoriaForm || null, // Changed key to categoria
      // data_criacao and data_atualizacao will use default MySQL CURRENT_TIMESTAMP
    };

    await connection.execute(
      `INSERT INTO documentos (id, nome, tipo, licitacao_id, criado_por, arquivo_path, url_documento, formato, tamanho, status, descricao, numero_documento, data_validade, categoria)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, // Changed column to categoria
      [
        documentoDb.id,
        documentoDb.nome,
        documentoDb.tipo,
        documentoDb.licitacao_id,
        documentoDb.criado_por,
        documentoDb.arquivo_path,
        documentoDb.url_documento,
        documentoDb.formato,
        documentoDb.tamanho,
        documentoDb.status,
        documentoDb.descricao,
        documentoDb.numero_documento,
        documentoDb.data_validade,
        documentoDb.categoria, // Changed to use categoria
      ]
    );

    // --- Handle Tags ---
    if (tagsString) {
      const tagNames = tagsString.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
      if (tagNames.length > 0) {
        for (const tagName of tagNames) {
          // Find or create tag
          let [[tag]]: any = await connection.execute('SELECT id FROM tags WHERE nome = ?', [tagName]);
          let tagId;
          if (!tag) {
            tagId = uuidv4();
            await connection.execute('INSERT INTO tags (id, nome) VALUES (?, ?)', [tagId, tagName]);
          } else {
            tagId = tag.id;
          }
          // Link document to tag
          await connection.execute('INSERT INTO documentos_tags (documento_id, tag_id) VALUES (?, ?)', [newDocumentId, tagId]);
        }
      }
    }

    await connection.commit();

    const formattedDocument = await formatDocumentForResponse(connection, newDocumentId);

    return NextResponse.json({
      success: true,
      message: 'Documento enviado e registrado com sucesso',
      documento: formattedDocument
    }, { status: 201 });

  } catch (error: any) {
    console.error('Erro no upload:', error);
    if (connection) {
      await connection.rollback();
    }
    // Attempt to delete file if it was saved and an error occurred later
    // This requires fullPath to be defined if file processing stage was reached
    // const fullPath = path.join(UPLOAD_DIR, storedFilename); // Need storedFilename from above
    // if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);


    if (error.message.includes('Token inválido') || error.message.includes('Não autorizado')) {
        return NextResponse.json({ error: 'Não autorizado: Token inválido ou ausente.' }, { status: 401 });
    }
    if (error.code === 'ER_DUP_ENTRY') {
        return NextResponse.json({ error: 'Erro de duplicidade ao inserir dados.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Erro interno do servidor', details: error.message }, { status: 500 });
  } finally {
    if (connection) {
      await connection.release();
    }
  }
}
