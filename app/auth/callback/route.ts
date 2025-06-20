import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";
import { generateTokens } from "@/lib/auth/jwt";

export async function GET(request: NextRequest) {
  try {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');
    
    if (!code) {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }

    // Troca o código pelo token do usuário
    const { data: authData, error: authError } = await supabase.auth.exchangeCodeForSession(code);

    if (authError) {
      console.error('Erro na troca de código por sessão:', authError);
      return NextResponse.redirect(new URL('/auth/login?error=auth_error', request.url));
    }

    // Busca ou cria o usuário no nosso banco
    const { data: userData, error: userError } = await supabase
      .from('crmonefactory.users')
      .select('*')
      .eq('email', authData.user?.email)
      .single();

    let user;
    if (userError) {
      // Criar novo usuário se não existir
      const { data: newUser, error: createError } = await supabase
        .from('crmonefactory.users')
        .insert({
          email: authData.user?.email,
          name: authData.user?.user_metadata?.name || authData.user?.email?.split('@')[0],
          role: 'user',
          provider: 'microsoft',
          provider_id: authData.user?.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (createError) {
        console.error('Erro ao criar usuário:', createError);
        return NextResponse.redirect(new URL('/auth/login?error=user_creation_error', request.url));
      }

      user = newUser;
    } else {
      user = userData;
    }

    // Gerar tokens JWT
    const { accessToken, refreshToken } = generateTokens(user);

    // Armazenar refresh token
    await supabase
      .from('crmonefactory.refresh_tokens')
      .insert({
        user_id: user.id,
        token: refreshToken,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      });

    // Configurar resposta com cookies
    const response = NextResponse.redirect(new URL('/dashboard', request.url));

    response.cookies.set({
      name: 'accessToken',
      value: accessToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60, // 15 minutos
      path: '/',
    });

    response.cookies.set({
      name: 'refreshToken',
      value: refreshToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 dias
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Erro no callback:', error);
    return NextResponse.redirect(new URL('/auth/login?error=callback_error', request.url));
  }
}