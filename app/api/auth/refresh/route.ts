import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";
import { generateAccessToken, verifyRefreshToken } from "@/lib/auth/jwt";

export async function GET(request: NextRequest) {
  try {
    // Obter refresh token do cookie
    const refreshToken = request.cookies.get("refreshToken")?.value;
    
    if (!refreshToken) {
      return NextResponse.json(
        { error: "Refresh token não encontrado" },
        { status: 401 }
      );
    }
    
    // Verificar refresh token
    const userId = verifyRefreshToken(refreshToken);
    
    if (!userId) {
      return NextResponse.json(
        { error: "Token inválido ou expirado" },
        { status: 401 }
      );
    }
    
    // Verificar se o refresh token existe no banco de dados
    const { data: tokenData, error: tokenError } = await supabase
      .from("crmonefactory.refresh_tokens")
      .select("*")
      .eq("token", refreshToken)
      .eq("user_id", userId)
      .single();
    
    if (tokenError || !tokenData) {
      return NextResponse.json(
        { error: "Token revogado ou inválido" },
        { status: 401 }
      );
    }
    
    // Verificar se o token está expirado
    if (new Date(tokenData.expires_at) < new Date()) {
      return NextResponse.json(
        { error: "Token expirado" },
        { status: 401 }
      );
    }
    
    // Obter detalhes do usuário
    const { data: user, error: userError } = await supabase
      .from("crmonefactory.users")
      .select("id, name, email, role, avatar_url")
      .eq("id", userId)
      .single();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }
    
    // Gerar novo access token
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role
    });
    
    // Configurar resposta
    const response = NextResponse.json(
      { 
        message: "Token atualizado com sucesso",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar_url: user.avatar_url
        }
      },
      { status: 200 }
    );
    
    // Configurar cookie de access token
    response.cookies.set({
      name: "accessToken",
      value: accessToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 15 * 60, // 15 minutos
      path: "/",
    });
    
    return response;
  } catch (error) {
    console.error("Erro durante refresh do token:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
