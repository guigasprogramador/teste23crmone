import { NextRequest, NextResponse } from 'next/server';
import { Reuniao } from '@/types/comercial';
import sgMail from '@sendgrid/mail';
sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

// Simulação de banco de dados em memória
let reunioes: Reuniao[] = [
  {
    id: "r1",
    oportunidadeId: "1",
    titulo: "Apresentação inicial",
    data: "2023-06-15",
    hora: "14:30",
    local: "Online - Microsoft Teams",
    participantes: ["Ana Silva", "João Silva"],
    notas: "Apresentar portfólio de soluções e entender necessidades específicas.",
    concluida: false,
  },
  {
    id: "r2",
    oportunidadeId: "2",
    titulo: "Demonstração de produto",
    data: "2023-06-20",
    hora: "10:00",
    local: "Sede do cliente",
    participantes: ["Carlos Oliveira", "Maria Oliveira", "Pedro Santos"],
    notas: "Demonstrar módulos específicos solicitados pelo cliente.",
    concluida: false,
  },
  {
    id: "r3",
    oportunidadeId: "3",
    titulo: "Levantamento técnico",
    data: "2023-06-25",
    hora: "09:30",
    local: "Hospital Municipal",
    participantes: ["Ana Silva", "Roberto Santos", "Técnico de TI"],
    notas: "Avaliar infraestrutura atual e requisitos técnicos.",
    concluida: false,
  },
  {
    id: "r4",
    oportunidadeId: "4",
    titulo: "Apresentação da proposta",
    data: "2023-06-10",
    hora: "15:00",
    local: "Online - Zoom",
    participantes: ["Pedro Santos", "Carlos Ferreira", "Equipe de Logística"],
    notas: "Apresentar proposta detalhada com cronograma de implementação.",
    concluida: true,
  },
  {
    id: "r5",
    oportunidadeId: "5",
    titulo: "Negociação de valores",
    data: "2023-06-30",
    hora: "11:00",
    local: "Escritório central",
    participantes: ["Carlos Oliveira", "Ana Pereira", "Diretor Financeiro"],
    notas: "Discutir condições comerciais e possíveis descontos.",
    concluida: false,
  },
];

// GET - Listar todas as reuniões ou filtrar
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parâmetros de filtro
    const oportunidadeId = searchParams.get('oportunidadeId');
    const data = searchParams.get('data');
    const concluida = searchParams.get('concluida');
    
    let resultado = [...reunioes];
    
    // Aplicar filtros
    if (oportunidadeId) {
      resultado = resultado.filter((reuniao) => reuniao.oportunidadeId === oportunidadeId);
    }
    
    if (data) {
      resultado = resultado.filter((reuniao) => reuniao.data === data);
    }
    
    if (concluida !== null && concluida !== undefined) {
      const concluidaBoolean = concluida === 'true';
      resultado = resultado.filter((reuniao) => reuniao.concluida === concluidaBoolean);
    }
    
    // Ordenar por data e hora
    resultado.sort((a, b) => {
      const dataA = new Date(`${a.data}T${a.hora}`);
      const dataB = new Date(`${b.data}T${b.hora}`);
      return dataA.getTime() - dataB.getTime();
    });
    
    return NextResponse.json(resultado);
  } catch (error) {
    console.error('Erro ao buscar reuniões:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar reuniões' },
      { status: 500 }
    );
  }
}

// POST - Criar nova reunião
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Validação básica
    if (!data.oportunidadeId || !data.titulo || !data.data || !data.hora) {
      return NextResponse.json(
        { error: 'ID da oportunidade, título, data e hora são obrigatórios' },
        { status: 400 }
      );
    }
    
    const novaReuniao: Reuniao = {
      id: `meeting-${Date.now()}`,
      oportunidadeId: data.oportunidadeId,
      titulo: data.titulo,
      data: data.data,
      hora: data.hora,
      local: data.local || 'A definir',
      participantes: data.participantes || [],
      notas: data.notas || '',
      concluida: false,
    };
    
    reunioes.push(novaReuniao);

    // Busca real dos e-mails dos responsáveis se vierem apenas os IDs
    let emailsResponsaveis: string[] = [];
    if (Array.isArray(data.emailResponsavel) && data.emailResponsavel.length > 0) {
      emailsResponsaveis = data.emailResponsavel;
    } else if (Array.isArray(data.responsaveisIds) && data.responsaveisIds.length > 0) {
      // Busca real via API
      const fetchResponsaveis = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/comercial/responsaveis`);
      const todosResponsaveis = await fetchResponsaveis.json();
      emailsResponsaveis = todosResponsaveis.filter((r: any) => data.responsaveisIds.includes(r.id)).map((r: any) => r.email);
    }
    let emailCliente = data.emailCliente;
    if ((!emailCliente || emailCliente === "") && data.clienteId) {
      // Busca real via API
      const fetchCliente = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/comercial/clientes/${data.clienteId}`);
      if (fetchCliente.ok) {
        const cliente = await fetchCliente.json();
        emailCliente = cliente.contatoEmail || cliente.email;
      }
    }
    const destinatarios = [...emailsResponsaveis, emailCliente].filter(Boolean);
    const emailBody = `
      <h2>Nova reunião agendada</h2>
      <p><b>Título:</b> ${novaReuniao.titulo}</p>
      <p><b>Data:</b> ${novaReuniao.data} às ${novaReuniao.hora}</p>
      <p><b>Local:</b> ${novaReuniao.local}</p>
      <p><b>Participantes:</b> ${novaReuniao.participantes.join(', ')}</p>
      <p><b>Pauta:</b> ${novaReuniao.notas}</p>
    `;
    try {
      await sgMail.send({
        to: destinatarios,
        from: process.env.SENDGRID_FROM_EMAIL || 'noreply@seudominio.com',
        subject: 'Novo Agendamento de Reunião',
        html: emailBody,
      });
    } catch (emailError) {
      console.error('Erro ao enviar e-mail via SendGrid:', emailError);
    }
    return NextResponse.json(novaReuniao, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar reunião:', error);
    return NextResponse.json(
      { error: 'Erro ao criar reunião' },
      { status: 500 }
    );
  }
}
