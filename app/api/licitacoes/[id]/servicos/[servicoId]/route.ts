import { NextRequest, NextResponse } from 'next/server';
import { getDbConnection } from '@/lib/mysql/client';

// GET - Obter um serviço específico de uma licitação
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; servicoId: string } }
) {
  let connection;
  const { id: licitacaoId, servicoId } = params;
  console.log(`GET /api/licitacoes/${licitacaoId}/servicos/${servicoId} - Iniciando consulta com MySQL`);

  try {
    if (!licitacaoId || !servicoId) {
      return NextResponse.json({ error: 'ID da Licitação e ID do Serviço são obrigatórios' }, { status: 400 });
    }
    connection = await getDbConnection();
    
    const sql = 'SELECT * FROM licitacao_servicos WHERE id = ? AND licitacao_id = ?';
    console.log("Executando SQL:", sql, [servicoId, licitacaoId]);
    const [rows]: any = await connection.execute(sql, [servicoId, licitacaoId]);

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Serviço não encontrado nesta licitação' }, { status: 404 });
    }
    
    return NextResponse.json(rows[0]);

  } catch (error: any) {
    console.error('Erro ao buscar serviço (MySQL):', error);
    return NextResponse.json(
      { error: 'Erro ao buscar serviço da licitação', details: error.message },
      { status: 500 }
    );
  } finally {
    if (connection) await connection.release();
  }
}

// PUT - Atualizar um serviço específico de uma licitação
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; servicoId: string } }
) {
  let connection;
  const { id: licitacaoId, servicoId } = params;
  console.log(`PUT /api/licitacoes/${licitacaoId}/servicos/${servicoId} - Iniciando atualização com MySQL`);

  try {
    if (!licitacaoId || !servicoId) {
      return NextResponse.json({ error: 'ID da Licitação e ID do Serviço são obrigatórios' }, { status: 400 });
    }
    const data = await request.json();
    console.log("Dados recebidos para atualização:", data);
    
    if (!data.nome) { // Adicionar mais validações conforme necessário
      return NextResponse.json({ error: 'Nome do serviço é obrigatório' }, { status: 400 });
    }
    
    const fieldsToUpdate: any = {
      nome: data.nome,
      descricao: data.descricao || null,
      valor: data.valor !== undefined ? Number(data.valor) : null,
      unidade: data.unidade || null,
      quantidade: data.quantidade !== undefined ? Number(data.quantidade) : null,
      // updated_at é atualizado automaticamente pelo MySQL (ON UPDATE CURRENT_TIMESTAMP)
    };
    
    const fieldNames = Object.keys(fieldsToUpdate).filter(key => fieldsToUpdate[key] !== undefined);
    // Permitir que campos sejam explicitamente definidos como null para limpá-los, se a lógica de negócios permitir
    // Se um campo não está no payload 'data', ele não será incluído no update.
    
    if (fieldNames.length === 0) {
        return NextResponse.json({ error: "Nenhum campo para atualizar fornecido." }, { status: 400 });
    }

    const fieldPlaceholders = fieldNames.map(key => `${key} = ?`).join(', ');
    const values = fieldNames.map(key => fieldsToUpdate[key]);

    // Adicionar updated_at = NOW() manualmente se não for ON UPDATE CURRENT_TIMESTAMP
    const sql = `UPDATE licitacao_servicos SET ${fieldPlaceholders}, updated_at = NOW() WHERE id = ? AND licitacao_id = ?`;
    values.push(servicoId, licitacaoId);
    
    connection = await getDbConnection();
    console.log("Executando SQL Update:", sql, values);
    const [result]: any = await connection.execute(sql, values);

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: 'Serviço não encontrado ou nenhum dado alterado' }, { status: 404 });
    }

    // Buscar e retornar o serviço atualizado
    const [updatedRows]: any = await connection.execute('SELECT * FROM licitacao_servicos WHERE id = ?', [servicoId]);
     if (updatedRows.length === 0) {
        return NextResponse.json({ error: "Serviço atualizado, mas erro ao re-buscar." }, { status: 500 });
    }
    return NextResponse.json(updatedRows[0]);

  } catch (error: any) {
    console.error('Erro ao atualizar serviço (MySQL):', error);
    return NextResponse.json(
      { error: 'Erro interno ao atualizar serviço', details: error.message },
      { status: 500 }
    );
  } finally {
    if (connection) await connection.release();
  }
}

// DELETE - Excluir um serviço específico de uma licitação
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; servicoId: string } }
) {
  let connection;
  const { id: licitacaoId, servicoId } = params;
  console.log(`DELETE /api/licitacoes/${licitacaoId}/servicos/${servicoId} - Iniciando exclusão com MySQL`);

  try {
    if (!licitacaoId || !servicoId) {
      return NextResponse.json({ error: 'ID da Licitação e ID do Serviço são obrigatórios' }, { status: 400 });
    }
    connection = await getDbConnection();
    
    const sql = 'DELETE FROM licitacao_servicos WHERE id = ? AND licitacao_id = ?';
    console.log("Executando SQL:", sql, [servicoId, licitacaoId]);
    const [result]: any = await connection.execute(sql, [servicoId, licitacaoId]);
    
    if (result.affectedRows === 0) {
      return NextResponse.json({ error: 'Serviço não encontrado para exclusão' }, { status: 404 });
    }
    
    return NextResponse.json({ message: 'Serviço excluído com sucesso' }); // Ou status 204

  } catch (error: any) {
    console.error('Erro ao excluir serviço (MySQL):', error);
    return NextResponse.json(
      { error: 'Erro interno ao excluir serviço' },
      { status: 500 }
    );
  }
}