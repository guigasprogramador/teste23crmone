import { NextRequest, NextResponse } from 'next/server';
import { Oportunidade } from '@/types/comercial';
import * as fs from 'fs';
import * as path from 'path';
import { supabase, crmonefactory } from "@/lib/supabase/client";

// Path para o arquivo de "banco de dados"
const dbPath = path.join(process.cwd(), 'data', 'oportunidades.json');

// Função para carregar os dados do arquivo
async function carregarOportunidades(): Promise<Oportunidade[]> {
  try {
    // Garantir que o diretório existe
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Criar arquivo se não existir
    if (!fs.existsSync(dbPath)) {
      // Dados iniciais para o "banco de dados"
      const oportunidadesIniciais: Oportunidade[] = [
        {
          id: "1",
          titulo: "Sistema de Gestão Municipal",
          cliente: "Prefeitura de São Paulo",
          clienteId: "c1",
          valor: "R$ 450.000,00",
          responsavel: "Ana Silva",
          responsavelId: "r1",
          prazo: "30/06/2023",
          status: "novo_lead",
          dataCriacao: "2023-01-15T10:30:00Z",
          dataAtualizacao: "2023-01-15T10:30:00Z",
        },
        {
          id: "2",
          titulo: "Plataforma de Educação Online",
          cliente: "Secretaria de Educação",
          clienteId: "c2",
          valor: "R$ 280.000,00",
          responsavel: "Carlos Oliveira",
          responsavelId: "r2",
          prazo: "15/07/2023",
          status: "agendamento_reuniao",
          dataCriacao: "2023-02-10T14:20:00Z",
          dataAtualizacao: "2023-02-15T09:45:00Z",
        },
        {
          id: "3",
          titulo: "Modernização de Infraestrutura",
          cliente: "Hospital Municipal",
          clienteId: "c3",
          valor: "R$ 620.000,00",
          responsavel: "Ana Silva",
          responsavelId: "r1",
          prazo: "10/08/2023",
          status: "levantamento_oportunidades",
          dataCriacao: "2023-03-05T11:15:00Z",
          dataAtualizacao: "2023-03-10T16:30:00Z",
        },
        {
          id: "4",
          titulo: "Sistema de Controle de Frotas",
          cliente: "Departamento de Transportes",
          clienteId: "c4",
          valor: "R$ 180.000,00",
          responsavel: "Pedro Santos",
          responsavelId: "r3",
          prazo: "05/06/2023",
          status: "proposta_enviada",
          dataCriacao: "2023-04-12T09:00:00Z",
          dataAtualizacao: "2023-04-20T14:45:00Z",
        },
        {
          id: "5",
          titulo: "Portal de Transparência",
          cliente: "Governo do Estado",
          clienteId: "c5",
          valor: "R$ 320.000,00",
          responsavel: "Carlos Oliveira",
          responsavelId: "r2",
          prazo: "20/07/2023",
          status: "negociacao",
          dataCriacao: "2023-05-08T10:30:00Z",
          dataAtualizacao: "2023-05-15T11:20:00Z",
        },
        {
          id: "6",
          titulo: "Aplicativo de Serviços Públicos",
          cliente: "Prefeitura de Campinas",
          clienteId: "c6",
          valor: "R$ 250.000,00",
          responsavel: "Pedro Santos",
          responsavelId: "r3",
          prazo: "15/06/2023",
          status: "fechado_ganho",
          dataCriacao: "2023-01-20T13:45:00Z",
          dataAtualizacao: "2023-02-28T16:30:00Z",
        },
        {
          id: "7",
          titulo: "Sistema de Gestão Hospitalar",
          cliente: "Hospital Regional",
          clienteId: "c7",
          valor: "R$ 380.000,00",
          responsavel: "Maria Souza",
          responsavelId: "r4",
          prazo: "22/07/2023",
          status: "fechado_perdido",
          dataCriacao: "2023-03-15T09:30:00Z",
          dataAtualizacao: "2023-04-10T14:20:00Z",
        },
      ];
      
      fs.writeFileSync(dbPath, JSON.stringify(oportunidadesIniciais, null, 2));
      return oportunidadesIniciais;
    }
    
    // Ler do arquivo
    const data = fs.readFileSync(dbPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Erro ao carregar oportunidades:', error);
    return [];
  }
}

// Função para salvar os dados no arquivo
async function salvarOportunidades(oportunidades: Oportunidade[]): Promise<void> {
  try {
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(dbPath, JSON.stringify(oportunidades, null, 2));
  } catch (error) {
    console.error('Erro ao salvar oportunidades:', error);
  }
}

// GET - Obter uma oportunidade específica
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const oportunidades = await carregarOportunidades();
    const id = await params.id;
    console.log(`Buscando oportunidade com ID: ${id}`);
    
    const oportunidade = oportunidades.find((o) => o.id === id);
    
    if (!oportunidade) {
      console.log(`Oportunidade com ID ${id} não encontrada`);
      return NextResponse.json(
        { error: 'Oportunidade não encontrada' },
        { status: 404 }
      );
    }
    
    console.log(`Oportunidade encontrada: ${JSON.stringify(oportunidade)}`);
    return NextResponse.json(oportunidade);
  } catch (error) {
    console.error('Erro ao buscar oportunidade:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar oportunidade', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// PUT - Atualizar uma oportunidade
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const oportunidades = await carregarOportunidades();
    const id = await params.id;
    const dadosAtualizados = await request.json();
    
    const index = oportunidades.findIndex(o => o.id === id);
    
    if (index === -1) {
      return NextResponse.json(
        { error: 'Oportunidade não encontrada' },
        { status: 404 }
      );
    }
    
    // Validação básica
    if (!dadosAtualizados.titulo || !dadosAtualizados.cliente) {
      return NextResponse.json(
        { error: 'Título e cliente são campos obrigatórios' },
        { status: 400 }
      );
    }
    
    // Preservar ID e data de criação originais
    const agora = new Date().toISOString();
    const oportunidadeAtualizada: Oportunidade = {
      ...dadosAtualizados,
      id,
      dataCriacao: oportunidades[index].dataCriacao,
      dataAtualizacao: agora
    };
    
    oportunidades[index] = oportunidadeAtualizada;
    await salvarOportunidades(oportunidades);
    
    return NextResponse.json(oportunidadeAtualizada);
  } catch (error) {
    console.error('Erro ao atualizar oportunidade:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar oportunidade' },
      { status: 500 }
    );
  }
}

