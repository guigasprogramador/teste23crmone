import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { crmonefactory } from "@/lib/supabase/client";
import { generateTokens } from "@/lib/auth/jwt";

export async function POST(request: NextRequest) {
  try {
    console.log("Iniciando processo de login");
    
    const body = await request.json();
    console.log("Dados recebidos:", JSON.stringify(body, null, 2));
    
    const { email, password } = body;
    
    // Validação básica
    if (!email || !password) {
      console.log("Dados incompletos:", { email: !!email, password: !!password });
      return NextResponse.json(
        { error: "Email e senha são obrigatórios" },
        { status: 400 }
      );
    }
    
    // Buscar usuário no Supabase - Tabela 'users'
    console.log("Buscando usuário:", email);
    try {
      const { data: user, error } = await crmonefactory
        .from("users")
        .select("*")
        .eq("email", email)
        .single();

      console.log("Resposta da consulta:", { 
        encontrado: !!user, 
        erro: error ? JSON.stringify(error) : null 
      });

      if (error) {
        console.error("Erro ao buscar usuário:", JSON.stringify(error, null, 2));
        return NextResponse.json(
          { error: "Usuário não encontrado", details: error },
          { status: 404 }
        );
      }
      
      if (!user) {
        console.log("Usuário não encontrado para o email:", email);
        return NextResponse.json(
          { error: "Usuário não encontrado" },
          { status: 404 }
        );
      }
      
      console.log("Usuário encontrado, verificando senha");
      
      // Verificar senha - Campo 'password'
      try {
        console.log("Verificando a senha...");
        const passwordMatch = await bcrypt.compare(password, user.password);
        console.log("Resultado da verificação de senha:", passwordMatch);
        
        if (!passwordMatch) {
          console.log("Senha incorreta para o usuário:", email);
          return NextResponse.json(
            { error: "Credenciais inválidas" },
            { status: 401 }
          );
        }
        
        // Senha correta, gerar tokens
        console.log("Senha correta, gerando tokens JWT");
        const { accessToken, refreshToken } = generateTokens({
          id: user.id,
          email: user.email,
          role: user.role || 'user'
        });
        
        return gerarResposta(user, accessToken, refreshToken);
      } catch (bcryptError) {
        console.error("Erro ao verificar senha com bcrypt:", bcryptError);
        return NextResponse.json(
          { error: "Erro ao verificar credenciais", details: bcryptError },
          { status: 500 }
        );
      }
    } catch (dbError) {
      console.error("Erro na consulta ao banco de dados:", JSON.stringify(dbError, null, 2));
      return NextResponse.json(
        { error: "Erro ao consultar banco de dados", details: dbError },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Erro durante login:", JSON.stringify(error, null, 2));
    return NextResponse.json(
      { error: "Erro interno do servidor", details: error },
      { status: 500 }
    );
  }
}

// Função auxiliar para gerar a resposta com tokens
function gerarResposta(user, accessToken, refreshToken) {
  try {
    console.log("Preparando resposta com tokens");
    
    // Armazenar refresh token no banco de dados
    try {
      console.log("Tentando armazenar refresh token");
      crmonefactory
        .from("refresh_tokens")
        .insert({
          user_id: user.id,
          token: refreshToken,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          created_at: new Date().toISOString()
        })
        .then(() => console.log("Refresh token armazenado com sucesso"))
        .catch(err => console.warn("Erro ao armazenar refresh token:", err));
    } catch (tokenError) {
      console.warn("Erro ao armazenar refresh token:", tokenError);
      // Continuar mesmo assim
    }
    
    // Configurar resposta
    const response = NextResponse.json(
      { 
        message: "Login bem-sucedido",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role || 'user',
          avatar_url: user.avatar_url
        }
      },
      { status: 200 }
    );
    
    // Configurar cookies
    response.cookies.set({
      name: "accessToken",
      value: accessToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 15 * 60, // 15 minutos
      path: "/",
    });
    
    response.cookies.set({
      name: "refreshToken",
      value: refreshToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 dias
      path: "/",
    });
    
    console.log("Resposta de login preparada com sucesso");
    return response;
  } catch (responseError) {
    console.error("Erro ao gerar resposta:", responseError);
    return NextResponse.json(
      { error: "Erro ao gerar resposta de autenticação", details: responseError },
      { status: 500 }
    );
  }
}
