import { Card, CardContent } from "@/components/ui/card"
import type { Oportunidade } from "./kanban-board"
import { DollarSign, Users, Calendar, TrendingUp, Award } from "lucide-react"

interface StatsCardsProps {
  oportunidades: Oportunidade[]
}

export function StatsCards({ oportunidades }: StatsCardsProps) {
  // Calcular estatísticas
  const leadsEmAberto = oportunidades.filter((o) => o.status === "novo_lead").length
  const oportunidadesGanhas = oportunidades.filter((o) => o.status === "fechado_ganho").length

  const totalEmNegociacao = oportunidades
    .filter((o) => !["fechado_ganho", "fechado_perdido"].includes(o.status))
    .reduce((acc, o) => {
      const valorNumerico = Number.parseFloat(o.valor.replace("R$ ", "").replace(".", "").replace(",", "."))
      return isNaN(valorNumerico) ? acc : acc + valorNumerico
    }, 0)

  const taxaConversao = oportunidades.length > 0 ? Math.round((oportunidadesGanhas / oportunidades.length) * 100) : 0

  const clientesAtivos = [...new Set(oportunidades.map((o) => o.cliente))].length

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
      <Card>
        <CardContent className="p-6 flex items-center gap-4">
          <div className="bg-blue-100 p-3 rounded-full">
            <Users className="h-6 w-6 text-blue-700" />
          </div>
          <div>
            <div className="text-3xl font-bold">{leadsEmAberto}</div>
            <div className="text-sm text-gray-500">Leads em aberto</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 flex items-center gap-4">
          <div className="bg-green-100 p-3 rounded-full">
            <Award className="h-6 w-6 text-green-700" />
          </div>
          <div>
            <div className="text-3xl font-bold">{oportunidadesGanhas}</div>
            <div className="text-sm text-gray-500">Oportunidades ganhas</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 flex items-center gap-4">
          <div className="bg-amber-100 p-3 rounded-full">
            <DollarSign className="h-6 w-6 text-amber-700" />
          </div>
          <div>
            <div className="text-3xl font-bold">
              {totalEmNegociacao.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </div>
            <div className="text-sm text-gray-500">Em negociação</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 flex items-center gap-4">
          <div className="bg-purple-100 p-3 rounded-full">
            <TrendingUp className="h-6 w-6 text-purple-700" />
          </div>
          <div>
            <div className="text-3xl font-bold">{taxaConversao}%</div>
            <div className="text-sm text-gray-500">Taxa de conversão</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 flex items-center gap-4">
          <div className="bg-indigo-100 p-3 rounded-full">
            <Calendar className="h-6 w-6 text-indigo-700" />
          </div>
          <div>
            <div className="text-3xl font-bold">{clientesAtivos}</div>
            <div className="text-sm text-gray-500">Clientes ativos</div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

