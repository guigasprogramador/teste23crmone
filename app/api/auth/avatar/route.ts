import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";
import { verifyJwtToken } from "@/lib/auth/jwt";

// Bucket name for avatar storage
const BUCKET_NAME = "avatars";

// Gerar URL assinada para upload do avatar
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação do usuário
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
    console.log("Gerando URL assinada para usuário:", userId);
    
    // Criar um caminho único para o avatar do usuário
    const timestamp = Date.now();
    const filePath = `${userId}/avatar-${timestamp}.jpg`;
    
    try {
      // Gerar URL assinada para upload direto para o Supabase Storage
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .createSignedUploadUrl(filePath);
      
      if (error) {
        console.error("Erro ao gerar URL assinada:", error);
        return NextResponse.json(
          { error: `Erro ao gerar URL assinada: ${error.message}` },
          { status: 500 }
        );
      }
      
      if (!data || !data.signedUrl) {
        console.error("URL assinada não gerada corretamente:", data);
        return NextResponse.json(
          { error: "URL assinada não foi gerada corretamente" },
          { status: 500 }
        );
      }
      
      // Obter URL pública para uso futuro
      const { data: publicUrlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(filePath);
      
      if (!publicUrlData?.publicUrl) {
        console.error("URL pública não gerada corretamente:", publicUrlData);
        return NextResponse.json(
          { error: "URL pública não foi gerada corretamente" },
          { status: 500 }
        );
      }
      
      console.log("URLs geradas com sucesso:", {
        uploadUrl: data.signedUrl,
        publicUrl: publicUrlData.publicUrl
      });
      
      return NextResponse.json({
        uploadUrl: data.signedUrl,
        avatarUrl: publicUrlData.publicUrl,
        path: filePath
      });
    } catch (error: any) {
      console.error("Erro ao processar geração de URL:", error);
      return NextResponse.json(
        { error: `Erro ao gerar URL para upload: ${error.message || 'Erro desconhecido'}` },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Erro ao processar requisição:", error);
    return NextResponse.json(
      { error: "Erro ao processar requisição" },
      { status: 500 }
    );
  }
}

// Handle avatar upload usando o Supabase Storage
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação do usuário
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
    console.log("ID do usuário para avatar:", userId);
    
    // Obter o conteúdo do arquivo do FormData
    const formData = await request.formData();
    const file = formData.get("file") as File;
    
    console.log("FormData recebido:", formData.has("file"), 
      file ? `Tipo: ${file.type}, Tamanho: ${file.size} bytes, Nome: ${file.name}` : "Nenhum arquivo"
    );
    
    if (!file) {
      return NextResponse.json(
        { error: "Arquivo não fornecido" },
        { status: 400 }
      );
    }
    
    // Verificar tipo de arquivo
    console.log("Verificando tipo do arquivo:", file.type);
    if (!file.type || !file.type.includes("image")) {
      return NextResponse.json(
        { error: "Formato inválido. Por favor, envie uma imagem." },
        { status: 400 }
      );
    }
    
    // Verificar tamanho do arquivo (2MB limite)
    console.log("Verificando tamanho do arquivo:", file.size, "bytes");
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Arquivo muito grande. Tamanho máximo: 2MB" },
        { status: 400 }
      );
    }
    
    try {
      // Primeiro, verificar se o usuário existe
      const { data: userData, error: userError } = await supabase
        .schema('crmonefactory')
        .from("users")
        .select("id")
        .eq("id", userId)
        .single();
      
      if (userError) {
        console.error("Erro ao verificar usuário:", userError);
        return NextResponse.json(
          { error: `Erro ao verificar usuário: ${userError.message}`, details: userError },
          { status: 500 }
        );
      }
      
      if (!userData) {
        console.error("Usuário não encontrado com ID:", userId);
        return NextResponse.json(
          { error: "Usuário não encontrado" },
          { status: 404 }
        );
      }
      
      // Criar um caminho único para o avatar do usuário
      const timestamp = Date.now();
      const fileExtension = file.name.split('.').pop() || 'jpg';
      const filePath = `${userId}/avatar-${timestamp}.${fileExtension}`;
      
      console.log("Fazendo upload para o caminho:", filePath);
      
      // Converter o arquivo para ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      
      // Fazer upload do arquivo para o Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, arrayBuffer, {
          contentType: file.type,
          upsert: true
        });
      
      if (uploadError) {
        console.error("Erro ao fazer upload do avatar:", uploadError);
        return NextResponse.json(
          { 
            error: "Erro ao fazer upload do avatar para o storage",
            details: uploadError
          },
          { status: 500 }
        );
      }
      
      // Obter a URL pública do arquivo
      const { data: publicUrlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(filePath);
      
      if (!publicUrlData || !publicUrlData.publicUrl) {
        console.error("Erro ao obter URL pública do avatar");
        return NextResponse.json(
          { error: "Erro ao obter URL pública do avatar" },
          { status: 500 }
        );
      }
      
      const avatarUrl = publicUrlData.publicUrl;
      console.log("URL pública do avatar:", avatarUrl);
      
      // Atualizar o registro do usuário com a URL do avatar
      const { error: updateError } = await supabase
        .schema('crmonefactory')
        .from("users")
        .update({ 
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString()
        })
        .eq("id", userId);
      
      if (updateError) {
        console.error("Erro ao atualizar avatar:", updateError);
        console.error("Detalhes do erro:", JSON.stringify(updateError));
        return NextResponse.json(
          { 
            error: "Erro ao atualizar avatar no banco de dados",
            details: updateError
          },
          { status: 500 }
        );
      }
      
      return NextResponse.json({
        message: "Avatar atualizado com sucesso",
        avatarUrl: avatarUrl
      });
    } catch (error: any) {
      console.error("Erro ao processar imagem:", error);
      console.error("Stack trace:", error.stack);
      return NextResponse.json(
        { error: `Erro ao processar a imagem: ${error.message || 'Erro desconhecido'}` },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Erro ao processar upload de avatar:", error);
    console.error("Stack trace:", error.stack);
    return NextResponse.json(
      { error: "Erro ao processar upload de avatar" },
      { status: 500 }
    );
  }
}
