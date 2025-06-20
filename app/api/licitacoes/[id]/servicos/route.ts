import { NextRequest, NextResponse } from 'next/server';
import { getDbConnection } from '@/lib/mysql/client';
import { v4 as uuidv4 } from 'uuid';

// GET - Listar todos os serviços de uma licitação
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  let connection;
  const licitacaoId = params.id;
  console.log(`GET /api/licitacoes/${licitacaoId}/servicos - Iniciando consulta com MySQL`);
  try {
    if (!licitacaoId) {
      return NextResponse.json({ error: 'ID da Licitação é obrigatório' }, { status: 400 });
    }
    connection = await getDbConnection();

    const sql = 'SELECT * FROM licitacao_servicos WHERE licitacao_id = ? ORDER BY created_at DESC';
    console.log("Executando SQL:", sql, [licitacaoId]);
    const [rows] = await connection.execute(sql, [licitacaoId]);
    
    return NextResponse.json(rows || []);
  } catch (error: any) {
    console.error('Erro ao buscar serviços (MySQL):', error);
    return NextResponse.json(
      { error: 'Erro ao buscar serviços da licitação', details: error.message },
      { status: 500 }
    );
  } finally {
    if (connection) await connection.release();
  }
}

// POST - Adicionar um novo serviço a uma licitação
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  let connection;
  const licitacaoId = params.id;
  console.log(`POST /api/licitacoes/${licitacaoId}/servicos - Iniciando criação com MySQL`);
  try {
    if (!licitacaoId) {
      return NextResponse.json({ error: 'ID da Licitação é obrigatório para adicionar serviço' }, { status: 400 });
    }
    const data = await request.json();
    console.log("Dados recebidos para novo serviço:", data);
    
    if (!data.nome) {
      return NextResponse.json({ error: 'Nome do serviço é obrigatório' }, { status: 400 });
    }
    
    const newServicoId = uuidv4();
    const servicoDb = {
      id: newServicoId,
      licitacao_id: licitacaoId,
      nome: data.nome,
      descricao: data.descricao || null,
      valor: data.valor !== undefined ? Number(data.valor) : 0.00,
      unidade: data.unidade || 'unidade',
      quantidade: data.quantidade !== undefined ? Number(data.quantidade) : 1,
      // created_at e updated_at serão definidos por NOW() no SQL
    };
    
    connection = await getDbConnection();
    const sqlInsert = 'INSERT INTO licitacao_servicos (id, licitacao_id, nome, descricao, valor, unidade, quantidade, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())';
    await connection.execute(sqlInsert, Object.values(servicoDb));
    
    console.log("Novo serviço criado com ID:", newServicoId, "para licitação ID:", licitacaoId);

    // Para retornar o objeto completo incluindo timestamps gerados pelo DB:
    const [createdRows]: any = await connection.execute('SELECT * FROM licitacao_servicos WHERE id = ?', [newServicoId]);
    if (createdRows.length === 0) {
        return NextResponse.json({ error: "Falha ao recuperar serviço recém-criado" }, { status: 500 });
    }
    
    return NextResponse.json(createdRows[0], { status: 201 });

  } catch (error: any) {
    console.error('Erro ao adicionar serviço (MySQL):', error);
    return NextResponse.json(
      { error: 'Erro interno ao adicionar serviço' },
      { status: 500 }
    );
  }
}