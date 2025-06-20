import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";
import { verifyJwtToken } from "@/lib/auth/jwt";

// GET - Obter perfil do usuário autenticado
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const accessToken = request.cookies.get("accessToken")?.value;
    
    if (!accessToken) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }
    
    const payload = await verifyJwtToken(accessToken);
    
    if (!payload || !payload.userId) {
      return NextResponse.json(
        { error: "Token inválido" },
        { status: 401 }
      );
    }
    
    const userId = payload.userId;
    console.log("Buscando perfil para o usuário ID:", userId);
    
    // Buscar dados do usuário
    const { data: user, error: userError } = await supabase
      .schema('crmonefactory')
      .from("users")
      .select("id, name, email, role, avatar_url, created_at, updated_at")
      .eq("id", userId)
      .single();
    
    if (userError) {
      console.error("Erro ao buscar usuário:", userError);
      return NextResponse.json(
        { error: "Erro ao buscar usuário", details: userError },
        { status: 500 }
      );
    }
    
    if (!user) {
      console.error("Usuário não encontrado com ID:", userId);
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }
    
    // Buscar dados do perfil
    const { data: profile, error: profileError } = await supabase
      .schema('crmonefactory')
      .from("user_profiles")
      .select("bio, phone, address, updated_at")
      .eq("user_id", userId)
      .single();
    
    if (profileError && profileError.code !== 'PGRST116') { // PGRST116 é "não encontrado"
      console.error("Erro ao buscar perfil:", profileError);
    }
    
    // Buscar preferências do usuário
    const { data: preferences, error: prefError } = await supabase
      .schema('crmonefactory')
      .from("user_preferences")
      .select("email_notifications, sms_notifications, theme")
      .eq("user_id", userId)
      .single();
    
    if (prefError && prefError.code !== 'PGRST116') {
      console.error("Erro ao buscar preferências:", prefError);
    }
    
    console.log("Dados recuperados:", 
      "Usuario:", user ? Object.keys(user) : "não encontrado", 
      "Perfil:", profile ? Object.keys(profile) : "não encontrado",
      "Preferências:", preferences ? Object.keys(preferences) : "não encontrado"
    );
    
    // Retornar dados combinados
    return NextResponse.json({
      id: user.id,
      name: user.name || "",
      email: user.email || "",
      role: user.role || "",
      avatar: user.avatar_url || "",
      bio: profile?.bio || "",
      phone: profile?.phone || "",
      position: profile?.address || "", // Usando address como position temporariamente
      preferences: {
        emailNotifications: preferences?.email_notifications !== false,
        smsNotifications: preferences?.sms_notifications === true,
        deadlineAlerts: true, // Valor padrão já que não temos esse campo
        theme: preferences?.theme || "light"
      }
    });
  } catch (error) {
    console.error("Erro ao buscar perfil:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// PUT - Atualizar perfil do usuário
export async function PUT(request: NextRequest) {
  try {
    // Verificar autenticação
    const accessToken = request.cookies.get("accessToken")?.value;
    
    if (!accessToken) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }
    
    const payload = await verifyJwtToken(accessToken);
    
    if (!payload || !payload.userId) {
      return NextResponse.json(
        { error: "Token inválido" },
        { status: 401 }
      );
    }
    
    const userId = payload.userId;
    const body = await request.json();
    console.log("Atualizando perfil para usuário ID:", userId, "Dados:", Object.keys(body));
    
    // Preparar atualizações para cada tabela
    const userUpdates: Record<string, any> = {};
    const profileUpdates: Record<string, any> = {};
    const prefUpdates: Record<string, any> = {};
    
    // Mapear campos para as tabelas correspondentes
    if (body.name !== undefined) userUpdates.name = body.name;
    if (body.email !== undefined) userUpdates.email = body.email;
    
    if (body.bio !== undefined) profileUpdates.bio = body.bio;
    if (body.phone !== undefined) profileUpdates.phone = body.phone;
    if (body.position !== undefined) profileUpdates.address = body.position; // Usando address como position
    
    // Mapear preferências
    if (body.preferences) {
      if (body.preferences.emailNotifications !== undefined) 
        prefUpdates.email_notifications = body.preferences.emailNotifications;
      if (body.preferences.smsNotifications !== undefined) 
        prefUpdates.sms_notifications = body.preferences.smsNotifications;
      if (body.preferences.theme !== undefined) 
        prefUpdates.theme = body.preferences.theme;
    }
    
    // Verificar se email já está em uso por outro usuário
    if (body.email) {
      const { data: existingUser } = await supabase
        .schema('crmonefactory')
        .from("users")
        .select("id")
        .eq("email", body.email)
        .neq("id", userId)
        .single();
      
      if (existingUser) {
        return NextResponse.json(
          { error: "Este email já está em uso por outro usuário" },
          { status: 400 }
        );
      }
    }
    
    // Realizar as atualizações em paralelo
    const updates = [];
    
    // Atualizar dados básicos do usuário
    if (Object.keys(userUpdates).length > 0) {
      console.log("Atualizando usuário:", userUpdates);
      userUpdates.updated_at = new Date().toISOString();
      
      updates.push(
        supabase
          .schema('crmonefactory')
          .from("users")
          .update(userUpdates)
          .eq("id", userId)
      );
    }
    
    // Atualizar perfil
    if (Object.keys(profileUpdates).length > 0) {
      console.log("Atualizando perfil:", profileUpdates);
      profileUpdates.updated_at = new Date().toISOString();
      
      // Verificar se o perfil já existe
      const { data: existingProfile } = await supabase
        .schema('crmonefactory')
        .from("user_profiles")
        .select("id")
        .eq("user_id", userId)
        .single();
      
      if (existingProfile) {
        updates.push(
          supabase
            .schema('crmonefactory')
            .from("user_profiles")
            .update(profileUpdates)
            .eq("user_id", userId)
        );
      } else {
        updates.push(
          supabase
            .schema('crmonefactory')
            .from("user_profiles")
            .insert({
              user_id: userId,
              ...profileUpdates,
              created_at: new Date().toISOString()
            })
        );
      }
    }
    
    // Atualizar preferências
    if (Object.keys(prefUpdates).length > 0) {
      console.log("Atualizando preferências:", prefUpdates);
      prefUpdates.updated_at = new Date().toISOString();
      
      // Verificar se as preferências já existem
      const { data: existingPrefs } = await supabase
        .schema('crmonefactory')
        .from("user_preferences")
        .select("id")
        .eq("user_id", userId)
        .single();
      
      if (existingPrefs) {
        updates.push(
          supabase
            .schema('crmonefactory')
            .from("user_preferences")
            .update(prefUpdates)
            .eq("user_id", userId)
        );
      } else {
        updates.push(
          supabase
            .schema('crmonefactory')
            .from("user_preferences")
            .insert({
              user_id: userId,
              ...prefUpdates,
              created_at: new Date().toISOString()
            })
        );
      }
    }
    
    // Executar todas as atualizações
    if (updates.length > 0) {
      const results = await Promise.all(updates);
      
      // Verificar se houve algum erro
      for (const result of results) {
        if (result.error) {
          console.error("Erro ao atualizar:", result.error);
          return NextResponse.json(
            { error: "Erro ao atualizar dados do perfil", details: result.error },
            { status: 500 }
          );
        }
      }
    }
    
    return NextResponse.json({
      message: "Perfil atualizado com sucesso"
    });
  } catch (error: any) {
    console.error("Erro ao atualizar perfil:", error);
    console.error("Stack trace:", error.stack);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
