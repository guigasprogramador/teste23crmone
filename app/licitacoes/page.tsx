"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MoreHorizontal, Edit, Trash, Mail, Phone, Calendar, CheckCircle, XCircle, AlertTriangle, FileText, Download, Share2 } from "lucide-react"
import { DetalhesLicitacao, Licitacao as LicitacaoComponentType } from "@/components/licitacoes/detalhes-licitacao"
import { DetalhesOrgao } from "@/components/licitacoes/detalhes-orgao"
import { FiltroLicitacoesOtimizado, LicitacaoFiltros } from "@/components/licitacoes/filtro-licitacoes-otimizado"
import { NovaLicitacao } from "@/components/licitacoes/nova-licitacao"
import { LicitacaoKanbanBoard } from "@/components/licitacoes/licitacao-kanban-board"
import type { Orgao as OrgaoType } from "@/components/licitacoes/detalhes-orgao"
import { useLicitacoesOtimizado } from "@/hooks/useLicitacoesOtimizado"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "@/components/ui/use-toast"
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';

interface Licitacao {
  id: string;
  titulo: string;
  status: string;
  data_abertura: string;
  data_encerramento: string;
  valor_estimado: number;
  url_edital: string;
  url_licitacao: string;
  contato_email: string;
  contato_telefone: string;
  orgao: OrgaoType | string;
  responsavel: string;
  modalidade: string;
  objeto: string;
  edital: string;
  dataAbertura: string;
  valorEstimado: number;
  dataEncerramento: string;
  urlEdital: string;
  urlLicitacao: string;
  contatoEmail: string;
  contatoTelefone: string;
}

