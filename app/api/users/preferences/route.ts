import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyJwtToken } from "@/lib/auth/jwt";

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://supabase.guigasautomacao.uk";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ewogICJyb2xlIjogImFub24iLAogICJpc3MiOiAic3VwYWJhc2UiLAogICJpYXQiOiAxNzE1MDUwODAwLAogICJleHAiOiAxODcyODE3MjAwCn0.aSkpG5e1oxLQU5tHQS_oBAie8gbMhUEwMzr8ziECxpc";
const supabase = createClient(supabaseUrl, supabaseKey);

// Update user preferences
export async function PUT(request: NextRequest) {
  try {
    // Verify user is authenticated
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
    const { emailNotifications, smsNotifications, deadlineAlerts } = await request.json();
    
    // Check if preferences exist
    const { data: existingPreferences } = await supabase
      .from("user_preferences")
      .select("id")
      .eq("user_id", userId)
      .single();
    
    if (existingPreferences) {
      // Update existing preferences
      const { error } = await supabase
        .from("user_preferences")
        .update({
          email_notifications: emailNotifications,
          sms_notifications: smsNotifications,
          deadline_alerts: deadlineAlerts,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);
      
      if (error) {
        console.error("Error updating user preferences:", error);
        return NextResponse.json(
          { error: "Erro ao atualizar preferências do usuário" },
          { status: 500 }
        );
      }
    } else {
      // Create new preferences
      const { error } = await supabase
        .from("user_preferences")
        .insert([
          {
            user_id: userId,
            email_notifications: emailNotifications,
            sms_notifications: smsNotifications,
            deadline_alerts: deadlineAlerts,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ]);
      
      if (error) {
        console.error("Error creating user preferences:", error);
        return NextResponse.json(
          { error: "Erro ao criar preferências do usuário" },
          { status: 500 }
        );
      }
    }
    
    return NextResponse.json({
      message: "Preferências atualizadas com sucesso",
    });
  } catch (error) {
    console.error("Error updating user preferences:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
