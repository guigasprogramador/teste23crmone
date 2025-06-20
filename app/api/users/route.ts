import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";
import { verifyJwtToken } from "@/lib/auth/jwt";
import bcrypt from "bcryptjs";

// GET - Listar todos os usuários (apenas admin)
export async function GET(request: NextRequest) {
  try {
    // Verificar se o usuário está autenticado
    const accessToken = request.cookies.get("accessToken")?.value;
    
    if (!accessToken) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }
    
    const payload = await verifyJwtToken(accessToken);
    
    if (!payload || !payload.userId || payload.role !== "admin") {
      return NextResponse.json(
        { error: "Acesso negado. Somente administradores podem listar usuários." },
        { status: 403 }
      );
    }
    
    // Buscar todos os usuários
    const { data: users, error } = await supabase
      .from("users")
      .select("id, name, email, role, created_at, avatar_url")
      .order("created_at", { ascending: false });
    
    if (error) {
      console.error("Erro ao buscar usuários:", error);
      return NextResponse.json(
        { error: "Erro ao buscar usuários" },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ users });
  } catch (error) {
    console.error("Erro ao listar usuários:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// POST - Criar novo usuário (apenas admin)
export async function POST(request: NextRequest) {
  try {
    // Verificar se o usuário está autenticado como admin
    const accessToken = request.cookies.get("accessToken")?.value;
    
    if (!accessToken) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }
    
    const payload = await verifyJwtToken(accessToken);
    
    if (!payload || !payload.userId || payload.role !== "admin") {
      return NextResponse.json(
        { error: "Acesso negado. Somente administradores podem criar usuários." },
        { status: 403 }
      );
    }
    
    // Processar dados do novo usuário
    const { name, email, password, role = "user" } = await request.json();
    
    // Validação básica
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Nome, email e senha são obrigatórios" },
        { status: 400 }
      );
    }
    
    // Verificar se o email já está em uso
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .single();
    
    if (existingUser) {
      return NextResponse.json(
        { error: "Este email já está em uso" },
        { status: 400 }
      );
    }
    
    // Hash da senha
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // Criar usuário
    const { data: newUser, error } = await supabase
      .from("users")
      .insert({
        name,
        email,
        password: hashedPassword,
        role,
        created_at: new Date().toISOString(),
      })
      .select("id, name, email, role")
      .single();
    
    if (error) {
      console.error("Erro ao criar usuário:", error);
      return NextResponse.json(
        { error: "Erro ao criar usuário" },
        { status: 500 }
      );
    }
    
    // Criar perfil do usuário
    await supabase.from("user_profiles").insert({
      user_id: newUser.id,
      created_at: new Date().toISOString(),
    });
    
    // Criar preferências do usuário
    await supabase.from("user_preferences").insert({
      user_id: newUser.id,
      email_notifications: true,
      sms_notifications: false,
      theme: "light",
      created_at: new Date().toISOString(),
    });
    
    return NextResponse.json(
      {
        message: "Usuário criado com sucesso",
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erro ao criar usuário:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