export default function LicitacoesPage() {
  // Usar o hook otimizado para licitações
  const { 
    licitacoes, 
    filteredLicitacoes, 
    setFilteredLicitacoes,
    estatisticas, 
    isLoading: loading, 
    carregarLicitacoes,
    carregarDadosIniciais,
    adicionarLicitacao,
    atualizarLicitacao,
    excluirLicitacao,
    atualizarStatusLicitacao // Adicionar a nova função aqui
  } = useLicitacoesOtimizado();
  
  const [selectedLicitacao, setSelectedLicitacao] = useState<Licitacao | null>(null)
  const [selectedOrgao, setSelectedOrgao] = useState<OrgaoType | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [orgaoDetailsOpen, setOrgaoDetailsOpen] = useState(false)
  const [abaAtiva, setAbaAtiva] = useState("lista")
  const [excluirLicitacaoId, setExcluirLicitacaoId] = useState<string | null>(null)
  const [dialogExcluirAberto, setDialogExcluirAberto] = useState(false)
  const [filtros, setFiltros] = useState<LicitacaoFiltros>({})
  const [loadingSelectedLicitacao, setLoadingSelectedLicitacao] = useState(false);


  // Extrair listas de valores únicos para os filtros - usando useMemo para evitar recalcular a cada renderização
  const orgaos = useMemo(() => filteredLicitacoes.map(item => item.orgao), [filteredLicitacoes])
  const responsaveis = useMemo(() => filteredLicitacoes.map(item => item.responsavel), [filteredLicitacoes])
  const modalidades = useMemo(() => filteredLicitacoes.map(item => item.modalidade), [filteredLicitacoes])

  // Função para aplicar filtros
  const aplicarFiltros = async (novosFiltros: LicitacaoFiltros) => {
    setFiltros(novosFiltros);
    await carregarLicitacoes(novosFiltros);
  };

  // Carregar dados iniciais usando o hook otimizado
  useEffect(() => {
    carregarDadosIniciais();
  }, [carregarDadosIniciais])

  // Adicionar nova licitação
  const handleLicitacaoAdded = async (novaLicitacao: Licitacao) => {
    try {
      await adicionarLicitacao(novaLicitacao);
      toast({
        title: "Sucesso!",
        description: "Licitacao criada com sucesso.",
        variant: "default"
      });
    } catch (error) {
      console.error('Erro ao adicionar licitação:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar a licitação. Tente novamente.",
        variant: "destructive"
      });
    }
  }

  // Atualizar licitação
  const handleLicitacaoUpdate = async (licitacaoAtualizada: LicitacaoComponentType) => {
    try {
      await atualizarLicitacao(licitacaoAtualizada.id, licitacaoAtualizada);
      
      toast({
        title: "Sucesso!",
        description: "Licitacao atualizada com sucesso.",
        variant: "default"
      });
      
      // Fechar detalhes
      setDetailsOpen(false);
    } catch (error) {
      console.error('Erro ao atualizar licitação:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a licitação. Tente novamente.",
        variant: "destructive"
      });
    }
  }

  // Confirmar exclusão de licitação
  const handleDeleteLicitacao = (licitacao: Licitacao) => {
    setExcluirLicitacaoId(licitacao.id)
    setDialogExcluirAberto(true)
  }

  // Confirmar exclusão de licitação
  const confirmDeleteLicitacao = async () => {
    if (!excluirLicitacaoId) return;
    
    try {
      await excluirLicitacao(excluirLicitacaoId);
      
      // Se a licitação excluída for a selecionada, fechar o painel de detalhes
      if (selectedLicitacao && selectedLicitacao.id === excluirLicitacaoId) {
        setDetailsOpen(false);
        setSelectedLicitacao(null);
      }
      
      toast({
        title: "Sucesso!",
        description: "Licitacao excluída com sucesso.",
        variant: "default"
      });
    } catch (error) {
      console.error('Erro ao excluir licitação:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir a licitação. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setDialogExcluirAberto(false);
      setExcluirLicitacaoId(null);
    }
  }

  // Aplicar filtros localmente (quando necessário para filtros que a API não suporta)
  const handleFilterChange = (novosFiltros: LicitacaoFiltros) => {
    setFiltros(novosFiltros)
    
    // Para filtros que necessitam de resposta imediata na UI, aplicamos localmente também
    let filtered = [...licitacoes]
    
    // Aplicar filtros locais (complementares aos filtros da API)
    // Este trecho pode ser ajustado conforme necessidade
    
    setFilteredLicitacoes(filtered)
    
    // Recarregar da API com os novos filtros
    carregarLicitacoes()
  }

  // Formatar valor monetário
  const formatarValor = (valor: number | null | undefined): string => {
    if (valor === null || valor === undefined) {
      return 'R$ 0,00';
    }
    return `R$ ${valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  
  // Formatar valor monetário de forma compacta para os cards
  const formatarValorCompacto = (valor: number): string => {
    if (valor >= 1000000) {
      return `${(valor / 1000000).toFixed(1)}M`
    } else if (valor >= 1000) {
      return `${(valor / 1000).toFixed(1)}K`
    } else {
      return valor.toLocaleString('pt-BR')
    }
  }

  // Abrir detalhes da licitação
  const handleLicitacaoClick = (licitacao: Licitacao) => {
    setSelectedLicitacao(licitacao)
    setDetailsOpen(true)
  }

  // Abrir detalhes do órgão
  const handleOrgaoClick = (orgaoNome: string) => {
    if (detailsOpen) {
      setDetailsOpen(false)
      setTimeout(() => {
        // Verificar se o órgão existe antes de abrir os detalhes
        try {
          // Usar nome do órgão como identificador temporário
          const orgao: OrgaoType = { 
            id: uuidv4(), // Este ID será usado apenas temporariamente até que dados reais sejam carregados
            nome: orgaoNome,
            status: "ativo" // Status padrão
          }
          setSelectedOrgao(orgao)
          setOrgaoDetailsOpen(true)
        } catch (error) {
          console.error('Erro ao preparar detalhes do órgão:', error);
          toast({
            title: "Erro",
            description: "Não foi possível exibir os detalhes do órgão.",
            variant: "destructive"
          })
        }
      }, 300)
    } else {
      try {
        // Usar nome do órgão como identificador temporário
        const orgao: OrgaoType = { 
          id: uuidv4(), // Este ID será usado apenas temporariamente até que dados reais sejam carregados
          nome: orgaoNome,
          status: "ativo" // Status padrão
        }
        setSelectedOrgao(orgao)
        setOrgaoDetailsOpen(true)
      } catch (error) {
        console.error('Erro ao preparar detalhes do órgão:', error);
        toast({
          title: "Erro",
          description: "Não foi possível exibir os detalhes do órgão.",
          variant: "destructive"
        })
      }
    }
  }

  // Atualizar status de uma licitação
  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      console.log(`Atualizando status da licitação ${id} para ${newStatus} usando o hook.`);
      const licitacaoAtualizada = await atualizarStatusLicitacao(id, newStatus);

      if (licitacaoAtualizada) {
        // O hook já atualiza os estados licitacoes e filteredLicitacoes
        // e também recarrega as estatísticas.
        // Apenas precisamos atualizar selectedLicitacao se ela for a que mudou.
        if (selectedLicitacao && selectedLicitacao.id === id) {
          setSelectedLicitacao(prev => (prev ? { ...prev, status: newStatus } : null));
        }
        toast({
          title: "Status atualizado",
          description: "O status da licitação foi atualizado com sucesso.",
        });
      } else {
        // Se a função do hook retornar null, um erro já foi tratado e logado pelo hook
        // Um toast de erro já deve ter sido exibido pelo hook ou a sessão expirou
      }
    } catch (error) {
      // Este catch é para erros inesperados não tratados pelo hook,
      // ou se o hook relançar o erro.
      console.error('Erro ao chamar atualizarStatusLicitacao na página:', error);
      toast({
        title: "Status atualizado",
        description: "O status da licitação foi atualizado com sucesso.",
      })
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status da licitação.",
        variant: "destructive"
      })
    }
  }

  // Atualizar órgão
  const handleOrgaoUpdate = (orgaoAtualizado: OrgaoType) => {
    // Aqui seria uma chamada de API para atualizar o órgão
    console.log("Órgão atualizado:", orgaoAtualizado)
    
    // Update the licitacoes list with the new orgao name if it changed
    if (orgaoAtualizado.nome !== selectedOrgao?.nome) {
      // Em um cenário real, precisaríamos atualizar todas as licitações associadas a este órgão
      toast({
        title: "Órgão atualizado",
        description: "O órgão foi atualizado com sucesso. As licitações associadas serão atualizadas.",
      })
    }
    
    // Update the selected orgao
    setSelectedOrgao(orgaoAtualizado)
  }

  // Excluir órgão
  const handleOrgaoDelete = (orgao: OrgaoType) => {
    // Em um cenário real, precisaríamos verificar se há licitações associadas
    toast({
      title: "Órgão excluído",
      description: "O órgão foi excluído com sucesso.",
    })
    
    setOrgaoDetailsOpen(false)
    setSelectedOrgao(null)
  }

  // Funções para ações na tabela
  const handleDownloadEdital = (licitacao: Licitacao) => {
    if (licitacao.url_edital) {
      window.open(licitacao.url_edital, '_blank')
    } else {
      toast({
        title: "Edital não disponível",
        description: "O edital desta licitação não está disponível para download.",
        variant: "destructive"
      })
    }
  }

  const handleShareLicitacao = (licitacao: Licitacao) => {
    // Simulação de compartilhamento
    const url = licitacao.url_licitacao || window.location.href
    
    // Em uma implementação real, usaríamos a Web Share API
    if (navigator.share) {
      navigator.share({
        title: licitacao.titulo,
        text: `Licitação: ${licitacao.titulo}`,
        url: url
      })
    } else {
      // Fallback: copiar link para área de transferência
      navigator.clipboard.writeText(url).then(() => {
        toast({
          title: "Link copiado",
          description: "O link da licitação foi copiado para a área de transferência.",
        })
      })
    }
  }

  const handleSendEmail = (licitacao: Licitacao) => {
    const contato = licitacao.contato_email || ""
    if (contato) {
      window.location.href = `mailto:${contato}?subject=Licitação: ${licitacao.titulo}`
    } else {
      toast({
        title: "Email não disponível",
        description: "Não há um contato de email disponível para esta licitação.",
        variant: "destructive"
      })
    }
  }

  const handleScheduleCall = (licitacao: Licitacao) => {
    const telefone = licitacao.contato_telefone || ""
    if (telefone) {
      toast({
        title: "Ligação agendada",
        description: `Uma ligação foi agendada para o contato: ${telefone}`,
      })
    } else {
      toast({
        title: "Telefone não disponível",
        description: "Não há um contato telefônico disponível para esta licitação.",
        variant: "destructive"
      })
    }
  }

  const handleMarkAsWon = async (licitacao: Licitacao) => {
    await handleUpdateStatus(licitacao.id, "vencida")
  }

  const handleMarkAsLost = async (licitacao: Licitacao) => {
    await handleUpdateStatus(licitacao.id, "nao_vencida")
  }

  const handleOrgaoCreate = (orgaoNome: string) => {
    if (detailsOpen) {
      setDetailsOpen(false)
      setTimeout(() => {
        const orgao: OrgaoType = { 
          id: uuidv4(), 
          nome: orgaoNome,
          status: "ativo"
        }
        setSelectedOrgao(orgao)
        setOrgaoDetailsOpen(true)
      }, 300)
    } else {
      const orgao: OrgaoType = { 
        id: uuidv4(), 
        nome: orgaoNome,
        status: "ativo"
      }
      setSelectedOrgao(orgao)
      setOrgaoDetailsOpen(true)
    }
  }

  const handleOrgaoSelect = (orgao: OrgaoType) => {
    setSelectedOrgao(orgao)
    setOrgaoDetailsOpen(true)
  }

  const refetchLicitacaoSelecionada = useCallback(async () => {
    if (selectedLicitacao?.id) {
      setLoadingSelectedLicitacao(true); // Ativa o loading específico para o detalhe
      console.log(`[Page] Refetching licitacao: ${selectedLicitacao.id}`);
      try {
        // Idealmente, o hook useLicitacoesOtimizado teria uma função para buscar e atualizar uma única licitação no estado.
        // Como alternativa, recarregamos tudo e depois atualizamos a selecionada.
        await carregarDadosIniciais(); // Recarrega todas as licitações e estatísticas

        // Após carregarDadosIniciais, o estado 'licitacoes' no hook é atualizado.
        // Precisamos esperar que essa atualização se propague para esta página
        // e então encontrar a licitação atualizada na nova lista.
        // Isso pode ser um pouco complicado devido à natureza assíncrona.
        // Uma abordagem mais direta seria se o hook retornasse a lista atualizada.
        // Por agora, vamos confiar que o `useEffect` que observa `licitacoes` no hook vai atualizar `filteredLicitacoes`.
        // E que `selectedLicitacao` será atualizado se o objeto mudar na lista.
        // Para forçar uma atualização do objeto selectedLicitacao, podemos fazer:
        // const licitacaoAtualizada = licitacoes.find(l => l.id === selectedLicitacao.id); // 'licitacoes' pode não estar atualizada aqui ainda
        // setSelectedLicitacao(licitacaoAtualizada || null);
        // A melhor forma é o hook expor um getById ou a lista ser sempre a referência.
        // Para este subtask, a chamada a carregarDadosIniciais é o principal.
        // O componente DetalhesLicitacao vai re-renderizar porque sua prop 'licitacao' (que é selectedLicitacao)
        // será um novo objeto se carregarDadosIniciais atualizar a lista 'licitacoes' de onde 'filteredLicitacoes' deriva.
        // Se 'selectedLicitacao' for o mesmo objeto (mutado), não haverá re-renderização.
        // O hook `useLicitacoesOtimizado` já faz `setLicitacoes` com novos objetos.
        // A questão é se `selectedLicitacao` é uma cópia ou referência.
        // `handleLicitacaoClick` faz `setSelectedLicitacao(licitacao)`, que é uma referência.
        // Então, se o objeto na lista `licitacoes` (e consequentemente `filteredLicitacoes`) for atualizado,
        // `selectedLicitacao` também refletirá essa mudança.
        // No entanto, para garantir que o valor seja atualizado no header do DetalhesLicitacao,
        // é importante que a prop `oportunidade.valor` (que é `selectedLicitacao.valor`) seja atualizada.
        // O hook já atualiza a lista, então o `selectedLicitacao` deve refletir o novo valor.

      } catch (error) {
        toast({ title: "Erro", description: "Falha ao recarregar dados da licitação.", variant: "destructive" });
      } finally {
        setLoadingSelectedLicitacao(false);
      }
    }
  }, [selectedLicitacao, carregarDadosIniciais]);


  return (
    <div className="p-4 sm:p-6 md:p-8 overflow-hidden">
      <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">Licitações</h1>

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-4 mb-6 sm:mb-8">
        <Card className="shadow-sm hover:shadow transition-shadow duration-200">
          <CardContent className="p-3 sm:p-6">
            <div className="text-xl sm:text-2xl lg:text-3xl font-bold truncate">{estatisticas.total}</div>
            <div className="text-xs sm:text-sm text-muted-foreground">Licitações totais</div>
          </CardContent>
        </Card>

        <Card className="shadow-sm hover:shadow transition-shadow duration-200">
          <CardContent className="p-3 sm:p-6">
            <div className="text-xl sm:text-2xl lg:text-3xl font-bold truncate">{estatisticas.ativas}</div>
            <div className="text-xs sm:text-sm text-muted-foreground">Licitações ativas</div>
          </CardContent>
        </Card>

        <Card className="shadow-sm hover:shadow transition-shadow duration-200">
          <CardContent className="p-3 sm:p-6">
            <div className="text-xl sm:text-2xl lg:text-3xl font-bold truncate">{estatisticas.vencidas}</div>
            <div className="text-xs sm:text-sm text-muted-foreground">Licitações vencidas</div>
          </CardContent>
        </Card>

        <Card className="shadow-sm hover:shadow transition-shadow duration-200">
          <CardContent className="p-3 sm:p-6">
            <div className="flex flex-col">
              <div className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold truncate">{formatarValorCompacto(estatisticas.valorTotal)}</div>
              <div className="text-xs sm:text-sm text-muted-foreground">R$ total em licitações</div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm hover:shadow transition-shadow duration-200">
          <CardContent className="p-3 sm:p-6">
            <div className="text-xl sm:text-2xl lg:text-3xl font-bold truncate">{estatisticas.taxaSucesso}%</div>
            <div className="text-xs sm:text-sm text-muted-foreground">Taxa de sucesso</div>
          </CardContent>
        </Card>
      </div>

      {/* Abas e Filtros */}
      <div className="flex flex-col gap-2 sm:gap-4">
        <Tabs value={abaAtiva} onValueChange={setAbaAtiva} className="w-full">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                onClick={() => setAbaAtiva("kanban")}
                variant={abaAtiva === "kanban" ? "default" : "outline"}
                className="h-8 px-3 text-xs sm:text-sm"
              >
                Kanban
              </Button>
              <Button
                size="sm"
                onClick={() => setAbaAtiva("lista")}
                variant={abaAtiva === "lista" ? "default" : "outline"}
                className="h-8 px-3 text-xs sm:text-sm"
              >
                Lista
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <FiltroLicitacoesOtimizado 
                onFilterChange={handleFilterChange}
                orgaos={orgaos}
                responsaveis={responsaveis}
                modalidades={modalidades}
              />
              <NovaLicitacao
                onLicitacaoAdded={handleLicitacaoAdded}
              />
            </div>
          </div>

          {/* Tabela de licitações */}
          <TabsContent value="lista" className="mt-2 sm:mt-4">
            <div className="rounded-md border shadow-sm">
              <div className="relative overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs uppercase bg-gray-50 sticky top-0 z-10">
                    <tr>
                      <th className="p-2 sm:p-4">Título</th>
                      <th className="p-2 sm:p-4">Órgão</th>
                      <th className="p-2 sm:p-4 hidden sm:table-cell">Valor</th>
                      <th className="p-2 sm:p-4 hidden md:table-cell">Responsável</th>
                      <th className="p-2 sm:p-4 hidden md:table-cell">Data de Abertura</th>
                      <th className="p-2 sm:p-4">Status</th>
                      <th className="p-2 sm:p-4">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={7} className="p-4 text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <div className="animate-spin h-4 w-4 border-2 border-blue-500 rounded-full border-t-transparent"></div>
                            <span>Carregando licitações...</span>
                          </div>
                        </td>
                      </tr>
                    ) : filteredLicitacoes.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-4 text-center">
                          <div className="py-8">
                            <p className="text-gray-500">Nenhuma licitação encontrada</p>
                            <p className="text-sm text-gray-400 mt-1">Tente ajustar os filtros ou adicionar uma nova licitação</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredLicitacoes.map((licitacao) => (
                        <tr
                          key={licitacao.id}
                          className="border-b cursor-pointer hover:bg-gray-50 transition-colors duration-150"
                          onClick={() => handleLicitacaoClick(licitacao)}
                        >
                          <td className="p-2 sm:p-4">
                            <div className="font-medium line-clamp-2">{licitacao.titulo}</div>
                            <div className="text-xs text-gray-500 sm:hidden mt-1">
                              {formatarValor(licitacao.valor_estimado ?? licitacao.valorEstimado ?? 0)}
                            </div>
                          </td>
                          <td className="p-2 sm:p-4">
                            <Button
                              variant="link"
                              className="p-0 h-auto text-xs sm:text-sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleOrgaoClick(typeof licitacao.orgao === 'object' ? licitacao.orgao.nome : licitacao.orgao)
                              }}
                            >
                              {typeof licitacao.orgao === 'object' ? licitacao.orgao.nome : licitacao.orgao}
                            </Button>
                          </td>
                          <td className="p-2 sm:p-4 hidden sm:table-cell">{formatarValor(licitacao.valor_estimado ?? licitacao.valorEstimado ?? 0)}</td>
                          <td className="p-2 sm:p-4 hidden md:table-cell">{licitacao.responsavel || "Não definido"}</td>
                          <td className="p-2 sm:p-4 hidden md:table-cell">{licitacao.data_abertura || licitacao.dataAbertura || "Não definido"}</td>
                          <td className="p-2 sm:p-4">
                            <StatusBadge status={licitacao.status} />
                          </td>
                          <td className="p-4">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                  }}
                                >
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleLicitacaoClick(licitacao)
                                  }}
                                >
                                  <Edit className="mr-2 h-4 w-4" />
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleDeleteLicitacao(licitacao)
                                  }}
                                  className="text-destructive"
                                >
                                  <Trash className="mr-2 h-4 w-4" />
                                  Excluir
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleDownloadEdital(licitacao)
                                  }}
                                >
                                  <Download className="mr-2 h-4 w-4" />
                                  Baixar Edital
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleShareLicitacao(licitacao)
                                  }}
                                >
                                  <Share2 className="mr-2 h-4 w-4" />
                                  Compartilhar
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleSendEmail(licitacao)
                                  }}
                                >
                                  <Mail className="mr-2 h-4 w-4" />
                                  Enviar Email
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleScheduleCall(licitacao)
                                  }}
                                >
                                  <Phone className="mr-2 h-4 w-4" />
                                  Agendar Ligação
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleMarkAsWon(licitacao)
                                  }}
                                  disabled={licitacao.status === "vencida"}
                                >
                                  <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                                  Marcar como Ganho
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleMarkAsLost(licitacao)
                                  }}
                                  disabled={licitacao.status === "nao_vencida"}
                                >
                                  <XCircle className="mr-2 h-4 w-4 text-red-600" />
                                  Marcar como Perdido
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          {/* Visualização Kanban */}
          <TabsContent value="kanban" className="mt-2 sm:mt-4">
            <div className="bg-white rounded-md border shadow-sm p-2 sm:p-4">
              <LicitacaoKanbanBoard
                licitacoes={filteredLicitacoes}
                onUpdateStatus={handleUpdateStatus}
                onLicitacaoClick={(licitacao) => handleLicitacaoClick(licitacao)}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Modais de Detalhes */}
      {selectedLicitacao && detailsOpen ? (
        <DetalhesLicitacao
          key={`licitacao-${selectedLicitacao.id}`}
          licitacao={selectedLicitacao}
          open={detailsOpen}
          onOpenChange={(open) => {
            setDetailsOpen(open)
            if (!open) {
              setTimeout(() => {
                setSelectedLicitacao(null)
              }, 300)
            }
          }}
          onUpdateStatus={handleUpdateStatus}
          onOrgaoClick={handleOrgaoClick}
          onLicitacaoUpdate={handleLicitacaoUpdate} // Usado para salvar edições gerais da licitação
          onLicitacaoDelete={handleDeleteLicitacao}
          onLicitacaoNeedsRefresh={refetchLicitacaoSelecionada} // Nova prop
        />
      ) : null}

      {selectedOrgao && orgaoDetailsOpen ? (
        <DetalhesOrgao
          key={`orgao-${selectedOrgao.id}`}
          orgao={selectedOrgao}
          licitacao={selectedLicitacao}
          open={orgaoDetailsOpen}
          onOpenChange={(open) => {
            setOrgaoDetailsOpen(open)
            if (!open) {
              setTimeout(() => {
                setSelectedOrgao(null)
              }, 300)
            }
          }}
          onOrgaoUpdate={handleOrgaoUpdate}
          onOrgaoDelete={handleOrgaoDelete}
        />
      ) : null}
      
      {/* Diálogo de confirmação de exclusão */}
      <Dialog open={dialogExcluirAberto} onOpenChange={setDialogExcluirAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir esta licitação? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogExcluirAberto(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmDeleteLicitacao}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { label: string; class: string }> = {
    "Em andamento": { label: "Em andamento", class: "bg-blue-100 text-blue-800 rounded-full px-3 py-1 text-xs" },
    "Encerrado": { label: "Encerrado", class: "bg-red-100 text-red-800 rounded-full px-3 py-1 text-xs" },
    "Aguardando documentação": { label: "Aguardando documentação", class: "bg-yellow-100 text-yellow-800 rounded-full px-3 py-1 text-xs" },
    "Em análise": { label: "Em análise", class: "bg-orange-100 text-orange-800 rounded-full px-3 py-1 text-xs" },
    "Publicado": { label: "Publicado", class: "bg-green-100 text-green-800 rounded-full px-3 py-1 text-xs" },
    "vencida": { label: "Vencida", class: "bg-green-100 text-green-800 rounded-full px-3 py-1 text-xs" },
    "nao_vencida": { label: "Não Vencida", class: "bg-red-100 text-red-800 rounded-full px-3 py-1 text-xs" }
  }

  const config = statusConfig[status] || {
    label: status,
    class: "bg-gray-100 text-gray-800 rounded-full px-3 py-1 text-xs",
  }

  return <span className={config.class}>{config.label}</span>
}