// PATCH - Atualizar status de uma oportunidade
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Obter o ID dos parâmetros da rota de forma correta
    const id = await params.id;
    const { status } = await request.json();
    
    console.log(`Atualizando status da oportunidade ${id} para ${status}`);
    
    // Primeiro tentar atualizar no Supabase
    try {
      console.log(`Tentando atualizar no Supabase com ID: ${id}`);
      
      // Verificar se o ID é válido antes de tentar a atualização
      if (!id) {
        throw new Error('ID da oportunidade inválido');
      }
      
      // Criar um timestamp atual para usar em ambos os campos de data
      const currentTimestamp = new Date().toISOString();
      
      const { data, error } = await crmonefactory
        .from('oportunidades')
        .update({ 
          status: status,
          data_atualizacao: currentTimestamp
          // Removido o campo updated_at que não existe na tabela
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error("Erro detalhado na atualização Supabase:", JSON.stringify(error));
        throw error; // Lançar o erro para cair no fallback
      }
      
      // Se chegou aqui, a atualização no Supabase foi bem-sucedida
      console.log("Atualização no Supabase bem-sucedida:", data);
      return NextResponse.json({
        id: id,
        status,
        success: true,
        data: data || null
      });
      
    } catch (supabaseError) {
      console.error("Erro na atualização Supabase:", supabaseError);
      console.log("Tentando fallback para arquivo local...");
      
      // Fallback: atualizar no arquivo local
      const oportunidades = await carregarOportunidades();
      const index = oportunidades.findIndex(o => o.id === id);
      
      if (index === -1) {
        return NextResponse.json(
          { error: 'Oportunidade não encontrada' },
          { status: 404 }
        );
      }
      
      // Atualizar no arquivo local
      const currentTimestamp = new Date().toISOString();
      oportunidades[index] = {
        ...oportunidades[index],
        status,
        dataAtualizacao: currentTimestamp
        // Removido o campo updated_at que não é necessário
      };
      
      await salvarOportunidades(oportunidades);
      console.log("Atualização no arquivo local bem-sucedida");
      
      // Retornar a oportunidade atualizada do arquivo local
      return NextResponse.json({
        ...oportunidades[index],
        success: true,
        source: 'local_file'
      });
    }
    
  } catch (error) {
    console.error('Erro ao atualizar status:', error);
    return NextResponse.json(
      { error: `Erro na atualização: ${error instanceof Error ? error.message : 'Erro desconhecido'}` },
      { status: 500 }
    );
  }
}

// DELETE - Excluir uma oportunidade
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const oportunidades = await carregarOportunidades();
    const id = await params.id;
    
    const index = oportunidades.findIndex(o => o.id === id);
    
    if (index === -1) {
      return NextResponse.json(
        { error: 'Oportunidade não encontrada' },
        { status: 404 }
      );
    }
    
    oportunidades.splice(index, 1);
    await salvarOportunidades(oportunidades);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao excluir oportunidade:', error);
    return NextResponse.json(
      { error: 'Erro ao excluir oportunidade' },
      { status: 500 }
    );
  }
}
