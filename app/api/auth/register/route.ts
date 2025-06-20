import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { crmonefactory } from "@/lib/supabase/client";

// Adicione cabeçalhos CORS para garantir que a API funcione corretamente
function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

export async function POST(request: NextRequest) {
  try {
    console.log("POST /api/auth/register - Iniciando processo de registro");
    const { name, email, password, role = "user" } = await request.json();

    // Validação básica
    if (!name || !email || !password) {
      console.log("Erro: Campos obrigatórios faltando", { name, email });
      return new NextResponse(
        JSON.stringify({ error: "Nome, email e senha são obrigatórios" }),
        { 
          status: 400,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders()
          }
        }
      );
    }

    console.log("Verificando se email já existe:", email);
    // Verificar se o email já está em uso - usando o client específico para o schema
    const { data: existingUser, error: checkError } = await crmonefactory
      .from("users")
      .select("id")
      .eq("email", email)
      .single();

    if (checkError) {
      console.log("Erro ao verificar email:", checkError);
      // Normalmente seria um erro, mas pode ser apenas que o usuário não existe, o que é o que queremos
      // Vamos continuar se o erro for "not found"
      if (checkError.code !== 'PGRST116') { // Código do erro "not found"
        return new NextResponse(
          JSON.stringify({ error: "Erro ao verificar email", details: checkError }),
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

    if (existingUser) {
      console.log("Email já em uso:", email);
      return new NextResponse(
        JSON.stringify({ error: "Este email já está em uso" }),
        { 
          status: 400,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders()
          }
        }
      );
    }

    // Hash da senha
    console.log("Gerando hash da senha");
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    console.log("Criando novo usuário:", { name, email, role });
    // Criar usuário - usando o client específico para o schema
    const { data: newUser, error } = await crmonefactory
      .from("users")
      .insert({
        name,
        email,
        password: hashedPassword,
        role,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select("id, name, email, role")
      .single();

    if (error) {
      console.error("Erro ao criar usuário (detalhado):", {
        mensagem: error.message,
        código: error.code,
        detalhes: error.details,
        hint: error.hint,
        erro_completo: JSON.stringify(error)
      });
      return new NextResponse(
        JSON.stringify({ 
          error: "Erro ao criar usuário", 
          details: error.message,
          code: error.code
        }),
        { 
          status: 500,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders()
          }
        }
      );
    }

    console.log("Criando perfil do usuário para:", newUser.id);
    // Criar perfil do usuário - usando o client específico para o schema
    await crmonefactory
      .from("user_profiles")
      .insert({
        user_id: newUser.id,
        created_at: new Date().toISOString(),
      });

    console.log("Criando preferências do usuário para:", newUser.id);
    // Criar preferências do usuário - usando o client específico para o schema
    await crmonefactory
      .from("user_preferences")
      .insert({
        user_id: newUser.id,
        email_notifications: true,
        sms_notifications: false,
        theme: "light",
        created_at: new Date().toISOString(),
      });

    // Configurar resposta
    const response = new NextResponse(
      JSON.stringify({
        message: "Usuário criado com sucesso",
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
        },
      }),
      { 
        status: 201,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders()
        }
      }
    );

    return response;
  } catch (error) {
    console.error("Erro não tratado durante o registro:", error);
    return new NextResponse(
      JSON.stringify({ error: "Erro interno do servidor", details: String(error) }),
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
