import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";
import { verifyJwtToken } from "@/lib/auth/jwt";

// Get a specific user
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    
    // Check if user has permission
    if (payload.userId !== params.id && payload.role !== "admin") {
      return NextResponse.json(
        { error: "Acesso negado. Você não tem permissão para visualizar este usuário." },
        { status: 403 }
      );
    }
    
    // Get user
    const { data: user, error } = await supabase
      .from("crmonefactory.users")
      .select("id, name, email, role, avatar_url, created_at")
      .eq("id", params.id)
      .single();
    
    if (error) {
      console.error("Error fetching user:", error);
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ user });
  } catch (error) {
    console.error("Error getting user:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// Update a user (admin only, except for self-updates)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    
    // Check if user has permission
    if (payload.userId !== params.id && payload.role !== "admin") {
      return NextResponse.json(
        { error: "Acesso negado. Você não tem permissão para editar este usuário." },
        { status: 403 }
      );
    }
    
    const body = await request.json();
    
    // If the update includes changing the role, only admins can do this
    if (body.role && payload.role !== "admin") {
      return NextResponse.json(
        { error: "Acesso negado. Apenas administradores podem alterar funções." },
        { status: 403 }
      );
    }
    
    // Update user
    const updateData: any = {};
    
    // Only allow specific fields to be updated
    if (body.name) updateData.name = body.name;
    if (body.role && payload.role === "admin") updateData.role = body.role;
    
    // Add updated_at timestamp
    updateData.updated_at = new Date().toISOString();
    
    const { data: updatedUser, error } = await supabase
      .from("crmonefactory.users")
      .update(updateData)
      .eq("id", params.id)
      .select("id, name, email, role, avatar_url, created_at");
    
    if (error) {
      console.error("Error updating user:", error);
      return NextResponse.json(
        { error: "Erro ao atualizar usuário" },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      message: "Usuário atualizado com sucesso",
      user: updatedUser[0],
    });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// Delete a user (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify user is authenticated and is admin
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
    
    // Only admins can delete users
    if (payload.role !== "admin") {
      return NextResponse.json(
        { error: "Acesso negado. Apenas administradores podem remover usuários." },
        { status: 403 }
      );
    }
    
    // Prevent admins from deleting themselves
    if (payload.userId === params.id) {
      return NextResponse.json(
        { error: "Você não pode remover sua própria conta." },
        { status: 400 }
      );
    }
    
    // Delete user
    const { error } = await supabase
      .from("crmonefactory.users")
      .delete()
      .eq("id", params.id);
    
    if (error) {
      console.error("Error deleting user:", error);
      return NextResponse.json(
        { error: "Erro ao remover usuário" },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      message: "Usuário removido com sucesso",
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
