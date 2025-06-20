import { NextResponse } from 'next/server'
import { crmonefactory } from '@/lib/supabase'

export async function GET(request: Request) {
  try {
    console.log('[API] Recebendo requisição para contatos')
    
    // Obter parâmetros de consulta
    const { searchParams } = new URL(request.url)
    const orgaoId = searchParams.get('orgao_id')
    
    console.log('[API] Consultando contatos para orgão ID:', orgaoId)
    
    // Adicionar cabeçalhos para evitar cache
    const headers = {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
    
    // Se tiver orgao_id, filtrar por ele
    if (orgaoId) {
      // Primeiro, verificar se existem contatos para este órgão
      console.log('[API] Buscando contatos para o órgão:', orgaoId)
      const { data, error } = await crmonefactory
        .from('orgao_contatos')
        .select('*')
        .eq('orgao_id', orgaoId)
      
      if (error) {
        console.error('[API] Erro ao buscar contatos pelo orgao_id:', error)
        return NextResponse.json(
          { error: 'Erro ao consultar contatos', details: error.message },
          { status: 500, headers }
        )
      }
      
      console.log('[API] Contatos encontrados:', data?.length || 0)
      if (data) {
        data.forEach(contato => {
          console.log('[API] Contato:', contato.id, contato.nome)
        })
      }
      
      // Retornar os resultados
      return NextResponse.json(data || [], { headers })
    }
    
    // Caso sem filtro de órgão, buscar todos os contatos
    console.log('[API] Buscando todos os contatos')
    const { data: allData, error: allError } = await crmonefactory
      .from('orgao_contatos')
      .select('*')
    
    if (allError) {
      console.error('[API] Erro ao buscar todos os contatos:', allError)
      return NextResponse.json(
        { error: 'Erro ao consultar contatos', details: allError.message },
        { status: 500, headers }
      )
    }
    
    console.log('[API] Total de contatos encontrados:', allData?.length || 0)
    
    // Retornar todos os resultados
    return NextResponse.json(allData || [], { headers })
  } catch (error) {
    console.error('[API] Erro na API de contatos:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    console.log('[API] Recebendo requisição POST para criar contato')
    
    // Obter dados do corpo da requisição
    const body = await request.json()
    
    console.log('[API] Dados do contato:', body)
    
    if (!body.orgao_id || !body.nome) {
      return NextResponse.json(
        { error: 'orgao_id e nome são obrigatórios' },
        { status: 400 }
      )
    }
    
    // Verificar se o órgão existe - usando try/catch para evitar falhas de permissão
    console.log('[API] Verificando se o órgão existe:', body.orgao_id)
    let orgaoExiste = false
    
    try {
      const { data, error } = await crmonefactory
        .from('orgaos')
        .select('id')
        .eq('id', body.orgao_id)
        .maybeSingle()
        
      if (error) {
        console.error('[API] Erro ao verificar órgão:', error)
      } else {
        orgaoExiste = !!data
        console.log('[API] Órgão existe?', orgaoExiste)
      }
    } catch (err) {
      console.error('[API] Exceção ao verificar órgão:', err)
    }
    
    // Se o órgão não existir, criá-lo primeiro
    if (!orgaoExiste) {
      console.log('[API] Órgão não existe, criando-o primeiro')
      
      // Buscar dados do órgão (caso tenha sido fornecido no corpo)
      const orgaoNome = body.orgaoNome || 'Órgão sem nome'
      
      try {
        // Criar órgão com campos mínimos
        const { error: createError } = await crmonefactory
          .from('orgaos')
          .insert({
            id: body.orgao_id,
            nome: orgaoNome
          })
        
        if (createError) {
          console.error('[API] Erro ao criar órgão:', createError)
          
          // Se falhar, registrar mas não bloquear
          console.warn('[API] Continuando mesmo após falha na criação do órgão')
        } else {
          console.log('[API] Órgão criado com sucesso')
        }
      } catch (createErr) {
        console.error('[API] Exceção ao criar órgão:', createErr)
        // Continuamos mesmo com erro
      }
    }
    
    // Verificar novamente se o órgão existe após tentativa de criação
    try {
      const { data: checkAgain } = await crmonefactory
        .from('orgaos')
        .select('id')
        .eq('id', body.orgao_id)
        .maybeSingle()
        
      if (!checkAgain) {
        console.warn('[API] Órgão ainda não existe após tentativa de criação')
      } else {
        console.log('[API] Órgão confirmado no banco')
      }
    } catch (checkErr) {
      console.error('[API] Erro ao verificar órgão após criação:', checkErr)
    }
    
    // Preparar dados para inserção (remover campos extras)
    const contatoData = {
      id: body.id,
      orgao_id: body.orgao_id,
      nome: body.nome,
      cargo: body.cargo || null,
      email: body.email || null,
      telefone: body.telefone || null,
      data_criacao: new Date().toISOString(),
      data_atualizacao: new Date().toISOString()
    }
    
    console.log('[API] Tentando inserir contato com dados:', contatoData)
    
    // Inserir o contato
    const { data, error } = await crmonefactory
      .from('orgao_contatos')
      .insert(contatoData)
      .select()
    
    if (error) {
      console.error('[API] Erro ao criar contato:', error)
      return NextResponse.json(
        { error: 'Erro ao criar contato', details: error.message },
        { status: 500 }
      )
    }
    
    console.log('[API] Contato criado com sucesso:', data)
    
    // Retornar o contato criado
    return NextResponse.json(data[0] || {})
  } catch (error) {
    console.error('[API] Erro na API POST de contatos:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
