"use client"

import React, { useState, useRef } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { Plus, CalendarIcon, Save, Mail, FileText } from "lucide-react"
import { SeletorDocumentosComercial } from "@/components/comercial/seletor-documentos-comercial"
import { DocumentType } from "@/hooks/useDocuments"

interface NovaOportunidadeProps {
  onOportunidadeAdded?: (oportunidade: any) => void
}

export function NovaOportunidade({ onOportunidadeAdded }: NovaOportunidadeProps) {
  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("cliente")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Estados para os campos do formulário
  const [formData, setFormData] = useState({
    // Dados do cliente
    nomeCliente: "",
    cnpj: "",
    contatoNome: "",
    contatoTelefone: "",
    contatoEmail: "",
    endereco: "",
    segmento: "",

    // Dados da oportunidade
    titulo: "",
    descricao: "",
    valor: "",
    status: "novo_lead",
    prazo: "",
    tipo: "", // Produto ou Serviço
    tipoFaturamento: "", // Direto ou Distribuidor (apenas para Produto)
  })

  // Estado para data de reunião
  const [dataReuniao, setDataReuniao] = useState<Date | undefined>()
  const [horaReuniao, setHoraReuniao] = useState("")

  // Estado para responsáveis
  const [responsaveis, setResponsaveis] = useState([
    { id: "resp1", nome: "Ana Silva", selecionado: false },
    { id: "resp2", nome: "Carlos Oliveira", selecionado: false },
    { id: "resp3", nome: "Pedro Santos", selecionado: false },
    { id: "resp4", nome: "Maria Souza", selecionado: false },
  ])

  // Estado para criar evento no calendário
  const [criarEvento, setCriarEvento] = useState(true)
  const [enviarNotificacoes, setEnviarNotificacoes] = useState(true)

  // Estado para documentos selecionados do repositório
  const [documentosRepositorio, setDocumentosRepositorio] = useState<DocumentType[]>([])

  // Estado para documentos necessários (checklist)
  const [documentosNecessarios, setDocumentosNecessarios] = useState([
    { id: "doc1", nome: "Proposta Comercial", selecionado: false },
    { id: "doc2", nome: "Contrato de Serviço", selecionado: false },
    { id: "doc3", nome: "Ficha Cadastral", selecionado: false },
    { id: "doc4", nome: "Termo de Confidencialidade", selecionado: false },
    { id: "doc5", nome: "Carta de Apresentação", selecionado: false },
  ])

  // Estado para arquivos anexados
  const [arquivosAnexados, setArquivosAnexados] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Funções de manipulação de formulário
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleResponsavelChange = (id: string, checked: boolean) => {
    setResponsaveis(responsaveis.map((resp) => (resp.id === id ? { ...resp, selecionado: checked } : resp)))
  }

  // Função para marcar documentos necessários no checklist
  const handleDocumentoChange = (id: string, checked: boolean) => {
    setDocumentosNecessarios(
      documentosNecessarios.map((doc) => (doc.id === id ? { ...doc, selecionado: checked } : doc))
    )
  }

  // Manipular seleção de arquivos
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      const novoArquivos = Array.from(e.target.files)
      setArquivosAnexados(prev => [...prev, ...novoArquivos])
    }
  }

  // Abrir diálogo de seleção de arquivos
  const handleEscolherArquivos = () => {
    fileInputRef.current?.click()
  }

  // Remover arquivo da lista
  const handleRemoverArquivo = (index: number) => {
    setArquivosAnexados(prev => prev.filter((_, i) => i !== index))
  }

  const validateForm = () => {
    // Validar campos obrigatórios com base na aba ativa
    if (activeTab === "cliente") {
      return (
        formData.nomeCliente &&
        formData.cnpj &&
        formData.contatoNome &&
        formData.contatoEmail &&
        formData.segmento
      )
    } else if (activeTab === "oportunidade") {
      const tipoValid = formData.tipo && (formData.tipo === "servico" || (formData.tipo === "produto" && formData.tipoFaturamento))
      return formData.titulo && formData.status && tipoValid
    } else if (activeTab === "documentos") {
      return true // Não há campos obrigatórios na aba de documentos
    } else if (activeTab === "reuniao") {
      return true // Não há campos obrigatórios na aba de reunião
    }
    return false
  }

  const handleNextTab = () => {
    if (!validateForm()) {
      alert("Por favor, preencha todos os campos obrigatórios.")
      return
    }

    if (activeTab === "cliente") {
      setActiveTab("oportunidade")
    } else if (activeTab === "oportunidade") {
      setActiveTab("documentos")
    } else if (activeTab === "documentos") {
      setActiveTab("reuniao")
    }
  }

  const handlePrevTab = () => {
    if (activeTab === "oportunidade") {
      setActiveTab("cliente")
    } else if (activeTab === "documentos") {
      setActiveTab("oportunidade")
    } else if (activeTab === "reuniao") {
      setActiveTab("documentos")
    }
  }

  const handleSubmit = () => {
    if (!validateForm()) {
      alert("Por favor, preencha todos os campos obrigatórios.")
      return
    }

    setIsSubmitting(true)

    // Criar objeto de oportunidade
    const novaOportunidade = {
      id: `opp-${Date.now()}`,
      titulo: formData.titulo || `Oportunidade - ${formData.nomeCliente}`,
      cliente: formData.nomeCliente,
      valor: formData.valor ? `R$ ${formData.valor}` : "A definir",
      responsavel: responsaveis.find((r) => r.selecionado)?.nome || "Não atribuído",
      prazo: dataReuniao ? format(dataReuniao, "dd/MM/yyyy", { locale: ptBR }) : formData.prazo || "Não definido",
      status: formData.status,
      // Dados adicionais
      descricao: formData.descricao,
      cnpj: formData.cnpj,
      contatoNome: formData.contatoNome,
      contatoTelefone: formData.contatoTelefone,
      contatoEmail: formData.contatoEmail,
      endereco: formData.endereco,
      segmento: formData.segmento,
      dataReuniao: dataReuniao ? format(dataReuniao, "dd/MM/yyyy", { locale: ptBR }) : "",
      horaReuniao: horaReuniao,
      responsaveisIds: responsaveis.filter((r) => r.selecionado).map((r) => r.id),
      criarEvento,
      enviarNotificacoes,
      tipo: formData.tipo,
      tipoFaturamento: formData.tipoFaturamento,
    }

    // Simular envio para API
    setTimeout(() => {
      setIsSubmitting(false)

      // Notificar componente pai
      if (onOportunidadeAdded) {
        onOportunidadeAdded(novaOportunidade)
      }

      // Criar evento no calendário (simulação)
      if (criarEvento && dataReuniao) {
        console.log(
          `Evento criado no calendário para ${format(dataReuniao, "dd/MM/yyyy", { locale: ptBR })} às ${horaReuniao}`,
        )
      }

      // Enviar notificações (simulação)
      if (enviarNotificacoes) {
        const responsaveisSelecionados = responsaveis.filter((r) => r.selecionado)
        console.log(
          `Notificações enviadas para ${responsaveisSelecionados.length} responsáveis e para o cliente ${formData.contatoEmail}`,
        )
      }

      // Resetar formulário
      setFormData({
        nomeCliente: "",
        cnpj: "",
        contatoNome: "",
        contatoTelefone: "",
        contatoEmail: "",
        endereco: "",
        segmento: "",
        titulo: "",
        descricao: "",
        valor: "",
        status: "novo_lead",
        prazo: "",
        tipo: "",
        tipoFaturamento: "",
      })
      setDataReuniao(undefined)
      setHoraReuniao("")
      setResponsaveis(responsaveis.map((resp) => ({ ...resp, selecionado: false })))
      setCriarEvento(true)
      setEnviarNotificacoes(true)
      setActiveTab("cliente")

      // Fechar o diálogo
      setOpen(false)
    }, 1500)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-[#1B3A53] hover:bg-[#2c5a80]">
          <Plus className="w-4 h-4 mr-2" />
          Nova Oportunidade
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cadastrar Nova Oportunidade</DialogTitle>
          <DialogDescription>Preencha os dados para cadastrar uma nova oportunidade comercial.</DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid grid-cols-4 mb-6">
            <TabsTrigger value="cliente">Dados do Cliente</TabsTrigger>
            <TabsTrigger value="oportunidade">Oportunidade</TabsTrigger>
            <TabsTrigger value="documentos">Documentos</TabsTrigger>
            <TabsTrigger value="reuniao">Agendamento</TabsTrigger>
          </TabsList>

          {/* Aba de Dados do Cliente */}
          <TabsContent value="cliente" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nomeCliente">
                  Nome/Razão Social <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="nomeCliente"
                  name="nomeCliente"
                  placeholder="Nome do cliente"
                  value={formData.nomeCliente}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cnpj">
                  CNPJ <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="cnpj"
                  name="cnpj"
                  placeholder="00.000.000/0000-00"
                  value={formData.cnpj}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contatoNome">
                  Contato (Nome) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="contatoNome"
                  name="contatoNome"
                  placeholder="Nome do contato"
                  value={formData.contatoNome}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contatoTelefone">
                  Contato (Telefone) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="contatoTelefone"
                  name="contatoTelefone"
                  placeholder="(00) 00000-0000"
                  value={formData.contatoTelefone}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contatoEmail">
                  Contato (E-mail) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="contatoEmail"
                  name="contatoEmail"
                  type="email"
                  placeholder="email@exemplo.com"
                  value={formData.contatoEmail}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="endereco">Endereço</Label>
              <Input
                id="endereco"
                name="endereco"
                placeholder="Endereço completo"
                value={formData.endereco}
                onChange={handleInputChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="segmento">
                Segmento <span className="text-red-500">*</span>
              </Label>
              <Select value={formData.segmento} onValueChange={(value) => handleSelectChange("segmento", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o segmento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="governo_federal">Governo Federal</SelectItem>
                  <SelectItem value="governo_estadual">Governo Estadual</SelectItem>
                  <SelectItem value="prefeitura">Prefeitura Municipal</SelectItem>
                  <SelectItem value="empresa_publica">Empresa Pública</SelectItem>
                  <SelectItem value="autarquia">Autarquia</SelectItem>
                  <SelectItem value="empresa_privada">Empresa Privada</SelectItem>
                  <SelectItem value="ong">ONG / Terceiro Setor</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end mt-4">
              <Button onClick={handleNextTab} className="bg-[#1B3A53] hover:bg-[#2c5a80]">
                Próximo
              </Button>
            </div>
          </TabsContent>

          {/* Aba de Oportunidade */}
          <TabsContent value="oportunidade" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="titulo">
                Título da Oportunidade <span className="text-red-500">*</span>
              </Label>
              <Input
                id="titulo"
                name="titulo"
                placeholder="Ex: Implementação de Sistema ERP"
                value={formData.titulo}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição da Oportunidade</Label>
              <Textarea
                id="descricao"
                name="descricao"
                placeholder="Descreva os detalhes da oportunidade"
                className="min-h-[100px]"
                value={formData.descricao}
                onChange={handleInputChange}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="valor">Valor da Oportunidade (R$)</Label>
                <Input
                  id="valor"
                  name="valor"
                  placeholder="Ex: 250000,00"
                  value={formData.valor}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="prazo">Prazo Estimado</Label>
                <Input
                  id="prazo"
                  name="prazo"
                  placeholder="Ex: 30 dias"
                  value={formData.prazo}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">
                Status Inicial <span className="text-red-500">*</span>
              </Label>
              <Select value={formData.status} onValueChange={(value) => handleSelectChange("status", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="novo_lead">Novo Lead</SelectItem>
                  <SelectItem value="agendamento_reuniao">Agendamento de Reunião</SelectItem>
                  <SelectItem value="levantamento_oportunidades">Levantamento de Oportunidades</SelectItem>
                  <SelectItem value="proposta_enviada">Proposta Enviada</SelectItem>
                  <SelectItem value="negociacao">Em Negociação</SelectItem>
                  <SelectItem value="ganho">Ganho</SelectItem>
                  <SelectItem value="perdido">Perdido</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipo">
                Tipo de Oportunidade <span className="text-red-500">*</span>
              </Label>
              <Select value={formData.tipo} onValueChange={(value) => handleSelectChange("tipo", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="produto">Produto</SelectItem>
                  <SelectItem value="servico">Serviço</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.tipo === "produto" && (
              <div className="space-y-2">
                <Label htmlFor="tipoFaturamento">
                  Tipo de Faturamento <span className="text-red-500">*</span>
                </Label>
                <Select 
                  value={formData.tipoFaturamento} 
                  onValueChange={(value) => handleSelectChange("tipoFaturamento", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo de faturamento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="direto">Faturamento Direto</SelectItem>
                    <SelectItem value="distribuidor">Via Distribuidor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="flex justify-between mt-4">
              <Button variant="outline" onClick={handlePrevTab}>
                Voltar
              </Button>
              <Button onClick={handleNextTab} className="bg-[#1B3A53] hover:bg-[#2c5a80]">
                Próximo
              </Button>
            </div>
          </TabsContent>

          {/* Nova aba de Documentos */}
          <TabsContent value="documentos" className="space-y-4">
            <div className="space-y-4">
              {/* Documentos necessários (checklist) */}
              <div className="space-y-2">
                <Label className="text-base font-medium">Checklist de Documentos Necessários</Label>
                <div className="grid grid-cols-2 gap-3 border rounded-md p-3">
                  {documentosNecessarios.map((doc) => (
                    <div key={doc.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={doc.id}
                        checked={doc.selecionado}
                        onCheckedChange={(checked) => handleDocumentoChange(doc.id, checked as boolean)}
                      />
                      <Label htmlFor={doc.id} className="font-normal">
                        {doc.nome}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Seletor de documentos do repositório com tag "comercial" */}
              <SeletorDocumentosComercial 
                onDocumentosSelecionados={(docs) => setDocumentosRepositorio(docs)}
              />

              {/* Upload de arquivos */}
              <div className="space-y-2 mt-6">
                <Label className="text-base font-medium">Anexar Documentos</Label>
                <div className="border rounded-md p-3">
                  <div className="flex items-center">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mr-2" 
                      type="button"
                      onClick={handleEscolherArquivos}
                    >
                      Escolher arquivos
                    </Button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      className="hidden"
                      multiple
                    />
                    <span className="text-sm text-muted-foreground">
                      {arquivosAnexados.length ? `${arquivosAnexados.length} arquivo(s) selecionado(s)` : "Nenhum arquivo escolhido"}
                    </span>
                  </div>
                  {arquivosAnexados.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {arquivosAnexados.map((arquivo, index) => (
                        <div key={index} className="flex items-center text-sm">
                          <FileText className="h-3 w-3 mr-1" />
                          <span className="truncate max-w-[200px]">{arquivo.name}</span>
                          <span className="text-xs text-muted-foreground ml-1">
                            ({Math.round(arquivo.size / 1024)} KB)
                          </span>
                          <Button
                            variant="ghost" 
                            size="sm" 
                            className="h-5 w-5 p-0 ml-1"
                            onClick={() => handleRemoverArquivo(index)}
                          >
                            ×
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    Os documentos serão anexados após criar a oportunidade
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-between mt-4">
              <Button variant="outline" onClick={handlePrevTab}>
                Voltar
              </Button>
              <Button onClick={handleNextTab} className="bg-[#1B3A53] hover:bg-[#2c5a80]">
                Próximo
              </Button>
            </div>
          </TabsContent>

          {/* Aba de Agendamento */}
          <TabsContent value="reuniao" className="space-y-4">
            <div className="border rounded-md p-4 space-y-4">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-blue-500" />
                <h3 className="font-medium">Agendamento de Reunião</h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dataReuniao">Data da Reunião</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !dataReuniao && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dataReuniao ? format(dataReuniao, "PPP", { locale: ptBR }) : "Selecione uma data"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={dataReuniao} onSelect={setDataReuniao} initialFocus />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="horaReuniao">Horário</Label>
                  <Input
                    id="horaReuniao"
                    type="time"
                    value={horaReuniao}
                    onChange={(e) => setHoraReuniao(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>
                Usuários Responsáveis <span className="text-red-500">*</span>
              </Label>
              <div className="grid grid-cols-2 gap-2 border rounded-md p-3">
                {responsaveis.map((resp) => (
                  <div key={resp.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={resp.id}
                      checked={resp.selecionado}
                      onCheckedChange={(checked) => handleResponsavelChange(resp.id, checked as boolean)}
                    />
                    <Label htmlFor={resp.id} className="font-normal">
                      {resp.nome}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="border rounded-md p-4 space-y-4">
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-blue-500" />
                <h3 className="font-medium">Notificações e Calendário</h3>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="criarEvento"
                    checked={criarEvento}
                    onCheckedChange={(checked) => setCriarEvento(checked as boolean)}
                  />
                  <Label htmlFor="criarEvento" className="font-normal">
                    Criar evento no calendário do Outlook e enviar convites
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="enviarNotificacoes"
                    checked={enviarNotificacoes}
                    onCheckedChange={(checked) => setEnviarNotificacoes(checked as boolean)}
                  />
                  <Label htmlFor="enviarNotificacoes" className="font-normal">
                    Enviar notificações por e-mail para os responsáveis e cliente
                  </Label>
                </div>
              </div>
            </div>

            <div className="flex justify-between mt-4">
              <Button variant="outline" onClick={handlePrevTab}>
                Voltar
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting} className="bg-[#1B3A53] hover:bg-[#2c5a80]">
                {isSubmitting ? (
                  <>
                    <Save className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Salvar Oportunidade
                  </>
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        <div className="text-sm text-muted-foreground mt-4">
          <span className="text-red-500">*</span> Campos obrigatórios
        </div>
      </DialogContent>
    </Dialog>
  )
}
