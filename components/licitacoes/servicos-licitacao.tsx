"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Edit, Save, Plus, Trash2, DollarSign } from "lucide-react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface ServicosLicitacaoProps {
  licitacaoId: string
  isEditing: boolean
}

interface Servico {
  id: string
  licitacao_id: string
  nome: string
  descricao: string
  valor: number
  unidade: string
  quantidade: number
  data_criacao: string
  data_atualizacao: string
}

export function ServicosLicitacao({ licitacaoId, isEditing }: ServicosLicitacaoProps) {
  const [servicos, setServicos] = useState<Servico[]>([])
  const [carregando, setCarregando] = useState(true)
  const [dialogAberto, setDialogAberto] = useState(false)
  const [servicoParaExcluir, setServicoParaExcluir] = useState<string | null>(null)
  const [novoServico, setNovoServico] = useState({
    nome: "",
    descricao: "",
    valor: 0,
    unidade: "unidade",
    quantidade: 1
  })

  // Carregar serviços
  useEffect(() => {
    const carregarServicos = async () => {
      try {
        setCarregando(true)
        const response = await fetch(`/api/licitacoes/${licitacaoId}/servicos`)
        
        if (response.ok) {
          const data = await response.json()
          setServicos(data)
        } else {
          console.error("Erro ao carregar serviços:", response.statusText)
          toast.error("Não foi possível carregar os serviços da licitação")
        }
      } catch (error) {
        console.error("Erro ao carregar serviços:", error)
        toast.error("Erro ao carregar serviços")
      } finally {
        setCarregando(false)
      }
    }

    if (licitacaoId) {
      carregarServicos()
    }
  }, [licitacaoId])

  // Adicionar serviço
  const adicionarServico = async () => {
    try {
      if (!novoServico.nome) {
        toast.error("O nome do serviço é obrigatório")
        return
      }

      if (novoServico.valor <= 0) {
        toast.error("O valor do serviço deve ser maior que zero")
        return
      }

      if (novoServico.quantidade <= 0) {
        toast.error("A quantidade deve ser maior que zero")
        return
      }

      const response = await fetch(`/api/licitacoes/${licitacaoId}/servicos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(novoServico)
      })

      if (response.ok) {
        const servicoAdicionado = await response.json()
        setServicos(prev => [...prev, servicoAdicionado])
        
        // Limpar formulário
        setNovoServico({
          nome: "",
          descricao: "",
          valor: 0,
          unidade: "unidade",
          quantidade: 1
        })
        
        setDialogAberto(false)
        toast.success("Serviço adicionado com sucesso")
      } else {
        console.error("Erro ao adicionar serviço:", response.statusText)
        toast.error("Não foi possível adicionar o serviço")
      }
    } catch (error) {
      console.error("Erro ao adicionar serviço:", error)
      toast.error("Erro ao adicionar serviço")
    }
  }

  // Excluir serviço
  const excluirServico = async (servicoId: string) => {
    try {
      const response = await fetch(`/api/licitacoes/${licitacaoId}/servicos/${servicoId}`, {
        method: "DELETE"
      })

      if (response.ok) {
        setServicos(prev => prev.filter(s => s.id !== servicoId))
        setServicoParaExcluir(null)
        toast.success("Serviço excluído com sucesso")
      } else {
        console.error("Erro ao excluir serviço:", response.statusText)
        toast.error("Não foi possível excluir o serviço")
      }
    } catch (error) {
      console.error("Erro ao excluir serviço:", error)
      toast.error("Erro ao excluir serviço")
    }
  }

  // Formatar valor monetário
  const formatarValor = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor)
  }

  // Calcular valor total
  const calcularTotal = (valor: number, quantidade: number) => {
    return valor * quantidade
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium text-gray-500">Serviços da Licitação</h3>
        
        {isEditing && (
          <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="w-4 h-4" />
                Adicionar Serviço
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Serviço</DialogTitle>
                <DialogDescription>
                  Preencha os dados do serviço a ser adicionado à licitação.
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="nome">Nome do Serviço</Label>
                  <Input
                    id="nome"
                    value={novoServico.nome}
                    onChange={(e) => setNovoServico({...novoServico, nome: e.target.value})}
                    placeholder="Nome do serviço"
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="descricao">Descrição</Label>
                  <Textarea
                    id="descricao"
                    value={novoServico.descricao}
                    onChange={(e) => setNovoServico({...novoServico, descricao: e.target.value})}
                    placeholder="Descrição detalhada do serviço"
                  />
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="valor">Valor Unitário</Label>
                    <Input
                      id="valor"
                      type="number"
                      value={novoServico.valor}
                      onChange={(e) => setNovoServico({...novoServico, valor: parseFloat(e.target.value) || 0})}
                      placeholder="0,00"
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="unidade">Unidade</Label>
                    <Input
                      id="unidade"
                      value={novoServico.unidade}
                      onChange={(e) => setNovoServico({...novoServico, unidade: e.target.value})}
                      placeholder="unidade"
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="quantidade">Quantidade</Label>
                    <Input
                      id="quantidade"
                      type="number"
                      value={novoServico.quantidade}
                      onChange={(e) => setNovoServico({...novoServico, quantidade: parseInt(e.target.value) || 1})}
                      placeholder="1"
                    />
                  </div>
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogAberto(false)}>Cancelar</Button>
                <Button onClick={adicionarServico}>Adicionar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
      
      {carregando ? (
        <div className="text-center py-8">Carregando serviços...</div>
      ) : servicos.length > 0 ? (
        <div className="border rounded-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descrição</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Valor Unit.</th>
                <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Unidade</th>
                <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Qtd.</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                {isEditing && (
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {servicos.map((servico) => (
                <tr key={servico.id}>
                  <td className="px-4 py-3 text-sm">{servico.nome}</td>
                  <td className="px-4 py-3 text-sm">
                    {servico.descricao ? (
                      <span className="line-clamp-2">{servico.descricao}</span>
                    ) : (
                      <span className="text-gray-400 italic">Sem descrição</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-right">{formatarValor(servico.valor)}</td>
                  <td className="px-4 py-3 text-sm text-center">{servico.unidade}</td>
                  <td className="px-4 py-3 text-sm text-center">{servico.quantidade}</td>
                  <td className="px-4 py-3 text-sm text-right font-medium">
                    {formatarValor(calcularTotal(servico.valor, servico.quantidade))}
                  </td>
                  {isEditing && (
                    <td className="px-4 py-3 text-sm text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setServicoParaExcluir(servico.id)}
                        className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50">
              <tr>
                <td colSpan={isEditing ? 5 : 4} className="px-4 py-3 text-sm font-medium text-right">Valor Total:</td>
                <td className="px-4 py-3 text-sm text-right font-bold">
                  {formatarValor(servicos.reduce((acc, servico) => acc + calcularTotal(servico.valor, servico.quantidade), 0))}
                </td>
                {isEditing && <td></td>}
              </tr>
            </tfoot>
          </table>
        </div>
      ) : (
        <div className="text-center py-8 border rounded-md bg-gray-50">
          <p className="text-gray-500">Nenhum serviço cadastrado para esta licitação.</p>
          {isEditing && (
            <Button
              variant="outline"
              size="sm"
              className="mt-4 gap-2"
              onClick={() => setDialogAberto(true)}
            >
              <Plus className="w-4 h-4" />
              Adicionar Serviço
            </Button>
          )}
        </div>
      )}
      
      <AlertDialog open={!!servicoParaExcluir} onOpenChange={(open) => !open && setServicoParaExcluir(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Serviço</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este serviço? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => servicoParaExcluir && excluirServico(servicoParaExcluir)}
              className="bg-red-500 hover:bg-red-600"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}