"use client"

import { useState } from "react"
import KanbanBoard, { type Oportunidade } from "@/components/dashboard/kanban-board"
import { StatsCards } from "@/components/dashboard/stats-cards"
import { ProximasAtividades } from "@/components/dashboard/proximas-atividades"
import { OportunidadesRecentes } from "@/components/dashboard/oportunidades-recentes"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export default function DashboardPage() {
  // Dados de exemplo para oportunidades
  const [oportunidades, setOportunidades] = useState<Oportunidade[]>([
    {
      id: "1",
      titulo: "Sistema de Gestão Municipal",
      cliente: "Prefeitura de São Paulo",
      valor: "R$ 450.000,00",
      responsavel: "Ana Silva",
      prazo: "30/06/2023",
      status: "novo_lead",
    },
    {
      id: "2",
      titulo: "Plataforma de Educação Online",
      cliente: "Secretaria de Educação",
      valor: "R$ 280.000,00",
      responsavel: "Carlos Oliveira",
      prazo: "15/07/2023",
      status: "agendamento_reuniao",
    },
    {
      id: "3",
      titulo: "Modernização de Infraestrutura",
      cliente: "Hospital Municipal",
      valor: "R$ 620.000,00",
      responsavel: "Ana Silva",
      prazo: "10/08/2023",
      status: "levantamento_oportunidades",
    },
    {
      id: "4",
      titulo: "Sistema de Controle de Frotas",
      cliente: "Departamento de Transportes",
      valor: "R$ 180.000,00",
      responsavel: "Pedro Santos",
      prazo: "05/06/2023",
      status: "proposta_enviada",
    },
    {
      id: "5",
      titulo: "Portal de Transparência",
      cliente: "Governo do Estado",
      valor: "R$ 320.000,00",
      responsavel: "Carlos Oliveira",
      prazo: "20/07/2023",
      status: "negociacao",
    },
    {
      id: "6",
      titulo: "Sistema de Gestão de Saúde",
      cliente: "Secretaria de Saúde",
      valor: "R$ 520.000,00",
      responsavel: "Maria Souza",
      prazo: "25/07/2023",
      status: "fechado_ganho",
    },
    {
      id: "7",
      titulo: "Aplicativo de Serviços Públicos",
      cliente: "Prefeitura de Campinas",
      valor: "R$ 380.000,00",
      responsavel: "Pedro Santos",
      prazo: "15/06/2023",
      status: "fechado_perdido",
    },
  ])

  // Função para atualizar o status de uma oportunidade
  const handleUpdateStatus = (id: string, newStatus: string) => {
    setOportunidades((prevOportunidades) =>
      prevOportunidades.map((op) => (op.id === id ? { ...op, status: newStatus } : op)),
    )
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nova Oportunidade
        </Button>
      </div>

      {/* Cards de estatísticas */}
      <StatsCards oportunidades={oportunidades} />

      {/* Abas para alternar entre visualizações */}
      <Tabs defaultValue="kanban" className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="kanban">Kanban</TabsTrigger>
            <TabsTrigger value="resumo">Resumo</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="kanban">
          <div className="mb-6">
            <KanbanBoard oportunidades={oportunidades} onUpdateStatus={handleUpdateStatus} />
          </div>
        </TabsContent>

        <TabsContent value="resumo">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <ProximasAtividades />
            <OportunidadesRecentes oportunidades={oportunidades} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

