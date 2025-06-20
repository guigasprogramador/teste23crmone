import { NextResponse } from 'next/server'
import { crmonefactory } from '@/lib/supabase'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log('[API] Buscando contato por ID:', params.id)
    
    const { data, error } = await crmonefactory
      .from('orgao_contatos')
      .select('*')
      .eq('id', params.id)
      .single()
    
    if (error) {
      console.error('[API] Erro ao buscar contato:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar contato', details: error.message },
        { status: 500 }
      )
    }
    
    if (!data) {
      return NextResponse.json(
        { error: 'Contato não encontrado' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('[API] Erro na API GET de contato por ID:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log('[API] Atualizando contato por ID:', params.id)
    
    const body = await request.json()
    
    // Garantir que o ID na URL e no corpo são iguais
    if (body.id && body.id !== params.id) {
      return NextResponse.json(
        { error: 'ID no corpo e na URL não correspondem' },
        { status: 400 }
      )
    }
    
    // Adicionar campo de atualização
    const contatoAtualizado = {
      ...body,
      data_atualizacao: new Date().toISOString()
    }
    
    // Atualizar contato
    const { data, error } = await crmonefactory
      .from('orgao_contatos')
      .update(contatoAtualizado)
      .eq('id', params.id)
      .select()
    
    if (error) {
      console.error('[API] Erro ao atualizar contato:', error)
      return NextResponse.json(
        { error: 'Erro ao atualizar contato', details: error.message },
        { status: 500 }
      )
    }
    
    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: 'Contato não encontrado para atualização' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(data[0])
  } catch (error) {
    console.error('[API] Erro na API PUT de contato:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log('[API] Excluindo contato por ID:', params.id)
    
    // Excluir contato
    const { error } = await crmonefactory
      .from('orgao_contatos')
      .delete()
      .eq('id', params.id)
    
    if (error) {
      console.error('[API] Erro ao excluir contato:', error)
      return NextResponse.json(
        { error: 'Erro ao excluir contato', details: error.message },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[API] Erro na API DELETE de contato:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
