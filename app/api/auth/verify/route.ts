import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";
import { verifyJwtToken } from "@/lib/auth/jwt";

// Adicione cabeçalhos CORS para garantir que a API funcione corretamente
function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

export async function OPTIONS() {
  return new NextResponse(null, { 
    status: 204,
    headers: corsHeaders()
  });
}

export async function GET(request: NextRequest) {
  try {
    console.log("Iniciando verificação de autenticação");
    
    // Obter token do cookie
    const accessToken = request.cookies.get("accessToken")?.value;
    
    if (!accessToken) {
      console.log("Token não encontrado no cookie");
      return new NextResponse(
        JSON.stringify({ authenticated: false, error: "Token não encontrado" }),
        { 
          status: 401,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders()
          }
        }
      );
    }
    
    // Verificar token
    const payload = await verifyJwtToken(accessToken);
    
    if (!payload || !payload.userId) {
      console.log("Token inválido ou expirado");
      return new NextResponse(
        JSON.stringify({ authenticated: false, error: "Token inválido ou expirado" }),
        { 
          status: 401,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders()
          }
        }
      );
    }
    
    console.log("Token válido, buscando usuário com ID:", payload.userId);
    
    // Obter dados do usuário
    const { data: user, error } = await supabase
      .from("crmonefactory.users")
      .select("id, name, email, role, avatar_url")
      .eq("id", payload.userId)
      .single();
    
    if (error) {
      console.error("Erro ao buscar usuário:", error);
      return new NextResponse(
        JSON.stringify({ authenticated: false, error: "Usuário não encontrado" }),
        { 
          status: 404,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders()
          }
        }
      );
    }
    
    if (!user) {
      console.log("Usuário não encontrado com ID:", payload.userId);
      return new NextResponse(
        JSON.stringify({ authenticated: false, error: "Usuário não encontrado" }),
        { 
          status: 404,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders()
          }
        }
      );
    }
    
    console.log("Usuário autenticado com sucesso:", user.email);
    
    // Retornar dados do usuário autenticado
    return new NextResponse(
      JSON.stringify({
        authenticated: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar_url: user.avatar_url
        }
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
    console.error("Erro durante verificação de autenticação:", error);
    return new NextResponse(
      JSON.stringify({ authenticated: false, error: "Erro interno do servidor" }),
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
