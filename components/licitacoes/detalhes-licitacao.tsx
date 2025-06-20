"use client"

import { useState, useEffect, useRef } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Building2,
  Calendar,
  Edit,
  Save,
  FileText,
  Upload,
  Download,
  Eye,
  Trash2,
  LinkIcon,
  DollarSign,
  User,
  ArrowRight,
  AlertTriangle,
  BadgeDollarSign,
  Plus,
  Maximize2,
  Minimize2,
} from "lucide-react"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { ResumoLicitacao } from "./resumo-licitacao"
import { ServicosLicitacao } from "./servicos-licitacao"

interface Licitacao {
  id: string
  titulo: string
  orgao: string
  status: string
  dataAbertura: string
  valorEstimado: number
  modalidade: string
  objeto: string
  edital: string
  responsavel: string
  documentos?: { nome: string; url: string }[]
  prazo?: string
  valor?: string
  data_publicacao?: string
  data_abertura?: string
  url_edital?: string
  descricao?: string
  forma_pagamento?: string
  obs_financeiras?: string
  tipo?: "produto" | "servico"
  tipoFaturamento?: "direto" | "distribuidor"
}

export type { Licitacao }

interface DetalhesLicitacaoProps {
  licitacao: Licitacao | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdateStatus?: (id: string, status: string) => void
  onOrgaoClick?: (orgaoNome: string) => void
  onLicitacaoUpdate?: (licitacao: Licitacao) => void
  onLicitacaoDelete?: (licitacao: Licitacao) => void
}

const statusColors: Record<string, string> = {
  analise_interna: "bg-blue-100 text-blue-800 border-blue-300",
  aguardando_pregao: "bg-purple-100 text-purple-800 border-purple-300",
  vencida: "bg-green-100 text-green-800 border-green-300",
  nao_vencida: "bg-red-100 text-red-800 border-red-300",
  envio_documentos: "bg-yellow-100 text-yellow-800 border-yellow-300",
  assinaturas: "bg-orange-100 text-orange-800 border-orange-300",
  concluida: "bg-emerald-100 text-emerald-800 border-emerald-300",
}

const statusLabels: Record<string, string> = {
  analise_interna: "Análise Interna",
  aguardando_pregao: "Aguardando Pregão",
  vencida: "Vencida",
  nao_vencida: "Não Vencida",
  envio_documentos: "Envio de Documentos",
  assinaturas: "Assinaturas",
  concluida: "Concluída",
}

const flowSteps = [
  { id: "analise_interna", label: "Análise Interna" },
  { id: "aguardando_pregao", label: "Aguardando Pregão" },
  { id: "envio_documentos", label: "Envio de Documentos" },
  { id: "assinaturas", label: "Assinaturas" },
  { id: "vencida", label: "Vencida" },
  { id: "nao_vencida", label: "Não Vencida" },
  { id: "concluida", label: "Concluída" },
]

