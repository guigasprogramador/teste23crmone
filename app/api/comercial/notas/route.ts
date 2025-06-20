import { NextRequest, NextResponse } from 'next/server';
// import { Nota } from '@/types/comercial'; // A interface Nota pode precisar ser atualizada
import { getDbConnection } from '@/lib/mysql/client';
import { v4 as uuidv4 } from 'uuid';

// GET - Listar todas as notas ou filtrar por oportunidade
export async function GET(request: NextRequest) {
  let connection;
  console.log("GET /api/comercial/notas - Iniciando consulta com MySQL");
  try {
    const { searchParams } = new URL(request.url);
    const oportunidadeId = searchParams.get('oportunidadeId');
    
    connection = await getDbConnection();
    
    let sql = `
      SELECT
        n.id,
        n.oportunidade_id AS oportunidadeId,
        n.texto,
        n.tipo,
        n.created_at AS data,
        u.name AS autor,
        n.autor_id AS autorId
      FROM notas n
      LEFT JOIN users u ON n.autor_id = u.id
    `;
    const params: any[] = [];

    if (oportunidadeId) {
      sql += ' WHERE n.oportunidade_id = ?';
      params.push(oportunidadeId);
    }
    
    sql += ' ORDER BY n.created_at DESC';
    
    console.log("Executando SQL:", sql, params);
    const [rows] = await connection.execute(sql, params);

    return NextResponse.json(rows);

  } catch (error: any) {
    console.error('Erro ao buscar notas (MySQL):', error);
    return NextResponse.json(
      { error: 'Erro ao buscar notas', details: error.message },
      { status: 500 }
    );
  } finally {
    if (connection) {
      try {
        await connection.release();
        console.log("Conexão MySQL liberada (GET Notas).");
      } catch (releaseError: any) {
        console.error("Erro ao liberar conexão MySQL (GET Notas):", releaseError.message);
      }
    }
  }
}

// POST - Criar nova nota
export async function POST(request: NextRequest) {
  let connection;
  console.log("POST /api/comercial/notas - Iniciando criação com MySQL");
  try {
    const data = await request.json();
    console.log("Dados recebidos:", data);
    
    // Validação básica
    // O campo 'autor' (nome do autor) não é mais obrigatório no corpo, pois será buscado pelo autorId.
    // autorId é o ID do usuário logado, que deve ser obtido do token de autenticação no futuro.
    // Por enquanto, para esta refatoração, esperamos autorId no corpo da requisição.
    if (!data.oportunidadeId || !data.texto || !data.autorId) {
      return NextResponse.json(
        { error: 'ID da oportunidade, ID do autor e texto são obrigatórios' },
        { status: 400 }
      );
    }
    
    const newNotaId = uuidv4();
    // O tipo é opcional, o DB tem default 'geral'
    const tipo = data.tipo || 'geral';

    const novaNotaDB = {
      id: newNotaId,
      oportunidade_id: data.oportunidadeId,
      autor_id: data.autorId, // Este deve ser o UUID do usuário logado
      texto: data.texto,
      tipo: tipo,
      // created_at e updated_at serão definidos por NOW() no SQL
    };
    
    connection = await getDbConnection();
    const sqlInsert = 'INSERT INTO notas (id, oportunidade_id, autor_id, texto, tipo, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())';
    await connection.execute(sqlInsert, Object.values(novaNotaDB));

    console.log("Nova nota criada com ID:", newNotaId);

    // Para retornar o objeto completo incluindo o nome do autor e o timestamp gerado pelo DB:
    const sqlSelectNew = `
      SELECT
        n.id,
        n.oportunidade_id AS oportunidadeId,
        n.texto,
        n.tipo,
        n.created_at AS data,
        u.name AS autor,
        n.autor_id AS autorId
      FROM notas n
      LEFT JOIN users u ON n.autor_id = u.id
      WHERE n.id = ?
    `;
    const [createdRows]: any = await connection.execute(sqlSelectNew, [newNotaId]);

    if (createdRows.length === 0) {
        // Isso seria inesperado
        return NextResponse.json({ error: "Falha ao recuperar nota recém-criada" }, { status: 500 });
    }
    
    return NextResponse.json(createdRows[0], { status: 201 });

  } catch (error: any) {
    console.error('Erro ao criar nota (MySQL):', error);
    return NextResponse.json(
      { error: 'Erro ao criar nota' },
      { status: 500 }
    );
  }
}
