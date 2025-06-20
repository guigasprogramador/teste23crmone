import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";

// Adicione cabeçalhos CORS para garantir que a API funcione corretamente
function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

export async function OPTIONS(request: NextRequest) {
  return NextResponse.json({}, { headers: corsHeaders() });
}

export async function GET(request: NextRequest) {
  try {
    console.log("Teste de API simples iniciado");
    
    // Usar NextResponse.json com cabeçalhos explícitos
    return new NextResponse(
      JSON.stringify({ 
        message: "API funcionando corretamente", 
        timestamp: new Date().toISOString() 
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders()
        }
      }
    );
    
  } catch (error) {
    console.error("Erro no teste de API:", error);
    return new NextResponse(
      JSON.stringify({ error: "Erro interno do servidor" }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders()
        }
      }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("Teste de conexão com Supabase iniciado");
    
    // Testar conexão direta com Supabase em vez de usar a consulta
    const { data, error } = await supabase.from("crmonefactory.users").select("count(*)");
    
    if (error) {
      console.error("Erro na consulta ao Supabase:", error);
      return new NextResponse(
        JSON.stringify({ success: false, error: error.message }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders()
          }
        }
      );
    }
    
    return new NextResponse(
      JSON.stringify({ 
        success: true, 
        message: "Conexão com Supabase estabelecida",
        data
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders()
        }
      }
    );
    
  } catch (error) {
    console.error("Erro no teste de conexão:", error);
    return new NextResponse(
      JSON.stringify({ success: false, error: "Erro interno do servidor" }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders()
        }
      }
    );
  }
}
