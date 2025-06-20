import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";

export async function POST(request: NextRequest) {
  try {
    // Obter refresh token do cookie
    const refreshToken = request.cookies.get("refreshToken")?.value;
    
    // Se houver um refresh token, exclui-lo do banco de dados
    if (refreshToken) {
      await supabase
        .from("crmonefactory.refresh_tokens")
        .delete()
        .eq("token", refreshToken);
    }
    
    // Limpar cookies
    const response = NextResponse.json(
      { message: "Logout bem-sucedido" },
      { status: 200 }
    );
    
    response.cookies.delete("refreshToken");
    response.cookies.delete("accessToken");
    
    return response;
  } catch (error) {
    console.error("Erro durante logout:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