export function DetalhesLicitacao({
  licitacao,
  open,
  onOpenChange,
  onUpdateStatus,
  onOrgaoClick,
  onLicitacaoUpdate,
  onLicitacaoDelete,
}: DetalhesLicitacaoProps) {
  const [activeTab, setActiveTab] = useState("resumo")
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState<Partial<Licitacao>>({})
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [documentosLicitacao, setDocumentosLicitacao] = useState<any[]>([])
  const [carregandoDocumentos, setCarregandoDocumentos] = useState(false)
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [tipoDocumento, setTipoDocumento] = useState("")
  const [enviandoArquivo, setEnviandoArquivo] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [arquivoSelecionado, setArquivoSelecionado] = useState<File | null>(null)

  const servicosOferecidos = [
    {
      id: 1,
      nome: "Sistema de Gestão Municipal",
      descricao: "Software completo para gestão administrativa municipal",
      valor: "R$ 280.000,00",
    },
    {
      id: 2,
      nome: "Módulo de Recursos Humanos",
      descricao: "Gestão de funcionários, folha de pagamento e benefícios",
      valor: "R$ 85.000,00",
    },
    {
      id: 3,
      nome: "Módulo Financeiro",
      descricao: "Controle financeiro, orçamentário e contábil",
      valor: "R$ 105.000,00",
    },
  ]

  // Reset active tab when opening the sheet
  useEffect(() => {
    if (open) {
      setActiveTab("resumo")
      setIsEditing(false)
    }
  }, [open])

  useEffect(() => {
    if (licitacao) {
      setFormData({ ...licitacao })
    }
  }, [licitacao])

  useEffect(() => {
    // Carregar documentos quando a aba documentos for selecionada
    if (activeTab === "documentos" && licitacao?.id) {
      buscarDocumentos(licitacao.id)
    }
  }, [activeTab, licitacao?.id])

  // Função para buscar documentos da licitação
  const buscarDocumentos = async (licitacaoId: string) => {
    try {
      setCarregandoDocumentos(true)
      console.log(`[DEBUG UI] Buscando documentos para licitação ID: ${licitacaoId}`)
      const response = await fetch(`/api/documentos/by-licitacao?licitacaoId=${licitacaoId}`)

      if (!response.ok) {
        throw new Error(`Erro ao buscar documentos: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      console.log(`[DEBUG UI] Documentos recebidos:`, data)
      setDocumentosLicitacao(data || [])
    } catch (error) {
      console.error('[DEBUG UI] Erro ao buscar documentos:', error)
      toast.error('Não foi possível carregar os documentos')
    } finally {
      setCarregandoDocumentos(false)
    }
  }

  // Função para baixar um documento
  const baixarDocumento = (url: string, nome: string) => {
    window.open(url, "_blank")
  }

  // Função para fazer upload de documento
  const uploadDocumento = async () => {
    if (!arquivoSelecionado || !licitacao?.id) {
      toast.error('Selecione um arquivo para upload')
      return
    }

    try {
      setEnviandoArquivo(true)
      
      // Preparar FormData com o arquivo
      const formData = new FormData()
      formData.append('file', arquivoSelecionado)
      formData.append('licitacaoId', licitacao.id)
      formData.append('tipo', tipoDocumento || 'Documento')
      
      // Fazer upload do arquivo - sem necessidade de token
      const response = await fetch('/api/documentos/upload', {
        method: 'POST',
        headers: {
          // Enviamos apenas o header de autorização como Bearer sem token
          // para que o backend aceite a requisição, mas não dependa de um token específico
          'Authorization': 'Bearer anonymous'
        },
        body: formData
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao fazer upload')
      }
      
      const result = await response.json()
      
      // Atualizar a lista de documentos
      buscarDocumentos(licitacao.id)
      
      // Limpar o estado
      setArquivoSelecionado(null)
      setTipoDocumento("")
      setUploadDialogOpen(false)
      
      // Mostrar mensagem de sucesso
      toast.success('Documento enviado com sucesso')
      
    } catch (error: any) {
      console.error('Erro ao fazer upload:', error)
      toast.error(error.message || 'Erro ao fazer upload do documento')
    } finally {
      setEnviandoArquivo(false)
    }
  }

  // Função para selecionar arquivo
  const handleFileSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setArquivoSelecionado(file)
  }

  const handleFieldChange = (field: string, value: string) => {
    setFormData({
      ...formData,
      [field]: value,
    })
  }

  const handleSave = () => {
    if (onLicitacaoUpdate && formData) {
      onLicitacaoUpdate(formData as Licitacao)
      toast.success("Licitação atualizada com sucesso")
    } else {
      console.log("Salvando dados:", formData)
    }
    setIsEditing(false)
  }

  const handleDelete = () => {
    if (onLicitacaoDelete && licitacao) {
      onLicitacaoDelete(licitacao)
      setDeleteDialogOpen(false)
      onOpenChange(false)
      toast.success("Licitação excluída com sucesso")
    }
  }

  const atualizarStatus = (novoStatus: string) => {
    if (licitacao && onUpdateStatus) {
      onUpdateStatus(licitacao.id, novoStatus)
    }

    setFormData({
      ...formData,
      status: novoStatus,
    })
    console.log(`Status atualizado para: ${novoStatus}`)
  }

  if (!licitacao) {
    return (
      <Sheet key="empty-licitacao-sheet" open={false} onOpenChange={() => { }}>
        <SheetContent className="w-full md:max-w-xl lg:max-w-2xl overflow-y-auto">
          <div></div>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <Sheet key={`licitacao-sheet-${licitacao?.id || "empty"}`} open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className={`overflow-y-auto transition-all duration-300 ${
          isExpanded ? "w-[95vw] max-w-[95vw]" : "w-full md:max-w-3xl lg:max-w-4xl"
        }`}
      >
        <SheetHeader className="mb-6">
          <div className="flex justify-between items-center">
            <SheetTitle className="text-xl">{formData.titulo || "Licitação"}</SheetTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8 w-8 rounded-full"
              title={isExpanded ? "Recolher painel" : "Expandir painel"}
            >
              {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          </div>
          <div className="text-sm text-muted-foreground">
            <div className="flex items-center gap-2 mt-2">
              <Button
                variant="link"
                className="p-0 h-auto font-normal"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  if (onOrgaoClick && formData.orgao) {
                    // Adicionar um pequeno atraso para evitar problemas de reconciliação
                    setTimeout(() => {
                      onOrgaoClick(formData.orgao || "")
                    }, 10)
                  }
                }}
              >
                <Building2 className="w-4 h-4 mr-1" />
                {formData.orgao}
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            <Badge className={statusColors[formData.status || "analise_interna"]}>
              {statusLabels[formData.status || "analise_interna"]}
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Prazo: {formData.prazo}
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <DollarSign className="w-3 h-3" />
              {formData.valor}
            </Badge>
          </div>
          <div className="flex justify-end mt-4">
            {isEditing ? (
              <Button onClick={handleSave} className="gap-2">
                <Save className="w-4 h-4" />
                Salvar Alterações
              </Button>
            ) : (
              <Button onClick={() => setIsEditing(true)} variant="outline" className="gap-2">
                <Edit className="w-4 h-4" />
                Editar
              </Button>
            )}
            <Button onClick={() => setDeleteDialogOpen(true)} variant="destructive" className="gap-2">
              <Trash2 className="w-4 h-4" />
              Excluir
            </Button>
          </div>
        </SheetHeader>

        <Tabs defaultValue="resumo" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="resumo">Resumo</TabsTrigger>
            <TabsTrigger value="servicos">Serviços</TabsTrigger>
            <TabsTrigger value="documentos">Documentos</TabsTrigger>
            <TabsTrigger value="valores">Valores</TabsTrigger>
          </TabsList>

          <TabsContent value="resumo">
            {/* Importar o componente de resumo */}
            <ResumoLicitacao licitacaoId={licitacao.id} isEditing={isEditing} />

            <div className="space-y-6 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-4">Informações Básicas</h3>
                  <div className="space-y-4">
                    <div>
                      <Label>Modalidade</Label>
                      {isEditing ? (
                        <Select
                          value={formData.modalidade}
                          onValueChange={(value) => handleFieldChange("modalidade", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a modalidade" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pregao_eletronico">Pregão Eletrônico</SelectItem>
                            <SelectItem value="pregao_presencial">Pregão Presencial</SelectItem>
                            <SelectItem value="tomada_precos">Tomada de Preços</SelectItem>
                            <SelectItem value="concorrencia">Concorrência</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <p className="text-sm mt-1">Pregão Eletrônico</p>
                      )}
                    </div>

                    <div>
                      <Label>Tipo da Licitação</Label>
                      {isEditing ? (
                        <div className="mt-1">
                          <Select
                            value={formData.tipo || ""}
                            onValueChange={(value: "produto" | "servico") => {
                              const newFormData = { ...formData, tipo: value }
                              // Se mudar de produto para serviço, limpar tipoFaturamento
                              if (value !== "produto") {
                                newFormData.tipoFaturamento = undefined
                              }
                              setFormData(newFormData)
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o tipo" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="produto">Produto</SelectItem>
                              <SelectItem value="servico">Serviço</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      ) : (
                        <p className="text-sm mt-1">
                          {formData.tipo === "produto" ? "Produto" : 
                           formData.tipo === "servico" ? "Serviço" : 
                           "Não especificado"}
                        </p>
                      )}
                    </div>

                    {(isEditing && formData.tipo === "produto") || (!isEditing && formData.tipo === "produto") ? (
                      <div>
                        <Label>Tipo de Faturamento</Label>
                        {isEditing ? (
                          <div className="mt-1">
                            <Select
                              value={formData.tipoFaturamento || ""}
                              onValueChange={(value: "direto" | "distribuidor") => 
                                setFormData({ ...formData, tipoFaturamento: value })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o tipo de faturamento" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="direto">Direto</SelectItem>
                                <SelectItem value="distribuidor">Via Distribuidor</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        ) : (
                          <p className="text-sm mt-1">
                            {formData.tipoFaturamento === "direto" ? "Direto" : 
                             formData.tipoFaturamento === "distribuidor" ? "Via Distribuidor" : 
                             "Não especificado"}
                          </p>
                        )}
                      </div>
                    ) : null}

                    <div>
                      <Label htmlFor="edital">Número do Edital</Label>
                      <Input
                        id="edital"
                        value={formData.edital || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, edital: e.target.value })
                        }
                        disabled={!isEditing}
                      />
                    </div>
                    <div>
                      <Label htmlFor="dataAbertura">Data de Abertura</Label>
                      <Input
                        id="dataAbertura"
                        type="date"
                        value={formData.dataAbertura || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, dataAbertura: e.target.value })
                        }
                        disabled={!isEditing}
                      />
                    </div>
                    <div>
                      <Label htmlFor="editalUrl">URL do Edital</Label>
                      <Input
                        id="editalUrl"
                        value={formData.edital || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, edital: e.target.value })
                        }
                        disabled={!isEditing}
                      />
                    </div>

                    <div>
                      <Label htmlFor="objeto">Objeto</Label>
                      <Textarea
                        id="objeto"
                        value={formData.objeto || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, objeto: e.target.value })
                        }
                        className="min-h-[100px]"
                        disabled={!isEditing}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-4">Datas Importantes</h3>
                  <div className="space-y-4">
                    <div>
                      <Label>Data de Publicação</Label>
                      {isEditing ? (
                        <Input
                          type="date"
                          value={formData.data_publicacao}
                          onChange={(e) => handleFieldChange("data_publicacao", e.target.value)}
                        />
                      ) : (
                        <p className="text-sm mt-1">{formData.data_publicacao}</p>
                      )}
                    </div>

                    <div>
                      <Label>Data de Abertura</Label>
                      {isEditing ? (
                        <Input
                          type="date"
                          value={formData.data_abertura}
                          onChange={(e) => handleFieldChange("data_abertura", e.target.value)}
                        />
                      ) : (
                        <p className="text-sm mt-1">{formData.data_abertura}</p>
                      )}
                    </div>

                    <div>
                      <Label>URL do Edital</Label>
                      {isEditing ? (
                        <Input
                          value={formData.url_edital}
                          onChange={(e) => handleFieldChange("url_edital", e.target.value)}
                        />
                      ) : (
                        <a
                          href={formData.url_edital}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm mt-1 text-blue-600 hover:underline flex items-center gap-1"
                        >
                          <LinkIcon className="w-3 h-3" />
                          Acessar Edital
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Descrição da Demanda</h3>
                {isEditing ? (
                  <Textarea
                    value={formData.descricao}
                    onChange={(e) => handleFieldChange("descricao", e.target.value)}
                    rows={4}
                  />
                ) : (
                  <p className="text-sm">{formData.descricao}</p>
                )}
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Responsáveis</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <User className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{formData.responsavel || "Ana Silva"}</p>
                      <p className="text-xs text-gray-500">Gerente de Licitações</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="servicos">
            {/* Componente de serviços da licitação */}
            <ServicosLicitacao licitacaoId={licitacao.id} isEditing={isEditing} />
          </TabsContent>

          <TabsContent value="documentos">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Documentos</h3>
                <Button size="sm" className="gap-2" onClick={() => setUploadDialogOpen(true)}>
                  <Upload className="w-4 h-4" />
                  Upload
                </Button>
              </div>

              <div className="space-y-3">
                {carregandoDocumentos ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
                  </div>
                ) : documentosLicitacao.length > 0 ? (
                  documentosLicitacao.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-blue-500" />
                        <div>
                          <p className="font-medium">{doc.nome}</p>
                          <div className="flex gap-4 text-sm text-gray-500">
                            <span>{doc.categoria || doc.tipo}</span>
                            <span>{new Date(doc.data_criacao).toLocaleDateString()}</span>
                            <span>{formatFileSize(doc.tamanho)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => window.open(doc.url, '_blank')}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => baixarDocumento(doc.url, doc.nome)}>
                          <Download className="w-4 h-4" />
                        </Button>
                        {isEditing && (
                          <Button variant="ghost" size="icon" className="text-red-500">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>Nenhum documento encontrado para esta licitação</p>
                    <p className="text-sm mt-1">Faça upload de documentos usando o botão acima</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="valores">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <BadgeDollarSign className="w-4 h-4 text-green-500" />
                    Valores da Licitação
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="valorEstimado">Valor Estimado</Label>
                      <Input
                        id="valorEstimado"
                        type="number"
                        value={formData.valorEstimado || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            valorEstimado: parseFloat(e.target.value),
                          })
                        }
                        disabled={!isEditing}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="valorProposta">Valor da Proposta</Label>
                      <Input
                        id="valorProposta"
                        type="number"
                        value={formData.valorEstimado || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            valorEstimado: parseFloat(e.target.value),
                          })
                        }
                        disabled={!isEditing}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="margem">Margem (%)</Label>
                      <Input
                        id="margem"
                        type="number"
                        value={"10"}
                        onChange={(e) =>
                          console.log("Margem alterada:", e.target.value)
                        }
                        disabled={!isEditing}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    Condições Financeiras
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label>Forma de Pagamento</Label>
                      {isEditing ? (
                        <Select
                          value={formData.forma_pagamento}
                          onValueChange={(value) => handleFieldChange("forma_pagamento", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a forma de pagamento" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="mensal">Mensal</SelectItem>
                            <SelectItem value="parcela_unica">Parcela Única</SelectItem>
                            <SelectItem value="customizado">Customizado</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <p className="text-sm mt-1">Pagamento Mensal</p>
                      )}
                    </div>

                    <div>
                      <Label>Observações Financeiras</Label>
                      {isEditing ? (
                        <Textarea
                          value={formData.obs_financeiras}
                          onChange={(e) => handleFieldChange("obs_financeiras", e.target.value)}
                          placeholder="Adicione observações sobre condições financeiras..."
                        />
                      ) : (
                        <p className="text-sm mt-1">
                          Pagamentos mediante empenho prévio. Notas fiscais devem ser emitidas até o dia 20 de cada mês.
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </SheetContent>

      {/* Modal de Upload de Arquivos */}
      <AlertDialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Upload de Documento</AlertDialogTitle>
            <AlertDialogDescription>
              Selecione um arquivo para fazer upload para esta licitação.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="tipo">Tipo de Documento</Label>
              <Select value={tipoDocumento} onValueChange={setTipoDocumento}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo de documento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Edital">Edital</SelectItem>
                  <SelectItem value="Proposta">Proposta</SelectItem>
                  <SelectItem value="Contrato">Contrato</SelectItem>
                  <SelectItem value="Anexo">Anexo</SelectItem>
                  <SelectItem value="Habilitação">Documentos de Habilitação</SelectItem>
                  <SelectItem value="Técnico">Documento Técnico</SelectItem>
                  <SelectItem value="Outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="arquivo">Arquivo</Label>
              <div className="mt-2">
                <input
                  type="file"
                  id="arquivo"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={handleFileSelection}
                />
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full justify-start"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {arquivoSelecionado ? arquivoSelecionado.name : "Selecionar arquivo"}
                  </Button>
                  {arquivoSelecionado && (
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => setArquivoSelecionado(null)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  )}
                </div>
                {arquivoSelecionado && (
                  <p className="text-xs text-gray-500 mt-1">
                    {formatFileSize(arquivoSelecionado.size)}
                  </p>
                )}
              </div>
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setArquivoSelecionado(null);
              setTipoDocumento("");
            }}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={uploadDocumento}
              disabled={!arquivoSelecionado || enviandoArquivo}
            >
              {enviandoArquivo ? (
                <>
                  <div className="animate-spin mr-2 h-4 w-4 border-b-2 border-white rounded-full"></div>
                  Enviando...
                </>
              ) : (
                "Fazer Upload"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {deleteDialogOpen && (
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir Licitação</AlertDialogTitle>
            </AlertDialogHeader>
            <AlertDialogDescription>
              Você tem certeza que deseja excluir essa licitação? Essa ação não pode ser desfeita.
            </AlertDialogDescription>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setDeleteDialogOpen(false)}>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </Sheet>
  )
}

// Função auxiliar para formatar o tamanho do arquivo
function formatFileSize(bytes: number): string {
  if (!bytes) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
