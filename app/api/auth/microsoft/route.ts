import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://supabase.guigasautomacao.uk";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ewogICJyb2xlIjogImFub24iLAogICJpc3MiOiAic3VwYWJhc2UiLAogICJpYXQiOiAxNzE1MDUwODAwLAogICJleHAiOiAxODcyODE3MjAwCn0.aSkpG5e1oxLQU5tHQS_oBAie8gbMhUEwMzr8ziECxpc";
const supabase = createClient(supabaseUrl, supabaseKey);

// JWT secrets
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "your-refresh-secret-key";

// Microsoft OAuth config
const MICROSOFT_CLIENT_ID = process.env.MICROSOFT_CLIENT_ID || "";
const MICROSOFT_CLIENT_SECRET = process.env.MICROSOFT_CLIENT_SECRET || "";
const MICROSOFT_REDIRECT_URI = process.env.MICROSOFT_REDIRECT_URI || "http://localhost:3000/api/auth/microsoft/callback";

// Redirect to Microsoft login
export async function GET(request: NextRequest) {
  const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${MICROSOFT_CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(MICROSOFT_REDIRECT_URI)}&response_mode=query&scope=openid%20profile%20email%20User.Read`;
  return NextResponse.redirect(authUrl);
}

// Handle Microsoft callback with auth code
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code } = body;
    
    if (!code) {
      return NextResponse.json(
        { error: "Código de autorização não fornecido" },
        { status: 400 }
      );
    }
    
    // Exchange auth code for tokens
    const tokenResponse = await fetch("https://login.microsoftonline.com/common/oauth2/v2.0/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: MICROSOFT_CLIENT_ID,
        client_secret: MICROSOFT_CLIENT_SECRET,
        code,
        redirect_uri: MICROSOFT_REDIRECT_URI,
        grant_type: "authorization_code",
      }),
    });
    
    const tokenData = await tokenResponse.json();
    
    if (!tokenResponse.ok) {
      console.error("Microsoft token error:", tokenData);
      return NextResponse.json(
        { error: "Falha ao obter token do Microsoft" },
        { status: 500 }
      );
    }
    
    // Get user info from Microsoft Graph API
    const userResponse = await fetch("https://graph.microsoft.com/v1.0/me", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });
    
    const userData = await userResponse.json();
    
    if (!userResponse.ok) {
      console.error("Microsoft Graph API error:", userData);
      return NextResponse.json(
        { error: "Falha ao obter dados do usuário do Microsoft" },
        { status: 500 }
      );
    }
    
    // Check if user exists in our database
    const { data: existingUser, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("email", userData.mail || userData.userPrincipalName)
      .single();
    
    let userId;
    let userRole = "user"; // Default role for new users
    
    if (userError || !existingUser) {
      // Create a new user if they don't exist
      const { data: newUser, error: createError } = await supabase
        .from("users")
        .insert([
          {
            name: userData.displayName,
            email: userData.mail || userData.userPrincipalName,
            microsoft_id: userData.id,
            role: userRole,
            created_at: new Date().toISOString(),
          },
        ])
        .select("id, name, email, role")
        .single();
      
      if (createError) {
        console.error("Error creating user:", createError);
        return NextResponse.json(
          { error: "Falha ao criar usuário" },
          { status: 500 }
        );
      }
      
      userId = newUser.id;
      userRole = newUser.role;
    } else {
      // Update existing user with Microsoft ID if needed
      if (!existingUser.microsoft_id) {
        await supabase
          .from("users")
          .update({ microsoft_id: userData.id })
          .eq("id", existingUser.id);
      }
      
      userId = existingUser.id;
      userRole = existingUser.role;
    }
    
    // Generate JWT tokens
    const accessToken = jwt.sign(
      {
        userId,
        email: userData.mail || userData.userPrincipalName,
        role: userRole,
      },
      JWT_SECRET,
      { expiresIn: "1h" }
    );
    
    const refreshToken = jwt.sign(
      { userId },
      JWT_REFRESH_SECRET,
      { expiresIn: "7d" }
    );
    
    // Store refresh token
    await supabase
      .from("refresh_tokens")
      .insert([
        {
          user_id: userId,
          token: refreshToken,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ]);
    
    // Set cookies and redirect
    const response = NextResponse.json(
      {
        message: "Login Microsoft bem-sucedido",
        accessToken,
      },
      { status: 200 }
    );
    
    response.cookies.set({
      name: "refreshToken",
      value: refreshToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax", // Allow cookies for redirect
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });
    
    return response;
  } catch (error) {
    console.error("Microsoft OAuth error:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
