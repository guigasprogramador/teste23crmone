import { NextRequest, NextResponse } from 'next/server';
import { supabase, crmonefactory } from "@/lib/supabase/client";

export async function GET(request: NextRequest) {
  try {
    // Buscar segmentos de clientes no Supabase
    const { data: segmentos, error } = await crmonefactory
      .from('segmentos_clientes')
      .select('id, nome, descricao')
      .order('nome');
    
    if (error) {
      console.error('Erro ao buscar segmentos do Supabase:', error);
      return NextResponse.json(
        { error: `Erro ao buscar segmentos: ${error.message}` },
        { status: 500 }
      );
    }
    
    return NextResponse.json(segmentos);
  } catch (error) {
    console.error('Erro ao processar requisição de segmentos:', error);
    return NextResponse.json(
      { error: 'Erro interno ao processar requisição de segmentos' },
      { status: 500 }
    );
  }
}
